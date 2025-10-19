# Appointment Status History Implementation

## Overview
This document explains the complete implementation of appointment status history tracking with time snapshots.

## Architecture

### Database Tables

#### `appointments` table
Stores current state of each appointment:
- `appointment_id` - Primary key
- `patient_id` - Reference to patient
- `doctor_id` - Reference to dentist
- `status` - Current status (enum: requested, proposed, booked, arrived, ongoing, completed, cancelled, rejected)
- `requested_start_time` - Patient's initial requested time
- `proposed_start_time` - Dentist's proposed alternative time
- `proposed_end_time` - End of dentist's proposal
- `booked_start_time` - Final confirmed appointment start
- `booked_end_time` - Final confirmed appointment end
- `concern` - Patient's dental concern

#### `appointment_status_history` table
Stores complete audit trail with time snapshots:
- `history_id` - Primary key
- `appointment_id` - Reference to appointment
- `status` - Status at this history point
- `changed_by_user_id` - Who made the change
- `changed_at` - When the change occurred
- `notes` - Optional notes about the change
- `related_time` - **Snapshot of the appointment time at this status**
- `created_at` - Record creation timestamp

### Key Concept: Time Snapshots

The `related_time` column captures what appointment time was set when each status change occurred. This prevents data loss if times change multiple times.

**Example Scenario:**
1. Patient requests Oct 20 at 10:00 AM (status: requested)
   - History records: status='requested', related_time='2024-10-20 10:00:00+08'
2. Dentist proposes Oct 25 at 2:00 PM (status: proposed)
   - History records: status='proposed', related_time='2024-10-25 14:00:00+08'
3. Dentist changes mind, proposes Oct 27 at 3:00 PM (status: proposed again)
   - History records: status='proposed', related_time='2024-10-27 15:00:00+08'
4. Patient accepts (status: booked)
   - History records: status='booked', related_time='2024-10-27 15:00:00+08'

Without snapshots, we'd lose Oct 25 proposal in the appointments table.

## Trigger Logic

### Automatic History Creation

The `create_appointment_history()` function automatically creates history entries when:
- A new appointment is created (INSERT)
- An appointment status is updated (UPDATE OF status)

### Time Snapshot Mapping

The trigger uses a CASE statement to determine which time to snapshot based on status:

```sql
CASE NEW.status
  WHEN 'requested' THEN NEW.requested_start_time
  WHEN 'proposed' THEN NEW.proposed_start_time
  WHEN 'booked' THEN NEW.booked_start_time
  WHEN 'arrived' THEN NEW.booked_start_time
  WHEN 'ongoing' THEN NEW.booked_start_time
  WHEN 'completed' THEN NEW.booked_start_time
  WHEN 'cancelled' THEN NEW.requested_start_time
  WHEN 'rejected' THEN NEW.requested_start_time
  ELSE NULL
END
```

**Logic:**
- `requested` → Use patient's requested time
- `proposed` → Use dentist's proposed time
- `booked/arrived/ongoing/completed` → Use confirmed booked time
- `cancelled/rejected` → Use original requested time

## Migration Files

### Initial Setup
**File:** `database/migrations/create_appointment_status_history.sql`
- Creates table schema
- Sets up RLS policies (Patient/Doctor/Staff/Admin access)
- Adds indexes for performance
- Creates basic trigger (now superseded)

### Enhanced Trigger
**File:** `database/migrations/update_appointment_history_trigger.sql`
- Drops old trigger and function
- Creates new function with time snapshot logic
- Recreates trigger on appointments table

**To apply:** Run this file in Supabase SQL Editor

### Testing Helpers
**File:** `database/testing/manual_appointment_updates.sql`
- Provides SQL templates for testing each status transition
- Includes queries to view history
- Helper to find appointment IDs by email
- Cleanup queries for testing

## Frontend Implementation

### Data Flow

1. **Fetch Query** (`fetchActiveAppointment`)
   ```typescript
   const { data: history } = await supabase
     .from('appointment_status_history')
     .select('status, changed_at, notes, related_time')
     .eq('appointment_id', appointmentId)
   ```

2. **Data Mapping**
   ```typescript
   date: entry.changed_at.toLocaleDateString('en-US', {...}),
   time: entry.changed_at.toLocaleTimeString('en-US', {...}),
   status: formatStatus(entry.status),
   description: entry.notes || defaultDescription,
   relatedTime: entry.related_time 
     ? new Date(entry.related_time).toLocaleString('en-US', {...})
     : undefined
   ```

3. **Display Component** (`StatusHistory`)
   - Shows timeline of all status changes
   - Each entry displays:
     - Change date (when status updated)
     - Change time (when status updated)
     - Status name
     - Description/notes
     - **Related appointment time** (new feature)

### UI Design

The related time appears as a badge under the description:

