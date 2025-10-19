-- =====================================================
-- EMERGENCY FIX - DISABLE HISTORY TRIGGER TEMPORARILY
-- =====================================================
-- Purpose: Allow appointments to be created without history
-- Use this ONLY if other fixes don't work
-- Remember to re-enable history tracking later!
-- =====================================================

-- Simply drop the trigger - appointments will work without history
DROP TRIGGER IF EXISTS appointment_status_change_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_history();

-- =====================================================
-- RESULT
-- =====================================================
-- ✅ Appointments can now be created
-- ⚠️ History will NOT be tracked until trigger is restored
-- ⚠️ This is a TEMPORARY solution for immediate functionality
-- =====================================================

-- To check if it worked, try creating an appointment.
-- It should succeed now without any trigger errors.

-- =====================================================
-- TO RESTORE HISTORY TRACKING LATER
-- =====================================================
-- Run one of these files when ready:
-- 1. simple_fix_appointment_history_trigger.sql (recommended)
-- 2. fix_appointment_history_trigger_debug.sql (if debugging needed)
-- =====================================================
