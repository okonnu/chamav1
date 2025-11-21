# Supabase SQL - Visual Diagrams

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROSCA MANAGER DATABASE                         │
├─────────────────────────────────────────────────────────────────────────┤

                              ┌──────────────┐
                              │    users     │
                              ├──────────────┤
                              │ id (UUID) ●  │◄─────────────────────────┐
                              │ name         │                          │
                              │ email ✓      │                          │
                              │ created_at   │                          │
                              └──────────────┘                          │
                                    ▲                                   │
                                    │                                   │
                          (1)──────────────(many)                       │
                                    │                                   │
           ┌────────────────────────┼────────────────────────┐          │
           │                        │                        │          │
      ┌────▼──────────┐    ┌───────▼────────┐    ┌──────────▼──────┐   │
      │    groups     │    │ join_requests  │    │   memberships   │   │
      ├───────────────┤    ├────────────────┤    ├─────────────────┤   │
      │ id (UUID) ●   │    │ id (UUID) ●    │    │ id (UUID) ●     │   │
      │ name          │    │ group_id ●     │    │ group_id ●      │   │
      │ created_by ●──┼───▶│ user_id ●──────┼───▶│ user_id ●───────┼───┤
      │ description   │    │ user_name      │    │ role            │   │
      │ club_name     │    │ user_email     │    │ joined_date     │   │
      │ contribution_ │    │ message        │    │                 │   │
      │  amount       │    │ status ✓       │    │ UNIQUE(g,u)     │   │
      │ frequency ✓   │    │ created_at     │    └─────────────────┘   │
      │ current_period│    │ updated_at     │                          │
      │ total_periods │    └────────────────┘                          │
      │ num_cycles    │            ▲                                   │
      │ periods_per   │            │                                   │
      │  cycle        │        (1)──────(many)                         │
      │ start_date    │            │                                   │
      │ created_date  │            │                                   │
      └───┬───────────┘            │                                   │
          │                        │                                   │
          │(1)──────────────────(many)                                 │
          │                       │                                    │
          │      ┌────────────────┴──────────────┐                     │
          │      │                               │                    │
          │      │            ┌──────────────────┴──────┐              │
          │      │            │                         │              │
     ┌────▼──────▼───────┐    │                  ┌──────▼──────────┐   │
     │     members       │    │                  │    payments     │   │
     ├──────────────────┤    │                  ├─────────────────┤   │
     │ id (UUID) ●      │    │                  │ id (UUID) ●     │   │
     │ group_id ●───────┼────┤                  │ group_id ●──────┼───┤
     │ name             │    │                  │ member_id ●     │   │
     │ email ✓          │    │                  │ amount          │   │
     │ phone            │    │                  │ date ✓          │   │
     │ joined_date      │    │                  │ period ✓        │   │
     │ has_received ✓   │    │                  │ created_at      │   │
     │ missed_payments  │    │                  └─────────────────┘   │
     │ scheduled_period │    │                                         │
     │ updated_at       │    │                                         │
     └────┬─────────────┘    │                                         │
          │                  │                                         │
          │(1)───────────(many)                                        │
          │                  │                                         │
          │            ┌─────▼────────┐                                │
          │            │   periods    │                                │
          │            ├──────────────┤                                │
          │            │ id (UUID) ●  │                                │
          │            │ group_id ●   │                                │
          │            │ number ✓     │                                │
          │            │ recipient_id ├─▶ (FK to members above)       │
          │            │ start_date   │                                │
          │            │ end_date     │                                │
          │            │ total_coll.  │                                │
          │            │ status ✓     │                                │
          │            │ UNIQUE(g,n)  │                                │
          │            └──────────────┘                                │
          │                                                            │
          └────────────────────────────────────────────────────────────┘

        Legend:
        ●  = Primary Key (UUID)
        ●──▶ = Foreign Key reference
        ✓  = Index for fast queries
        UNIQUE() = Unique constraint
        (1)─────(many) = Relationship cardinality
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤

    Supabase Auth                    Database
    ┌──────────────┐                ┌──────────┐
    │ Users Table  │                │ users    │
    │ (managed by  │                │ table    │
    │  Supabase)   │                │          │
    └──────┬───────┘                └──────────┘
           │                              ▲
           │                              │
           │ auth.uid()                   │
           │ (Supabase UUID)              │ (inserted on signup)
           │                              │
           └──────────────────────────────┘
                   onAuthStateChange
                   (automatic sync)


