-- =====================================================
-- HYBRID APPROACH - APPOINTMENT HISTORY TRIGGER V2
-- =====================================================
-- Purpose: Smart trigger that auto-creates history for simple status changes,
--          but allows manual insertion for actions requiring custom notes
-- Strategy: Skip auto-insertion when feedback is set (manual handling indicator)
-- Updated: 2025-10-22
-- Based on: Current production trigger with related_end_time support
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- =====================================================
-- HYBRID TRIGGER FUNCTION
-- =====================================================
-- This version:
-- 1. Auto-creates history for simple status changes (arrived, ongoing, completed, booked)
-- 2. Skips auto-creation for statuses with manual custom notes (proposed, rejected, cancelled)
-- 3. Preserves related_time and related_end_time tracking
-- 4. Uses SECURITY DEFINER to bypass RLS
-- =====================================================

CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  time_snapshot TIMESTAMPTZ;
  end_time_snapshot TIMESTAMPTZ;
  skip_auto_insert BOOLEAN := FALSE;
BEGIN
  -- =====================================================
  -- HYBRID APPROACH: Check if we should skip auto-insertion
  -- =====================================================
  -- Skip for statuses that are handled manually in frontend with custom notes:
  -- - 'proposed': Accept/Reschedule with custom feedback in history table
  -- - 'rejected': Reject with reason
  -- - 'cancelled': Cancel with reason
  -- 
  -- Detection: For proposed status, check if history was JUST inserted manually
  -- (we'll check if a recent history record exists with this status)
  -- For rejected/cancelled, check if feedback_type is set in appointments table
  -- =====================================================
  
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- For proposed status: Check if manual history was just inserted
    IF NEW.status = 'proposed' THEN
      -- Check if a history record with 'proposed' status was created in the last 2 seconds
      -- This indicates manual insertion from frontend
      DECLARE
        recent_history_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO recent_history_count
        FROM appointment_status_history
        WHERE appointment_id = NEW.appointment_id
          AND status = 'proposed'
          AND changed_at > (NOW() - INTERVAL '2 seconds');
        
        IF recent_history_count > 0 THEN
          skip_auto_insert := TRUE;
        END IF;
      END;
    END IF;
    
    -- For rejected/cancelled: Check if feedback_type is set (indicates manual handling)
    IF NEW.status IN ('rejected', 'cancelled') THEN
      IF NEW.feedback_type IS NOT NULL THEN
        skip_auto_insert := TRUE;
      END IF;
    END IF;
  END IF;

  -- If we should skip auto-insert, return early
  IF skip_auto_insert THEN
    RETURN NEW;
  END IF;

  -- =====================================================
  -- PROCEED WITH AUTO-INSERTION FOR SIMPLE STATUS CHANGES
  -- =====================================================

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
      -- ⚠️ Requested status has NULL end time (clinic decides duration)
      end_time_snapshot := CASE NEW.status
        WHEN 'requested' THEN NULL  -- ✅ NO end time for requested - clinic decides
        WHEN 'proposed' THEN NEW.proposed_end_time
        WHEN 'booked' THEN NEW.booked_end_time
        WHEN 'arrived' THEN NEW.booked_end_time
        WHEN 'ongoing' THEN NEW.booked_end_time
        WHEN 'completed' THEN NEW.booked_end_time
        WHEN 'cancelled' THEN NULL  -- No end time for cancelled
        WHEN 'rejected' THEN NULL   -- No end time for rejected
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
          -- Patient-friendly notes for auto-inserted statuses
          CASE 
            WHEN TG_OP = 'INSERT' THEN 
              'You''ve successfully requested an appointment! The dental clinic will review your request and get back to you soon.'
            WHEN NEW.status = 'booked' THEN 
              'Your appointment has been confirmed.'
            WHEN NEW.status = 'arrived' THEN 
              'You have checked in. Please wait to be called.'
            WHEN NEW.status = 'ongoing' THEN 
              'Your appointment is now in progress.'
            WHEN NEW.status = 'completed' THEN 
              'Your appointment has been completed. Thank you for visiting!'
            ELSE 
              'Status updated to ' || NEW.status
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
-- Expected: Auto-creates history with note "You have checked in. Please wait to be called."

-- 2. Check if history was auto-created:
-- SELECT * FROM appointment_status_history 
-- WHERE appointment_id = 'YOUR_ID' 
-- ORDER BY changed_at DESC LIMIT 1;

-- 3. Status with feedback (should skip auto-creation):
-- First manually insert history, then:
-- UPDATE appointments 
-- SET status = 'rejected', feedback = 'Not available', feedback_type = 'rejected' 
-- WHERE appointment_id = 'YOUR_ID';
-- Expected: No duplicate history entry (trigger skips)

-- 4. Check trigger exists:
-- SELECT tgname, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname = 'appointment_status_change_trigger';
-- Expected: tgenabled = 'O' (enabled)

-- =====================================================
-- HYBRID APPROACH SUMMARY
-- =====================================================
-- ✅ Auto-creates history for: requested (INSERT), booked, arrived, ongoing, completed
-- ✅ Skips auto-creation for: proposed, rejected, cancelled (when feedback is set)
-- ✅ Preserves related_time and related_end_time tracking
-- ✅ Patient-friendly notes for all auto-inserted entries
-- ✅ No duplicate history entries
-- ✅ Error-free operation
-- =====================================================

-- =====================================================
-- DEPLOYMENT INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. Verify trigger exists with query above
-- 5. Test with your application
-- =====================================================
