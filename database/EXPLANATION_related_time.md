# Understanding `related_time` and Automatic Triggers

## 🤔 Your Questions

1. **How do manual database updates trigger the function to create history?**
2. **Why is `related_time` significant?**

---

## Part 1: How Triggers Work Automatically

### The Trigger Definition

```sql
CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();
```

Let's break this down word by word:

| Keyword | What It Means |
|---------|---------------|
| `AFTER` | Run the function AFTER the change happens (not before) |
| `INSERT OR UPDATE OF status` | Fire when a row is inserted OR when the `status` column changes |
| `ON appointments` | Watch the `appointments` table |
| `FOR EACH ROW` | Run once for every affected row |
| `EXECUTE FUNCTION` | Call this function automatically |

### 🎬 What Happens Step-by-Step

**Scenario:** Dentist updates appointment to propose a new time

```sql
UPDATE appointments
SET 
  status = 'proposed',
  proposed_start_time = '2024-10-25 14:00:00+08',
  proposed_end_time = '2024-10-25 15:00:00+08'
WHERE appointment_id = 'abc-123';
```

**Behind the Scenes:**

```
1. PostgreSQL receives your UPDATE command
   └─> "User wants to change appointment abc-123"

2. PostgreSQL checks: "Did the status column change?"
   └─> OLD.status = 'requested'
   └─> NEW.status = 'proposed'
   └─> YES! Status changed from 'requested' to 'proposed'

3. PostgreSQL updates the row in appointments table
   └─> status: 'requested' → 'proposed'
   └─> proposed_start_time: NULL → '2024-10-25 14:00:00+08'
   └─> proposed_end_time: NULL → '2024-10-25 15:00:00+08'

4. ⚡ TRIGGER FIRES AUTOMATICALLY ⚡
   └─> PostgreSQL: "Status changed! Run create_appointment_history()"

5. Function executes:
   └─> Gets current user: auth.uid() → user_id
   └─> Checks NEW.status = 'proposed'
   └─> Finds time_snapshot = NEW.proposed_start_time = '2024-10-25 14:00:00+08'
   └─> Inserts into appointment_status_history:
       • appointment_id: 'abc-123'
       • status: 'proposed'
       • changed_by_user_id: [current user's ID]
       • notes: 'Status updated to proposed'
       • related_time: '2024-10-25 14:00:00+08' ← SNAPSHOT!

6. Both changes committed to database
   └─> appointments table updated ✅
   └─> appointment_status_history new row created ✅
```

### 🔑 Key Point: It's 100% Automatic

**You don't need to manually insert into `appointment_status_history`!**

```sql
-- ❌ DON'T DO THIS (redundant):
UPDATE appointments SET status = 'proposed' WHERE ...;
INSERT INTO appointment_status_history (...) VALUES (...);

-- ✅ DO THIS (trigger handles history automatically):
UPDATE appointments SET status = 'proposed' WHERE ...;
```

### When Does the Trigger Fire?

| Your Action | Trigger Fires? | Why |
|-------------|----------------|-----|
| `INSERT INTO appointments (status='requested', ...)` | ✅ YES | INSERT always fires |
| `UPDATE appointments SET status='proposed' WHERE ...` | ✅ YES | Status column changed |
| `UPDATE appointments SET concern='New concern' WHERE ...` | ❌ NO | Status column didn't change |
| `UPDATE appointments SET status='proposed', status='proposed' WHERE ...` | ❌ NO | Status didn't actually change (same value) |
| `DELETE FROM appointments WHERE ...` | ❌ NO | Trigger only watches INSERT/UPDATE |

---

## Part 2: Why `related_time` is Significant

### The Problem Without `related_time`

Let's say we DON'T have the `related_time` column. Here's what happens:

**Timeline:**

```
Day 1 - Patient requests:
┌─────────────────────────────────────┐
│ appointments table:                 │
│ status: 'requested'                 │
│ requested_start_time: Oct 20, 10am │
│ proposed_start_time: NULL           │
│ booked_start_time: NULL             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ appointment_status_history:         │
│ Row 1: status='requested'           │
│        notes='Initial request'      │
└─────────────────────────────────────┘

Day 2 - Dentist proposes Oct 25, 2pm:
┌─────────────────────────────────────┐
│ appointments table:                 │
│ status: 'proposed'                  │
│ requested_start_time: Oct 20, 10am │
│ proposed_start_time: Oct 25, 2pm ✨│ NEW!
│ booked_start_time: NULL             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ appointment_status_history:         │
│ Row 1: status='requested'           │
│ Row 2: status='proposed' ✨         │ NEW!
└─────────────────────────────────────┘

Day 3 - Dentist changes mind, proposes Oct 27, 3pm:
┌─────────────────────────────────────┐
│ appointments table:                 │
│ status: 'proposed'                  │
│ requested_start_time: Oct 20, 10am │
│ proposed_start_time: Oct 27, 3pm ✨│ OVERWRITES Oct 25!
│ booked_start_time: NULL             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ appointment_status_history:         │
│ Row 1: status='requested'           │
│ Row 2: status='proposed'            │ Status didn't change!
│       ⚠️ NO NEW ROW CREATED         │
└─────────────────────────────────────┘

❌ PROBLEM: We lost the Oct 25, 2pm proposal!
   - appointments table only has latest time (Oct 27)
   - History didn't record the change (status was already 'proposed')
```

