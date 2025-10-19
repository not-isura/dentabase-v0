-- =====================================================
-- MANUAL APPOINTMENT UPDATE HELPER
-- =====================================================
-- Use these queries when manually updating appointments
-- to ensure history is properly tracked
-- =====================================================

-- =====================================================
-- SCENARIO 1: Dentist Proposes New Time
-- =====================================================
-- This simulates what the dentist UI will do

-- Step 1: Update the appointment
UPDATE appointments 
SET 
  status = 'proposed',
  proposed_start_time = '2025-10-25T14:00:00+08:00',
  proposed_end_time = '2025-10-25T15:00:00+08:00'
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- Step 2: The trigger automatically creates history with related_time!
-- No manual insert needed anymore ✅

-- =====================================================
-- SCENARIO 2: Patient Accepts Proposed Time
-- =====================================================

-- Update the appointment to booked status
UPDATE appointments 
SET 
  status = 'booked',
  booked_start_time = proposed_start_time,  -- Copy proposed time
  booked_end_time = proposed_end_time
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- Trigger automatically creates history ✅

-- =====================================================
-- SCENARIO 3: Mark Patient as Arrived
-- =====================================================

UPDATE appointments 
SET status = 'arrived'
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- =====================================================
-- SCENARIO 4: Start Appointment (Ongoing)
-- =====================================================

UPDATE appointments 
SET status = 'ongoing'
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- =====================================================
-- SCENARIO 5: Complete Appointment
-- =====================================================

UPDATE appointments 
SET status = 'completed'
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- =====================================================
-- SCENARIO 6: Cancel Appointment
-- =====================================================

UPDATE appointments 
SET status = 'cancelled'
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- =====================================================
-- VIEW HISTORY AFTER UPDATES
-- =====================================================

-- See all history for an appointment
SELECT 
  status,
  changed_at,
  related_time as start_time,
  related_end_time as end_time,
  CASE 
    WHEN related_time IS NOT NULL AND related_end_time IS NOT NULL 
    THEN related_end_time - related_time
    ELSE NULL
  END as duration,
  notes
FROM appointment_status_history
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE'
ORDER BY changed_at DESC; -- Latest first

-- Expected output (newest to oldest):
-- status    | changed_at           | start_time           | end_time             | duration | notes
-- ----------|----------------------|----------------------|----------------------|----------|---------------------------
-- booked    | 2025-10-18 15:00:00 | 2025-10-25 14:00:00 | 2025-10-25 15:00:00 | 01:00:00 | Status updated to booked
-- proposed  | 2025-10-18 14:30:00 | 2025-10-25 14:00:00 | 2025-10-25 15:00:00 | 01:00:00 | Status updated to proposed
-- requested | 2025-10-18 10:00:00 | 2025-10-20 10:00:00 | 2025-10-20 11:00:00 | 01:00:00 | Initial appointment request

-- =====================================================
-- CLEANUP (FOR TESTING)
-- =====================================================

-- Reset appointment to requested status
UPDATE appointments 
SET 
  status = 'requested',
  proposed_start_time = NULL,
  proposed_end_time = NULL,
  booked_start_time = NULL,
  booked_end_time = NULL
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE';

-- Clear history for clean testing
DELETE FROM appointment_status_history 
WHERE appointment_id = 'YOUR-APPOINTMENT-ID-HERE'
AND status != 'requested';  -- Keep the initial request

-- =====================================================
-- GET APPOINTMENT ID FOR TESTING
-- =====================================================

-- Find your most recent appointment
SELECT 
  appointment_id,
  status,
  requested_start_time,
  proposed_start_time,
  booked_start_time
FROM appointments
WHERE patient_id = (
  SELECT patient_id FROM patient 
  WHERE user_id = (
    SELECT user_id FROM users 
    WHERE email = 'your-email@example.com'
  )
)
ORDER BY created_at DESC
LIMIT 1;
