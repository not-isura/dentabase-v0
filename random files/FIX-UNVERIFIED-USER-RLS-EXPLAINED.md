# Fix: RLS Policy Issue with Unverified Users

## The Problem You Discovered ✅

You correctly identified the issue:

1. **With Email Verification Enabled:**
   - User signs up → Creates `auth.users` record
   - User is **NOT logged in** yet (session exists but unverified)
   - `auth.uid()` returns **NULL** for unverified users
   - RLS policy checks `auth_id = auth.uid()` → `auth_id = NULL` ❌ FAILS
   - Result: Cannot insert into `users` table

2. **The Data Flow Should Be:**
   ```
   Sign Up → Create auth record → Insert user data (even if unverified) → Send verification email → User verifies → Can log in
   ```

3. **The Issue with Simple RLS Policies:**
   - RLS policies with `auth.uid()` only work for **logged-in, verified users**
   - During registration, the user isn't fully logged in yet
   - This creates a chicken-and-egg problem

## The Solution: Database Function with SECURITY DEFINER 🔐

Instead of using direct INSERT with RLS, we use a **PostgreSQL function** that:
- Runs with elevated privileges (`SECURITY DEFINER`)
- Bypasses RLS during registration
- Is still secure because it only accepts specific parameters
- Can be called by both authenticated and anonymous users

## Implementation Steps

### Step 1: Run the SQL (Supabase Dashboard → SQL Editor)

Copy and paste the entire `FIX-REGISTRATION-RLS-FINAL.sql` file content and run it.

This will:
1. ✅ Drop the old problematic policies
2. ✅ Create `create_user_profile()` function that bypasses RLS
3. ✅ Create new policies for SELECT/UPDATE (for logged-in users)
4. ✅ Grant execute permission to authenticated and anonymous users

### Step 2: Updated Code (Already Done ✅)

I've already updated your `register/page.tsx` to use the database function:

**Old Code (Direct INSERT - doesn't work for unverified users):**
```typescript
await supabase.from("users").insert({ ... })
await supabase.from("patient").insert({ ... })
```

**New Code (Database Function - works for unverified users):**
```typescript
await supabase.rpc("create_user_profile", {
  p_auth_id: authData.user.id,
  p_first_name: firstName.trim(),
  // ... other params
})
```

### Step 3: Test Registration

Try registering again with a **new email**:

**Test User:**
- Email: `newtest@example.com`
- Password: `TestPass123!`
- Fill all required fields
- Click "Create Account"

**Expected Behavior:**

**If Email Verification is ENABLED:**
1. ✅ Account created successfully
2. ✅ User data inserted into `users` and `patient` tables (even though unverified)
3. ✅ "Please check your email to verify..." message appears
4. ✅ User is logged out
5. ✅ User checks email and clicks verification link
6. ✅ User can now log in with the verified account

**If Email Verification is DISABLED:**
1. ✅ Account created successfully
2. ✅ User data inserted into `users` and `patient` tables
3. ✅ User is automatically logged in
4. ✅ Redirected to dashboard

### Step 4: Verify in Database

Run these queries to confirm the data was inserted:

```sql
-- Check auth.users (should exist, email_confirmed_at might be NULL if unverified)
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'newtest@example.com';

-- Check users table (should exist even if email is unverified)
SELECT user_id, auth_id, first_name, last_name, role, status, created_at
FROM users 
WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'newtest@example.com');

-- Check patient table (should exist)
SELECT patient_id, user_id, address, emergency_contact_name, created_at
FROM patient 
WHERE user_id = (SELECT user_id FROM users WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'newtest@example.com'));
```

All three queries should return data ✅ (even if email is unverified)

## Why This Solution is Better

### Security ✅
- Function parameters are validated
- Only specific data can be inserted (role is hardcoded to 'patient')
- No SQL injection possible (uses parameterized queries)
- Anonymous users can only create their own profile (auth_id is from auth.user.id)

### Flexibility ✅
- Works with email verification **enabled or disabled**
- Handles both verified and unverified users
- Single atomic operation (both tables inserted in one transaction)

### Error Handling ✅
- Function returns JSON with success/error status
- Better error messages
- Rollback on failure (transaction safety)

## Common Questions

### Q: Is it secure to allow anonymous users to call this function?
**A:** Yes! The function:
- Only accepts specific parameters (no SQL injection)
- Hardcodes `role = 'patient'` (users can't make themselves admin)
- Uses the `auth_id` from Supabase Auth (can't impersonate others)
- Is atomic (both inserts succeed or both fail)

### Q: What if I want to add more fields later?
**A:** Simply update the function signature and the INSERT statements. The function acts as an API endpoint.

### Q: Can I use this approach for other tables?
**A:** Yes! You can create similar functions for other registration flows (e.g., `create_doctor_profile`, `create_staff_profile`).

### Q: What about updating user data?
**A:** The regular RLS policies handle SELECT/UPDATE for **logged-in users**. This function is only for initial registration.

## Troubleshooting

### Error: "function public.create_user_profile does not exist"
**Fix:** Run the SQL from `FIX-REGISTRATION-RLS-FINAL.sql` again

### Error: "permission denied for function create_user_profile"
**Fix:** Run this:
```sql
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;
```

### Error: Still getting RLS policy violation
**Fix:** Make sure you dropped the old INSERT policies:
```sql
DROP POLICY IF EXISTS "Allow authenticated users to insert their own user record" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own patient record" ON patient;
```

## Next Steps

Once registration works:
1. ✅ Test with a new email
2. ✅ Verify email (if verification enabled)
3. ✅ Log in with the new account
4. ✅ Check that you can see your own data
5. ✅ Move on to building the Profile Page 🎉

## Summary

You were **100% correct** in your analysis! The RLS policies don't work for unverified users because `auth.uid()` is NULL. The solution is to use a database function with `SECURITY DEFINER` that bypasses RLS during registration, while maintaining security through parameterized inputs and hardcoded role assignment.
