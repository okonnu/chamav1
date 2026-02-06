# Supabase Migrations & Configuration

This directory contains all Supabase database migrations and configuration for the Chama App.

## Directory Structure

```
supabase/
├── migrations/
│   └── 20260205_create_chama_schema.sql    ← Main schema migration
├── config.toml                               ← Supabase configuration (auto-generated)
└── seed.sql                                  ← Optional: Sample data (if needed)
```

## Migrations

### 20260205_create_chama_schema.sql

Complete database schema including:

- 7 database tables
- 10 indexes
- 6 RPC functions
- Row-Level Security policies
- Helper functions for computed fields

**Tables:**

- `users` - Application users
- `groups` - Chama clubs/groups
- `group_memberships` - User memberships in groups
- `periods` - Rotation cycles
- `payments` - Payment records
- `join_requests` - Pending join requests

**RPC Functions:**

1. `get_group_by_id(gid)` - Get group with all nested data
2. `get_groups_by_user(uid)` - Get user's groups
3. `get_members_by_group_detailed(gid)` - Get detailed member list
4. `get_payments_by_group(gid)` - Get payment history
5. `get_periods_by_group(gid)` - Get rotation periods
6. `update_join_request_status(request_id, new_status)` - Update request status

## Deploying Migrations

### First Time Setup

1. **Initialize Supabase locally (optional):**

   ```bash
   supabase init
   ```

2. **Link your Supabase project:**

   ```bash
   supabase link --project-id your-project-id
   ```

3. **Push the schema:**
   ```bash
   supabase db push
   ```

### Subsequent Pushes

Just run:

```bash
supabase db push
```

## Creating New Migrations

To create a new migration, use:

```bash
supabase migration new [migration_name]
```

This creates a new SQL file in the `migrations/` directory with a timestamp prefix.

Example:

```bash
supabase migration new add_user_preferences
# Creates: migrations/20260205123456_add_user_preferences.sql
```

## Verifying Deployment

After running `supabase db push`, verify the schema in the Supabase Dashboard:

1. **Check Tables:**
   - Database → Tables
   - Verify all 7 tables exist with correct columns

2. **Check Functions:**
   - Database → Functions
   - Verify all 6 RPC functions are available

3. **Check Policies (RLS):**
   - Authentication → Policies
   - Verify policies are enabled on tables

## Important Notes

### Row-Level Security (RLS)

RLS is **enabled by default** to ensure data privacy:

- Users can only access their own groups and memberships
- Admins can manage their groups
- Policies use `auth.uid()` for authorization

If you encounter RLS issues during development, you can temporarily disable it:

```sql
-- Disable RLS (use with caution!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests DISABLE ROW LEVEL SECURITY;
```

Re-enable after testing:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

### Computed Fields

Some fields in the frontend types (like `Member.hasReceived`, `Member.missedPayments`) are not stored in the database but calculated at query time. This is handled by RPC functions:

- `has_user_received_payout(group_id, user_id)`
- `count_missed_payments(group_id, membership_id)`
- `get_next_scheduled_period(group_id)`

### Indexes

The migration includes 10 strategic indexes for performance:

- Foreign key columns
- Frequently queried fields
- Fields used in WHERE clauses
- Fields used in JOINs

These indexes improve query performance, especially for large datasets.

## Database Schema Reference

### Users Table

```typescript
{
  id: UUID; // Auto-generated
  name: string; // Full name
  email: string; // Unique email
  created_at: timestamp; // When created
  updated_at: timestamp; // Last update
}
```

### Groups Table

```typescript
{
  id: UUID;                          // Auto-generated
  name: string;                      // Group name
  description?: string;              // Optional description
  created_by: UUID;                  // Creator's user ID
  created_at: timestamp;             // When created
  club_name: string;                 // Chama/club name
  contribution_amount: number;       // Amount per period
  frequency: 'weekly' | 'monthly';   // Payment frequency
  current_period: number;            // Current cycle
  total_periods: number;             // Total periods per cycle
  number_of_cycles: number;          // Number of cycles
  periods_per_cycle: number;         // Periods per cycle
  start_date: date;                  // Group start date
}
```

### Group Memberships Table

```typescript
{
  id: UUID; // Auto-generated
  group_id: UUID; // Foreign key to groups
  user_id: UUID; // Foreign key to users
  role: "admin" | "member"; // User's role in group
  created_at: timestamp; // When joined
  has_exited: boolean; // Soft delete flag
}
```

### Periods Table

```typescript
{
  id: UUID;              // Auto-generated
  group_id: UUID;        // Foreign key to groups
  number: number;        // Period number in rotation
  recipient_id: UUID;    // User receiving funds
  start_date: date;      // Period start
  end_date: date;        // Period end
  collected_amt: number; // Amount collected so far
  status: enum;          // 'active', 'completed', 'upcoming'
  created_at: timestamp; // When created
}
```

### Payments Table

```typescript
{
  id: UUID; // Auto-generated
  membership_id: UUID; // Who paid
  period_id: UUID; // Which period
  paid_amt: number; // Payment amount
  created_at: timestamp; // When paid
}
```

### Join Requests Table

```typescript
{
  id: UUID;           // Auto-generated
  group_id: UUID;     // Which group
  user_id: UUID;      // Who requested
  user_name: string;  // Requester's name
  user_email: string; // Requester's email
  message?: string;   // Optional message
  status: enum;       // 'pending', 'approved', 'rejected'
  created_at: timestamp; // When requested
}
```

## Troubleshooting

### Migration Fails: "Table already exists"

Drop existing tables and retry:

```sql
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS periods CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS group_memberships CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then run: `supabase db push`

### Migration Fails: "Function already exists"

Drop existing functions:

```sql
DROP FUNCTION IF EXISTS get_group_by_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_groups_by_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_members_by_group_detailed(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_payments_by_group(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_periods_by_group(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_join_request_status(UUID, VARCHAR) CASCADE;
```

Then run: `supabase db push`

### Application Can't Connect

Check environment variables in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Queries Return Empty

Check RLS policies. You may need to authenticate properly or adjust policies:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
```

## Performance Optimization

The migration includes indexes on:

- `users.email` - For email lookups
- `groups.created_by` - For user's groups
- `group_memberships.group_id`, `user_id` - For membership queries
- `periods.group_id`, `status` - For period queries
- `payments.membership_id`, `period_id` - For payment queries
- `join_requests.group_id`, `status` - For pending requests

To view query performance:

1. Supabase Dashboard → Logs
2. Look for slow queries
3. Add additional indexes if needed

## Backup & Recovery

### Create Backup

```bash
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup

```bash
supabase db reset < backup_20260205_120000.sql
```

## Next Steps

1. ✅ Review migration file (`20260205_create_chama_schema.sql`)
2. ✅ Configure environment variables
3. ✅ Link Supabase project (`supabase link`)
4. ✅ Deploy schema (`supabase db push`)
5. ✅ Verify in dashboard
6. ✅ Test application
7. ✅ Migrate data (if needed)

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Questions?** Check the main project documentation or Supabase docs at https://supabase.com/docs
