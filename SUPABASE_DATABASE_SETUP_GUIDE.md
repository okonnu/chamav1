# Supabase Database Setup Guide

## Overview

This guide walks you through setting up your Supabase database tables using the SQL script provided.

## Files

- `SUPABASE_SQL_SETUP.sql` - Complete SQL script with all tables, indexes, and Row-Level Security policies

## Prerequisites

✅ Supabase project created at https://app.supabase.com  
✅ Database connection available  
✅ Project credentials noted (URL, API keys)  

## Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **chamav1** (or your project name)
3. In the left sidebar, click **SQL Editor**
4. Click the **+ New Query** button

### Step 2: Open SQL Script

**Option A: Copy-Paste (Recommended for first time)**

1. Open `SUPABASE_SQL_SETUP.sql` file
2. Select all content: `Ctrl+A`
3. Copy: `Ctrl+C`
4. In Supabase SQL Editor, paste: `Ctrl+V`
5. Click the **▶ Run** button (top right)

**Option B: Save as Template**

1. Open `SUPABASE_SQL_SETUP.sql`
2. Copy all content
3. In Supabase SQL Editor, create new query
4. Paste content
5. Click **Save** button
6. Name it: `Initial Database Setup`
7. Click **Run** button

### Step 3: Execute the Script

1. **Review the script** for any comments or warnings
2. Click the blue **▶ Run** button
3. Wait for execution to complete (usually 5-30 seconds)
4. You should see: **✓ Success** message

### Step 4: Verify Tables Were Created

1. In Supabase, go to **Table Editor** (left sidebar)
2. You should see these tables listed:
   - ✅ `users`
   - ✅ `groups`
   - ✅ `group_memberships`
   - ✅ `members`
   - ✅ `payments`
   - ✅ `periods`
   - ✅ `join_requests`

3. Click each table to verify columns exist

### Step 5: Check Row-Level Security Policies

1. Go to **Authentication** → **Policies** (in left sidebar)
2. You should see RLS policies listed for each table
3. Verify policies exist:
   - ✅ Users policies
   - ✅ Groups policies
   - ✅ Memberships policies
   - ✅ Payments policies
   - ✅ Periods policies
   - ✅ Join requests policies

## Database Structure

### Tables Created

#### 1. **users**
Stores user accounts linked to Supabase Auth.

```
id (UUID) - Primary Key
name (VARCHAR) - User full name
email (VARCHAR) - User email (unique)
created_at (TIMESTAMP) - Account creation date
updated_at (TIMESTAMP) - Last update date
```

**Purpose:** Central user registry  
**Key Features:**
- Linked to Supabase authentication via `id`
- Unique email constraint
- Indexed for fast email lookups

---

#### 2. **groups**
Stores investment group/club information.

```
id (UUID) - Primary Key
name (VARCHAR) - Group name
description (TEXT) - Group description
created_by (UUID) - FK to users
created_date (TIMESTAMP) - Group creation date

Club settings (denormalized):
club_name, contribution_amount, frequency
current_period, total_periods
number_of_cycles, periods_per_cycle
start_date
```

**Purpose:** Central group registry  
**Key Features:**
- Links to group creator via `created_by`
- Includes all club configuration settings
- Indexed on creator and date

---

#### 3. **group_memberships**
Tracks users in groups and their roles.

```
id (UUID) - Primary Key
group_id (UUID) - FK to groups
user_id (UUID) - FK to users
role (VARCHAR) - 'admin' or 'member'
joined_date (TIMESTAMP) - When user joined
```

**Purpose:** Junction table for many-to-many relationship  
**Key Features:**
- One membership per user per group (UNIQUE constraint)
- Role-based access control
- Tracks membership date

---

#### 4. **members**
Stores group member details (may differ from users).

```
id (UUID) - Primary Key
group_id (UUID) - FK to groups
name (VARCHAR) - Member name
email (VARCHAR) - Member email
phone (VARCHAR) - Phone number
joined_date (TIMESTAMP) - When joined group
has_received (BOOLEAN) - Whether received payment
missed_payments (INTEGER) - Payment miss count
scheduled_period (INTEGER) - Their scheduled period
```

