# Supabase DAO Migration Plan

## Executive Summary

This document outlines a comprehensive plan to migrate the application from LocalStorageDAO to SupabaseDAO. The infrastructure is already in place—Supabase is configured and a SupabaseDAO implementation exists—but the migration requires addressing schema mismatches, completing the DAO implementation, and ensuring data integrity during the transition.

---

## 1. Current Data Model Architecture

### 1.1 Frontend TypeScript Interfaces

The application uses a hierarchical data model centered around **Groups**:

```
User
├── Groups (via GroupMembership)
    ├── Club (settings/metadata)
    ├── Members (roster)
    ├── Payments (transaction history)
    └── Periods (rotation cycles)

JoinRequest (separate entity)
```

**Key Entities:**

- **User**: `{ id, name, email }`
- **Group**: Container for all club-related data (includes nested Club, Members, Payments, Periods)
- **Club**: `{ name, contributionAmount, frequency, currentPeriod, totalPeriods, numberOfCycles, periodsPerCycle, startDate }`
- **Member**: `{ id, name, email, phone?, joinedDate, hasReceived, missedPayments, scheduledPeriod }`
- **Payment**: `{ memberId, amount, date, period }`
- **Period**: `{ number, recipientId, startDate, endDate, totalCollected, status }`
- **GroupMembership**: `{ userId, role, joinedDate }`
- **JoinRequest**: `{ id, group_id, user_id, user_name, user_email, message, status, created_at }`

---

## 2. LocalStorageDAO Implementation Analysis

### Storage Pattern

- **Flat localStorage buckets**: `users`, `groups`, `join_requests`
- **Denormalized structure**: Group contains complete nested data (members, payments, periods all inside Group object)
- **In-memory operations**: All operations are synchronous, operating on arrays in localStorage

### Key Characteristics

1. **Complete data loading**: Single call retrieves entire group with all nested data
2. **In-place mutations**: Direct array modifications before serialization back to storage
3. **Simple ID generation**: `Date.now() + random string`
4. **No relationships**: Data is self-contained; no foreign key traversals

### Limitations

- Denormalized structure causes data duplication
- Inefficient for partial updates
- No atomic transactions
- Memory-intensive for large datasets

---

## 3. Supabase Schema Analysis

### Current Database Structure

The PostgreSQL schema already exists with the following normalized tables:

```
users
├── id (UUID, PK)
├── name, phone, email
└── created_at, updated_at

groups
├── id (UUID, PK)
├── group_name, description
├── contribution_amt, frequency, cycles
├── created_by (FK → users.id)
└── created_at, updated_at

membership (junction table)
├── id (UUID, PK)
├── user_id (FK → users.id)
├── group_id (FK → groups.id)
├── role (admin | member)
├── has_exited
└── created_at, updated_at

periods
├── id (UUID, PK)
├── group_id (FK → groups.id)
├── recipient_id (FK → membership.id)
├── collected_amt, expected_amt
├── start_date, end_date
└── created_at, updated_at

payments
├── id (UUID, PK)
├── membership_id (FK → membership.id)
├── period_id (FK → periods.id)
├── paid_amt, expected_amt
└── created_at, updated_at

join_requests
├── id (UUID, PK)
├── group_id, user_id
├── user_name, user_email, message
├── status (pending | approved | rejected)
└── created_at
```

### Key Differences from TypeScript Model

1. **Normalized design**: Separate `membership` table vs. inline `members` array
2. **Field naming**: snake_case in DB vs. camelCase in types
3. **Type mismatches**:
   - `Member` in TypeScript maps to `membership` table in DB
   - `Period.number` not stored in DB (missing field)
   - `Member.hasReceived`, `missedPayments` not in DB schema
   - `Club` object denormalized into `groups` table fields

---

## 4. SupabaseDAO Current Status

### Completed Implementations

✅ User operations (getUserById, getUserByEmail, createUser)
✅ Group creation and basic retrieval
✅ Join request CRUD operations
✅ RPC helper functions defined in migrations

### Gaps & Issues

#### 4.1 Incomplete Operations

- ❌ `createPayment()` - Not implemented
- ❌ `createPeriod()` - Not implemented
- ❌ `updatePeriod()` - Not implemented

#### 4.2 Type/Schema Mismatches

- `Period.number` field: Not stored in DB, needs migration or mapping strategy
- `Member.hasReceived`, `missedPayments`, `scheduledPeriod`: Calculated fields, not persisted
- Club data scattered across group table fields

#### 4.3 Data Mapping Issues

- `mapMembers()`: Currently maps from RPC response; needs refinement
- `mapPayments()`: Assumes `membership_id` in response; verify RPC returns it
- `mapPeriods()`: Hardcodes status as 'active'; needs proper derivation

#### 4.4 Missing RPC Functions

The SupabaseDAO calls several RPC functions that may not exist:

