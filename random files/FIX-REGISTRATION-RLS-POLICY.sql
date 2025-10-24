-- Fix RLS Policy for User Registration
-- This allows newly authenticated users to insert their own record into the users table

-- First, let's check current policies on users table
-- Run this to see what policies exist:
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop existing policies if they're too restrictive (optional, only if needed)
-- DROP POLICY IF EXISTS "Users can view own data" ON users;
-- DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create policy to allow authenticated users to INSERT their own user record
-- This is needed during registration when auth.users exists but users table record doesn't yet
CREATE POLICY "Allow authenticated users to insert their own user record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Create policy to allow users to view their own data
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Note: Make sure RLS is enabled on the users table
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- You should also check the patient table RLS policies:
-- The patient table needs similar policies

CREATE POLICY "Allow users to insert their own patient record"
ON patient
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Patients can view own data"
ON patient
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Patients can update own data"
ON patient
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
);
