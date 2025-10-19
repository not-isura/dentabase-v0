# 🚨 QUICK FIX - Appointment Insert Error

## The Problem
Creating appointments fails with error: `Insert error: {}`

## The Cause
Syntax error in the trigger function's CASE statement.

## The Solution (3 Steps)

### 1️⃣ Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project: dentabase-v0
- Navigate to: SQL Editor

### 2️⃣ Run the Fix Script
Copy and paste this entire SQL script:

```sql
-- =====================================================
-- FIX APPOINTMENT HISTORY TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  time_snapshot TIMESTAMPTZ;
BEGIN
  SELECT user_id INTO current_user_id
  FROM users
  WHERE auth_id = auth.uid()
  LIMIT 1;

  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    time_snapshot := CASE NEW.status
      WHEN 'requested' THEN NEW.requested_start_time
      WHEN 'proposed' THEN NEW.proposed_start_time
      WHEN 'booked' THEN NEW.booked_start_time
      WHEN 'arrived' THEN NEW.booked_start_time
      WHEN 'ongoing' THEN NEW.booked_start_time
      WHEN 'completed' THEN NEW.booked_start_time
      WHEN 'cancelled' THEN NEW.requested_start_time
      WHEN 'rejected' THEN NEW.requested_start_time
      ELSE NULL
    END;

    INSERT INTO appointment_status_history (
      appointment_id,
      status,
      changed_by_user_id,
      notes,
      related_time
    ) VALUES (
      NEW.appointment_id,
      NEW.status,
      current_user_id,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial appointment request'
        ELSE 'Status updated to ' || NEW.status
      END,
      time_snapshot
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();

GRANT EXECUTE ON FUNCTION create_appointment_history() TO authenticated;
```

### 3️⃣ Test It
- Go back to your appointment page
- Try creating a new appointment
- Should work now! ✅

## Expected Output After Running Script
```
DROP TRIGGER
DROP FUNCTION
CREATE FUNCTION
CREATE TRIGGER
GRANT
```

## Verify History is Working
Run this query to check:
```sql
SELECT 
  a.appointment_id,
  a.status,
  h.related_time,
  h.notes
FROM appointments a
LEFT JOIN appointment_status_history h ON h.appointment_id = a.appointment_id
ORDER BY a.created_at DESC
LIMIT 5;
```

Should show appointments with matching history entries.

## Files Reference
- ✅ **Use This:** `database/migrations/fix_appointment_history_trigger.sql`
- ❌ **Don't Use:** `database/migrations/update_appointment_history_trigger.sql` (has bug)
- 📖 **Details:** `database/BUG_FIX.md`

## Still Having Issues?
Check:
1. Did you see "CREATE TRIGGER" success message?
2. Is your user logged in properly?
3. Check Supabase Logs for detailed errors

---
**TL;DR:** Run the SQL script in Supabase SQL Editor, then try creating appointment again.
