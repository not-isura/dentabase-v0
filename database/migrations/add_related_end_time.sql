-- =====================================================
-- ADD RELATED_END_TIME TO APPOINTMENT HISTORY
-- =====================================================
-- Purpose: Capture full appointment time range (start + end)
-- Created: 2025-10-18
-- =====================================================

-- Add the column
ALTER TABLE appointment_status_history
ADD COLUMN related_end_time TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN appointment_status_history.related_end_time IS 
'Snapshot of the appointment end time when this status change occurred. Used together with related_time to show the full appointment duration.';

-- =====================================================
-- UPDATE TRIGGER TO CAPTURE END TIME
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- Create updated function with end time support
CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  time_snapshot TIMESTAMPTZ;
  end_time_snapshot TIMESTAMPTZ;
BEGIN
  -- Try to get the user_id from the current authenticated user
  SELECT user_id INTO current_user_id
  FROM users
  WHERE auth_id = auth.uid()
  LIMIT 1;

  -- If user lookup fails, use a fallback system user ID
  IF current_user_id IS NULL THEN
    SELECT user_id INTO current_user_id
    FROM users
    WHERE role = 'admin'
    LIMIT 1;
  END IF;

  -- Only create history if we have a user_id
  IF current_user_id IS NOT NULL THEN
    -- Check if we should create history
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
      
      -- Determine which START time to snapshot based on status
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

      -- Determine which END time to snapshot based on status
      end_time_snapshot := CASE NEW.status
        WHEN 'requested' THEN NEW.requested_start_time + INTERVAL '1 hour'  -- Default 1 hour duration
        WHEN 'proposed' THEN NEW.proposed_end_time
        WHEN 'booked' THEN NEW.booked_end_time
        WHEN 'arrived' THEN NEW.booked_end_time
        WHEN 'ongoing' THEN NEW.booked_end_time
        WHEN 'completed' THEN NEW.booked_end_time
        WHEN 'cancelled' THEN NEW.requested_start_time + INTERVAL '1 hour'
        WHEN 'rejected' THEN NEW.requested_start_time + INTERVAL '1 hour'
        ELSE NULL
      END;

      -- Insert history with error handling
      BEGIN
        INSERT INTO appointment_status_history (
          appointment_id,
          status,
          changed_by_user_id,
          notes,
          related_time,
          related_end_time
        ) VALUES (
          NEW.appointment_id,
          NEW.status,
          current_user_id,
          CASE 
            WHEN TG_OP = 'INSERT' THEN 'Initial appointment request'
            ELSE 'Status updated to ' || NEW.status
          END,
          time_snapshot,
          end_time_snapshot
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to create appointment history: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  -- Always return NEW to allow the appointment insert to succeed
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Trigger function unexpected error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_appointment_history() TO authenticated;
GRANT EXECUTE ON FUNCTION create_appointment_history() TO anon;
GRANT EXECUTE ON FUNCTION create_appointment_history() TO service_role;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Changes:
-- 1. Added related_end_time column
-- 2. Updated trigger to capture both start and end times
-- 3. For 'requested' status: defaults to start + 1 hour if no end time
-- 4. For 'proposed': uses proposed_end_time
-- 5. For 'booked/arrived/ongoing/completed': uses booked_end_time
-- =====================================================

-- Test query to verify
-- SELECT 
--   status,
--   related_time as start_time,
--   related_end_time as end_time,
--   related_end_time - related_time as duration
-- FROM appointment_status_history
-- ORDER BY changed_at DESC
-- LIMIT 5;
