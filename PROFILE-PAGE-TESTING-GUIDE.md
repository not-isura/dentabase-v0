# Profile Page Testing Guide

## Overview
The Profile Page displays user information and allows patients to edit their contact details. Different user roles see different information based on their permissions.

## Features Implemented

### ✅ For All Users (Read-Only)
- Email address (from auth)
- Full name (first, middle, last)
- Gender
- Account role
- Account creation date
- Account status

### ✅ For Patient Users (Editable)
- Phone number
- Address
- Emergency contact name
- Emergency contact number

### ✅ Security Features
- RLS policies ensure users can only view/edit their own data
- Email cannot be changed (requires auth system changes)
- Basic info (name, gender) is read-only (set during registration)
- Edit mode with Cancel/Save buttons
- Loading states and error handling

## Test Scenarios

### Test 1: View Profile as Patient
**Steps:**
1. Log in with a patient account (e.g., patient1@test.com or newly registered account)
2. Navigate to Profile page (click profile icon in navbar or go to /profile)
3. Verify all fields display correctly:
   - Email shows correct address
   - Name fields show first, middle (or N/A), last name
   - Gender shows correct value
   - Role shows "Patient"
   - Member since shows creation date
   - Phone number shows if available
   - Address shows complete address
   - Emergency contact details show

**Expected Result:**
- ✅ All patient data displays correctly
- ✅ Basic info fields are disabled (gray background)
- ✅ Contact info fields are disabled initially
- ✅ "Edit Profile" button is visible

---

### Test 2: Edit Profile as Patient
**Steps:**
1. Log in as patient
2. Go to Profile page
3. Click "Edit Profile" button
4. Verify fields become editable:
   - Phone number field is enabled
   - Address textarea is enabled
   - Emergency contact fields are enabled
5. Make changes to editable fields
6. Click "Save Changes"

**Expected Result:**
- ✅ "Edit Profile" button changes to "Cancel" and "Save Changes"
- ✅ Editable fields become active (white background)
- ✅ Read-only fields remain disabled
- ✅ Button shows "Saving..." during save
- ✅ Success message appears: "Profile updated successfully!"
- ✅ Page reloads with updated data
- ✅ Edit mode turns off automatically
- ✅ Success message disappears after 3 seconds

---

### Test 3: Cancel Editing
**Steps:**
1. Log in as patient
2. Go to Profile page
3. Click "Edit Profile"
4. Make changes to fields
5. Click "Cancel" button

**Expected Result:**
- ✅ All changes are reverted to original values
- ✅ Edit mode turns off
- ✅ "Edit Profile" button reappears
- ✅ No data is saved to database

---

### Test 4: Validation - Required Fields
**Steps:**
1. Log in as patient
2. Go to Profile page
3. Click "Edit Profile"
4. Clear the address field (leave empty)
5. Try to click "Save Changes"

**Expected Result:**
- ✅ "Save Changes" button is disabled
- ✅ Cannot save with empty required fields (address, emergency contact name/number)
- ✅ Phone number can be empty (optional field)

---

### Test 5: View Profile as Dentist/Staff
**Steps:**
1. Log in with dentist account (doctor1@test.com) or staff account (staff1@test.com)
2. Navigate to Profile page

**Expected Result:**
- ✅ Basic information card shows correctly
- ✅ Contact information card shows message: "Additional profile settings for dentist/dental staff accounts will be available soon"
- ✅ No "Edit Profile" button (not implemented for these roles yet)

---

### Test 6: RLS Policy Check
**Steps:**
1. Log in as patient1
2. Open browser DevTools → Console
3. Try to manually query another user's data:
   ```javascript
   const supabase = createClient();
   const { data } = await supabase.from('users').select('*');
   console.log(data); // Should only show patient1's data
   ```

**Expected Result:**
- ✅ Only the logged-in user's data is returned
- ✅ RLS prevents viewing other users' data

---

### Test 7: Loading State
**Steps:**
1. Log in as patient
2. Navigate to Profile page
3. Observe loading state (might need to throttle network in DevTools)

**Expected Result:**
- ✅ Skeleton loaders show while data is loading
- ✅ Page smoothly transitions from loading to loaded state
- ✅ No content flash

---

### Test 8: Error Handling
**Steps:**
1. Log in as patient
2. Disconnect internet or block Supabase requests
3. Navigate to Profile page

**Expected Result:**
- ✅ Error message displays: "Failed to Load Profile"
- ✅ "Try Again" button appears
- ✅ Clicking "Try Again" reloads the profile

---

### Test 9: Update with Invalid Data
**Steps:**
1. Log in as patient
2. Go to Profile page
3. Click "Edit Profile"
4. Enter invalid phone format (e.g., "abc123")
5. Click "Save Changes"