**Purpose:** Track member details per group  
**Key Features:**
- Separate from `users` table (member ≠ user account)
- Tracks payment history and status
- Period assignment tracking

---

#### 5. **payments**
Records payment transactions.

```
id (UUID) - Primary Key
group_id (UUID) - FK to groups
member_id (UUID) - FK to members
amount (DECIMAL) - Payment amount
date (TIMESTAMP) - Payment date
period (INTEGER) - Which period this payment is for
created_at (TIMESTAMP) - Record creation date
```

**Purpose:** Payment transaction log  
**Key Features:**
- Links to member and group
- Tracks period for each payment
- Indexed by group, member, and period

---

#### 6. **periods**
Tracks payment periods and rotation recipients.

```
id (UUID) - Primary Key
group_id (UUID) - FK to groups
number (INTEGER) - Period number (1, 2, 3...)
recipient_id (UUID) - FK to members (who receives payment)
start_date (TIMESTAMP) - Period start
end_date (TIMESTAMP) - Period end
total_collected (DECIMAL) - Amount collected so far
status (VARCHAR) - 'active', 'completed', or 'upcoming'
```

**Purpose:** Track rotation schedule and payment periods  
**Key Features:**
- Unique period per group (cannot have two "Period 1"s)
- Track period status
- Links to member receiving payments

---

#### 7. **join_requests**
Tracks pending join requests.

```
id (UUID) - Primary Key
group_id (UUID) - FK to groups
user_id (UUID) - FK to users
user_name (VARCHAR) - Requester name
user_email (VARCHAR) - Requester email
message (TEXT) - Join message
status (VARCHAR) - 'pending', 'approved', or 'rejected'
created_at (TIMESTAMP) - Request date
updated_at (TIMESTAMP) - Last update date
```

**Purpose:** Manage group membership requests  
**Key Features:**
- Prevents duplicate pending requests (UNIQUE constraint)
- Tracks request status
- Includes optional message from requester

---

## Indexes Created

Indexes optimize common queries:

```
users:
  - email (fast email lookups)

groups:
  - created_by (find groups by creator)
  - created_date (sort by date)

group_memberships:
  - group_id (find members in group)
  - user_id (find groups user is in)

members:
  - group_id (find members in group)
  - email (find member by email)

payments:
  - group_id (payments per group)
  - member_id (payments per member)
  - period (payments in period)
  - date (sort by date)

periods:
  - group_id (periods per group)
  - status (find active periods)
  - start_date (sort by date)

join_requests:
  - group_id (requests for group)
  - user_id (requests by user)
  - status (find pending)
  - created_at (sort by date)
```

## Row-Level Security (RLS)

RLS policies ensure users can only access data they're allowed to see.

### How RLS Works

1. **Authentication Check** - User must be logged in
2. **Policy Evaluation** - Supabase checks RLS policies
3. **Query Execution** - Only allowed rows are returned

### Key Policies

**users table:**
- Users can see only their own profile
- Users can only update their own profile

**groups table:**
- Members of a group can read the group details
- Creators can create new groups
- Admins can update their group

**members table:**
- Group members can see all members in their groups
- Admins can add/update members

**payments table:**
- Group members can see all payments in their groups
- Admins can record new payments

**periods table:**
- Group members can see all periods
- Admins can create/update periods

**join_requests table:**
- Users can see their own requests
- Group admins can see requests for their groups
- Users can create requests
- Admins can approve/reject

## Views Created

Two helpful views for common queries:

### 1. group_members_view
Shows all members in each group with details.

```sql
SELECT 
  group_id, group_name, user_id, 
  user_name, user_email, role, joined_date
FROM group_members_view
WHERE group_id = 'some-group-id'
```

### 2. group_statistics
Shows group statistics (member count, payment totals).

```sql
SELECT 
  id, name, member_count, 
  total_payments, total_amount_collected
FROM group_statistics
```

## Testing the Setup

### Test 1: Verify Tables Exist

```sql
-- In Supabase SQL Editor, run:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected output: 7 tables listed

### Test 2: Check RLS Policies

```sql
-- View all policies:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected: Multiple policies per table