### The Solution With `related_time`

Now let's see with the `related_time` column:

**Timeline:**

```
Day 1 - Patient requests:
┌─────────────────────────────────────┐
│ appointments table:                 │
│ status: 'requested'                 │
│ requested_start_time: Oct 20, 10am │
└─────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ appointment_status_history:                     │
│ Row 1: status='requested'                       │
│        related_time: Oct 20, 10am ✨ SNAPSHOT! │
└─────────────────────────────────────────────────┘

Day 2 - Dentist proposes Oct 25, 2pm:
┌─────────────────────────────────────┐
│ appointments table:                 │
│ status: 'proposed'                  │
│ proposed_start_time: Oct 25, 2pm   │
└─────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ appointment_status_history:                     │
│ Row 1: status='requested'                       │
│        related_time: Oct 20, 10am              │
│ Row 2: status='proposed'                        │
│        related_time: Oct 25, 2pm ✨ SNAPSHOT!  │
└─────────────────────────────────────────────────┘

Day 3 - Dentist changes mind, proposes Oct 27, 3pm:
┌─────────────────────────────────────┐
│ appointments table:                 │
│ status: 'proposed'                  │
│ proposed_start_time: Oct 27, 3pm   │ OVERWRITES
└─────────────────────────────────────┘

🤔 But wait... status is still 'proposed'!
   Trigger won't fire because status didn't change!

💡 SOLUTION: We need TWO updates:

UPDATE appointments
SET status = 'requested'  -- Reset first
WHERE appointment_id = 'abc-123';

UPDATE appointments
SET 
  status = 'proposed',    -- Set back to proposed
  proposed_start_time = '2024-10-27 15:00:00+08'
WHERE appointment_id = 'abc-123';

┌─────────────────────────────────────────────────┐
│ appointment_status_history:                     │
│ Row 1: status='requested'                       │
│        related_time: Oct 20, 10am              │
│ Row 2: status='proposed'                        │
│        related_time: Oct 25, 2pm               │
│ Row 3: status='requested' (reset)               │
│        related_time: Oct 20, 10am              │
│ Row 4: status='proposed'                        │
│        related_time: Oct 27, 3pm ✨ NEW!       │
└─────────────────────────────────────────────────┘

✅ PRESERVED: All proposals recorded with timestamps!
```

### Better Design Pattern

Actually, there's a cleaner way to handle the "dentist changes proposal" scenario:

**Option 1: Use a notes field**
```sql
-- Second proposal
UPDATE appointments
SET 
  proposed_start_time = '2024-10-27 15:00:00+08',
  notes = 'Dentist changed proposal from Oct 25 to Oct 27'
WHERE appointment_id = 'abc-123';
-- Won't create history (status didn't change)
```

**Option 2: Create a dedicated status**
```sql
-- Add 'proposal_updated' status
UPDATE appointments
SET 
  status = 'proposal_updated',
  proposed_start_time = '2024-10-27 15:00:00+08'
WHERE appointment_id = 'abc-123';
-- Creates history with new time snapshot!
```

**Option 3: Add a counter field**
```sql
-- Add proposal_version column
UPDATE appointments
SET 
  status = 'proposed',
  proposed_start_time = '2024-10-27 15:00:00+08',
  proposal_version = proposal_version + 1
WHERE appointment_id = 'abc-123';

-- Modify trigger to fire on proposal_version changes too:
CREATE TRIGGER appointment_status_change_trigger
AFTER INSERT OR UPDATE OF status, proposal_version ON appointments
FOR EACH ROW
EXECUTE FUNCTION create_appointment_history();
```

---

## Why `related_time` Matters: Real-World Example

### Scenario: Insurance Claim Dispute

**6 months later...**

Patient: "The dentist kept changing my appointment time! First it was Oct 20, then Oct 25, then Oct 27. I missed work multiple days!"

Dentist: "No, I only proposed once - Oct 27 at 3pm."

**With `related_time` in history:**

