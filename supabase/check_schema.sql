-- Diagnostic Script: Check existing schema
-- Run this in Supabase SQL Editor to see what columns exist

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'groups', 'group_memberships', 'periods', 'payments', 'join_requests')
ORDER BY table_name, ordinal_position;