```
┌─────────────────────────────────────┐
│ OCT 20, 2024                        │
│ Appointment Proposed                │
│ Dr. Smith proposed an alternative   │
│ ┌────────────────────────────────┐  │
│ │ 📅 Appointment time: Mon, Oct  │  │
│ │    20, 10:00 AM                │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Visual Styling
- White background badge with subtle border
- Calendar icon for visual clarity
- "Appointment time:" label to distinguish from change time
- Conditionally shown only when `relatedTime` exists

## Status Flow

```
Patient Creates → requested (with requested_start_time)
        ↓
Dentist Reviews → proposed (with proposed_start_time, proposed_end_time)
        ↓
Patient Accepts → booked (copies proposed to booked_start_time, booked_end_time)
        ↓
Patient Arrives → arrived (keeps booked_start_time)
        ↓
In Treatment → ongoing (keeps booked_start_time)
        ↓
Finished → completed (keeps booked_start_time)

Alternative paths:
- Patient Cancels → cancelled (keeps requested_start_time)
- Dentist Rejects → rejected (keeps requested_start_time)
```

## Security (RLS Policies)

### SELECT
- **Patients:** Own appointments only
- **Doctors:** Appointments assigned to them
- **Staff:** Appointments for their assigned doctor
- **Admin:** All appointments

### INSERT
- **Authenticated users:** Can create history (via trigger)

### UPDATE
- **Admin only:** Can modify history records

### DELETE
- **Admin only:** Can delete history records

## Testing Workflow

### 1. Apply Database Changes
```sql
-- In Supabase SQL Editor, run:
-- database/migrations/update_appointment_history_trigger.sql
```

### 2. Create Test Appointment
```sql
-- Use patient account to book via UI or SQL
INSERT INTO appointments (patient_id, doctor_id, status, requested_start_time, concern)
VALUES ('patient-uuid', 'doctor-uuid', 'requested', '2024-10-20 10:00:00+08', 'Toothache');
```

### 3. Test Status Transitions
```sql
-- Use templates in database/testing/manual_appointment_updates.sql
-- Example: Dentist proposes new time
UPDATE appointments
SET status = 'proposed',
    proposed_start_time = '2024-10-25 14:00:00+08',
    proposed_end_time = '2024-10-25 15:00:00+08'
WHERE appointment_id = 'your-appointment-id';
```

### 4. Verify History
```sql
SELECT 
  status,
  changed_at,
  related_time,
  notes
FROM appointment_status_history
WHERE appointment_id = 'your-appointment-id'
ORDER BY changed_at DESC;
```

### 5. Check Frontend
- View patient appointments page
- Expand "Status History" section
- Verify each entry shows appointment time badge

## Next Steps

### Immediate Tasks
1. ✅ Update StatusHistory component to display relatedTime
2. ⏳ Run migration: `update_appointment_history_trigger.sql`
3. ⏳ Test complete workflow with manual updates
4. ⏳ Verify frontend displays time snapshots correctly

### Future Enhancements
1. **Accept/Reject Buttons**
   - Add buttons when status='proposed'
   - Let patient accept (→ booked) or reject (→ requested)

2. **Dentist Dashboard**
   - View all appointment requests
   - Propose alternative times via UI
   - Update status through actions

3. **Notifications**
   - Alert patient when dentist proposes time
   - Alert dentist when patient accepts/rejects
   - Reminder notifications before booked appointment

4. **Time Conflict Detection**
   - Prevent double-booking dentist's schedule
   - Suggest available slots

## Troubleshooting

### History Not Creating
**Problem:** Manual UPDATE doesn't create history entry

**Cause:** Trigger only fires on status column changes

**Solution:** Always update status when changing appointment details
```sql
-- ❌ Won't trigger
UPDATE appointments SET proposed_start_time = '...' WHERE ...

-- ✅ Will trigger
UPDATE appointments 
SET status = 'proposed', proposed_start_time = '...' 
WHERE ...
```

### Related Time Shows NULL
**Problem:** History entry has NULL related_time

**Cause:** Time column wasn't set before trigger fired

**Solution:** Set time column in same UPDATE as status
```sql
UPDATE appointments
SET 
  status = 'proposed',
  proposed_start_time = '2024-10-25 14:00:00+08',  -- Set time
  proposed_end_time = '2024-10-25 15:00:00+08'      -- Set time
WHERE appointment_id = '...';
```

### Frontend Not Showing Time
**Problem:** Related time not appearing in UI

**Checklist:**
1. ✅ Query includes `related_time` in SELECT
2. ✅ Mapping includes `relatedTime` in StatusEntry
3. ✅ Component has conditional render `{entry.relatedTime && ...}`
4. ✅ Calendar icon imported from lucide-react

## File Reference

```
database/
  migrations/
    create_appointment_status_history.sql   # Initial table setup
    update_appointment_history_trigger.sql  # Enhanced trigger with time snapshots
  testing/
    manual_appointment_updates.sql          # Testing helpers
  README_appointment_history.md             # This file

src/app/(dashboard)/appointments/patient/
  page.tsx                                  # Patient appointment UI
    - StatusEntry type with relatedTime
    - fetchActiveAppointment() with history query
    - StatusHistory component with time display
```

## Credits
Implemented with Next.js 15.5.4, Supabase PostgreSQL, and TypeScript.
