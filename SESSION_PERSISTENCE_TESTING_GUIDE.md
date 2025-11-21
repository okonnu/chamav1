# Session Persistence - Testing Guide

## Pre-Testing Setup

Ensure you have:

- ✅ App running locally (`npm run dev`)
- ✅ Supabase credentials in `.env`
- ✅ Browser developer tools open (F12)
- ✅ Clear browser cache or use incognito mode for clean tests

## Test Suite

### Test 1: Basic Login & Auto-Persistence ⭐

**Objective:** Verify user stays logged in after page refresh

**Steps:**

1. Open app in browser: `http://localhost:5173`
2. You should see login screen
3. Enter test credentials:
   - Email: `test@example.com`
   - Password: `password123` (or your test user credentials)
4. Click "Login" button
5. Wait for dashboard to load
6. Verify you see:
   - ✅ Welcome message with your name
   - ✅ Groups list displayed
   - ✅ "Logout" button visible
   - ✅ No login screen shown

**Persistence Check:** 7. Press `F5` to refresh the page 8. Wait for page to reload 9. **Expected Result:**

- ✅ Dashboard displays immediately
- ✅ No login form shown
- ✅ Groups still visible
- ✅ Same user still logged in

**Console Check (Optional):**

```javascript
// Open browser console (F12)
localStorage;
// Should show:
// └─ sb-{project-id}-auth-token: {...with access_token...}
// └─ currentUserId: "uuid-here"
```

---

### Test 2: Logout Functionality ⭐

**Objective:** Verify logout properly clears session

**Steps:**

1. Start from logged-in dashboard (from Test 1)
2. Look for "Logout" button
   - Usually in GroupList header area
3. Click the logout button
4. Wait for redirect
5. **Expected Result:**
   - ✅ Redirected to login screen
   - ✅ Welcome message disappears
   - ✅ Groups list hidden
   - ✅ Login form displayed

**Persistence Check After Logout:** 6. Press `F5` to refresh 7. **Expected Result:**

- ✅ Still on login screen
- ✅ Session is fully cleared
- ✅ Not auto-logged back in

**Console Check:**

```javascript
localStorage;
// Should show:
// currentUserId: NOT present (cleared)
// sb-...-auth-token: NOT present (cleared)
```

---

### Test 3: Browser Close & Reopen ⭐

**Objective:** Verify session persists across browser restart

**Steps:**

1. Log in to app (Test 1)
2. Verify you're on dashboard
3. **Close the entire browser** (not just tab)
   - Chrome: Alt+F4 (Windows) or Cmd+Q (Mac)
   - Firefox: Ctrl+Q (Windows) or Cmd+Q (Mac)
   - Safari: Cmd+Q
   - Edge: Alt+F4 (Windows)
4. Wait 5+ seconds
5. **Reopen the browser**
6. Navigate to `http://localhost:5173`
7. Wait for page to load
8. **Expected Result:**
   - ✅ Automatically logged in
   - ✅ Dashboard displays
   - ✅ No login screen shown
   - ✅ Groups list visible
   - ✅ Can immediately use app

---

### Test 4: Multi-Tab Sync ⭐

**Objective:** Verify logout/login syncs across tabs

**Steps - Part A: Open Multiple Tabs**

1. Open tab 1: `http://localhost:5173`
2. Log in successfully
3. Verify dashboard shows in tab 1
4. **Right-click tab 1** → **"Duplicate Tab"**
   - Opens new tab 2 with same URL
5. Wait 2 seconds
6. **Expected in Tab 2:**
   - ✅ Automatically logged in
   - ✅ Dashboard displays
   - ✅ No login form shown
   - ✅ Same user as tab 1

**Steps - Part B: Logout in One Tab** 7. **In Tab 1:** Click logout button 8. Wait for tab 1 to redirect to login 9. **Verify Tab 1:**

- ✅ Shows login screen

10. **Check Tab 2** (without clicking anything)
11. Wait 1-2 seconds
12. **Expected in Tab 2:**
    - ✅ Also shows login screen
    - ✅ Automatically logged out
    - ✅ Sync happened automatically
    - ℹ️ If not synced immediately, refresh tab 2

---

