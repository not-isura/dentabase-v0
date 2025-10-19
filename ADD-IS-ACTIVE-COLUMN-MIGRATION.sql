-- Migration: Add is_active column to appointments table
-- Purpose: Allow users to dismiss completed/cancelled appointments without deleting them
-- Date: 2025-10-19

-- Step 1: Add the is_active column with default value true
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Step 2: Set existing appointments to active (in case any exist)
UPDATE appointments 
SET is_active = true 
WHERE is_active IS NULL;

-- Step 3: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_is_active 
ON appointments(is_active);

-- Step 4: Create a composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_appointments_patient_active_status 
ON appointments(patient_id, is_active, status);

-- Verification query (run this to check the migration worked):
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'appointments' AND column_name = 'is_active';