```sql
SELECT 
  status,
  to_char(changed_at, 'Mon DD, YYYY HH12:MI AM') as when_changed,
  to_char(related_time, 'Mon DD, YYYY HH12:MI AM') as appointment_time,
  notes
FROM appointment_status_history
WHERE appointment_id = 'abc-123'
ORDER BY changed_at;
```

**Results:**

```
status     | when_changed         | appointment_time     | notes
-----------|----------------------|----------------------|------------------
requested  | Oct 18, 2024 09:00AM | Oct 20, 2024 10:00AM | Initial request
proposed   | Oct 19, 2024 02:30PM | Oct 25, 2024 02:00PM | Status updated
proposed   | Oct 20, 2024 11:15AM | Oct 27, 2024 03:00PM | Status updated
booked     | Oct 20, 2024 04:00PM | Oct 27, 2024 03:00PM | Status updated
completed  | Oct 27, 2024 04:30PM | Oct 27, 2024 03:00PM | Status updated
```

✅ **Clear audit trail proves:**
- Oct 19: Dentist proposed Oct 25 at 2pm
- Oct 20: Dentist changed to Oct 27 at 3pm  
- Oct 20: Patient accepted final proposal
- Oct 27: Appointment completed

**Without `related_time`:**

```
status     | when_changed         | notes
-----------|----------------------|------------------
requested  | Oct 18, 2024 09:00AM | Initial request
proposed   | Oct 19, 2024 02:30PM | Status updated
booked     | Oct 20, 2024 04:00PM | Status updated
completed  | Oct 27, 2024 04:30PM | Status updated
```

❌ **Can't prove:**
- What time was proposed on Oct 19?
- Did dentist change the proposal?
- What time did patient agree to?

---

## Technical Deep Dive: The CASE Statement

```sql
CASE NEW.status
  WHEN 'requested' THEN
    time_snapshot := NEW.requested_start_time;
  WHEN 'proposed' THEN
    time_snapshot := NEW.proposed_start_time;
  WHEN 'booked' THEN
    time_snapshot := NEW.booked_start_time;
  WHEN 'arrived', 'ongoing', 'completed' THEN
    time_snapshot := NEW.booked_start_time;
  ELSE
    time_snapshot := NULL;
END CASE;
```

**What this does:**

| Status | Which Time to Snapshot | Why |
|--------|------------------------|-----|
| `requested` | `requested_start_time` | Patient's original request |
| `proposed` | `proposed_start_time` | Dentist's counter-offer |
| `booked` | `booked_start_time` | Confirmed appointment time |
| `arrived` | `booked_start_time` | Keep confirmed time |
| `ongoing` | `booked_start_time` | Keep confirmed time |
| `completed` | `booked_start_time` | Keep confirmed time |
| `cancelled` | `NULL` | No relevant time |
| `rejected` | `NULL` | No relevant time |

**Why different columns?**

The `appointments` table has 5 time columns:
- `requested_start_time` - What patient wants
- `proposed_start_time` - What dentist suggests
- `proposed_end_time` - When dentist's slot ends
- `booked_start_time` - Final agreed time
- `booked_end_time` - Final agreed end

**Workflow:**
```
Patient: "I want Oct 20 at 10am"
└─> requested_start_time = Oct 20, 10am

Dentist: "I can do Oct 25 at 2pm"
└─> proposed_start_time = Oct 25, 2pm
└─> proposed_end_time = Oct 25, 3pm

Patient: "OK, I accept"
└─> booked_start_time = Oct 25, 2pm (copies from proposed)
└─> booked_end_time = Oct 25, 3pm (copies from proposed)

Once booked, all subsequent statuses use booked_start_time
```

---

## Summary

### How Manual Updates Trigger History

1. You write: `UPDATE appointments SET status = 'proposed' WHERE ...`
2. PostgreSQL executes the UPDATE
3. **Automatically** checks: "Did status column change?"
4. **Automatically** runs: `create_appointment_history()` function
5. Function reads NEW.status and NEW.proposed_start_time
6. Function inserts a row into `appointment_status_history`
7. **You don't write any INSERT statement!**

### Why `related_time` is Significant

1. **Preserves history** - Snapshots appointment time at each status change
2. **Prevents data loss** - Even if appointment time changes in main table
3. **Audit trail** - Proves when and what times were proposed/accepted
4. **Legal protection** - Evidence for disputes or compliance
5. **Analytics** - Track how often dentists change proposals, average acceptance time, etc.

### The Magic Formula

```
Trigger (automatic) + related_time (snapshot) = Complete History
```

**Without trigger:** You'd need to manually INSERT into history every time
**Without related_time:** You'd lose time information when values change
**With both:** Complete automatic audit trail with zero extra code! ✨
