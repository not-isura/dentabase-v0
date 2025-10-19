# Adding Time Range Support (Start + End Times)

## What Changed

Previously, we only captured the **start time** of appointments in history.  
Now we capture **both start and end times** to show the full appointment duration.

## Database Changes

### New Column
```sql
ALTER TABLE appointment_status_history
ADD COLUMN related_end_time TIMESTAMPTZ;
```

**Purpose:** Store the end time of the appointment at each status change.

### Updated Fields

| Column | What It Stores | Example |
|--------|----------------|---------|
| `related_time` | Appointment **START** time | Oct 25, 2024 2:00 PM |
| `related_end_time` | Appointment **END** time | Oct 25, 2024 3:00 PM |
| Duration | `related_end_time - related_time` | 1 hour |

## Trigger Logic

The trigger now captures both times based on status:

```sql
-- START TIME
WHEN 'requested' THEN NEW.requested_start_time
WHEN 'proposed' THEN NEW.proposed_start_time
WHEN 'booked' THEN NEW.booked_start_time

-- END TIME
WHEN 'requested' THEN NEW.requested_start_time + 1 hour  (default)
WHEN 'proposed' THEN NEW.proposed_end_time
WHEN 'booked' THEN NEW.booked_end_time
```

### Special Case: Requested Status

When patients create appointments, they usually only select a start time.  
The trigger automatically adds **1 hour** as default duration:

```
Patient requests: Oct 20 at 10:00 AM
History captures:
  - related_time: Oct 20, 10:00 AM
  - related_end_time: Oct 20, 11:00 AM  (automatically calculated)
```

## Frontend Display

### Status History Timeline

Each history entry now shows the **time range**:

```
┌─────────────────────────────────────────────┐
│ OCT 18, 2024                2:30 PM         │
│ Appointment Proposed                        │
│ Dr. Smith proposed an alternative time      │
│ ┌─────────────────────────────────────────┐ │
│ │ 📅 Appointment time: Mon, Oct 25,      │ │
│ │    2:00 PM - 3:00 PM                   │ │  ← Shows range!
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Format

- **With end time:** "Mon, Oct 25, 2:00 PM - 3:00 PM"
- **Without end time:** "Mon, Oct 25, 2:00 PM" (fallback)

## Example Timeline

### Complete Appointment Workflow:

```
1. Patient Requests (Oct 18 @ 10:00 AM)
   📅 Requested for: Oct 20, 10:00 AM - 11:00 AM (1 hour)
   
2. Dentist Proposes (Oct 18 @ 2:30 PM)
   📅 Proposed for: Oct 25, 2:00 PM - 3:00 PM (1 hour)
   
3. Patient Accepts (Oct 18 @ 4:00 PM)
   📅 Booked for: Oct 25, 2:00 PM - 3:00 PM (1 hour)
   
4. Patient Arrives (Oct 25 @ 1:55 PM)
   📅 Appointment: Oct 25, 2:00 PM - 3:00 PM
   
5. Appointment Ongoing (Oct 25 @ 2:05 PM)
   📅 Appointment: Oct 25, 2:00 PM - 3:00 PM
   
6. Appointment Completed (Oct 25 @ 2:55 PM)
   📅 Appointment: Oct 25, 2:00 PM - 3:00 PM
```

## SQL Query Example

To view time ranges in history:

```sql
SELECT 
  status,
  to_char(related_time, 'Mon DD, YYYY HH12:MI AM') as start_time,
  to_char(related_end_time, 'Mon DD, YYYY HH12:MI AM') as end_time,
  related_end_time - related_time as duration
FROM appointment_status_history
WHERE appointment_id = 'your-appointment-id'
ORDER BY changed_at ASC;
```

**Result:**
```
status    | start_time           | end_time             | duration
----------|----------------------|----------------------|----------
requested | Oct 20, 2024 10:00AM | Oct 20, 2024 11:00AM | 01:00:00
proposed  | Oct 25, 2024 02:00PM | Oct 25, 2024 03:00PM | 01:00:00
booked    | Oct 25, 2024 02:00PM | Oct 25, 2024 03:00PM | 01:00:00
```

## Migration Steps

### 1. Run Database Migration
**File:** `database/migrations/add_related_end_time.sql`

Execute in Supabase SQL Editor:
```sql
-- Adds related_end_time column
-- Updates trigger to capture end times
-- Recreates trigger function
```

### 2. Frontend Already Updated
✅ TypeScript type includes `relatedEndTime`  
✅ Fetch query includes `related_end_time`  
✅ Data mapping formats end time  
✅ UI displays time range

### 3. Test It

Create a test appointment manually:

```sql
-- Find an appointment
SELECT appointment_id FROM appointments 
ORDER BY created_at DESC LIMIT 1;

-- Simulate dentist proposing with time range
UPDATE appointments 
SET 
  status = 'proposed',
  proposed_start_time = '2025-10-25T14:00:00+08:00',
  proposed_end_time = '2025-10-25T15:00:00+08:00'
WHERE appointment_id = 'your-id';

-- Check history
SELECT 
  status,
  related_time,
  related_end_time,
  related_end_time - related_time as duration
FROM appointment_status_history
WHERE appointment_id = 'your-id';
```

## Benefits

### Before (Start Time Only)
```
History:
- "Status proposed on Oct 18"
- "Appointment time: Oct 25, 2:00 PM"
❓ When does it end? Don't know!
```

### After (Start + End Time)
```
History:
- "Status proposed on Oct 18"
- "Appointment time: Oct 25, 2:00 PM - 3:00 PM"
✅ Complete time range! Clear duration!
```

### Use Cases

1. **Scheduling:** See how long each appointment was supposed to take
2. **Analytics:** Track average appointment durations
3. **Conflicts:** Check if proposed times overlap with other appointments
4. **Billing:** Match appointment duration with charges
5. **Audit:** Complete record of scheduled vs actual duration

## Default Durations

| Status | Default End Time Logic |
|--------|----------------------|
| `requested` | Start + 1 hour (patient didn't specify) |
| `proposed` | Use `proposed_end_time` from appointments table |
| `booked` | Use `booked_end_time` from appointments table |
| `arrived` | Use `booked_end_time` (confirmed time) |
| `ongoing` | Use `booked_end_time` (confirmed time) |
| `completed` | Use `booked_end_time` (confirmed time) |

## Files Changed

| File | What Changed |
|------|-------------|
| `add_related_end_time.sql` | New migration script |
| `page.tsx` (patient) | TypeScript type + fetch + display |
| `manual_appointment_updates.sql` | Updated queries to show ranges |
| `TIME_RANGE_FEATURE.md` | This documentation |

## Backward Compatibility

✅ **Old history entries** (before migration):
- Will have `related_time` but `related_end_time = NULL`
- UI will display: "Mon, Oct 25, 2:00 PM" (no end time shown)
- No errors or breaking changes

✅ **New history entries** (after migration):
- Will have both `related_time` and `related_end_time`
- UI will display: "Mon, Oct 25, 2:00 PM - 3:00 PM"

## Next Steps

1. ✅ Run migration: `add_related_end_time.sql`
2. ✅ Test appointment creation
3. ✅ Verify history shows time ranges
4. ⏳ Update appointment booking UI to let patients select duration
5. ⏳ Add duration selector in dentist's proposal modal

---

**Summary:** Every appointment history entry now captures the full time range (start to end), giving you complete visibility into scheduled appointment durations throughout the entire workflow! 📅⏰