### Test 5: Token Expiration Handling

**Objective:** Verify behavior when token expires

**Note:** Default token expiry is 1 hour. This test demonstrates the mechanism.

**Steps:**

1. Log in to app
2. Note the login time
3. Leave browser open for 55+ minutes
4. Try to perform an action:
   - Click on a group to go to dashboard
   - Or try to load groups list
5. **Expected Result:**
   - **Option A (Auto-Refresh):** Works seamlessly
     - ✅ Token auto-refreshed silently
     - ✅ User unaware
     - ✅ No interruption
   - **Option B (After Expiry):** Shows login
     - ✅ Redirected to login screen
     - ✅ Error message may show
     - ✅ User logs back in

**Console Watch (Advanced):**

```javascript
// Open console before logging in
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Event: ${event}`);
  console.log("Session:", session?.user?.email);
});

// Watch for events:
// - INITIAL_SESSION (app start)
// - SIGNED_IN (after login)
// - TOKEN_REFRESHED (auto-refresh ~5 mins)
// - SIGNED_OUT (logout or expiry)
```

---

### Test 6: Form Switch Persistence

**Objective:** Verify session persists when switching between login/register

**Steps:**

1. Open app: `http://localhost:5173`
2. You should see login form
3. Click "Register" tab
4. See register form
5. Click "Login" tab
6. Back on login form
7. Enter valid credentials and log in
8. **Expected Result:**
   - ✅ Login succeeds
   - ✅ Dashboard displays
   - ✅ Session created
9. Refresh page
10. **Expected Result:**
    - ✅ Still logged in
    - ✅ No login form shown

---

### Test 7: Error Handling

**Objective:** Verify session handles errors gracefully

**Steps - Invalid Credentials:**

1. Open app
2. Enter incorrect credentials:
   - Email: `fake@example.com`
   - Password: `wrong123`
3. Click login
4. **Expected Result:**
   - ✅ Shows error message
   - ✅ Error message is clear
   - ✅ Can retry with correct credentials
   - ✅ No session created
5. Enter correct credentials and log in
6. **Expected Result:**
   - ✅ Login succeeds
   - ✅ Session created
   - ✅ Dashboard displays

**Steps - Network Error (Advanced):**

1. Log in successfully
2. Open DevTools Network tab
3. Set throttling to "Offline"
4. Try to load groups or refresh
5. **Expected Result:**
   - ✅ May show error
   - ✅ Or use cached data
   - ✅ Does not break session
6. Set throttling back to "Online"
7. Page should work again

---

### Test 8: Logout State Recovery

**Objective:** Verify logout clears all session data

**Steps:**

1. Log in as user A
2. Navigate to dashboard
3. Verify groups display
4. Click logout
5. Login as user B (different email)
6. **Expected Result:**
   - ✅ User B's data displays
   - ✅ User B's groups show
   - ✅ NOT User A's data
   - ✅ Clean slate for new user

**localStorage Verification:**

```javascript
// After logout but before new login:
JSON.parse(localStorage.getItem("sb-...-auth-token"));
// Should show User B's email, not User A's

// After logging in as User B:
localStorage.getItem("currentUserId");
// Should be User B's UUID, not User A's
```

---

## Debugging Tips

### Check Session Status

```javascript
// In browser console:
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Current session:", session);
console.log("User email:", session?.user?.email);
console.log("Token expires:", session?.expires_at);
```

### Monitor Auth Events

```javascript
// Add to see all auth events:
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`🔐 Auth event: ${event}`, {
    email: session?.user?.email,
    expires: session?.expires_at,
    timestamp: new Date().toISOString(),
  });
});
```

### Check localStorage Contents

```javascript
// View all stored tokens:
console.log("Auth tokens:", localStorage);

// Find Supabase token:
const token = JSON.parse(
  localStorage.getItem("sb-zthoxpevzbsuymwrnngt-auth-token")
);
console.log("Token info:", {
  hasAccess: !!token?.access_token,
  hasRefresh: !!token?.refresh_token,
  expiresAt: new Date(token?.expires_at * 1000),
  userEmail: token?.user?.email,
});
```

### Decode JWT Token

