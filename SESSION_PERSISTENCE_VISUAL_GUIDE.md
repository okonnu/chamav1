# Session Persistence - Visual Guide

## Complete Session Lifecycle

```
═══════════════════════════════════════════════════════════════════════════════

SCENARIO 1: First-Time User Login

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Opens App                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Browser                          Supabase                                  │
│  ┌──────────────┐                 ┌──────────┐                              │
│  │ App Starts   │                 │ No Token │                              │
│  │ loading=true │                 │ In Store │                              │
│  └──────────────┘                 └──────────┘                              │
│        ↓                                                                     │
│  No session found                                                           │
│        ↓                                                                     │
│  Show Login Screen                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Enters Credentials                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Login Form                      Supabase Auth                              │
│  ┌──────────────┐               ┌──────────────┐                           │
│  │ Email: ••••  │               │ Validate     │                           │
│  │ Pass: ••••   │──────────────▶│ Email/Pass   │                           │
│  │ [Login]      │               │              │                           │
│  └──────────────┘               └──────┬───────┘                           │
│                                        │                                   │
│                              ┌─────────▼─────────┐                         │
│                              │ Valid?            │                         │
│                              └─┬─────────────┬──┘                         │
│                                │             │                            │
│                              YES             NO                           │
│                                │             │                            │
│                        ┌───────▼──────┐  ┌─▼───────┐                     │
│                        │ Generate JWT │  │ Return  │                     │
│                        │ Access Token │  │ Error   │                     │
│                        │ Refresh Tok  │  └─────────┘                     │
│                        └───────┬──────┘                                   │
│                                │                                          │
│                    localStorage.setItem(                                  │
│                      'sb-...-auth-token': {                              │
│                        access_token: 'eyJ...',                           │
│                        refresh_token: '...',                            │
│                        expires_at: 1699999999,                          │
│                        user: {...}                                      │
│                      }                                                   │
│                    )                                                     │
│                                │                                         │
│                        ┌───────▼──────┐                                 │
│                        │ onAuthState  │                                 │
│                        │ Change Event │                                 │
│                        └───────┬──────┘                                 │
│                                │                                         │
│  Browser State Update           │                                         │
│  ┌──────────────┐       ┌──────▼──────────────┐                         │
│  │ currentUser  │◀──────│ Set user from       │                         │
│  │ = user obj   │       │ session.user        │                         │
│  └──────────────┘       └────────────────────┘                         │
│        ↓                                                                │
│  Navigate to Dashboard                                                 │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Session Active (User on Dashboard)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  onAuthStateChange Listener Active                                          │
│  ┌────────────────────────────────────────────┐                            │
│  │ Watching for:                              │                            │
│  │ • Token refresh events                     │                            │
│  │ • User updates                             │                            │
│  │ • Session invalidation                     │                            │
│  └────────────────────────────────────────────┘                            │
│                                                                              │
│  localStorage Contains:                                                     │
│  ┌────────────────────────────────────────────┐                            │
│  │ sb-...-auth-token: {                       │                            │
│  │   access_token: (JWT with user info)       │                            │
│  │   refresh_token: (for auto-refresh)        │                            │
│  │   expires_at: 1234567890                   │                            │
│  │ }                                          │                            │
│  │ currentUserId: "uuid-here"                 │                            │
│  └────────────────────────────────────────────┘                            │
│                                                                              │
│  App State:                                                                  │
│  ┌────────────────────────────────────────────┐                            │
│  │ currentUser: {                             │                            │
│  │   id: "uuid-from-supabase",                │                            │
│  │   name: "John Doe",                        │                            │
│  │   email: "john@example.com"                │                            │
│  │ }                                          │                            │
│  │ groups: [...]                              │                            │
│  │ selectedGroup: null                        │                            │
│  └────────────────────────────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

SCENARIO 2: User Refreshes Page

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Page Refresh (F5)                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Browser                      App.tsx                                       │
│  ┌─────────────┐              │                                             │
│  │ F5 Pressed  │              │                                             │
│  └──────┬──────┘              │                                             │
│         │                     │                                             │
│  ┌──────▼──────┐              │                                             │
│  │ Reload Page │              │                                             │
│  │ React resets│              │                                             │
│  └──────┬──────┘              │                                             │
│         │                     │                                             │
│         │              ┌──────▼────────────────┐                            │
│         │              │ useEffect runs again  │                            │
│         │              │ (component mount)     │                            │
│         │              └──────┬─────────────────┘                           │
│         │                     │                                             │
│  localStorage               │                                              │
│  still contains          ┌──▼──────────────────────────────────────┐       │
│  auth token              │ Call loadUserData()                     │       │
│  ┌──────────────────┐    │                                        │       │
│  │ auth-token ✓     │    │ Check Supabase session:                │       │
│  │ currentUserId ✓  │    │ supabase.auth.getSession()             │       │
│  └──────────────────┘    └──┬───────────────────────────────────┘       │
│                             │                                            │
│                    ┌────────▼────────┐                                  │
│                    │ Session Valid?  │                                  │
│                    └────┬───────┬────┘                                  │
│                         │       │                                       │
│                       YES       NO                                      │
│                         │       │                                       │
│            ┌────────────▼─┐  ┌──▼────────────────┐                    │
│            │ Use Supabase │  │ Check localStorage│                    │
│            │ session      │  │ fallback          │                    │
│            │ ✓ Secure     │  └──┬─────────────────┘                   │
│            │ ✓ Auto-      │     │                                    │
│            │   refreshed  │     ├─ Found? Use DAO                   │
│            └────┬─────────┘     └─ Not found? Show login             │
│                 │                                                     │
│         ┌───────▼──────────────┐                                      │
│         │ Set currentUser      │                                      │
│         │ Load groups          │                                      │
│         │ Setup listener again  │                                     │
│         └───────┬──────────────┘                                      │
│                 │                                                     │
│         ┌───────▼──────────────┐                                      │
│         │ User Back on         │                                      │
│         │ Dashboard            │                                      │
│         │ (No login shown) ✓   │                                      │
│         └──────────────────────┘                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

SCENARIO 3: Token Auto-Refresh

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Token Nearing Expiration                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Timeline (Token expires in 1 hour = 3600 seconds)                          │
│                                                                              │
│  0 min ────────────────────────── 50 min ────────────────── 59 min ── 60 min│
│  LOGIN                           NORMAL USE         AUTO REFRESH         EXPIRE
│  │                                   │                  │                 │
│  │                                   │                  │                 │
│  │ Token Created                     │         Supabase detects           │
│  │ ├─ access_token                   │         expiration ~1 min away     │
│  │ ├─ refresh_token                  │         │                         │
│  │ └─ expires_at: +3600              │         ├─ No user action needed  │
│  │                                   │         │                        │
│  │                                   │         ├─ Auto refresh:         │
│  │                                   │         │  POST refresh token    │
│  │                                   │         │  to Supabase           │
│  │                                   │         │                        │
│  │                                   │         ├─ Get new tokens:       │
│  │                                   │         │  └─ access_token       │
│  │                                   │         │  └─ expires_at: +3600  │
│  │                                   │         │                        │
│  │                                   │         ├─ Update localStorage:  │
│  │                                   │         │  sb-...-auth-token     │
│  │                                   │         │                        │
│  │                                   │         └─ Emit TOKEN_REFRESHED  │
│  │                                   │            event                  │
│  │                                   │                                   │
│  │                            User continues working, unaware ✓           │
│  │                                                                         │
│  └─ No additional login needed                                             │
│  └─ Session continues seamlessly                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

SCENARIO 4: Manual Logout

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Clicks Logout Button                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GroupList Component                                                         │
│  ┌─────────────────────────────────┐                                        │
│  │ Header (welcome message)        │                                        │
│  │ ┌──────────────────────────┐    │                                        │
│  │ │ Welcome, John            │    │                                        │
│  │ │ [Logout Button] ◀─ CLICK │    │                                        │
│  │ └──────────────────────────┘    │                                        │
│  └─────────────────────────────────┘                                        │
│         ↓                                                                    │
│  handleLogout() called                                                       │
│  ┌──────────────────────────────────────────────┐                           │
│  │ async handleLogout() {                       │                           │
│  │   try {                                      │                           │
│  │     await supabase.auth.signOut();           │                           │
│  │   } finally {                                │                           │
│  │     setCurrentUser(null);                    │                           │
│  │     localStorage.removeItem('currentUserId');│                           │
│  │   }                                          │                           │
│  │ }                                            │                           │
│  └──────────────────────────────────────────────┘                           │
│         ↓                                                                    │
│  Supabase Logout                                                             │
│  ┌──────────────────────────────────────────────┐                           │
│  │ signOut() call:                              │                           │
│  │ ├─ POST /auth/v1/logout                      │                           │
│  │ ├─ Server invalidates token                  │                           │
│  │ ├─ localStorage cleared                      │                           │
│  │ └─ onAuthStateChange emits SIGNED_OUT        │                           │
│  └──────────────────────────────────────────────┘                           │
│         ↓                                                                    │
│  onAuthStateChange Listener Detects Change                                  │
│  ┌──────────────────────────────────────────────┐                           │
│  │ session === null (SIGNED_OUT event)          │                           │
│  │ ├─ setCurrentUser(null)                      │                           │
│  │ ├─ localStorage.removeItem('currentUserId')  │                           │
│  │ └─ User state cleared                        │                           │
│  └──────────────────────────────────────────────┘                           │
│         ↓                                                                    │
│  App Component Reacts                                                        │
│  ┌──────────────────────────────────────────────┐                           │
│  │ if (!currentUser) {                          │                           │
│  │   return <Login onLogin={handleLogin} />    │                           │
│  │ }                                            │                           │
│  └──────────────────────────────────────────────┘                           │
│         ↓                                                                    │
│  User Redirected to Login Screen                                            │
│  ┌─────────────────────────────────┐                                        │
│  │ ROSCA Manager                   │                                        │
│  │ Login   │   Register            │                                        │
│  │ ─────────────────────            │                                        │
│  │                                 │                                        │
│  │ Email: ___________________       │                                        │
│  │ Pass:  ___________________       │                                        │
│  │                                 │                                        │
│  │ [Login] [Create Account]        │                                        │
│  └─────────────────────────────────┘                                        │
│         ✓ Session fully cleared                                              │
│         ✓ Cookies deleted                                                    │
│         ✓ Tokens invalidated                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

SCENARIO 5: Multiple Browser Tabs

┌─────────────────────────────────────────────────────────────────────────────┐
│ Scenario: User has 2 tabs open (both logged in)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Tab 1                              Shared Storage                Tab 2    │
│  ┌─────────────────┐               ┌──────────────────┐        ┌──────────┐│
│  │ Dashboard       │               │  localStorage    │        │Dashboard ││
│  │ Logged In ✓     │   <────────▶  │  ┌────────────┐ │  ◀───  │Logged In ││
│  │                 │               │  │auth-token ✓│ │        │✓         ││
│  │ [Logout] ◀──┐   │               │  └────────────┘ │        │[Logout]  ││
│  └─────────────┼───┘               │                │        └──────────┘│
│                │                   │  onAuth Event   │                     │
│         User   │                   │  (storage..)    │                     │
│         Clicks │                   └──────────────────┘                     │
│         Logout │                                                            │
│                │                                                            │
│         ┌──────▼────────────────────────────────┐                          │
│         │ handleLogout()                        │                          │
│         │ ├─ signOut() ✓                        │                          │
│         │ ├─ Clear state                        │                          │
│         │ └─ Remove localStorage                │                          │
│         └──────┬─────────────────────────────────┘                         │
│                │                                                            │
│    ┌───────────▼──────────────────────────────────┐                        │
│    │ localStorage Cleared                         │                        │
│    │ └─ auth-token: deleted                       │                        │
│    │ └─ currentUserId: deleted                    │                        │
│    │                                              │                        │
│    │ Storage Change Event Fired                   │                        │
│    │ (broadcast to all tabs)                      │                        │
│    └──────┬───────────────────────────┬───────────┘                        │
│           │                           │                                    │
│    Tab 1  │                           │  Tab 2                             │
│    ┌──────▼──────┐            ┌───────▼──────┐                             │
│    │ onAuthState │            │ onAuthState  │                             │
│    │ Change      │            │ Change       │                             │
│    │ (listener)  │            │ (listener)   │                             │
│    │             │            │              │                             │
│    │ session:    │            │ session:     │                             │
│    │ null        │            │ null         │                             │
│    └──────┬──────┘            └───────┬──────┘                             │
│           │                           │                                    │
│    ┌──────▼──────┐            ┌───────▼──────┐                             │
│    │ currentUser │            │ currentUser  │                             │
│    │ = null      │            │ = null       │                             │
│    │             │            │              │                             │
│    │ Show Login  │            │ Show Login   │                             │
│    └─────────────┘            └──────────────┘                             │
│           ✓ Both tabs logged out!                                           │
│           ✓ Happens within ~100ms across tabs                              │
│           ✓ No manual refresh needed                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

STATE TRANSITIONS

                                    ┌─────────────────┐
                                    │  App Mounted    │
                                    │  loading=true   │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                    ┌─────────▼──────────┐      ┌──────────▼─────────┐
                    │ Session Check      │      │ No Session Found   │
                    │ Supabase + Local   │      │ Show Login Screen  │
                    └─────────┬──────────┘      └────────┬───────────┘
                              │                         │
                    ┌─────────▼──────────┐      ┌──────┐└──────────────┐
                    │ Session Found ✓    │      │      │               │
                    │ Set currentUser    │      │      │ User Submits  │
                    │ Load Groups        │      │      │ Login Form    │
                    │ loading=false      │      │      │               │
                    └─────────┬──────────┘      │      └──────┬────────┘
                              │                │             │
                    ┌─────────▼──────────┐      │    ┌────────▼──────────┐
                    │ Listening Setup    │      │    │ Supabase Auth     │
                    │ onAuthStateChange  │      │    │ Creates Session   │
                    │ Active ✓           │      │    │ (auth-token)      │
                    └─────────┬──────────┘      │    └────────┬──────────┘
                              │                │             │
                    ┌─────────▼──────────┐      │    ┌────────▼──────────┐
                    │ LOGGED IN STATE    │      │    │ onAuthStateChange │
                    │ ├─ Dashboard       │      │    │ Emits event       │
                    │ ├─ Groups loaded   │      │    └────────┬──────────┘
                    │ ├─ Listener active │      │             │
                    │ └─ Can refresh     │      │    ┌────────▼──────────┐
                    │   without logout  │      │    │ setCurrentUser    │
                    │   ✓✓✓             │      │    │ Load Groups       │
                    └─────────┬──────────┘      │    │ Go to Dashboard   │
                              │                │    └────────┬──────────┘
                              │                │             │
                              │                └─────┬───────┘
                              │                      │
                       ┌──────┴──────────────────────┴───────┐
                       │                                     │
                ┌──────▼────────┐              ┌────────────▼──────┐
                │ User Refreshes│              │ Session Event     │
                │ Page (F5)     │              │ (token refresh)   │
                └──────┬────────┘              └────────┬───────────┘
                       │                               │
                       │ Session still valid?          │ Auto-refresh
                       │ Yes → Stay logged in ✓         │ works ✓
                       │ No → Show login                │
                       │                               │
                       └───────────────────────────────┘
                                │
                       ┌────────▼─────────┐
                       │ User Logs Out    │
                       │ (click button)   │
                       └────────┬─────────┘
                                │
                       ┌────────▼─────────────┐
                       │ handleLogout()       │
                       │ ├─ signOut()         │
                       │ ├─ Clear state       │
                       │ ├─ Clear storage     │
                       │ └─ Listener detects  │
                       └────────┬─────────────┘
                                │
                       ┌────────▼─────────┐
                       │ LOGGED OUT STATE │
                       │ Show Login       │
                       │ ✓ Ready for      │
                       │   new login      │
                       └──────────────────┘

═══════════════════════════════════════════════════════════════════════════════
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ App.tsx (Main Component)                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  State:                                                          │
│  ├─ currentUser: User | null                                    │
│  ├─ groups: Group[]                                             │
│  └─ loading: boolean                                            │
│                                                                  │
│  Hooks:                                                          │
│  ├─ useEffect()                                                 │
│  │  ├─ Call loadUserData()                                     │
│  │  └─ Setup onAuthStateChange()                               │
│  │     ├─ Detects login                                        │
│  │     ├─ Detects logout                                       │
│  │     └─ Detects token refresh                                │
│  │                                                              │
│  Methods:                                                       │
│  ├─ loadUserData()                                             │
│  │  ├─ Check Supabase session                                 │
│  │  ├─ Check localStorage fallback                            │
│  │  └─ Load groups                                            │
│  │                                                              │
│  ├─ handleLogin(user)                                          │
│  │  ├─ Verify Supabase session                               │
│  │  ├─ Create user if needed                                 │
│  │  └─ Load groups                                           │
│  │                                                              │
│  └─ handleLogout()                                             │
│     ├─ Call supabase.auth.signOut()                           │
│     ├─ Clear state                                            │
│     └─ Clear localStorage                                     │
│                                                                  │
└────────────────┬───────────────────────────────────────────────┘
                 │
      ┌──────────┴────────────┐
      │                       │
      ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Login.tsx        │   │ GroupList.tsx    │
├──────────────────┤   ├──────────────────┤
│ When no user:    │   │ When user exists │
│ ├─ Show form     │   │ ├─ Groups list   │
│ ├─ Handle auth   │   │ ├─ Logout btn    │
│ └─ Call          │   │ │  (calls        │
│   onLogin()      │   │ │   handleLogout) │
│   (to App)       │   │ └─ Discovery grid│
└──────────────────┘   └──────────────────┘
```