┌─────────────────────────────────────────────────────────────────┐
│                  CREATE GROUP FLOW                              │
├─────────────────────────────────────────────────────────────────┤

User clicks "Create Group"
        ↓
Form: name, description, contribution_amount, etc.
        ↓
handleCreateGroup(name, description)
        ↓
dataAccess.createGroup({...})
        ↓
INSERT INTO groups (
  name, description, created_by, club_name,
  contribution_amount, frequency, ...
)
        ↓
Group created in DB (RLS: user = creator)
        ↓
INSERT INTO group_memberships (
  group_id, user_id, role='admin'
)
        ↓
Creator automatically added as admin
        ↓
UI: New group appears in list


┌─────────────────────────────────────────────────────────────────┐
│               JOIN GROUP REQUEST FLOW                           │
├─────────────────────────────────────────────────────────────────┤

User discovers group in marketplace
        ↓
Clicks "Join Group" button
        ↓
Form: optional message
        ↓
handleSubmitJoinRequest(groupId, message)
        ↓
INSERT INTO join_requests (
  group_id, user_id, user_name, user_email,
  message, status='pending'
)
        ↓
Request stored (RLS: user_id = current user)
        ↓
Admin notification: pending request in dashboard
        ↓
Admin clicks approve/reject
        ↓
UPDATE join_requests SET status='approved'
        ↓
INSERT INTO group_memberships (
  group_id, user_id, role='member'
)
        ↓
User now member of group


┌─────────────────────────────────────────────────────────────────┐
│            PAYMENT TRACKING FLOW                                │
├─────────────────────────────────────────────────────────────────┤

Group goes to Payments tab
        ↓
Loads: members, periods, payment history
        ↓
SELECT members FROM members
WHERE group_id = 'current-group'
        ↓
SELECT periods FROM periods
WHERE group_id = 'current-group'
        ↓
SELECT payments FROM payments
WHERE group_id = 'current-group'
        ↓
Display: period rotation schedule, payment status
        ↓
Admin records payment: amount, date, member, period
        ↓
INSERT INTO payments (
  group_id, member_id, amount, date, period
)
        ↓
Payment added to ledger
        ↓
UPDATE periods SET total_collected = total_collected + amount
        ↓
Period total updated


┌─────────────────────────────────────────────────────────────────┐
│           ROTATION SCHEDULE FLOW                                │
├─────────────────────────────────────────────────────────────────┤

Admin sets rotation recipients
        ↓
For each period, select member recipient
        ↓
INSERT INTO periods (
  group_id, number, recipient_id, 
  start_date, end_date, status='upcoming'
)
        ↓
Period 1: Member A receives
Period 2: Member B receives
Period 3: Member C receives
...
        ↓
SELECT periods WHERE status='active'
        ↓
Show current recipient and collection progress
        ↓
UPDATE periods SET status='completed'
        ↓ (when period ends)
Move to next period
```

## Security & RLS Policies

```
┌────────────────────────────────────────────────────────────────┐
│           ROW-LEVEL SECURITY (RLS) IN ACTION                  │
├────────────────────────────────────────────────────────────────┤

CLIENT QUERY:
    SELECT * FROM groups

CLIENT STATE:
    User ID: 12345
    Logged in: YES

