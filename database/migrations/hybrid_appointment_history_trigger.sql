-- =====================================================
-- HYBRID APPROACH - APPOINTMENT HISTORY TRIGGER
-- =====================================================
-- Purpose: Smart trigger that auto-creates history for simple status changes,
--          but allows manual insertion for actions requiring custom notes
-- Strategy: Skip auto-insertion when feedback/notes are being added manually
-- Created: 2025-10-22
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- =====================================================
-- HYBRID TRIGGER FUNCTION
-- =====================================================
-- This version:
-- 1. Auto-creates history for simple status changes (arrived, ongoing, completed)
-- 2. Skips auto-creation for statuses that need custom notes (proposed, rejected, cancelled)
-- 3. Uses SECURITY DEFINER to bypass RLS
-- =====================================================

CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  time_snapshot TIMESTAMPTZ;
  skip_auto_insert BOOLEAN := FALSE;
BEGIN
  -- Check if we should skip auto-insertion based on status
  -- These statuses are handled manually in the frontend with custom notes:
  -- - 'proposed': Accept appointment with custom feedback
  -- - 'rejected': Reject with reason
  -- - 'cancelled': Cancel with reason
  IF NEW.status IN ('proposed', 'rejected', 'cancelled') THEN
    -- Check if feedback was just added (indicates manual handling)
    IF (TG_OP = 'UPDATE' AND 
        ((OLD.feedback IS NULL AND NEW.feedback IS NOT NULL) OR 
         (OLD.feedback_type IS NULL AND NEW.feedback_type IS NOT NULL))) THEN
      skip_auto_insert := TRUE;
    END IF;
  END IF;

  -- If we should skip auto-insert, return early
  IF skip_auto_insert THEN
    RETURN NEW;
  END IF;

  -- Try to get the user_id from the current authenticated user
  SELECT user_id INTO current_user_id
  FROM users
  WHERE auth_id = auth.uid()
  LIMIT 1;

  -- If user lookup fails, use a fallback system user ID
  IF current_user_id IS NULL THEN
    -- Get the first admin user as fallback, or use NULL
    SELECT user_id INTO current_user_id
    FROM users
    WHERE role = 'admin'
    LIMIT 1;
  END IF;

  -- Only create history if we have a user_id
  IF current_user_id IS NOT NULL THEN
    -- Check if we should create history
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

      -- Insert history with error handling
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
            WHEN NEW.status = 'arrived' THEN 'You have checked in. Please wait to be called.'
            WHEN NEW.status = 'ongoing' THEN 'Your appointment is now in progress.'
            WHEN NEW.status = 'completed' THEN 'Your appointment has been completed. Thank you for visiting!'
            WHEN NEW.status = 'booked' THEN 'Your appointment has been confirmed.'
            ELSE 'Status updated to ' || NEW.status
          END,
          time_snapshot
        );
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the appointment insert
          RAISE WARNING 'Failed to create appointment history: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  -- Always return NEW to allow the appointment insert to succeed
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Catch any unexpected errors
    RAISE WARNING 'Trigger function unexpected error: %', SQLERRM;
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
GRANT EXECUTE ON FUNCTION create_appointment_history() TO anon;
GRANT EXECUTE ON FUNCTION create_appointment_history() TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the hybrid approach:

-- 1. Simple status change (should auto-create history):
-- UPDATE appointments SET status = 'arrived' WHERE appointment_id = 'YOUR_ID';

-- 2. Check if history was auto-created:
-- SELECT * FROM appointment_status_history WHERE appointment_id = 'YOUR_ID' ORDER BY changed_at DESC;

-- 3. Status with feedback (should skip auto-creation, manual insert needed):
-- UPDATE appointments SET status = 'rejected', feedback = 'Not available', feedback_type = 'rejected' WHERE appointment_id = 'YOUR_ID';

-- =====================================================
-- HYBRID APPROACH COMPLETE ✅
-- =====================================================
-- Auto-creates history for: requested, booked, arrived, ongoing, completed
-- Manual insertion required for: proposed, rejected, cancelled (with custom notes)
-- Trigger skips when feedback/feedback_type is set during status change
-- =====================================================