- `get_group_by_id(gid: UUID)`
- `get_groups_by_user(uid: UUID)`
- `get_members_by_group_detailed(gid: UUID)`
- `get_payments_by_group(gid: UUID)`
- `get_periods_by_group(gid: UUID)`
- `update_join_request_status(request_id: UUID, new_status: text)`

---

## 5. DAO Abstraction & Current Usage

### DAO Factory Pattern

Located in `src/utils/dao/index.ts`:

```typescript
const USE_SUPABASE = true; // Global flag
export function getDataAccess(): IDataAccess { ... }
export const dataAccess = getDataAccess();
```

### IDataAccess Interface

Defines contract for both DAOs with 15 methods across 5 domains:

- User: 3 methods
- Group: 4 methods
- Member: 4 methods
- Payment: 2 methods
- Period: 3 methods
- JoinRequest: 3 methods

### Usage in Application

- **App.tsx**: Central entry point using `dataAccess` singleton
- Imported once and used throughout component tree
- Easy to switch implementations via single `USE_SUPABASE` flag

---

## 6. Migration Strategy & Execution Plan

### Phase 1: Infrastructure & Verification (Pre-Migration)

**Goals**: Ensure Supabase is ready and data is accessible

#### 1.1 Verify Supabase Configuration

- [ ] Confirm Supabase credentials in `src/utils/supabase.ts` are valid
- [ ] Test Supabase client initialization
- [ ] Verify all tables exist in database
- [ ] Check Row-Level Security (RLS) policies are correctly configured

#### 1.2 Create/Verify RPC Functions

**Action**: Create all missing RPC functions in Supabase SQL editor or migrations

```sql
Functions needed:
- get_group_by_id(gid UUID)
- get_groups_by_user(uid UUID)
- get_members_by_group_detailed(gid UUID)
- get_payments_by_group(gid UUID)
- get_periods_by_group(gid UUID)
- update_join_request_status(request_id UUID, new_status text)
```

#### 1.3 Resolve Schema Gaps

**Action**: Migrate database schema to support all frontend fields

```sql
-- Add missing field to periods (if periods.number is required)
ALTER TABLE periods ADD COLUMN period_number INT;

-- Consider adding computed fields as views if needed:
CREATE VIEW member_details AS
  SELECT
    m.id,
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    m.created_at as joined_date,
    m.role,
    m.group_id,
    COALESCE((SELECT COUNT(*) FROM payments p
      WHERE p.membership_id = m.id
      AND p.paid_amt = 0), 0) as missed_payments,
    false as has_received
  FROM membership m
  JOIN users u ON m.user_id = u.id;
```

---

### Phase 2: SupabaseDAO Completion (Implementation)

**Goals**: Complete all missing DAO methods and fix mapping logic

#### 2.1 Implement Missing Methods

- [ ] `createPayment(groupId, payment)` - Insert into payments table
- [ ] `createPeriod(groupId, period)` - Insert into periods table with proper mapping
- [ ] `updatePeriod(groupId, periodNumber, updates)` - Update period by number lookup

#### 2.2 Fix Mapping Functions

- [ ] Update `mapMembers()` to include calculated fields (hasReceived, missedPayments)
- [ ] Update `mapPayments()` to properly extract member ID and handle all fields
- [ ] Update `mapPeriods()` to derive status dynamically from dates
- [ ] Enhance `mapToGroup()` to properly reconstruct Club object from denormalized fields

#### 2.3 Add Error Handling

- [ ] Wrap RPC calls with proper error logging
- [ ] Add null checks for optional fields
- [ ] Handle cases where related data doesn't exist

#### 2.4 Add Query Optimization

- [ ] Implement caching for frequently accessed groups
- [ ] Use proper Supabase query filters instead of fetching all data

---

### Phase 3: Data Migration (Optional - if existing data in localStorage)

**Goals**: Transfer existing localStorage data to Supabase

#### 3.1 Create Migration Tool

```typescript
// src/utils/migration/migrateLocalStorageToSupabase.ts
export async function migrateData(
  fromDAO: LocalStorageDAO,
  toDAO: SupabaseDAO,
): Promise<void> {
  // 1. Get all users from localStorage
  // 2. Create users in Supabase
  // 3. Get all groups from localStorage
  // 4. Create groups with mappings
  // 5. Create memberships
  // 6. Create payments and periods
  // 7. Verify counts match
}
```

#### 3.2 Migration Strategy

- **One-time script**: Run during deployment
- **Transactional**: All-or-nothing (use Supabase transactions)
- **Idempotent**: Safe to rerun (check for existing data)
- **Logged**: Track what was migrated for audit trail

---

### Phase 4: Testing & Validation

**Goals**: Ensure SupabaseDAO behaves identically to LocalStorageDAO

#### 4.1 Unit Tests

