# Register Page - Testing Guide

## ✅ What Was Built

### **Complete Patient Registration System**
- ✅ 2-step registration form (Personal Info → Contact & Emergency)
- ✅ All required database fields included
- ✅ Smart email verification detection
- ✅ Password strength validation
- ✅ Password match confirmation
- ✅ Professional UI matching login page
- ✅ Error handling and validation

### **Features Implemented:**

**Step 1: Personal Information**
- Email address (required)
- First name (required)
- Middle name (optional)
- Last name (required)
- Gender (dropdown: male, female, other, prefer not to say)
- Password (min 8 characters, with strength indicator)
- Confirm password (with match indicator)

**Step 2: Contact & Emergency**
- Phone number (optional, with format hint)
- Address (required, textarea for complete address)
- Emergency contact name (required)
- Emergency contact number (required)

**Smart Features:**
- Real-time password validation (✓ Strong / ⚠ Weak)
- Real-time password match check (✓ Match / ✗ Don't match)
- Step validation (can't proceed without required fields)
- Auto-detects if email verification is enabled
- Handles both verification scenarios automatically

---

## 🧪 Test Scenarios

### **Test 1: Complete Registration (Email Verification DISABLED)**

**Prerequisites:** Email verification is DISABLED in Supabase

**Steps:**
1. Go to `http://localhost:3000/register`
2. **Step 1 - Fill Personal Info:**
   - Email: `newpatient@test.com`
   - First Name: `Alice`
   - Middle Name: `Marie` (optional)
   - Last Name: `Johnson`
   - Gender: `Female`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
3. Click **"Next: Contact Details →"**
4. **Step 2 - Fill Contact Info:**
   - Phone: `09123456789` (or leave empty)
   - Address: `123 Main Street, Barangay Centro, Manila, Metro Manila`
   - Emergency Contact Name: `Robert Johnson`
   - Emergency Contact No: `09987654321`
5. Click **"Create Account"**

**Expected Result:**
- ✅ "Creating Account..." button shows (loading state)
- ✅ Console logs:
  ```
  ✅ Auth account created: [UUID]
  ✅ User profile created: [UUID]
  ✅ Patient record created
  ✅ Registration successful! No email verification required.
  ```
- ✅ **Automatically redirected to `/dashboard`**
- ✅ User is logged in immediately
- ✅ Dashboard shows with user data

**Why:** No email verification = instant login after registration

---

### **Test 2: Complete Registration (Email Verification ENABLED)**

**Prerequisites:** Email verification is ENABLED in Supabase

**Steps:**
1. Same as Test 1 (fill all forms)
2. Click "Create Account"

**Expected Result:**
- ✅ "Creating Account..." button shows
- ✅ Console logs:
  ```
  ✅ Auth account created: [UUID]
  ✅ User profile created: [UUID]
  ✅ Patient record created
  📧 Email verification required. Verification email sent to: newpatient@test.com
  ```
- ✅ **Redirected to `/login` page**
- ✅ Blue info alert shows:
  ```
  ℹ️ Registration successful! Please check your email to verify 
     your account before logging in.
  ```
- ✅ Check email inbox → Verification email received
- ✅ Click verification link in email
- ✅ Email verified, can now login normally

**Why:** Email verification enabled = must verify before login

---

### **Test 3: Password Validation**

**Steps:**
1. Go to register page
2. In Password field, type: `weak`
3. Observe indicator

**Expected Result:**
- ⚠ Warning text shows: "⚠ Password must be at least 8 characters"
- Text is amber/yellow color

**Steps continued:**
4. Type: `StrongPass123!`

**Expected Result:**
- ✓ Success text shows: "✓ Strong password"
- Text is green color

---

### **Test 4: Password Match Validation**

**Steps:**
1. Password: `SecurePass123!`
2. Confirm Password: `WrongPassword`

**Expected Result:**
- ✗ Error text shows: "✗ Passwords do not match"
- Text is red color
- Cannot proceed to Step 2

**Steps continued:**
3. Confirm Password: `SecurePass123!` (correct)

**Expected Result:**
- ✓ Success text shows: "✓ Passwords match"
- Text is green color
- Can proceed to Step 2

---

### **Test 5: Step Validation**

**Steps:**
1. Fill only Email and First Name
2. Leave Last Name empty
3. Try to click "Next: Contact Details →"

**Expected Result:**
- ❌ Error message shows: "Please fill in all required fields"
- Stays on Step 1
- Cannot proceed

**Fix:**
4. Fill all required fields
5. Click "Next"

**Expected Result:**
- ✅ Advances to Step 2

---

### **Test 6: Back Button**

**Steps:**
1. Complete Step 1
2. Go to Step 2
3. Click "Back" button

**Expected Result:**
- ✅ Returns to Step 1
- ✅ All Step 1 data is preserved (email, names, password still filled)
- ✅ No data loss

---

### **Test 7: Duplicate Email**

**Steps:**
1. Register with email: `patient1@test.com` (already exists)
2. Fill all other fields
3. Submit

**Expected Result:**
- ❌ Error alert shows:
  ```
  Registration Failed
  User already registered
  ```
- Red error box at top of form
- Stays on register page

---

### **Test 8: Database Verification**

**After successful registration**, check Supabase tables:

**1. Check `auth.users` table:**
```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'newpatient@test.com';
```

**Expected:**
- ✅ Record exists
- ✅ `email_confirmed_at` is NULL (if verification enabled) or has timestamp (if disabled)

**2. Check `users` table:**
```sql
SELECT * FROM users WHERE auth_id = '[auth_id_from_above]';
```

**Expected:**
- ✅ Record exists
- ✅ `first_name`: Alice
- ✅ `middle_name`: Marie
- ✅ `last_name`: Johnson
- ✅ `phone_number`: +63123456789 (normalized)
- ✅ `gender`: female
- ✅ `role`: patient
- ✅ `status`: active

**3. Check `patient` table:**
```sql
SELECT * FROM patient WHERE user_id = '[user_id_from_above]';
```

**Expected:**
- ✅ Record exists
- ✅ `address`: 123 Main Street, Barangay Centro, Manila, Metro Manila
- ✅ `emergency_contact_name`: Robert Johnson
- ✅ `emergency_contact_no`: +639987654321 (normalized)

---

### **Test 9: Gender Dropdown**

**Steps:**
1. Click Gender dropdown

**Expected Options:**
- ✅ Prefer not to say (default selected)
- ✅ Male
- ✅ Female
- ✅ Other

**Select each option** → Should update correctly

---

### **Test 10: Optional vs Required Fields**

**Required Fields (marked with red *):**
- Email Address
- First Name
- Last Name
- Password
- Confirm Password
- Address
- Emergency Contact Name
- Emergency Contact Number

**Optional Fields:**
- Middle Name
- Gender (defaults to "Prefer not to say")
- Phone Number

**Test:** Try to submit without required fields → Should show error

---

## 🎨 UI/UX Expectations

### **Visual Design:**
- ✅ Purple theme matching login page
- ✅ 2-column layout (max-width: 2xl for more space)
- ✅ Logo and branding at top
- ✅ Step indicator shows "Step 1 of 2" or "Step 2 of 2"
- ✅ Required fields marked with red asterisk (*)
- ✅ Password toggle icons (eye/eye-off)
- ✅ Gradient background matching login page

### **Form Behavior:**
- ✅ Fields are disabled when loading
- ✅ Button shows "Creating Account..." during submission
- ✅ Error messages are clear and helpful
- ✅ Validation feedback is real-time
- ✅ Back button works without data loss

### **Responsive Design:**
- ✅ Works on mobile (single column on small screens)
- ✅ Works on tablet (2 columns maintained)
- ✅ Works on desktop (full layout)

---

## ✅ Success Criteria

**ALL of these should be true:**

✅ Registration completes successfully  
✅ Data appears in all 3 tables (auth.users, users, patient)  
✅ Password validation works correctly  
✅ Password match check works correctly  
✅ Step navigation works (Next/Back buttons)  
✅ Required field validation prevents submission  
✅ Email verification detection works (auto-login or email message)  
✅ Duplicate email shows proper error  
✅ Phone numbers are normalized to +63 format (if trigger exists)  
✅ Gender dropdown has all 4 options  
✅ Emergency contact section clearly labeled  
✅ "Already have account?" link goes to login  
✅ Privacy Policy and Terms links exist (footer)  
✅ UI matches login page styling  
✅ No console errors  

---

## 🐛 Common Issues & Fixes

**Issue:** "Failed to create user profile: permission denied"
- **Cause:** RLS policies blocking INSERT
- **Fix:** Check RLS policies on `users` table, ensure authenticated users can INSERT

**Issue:** "Failed to create patient record: foreign key violation"
- **Cause:** `user_id` doesn't exist in `users` table
- **Fix:** Check Step 2 insert logic, ensure `userData.user_id` is correct

**Issue:** Phone number not normalized
- **Cause:** Phone normalization trigger not set up
- **Fix:** Create trigger or normalize in application code

**Issue:** Email verification email not received
- **Cause:** Email provider settings in Supabase
- **Fix:** Check Supabase → Authentication → Email Templates

**Issue:** Can't login after registration (with verification enabled)
- **Cause:** Email not verified yet
- **Fix:** Check inbox, click verification link, then try login

---

## 📝 Report Your Results

After testing, please share:

1. ✅ Which tests PASSED
2. ❌ Which tests FAILED (with error messages)
3. 🗄️ Database verification results
4. 📧 Email verification status (enabled/disabled in your Supabase)
5. 🐛 Any unexpected behavior
6. 💡 UI/UX feedback

**Example Report:**
- Test 1: ✅ PASSED - Registration successful, auto-logged in
- Test 3: ✅ PASSED - Password validation works perfectly
- Test 7: ❌ FAILED - Duplicate email shows generic error
- Test 8: ✅ PASSED - All data in database correct
- Email verification: DISABLED
- Phone normalization: Not working (no trigger)

---

## 🎯 Next Steps

After successful testing:
1. **If you want email verification:** Enable it in Supabase, test again
2. **Phone normalization:** Create trigger if needed
3. **RLS policies:** Ensure patients can INSERT their own records
4. **Profile Page:** Next todo item to build!

---

**Ready to test?** Start with Test 1 (basic registration)! 🚀