┌──────────────────┐
│  SUPABASE        │
│  Postgres        │
└────────┬─────────┘
         │
    ┌────▼─────────────────────────────────────┐
    │  RLS POLICY CHECK                         │
    │  Table: groups                            │
    │  Policy: "Group members can read group"   │
    │                                           │
    │  WHERE id IN (                            │
    │    SELECT group_id                        │
    │    FROM group_memberships                 │
    │    WHERE user_id = auth.uid()             │
    │  )                                        │
    └─────────────────────────────────────────┬─┘
          │
    ┌─────▼──────────────────────┐
    │ POLICY EVALUATION          │
    │                            │
    │ Is user member of group?   │
    │ ├─ Group 1: YES ✓          │
    │ ├─ Group 2: YES ✓          │
    │ ├─ Group 3: NO  ✗          │
    │ └─ Group 4: NO  ✗          │
    └─────┬──────────────────────┘
          │
    ┌─────▼───────────────────┐
    │  RESULT SET             │
    │  Group 1: ✓ included    │
    │  Group 2: ✓ included    │
    │  Group 3: ✗ excluded    │
    │  Group 4: ✗ excluded    │
    └─────┬───────────────────┘
          │
    Client receives only Groups 1 & 2


┌───────────────────────────────────────────────────────┐
│  POLICY EXAMPLES                                      │
├───────────────────────────────────────────────────────┤

1. USERS can read OWN profile:
   WHERE id = auth.uid()::uuid

2. GROUP MEMBERS can read GROUP:
   WHERE id IN (
     SELECT group_id FROM group_memberships
     WHERE user_id = auth.uid()::uuid
   )

3. ADMINS can UPDATE group:
   WHERE id IN (
     SELECT group_id FROM group_memberships
     WHERE user_id = auth.uid()::uuid 
       AND role = 'admin'
   )

4. USERS can see OWN join requests:
   WHERE user_id = auth.uid()::uuid

5. ADMINS can see PENDING requests:
   WHERE status = 'pending'
     AND group_id IN (
       SELECT group_id FROM group_memberships
       WHERE user_id = auth.uid()::uuid
         AND role = 'admin'
     )
```

## Indexes for Performance

```
┌────────────────────────────────────────────────────┐
│        INDEX STRATEGY & QUERY OPTIMIZATION         │
├────────────────────────────────────────────────────┤

QUERY: Find all groups for user
SELECT g.* FROM groups g
JOIN group_memberships gm ON g.id = gm.group_id
WHERE gm.user_id = 'user-uuid'

INDEXES USED:
  ├─ group_memberships(user_id) ◄─ Start here
  ├─ group_memberships(group_id) ◄─ Join to groups
  └─ groups(id) ◄─ Primary key (implicit)

QUERY PLAN:
  1. Scan group_memberships using idx_user_id
     (finds 5 memberships in ~1ms)
  2. Join to groups using group_id index
     (fetches 5 groups in ~2ms)
  Result: ~3ms total


QUERY: Find members in a group by email
SELECT * FROM members
WHERE group_id = 'group-id'
  AND email LIKE '%example%'

INDEXES USED:
  └─ members(group_id, email)

QUERY PLAN:
  1. Scan members using idx_group_email
  2. Filter by group_id (very fast)
  3. Filter by email pattern (uses index)
  Result: ~1ms


QUERY: Get periods ordered by date
SELECT * FROM periods
WHERE group_id = 'group-id'
  AND status = 'active'
ORDER BY start_date DESC

INDEXES USED:
  ├─ periods(group_id, status) ◄─ Filter
  └─ periods(start_date) ◄─ Sort

QUERY PLAN:
  1. Scan using composite index
  2. Filter active periods (~100ms of data)
  3. Sort by start_date (already sorted)
  Result: ~2ms


WITHOUT INDEXES: 50-500ms (table scans)
WITH INDEXES: 1-5ms (index scans)
SPEEDUP: 50-100x faster!
```

## Table Growth Projection

```
┌────────────────────────────────────────────┐
│   DATA GROWTH ESTIMATES (for 1000 users)   │
├────────────────────────────────────────────┤

users
  ├─ 1,000 records
  ├─ ~1 KB per record
  └─ Total: ~1 MB

