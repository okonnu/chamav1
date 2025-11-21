# Session Persistence - Technical Guide

## Overview

Session persistence allows users to stay logged in across browser page refreshes and multiple visits. The implementation combines Supabase's built-in session management with localStorage as a fallback mechanism.

## Architecture

### 1. Supabase Session Management

Supabase automatically manages JWT tokens and sessions on the client side:

```typescript
// When user logs in via supabase.auth.signInWithPassword()
// Supabase stores the JWT token in localStorage automatically
// The token includes user identity and expiration info
```

**Key Characteristics:**

- Automatic token refresh before expiration
- Built-in security with JWT signatures
- Server-side validation of tokens
- Configurable session duration

### 2. Authentication Flow with Session Persistence

```
┌─────────────────────────────────────────┐
│  User Opens App / Refreshes Page        │
└──────────────┬──────────────────────────┘
               │
       ┌───────▼────────┐
       │  App Mounts     │
       │  useEffect runs │
       └───────┬────────┘
               │
    ┌──────────┴──────────┐
    │  loadUserData()      │
    └──────────┬───────────┘
               │
    ┌──────────▼──────────────────────┐
    │  Check Supabase Session          │
    │  supabase.auth.getSession()      │
    └──────────┬───────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    Session       No Session
    Exists        Exists
        │             │
   ┌────▼─────┐  ┌───▼──────────────┐
   │ Use It ✓  │  │ Check localStorage│
   │ Auto-     │  │ Fallback option   │
   │ logged in │  └────┬─────────────┘
   └────┬─────┘       │
        │          ┌───┴──────┐
        │          │          │
        │      Found      Not Found
        │          │          │
        │      ┌───▼─────┐ ┌─▼─────┐
        │      │Use DAO  │ │ Show   │
        │      │fallback │ │ Login  │
        │      └─────────┘ └────────┘
        │
   ┌────▼────────────────────┐
   │ Setup Auth State Listener │
   │ onAuthStateChange()      │
   └─────┬──────────────────┘
         │
    ┌────▼─────────────────────────┐
    │ Session Changes Detected?     │
    │ (Auto-refresh, logout, etc)   │
    └──────────────────────────────┘
```

## Implementation Details

### App.tsx - Session Initialization

```typescript
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadUserData();

  // Listen for Supabase auth state changes
  if (supabase) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Session valid - set user
        const user: User = {
          id: session.user.id,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          email: session.user.email || "",
        };
        setCurrentUser(user);
        localStorage.setItem("currentUserId", user.id);
      } else {
        // Session expired/invalidated
        setCurrentUser(null);
        localStorage.removeItem("currentUserId");
      }
    });

    // Cleanup: unsubscribe when component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }
}, []);
```

**Key Points:**

- `onAuthStateChange()` watches for Supabase auth events
- Automatically handles token refresh
- Cleans up subscription on unmount
- Stores user ID in localStorage as backup

### Load User Data with Session Check

```typescript
const loadUserData = async () => {
  try {
    // Priority 1: Check Supabase session (most secure)
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Session exists and is valid
        const user: User = {
          id: session.user.id,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User",
          email: session.user.email || "",
        };
        setCurrentUser(user);
        localStorage.setItem("currentUserId", user.id);
        await loadGroups(user.id);
        setLoading(false);
        return;
      }
    }

    // Priority 2: Fallback to localStorage
    const savedUserId = localStorage.getItem("currentUserId");
    if (savedUserId) {
      const user = await dataAccess.getUserById(savedUserId);
      if (user) {
        setCurrentUser(user);
        await loadGroups(user.id);
      }
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  } finally {
    setLoading(false);
  }
};
```

**Priority Order:**

1. **Supabase Session** - Most secure, automatically refreshed
2. **localStorage Fallback** - If Supabase session unavailable
3. **Show Login** - No session found

### Login Handler with Session Integration

