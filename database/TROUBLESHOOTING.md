# 🔧 TROUBLESHOOTING: Appointment Insert Error

## Your Error
```
Insert error: {}
Error submitting appointment: {}
```

## Root Cause Analysis

The empty `{}` error means either:
1. **Trigger is failing** and rolling back the transaction
2. **RLS policy is blocking** the insert
3. **Missing column or constraint** violation
4. **User lookup is failing** in trigger

## Solution Steps (Try in Order)

### 🔴 STEP 1: Run the Simple Fix (Most Likely Solution)

**File:** `database/migrations/simple_fix_appointment_history_trigger.sql`

This version:
- ✅ Has fallback if user lookup fails
- ✅ Won't fail the appointment insert even if history fails
- ✅ Wrapped in exception handlers
- ✅ Grants all necessary permissions

**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire `simple_fix_appointment_history_trigger.sql`
3. Paste and execute
4. Look for: `DROP TRIGGER`, `DROP FUNCTION`, `CREATE FUNCTION`, `CREATE TRIGGER`, `GRANT` (3x)

---

### 🟡 STEP 2: Check Supabase Logs

**Where:** Supabase Dashboard → Logs → Postgres Logs

**Look for:**
- Error messages near the time you tried to create appointment
- Keywords: `ERROR`, `appointment_status_history`, `trigger`, `RLS`

**Common Errors You Might See:**
```sql
-- Syntax error
ERROR: syntax error at or near "CASE"

-- RLS policy blocking
ERROR: new row violates row-level security policy

-- Foreign key violation
ERROR: insert or update on table violates foreign key constraint

-- User not found
WARNING: User lookup returned NULL
```

---

### 🟡 STEP 3: Test Trigger Manually

Run this in Supabase SQL Editor to test the trigger directly:

```sql
-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'appointment_status_change_trigger';

-- Should show: appointment_status_change_trigger | O (enabled)
```

If trigger doesn't exist, re-run the fix script.

---

### 🟡 STEP 4: Test Appointment Insert Manually

```sql
-- Get your patient_id
SELECT 
  p.patient_id,
  u.user_id,
  u.auth_id,
  u.email
FROM patient p
INNER JOIN users u ON p.user_id = u.user_id
WHERE u.email = 'your-email@example.com';  -- Replace with your email

-- Try manual insert (replace IDs)
INSERT INTO appointments (
  patient_id,
  doctor_id,
  requested_start_time,
  status,
  concern
) VALUES (
  'your-patient-id-here',      -- From query above
  'any-doctor-id-here',         -- Any doctor_id from doctors table
  '2024-10-25 10:00:00+08',
  'requested',
  'Test appointment'
);

-- If this works, check history was created:
SELECT 
  h.status,
  h.related_time,
  h.notes,
  h.created_at
FROM appointment_status_history h
WHERE h.appointment_id = (
  SELECT appointment_id 
  FROM appointments 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

**Possible Outcomes:**

#### ✅ Success - Shows history entry
→ Trigger works! Problem is elsewhere (frontend, auth, RLS)

#### ❌ Error: "violates row-level security policy"
→ RLS is blocking. Run this to temporarily disable:
```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history DISABLE ROW LEVEL SECURITY;

-- Try insert again
-- Then RE-ENABLE:
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
```

#### ❌ Error: "foreign key constraint"
→ Your patient_id or doctor_id doesn't exist. Check IDs are valid.

#### ❌ Error: "trigger function error"
→ Trigger has a bug. Check Postgres logs for details.

---

### 🟡 STEP 5: Check Frontend Auth State

Add this debugging to your `handleConfirmAppointment` function (already done):

Look in browser console for:
```
🔍 Looking up user with auth_id: xxxxx
✅ Found user_id: xxxxx
✅ Found patient_id: xxxxx
📝 Submitting appointment: { ... }
```

**If you see "❌ Auth error" or "❌ User lookup error":**
→ User is not authenticated or profile is incomplete

**Fix:**
1. Log out and log back in
2. Check if user exists in `users` table with correct `auth_id`
3. Check if patient record exists linking to user

---

### 🟡 STEP 6: Verify Database Schema

Check if `related_time` column exists:

```sql
-- Check appointment_status_history columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'appointment_status_history'
ORDER BY ordinal_position;
```

Should include:
- `history_id` - uuid
- `appointment_id` - uuid
- `status` - text
- `changed_by_user_id` - uuid
- `changed_at` - timestamp with time zone
- `notes` - text
- `related_time` - timestamp with time zone ← **This must exist!**
- `created_at` - timestamp with time zone

**If `related_time` is missing:**
```sql
-- Add it
ALTER TABLE appointment_status_history
ADD COLUMN related_time TIMESTAMPTZ;
```

---

### 🟡 STEP 7: Check RLS Policies

```sql
-- View all policies on appointment_status_history
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'appointment_status_history';
```

**Problem:** INSERT policy might be too restrictive.

**Temporary Fix:** Drop and recreate INSERT policy:

```sql
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert appointment history" 
ON appointment_status_history;

