-- Cleanup Script: Drop all existing tables, views, and functions
-- Run this in Supabase SQL Editor before retrying `supabase db push`

-- Drop views first (dependencies)
DROP VIEW IF EXISTS group_members_view CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_group_by_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_groups_by_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_members_by_group_detailed(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_payments_by_group(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_periods_by_group(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_join_request_status(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS has_user_received_payout(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS count_missed_payments(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_next_scheduled_period(UUID) CASCADE;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS periods CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS group_memberships CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify cleanup
SELECT 'Cleanup complete. Tables and functions removed.' AS status;
