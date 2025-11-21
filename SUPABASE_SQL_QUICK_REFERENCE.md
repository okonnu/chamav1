# Supabase SQL Setup - Quick Reference

## TL;DR (30 seconds)

1. Open Supabase Dashboard
2. Go to SQL Editor → + New Query
3. Copy entire content from `SUPABASE_SQL_SETUP.sql`
4. Paste into SQL Editor
5. Click ▶ Run
6. ✅ Done! All tables created with security policies

## Files & Tables

| File                               | Purpose                        |
| ---------------------------------- | ------------------------------ |
| `SUPABASE_SQL_SETUP.sql`           | Complete SQL script (run this) |
| `SUPABASE_DATABASE_SETUP_GUIDE.md` | Detailed setup instructions    |
| `SUPABASE_SQL_QUICK_REFERENCE.md`  | This file                      |

## 7 Tables Created

```
users                  ← Stores user accounts
groups                 ← Investment groups/clubs
group_memberships      ← Who's in which group
members                ← Member details per group
payments               ← Payment transactions
periods                ← Payment rotation periods
join_requests          ← Pending join requests
```

## Table Relationships

```
users
  ├─ creates → groups (via created_by)
  ├─ joins → group_memberships
  └─ can request → join_requests

groups
  ├─ has many → group_memberships
  ├─ has many → members
  ├─ has many → payments
  └─ has many → periods

members
  ├─ receives → payments
  └─ receives → periods (as recipient)
```

## Column Reference

### users

```
id (UUID)           - Auto-generated
name (VARCHAR)      - User full name
email (VARCHAR)     - Unique email
created_at          - Account creation timestamp
```

### groups

```
id (UUID)                  - Auto-generated
name, description          - Group details
created_by (UUID)          - FK to users
club_name                  - Name of the club
contribution_amount        - Per-period contribution
frequency                  - weekly|monthly|quarterly
current_period (INT)       - Current period number
total_periods (INT)        - Total periods in cycle
number_of_cycles           - How many cycles total
periods_per_cycle          - Periods in each cycle
start_date                 - Group start date
```

### group_memberships

```
id (UUID)                  - Auto-generated
group_id (UUID)            - FK to groups
user_id (UUID)             - FK to users
role                       - admin|member
joined_date                - When user joined
```

### members

```
id (UUID)                  - Auto-generated
group_id (UUID)            - FK to groups
name, email, phone         - Contact info
joined_date                - When joined
has_received (BOOLEAN)     - Got payment yet?
missed_payments (INT)      - Missed count
scheduled_period (INT)     - Their rotation period
```

### payments

```
id (UUID)                  - Auto-generated
group_id (UUID)            - FK to groups
member_id (UUID)           - FK to members
amount (DECIMAL)           - Payment amount
date (TIMESTAMP)           - When paid
period (INT)               - Which period
```

### periods

```
id (UUID)                  - Auto-generated
group_id (UUID)            - FK to groups
number (INT)               - Period # (1, 2, 3...)
recipient_id (UUID)        - FK to members (recipient)
start_date, end_date       - Period dates
total_collected            - Amount collected
status                     - active|completed|upcoming
```

### join_requests

```
id (UUID)                  - Auto-generated
group_id (UUID)            - FK to groups
user_id (UUID)             - FK to users
user_name, user_email      - Requester info
message (TEXT)             - Optional message
status                     - pending|approved|rejected
created_at, updated_at     - Timestamps
```

## RLS Policies Enabled

| Table         | Who Can Read     | Who Can Write    |
| ------------- | ---------------- | ---------------- |
| users         | Own profile only | Self only        |
| groups        | Group members    | Creator & admins |
| memberships   | Group members    | Admins only      |
| members       | Group members    | Admins only      |
| payments      | Group members    | Admins only      |
| periods       | Group members    | Admins only      |
| join_requests | User & admins    | Users & admins   |

## Indexes Created

Improves query performance:

- `users(email)` - Fast email lookups
- `groups(created_by)` - Find user's groups
- `group_memberships(group_id, user_id)` - Member queries
- `members(group_id, email)` - Member searches
- `payments(group_id, member_id, period, date)` - Payment reports
- `periods(group_id, status, start_date)` - Period filtering
- `join_requests(group_id, user_id, status)` - Request queries

