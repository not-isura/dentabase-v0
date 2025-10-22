-- =====================================================
-- FIX RLS POLICY: Add 'cancelled' to Staff/Dentist Allowed Statuses
-- =====================================================
-- Issue: Staff and dentists cannot insert 'cancelled' status into history
-- Solution: Add 'cancelled' to the allowed status arrays for staff and dentists
-- =====================================================

ALTER POLICY "Authenticated users can insert appointment history"
ON "public"."appointment_status_history"
TO public
WITH CHECK (
    -- User must be the one creating the history entry
    (
        EXISTS (
            SELECT 1
            FROM users u
            WHERE u.auth_id = auth.uid() 
            AND u.user_id = appointment_status_history.changed_by_user_id
        )
    ) 
    AND 
    (
        -- PATIENT: Can insert requested, booked, cancelled
        (
            EXISTS (
                SELECT 1
                FROM appointments a
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                WHERE a.appointment_id = appointment_status_history.appointment_id
                AND u.auth_id = auth.uid()
                AND appointment_status_history.status = ANY (
                    ARRAY['requested', 'booked', 'cancelled']
                )
            )
        )
        OR
        -- DOCTOR: Can insert proposed, booked, arrived, ongoing, completed, rejected, cancelled
        (
            EXISTS (
                SELECT 1
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE a.appointment_id = appointment_status_history.appointment_id
                AND u.auth_id = auth.uid()
                AND appointment_status_history.status = ANY (
                    ARRAY['proposed', 'booked', 'arrived', 'ongoing', 'completed', 'rejected', 'cancelled']
                )
            )
        )
        OR
        -- STAFF: Can insert proposed, booked, arrived, ongoing, completed, rejected, cancelled
        (
            EXISTS (
                SELECT 1
                FROM appointments a
                JOIN staff s ON a.doctor_id = s.doctor_id
                JOIN users u ON s.user_id = u.user_id
                WHERE a.appointment_id = appointment_status_history.appointment_id
                AND u.auth_id = auth.uid()
                AND appointment_status_history.status = ANY (
                    ARRAY['proposed', 'booked', 'arrived', 'ongoing', 'completed', 'rejected', 'cancelled']
                )
            )
        )
        OR
        -- ADMIN: Can insert any status
        (
            EXISTS (
                SELECT 1
                FROM users u
                WHERE u.auth_id = auth.uid()
                AND u.role = 'admin'
            )
        )
    )
);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if the policy was updated successfully:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'appointment_status_history'
AND policyname = 'Authenticated users can insert appointment history';

-- =====================================================
-- SUMMARY OF CHANGES
-- =====================================================
-- ✅ Added 'cancelled' to DOCTOR allowed statuses
-- ✅ Added 'cancelled' to STAFF allowed statuses
-- ✅ PATIENT already had 'cancelled' (no change needed)
-- ✅ ADMIN can insert any status (no change needed)
-- =====================================================
