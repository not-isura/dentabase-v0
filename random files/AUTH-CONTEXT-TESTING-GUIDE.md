# 🧪 Auth Context Testing Guide

## ✅ Phase 1 Complete!

You've successfully created the Auth Context infrastructure:
- ✅ `src/types/auth.types.ts` - TypeScript types
- ✅ `src/contexts/AuthContext.tsx` - Auth Context with Provider
- ✅ `src/hooks/useAuth.ts` - Custom hook
- ✅ `src/app/layout.tsx` - Wrapped with AuthProvider
- ✅ `src/components/auth-test-component.tsx` - Visual test component

---

## 🎯 How to Verify Auth Context Works

### **Step 1: Open Your Browser Console**
1. Open your app in browser: http://localhost:3000
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab
4. Keep this open during testing

### **Step 2: Login to Your App**
1. Navigate to `/login`
2. Login with your test account:
   - Email: `patient1@test.com`
   - Password: `Test123!`

### **Step 3: Watch the Console Logs** 👀

You should see these logs appear in order:

```
🚀 [AuthContext] Initializing Auth Context...
👂 [AuthContext] Subscribing to auth state changes...
🔄 [AuthContext] Fetching user profile...
✅ [AuthContext] Auth user found: patient1@test.com
✅ [AuthContext] User profile loaded: { name: "John Doe", role: "patient", email: "patient1@test.com" }
🔄 [AuthContext] Fetching patient profile...
✅ [AuthContext] Patient profile loaded
```

**✅ If you see these logs = Auth Context is working!**

---

### **Step 4: Navigate to Settings Page**
1. Click on **Settings** in the sidebar
2. You should see a **purple test component** at the top of the page
3. The test component should display:
   - ✅ Loading State: "Loaded" with green checkmark
   - ✅ Authenticated: "Yes" with green checkmark
   - ✅ Your email address
   - ✅ Your full name
   - ✅ Your role (patient)
   - ✅ Your phone number
   - ✅ Patient profile data (address, emergency contact)

---

### **Step 5: Test Refresh Functionality**
1. Click the **"Refresh User Data"** button in the test component
2. Watch the console logs
3. You should see:
   ```
   🔄 [AuthContext] Manually refreshing user data...
   🔄 [AuthContext] Fetching user profile...
   ✅ [AuthContext] User profile loaded: { ... }
   ```

**✅ If refresh works = Auth Context refresh functionality is working!**

---

### **Step 6: Test Auth State Subscription**
1. Open a new tab with your app
2. In the first tab, click **Logout**
3. Watch the console in both tabs
4. You should see:
   ```
   🔔 [AuthContext] Auth state changed: SIGNED_OUT
   👋 [AuthContext] User signed out, clearing context...
   ```

**✅ If both tabs react to logout = Auth state subscription is working!**

---

## 🎨 Visual Verification Checklist

### **In the Test Component, verify:**

- [ ] **Loading State**
  - Shows "Loaded" with green checkmark (not spinning)

- [ ] **Authentication State**
  - Shows "Yes" with green checkmark

- [ ] **User Profile Data**
  - Email is correct
  - Name is correct (first, middle, last)
  - Role shows "patient" in purple badge
  - Phone number displays (or "Not set")
  - Gender displays
  - Status shows "active" in green badge

- [ ] **Patient Profile Data** (if logged in as patient)
  - Address displays (or "Not set")
  - Emergency contact name displays (or "Not set")
  - Emergency contact number displays

- [ ] **Refresh Button**
  - Button is enabled (not disabled)
  - Clicking shows "Refreshing..." briefly
  - Console logs appear after clicking

---

## 🐛 Troubleshooting

### **Problem 1: No Console Logs Appear**

**Possible causes:**
- Browser console filters are active
- AuthProvider not wrapped correctly

**Solution:**
1. Check console filters (should show "All levels")
2. Verify `src/app/layout.tsx` has `<AuthProvider>` wrapper
3. Refresh the page (Ctrl + R)

---

### **Problem 2: "useAuth must be used within AuthProvider" Error**

**Cause:** Component is trying to use `useAuth()` outside of AuthProvider

**Solution:**
- This shouldn't happen since we wrapped the entire app
- If it does, check that `layout.tsx` has the AuthProvider wrapper
- Make sure you're testing in a route under `(dashboard)`

---

### **Problem 3: Test Component Shows "No user data found"**

**Possible causes:**
- Not logged in
- Database query failed
- RLS policies blocking access

**Solution:**
1. Make sure you're logged in
2. Check console for error messages
3. Look for red ❌ logs in console
4. Verify database connection

---

### **Problem 4: Patient Profile Shows "No patient profile found"**

**Possible causes:**
- User is not a patient
- Patient record doesn't exist in database

**Solution:**
1. Check that logged-in user has `role='patient'`
2. Verify `patient` table has a record for this user
3. Check RLS policies on `patient` table

---

## ✅ Success Criteria

Auth Context is working correctly if:

1. ✅ Console logs appear when app loads
2. ✅ Console logs show "User profile loaded"
3. ✅ Test component displays user data correctly
4. ✅ Refresh button works and shows console logs
5. ✅ Logout clears user data (console shows "User signed out")
6. ✅ Login fetches user data again (console shows "Fetching user profile")

---

## 🎯 What's Next?

Once you verify Auth Context works:

### **Option 1: Continue to Phase 2** (Recommended)
- Update navbar to show real user name
- Remove "Dr. Sarah Wilson" hardcoded data
- Add personalized welcome to dashboard

### **Option 2: Remove Test Component**
If you want to clean up first:
1. Remove `<AuthTestComponent />` from `src/app/(dashboard)/settings/page.tsx`
2. Remove the import: `import { AuthTestComponent } from "@/components/auth-test-component";`
3. (Optional) Delete `src/components/auth-test-component.tsx`

---

## 📝 Testing with Different User Roles

Test with different accounts to verify role-based data:

### **Test as Patient:**
```
Email: patient1@test.com
Password: Test123!

Expected:
- Role badge: "patient"
- Patient profile section should appear
- Address and emergency contact data
```

### **Test as Dentist:**
```
Email: doctor1@test.com
Password: Test123!

Expected:
- Role badge: "dentist"
- No patient profile section
- Only user profile data
```

### **Test as Staff:**
```
Email: staff1@test.com
Password: Test123!

Expected:
- Role badge: "dental_staff"
- No patient profile section
- Only user profile data
```

---

## 🎉 Summary

You now have a working Auth Context that:
- ✅ Fetches user data on app load
- ✅ Provides user data to all components via `useAuth()` hook
- ✅ Subscribes to auth state changes (login/logout)
- ✅ Provides refresh functionality
- ✅ Handles loading and error states
- ✅ Supports all user roles
- ✅ Fetches patient profile for patients

**This is a solid foundation for all future features!** 🚀

---

## 🗑️ Cleanup After Testing

Once everything works, remember to:
1. Remove the test component from settings page
2. Remove the import statement
3. (Optional) Delete the test component file
4. Remove this testing guide (or keep for reference)

---

## 💬 Questions?

If something doesn't work:
1. Check the console logs
2. Look for error messages (red ❌)
3. Verify you're logged in
4. Check database connection
5. Review the troubleshooting section above

**Let me know what you see and I'll help debug!** 🚀