## Views Created

Pre-built queries:

**group_members_view**

```sql
SELECT group_id, group_name, user_id, user_name,
       user_email, role, joined_date
FROM group_members_view
WHERE group_id = 'some-id'
```

**group_statistics**

```sql
SELECT id, name, member_count,
       total_payments, total_amount_collected
FROM group_statistics
```

## How to Use

### In Your App (Already Done ✓)

The app's DAO already handles these tables:

```typescript
// supabaseDAO.ts uses these tables automatically
await dataAccess.getUserById(id);
await dataAccess.getGroupsByUserId(id);
await dataAccess.createPayment(groupId, payment);
// etc...
```

### Manual Queries in SQL Editor

```sql
-- Get all users
SELECT * FROM users;

-- Get groups created by user
SELECT * FROM groups WHERE created_by = 'user-uuid';

-- Get members in a group
SELECT u.name, gm.role
FROM group_memberships gm
JOIN users u ON gm.user_id = u.id
WHERE gm.group_id = 'group-uuid';

-- Get total payments per group
SELECT group_id, SUM(amount) as total
FROM payments
GROUP BY group_id;

-- Get pending join requests
SELECT * FROM join_requests
WHERE status = 'pending';
```

## Test the Setup

### Verify All Tables Exist

```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return: 7
```

### Check RLS is Enabled

```sql
SELECT tablename, rls_enabled
FROM pg_tables
WHERE table_schema = 'public';
-- Should show true for all tables
```

### List All Policies

```sql
SELECT tablename, policyname, permissive
FROM pg_policies
WHERE schemaname = 'public';
```

## Troubleshooting

| Issue                   | Fix                                       |
| ----------------------- | ----------------------------------------- |
| "Table already exists"  | Script uses IF NOT EXISTS (safe to rerun) |
| "Extension not found"   | Supabase has uuid-ossp pre-installed      |
| "RLS policy error"      | Ensure user is authenticated              |
| "No rows returned"      | Check RLS policy allows access            |
| "Foreign key violation" | Parent record must exist first            |

## Execution Steps

1. **Open Supabase Dashboard**

   - https://app.supabase.com
   - Select project: chamav1

2. **Open SQL Editor**

   - Left sidebar → SQL Editor
   - Click + New Query

3. **Copy SQL Script**

   - Open `SUPABASE_SQL_SETUP.sql`
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

4. **Paste & Execute**

   - In SQL Editor, paste (Ctrl+V)
   - Click ▶ Run button
   - Wait for completion (~10-30 seconds)

5. **Verify Success**
   - Check for ✓ Success message
   - Go to Table Editor
   - Confirm 7 tables visible

## What Gets Created

✅ 7 database tables with proper schema  
✅ Indexes on frequently queried columns  
✅ Foreign key relationships  
✅ Unique constraints (no duplicates)  
✅ Check constraints (value validation)  
✅ 2 helpful views for common queries  
✅ Row-level security policies on all tables  
✅ Automatic timestamps (created_at, updated_at)

## Security

✓ Row-level security enabled  
✓ Users cannot see other users' data  
✓ Group members can only see their group  
✓ Admins have elevated permissions  
✓ All queries validated by policies  
✓ No anonymous access allowed

## Performance

✓ All common columns indexed  
✓ Foreign keys indexed  
✓ Unique constraints efficient  
✓ Views pre-optimize queries  
✓ Suitable for 1000+ users/group

## Next Steps After Setup

1. Create auth users in Supabase Auth
2. Link auth users to database (app does this)
3. Create test groups and members
4. Test join request flow
5. Verify RLS policies working

## Connection String

```
postgresql://[user]:[password]@[host]:5432/postgres
```

Available in Supabase Dashboard → Settings → Database

## Support

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security

---

**Status:** ✅ Ready to Execute  
**Database:** PostgreSQL (Supabase-managed)  
**Version:** 1.0  
**Last Updated:** November 13, 2025
