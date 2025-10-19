-- =====================================================
-- ONE-CLICK DIAGNOSIS
-- =====================================================
-- Run this entire script to get a complete diagnosis
-- Copy all results and share them for troubleshooting
-- =====================================================

\echo '========================================='
\echo '1. TRIGGER STATUS'
\echo '========================================='

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ TRIGGER DOES NOT EXIST'
    WHEN MAX(tgenabled::text) = 'O' THEN '✅ Trigger exists and is enabled'
    ELSE '⚠️ Trigger exists but is disabled'
  END as status
FROM pg_trigger
WHERE tgname = 'appointment_status_change_trigger';

\echo ''
\echo '========================================='
\echo '2. RECENT APPOINTMENTS (Last 3)'
\echo '========================================='

SELECT 
  appointment_id,
  status,
  TO_CHAR(created_at, 'Mon DD HH24:MI:SS') as created,
  concern
FROM appointments
ORDER BY created_at DESC
LIMIT 3;

\echo ''
\echo '========================================='
\echo '3. HISTORY COUNT PER APPOINTMENT'
\echo '========================================='

SELECT 
  a.appointment_id,
  a.status as current_status,
  TO_CHAR(a.created_at, 'Mon DD HH24:MI') as created,
  COUNT(h.history_id) as history_entries,
  CASE 
    WHEN COUNT(h.history_id) = 0 THEN '❌ NO HISTORY'
    ELSE '✅ Has history'
  END as result
FROM appointments a
LEFT JOIN appointment_status_history h ON h.appointment_id = a.appointment_id
GROUP BY a.appointment_id, a.status, a.created_at
ORDER BY a.created_at DESC
LIMIT 5;

\echo ''
\echo '========================================='
\echo '4. COLUMN CHECK'
\echo '========================================='

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'appointment_status_history'
      AND column_name = 'related_time'
    ) THEN '✅ related_time column exists'
    ELSE '❌ related_time column MISSING'
  END as column_status;

\echo ''
\echo '========================================='
\echo '5. RLS POLICIES'
\echo '========================================='

SELECT 
  policyname as policy,
  cmd as for_command,
  CASE 
    WHEN cmd = 'INSERT' THEN '⚠️ Check this policy'
    ELSE 'OK'
  END as note
FROM pg_policies
WHERE tablename = 'appointment_status_history'
ORDER BY cmd;

\echo ''
\echo '========================================='
\echo '6. TOTAL STATISTICS'
\echo '========================================='

SELECT 
  (SELECT COUNT(*) FROM appointments) as total_appointments,
  (SELECT COUNT(*) FROM appointment_status_history) as total_history,
  CASE 
    WHEN (SELECT COUNT(*) FROM appointment_status_history) = 0 THEN '❌ No history ever created'
    WHEN (SELECT COUNT(*) FROM appointment_status_history) < (SELECT COUNT(*) FROM appointments) THEN '⚠️ Some appointments missing history'
    ELSE '✅ All appointments have history'
  END as overall_status;

\echo ''
\echo '========================================='
\echo '7. FUNCTION OWNER & PERMISSIONS'
\echo '========================================='

SELECT 
  p.proname as function_name,
  pg_catalog.pg_get_userbyid(p.proowner) as owner,
  CASE p.prosecdef
    WHEN TRUE THEN '✅ SECURITY DEFINER enabled'
    ELSE '❌ SECURITY DEFINER disabled'
  END as security_mode
FROM pg_proc p
WHERE p.proname = 'create_appointment_history';

\echo ''
\echo '========================================='
\echo 'DIAGNOSIS COMPLETE'
\echo '========================================='
\echo ''
\echo 'Look for ❌ marks above to identify issues'
\echo 'Share all output for detailed troubleshooting'
\echo '========================================='