## Storage Timeline

```
Time    localStorage              Supabase              React State
────    ──────────────              ────────              ───────────

T0      empty                      empty                 currentUser = null
        ✗ No token                 ✗ No session         loading = true

        ↓ User logs in ↓

T1      sb-...-auth-token ✓        Session Created ✓    currentUser = null
        (token stored)             (JWT generated)      (waiting for event)

        ↓ Auth event emitted ↓

T2      sb-...-auth-token ✓        Session Active ✓     currentUser = {
        currentUserId ✓            (verified)           id, name, email}
                                                        loading = false

        ↓ Page refreshed ↓

T3      sb-...-auth-token ✓        Session Verified ✓   currentUser = null
        currentUserId ✓            (same token)         loading = true
                                                        (checking...)

        ↓ Session check complete ↓

T4      sb-...-auth-token ✓        Session Still ✓      currentUser = {
        currentUserId ✓            Valid                id, name, email}
                                                        (auto-logged in!)

        ↓ Token auto-refresh ↓

T5      sb-...-auth-token ✓        Session Refreshed ✓  currentUser =
        (NEW token)                (new JWT)            (unchanged)
                                   expires_at updated   (seamless)

        ↓ User clicks logout ↓

T6      EMPTY ✓                    Session Clear ✓      currentUser =
        (tokens deleted)           (invalidated)        (unchanged)
        currentUserId ✓                                 (waiting for event)

        ↓ Auth change event ↓

T7      EMPTY                      Session Clear ✓      currentUser = null
                                                        (shown login)

```

---

**Visual Guide Complete** - All session persistence scenarios illustrated.