groups
  ├─ 100-500 groups (1 per 2-10 users)
  ├─ ~2 KB per group
  └─ Total: 200 KB - 1 MB

group_memberships
  ├─ 5,000-10,000 memberships (avg 5-10 per user)
  ├─ ~500 bytes per record
  └─ Total: 2.5 - 5 MB

members
  ├─ 5,000-50,000 members (5-50 per group)
  ├─ ~1 KB per member
  └─ Total: 5 - 50 MB

payments
  ├─ 50,000-500,000 payments
  │  (monthly: 5k-10k per group × # periods)
  ├─ ~500 bytes per payment
  └─ Total: 25 - 250 MB

periods
  ├─ 500-5,000 periods
  │  (1-12 periods per group cycle)
  ├─ ~1 KB per period
  └─ Total: 500 KB - 5 MB

join_requests
  ├─ Grows with time (historical)
  ├─ Archive old requests yearly
  └─ Total: 1-10 MB

TOTAL DATABASE SIZE: 33 - 311 MB

Supabase Free Tier:
  ├─ 500 MB storage
  ├─ Can handle: 1,500+ users ✓
  
Supabase Pro Tier:
  ├─ 8 GB storage
  ├─ Can handle: 20,000+ users ✓
```

## Query Performance by Index

```
┌───────────────────────────────────────────────┐
│   INDEX IMPACT ON QUERY SPEED                 │
├───────────────────────────────────────────────┤

SCENARIO: Find payments in period for group

Without indexes:
┌─────────────────────────────────┐
│ FULL TABLE SCAN                 │
│                                 │
│ payments (1M records)           │
│ ├─ Check record 1... NO         │
│ ├─ Check record 2... NO         │
│ ├─ Check record 3... NO         │
│ ├─ ... (continue 1M times)      │
│ ├─ Check record 999999... YES ✓ │
│ └─ Check record 1000000... NO   │
│                                 │
│ Time: 500ms - 2s                │
│ (reads entire table every time) │
└─────────────────────────────────┘

With indexes:
┌─────────────────────────────────┐
│ INDEX LOOKUP                    │
│                                 │
│ payments(group_id, period)      │
│ ├─ Find group_id bucket         │
│ ├─ Find period bucket           │
│ ├─ Direct access to matches ✓   │
│ └─ Return 50 matching records   │
│                                 │
│ Time: 1ms - 5ms                 │
│ (binary search, like phonebook) │
└─────────────────────────────────┘

IMPROVEMENT: 100x - 1000x faster!
```

## API to Database Mapping

```
┌────────────────────────────────────────────┐
│   HOW APP TALKS TO DATABASE                │
├────────────────────────────────────────────┤

src/utils/dao/supabaseDAO.ts
        │
        ├─ getUserById(id)
        │  └─ SELECT * FROM users WHERE id = ?
        │
        ├─ getGroupsByUserId(id)
        │  ├─ SELECT * FROM group_memberships
        │  └─ SELECT * FROM groups WHERE id IN (...)
        │
        ├─ createGroup(group)
        │  ├─ INSERT INTO groups
        │  └─ INSERT INTO group_memberships
        │
        ├─ getPaymentsByGroupId(id)
        │  └─ SELECT * FROM payments WHERE group_id = ?
        │
        ├─ createPayment(groupId, payment)
        │  └─ INSERT INTO payments
        │
        ├─ createJoinRequest(request)
        │  └─ INSERT INTO join_requests
        │
        └─ ... (20+ methods)

React Component
        │
        ├─ onMount: dataAccess.getGroupsByUserId()
        ├─ onCreate: dataAccess.createGroup()
        ├─ onPayment: dataAccess.createPayment()
        └─ onJoin: dataAccess.createJoinRequest()


DATABASE CONSTRAINTS ENFORCED BY RLS:
        │
        ├─ Users see only authorized data
        ├─ Admins have elevated access
        ├─ Members see only their groups
        ├─ Payments linked to group membership
        └─ Join requests validated
```

---

**Visual Diagrams Complete** - Database structure, security, and performance illustrated.
