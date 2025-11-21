-- ROSCA Manager - Complete Supabase Tables SQL Script
-- Database: PostgreSQL
-- Purpose: Create all tables for the investment group management application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- Purpose: Store user account information
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- TABLE: groups
-- Purpose: Store investment group/club information
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Club settings (denormalized for easier querying)
  club_name VARCHAR(255) NOT NULL,
  contribution_amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  current_period INTEGER NOT NULL DEFAULT 1,
  total_periods INTEGER NOT NULL DEFAULT 0,
  number_of_cycles INTEGER NOT NULL DEFAULT 1,
  periods_per_cycle INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_date ON groups(created_date);

-- ============================================================================
-- TABLE: group_memberships
-- Purpose: Track user membership in groups and their roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one membership per user per group
  UNIQUE(group_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);

-- ============================================================================
-- TABLE: members
-- Purpose: Store group member details (may differ from users table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  has_received BOOLEAN DEFAULT FALSE,
  missed_payments INTEGER DEFAULT 0,
  scheduled_period INTEGER NOT NULL,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

-- ============================================================================
-- TABLE: payments
-- Purpose: Record payment transactions for group members
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  period INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- ============================================================================
-- TABLE: periods
-- Purpose: Track payment periods and rotation recipients
-- ============================================================================
CREATE TABLE IF NOT EXISTS periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  recipient_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_collected DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'upcoming')) DEFAULT 'upcoming',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique period per group
  UNIQUE(group_id, number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_periods_group_id ON periods(group_id);
CREATE INDEX IF NOT EXISTS idx_periods_status ON periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_start_date ON periods(start_date);

-- ============================================================================
-- TABLE: join_requests
-- Purpose: Track pending join requests from users wanting to join groups
-- ============================================================================
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate pending requests
  UNIQUE(group_id, user_id, status) WHERE status = 'pending'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_join_requests_group_id ON join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_created_at ON join_requests(created_at);

-- ============================================================================
-- VIEWS (Optional, for common queries)
-- ============================================================================

-- View: Group members with full details
CREATE OR REPLACE VIEW group_members_view AS
SELECT 
  g.id AS group_id,
  g.name AS group_name,
  gm.user_id,
  u.name AS user_name,
  u.email AS user_email,
  gm.role,
  gm.joined_date
FROM groups g
JOIN group_memberships gm ON g.id = gm.group_id
JOIN users u ON gm.user_id = u.id;

-- View: Group with member count
CREATE OR REPLACE VIEW group_statistics AS
SELECT 
  g.id,
  g.name,
  g.created_by,
  COUNT(DISTINCT gm.user_id) AS member_count,
  COUNT(DISTINCT CASE WHEN p.amount IS NOT NULL THEN p.id END) AS total_payments,
  COALESCE(SUM(p.amount), 0) AS total_amount_collected
FROM groups g
LEFT JOIN group_memberships gm ON g.id = gm.group_id
LEFT JOIN members m ON g.id = m.group_id
LEFT JOIN payments p ON m.id = p.member_id
GROUP BY g.id, g.name, g.created_by;

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: users table
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id::text);

-- ============================================================================
-- RLS POLICIES: groups table
-- ============================================================================

-- Allow group members to read group details
CREATE POLICY "Group members can read group"
ON groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM group_memberships 
    WHERE user_id = auth.uid()::uuid
  )
);

-- Allow group creator to create groups
CREATE POLICY "Users can create groups"
ON groups FOR INSERT
WITH CHECK (created_by = auth.uid()::uuid);

-- Allow group admins to update group
CREATE POLICY "Group admins can update group"
ON groups FOR UPDATE
USING (
  id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: group_memberships table
-- ============================================================================

-- Allow group members to see memberships of their groups
CREATE POLICY "Group members can read memberships"
ON group_memberships FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid
  )
);

-- Allow group admins to manage memberships
CREATE POLICY "Group admins can manage memberships"
ON group_memberships FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: members table
-- ============================================================================

-- Allow group members to read members
CREATE POLICY "Group members can read members"
ON members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid
  )
);

-- Allow group admins to manage members
CREATE POLICY "Group admins can manage members"
ON members FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

CREATE POLICY "Group admins can update members"
ON members FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: payments table
-- ============================================================================

-- Allow group members to read payments
CREATE POLICY "Group members can read payments"
ON payments FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid
  )
);

-- Allow group admins to create payments
CREATE POLICY "Group admins can create payments"
ON payments FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: periods table
-- ============================================================================

-- Allow group members to read periods
CREATE POLICY "Group members can read periods"
ON periods FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid
  )
);

-- Allow group admins to manage periods
CREATE POLICY "Group admins can manage periods"
ON periods FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

CREATE POLICY "Group admins can update periods"
ON periods FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: join_requests table
-- ============================================================================

-- Allow users to read their own join requests
CREATE POLICY "Users can read own join requests"
ON join_requests FOR SELECT
USING (user_id = auth.uid()::uuid);

-- Allow group admins to read join requests for their groups
CREATE POLICY "Group admins can read join requests"
ON join_requests FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- Allow users to create join requests
CREATE POLICY "Users can create join requests"
ON join_requests FOR INSERT
WITH CHECK (user_id = auth.uid()::uuid);

-- Allow group admins to update join request status
CREATE POLICY "Group admins can update join requests"
ON join_requests FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM group_memberships
    WHERE user_id = auth.uid()::uuid AND role = 'admin'
  )
);

-- ============================================================================
-- SAMPLE DATA (Optional - Comment out in production)
-- ============================================================================

-- INSERT INTO users (id, name, email) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john@example.com'),
-- ('550e8400-e29b-41d4-a716-446655440001', 'Jane Smith', 'jane@example.com'),
-- ('550e8400-e29b-41d4-a716-446655440002', 'Bob Johnson', 'bob@example.com');

-- INSERT INTO groups (name, description, created_by, club_name, contribution_amount, frequency, start_date) VALUES
-- ('Tech Workers Group', 'Investment group for tech employees', '550e8400-e29b-41d4-a716-446655440000', 'Tech Club', 500.00, 'monthly', CURRENT_TIMESTAMP);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. RLS policies assume your Supabase project has authentication enabled
-- 2. The auth.uid() function returns the authenticated user's UUID
-- 3. Uncomment sample data section to populate test data
-- 4. Adjust constraints and indexes based on your usage patterns
-- 5. Add more indexes if you notice slow queries
-- 6. Consider adding audit triggers for compliance/logging
-- 7. Test RLS policies thoroughly before deploying to production

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