### Test 3: Insert Test Data

```sql
-- Create a test user (requires auth)
-- In Supabase Auth, create a test user first
-- Then insert data for that user:

INSERT INTO users (id, name, email) VALUES 
  ('uuid-of-auth-user', 'Test User', 'test@example.com');

INSERT INTO groups (name, created_by, club_name, contribution_amount, frequency, start_date) 
VALUES 
  ('Test Group', 'uuid-of-auth-user', 'Test Club', 500, 'monthly', CURRENT_TIMESTAMP);
```

## Troubleshooting

### Error: "Extension uuid-ossp does not exist"

**Solution:** Supabase usually has this pre-enabled. If not, the CREATE EXTENSION IF NOT EXISTS handles it.

### Error: "Policies already exist"

**Solution:** This means the script was run before. You can:
- Drop and recreate: Run a DROP TABLE CASCADE script first
- Or run the setup script again (it will skip existing items)

### Error: "User not authenticated"

**Solution:** 
- Ensure you're logged into Supabase
- Authenticate through the app first before accessing data via RLS

### RLS Policies Not Working

**Solution:**
1. Verify policies are created (check Supabase Authentication → Policies)
2. Test with authenticated user (not anonymous)
3. Check `auth.uid()` returns correct user UUID
4. Review policy WHERE clauses

### Query Returns No Results

**Solution:**
1. Check if RLS policy is blocking (run as admin first)
2. Verify user has correct group membership
3. Check `group_memberships` table for role assignment
4. Test RLS by disabling temporarily

## Next Steps

After setup:

1. **Create Auth Users**
   - Supabase Auth tab → Add test users
   - Use email: test@example.com, password: Test@123

2. **Link Auth to Database**
   - Auth creates user with UUID
   - Insert matching row in `users` table
   - App does this automatically on signup

3. **Test Policies**
   - Log in with test user
   - Try queries - should respect RLS policies

4. **Connect App**
   - App already connects to these tables
   - Uses DAO pattern in `src/utils/dao/supabaseDAO.ts`
   - Queries work with RLS automatically

## Database Relationships

```
users (1) ──────────── (many) group_memberships ──────────── (1) groups
   │                                                             │
   │                                                             │
   (1)────────────────────────────────────────────────────────(many) members
                                                                  │
                                                                  │
                                                               (many) payments
                                                                  │
                                                          group_id, member_id
```

## Performance Considerations

### Current Indexes

All common queries are indexed. For 1,000+ member groups, consider adding:

```sql
-- For large payment reports
CREATE INDEX idx_payments_group_member ON payments(group_id, member_id);

-- For member search
CREATE INDEX idx_members_group_name ON members(group_id, name);

-- For period filtering
CREATE INDEX idx_periods_group_status ON periods(group_id, status);
```

### Query Optimization Tips

1. Use views for common queries
2. Index frequently searched columns
3. Denormalize when necessary (already done in `groups`)
4. Archive old data (payments older than 1 year)
5. Monitor slow queries in Supabase dashboard

## Backup & Recovery

### Backup

1. Go to Supabase Dashboard → Database → Backups
2. Click "Create Backup" button
3. Save backup file securely

### Restore

1. Go to Backups tab
2. Click "Restore" on desired backup
3. Confirm restoration

### Export Data

```sql
-- Export to CSV
COPY users TO '/tmp/users.csv' WITH (FORMAT csv, HEADER);
```

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ Policies restrict data access
- ✅ Users cannot access other users' profiles
- ✅ Group members cannot access other groups
- ✅ Admins have elevated permissions
- ✅ All sensitive data requires authentication
- ✅ No anonymous access to data

## Monitoring & Maintenance

### Check Table Sizes

```sql
SELECT 
  schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Find Slow Queries

In Supabase Dashboard:
1. Go to Database → Query Performance
2. Review slow queries
3. Add indexes if needed

### Cleanup Old Data

```sql
-- Archive payments older than 1 year
DELETE FROM payments 
WHERE date < NOW() - INTERVAL '1 year'
  AND status = 'completed';
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Indexing Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Setup Date:** November 13, 2025  
**Status:** Ready to Execute ✅
