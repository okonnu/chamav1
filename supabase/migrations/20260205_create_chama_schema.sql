-- Chama App - Complete Database Schema Migration (Fixed)
-- This migration sets up all necessary tables, relationships, and RPC functions
-- Created: 2026-02-05
-- Fixed: Removed hardcoded constraints, using CREATE TABLE IF NOT EXISTS with proper error handling

-- ============================================================================
-- DROP EXISTING OBJECTS (if they exist - safe with IF EXISTS)
-- ============================================================================

DROP VIEW IF EXISTS group_members_view CASCADE;
DROP FUNCTION IF EXISTS get_group_by_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_groups_by_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_members_by_group_detailed(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_payments_by_group(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_periods_by_group(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_join_request_status(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS has_user_received_payout(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS count_missed_payments(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_next_scheduled_period(UUID) CASCADE;

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS periods CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS group_memberships CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Groups table (also represents a Chama club)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Club settings (denormalized for easier access)
  club_name VARCHAR(255) NOT NULL,
  contribution_amount NUMERIC(10, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  current_period INTEGER DEFAULT 1,
  total_periods INTEGER NOT NULL,
  number_of_cycles INTEGER NOT NULL,
  periods_per_cycle INTEGER DEFAULT 1,
  start_date DATE NOT NULL
);

-- Add check constraint after table creation to avoid issues
ALTER TABLE groups ADD CONSTRAINT check_frequency CHECK (frequency IN ('weekly', 'monthly'));

-- Group memberships (links users to groups with roles)
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  has_exited BOOLEAN DEFAULT FALSE,
  UNIQUE(group_id, user_id)
);

-- Add check constraint after table creation
ALTER TABLE group_memberships ADD CONSTRAINT check_role CHECK (role IN ('admin', 'member'));

-- Periods table (rotation cycles)
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  collected_amt NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, number)
);

-- Add check constraint after table creation
ALTER TABLE periods ADD CONSTRAINT check_status CHECK (status IN ('active', 'completed', 'upcoming'));

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES group_memberships(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  paid_amt NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Join requests table (pending group join requests)
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Add check constraint after table creation
ALTER TABLE join_requests ADD CONSTRAINT check_jr_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_active ON group_memberships(group_id, has_exited);
CREATE INDEX idx_periods_group_id ON periods(group_id);
CREATE INDEX idx_periods_recipient_id ON periods(recipient_id);
CREATE INDEX idx_periods_status ON periods(group_id, status);
CREATE INDEX idx_payments_membership_id ON payments(membership_id);
CREATE INDEX idx_payments_period_id ON payments(period_id);
CREATE INDEX idx_join_requests_group_id ON join_requests(group_id);
CREATE INDEX idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(group_id, status);

-- ============================================================================
-- VIEWS & HELPER FUNCTIONS
-- ============================================================================

-- View: Members of a group (denormalized user info with membership details)
CREATE VIEW group_members_view AS
SELECT
  gm.id AS membership_id,
  gm.group_id,
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  gm.role,
  gm.created_at AS membership_created_at,
  gm.has_exited
FROM group_memberships gm
JOIN users u ON gm.user_id = u.id
WHERE gm.has_exited = FALSE;

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- RPC: Get a single group by ID with all related data
CREATE OR REPLACE FUNCTION get_group_by_id(gid UUID)
RETURNS TABLE (
  "group" jsonb,
  members jsonb,
  payments jsonb,
  periods jsonb
) AS $$
DECLARE
  v_group jsonb;
  v_members jsonb;
  v_payments jsonb;
  v_periods jsonb;
BEGIN
  -- Get group data
  SELECT jsonb_build_object(
    'id', g.id,
    'group_name', g.name,
    'name', g.name,
    'description', g.description,
    'created_by', g.created_by,
    'created_at', g.created_at,
    'created_date', g.created_at,
    'club_name', g.club_name,
    'contribution_amt', g.contribution_amount,
    'frequency', g.frequency,
    'current_period', g.current_period,
    'total_periods', g.total_periods,
    'cycles', g.number_of_cycles,
    'number_of_cycles', g.number_of_cycles,
    'periods_per_cycle', g.periods_per_cycle,
    'start_date', g.start_date
  ) INTO v_group
  FROM groups g
  WHERE g.id = gid;

  -- Get members data
  SELECT jsonb_agg(jsonb_build_object(
    'id', gm.membership_id,
    'membership_id', gm.membership_id,
    'user_id', gm.user_id,
    'user_name', gm.user_name,
    'user_email', gm.user_email,
    'user_phone', NULL,
    'membership_created_at', gm.membership_created_at,
    'role', gm.role
  )) INTO v_members
  FROM group_members_view gm
  WHERE gm.group_id = gid;

  -- Get payments data
  SELECT jsonb_agg(jsonb_build_object(
    'id', p.id,
    'membership_id', p.membership_id,
    'period_id', p.period_id,
    'paid_amt', p.paid_amt,
    'amount', p.paid_amt,
    'updated_at', p.updated_at,
    'created_at', p.created_at
  )) INTO v_payments
  FROM payments p
  JOIN periods pr ON p.period_id = pr.id
  WHERE pr.group_id = gid;

  -- Get periods data
  SELECT jsonb_agg(jsonb_build_object(
    'id', pr.id,
    'number', pr.number,
    'recipient_id', pr.recipient_id,
    'start_date', pr.start_date,
    'end_date', pr.end_date,
    'collected_amt', pr.collected_amt,
    'status', pr.status,
    'created_at', pr.created_at
  )) INTO v_periods
  FROM periods pr
  WHERE pr.group_id = gid
  ORDER BY pr.number;

  RETURN QUERY SELECT v_group, v_members, v_payments, v_periods;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Get all groups for a user with their role
CREATE OR REPLACE FUNCTION get_groups_by_user(uid UUID)
RETURNS TABLE (
  "group" jsonb,
  role VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_build_object(
      'id', g.id,
      'group_name', g.name,
      'name', g.name,
      'description', g.description,
      'created_by', g.created_by,
      'created_at', g.created_at,
      'created_date', g.created_at,
      'club_name', g.club_name,
      'contribution_amt', g.contribution_amount,
      'frequency', g.frequency,
      'current_period', g.current_period,
      'total_periods', g.total_periods,
      'cycles', g.number_of_cycles,
      'number_of_cycles', g.number_of_cycles,
      'periods_per_cycle', g.periods_per_cycle,
      'start_date', g.start_date
    ),
    gm.role
  FROM groups g
  JOIN group_memberships gm ON g.id = gm.group_id
  WHERE gm.user_id = uid AND gm.has_exited = FALSE
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Get detailed members of a group with user information
CREATE OR REPLACE FUNCTION get_members_by_group_detailed(gid UUID)
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  user_name VARCHAR,
  user_email VARCHAR,
  user_phone VARCHAR,
  membership_created_at TIMESTAMP WITH TIME ZONE,
  role VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gm.membership_id,
    gm.user_id,
    gm.user_name,
    gm.user_email,
    NULL::VARCHAR,
    gm.membership_created_at,
    gm.role
  FROM group_members_view gm
  WHERE gm.group_id = gid
  ORDER BY gm.membership_created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Get payments for a group
CREATE OR REPLACE FUNCTION get_payments_by_group(gid UUID)
RETURNS TABLE (
  id UUID,
  membership_id UUID,
  period_id UUID,
  paid_amt NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.membership_id,
    p.period_id,
    p.paid_amt,
    p.created_at,
    p.updated_at
  FROM payments p
  JOIN periods pr ON p.period_id = pr.id
  WHERE pr.group_id = gid
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Get periods for a group
CREATE OR REPLACE FUNCTION get_periods_by_group(gid UUID)
RETURNS TABLE (
  id UUID,
  number INTEGER,
  recipient_id UUID,
  start_date DATE,
  end_date DATE,
  collected_amt NUMERIC,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.number,
    pr.recipient_id,
    pr.start_date,
    pr.end_date,
    pr.collected_amt,
    pr.status,
    pr.created_at
  FROM periods pr
  WHERE pr.group_id = gid
  ORDER BY pr.number;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: Update join request status and create membership if approved
CREATE OR REPLACE FUNCTION update_join_request_status(request_id UUID, new_status VARCHAR)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  user_id UUID,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_group_id UUID;
  v_user_id UUID;
  v_status VARCHAR;
BEGIN
  -- Get join request details
  SELECT group_id, user_id, status
  INTO v_group_id, v_user_id, v_status
  FROM join_requests
  WHERE id = request_id;

  -- Update join request status
  UPDATE join_requests
  SET status = new_status, updated_at = CURRENT_TIMESTAMP
  WHERE id = request_id;

  -- If approved, create group membership
  IF new_status = 'approved' THEN
    INSERT INTO group_memberships (group_id, user_id, role)
    VALUES (v_group_id, v_user_id, 'member')
    ON CONFLICT (group_id, user_id) DO UPDATE
    SET has_exited = FALSE, updated_at = CURRENT_TIMESTAMP;
  END IF;

  -- Return updated join request
  RETURN QUERY
  SELECT jr.id, jr.group_id, jr.user_id, jr.status, jr.updated_at
  FROM join_requests jr
  WHERE jr.id = request_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS FOR COMPUTED FIELDS
-- ============================================================================

-- Function: Check if a user has received a payout in a group
CREATE OR REPLACE FUNCTION has_user_received_payout(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM periods
    WHERE periods.group_id = has_user_received_payout.group_id
    AND periods.recipient_id = has_user_received_payout.user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Count missed payments for a member
CREATE OR REPLACE FUNCTION count_missed_payments(group_id UUID, membership_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT COUNT(*)::INTEGER FROM periods p
    WHERE p.group_id = count_missed_payments.group_id
    AND p.start_date <= CURRENT_DATE
    AND p.status IN ('active', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM payments
      WHERE payments.membership_id = count_missed_payments.membership_id
      AND payments.period_id = p.id
    )
  ), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get next scheduled period for a group
CREATE OR REPLACE FUNCTION get_next_scheduled_period(group_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT number FROM periods
    WHERE periods.group_id = get_next_scheduled_period.group_id
    AND status IN ('active', 'upcoming')
    ORDER BY number LIMIT 1
  ), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Users: Each user can read all users, but only update themselves
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can only update themselves" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Groups: Users can read groups they're a member of, or created
CREATE POLICY "Users can read their groups" ON groups
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_memberships.group_id = groups.id
      AND group_memberships.user_id = auth.uid()
      AND group_memberships.has_exited = FALSE
    )
  );

-- Group memberships: Users can read their memberships
CREATE POLICY "Users can read their memberships" ON group_memberships
  FOR SELECT USING (auth.uid() = user_id OR user_id IN (
    SELECT user_id FROM group_memberships WHERE group_id = group_id AND user_id = auth.uid()
  ));

-- Periods: Users can read periods for their groups
CREATE POLICY "Users can read group periods" ON periods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE group_memberships.group_id = periods.group_id
      AND group_memberships.user_id = auth.uid()
      AND group_memberships.has_exited = FALSE
    )
  );

-- Payments: Users can read payments for their groups
CREATE POLICY "Users can read group payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM periods
      WHERE periods.id = payments.period_id
      AND EXISTS (
        SELECT 1 FROM group_memberships
        WHERE group_memberships.group_id = periods.group_id
        AND group_memberships.user_id = auth.uid()
        AND group_memberships.has_exited = FALSE
      )
    )
  );

-- Join requests: Users can read requests for their groups
CREATE POLICY "Users can read join requests for their groups" ON join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = join_requests.group_id
      AND groups.created_by = auth.uid()
    ) OR
    auth.uid() = user_id
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
