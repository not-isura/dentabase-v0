-- =====================================================
-- APPOINTMENT STATUS HISTORY TABLE
-- =====================================================
-- Purpose: Track all status changes for appointments with complete audit trail
-- Created: 2025-10-18
-- Author: Dentabase Development Team
-- 
-- This table maintains an immutable history of all appointment status changes,
-- including who made the change, when it was made, and optional notes.
-- This enables full audit trails and proper status tracking across the 
-- appointment lifecycle.
-- =====================================================

-- =====================================================
-- TABLE: appointment_status_history
-- =====================================================
-- Stores every status transition for appointments
-- Related tables: appointments, users
-- =====================================================

CREATE TABLE appointment_status_history (
  -- Primary key
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to appointments table
  appointment_id UUID NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  
  -- Status value (restricted to valid appointment statuses)
  status TEXT NOT NULL CHECK (status IN (
    'requested',   -- Initial request from patient
    'proposed',    -- Dentist proposes alternative time
    'booked',      -- Appointment confirmed
    'arrived',     -- Patient has arrived at clinic
    'ongoing',     -- Appointment in progress
    'completed',   -- Appointment finished
    'cancelled',   -- Cancelled by patient or staff
    'rejected'     -- Rejected by dentist/staff
  )),
  
  -- User who made this status change
  changed_by_user_id UUID NOT NULL REFERENCES users(user_id),
  
  -- When the status change occurred
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional notes explaining the change
  notes TEXT,
  
  -- Proposed alternative time (only used when status = 'proposed')
  proposed_time TIMESTAMPTZ,
  
  -- Record creation timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Optimize common queries

-- Index for fetching all history entries for a specific appointment
CREATE INDEX idx_history_appointment ON appointment_status_history(appointment_id);

-- Index for sorting by change time (most recent first)
CREATE INDEX idx_history_changed_at ON appointment_status_history(changed_at DESC);

-- Index for filtering by status
CREATE INDEX idx_history_status ON appointment_status_history(status);

-- =====================================================
-- COMMENTS / DOCUMENTATION
-- =====================================================

COMMENT ON TABLE appointment_status_history IS 
'Immutable audit trail of all appointment status changes with user attribution and timestamps';

COMMENT ON COLUMN appointment_status_history.history_id IS 
'Unique identifier for each history entry';

COMMENT ON COLUMN appointment_status_history.appointment_id IS 
'Reference to the appointment this history entry belongs to';

COMMENT ON COLUMN appointment_status_history.status IS 
'The status that the appointment transitioned to';

COMMENT ON COLUMN appointment_status_history.changed_by_user_id IS 
'User who initiated this status change (patient, doctor, or staff)';

COMMENT ON COLUMN appointment_status_history.changed_at IS 
'Timestamp when the status change occurred';

COMMENT ON COLUMN appointment_status_history.notes IS 
'Optional explanation or context for the status change';

COMMENT ON COLUMN appointment_status_history.proposed_time IS 
'Alternative time proposed by dentist (only used when status = proposed)';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICY: SELECT (READ ACCESS)
-- =====================================================
-- Who can read history:
-- 1. Patients can view history for their own appointments
-- 2. Doctors can view history for appointments assigned to them
-- 3. Staff can view history for appointments of their assigned doctor
-- 4. Admin can view all appointment history
-- =====================================================

CREATE POLICY "Users can view appointment history if authorized"
ON appointment_status_history
FOR SELECT
USING (
  -- Patient can view their own appointment history
  EXISTS (
    SELECT 1 FROM appointments a
    INNER JOIN patient p ON a.patient_id = p.patient_id
    INNER JOIN users u ON p.user_id = u.user_id
    WHERE a.appointment_id = appointment_status_history.appointment_id
    AND u.auth_id = auth.uid()
  )
  OR
  -- Doctor can view appointments assigned to them
  EXISTS (
    SELECT 1 FROM appointments a
    INNER JOIN doctors d ON a.doctor_id = d.doctor_id
    INNER JOIN users u ON d.user_id = u.user_id
    WHERE a.appointment_id = appointment_status_history.appointment_id
    AND u.auth_id = auth.uid()
  )
  OR
  -- Staff can view appointments for their assigned doctor only
  EXISTS (
    SELECT 1 FROM appointments a
    INNER JOIN staff s ON a.doctor_id = s.doctor_id
    INNER JOIN users u ON s.user_id = u.user_id
    WHERE a.appointment_id = appointment_status_history.appointment_id
    AND u.auth_id = auth.uid()
  )
  OR
  -- Admin can view all history
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_id = auth.uid()
    AND u.role = 'admin'
  )
);

