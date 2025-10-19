-- =====================================================
-- DIAGNOSTIC QUERIES FOR APPOINTMENT HISTORY
-- =====================================================
-- Run these to troubleshoot why history is not being created
-- =====================================================

-- =====================================================
-- 1. CHECK IF TRIGGER EXISTS AND IS ENABLED
-- =====================================================

SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'appointment_status_change_trigger';

-- Expected: 1 row showing trigger enabled (O = origin enabled)
-- If empty: Trigger doesn't exist - run simple_fix script
-- If disabled: Re-enable with ALTER TABLE

-- =====================================================
-- 2. CHECK MOST RECENT APPOINTMENT
-- =====================================================

SELECT 
  appointment_id,
  patient_id,
  doctor_id,
  status,
  requested_start_time,
  concern,
  created_at,
  updated_at
FROM appointments
ORDER BY created_at DESC
LIMIT 1;

-- Copy the appointment_id for next queries

-- =====================================================
-- 3. CHECK IF HISTORY EXISTS FOR RECENT APPOINTMENT
-- =====================================================

-- Replace YOUR-APPOINTMENT-ID with the ID from query #2
SELECT 
  history_id,
  appointment_id,
  status,
  changed_by_user_id,
  changed_at,
  related_time,
  notes,
  created_at
FROM appointment_status_history
WHERE appointment_id = 'YOUR-APPOINTMENT-ID'
ORDER BY changed_at DESC;

-- Expected: At least 1 row for 'requested' status
-- If empty: Trigger failed to create history

-- =====================================================
-- 4. CHECK ALL HISTORY (if specific query returns nothing)
-- =====================================================

SELECT 
  COUNT(*) as total_history_entries,
  MIN(created_at) as oldest_entry,
  MAX(created_at) as newest_entry
FROM appointment_status_history;

-- If count = 0: History table exists but no entries ever created
-- If count > 0: History works for some appointments, check RLS

-- =====================================================
-- 5. CHECK USER WHO CREATED APPOINTMENT
-- =====================================================

-- Find current user's IDs
SELECT 
  u.user_id,
  u.auth_id,
  u.email,
  u.role,
  p.patient_id
FROM users u
LEFT JOIN patient p ON p.user_id = u.user_id
WHERE u.email = 'your-email@example.com'; -- Replace with your email

-- Check if this user_id appears in any history
SELECT COUNT(*) as history_count
FROM appointment_status_history
WHERE changed_by_user_id = 'YOUR-USER-ID'; -- From above query

-- =====================================================
-- 6. CHECK RLS POLICIES ON HISTORY TABLE
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'appointment_status_history'
ORDER BY cmd, policyname;

-- Check if INSERT policy exists and is not too restrictive

-- =====================================================
-- 7. CHECK POSTGRES LOGS FOR WARNINGS
-- =====================================================

-- This query only works if you have log tables enabled
-- Otherwise check Supabase Dashboard > Logs > Postgres Logs

-- Look for messages like:
-- "WARNING: Failed to create appointment history"
-- "WARNING: Trigger function unexpected error"

-- =====================================================
-- 8. MANUALLY TEST TRIGGER FUNCTION
-- =====================================================

-- This tests if the trigger function can be called directly
-- WARNING: This will create a dummy appointment!

-- First, get your patient_id and a valid doctor_id:
SELECT 
  (SELECT patient_id FROM patient WHERE user_id = (
    SELECT user_id FROM users WHERE email = 'your-email@example.com' LIMIT 1
  )) as your_patient_id,
  (SELECT doctor_id FROM doctors LIMIT 1) as any_doctor_id;

-- Then create a test appointment:
INSERT INTO appointments (
  patient_id,
  doctor_id,
  requested_start_time,
  status,
  concern
) VALUES (
  'YOUR-PATIENT-ID',  -- From above
  'ANY-DOCTOR-ID',    -- From above
  '2024-10-25 10:00:00+08',
  'requested',
  'Test appointment to check trigger'
);

-- Check if history was created:
SELECT * FROM appointment_status_history
WHERE appointment_id = (
  SELECT appointment_id FROM appointments 
  WHERE concern = 'Test appointment to check trigger'
  LIMIT 1
)
ORDER BY created_at DESC;

-- Clean up test:
DELETE FROM appointments 
WHERE concern = 'Test appointment to check trigger';

-- =====================================================
-- 9. CHECK IF related_time COLUMN EXISTS
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'appointment_status_history'
AND column_name IN ('related_time', 'proposed_time')
ORDER BY ordinal_position;

-- Expected: related_time column with type 'timestamp with time zone'
-- If missing: Run ALTER TABLE to add it

-- =====================================================
-- 10. TEST RLS MANUALLY
-- =====================================================

-- Check if your user can read from history table
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "YOUR-AUTH-ID"}'; -- Your auth.uid()

SELECT * FROM appointment_status_history LIMIT 1;

-- If this fails with "permission denied" or returns 0 rows when data exists:
-- RLS is blocking reads - check SELECT policy

RESET ROLE;

-- =====================================================
-- COMMON ISSUES & SOLUTIONS
-- =====================================================

-- Issue 1: Trigger doesn't exist
-- Solution: Run simple_fix_appointment_history_trigger.sql

-- Issue 2: History table doesn't exist
-- Solution: Run create_appointment_status_history.sql first

-- Issue 3: related_time column doesn't exist
-- Solution: ALTER TABLE appointment_status_history ADD COLUMN related_time TIMESTAMPTZ;

-- Issue 4: User lookup returns NULL
-- Solution: Check users table has correct auth_id for logged-in user

-- Issue 5: RLS blocking INSERT
-- Solution: Trigger uses SECURITY DEFINER which bypasses RLS
--          If still failing, check function owner has permissions

-- Issue 6: Function throws error but doesn't log
-- Solution: Check Supabase Dashboard > Logs > Postgres Logs for NOTICE/WARNING

-- =====================================================
-- EXPECTED SUCCESSFUL RESULT
-- =====================================================

-- After creating appointment, these should be true:
-- ✅ Query #1: Shows trigger exists and is enabled
-- ✅ Query #2: Shows your appointment with status='requested'
-- ✅ Query #3: Shows history entry with status='requested', related_time set
-- ✅ Query #9: Shows related_time column exists

-- If any ❌ fail, use the solution for that query number above
-- =====================================================