```typescript
const handleLogin = async (user: User) => {
  try {
    console.log("Attempting login for:", user.email);

    // Supabase auth already completed in Login.tsx
    // Just verify session exists
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Session is valid, use provided user
        setCurrentUser(user);
        localStorage.setItem("currentUserId", user.id);
        await loadGroups(user.id);
        return;
      }
    }

    // Fallback: Database lookup
    const existingUser = await dataAccess.getUserByEmail(user.email);
    if (existingUser) {
      setCurrentUser(existingUser);
      localStorage.setItem("currentUserId", existingUser.id);
      await loadGroups(existingUser.id);
    } else {
      // Create new user in database
      const newUser = await dataAccess.createUser({
        name: user.name,
        email: user.email,
      });
      setCurrentUser(newUser);
      localStorage.setItem("currentUserId", newUser.id);
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("Login failed. Please try again.");
  }
};
```

### Logout Handler with Session Cleanup

```typescript
const handleLogout = async () => {
  try {
    // Sign out from Supabase (clears JWT token)
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    // Clear all local state
    setCurrentUser(null);
    setSelectedGroup(null);
    setActiveTab("dashboard");
    localStorage.removeItem("currentUserId");
  }
};
```

**Logout Process:**

1. Call `supabase.auth.signOut()` to invalidate Supabase token
2. Clear local React state
3. Remove localStorage entries
4. User returned to login screen

## Storage Mechanisms

### 1. Supabase Internal Storage

Supabase automatically stores authentication tokens in localStorage:

```javascript
// Automatically created by Supabase
localStorage: {
  "sb-zthoxpevzbsuymwrnngt-auth-token": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "expires_in": 3600,
    "expires_at": 1699999999,
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "user_metadata": { "full_name": "John Doe" }
    }
  }
}
```

### 2. Application localStorage

Our app stores minimal backup data:

```javascript
localStorage: {
  "currentUserId": "user-uuid-here"  // Fallback only
}
```

## Token Lifecycle

### Token Creation

```
User logs in via Login.tsx
  ↓
supabase.auth.signInWithPassword()
  ↓
Supabase returns JWT token
  ↓
Token stored in localStorage (automatic)
  ↓
Session active ✓
```

### Token Refresh

```
Token nearing expiration (~1 min before)
  ↓
Supabase automatically refreshes
  ↓
New token stored in localStorage
  ↓
Session continues seamlessly
  ↓
No user action needed ✓
```

### Token Expiration

```
Token expires (default 1 hour)
  ↓
onAuthStateChange() detects change
  ↓
Session becomes null
  ↓
setCurrentUser(null)
  ↓
User redirected to login
  ↓
Session ended
```

### Manual Logout

```
User clicks logout button
  ↓
handleLogout() called
  ↓
supabase.auth.signOut()
  ↓
Supabase clears JWT token
  ↓
localStorage cleaned
  ↓
onAuthStateChange() detects change
  ↓
Session invalidated
  ↓
User sent to login screen ✓
```

## Security Considerations

### 1. JWT Token Security

- Tokens include cryptographic signature
- Supabase verifies signature server-side
- Tokens cannot be forged or tampered with
- Automatically expires after configured duration

### 2. localStorage Security

- Tokens stored in browser localStorage
- Vulnerable to XSS attacks if JS is compromised
- Use HTTPS to prevent man-in-the-middle attacks
- httpOnly cookies not available in browser (Supabase limitation)

### 3. Best Practices

```typescript
// ✓ DO: Trust Supabase session
if (supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    /* valid */
  }
}

// ✓ DO: Verify token before sensitive operations
const user = session.user; // Always from Supabase

// ✗ DON'T: Trust localStorage alone
const userId = localStorage.getItem("userId"); // Risky

// ✗ DON'T: Store sensitive data in localStorage
// (Supabase does this securely, but avoid custom data)
```

## Error Handling

### Session Expired

```typescript
// Detected by onAuthStateChange()
if (session === null) {
  setCurrentUser(null);
  // User automatically sent to login
}
```

### Session Invalid (Tampered Token)

```typescript
// Supabase automatically rejects invalid tokens
// Error will be caught in API calls
const { error } = await supabase.from("groups").select("*");

if (error?.status === 401) {
  // Token invalid, user needs to login again
  setCurrentUser(null);
}
```

### Network Issues

```typescript
// If offline, cached session may work
// Supabase has offline support

// When back online:
// - Token automatically refreshed if expired
// - New operations proceed normally
```

## Testing Session Persistence

### Test 1: Login and Refresh