-- =====================================================
-- RLS POLICY: INSERT (CREATE NEW HISTORY ENTRIES)
-- =====================================================
-- Who can create history:
-- 1. Patients can create history for: requested, booked, cancelled
-- 2. Doctors can create history for: proposed, booked, arrived, ongoing, completed, rejected
-- 3. Staff can create history for: proposed, booked, arrived, ongoing, completed, rejected
--    (but only for their assigned doctor's appointments)
-- 4. Admin can create any history entry
-- 
-- Constraint: User must be creating history for themselves (changed_by_user_id)
-- =====================================================

CREATE POLICY "Authenticated users can insert appointment history"
ON appointment_status_history
FOR INSERT
WITH CHECK (
  -- User must be inserting history with their own user_id
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_id = auth.uid()
    AND u.user_id = changed_by_user_id
  )
  AND
  (
    -- PATIENT: Can insert for their own appointments
    -- Allowed statuses: requested, booked, cancelled
    EXISTS (
      SELECT 1 FROM appointments a
      INNER JOIN patient p ON a.patient_id = p.patient_id
      INNER JOIN users u ON p.user_id = u.user_id
      WHERE a.appointment_id = appointment_status_history.appointment_id
      AND u.auth_id = auth.uid()
      AND appointment_status_history.status IN ('requested', 'booked', 'cancelled')
    )
    OR
    -- DOCTOR: Can insert for their assigned appointments
    -- Allowed statuses: proposed, booked, arrived, ongoing, completed, rejected
    EXISTS (
      SELECT 1 FROM appointments a
      INNER JOIN doctors d ON a.doctor_id = d.doctor_id
      INNER JOIN users u ON d.user_id = u.user_id
      WHERE a.appointment_id = appointment_status_history.appointment_id
      AND u.auth_id = auth.uid()
      AND appointment_status_history.status IN ('proposed', 'booked', 'arrived', 'ongoing', 'completed', 'rejected')
    )
    OR
    -- STAFF: Can insert for their assigned doctor's appointments only
    -- Allowed statuses: proposed, booked, arrived, ongoing, completed, rejected
    EXISTS (
      SELECT 1 FROM appointments a
      INNER JOIN staff s ON a.doctor_id = s.doctor_id
      INNER JOIN users u ON s.user_id = u.user_id
      WHERE a.appointment_id = appointment_status_history.appointment_id
      AND u.auth_id = auth.uid()
      AND appointment_status_history.status IN ('proposed', 'booked', 'arrived', 'ongoing', 'completed', 'rejected')
    )
    OR
    -- ADMIN: Can insert any status for any appointment
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'admin'
    )
  )
);

-- =====================================================
-- RLS POLICY: UPDATE (MODIFY HISTORY)
-- =====================================================
-- History should be immutable for audit integrity
-- Only admin can update in case of data entry errors
-- =====================================================

CREATE POLICY "Only admin can update appointment history"
ON appointment_status_history
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_id = auth.uid()
    AND u.role = 'admin'
  )
);

-- =====================================================
-- RLS POLICY: DELETE (REMOVE HISTORY)
-- =====================================================
-- History should be immutable for audit integrity
-- Only admin can delete in case of critical errors
-- =====================================================

CREATE POLICY "Only admin can delete appointment history"
ON appointment_status_history
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_id = auth.uid()
    AND u.role = 'admin'
  )
);

-- =====================================================
-- AUTOMATIC HISTORY TRACKING
-- =====================================================
-- Trigger function to automatically create history entries
-- when appointments are created or status is updated
-- =====================================================

CREATE OR REPLACE FUNCTION create_appointment_history()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
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
    INSERT INTO appointment_status_history (
      appointment_id,
      status,
      changed_by_user_id,
      notes
    ) VALUES (
      NEW.appointment_id,
      NEW.status,
      current_user_id,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Initial appointment request'
        ELSE 'Status updated to ' || NEW.status
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-create history on appointment changes
-- =====================================================

CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();

-- =====================================================
-- PERMISSIONS
-- =====================================================
-- Grant necessary permissions to authenticated users
-- (RLS policies will further restrict access)
-- =====================================================

GRANT SELECT ON appointment_status_history TO authenticated;
GRANT INSERT ON appointment_status_history TO authenticated;
GRANT UPDATE ON appointment_status_history TO authenticated;
GRANT DELETE ON appointment_status_history TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next steps:
-- 1. Update frontend code to fetch and display history
-- 2. Implement dentist/staff interface for status updates
-- 3. Test the automatic history creation trigger
-- =====================================================
