-- =====================================================
-- ⚠️ DEPRECATED - DO NOT USE THIS FILE ⚠️
-- =====================================================
-- This file contains a syntax error in the CASE statement
-- Use: fix_appointment_history_trigger.sql instead
-- =====================================================
-- UPDATE APPOINTMENT HISTORY TRIGGER
-- =====================================================
-- Purpose: Update the trigger to include related_time snapshots
-- Created: 2025-10-18
-- Status: DEPRECATED (has bug)
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- =====================================================
-- UPDATED TRIGGER FUNCTION
-- =====================================================
-- Now includes related_time to capture time snapshots
-- =====================================================

CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  time_snapshot TIMESTAMPTZ;
BEGIN
  -- Get the user_id from auth.uid()
  SELECT user_id INTO current_user_id
  FROM users
  WHERE auth_id = auth.uid()
  LIMIT 1;

  -- If we can't find the user, skip history creation
  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create history entry if:
  -- 1. New appointment is being created (INSERT)
  -- 2. Status has actually changed (UPDATE)
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Determine which time to snapshot based on status
    CASE NEW.status
      WHEN 'requested' THEN
        time_snapshot := NEW.requested_start_time;
      WHEN 'proposed' THEN
        time_snapshot := NEW.proposed_start_time;
      WHEN 'booked' THEN
        time_snapshot := NEW.booked_start_time;
      WHEN 'arrived', 'ongoing', 'completed' THEN
        time_snapshot := NEW.booked_start_time;
      ELSE
        time_snapshot := NULL;
    END CASE;

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

-- =====================================================
-- RECREATE TRIGGER
-- =====================================================

CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- The trigger now captures time snapshots:
-- - requested → requested_start_time
-- - proposed → proposed_start_time
-- - booked → booked_start_time
-- - arrived/ongoing/completed → booked_start_time
-- =====================================================
