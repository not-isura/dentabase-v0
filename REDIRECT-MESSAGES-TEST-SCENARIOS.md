# Custom Redirect Messages - Test Scenarios

## ✅ What Was Implemented

1. **Alert Component** (`src/components/ui/alert.tsx`)
   - Reusable styled message box
   - 4 variants: info (blue), success (green), warning (amber), error (red)
   - Auto-includes icons (ℹ️, ✅, ⚠️, ❌)

2. **RouteGuard Update**
   - Now redirects with message: `/login?message=Please login to continue`

3. **AuthGuard Update**
   - Now redirects with message: `/dashboard?message=You are already logged in`

4. **Login Page Update**
   - Reads `message` parameter from URL
   - Displays blue info alert at top of form
   - Auto-dismisses after 5 seconds

5. **Logout Function Update**
   - Redirects with message: `/login?message=You have been logged out successfully`

6. **Dashboard Message Handler**
   - Client component that shows messages on dashboard pages
   - Auto-dismisses after 5 seconds

---

## 🧪 Test Scenarios

### **Test 1: Logout Success Message**
**Steps:**
1. Log in with `patient1@test.com` / `Test123!`
2. Wait for dashboard to load
3. Click on your profile dropdown (top right)
4. Click "Sign Out"

**Expected Result:**
- ✅ Redirected to `/login` page
- ✅ Blue info alert appears at top: "You have been logged out successfully"
- ✅ Alert auto-dismisses after 5 seconds

**Why:** Logout function adds success message to redirect URL

---

### **Test 2: Protected Route Access (Not Logged In)**
**Steps:**
1. Make sure you're logged out
2. Manually type in browser: `http://localhost:3000/dashboard`
3. Press Enter

**Expected Result:**
- ✅ Redirected to `/login` page
- ✅ Blue info alert appears: "Please login to continue"
- ✅ Alert auto-dismisses after 5 seconds

**Why:** RouteGuard catches unauthenticated access and adds message

---

### **Test 3: Try to Access Login When Already Logged In**
**Steps:**
1. Log in with `patient1@test.com` / `Test123!`
2. Wait for dashboard to load
3. Manually type in browser: `http://localhost:3000/login`
4. Press Enter

**Expected Result:**
- ✅ Redirected to `/dashboard` page
- ✅ Blue info alert appears at top: "You are already logged in"
- ✅ Alert auto-dismisses after 5 seconds

**Why:** AuthGuard prevents authenticated users from seeing login page

---

### **Test 4: Multiple Protected Routes**
**Steps:**
1. Log out completely
2. Try accessing these URLs one by one:
   - `http://localhost:3000/appointments`
   - `http://localhost:3000/patients`
   - `http://localhost:3000/records`
   - `http://localhost:3000/settings`
   - `http://localhost:3000/profile`

**Expected Result:**
- ✅ ALL redirect to `/login`
- ✅ ALL show message: "Please login to continue"
- ✅ Message appears fresh on each redirect (not cached)

**Why:** All dashboard routes are wrapped with RouteGuard

---

### **Test 5: Register Page When Logged In**
**Steps:**
1. Log in with any test account
2. Manually type: `http://localhost:3000/register`
3. Press Enter

**Expected Result:**
- ✅ Redirected to `/dashboard`
- ✅ Blue info alert: "You are already logged in"

**Why:** Register page is in (auth) group with AuthGuard protection

---

### **Test 6: Message Persistence**
**Steps:**
1. Log out to see logout message
2. Wait for 5 seconds (message should disappear)
3. Refresh the page (`F5` or `Ctrl+R`)

**Expected Result:**
- ✅ Message does NOT reappear after refresh
- ✅ Login page shows clean, no alert

**Why:** Message is stored in component state, not in URL after reading. Refresh clears state.

---

### **Test 7: Wrong Credentials vs Protected Route Message**
**Steps:**
1. Log out
2. Go to login page
3. Try login with wrong password: `patient1@test.com` / `wrongpassword`
4. See error message (red alert)
5. Now try accessing `/dashboard` directly in URL

**Expected Result:**
- ✅ After failed login: Red error alert shows
- ✅ After trying `/dashboard`: Blue info alert shows "Please login to continue"
- ✅ Error message is replaced by info message (not both shown)

**Why:** Different message types for different scenarios

---

## 🎨 Visual Expectations

### Message Appearance:
```
┌────────────────────────────────────────┐
│ ℹ️  Please login to continue           │  ← Blue background, blue border
└────────────────────────────────────────┘
```

### Auto-Dismiss Behavior:
- Message appears: **Immediately**
- Message stays: **5 seconds**
- Message fades: **Smoothly** (browser animation)

### Position:
- **Login page**: Above the "Welcome Back" card
- **Dashboard page**: Above the "Overview" heading

---

## ✅ Success Criteria

**ALL of these should be true:**

✅ Logout shows success message  
✅ Protected routes show "login to continue" message  
✅ Login while logged in shows "already logged in" message  
✅ Messages auto-dismiss after 5 seconds  
✅ Messages don't persist after page refresh  
✅ Blue info styling matches site theme  
✅ Icons appear correctly (ℹ️, ✅)  
✅ No console errors  
✅ Messages are readable and helpful  

---

## 🐛 Debugging Tips

**If message doesn't appear:**
1. Check browser console for errors
2. Verify URL has `?message=` parameter in address bar
3. Check if Alert component is imported correctly
4. Make sure you're testing immediately (before 5-second timeout)

**If message doesn't disappear:**
1. Wait full 5 seconds
2. Check browser console for setTimeout errors
3. Try refreshing the page

**If wrong variant appears:**
1. Check which guard/function triggered the redirect
2. Verify variant prop in Alert component call
3. Check Alert component variants in `alert.tsx`

---

## 📝 Report Your Results

After testing, please share:
1. ✅ Which tests PASSED
2. ❌ Which tests FAILED (if any)
3. 🐛 Any unexpected behavior
4. 💡 Suggestions for improvement

**Example:**
- Test 1: ✅ PASSED - Logout message appears perfectly
- Test 2: ✅ PASSED - Protected route message shows
- Test 3: ❌ FAILED - Message shows but doesn't auto-dismiss
- Test 7: ✅ PASSED - Messages switch correctly

---

## 🎯 Next Steps After Testing

If all tests pass, we can move on to:
- **Bonus Feature #3**: Role-based access control
- **Bonus Feature #4**: Return URL after login
- **Build Register Page**
- **Build Profile Page**

---

**Ready to test?** Start with Test 1 (Logout) as it's the easiest to verify! 🚀