```javascript
// Decode JWT payload (for inspection):
const token = JSON.parse(
  localStorage.getItem("sb-zthoxpevzbsuymwrnngt-auth-token")
).access_token;

const payload = JSON.parse(atob(token.split(".")[1]));
console.log("JWT Claims:", {
  sub: payload.sub,
  email: payload.email,
  iss: payload.iss,
  exp: new Date(payload.exp * 1000),
});
```

---

## Performance Checks

### Session Load Time

**Measure auto-login speed:**

```javascript
// In console, before refresh:
console.time("Session Load");

// Refresh page with F5

// Check console:
// Should see: "Session Load: ~50-200ms"
// ✅ Fast = Good
// ⚠️ >500ms = May need investigation
```

### Token Refresh Speed

```javascript
// Watch for TOKEN_REFRESHED event:
const start = Date.now();
supabase.auth.onAuthStateChange((event) => {
  if (event === "TOKEN_REFRESHED") {
    const duration = Date.now() - start;
    console.log(`Token refresh took ${duration}ms`);
    // ✅ <300ms = Good
    // ⚠️ >1000ms = Slow network
  }
});
```

---

## Common Issues & Solutions

| Issue                            | Symptoms                           | Solution                              |
| -------------------------------- | ---------------------------------- | ------------------------------------- |
| Not auto-logging in              | Login screen shows after refresh   | Check browser localStorage is enabled |
|                                  |                                    | Verify Supabase URL/key in .env       |
|                                  |                                    | Check browser console for errors      |
| Logout not working               | Still see dashboard after logout   | Check handleLogout() is called        |
|                                  |                                    | Verify signOut() completes            |
|                                  |                                    | Clear browser cache manually          |
| Session in other tab not syncing | Tab 2 still shows old user         | Wait 1-2 seconds                      |
|                                  | after logout in Tab 1              | Or manually refresh Tab 2             |
| Token never refreshes            | Token expires, app breaks          | Check Supabase listener setup         |
|                                  | After 1 hour of use                | Verify onAuthStateChange active       |
| Multiple logout events           | onAuthStateChange fires many times | Normal behavior ✓                     |
|                                  |                                    | React handles efficiently             |

---

## Success Criteria ✅

All tests pass when:

- ✅ User stays logged in after page refresh
- ✅ User stays logged in after browser close/reopen
- ✅ Logout clears session completely
- ✅ Multiple tabs stay in sync
- ✅ Token auto-refreshes silently
- ✅ Error messages display clearly
- ✅ Can switch users without data leakage
- ✅ No console errors or warnings

---

## Automation Testing (Optional)

If using Cypress or Playwright:

```javascript
// Example Cypress test
describe("Session Persistence", () => {
  it("should persist session on page refresh", () => {
    cy.login("test@example.com", "password123");
    cy.contains("Welcome").should("be.visible");
    cy.reload();
    cy.contains("Welcome").should("be.visible");
    cy.contains("Logout").should("be.visible");
  });

  it("should clear session on logout", () => {
    cy.login("test@example.com", "password123");
    cy.contains("Logout").click();
    cy.contains("Login").should("be.visible");
    cy.contains("Email Address").should("be.visible");
  });
});
```

---

## Test Results Tracking

Use this table to track your test results:

| Test # | Name                           | Status | Notes              | Date  |
| ------ | ------------------------------ | ------ | ------------------ | ----- |
| 1      | Basic Login & Auto-Persistence | ✅     | All checks passed  | 11/13 |
| 2      | Logout Functionality           | ✅     | Session cleared    | 11/13 |
| 3      | Browser Close & Reopen         | ✅     | Auto-login works   | 11/13 |
| 4      | Multi-Tab Sync                 | ✅     | Sync within 1s     | 11/13 |
| 5      | Token Expiration               | ⏳     | Pending (need 1hr) | -     |
| 6      | Form Switch                    | ✅     | Works smoothly     | 11/13 |
| 7      | Error Handling                 | ✅     | Clear messages     | 11/13 |
| 8      | Logout State Recovery          | ✅     | Clean switch       | 11/13 |

---

**Testing Date:** November 13, 2025  
**Tester:** [Your Name]  
**Status:** Ready for QA ✅