**Expected Result:**
- ✅ Data is saved (no frontend validation for phone format yet)
- ✅ Database trigger normalizes phone number format (if trigger exists)
- ✅ Success message shows
- ✅ Check database to verify phone_number was normalized

---

### Test 10: Multiple Sessions
**Steps:**
1. Log in as patient1 in Browser 1
2. Go to Profile page
3. Open Browser 2 (incognito), log in as same patient1
4. Edit profile in Browser 1 and save
5. Refresh Browser 2's profile page

**Expected Result:**
- ✅ Browser 2 shows updated data after refresh
- ✅ Both sessions see the same data
- ✅ No conflicts or stale data

---

## Database Verification Queries

After making profile updates, verify in Supabase SQL Editor:

### Check users table update
```sql
SELECT user_id, first_name, last_name, phone_number, updated_at
FROM users
WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'your-test-email@example.com');
```

### Check patient table update
```sql
SELECT p.patient_id, p.address, p.emergency_contact_name, p.emergency_contact_no, p.updated_at
FROM patient p
JOIN users u ON p.user_id = u.user_id
WHERE u.auth_id = (SELECT id FROM auth.users WHERE email = 'your-test-email@example.com');
```

### Check updated_at timestamp
```sql
-- The updated_at field should change after each update
SELECT user_id, first_name, updated_at
FROM users
WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'your-test-email@example.com');

-- Check if trigger is working (updated_at should be recent)
SELECT NOW() as current_time, updated_at, 
       EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM users
WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'your-test-email@example.com');
```

---

## Success Criteria Checklist

After testing, verify:

- [ ] Profile loads correctly for patient users
- [ ] All fields display accurate data from database
- [ ] Edit mode enables only editable fields
- [ ] Save button works and updates database
- [ ] Success message appears after save
- [ ] Cancel button reverts changes without saving
- [ ] Required field validation prevents empty saves
- [ ] Loading state shows during data fetch
- [ ] Error handling works when offline
- [ ] Non-patient users see appropriate message
- [ ] RLS prevents unauthorized data access
- [ ] updated_at timestamp changes after updates
- [ ] Data persists across sessions
- [ ] No console errors during normal operation

---

## Common Issues & Fixes

### Issue 1: "Failed to load user profile: Row level security policy"
**Cause:** RLS policy doesn't allow SELECT for authenticated users  
**Fix:** Add RLS policy:
```sql
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());
```

### Issue 2: "Failed to update profile: Row level security policy"
**Cause:** RLS policy doesn't allow UPDATE for authenticated users  
**Fix:** Add RLS policy:
```sql
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());
```

### Issue 3: Email shows "Loading..." or "Not available"
**Cause:** Need to fetch email from auth.users table  
**Fix:** Add email fetch in loadUserProfile():
```typescript
const { data: { user } } = await supabase.auth.getUser();
// user.email contains the email
```

### Issue 4: updated_at doesn't change after update
**Cause:** Trigger not working or doesn't exist  
**Fix:** Create trigger:
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

---

## Next Steps After Testing

Once profile page is fully tested:
1. ✅ Mark "Build Profile Page" as completed in todo list
2. ✅ Update navbar to show real user name (fetch from users table)
3. ✅ Add profile picture upload feature (future enhancement)
4. ✅ Add password change functionality (future enhancement)
5. ✅ Extend profile editing for dentist/staff roles
6. ✅ Move on to next feature: Appointments system

---

## Report Template

Use this template to report test results:

**Date Tested:** [Date]  
**Tested By:** [Name]  
**Browser:** [Chrome/Firefox/Edge]  

**Test Results:**
- Test 1 (View Profile): ✅ Pass / ❌ Fail - [Notes]
- Test 2 (Edit Profile): ✅ Pass / ❌ Fail - [Notes]
- Test 3 (Cancel Editing): ✅ Pass / ❌ Fail - [Notes]
- Test 4 (Validation): ✅ Pass / ❌ Fail - [Notes]
- Test 5 (Other Roles): ✅ Pass / ❌ Fail - [Notes]
- Test 6 (RLS Check): ✅ Pass / ❌ Fail - [Notes]
- Test 7 (Loading State): ✅ Pass / ❌ Fail - [Notes]
- Test 8 (Error Handling): ✅ Pass / ❌ Fail - [Notes]
- Test 9 (Invalid Data): ✅ Pass / ❌ Fail - [Notes]
- Test 10 (Multiple Sessions): ✅ Pass / ❌ Fail - [Notes]

**Issues Found:**
1. [Describe issue]
2. [Describe issue]

**Overall Status:** ✅ Ready for Production / ⚠️ Needs Fixes / ❌ Major Issues