-- Create simple INSERT policy (TEMPORARY FOR TESTING)
CREATE POLICY "Allow authenticated inserts for testing"
ON appointment_status_history
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow all inserts temporarily

-- Remember to restore proper policy later!
```

---

### 🟡 STEP 8: Test with Improved Error Logging

I've updated your frontend code to log detailed error information. Now when you try to create an appointment, check browser console for:

```json
❌ Insert error details: {
  message: "actual error message here",
  details: "additional context",
  hint: "suggestion to fix",
  code: "error code",
  full: { ...full error object }
}
```

This will tell us exactly what's failing!

---

## Quick Diagnosis Checklist

Run through this checklist:

```
□ Ran simple_fix_appointment_history_trigger.sql in Supabase
□ Saw success messages (DROP/CREATE/GRANT)
□ User is logged in (check auth state in browser)
□ User has patient record (check patient table)
□ Trigger exists (query pg_trigger)
□ related_time column exists (query information_schema.columns)
□ RLS is not blocking (check pg_policies or temporarily disable)
□ Browser console shows detailed error (with new logging)
□ Supabase Postgres logs show any errors
```

---

## Expected Fix Results

### After Running `simple_fix_appointment_history_trigger.sql`:

**Console output should be:**
```
✅ DROP TRIGGER
✅ DROP FUNCTION
✅ CREATE FUNCTION
✅ CREATE TRIGGER
✅ GRANT (3 times)
```

**Creating appointment should show:**
```
🔍 Looking up user with auth_id: xxxxxx
✅ Found user_id: xxxxxx
✅ Found patient_id: xxxxxx
📝 Submitting appointment: { ... }
✅ Appointment request submitted successfully!
```

**History should be created:**
```sql
SELECT * FROM appointment_status_history 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- status: 'requested'
-- related_time: '2024-10-25 10:00:00+08'
-- notes: 'Initial appointment request'
```

---

## Still Not Working?

### Share These Debug Results:

1. **Trigger status:**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'appointment_status_change_trigger';
```

2. **Column exists:**
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'appointment_status_history' 
AND column_name = 'related_time';
```

3. **User lookup:**
```sql
SELECT 
  u.user_id,
  u.auth_id,
  u.email,
  u.role,
  p.patient_id
FROM users u
LEFT JOIN patient p ON p.user_id = u.user_id
WHERE u.email = 'your-email@example.com';
```

4. **Recent errors (from Supabase Postgres Logs):**
   - Copy any ERROR or WARNING messages from past 5 minutes

5. **Browser console output:**
   - Full error object from "❌ Insert error details"

With this information, we can pinpoint the exact issue!

---

## Files Reference

| Priority | File | Purpose |
|----------|------|---------|
| 🔴 | `simple_fix_appointment_history_trigger.sql` | **USE THIS** - Most robust fix |
| 🟡 | `fix_appointment_history_trigger_debug.sql` | Debug version with logging |
| 🟡 | `fix_appointment_history_trigger.sql` | Original fix attempt |
| ❌ | `update_appointment_history_trigger.sql` | Deprecated (has bug) |

---

## Next Action

**Right now, do this:**

1. Open Supabase Dashboard
2. Run `simple_fix_appointment_history_trigger.sql`
3. Try creating appointment again
4. Share the detailed error from browser console
5. Check Supabase Postgres Logs for any ERROR messages

This will either fix it completely, or give us much better diagnostic info! 🚀
