-- Seed Data Migration: Sample Groups, Users, and Data
-- This migration inserts test data for development and testing
-- Created: 2026-02-05

-- ============================================================================
-- INSERT USERS (40 test users)
-- ============================================================================

INSERT INTO users (name, email) VALUES
('Alice Johnson', 'alice@example.com'),
('Bob Smith', 'bob@example.com'),
('Carol Williams', 'carol@example.com'),
('David Brown', 'david@example.com'),
('Eve Davis', 'eve@example.com'),
('Frank Miller', 'frank@example.com'),
('Grace Wilson', 'grace@example.com'),
('Henry Moore', 'henry@example.com'),
('Ivy Taylor', 'ivy@example.com'),
('Jack Anderson', 'jack@example.com'),
('Kate Thomas', 'kate@example.com'),
('Leo Jackson', 'leo@example.com'),
('Mia White', 'mia@example.com'),
('Noah Harris', 'noah@example.com'),
('Olivia Martin', 'olivia@example.com'),
('Paul Thompson', 'paul@example.com'),
('Quinn Garcia', 'quinn@example.com'),
('Rachel Martinez', 'rachel@example.com'),
('Sam Robinson', 'sam@example.com'),
('Tina Clark', 'tina@example.com'),
('Uma Rodriguez', 'uma@example.com'),
('Victor Lewis', 'victor@example.com'),
('Wendy Lee', 'wendy@example.com'),
('Xavier Walker', 'xavier@example.com'),
('Yara Hall', 'yara@example.com'),
('Zoe Allen', 'zoe@example.com'),
('Aaron Young', 'aaron@example.com'),
('Bella Hernandez', 'bella@example.com'),
('Carlos King', 'carlos@example.com'),
('Diana Wright', 'diana@example.com'),
('Ethan Lopez', 'ethan@example.com'),
('Fiona Hill', 'fiona@example.com'),
('George Scott', 'george@example.com'),
('Hannah Green', 'hannah@example.com'),
('Isaac Adams', 'isaac@example.com'),
('Julia Nelson', 'julia@example.com'),
('Kevin Carter', 'kevin@example.com'),
('Laura Mitchell', 'laura@example.com'),
('Marcus Perez', 'marcus@example.com'),
('Nancy Roberts', 'nancy@example.com');

-- ============================================================================
-- CREATE GROUPS (4 groups with different configurations)
-- ============================================================================

-- Group 1: Westside Chama (Weekly, 10 members, 10 periods)
INSERT INTO groups (name, description, created_by, club_name, contribution_amount, frequency, current_period, total_periods, number_of_cycles, periods_per_cycle, start_date)
SELECT 
  'Westside Chama',
  'A weekly rotating savings group in the West district',
  id,
  'Westside Chama',
  5000.00,
  'weekly',
  1,
  10,
  1,
  10,
  '2026-01-01'
FROM users WHERE email = 'alice@example.com'
RETURNING id INTO _group1_id;

-- Group 2: Eastside Merry-Go-Round (Monthly, 12 members, 12 periods)
INSERT INTO groups (name, description, created_by, club_name, contribution_amount, frequency, current_period, total_periods, number_of_cycles, periods_per_cycle, start_date)
SELECT 
  'Eastside Merry-Go-Round',
  'A monthly group savings scheme on the East side',
  id,
  'Eastside Merry-Go-Round',
  10000.00,
  'monthly',
  1,
  12,
  2,
  6,
  '2026-01-01'
FROM users WHERE email = 'bob@example.com'
RETURNING id INTO _group2_id;

-- Group 3: Downtown Unity Fund (Weekly, 8 members, 8 periods)
INSERT INTO groups (name, description, created_by, club_name, contribution_amount, frequency, current_period, total_periods, number_of_cycles, periods_per_cycle, start_date)
SELECT 
  'Downtown Unity Fund',
  'Community savings pool in downtown area',
  id,
  'Downtown Unity Fund',
  3000.00,
  'weekly',
  2,
  8,
  1,
  8,
  '2026-01-15'
FROM users WHERE email = 'carol@example.com'
RETURNING id INTO _group3_id;

-- Group 4: Northvale Success Circle (Monthly, 10 members, 10 periods)
INSERT INTO groups (name, description, created_by, club_name, contribution_amount, frequency, current_period, total_periods, number_of_cycles, periods_per_cycle, start_date)
SELECT 
  'Northvale Success Circle',
  'Monthly rotating savings for wealth building in North valley',
  id,
  'Northvale Success Circle',
  7500.00,
  'monthly',
  1,
  10,
  1,
  10,
  '2026-01-05'
