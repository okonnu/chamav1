# Session Persistence - Quick Reference

## What Changed

### App.tsx Updates

#### 1. Enhanced useEffect with Auth Listener

```typescript
useEffect(() => {
  loadUserData();

  // NEW: Listen for Supabase auth changes
  if (supabase) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // Auto-logged in
          const user: User = { id: session.user.id, ... };
          setCurrentUser(user);
          localStorage.setItem('currentUserId', user.id);
        } else {
          // Session ended
          setCurrentUser(null);
          localStorage.removeItem('currentUserId');
        }
      }
    );
    return () => subscription?.unsubscribe();
  }
}, []);
```

#### 2. Smart Session Loading

```typescript
const loadUserData = async () => {
  // Check Supabase session FIRST (priority)
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      // Use Supabase session
      setCurrentUser(user);
      await loadGroups(user.id);
      return; // ✓ Done
    }
  }

  // Fallback to localStorage
  const savedUserId = localStorage.getItem("currentUserId");
  if (savedUserId) {
    const user = await dataAccess.getUserById(savedUserId);
    setCurrentUser(user);
  }
};
```

#### 3. Async Logout with Supabase

```typescript
const handleLogout = async () => {
  try {
    if (supabase) {
      await supabase.auth.signOut(); // Clear Supabase token
    }
  } finally {
    setCurrentUser(null);
    localStorage.removeItem("currentUserId");
  }
};
```

## How It Works

### User Reopens Browser

```
App Starts
  ↓
getSession() checks Supabase token
  ↓
Token valid?
  ├─ YES → Set user, load groups ✓
  └─ NO → Check localStorage fallback
```

### Token Auto-Refreshes

```
Session near expiration
  ↓
Supabase silently refreshes token
  ↓
App continues working
  ↓
User unaware ✓
```

### User Logs Out

```
Click logout
  ↓
signOut() invalidates token
  ↓
localStorage cleared
  ↓
User sent to login
```

## Key Features

✅ **Auto-Login** - Users stay logged in across page refreshes  
✅ **Automatic Token Refresh** - No manual token management  
✅ **Graceful Fallback** - Works with or without Supabase  
✅ **Multi-Tab Support** - logout in one tab affects all tabs  
✅ **Secure** - JWT tokens verified server-side  
✅ **Simple** - Just refresh the page, works instantly

## Testing

### Test Auto-Login

1. Log in → See dashboard
2. Press F5 (refresh)
3. ✓ Still logged in (no login screen)

### Test Logout

1. Click logout button
2. ✓ Sent to login screen
3. Press F5
4. ✓ Still on login screen

### Test Token Refresh

1. Log in
2. Wait 30+ minutes (with browser tab open)
3. Perform action (load groups)
4. ✓ Works seamlessly (token auto-refreshed)

## Code Files Modified

**`src/App.tsx`**

- Added `supabase` import
- Enhanced useEffect with `onAuthStateChange` listener
- Updated `loadUserData()` to check Supabase session
- Updated `handleLogout()` to call `supabase.auth.signOut()`

**No Changes Needed**

- `src/components/Login.tsx` - Already uses Supabase auth
- `src/components/GroupList.tsx` - Calls handleLogout as-is

## Storage Used

```
Supabase Auth Token: ~2-5 KB
  ├─ JWT access token
  ├─ Refresh token
  └─ User metadata

App Backup: ~50 bytes
  └─ currentUserId (localStorage)

Total: < 10 KB (well within browser limits)
```

## Browser Support

| Browser | Support | Notes         |
| ------- | ------- | ------------- |
| Chrome  | ✓       | Full support  |
| Firefox | ✓       | Full support  |
| Safari  | ✓       | Full support  |
| Edge    | ✓       | Full support  |
| IE 11   | ✗       | Not supported |

## Common Tasks

### Get Current User Programmatically

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
const userId = session?.user?.id;
```

### Force Logout

```typescript
await supabase.auth.signOut();
// OR
handleLogout(); // App method
```

### Check if User Logged In

```typescript
if (currentUser) {
  // Logged in
} else {
  // Not logged in
}
```

### Listen for Auth Changes (Advanced)

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);
  // Events: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, USER_UPDATED
});

// Cleanup
subscription?.unsubscribe();
```

## Troubleshooting

| Problem                       | Cause                                  | Solution                               |
| ----------------------------- | -------------------------------------- | -------------------------------------- |
| User logged out on refresh    | Token expired                          | Wait for auto-refresh or login again   |
| Session persists after logout | Storage event delay                    | Normal, clears within 1 second         |
| Cannot login                  | Credentials wrong                      | Check email/password in Supabase       |
| Multiple logout events        | onAuthStateChange fires multiple times | Normal behavior                        |
| localStorage disabled         | Browser privacy mode                   | Fallback still works if Supabase works |

## Next Steps

Completed Features:

- ✅ Session persistence (current)
- ✅ Auto-login on refresh
- ✅ Automatic token refresh
- ✅ Logout functionality

Recommended Next:

1. Admin join request approval interface
2. Password reset functionality
3. Email verification
4. Social authentication (Google, GitHub)

---

**Implementation Date:** November 13, 2025  
**Status:** ✅ Complete and tested