- [ ] Create test suite comparing DAO outputs
- [ ] Mock Supabase responses against expected return types
- [ ] Test all CRUD operations for each entity

#### 4.2 Integration Tests

- [ ] Test complete workflows (create group → add members → record payments)
- [ ] Verify data consistency across multiple operations
- [ ] Test edge cases (empty results, invalid IDs, concurrent updates)

#### 4.3 Manual Testing

- [ ] Use UI to create a test group
- [ ] Add members and record payments
- [ ] Verify data appears correctly in all views
- [ ] Test with multiple users simultaneously

---

### Phase 5: Deployment & Switchover

**Goals**: Transition application to use Supabase in production

#### 5.1 Pre-Deployment Checklist

- [ ] All RPC functions created and tested
- [ ] SupabaseDAO fully implemented and unit tested
- [ ] Database schema verified and optimized
- [ ] RLS policies reviewed and applied
- [ ] Backup of any existing data created
- [ ] Rollback plan documented

#### 5.2 Deployment Steps

1. **Backup**: Export all data from localStorage (client-side)
2. **Migrate** (if applicable): Run migration script
3. **Verify**: Confirm all data in Supabase
4. **Switch**: Set `USE_SUPABASE = true` in code
5. **Monitor**: Watch for errors in production
6. **Rollback**: If issues occur, switch back to localStorage

#### 5.3 Post-Deployment

- [ ] Monitor error logs for DAO errors
- [ ] Verify data integrity
- [ ] Keep LocalStorageDAO as fallback for 1 week
- [ ] Archive LocalStorageDAO after stability confirmed

---

## 7. Risk Assessment & Mitigation

### Risks

| Risk                                 | Impact   | Probability | Mitigation                                     |
| ------------------------------------ | -------- | ----------- | ---------------------------------------------- |
| RPC functions missing or incorrect   | Critical | Medium      | Verify all RPCs exist before migration         |
| Schema mismatches cause data loss    | Critical | Medium      | Create views/computed columns for missing data |
| Network latency degrades performance | High     | Medium      | Implement caching layer                        |
| Concurrent update conflicts          | High     | Low         | Use Supabase transactions                      |
| Auth/RLS blocks legitimate queries   | Medium   | High        | Test RLS policies thoroughly                   |
| Large data migrations timeout        | Medium   | Low         | Batch migration in chunks                      |

### Rollback Plan

- Keep LocalStorageDAO and `USE_SUPABASE` flag for easy switching
- Export all data before final migration
- Document exact revert steps
- Test rollback procedure before deployment

---

## 8. Detailed Implementation Roadmap

### Week 1: Infrastructure Setup

- Day 1-2: Verify Supabase setup, test connection
- Day 3-4: Create RPC functions in database
- Day 5: Create schema migration if needed

### Week 2: DAO Implementation

- Day 1-2: Implement missing CRUD methods
- Day 3-4: Fix and enhance mapping functions
- Day 5: Complete error handling

### Week 3: Testing & Integration

- Day 1-2: Write and run unit tests
- Day 3-4: Integration testing via UI
- Day 5: Performance testing and optimization

### Week 4: Deployment

- Day 1-2: Final verification and backups
- Day 3: Deploy to staging environment
- Day 4: Final manual testing
- Day 5: Production deployment + monitoring

---

## 9. Success Criteria

✅ **Functional**: All operations produce identical results to LocalStorageDAO
✅ **Performant**: Query response times < 500ms for 95th percentile
✅ **Reliable**: 99.9% success rate for all DAO operations
✅ **Scalable**: Handles 1000+ users and groups without degradation
✅ **Maintainable**: Clear code structure with comprehensive error handling
✅ **Observable**: Proper logging for debugging production issues

---

## 10. Code Examples for Reference

### Example: Complete createPeriod Implementation

```typescript
async createPeriod(groupId: string, period: Period): Promise<void> {
  const { error } = await supabase
    .from('periods')
    .insert({
      group_id: groupId,
      recipient_id: period.recipientId,
      start_date: new Date(period.startDate).toISOString().split('T')[0],
      end_date: new Date(period.endDate).toISOString().split('T')[0],
      expected_amt: 0, // Get from group.club.contributionAmount
      collected_amt: period.totalCollected || 0,
    })
    .select()
    .single();

  if (error) throw error;
}
```

### Example: Complete createPayment Implementation

```typescript
async createPayment(groupId: string, payment: Payment): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .insert({
      membership_id: payment.memberId,
      period_id: payment.period,
      paid_amt: payment.amount,
      expected_amt: 0, // Get from group
      deadline: new Date().toISOString().split('T')[0],
    });

  if (error) throw error;
}
```

---

## Next Steps

1. **Review** this plan with team
2. **Prioritize** based on resources available
3. **Create tickets** for each phase
4. **Begin Phase 1** infrastructure verification
