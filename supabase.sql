-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE membership_role AS ENUM ('admin', 'member');
CREATE TYPE join_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: groups
-- ============================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    description TEXT,
    contribution_amt NUMERIC(12,2) NOT NULL,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    cycles INT,
    rosca_started BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX groups_created_by_idx ON groups(created_by);

-- ============================================
-- TABLE: membership
-- ============================================
CREATE TABLE membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'member',
    has_exited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, group_id)
);

CREATE INDEX membership_user_idx ON membership(user_id);
CREATE INDEX membership_group_idx ON membership(group_id);

-- ============================================
-- TABLE: periods
-- ============================================
CREATE TABLE periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    expected_amt NUMERIC(12,2) NOT NULL,
    collected_amt NUMERIC(12,2) DEFAULT 0,
    recipient_id UUID REFERENCES membership(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX periods_group_idx ON periods(group_id);
CREATE INDEX periods_recipient_idx ON periods(recipient_id);

-- ============================================
-- TABLE: payments
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES membership(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    expected_amt NUMERIC(12,2) NOT NULL,
    paid_amt NUMERIC(12,2) DEFAULT 0,
    deadline DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (membership_id, period_id)
);

CREATE INDEX payments_membership_idx ON payments(membership_id);
CREATE INDEX payments_period_idx ON payments(period_id);

-- ============================================
-- TABLE: join_requests
-- ============================================
CREATE TABLE join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status join_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, group_id)
);

CREATE INDEX join_requests_user_idx ON join_requests(user_id);
CREATE INDEX join_requests_group_idx ON join_requests(group_id);

-- ============================================
-- TRIGGER FUNCTION: Generate periods & payments
-- ============================================
CREATE OR REPLACE FUNCTION start_rosca_generate_periods()
RETURNS TRIGGER AS $$
DECLARE
  member_order UUID[];
  member_count INT;
  grp RECORD;
  p_id UUID;
  i INT;
BEGIN
  IF NEW.rosca_started = TRUE AND OLD.rosca_started = FALSE THEN
    SELECT * INTO grp FROM groups WHERE id = NEW.id;

    SELECT array_agg(id ORDER BY created_at)
    INTO member_order
    FROM membership
    WHERE group_id = NEW.id AND has_exited = FALSE;

    member_count := array_length(member_order, 1);

    FOR i IN 1..member_count LOOP
      INSERT INTO periods (
        id, group_id, expected_amt, collected_amt,
        recipient_id, start_date, end_date, created_by
      )
      VALUES (
        gen_random_uuid(),
        NEW.id,
        grp.contribution_amt * member_count,
        0,
        member_order[i],
        grp.start_date + ((i-1) * INTERVAL '1 month'),
        grp.start_date + (i * INTERVAL '1 month'),
        grp.created_by
      )
      RETURNING id INTO p_id;

      INSERT INTO payments (id, membership_id, period_id, expected_amt, paid_amt, deadline)
      SELECT gen_random_uuid(),
             m.id,
             p_id,
             grp.contribution_amt,
             0,
             grp.start_date + ((i-1) * INTERVAL '1 month') + INTERVAL '7 days'
      FROM membership m
      WHERE m.group_id = NEW.id AND m.has_exited = FALSE;

    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Activate auto-generation
-- ============================================
CREATE TRIGGER trigger_start_rosca
AFTER UPDATE ON groups
FOR EACH ROW
WHEN (OLD.rosca_started IS FALSE AND NEW.rosca_started IS TRUE)
EXECUTE FUNCTION start_rosca_generate_periods();

-- ============================================
-- STORED PROCEDURE: Missed payments for a period
-- ============================================
CREATE OR REPLACE FUNCTION get_missed_payments(period_uuid UUID)
RETURNS TABLE (
  membership_id UUID,
  expected NUMERIC,
  paid NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT membership_id, expected_amt, paid_amt
  FROM payments
  WHERE period_id = period_uuid AND paid_amt < expected_amt;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: Total collected for a period
-- ============================================
CREATE OR REPLACE FUNCTION get_total_collected(period_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE total NUMERIC;
BEGIN
  SELECT SUM(paid_amt)
  INTO total
  FROM payments
  WHERE period_id = period_uuid;

  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: getGroupById (batched)
-- ============================================
CREATE OR REPLACE FUNCTION get_group_by_id(gid UUID)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'group', g,
    'members', (SELECT jsonb_agg(m.*) FROM membership m WHERE m.group_id = gid),
    'periods', (SELECT jsonb_agg(p.* ORDER BY p.start_date) FROM periods p WHERE p.group_id = gid),
    'payments', (
      SELECT jsonb_agg(pay.*)
      FROM payments pay
      WHERE pay.period_id IN (SELECT id FROM periods WHERE group_id = gid)
    )
  )
  INTO result
  FROM groups g
  WHERE g.id = gid;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: getGroupsByUserId
-- ============================================
CREATE OR REPLACE FUNCTION get_groups_by_user(uid UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'group', g,
        'role', m.role,
        'has_exited', m.has_exited
      )
    )
    FROM membership m
    JOIN groups g ON g.id = m.group_id
    WHERE m.user_id = uid
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: getMembersByGroupId
-- ============================================
CREATE OR REPLACE FUNCTION get_members_by_group(gid UUID)
RETURNS SETOF membership AS $$
BEGIN
  RETURN QUERY SELECT * FROM membership WHERE group_id = gid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: getPaymentsByGroupId
-- ============================================
CREATE OR REPLACE FUNCTION get_payments_by_group(gid UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(pay.*)
    FROM payments pay
    WHERE pay.period_id IN (SELECT id FROM periods WHERE group_id = gid)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: getPeriodsByGroupId
-- ============================================
CREATE OR REPLACE FUNCTION get_periods_by_group(gid UUID)
RETURNS SETOF periods AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM periods WHERE group_id = gid ORDER BY start_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: updateJoinRequestStatus
-- ============================================
CREATE OR REPLACE FUNCTION update_join_request_status(
  request_id UUID,
  new_status join_status
)
RETURNS VOID AS $$
DECLARE req RECORD;
BEGIN
  SELECT * INTO req FROM join_requests WHERE id = request_id;

  IF new_status = 'approved' THEN
    INSERT INTO membership (user_id, group_id, role)
    VALUES (req.user_id, req.group_id, 'member')
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE join_requests
  SET status = new_status, updated_at = NOW()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: getMembersByGroupId (detailed with user info)
-- ============================================
CREATE OR REPLACE FUNCTION get_members_by_group_detailed(gid UUID)
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  group_id UUID,
  role membership_role,
  has_exited BOOLEAN,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  membership_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    m.group_id,
    m.role,
    m.has_exited,
    u.name,
    u.email,
    u.phone,
    m.created_at
  FROM membership m
  JOIN users u ON u.id = m.user_id
  WHERE m.group_id = gid
  ORDER BY m.created_at;
END;
$$ LANGUAGE plpgsql;
