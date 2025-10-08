# 🧪 Login & Logout Testing Guide

## ✅ What Was Implemented

### 1. Login Page (`/login`)
- ✅ Email/password authentication with Supabase
- ✅ Role-based redirects after login
- ✅ Error handling with user-friendly messages
- ✅ Loading states during authentication

### 2. Logout Functionality
- ✅ Integrated in navbar dropdown (UserProfile component)
- ✅ Calls `supabase.auth.signOut()` to clear session
- ✅ Redirects to `/login` after logout
- ✅ Prevents double-click with loading state

---

## 🚀 How to Test

### Test 1: Login as Patient
1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `patient1@test.com`
   - Password: `Test123!`
3. Click "Sign In"
4. **Expected Result**: Redirects to `/dashboard`

### Test 2: Login as Doctor
1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `doctor1@test.com`
   - Password: `Test123!`
3. Click "Sign In"
4. **Expected Result**: Redirects to `/appointments`

### Test 3: Login as Dental Staff
1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `staff1@test.com`
   - Password: `Test123!`
3. Click "Sign In"
4. **Expected Result**: Redirects to `/appointments`

### Test 4: Verify Session Created
After logging in:
1. Visit `http://localhost:3000/test-middleware`
2. **Expected Result**: Shows active session with your email
3. Look for cookies starting with `sb-*` in the list

### Test 5: Check RLS Working
After logging in:
1. Visit `http://localhost:3000/test-rls`
2. **Expected Result**: Shows your user data (not empty!)
3. Should display your name, role, email

### Test 6: Test Logout
1. While logged in, click on your profile in the navbar (top-right)
2. Dropdown menu appears
3. Click "Sign Out" (red button at bottom)
4. **Expected Result**: 
   - Console shows "✅ Logged out successfully"
   - Redirects to `/login`
   - Session cleared

### Test 7: Verify Session Cleared
After logging out:
1. Visit `http://localhost:3000/test-middleware`
2. **Expected Result**: Shows "No active session" or empty session
3. Supabase cookies should be cleared

### Test 8: Test Invalid Credentials
1. Go to `http://localhost:3000/login`
2. Enter wrong credentials:
   - Email: `test@test.com`
   - Password: `wrongpassword`
3. Click "Sign In"
4. **Expected Result**: 
   - Red error box appears
   - Shows "Invalid login credentials"
   - Form stays on page (doesn't redirect)

---

## 🔍 What to Check in Console

### On Successful Login:
```
✅ Login successful: { role: 'patient', first_name: 'Maria' }
```

### On Logout:
```
✅ Logged out successfully
```

### On Login Error:
```
❌ Login error: Error: Invalid login credentials
```

---

## 📝 All Test Accounts

| Email | Password | Role | Redirects To |
|-------|----------|------|--------------|
| patient1@test.com | Test123! | patient | /dashboard |
| patient2@test.com | Test123! | patient | /dashboard |
| doctor1@test.com | Test123! | doctor | /appointments |
| doctor2@test.com | Test123! | doctor | /appointments |
| staff1@test.com | Test123! | dental_staff | /appointments |
| staff2@test.com | Test123! | dental_staff | /appointments |

---

## 🐛 Troubleshooting

### Problem: Login button stays in "Signing in..." state
- **Cause**: Network error or Supabase connection issue
- **Solution**: Check browser console for errors, verify `.env.local` keys

### Problem: Redirects to wrong page after login
- **Cause**: Role in database doesn't match expected values
- **Solution**: Check `users` table, verify role is exactly: `patient`, `doctor`, `dental_staff`, or `admin`

### Problem: Logout doesn't clear session
- **Cause**: Cookie settings or middleware issue
- **Solution**: Check browser DevTools → Application → Cookies, manually clear `sb-*` cookies

### Problem: Error shows only in console, not on page
- **Cause**: This is normal! Console errors are for debugging
- **Solution**: Error should ALSO appear in red box on the page. If not, check if error state is being set.

---

## ✨ Code Flow Explained

### Login Flow:
```
1. User enters email/password
   ↓
2. Call supabase.auth.signInWithPassword()
   ↓
3. If success, query users table for role
   ↓
4. Redirect based on role (switch statement)
   ↓
5. Router.refresh() to update session state
```

### Logout Flow:
```
1. User clicks "Sign Out" in dropdown
   ↓
2. Call supabase.auth.signOut()
   ↓
3. Clear Supabase session cookies
   ↓
4. Redirect to /login
   ↓
5. Router.refresh() to clear cached data
```

---

## 🎯 Next Steps After Testing

Once login/logout is working:

1. ✅ **Add Route Protection** - Redirect unauthenticated users to `/login`
2. ✅ **Build Register Page** - Let patients self-register
3. ✅ **Build Profile Page** - Let users view/edit their data
4. ✅ **Dynamic UserProfile** - Show actual logged-in user's name/email (not hardcoded "Dr. Sarah Wilson")

---

## 💡 Tips

- Use browser's **Incognito/Private mode** to test logout thoroughly
- Check **Network tab** in DevTools to see Supabase API calls
- Look for **sb-*-auth-token** cookie to verify session exists
- Use `/test-rls` page to verify RLS policies are working correctly
