# Fix Registration RLS Policy Issue

## Problem
**Error:** `Failed to create user profile: new row violates row-level security policy for table "users"`

## Root Cause
When a user registers:
1. `supabase.auth.signUp()` creates a record in `auth.users` table ✅
2. The user is now authenticated with a session ✅
3. Your app tries to INSERT into `users` table ❌
4. RLS policy blocks the INSERT because the policy expects an existing user record (chicken-and-egg problem)

## Solution
Add RLS policies that allow authenticated users to INSERT their initial records.

## Steps to Fix

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and run the SQL from `FIX-REGISTRATION-RLS-POLICY.sql`
3. This will create policies that allow:
   - Authenticated users to INSERT their own user record (WHERE auth_id = auth.uid())
   - Authenticated users to INSERT their own patient record
   - Users to SELECT/UPDATE their own data

### Option 2: Quick Fix (Minimal Policies)

If you want to start simple, run just these two policies:

```sql
-- Allow INSERT into users table during registration
CREATE POLICY "Allow authenticated users to insert their own user record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Allow INSERT into patient table during registration
CREATE POLICY "Allow users to insert their own patient record"
ON patient
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
);
```

### Option 3: Check Existing Policies

Before adding new policies, check what policies already exist:

```sql
-- Check policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Check policies on patient table
SELECT * FROM pg_policies WHERE tablename = 'patient';
```

If you see conflicting policies, you might need to drop them first:

```sql
DROP POLICY IF EXISTS "policy_name_here" ON users;
```

## Verify the Fix

After running the SQL:

1. Try registering a new account with a **new email** (e.g., `testuser123@test.com`)
2. Use password: `TestPass123!` (meets all requirements)
3. Fill out both steps of the form
4. Click "Create Account"
5. You should see either:
   - ✅ "Registration successful! Please check your email..." (if verification enabled)
   - ✅ Redirected to dashboard (if verification disabled)

## Expected Database State After Successful Registration

Run these queries to verify the user was created:

```sql
-- Check auth.users table
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'testuser123@test.com';

-- Check users table
SELECT user_id, auth_id, first_name, last_name, role, status 
FROM users 
WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'testuser123@test.com');

-- Check patient table
SELECT patient_id, user_id, address, emergency_contact_name 
FROM patient 
WHERE user_id = (SELECT user_id FROM users WHERE auth_id = (SELECT id FROM auth.users WHERE email = 'testuser123@test.com'));
```

All three queries should return data ✅

## Common Issues

### Issue 1: "duplicate key value violates unique constraint"
- **Cause:** Email already exists
- **Fix:** Use a different email address

### Issue 2: Still getting RLS error after adding policies
- **Cause:** Policy names conflict or wrong conditions
- **Fix:** Drop all policies and recreate them:
  ```sql
  DROP POLICY IF EXISTS "Users can view own data" ON users;
  DROP POLICY IF EXISTS "Allow authenticated users to insert their own user record" ON users;
  -- Then run the CREATE POLICY statements again
  ```

### Issue 3: "permission denied for table users"
- **Cause:** RLS is not enabled on the table
- **Fix:** Enable RLS:
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
  ```

## Security Notes

The policies created follow the principle of least privilege:
- ✅ Users can only INSERT records where `auth_id = auth.uid()` (their own record)
- ✅ Users can only SELECT/UPDATE their own records
- ✅ No user can access another user's data
- ✅ DELETE is not allowed (add separately if needed)

## Next Steps After Fix

Once registration works:
1. ✅ Test with a new email address
2. ✅ Verify data appears in database
3. ✅ Check that login works with the new account
4. ✅ Move on to building the Profile Page (next todo item)