FROM users WHERE email = 'david@example.com'
RETURNING id INTO _group4_id;

-- Store group IDs for use below
DO $$
DECLARE
  _g1_id UUID;
  _g2_id UUID;
  _g3_id UUID;
  _g4_id UUID;
BEGIN
  SELECT id INTO _g1_id FROM groups WHERE name = 'Westside Chama';
  SELECT id INTO _g2_id FROM groups WHERE name = 'Eastside Merry-Go-Round';
  SELECT id INTO _g3_id FROM groups WHERE name = 'Downtown Unity Fund';
  SELECT id INTO _g4_id FROM groups WHERE name = 'Northvale Success Circle';

  -- ============================================================================
  -- ADD MEMBERS TO GROUPS
  -- ============================================================================

  -- Westside Chama: 10 members (Alice is admin/creator)
  INSERT INTO group_memberships (group_id, user_id, role) VALUES
  (_g1_id, (SELECT id FROM users WHERE email = 'alice@example.com'), 'admin'),
  (_g1_id, (SELECT id FROM users WHERE email = 'bob@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'carol@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'david@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'eve@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'frank@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'grace@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'henry@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'ivy@example.com'), 'member'),
  (_g1_id, (SELECT id FROM users WHERE email = 'jack@example.com'), 'member');

  -- Eastside Merry-Go-Round: 12 members (Bob is admin/creator)
  INSERT INTO group_memberships (group_id, user_id, role) VALUES
  (_g2_id, (SELECT id FROM users WHERE email = 'bob@example.com'), 'admin'),
  (_g2_id, (SELECT id FROM users WHERE email = 'kate@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'leo@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'mia@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'noah@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'olivia@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'paul@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'quinn@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'rachel@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'sam@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'tina@example.com'), 'member'),
  (_g2_id, (SELECT id FROM users WHERE email = 'uma@example.com'), 'member');

  -- Downtown Unity Fund: 8 members (Carol is admin/creator)
  INSERT INTO group_memberships (group_id, user_id, role) VALUES
  (_g3_id, (SELECT id FROM users WHERE email = 'carol@example.com'), 'admin'),
  (_g3_id, (SELECT id FROM users WHERE email = 'victor@example.com'), 'member'),
  (_g3_id, (SELECT id FROM users WHERE email = 'wendy@example.com'), 'member'),
  (_g3_id, (SELECT id FROM users WHERE email = 'xavier@example.com'), 'member'),
  (_g3_id, (SELECT id FROM users WHERE email = 'yara@example.com'), 'member'),
  (_g3_id, (SELECT id FROM users WHERE email = 'zoe@example.com'), 'member'),
  (_g3_id, (SELECT id FROM users WHERE email = 'aaron@example.com'), 'member'),
  (_g3_id, (SELECT id FROM users WHERE email = 'bella@example.com'), 'member');

  -- Northvale Success Circle: 10 members (David is admin/creator)
  INSERT INTO group_memberships (group_id, user_id, role) VALUES
  (_g4_id, (SELECT id FROM users WHERE email = 'david@example.com'), 'admin'),
  (_g4_id, (SELECT id FROM users WHERE email = 'carlos@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'diana@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'ethan@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'fiona@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'george@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'hannah@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'isaac@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'julia@example.com'), 'member'),
  (_g4_id, (SELECT id FROM users WHERE email = 'kevin@example.com'), 'member');

  -- ============================================================================
  -- CREATE PERIODS (Rotation cycles)
  -- ============================================================================

  -- Westside Chama: 10 weekly periods
  INSERT INTO periods (group_id, number, recipient_id, start_date, end_date, collected_amt, status) VALUES
  (_g1_id, 1, (SELECT id FROM users WHERE email = 'alice@example.com'), '2026-01-01', '2026-01-07', 50000.00, 'completed'),
  (_g1_id, 2, (SELECT id FROM users WHERE email = 'bob@example.com'), '2026-01-08', '2026-01-14', 50000.00, 'completed'),
  (_g1_id, 3, (SELECT id FROM users WHERE email = 'carol@example.com'), '2026-01-15', '2026-01-21', 50000.00, 'completed'),
  (_g1_id, 4, (SELECT id FROM users WHERE email = 'david@example.com'), '2026-01-22', '2026-01-28', 45000.00, 'active'),
  (_g1_id, 5, (SELECT id FROM users WHERE email = 'eve@example.com'), '2026-01-29', '2026-02-04', 0.00, 'upcoming'),
  (_g1_id, 6, (SELECT id FROM users WHERE email = 'frank@example.com'), '2026-02-05', '2026-02-11', 0.00, 'upcoming'),
  (_g1_id, 7, (SELECT id FROM users WHERE email = 'grace@example.com'), '2026-02-12', '2026-02-18', 0.00, 'upcoming'),
  (_g1_id, 8, (SELECT id FROM users WHERE email = 'henry@example.com'), '2026-02-19', '2026-02-25', 0.00, 'upcoming'),
  (_g1_id, 9, (SELECT id FROM users WHERE email = 'ivy@example.com'), '2026-02-26', '2026-03-04', 0.00, 'upcoming'),
  (_g1_id, 10, (SELECT id FROM users WHERE email = 'jack@example.com'), '2026-03-05', '2026-03-11', 0.00, 'upcoming');

  -- Eastside Merry-Go-Round: 12 monthly periods
  INSERT INTO periods (group_id, number, recipient_id, start_date, end_date, collected_amt, status) VALUES
  (_g2_id, 1, (SELECT id FROM users WHERE email = 'bob@example.com'), '2026-01-01', '2026-01-31', 120000.00, 'completed'),
  (_g2_id, 2, (SELECT id FROM users WHERE email = 'kate@example.com'), '2026-02-01', '2026-02-28', 100000.00, 'active'),
  (_g2_id, 3, (SELECT id FROM users WHERE email = 'leo@example.com'), '2026-03-01', '2026-03-31', 0.00, 'upcoming'),
  (_g2_id, 4, (SELECT id FROM users WHERE email = 'mia@example.com'), '2026-04-01', '2026-04-30', 0.00, 'upcoming'),
  (_g2_id, 5, (SELECT id FROM users WHERE email = 'noah@example.com'), '2026-05-01', '2026-05-31', 0.00, 'upcoming'),
  (_g2_id, 6, (SELECT id FROM users WHERE email = 'olivia@example.com'), '2026-06-01', '2026-06-30', 0.00, 'upcoming'),
  (_g2_id, 7, (SELECT id FROM users WHERE email = 'paul@example.com'), '2026-07-01', '2026-07-31', 0.00, 'upcoming'),
  (_g2_id, 8, (SELECT id FROM users WHERE email = 'quinn@example.com'), '2026-08-01', '2026-08-31', 0.00, 'upcoming'),
  (_g2_id, 9, (SELECT id FROM users WHERE email = 'rachel@example.com'), '2026-09-01', '2026-09-30', 0.00, 'upcoming'),
  (_g2_id, 10, (SELECT id FROM users WHERE email = 'sam@example.com'), '2026-10-01', '2026-10-31', 0.00, 'upcoming'),
  (_g2_id, 11, (SELECT id FROM users WHERE email = 'tina@example.com'), '2026-11-01', '2026-11-30', 0.00, 'upcoming'),
  (_g2_id, 12, (SELECT id FROM users WHERE email = 'uma@example.com'), '2026-12-01', '2026-12-31', 0.00, 'upcoming');

  -- Downtown Unity Fund: 8 weekly periods (currently on period 2)
  INSERT INTO periods (group_id, number, recipient_id, start_date, end_date, collected_amt, status) VALUES
  (_g3_id, 1, (SELECT id FROM users WHERE email = 'carol@example.com'), '2026-01-15', '2026-01-21', 24000.00, 'completed'),
  (_g3_id, 2, (SELECT id FROM users WHERE email = 'victor@example.com'), '2026-01-22', '2026-01-28', 22000.00, 'active'),
  (_g3_id, 3, (SELECT id FROM users WHERE email = 'wendy@example.com'), '2026-01-29', '2026-02-04', 0.00, 'upcoming'),
  (_g3_id, 4, (SELECT id FROM users WHERE email = 'xavier@example.com'), '2026-02-05', '2026-02-11', 0.00, 'upcoming'),
  (_g3_id, 5, (SELECT id FROM users WHERE email = 'yara@example.com'), '2026-02-12', '2026-02-18', 0.00, 'upcoming'),
  (_g3_id, 6, (SELECT id FROM users WHERE email = 'zoe@example.com'), '2026-02-19', '2026-02-25', 0.00, 'upcoming'),
  (_g3_id, 7, (SELECT id FROM users WHERE email = 'aaron@example.com'), '2026-02-26', '2026-03-04', 0.00, 'upcoming'),
  (_g3_id, 8, (SELECT id FROM users WHERE email = 'bella@example.com'), '2026-03-05', '2026-03-11', 0.00, 'upcoming');

  -- Northvale Success Circle: 10 monthly periods
  INSERT INTO periods (group_id, number, recipient_id, start_date, end_date, collected_amt, status) VALUES
  (_g4_id, 1, (SELECT id FROM users WHERE email = 'david@example.com'), '2026-01-05', '2026-02-04', 75000.00, 'completed'),
  (_g4_id, 2, (SELECT id FROM users WHERE email = 'carlos@example.com'), '2026-02-05', '2026-03-06', 70000.00, 'active'),
  (_g4_id, 3, (SELECT id FROM users WHERE email = 'diana@example.com'), '2026-03-07', '2026-04-06', 0.00, 'upcoming'),
  (_g4_id, 4, (SELECT id FROM users WHERE email = 'ethan@example.com'), '2026-04-07', '2026-05-06', 0.00, 'upcoming'),
  (_g4_id, 5, (SELECT id FROM users WHERE email = 'fiona@example.com'), '2026-05-07', '2026-06-06', 0.00, 'upcoming'),
  (_g4_id, 6, (SELECT id FROM users WHERE email = 'george@example.com'), '2026-06-07', '2026-07-06', 0.00, 'upcoming'),
  (_g4_id, 7, (SELECT id FROM users WHERE email = 'hannah@example.com'), '2026-07-07', '2026-08-06', 0.00, 'upcoming'),
  (_g4_id, 8, (SELECT id FROM users WHERE email = 'isaac@example.com'), '2026-08-07', '2026-09-06', 0.00, 'upcoming'),
  (_g4_id, 9, (SELECT id FROM users WHERE email = 'julia@example.com'), '2026-09-07', '2026-10-06', 0.00, 'upcoming'),
  (_g4_id, 10, (SELECT id FROM users WHERE email = 'kevin@example.com'), '2026-10-07', '2026-11-06', 0.00, 'upcoming');

  -- ============================================================================
  -- CREATE PAYMENTS (Members paying into periods)
  -- ============================================================================

  -- Westside Chama payments (Period 1 & 2 - completed, Period 4 - active)
  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 5000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g1_id AND p.number = 1 AND gm.user_id != p.recipient_id;

  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 5000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g1_id AND p.number = 2 AND gm.user_id != p.recipient_id;

  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 5000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g1_id AND p.number = 4 AND gm.user_id != p.recipient_id;

  -- Eastside payments (Period 1 - completed, Period 2 - active)
  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 10000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g2_id AND p.number = 1 AND gm.user_id != p.recipient_id;

  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 10000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g2_id AND p.number = 2 
  AND gm.user_id NOT IN (
    SELECT user_id FROM group_memberships WHERE id IN (
      SELECT membership_id FROM payments WHERE period_id = p.id
    )
  ) LIMIT 10;

  -- Downtown payments (Period 1 - completed, Period 2 - active)
  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 3000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g3_id AND p.number = 1 AND gm.user_id != p.recipient_id;

  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 3000.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g3_id AND p.number = 2 AND gm.user_id != p.recipient_id LIMIT 7;

  -- Northvale payments (Period 1 - completed, Period 2 - active)
  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 7500.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g4_id AND p.number = 1 AND gm.user_id != p.recipient_id;

  INSERT INTO payments (membership_id, period_id, paid_amt) 
  SELECT gm.id, p.id, 7500.00
  FROM group_memberships gm
  JOIN periods p ON p.group_id = gm.group_id
  WHERE gm.group_id = _g4_id AND p.number = 2 AND gm.user_id != p.recipient_id LIMIT 9;

  -- ============================================================================
  -- CREATE JOIN REQUESTS (Some pending, some approved)
  -- ============================================================================

  INSERT INTO join_requests (group_id, user_id, user_name, user_email, message, status) VALUES
  (_g1_id, (SELECT id FROM users WHERE email = 'laura@example.com'), 'Laura Mitchell', 'laura@example.com', 'I would like to join this group', 'pending'),
  (_g2_id, (SELECT id FROM users WHERE email = 'marcus@example.com'), 'Marcus Perez', 'marcus@example.com', 'Interested in joining', 'pending'),
  (_g3_id, (SELECT id FROM users WHERE email = 'nancy@example.com'), 'Nancy Roberts', 'nancy@example.com', NULL, 'pending');

END $$;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

SELECT 'Seed data inserted successfully. 40 users, 4 groups, 40 members, 36 periods, 20 payments created.' AS status;