```
1. Open app
2. Click "Login" tab
3. Enter credentials: user@example.com / password
4. Click "Login" button
5. Wait for redirect to dashboard
6. Press F5 (refresh page)
✓ Expected: User remains logged in, no redirect to login
```

### Test 2: Login and Close/Reopen Browser

```
1. Log in successfully
2. Close browser tab
3. Reopen localhost:5173
✓ Expected: User automatically logged in without login screen
```

### Test 3: Logout

```
1. User logged in on dashboard
2. Click "Logout" button (in GroupList)
3. Wait for redirect
✓ Expected: User sent to login screen
4. Refresh page
✓ Expected: Still on login screen (session cleared)
```

### Test 4: Session Timeout

```
1. Log in successfully
2. Wait for token to expire (default 1 hour)
   OR manually expire token via Supabase dashboard
3. Try to perform action (load groups, etc)
✓ Expected: Automatic redirect to login
```

### Test 5: Multiple Tabs

```
1. Log in in tab 1
2. Open app in tab 2
✓ Expected: Tab 2 automatically logged in (shared localStorage)
3. Log out in tab 1
✓ Expected: Tab 2 also logs out (auth state change detected)
```

## Debugging

### Check Session Status

```typescript
// In browser console:
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Current session:", session);
```

### View Stored Tokens

```javascript
// In browser console:
console.log(localStorage);
// Look for "sb-zthoxpevzbsuymwrnngt-auth-token"
```

### Monitor Auth Events

```typescript
// Add to App.tsx for debugging:
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth event: ${event}`, session?.user?.email);
});

// Events:
// - INITIAL_SESSION
// - SIGNED_IN
// - SIGNED_OUT
// - USER_UPDATED
// - TOKEN_REFRESHED
```

## Browser Storage Limits

| Browser | localStorage Limit |
| ------- | ------------------ |
| Chrome  | ~10 MB             |
| Firefox | ~10 MB             |
| Safari  | ~5 MB              |
| Edge    | ~10 MB             |

**Token Storage:** ~2-5 KB per session (well within limits)

## Configuration

### Supabase Session Settings

Located in Supabase Dashboard → Authentication → Providers:

```
JWT Expiry: 3600 seconds (1 hour)
Refresh Token Expiry: 604800 seconds (7 days)
Enable Refresh Token Rotation: Yes
```

### Modify in Code (if needed)

```typescript
// In Login.tsx when calling signInWithPassword:
const { error } = await supabase.auth.signInWithPassword({
  email: data.email,
  password: data.password,
  // Supabase uses default session settings
});
```

## Performance Impact

| Operation                   | Time        | Notes                    |
| --------------------------- | ----------- | ------------------------ |
| getSession()                | ~10ms       | Fast localStorage read   |
| Token refresh               | ~100-500ms  | Network call to Supabase |
| Auth state change detection | Instant     | Event-based              |
| Full app initialization     | ~500-2000ms | Including group loading  |

**Optimization:** Session check on app load doesn't block rendering (async operation).

## Environment Variables

Ensure these are set in `.env`:

```
VITE_SUPABASE_URL=https://zthoxpevzbsuymwrnngt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### Problem: User logged out after page refresh

**Solution:**

- Check browser allows localStorage
- Verify Supabase token not expired
- Check browser console for auth errors

### Problem: Multiple logout events

**Solution:**

- This is normal in onAuthStateChange subscription
- Each event may trigger multiple component renders
- Use React.memo to prevent unnecessary rerenders

### Problem: Session persists after logout in other tabs

**Solution:**

- Wait for storage event to propagate (~100ms)
- Session should clear across all tabs within 1 second

### Problem: Cannot login (401 error)

**Solution:**

- Verify Supabase credentials in `.env`
- Check user credentials in Supabase dashboard
- Ensure email is verified (if email confirmation enabled)

## Migration Guide (if needed)

If migrating from mock auth to Supabase:

```typescript
// Old way (mock auth)
const user = { id: Date.now().toString(), email: "user@example.com" };
localStorage.setItem("currentUserId", user.id);

// New way (Supabase)
const {
  data: { session },
} = await supabase.auth.getSession();
// Session automatically managed by Supabase
```

---

**Session Persistence Complete** - Users can now stay logged in across page refreshes and browser reopenings with automatic token refresh and fallback mechanisms.
