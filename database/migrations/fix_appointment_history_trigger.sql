-- =====================================================
-- FIX APPOINTMENT HISTORY TRIGGER
-- =====================================================
-- Purpose: Fix the CASE statement syntax error
-- Issue: Missing END CASE; statement
-- Created: 2025-10-18
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- =====================================================
-- FIXED TRIGGER FUNCTION
-- =====================================================
-- Fixed CASE statement syntax
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

-- =====================================================
-- RECREATE TRIGGER
-- =====================================================

CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION create_appointment_history() TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Fixed Issues:
-- 1. Changed CASE statement to expression form (CASE...END instead of CASE...END CASE)
-- 2. Proper PL/pgSQL syntax for variable assignment
-- 3. Added cancelled/rejected status handling
-- 4. Added GRANT permissions
-- =====================================================
