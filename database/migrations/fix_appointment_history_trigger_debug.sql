-- =====================================================
-- FIX APPOINTMENT HISTORY TRIGGER (WITH DEBUG LOGGING)
-- =====================================================
-- Purpose: Fix trigger with enhanced error handling
-- Issue: Better diagnostics for troubleshooting
-- Created: 2025-10-18
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- =====================================================
-- FIXED TRIGGER FUNCTION WITH ERROR HANDLING
-- =====================================================

CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  time_snapshot TIMESTAMPTZ;
BEGIN
  -- Log entry
  RAISE NOTICE 'Trigger fired: operation=%, status=%', TG_OP, NEW.status;

  -- Get the user_id from auth.uid()
  BEGIN
    SELECT user_id INTO current_user_id
    FROM users
    WHERE auth_id = auth.uid()
    LIMIT 1;
    
    RAISE NOTICE 'User lookup: auth_id=%, user_id=%', auth.uid(), current_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error looking up user: %', SQLERRM;
      RETURN NEW;
  END;

  -- If we can't find the user, skip history creation but log it
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'Skipping history: user_id is NULL for auth_id=%', auth.uid();
    RETURN NEW;
  END IF;

  -- Create history entry if:
  -- 1. New appointment is being created (INSERT)
  -- 2. Status has actually changed (UPDATE)
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Determine which time to snapshot based on status
    BEGIN
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
      
      RAISE NOTICE 'Time snapshot determined: status=%, time=%', NEW.status, time_snapshot;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error determining time snapshot: %', SQLERRM;
        time_snapshot := NULL;
    END;

    -- Insert into history table
    BEGIN
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
      
      RAISE NOTICE 'History created successfully for appointment_id=%', NEW.appointment_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create history: % - %', SQLSTATE, SQLERRM;
        -- Don't fail the entire transaction, just log the error
        -- RETURN NEW allows the appointment insert to succeed even if history fails
    END;
  ELSE
    RAISE NOTICE 'Skipping history: status unchanged (%)' , NEW.status;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Trigger function error: % - %', SQLSTATE, SQLERRM;
    -- Return NEW to prevent transaction rollback
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
-- TEST THE TRIGGER
-- =====================================================

-- To see the debug logs, run this after creating an appointment:
-- SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check for any PostgreSQL logs:
-- SELECT * FROM postgres_log ORDER BY log_time DESC LIMIT 10;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Changes:
-- 1. Added extensive RAISE NOTICE logging
-- 2. Wrapped all operations in exception handlers
-- 3. Trigger won't fail transaction even if history fails
-- 4. Better diagnostics for troubleshooting
-- =====================================================
