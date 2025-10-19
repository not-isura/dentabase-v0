# Next Steps - Appointment History Implementation

## ✅ What's Complete

### 1. Database Schema
- ✅ `appointment_status_history` table created with all columns including `related_time`
- ✅ RLS policies for Patient/Doctor/Staff/Admin access
- ✅ Indexes for performance optimization
- ✅ Migration SQL files documented and ready

### 2. Trigger System  
- ✅ Enhanced trigger function with time snapshot logic
- ✅ CASE statement mapping status → appropriate time column
- ✅ Automatic history creation on INSERT/UPDATE
- ✅ SQL file ready: `update_appointment_history_trigger.sql`

### 3. Frontend (Patient View)
- ✅ StatusEntry type includes `relatedTime` field
- ✅ Fetch query includes `related_time` from database
- ✅ Data mapping formats timestamp as readable string
- ✅ StatusHistory component displays appointment time badge
- ✅ Calendar icon visual indicator
- ✅ Conditional rendering (only shows when time exists)

### 4. Documentation
- ✅ Complete README with architecture explanation
- ✅ Testing SQL templates for manual workflow simulation
- ✅ Troubleshooting guide

---

## ⏳ What's Pending (In Order)

### STEP 1: Apply Database Migration ⚠️ CRITICAL
**File:** `database/migrations/update_appointment_history_trigger.sql`

**Action Required:**
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy entire contents of `update_appointment_history_trigger.sql`
4. Paste and execute in SQL Editor
5. Verify success message

**Expected Output:**
```
DROP TRIGGER
DROP FUNCTION
CREATE FUNCTION
CREATE TRIGGER
```

**Why This Matters:**
Without this migration, manual SQL updates won't populate `related_time` column. The old trigger doesn't know about the new column.

---

### STEP 2: Test the Complete Flow

**Option A: Test via UI (Recommended)**
1. Login as patient
2. Create new appointment (status: requested)
3. Check history → Should show "Appointment time: [your requested time]"
4. Have admin/dentist update status to 'proposed' with proposed_start_time
5. Refresh patient page → Should show purple proposed time box + history entry with proposal time
6. Accept appointment (if buttons exist) or manually set status to 'booked'
7. Verify history shows all 3 entries with correct times

**Option B: Test via SQL**
Use `database/testing/manual_appointment_updates.sql`:

```sql
-- 1. Find your appointment ID
SELECT appointment_id, status, requested_start_time
FROM appointments
WHERE patient_id IN (
  SELECT user_id FROM patient WHERE email = 'your-email@example.com'
);

-- 2. Test dentist proposing time
UPDATE appointments
SET 
  status = 'proposed',
  proposed_start_time = '2024-10-25 14:00:00+08',
  proposed_end_time = '2024-10-25 15:00:00+08'
WHERE appointment_id = 'your-appointment-id-here';

-- 3. View history to verify
SELECT 
  status,
  to_char(changed_at, 'Mon DD, YYYY HH12:MI AM') as changed_at,
  to_char(related_time, 'Mon DD, YYYY HH12:MI AM') as appointment_time,
  notes
FROM appointment_status_history
WHERE appointment_id = 'your-appointment-id-here'
ORDER BY changed_at DESC;
```

**Expected Result:**
```
status     | changed_at           | appointment_time     | notes
-----------|----------------------|----------------------|-------
proposed   | Oct 25, 2024 02:30PM | Oct 25, 2024 02:00PM | Dentist proposed...
requested  | Oct 20, 2024 09:00AM | Oct 20, 2024 10:00AM | Initial request
```

---

### STEP 3: Implement Accept/Reject Buttons

**Current State:**
- Patient sees proposed time in purple box
- No way to accept or reject via UI
- Must manually update status in database

**What to Build:**
Add conditional buttons in `AppointmentSummary` component when `status === 'proposed'`:

```tsx
{activeAppointment.status === 'proposed' && (
  <div className="flex gap-3 mt-4">
    <Button 
      onClick={handleAcceptProposal}
      className="flex-1 bg-green-600 hover:bg-green-700"
    >
      Accept Proposed Time
    </Button>
    <Button 
      onClick={handleRejectProposal}
      variant="outline"
      className="flex-1"
    >
      Request Different Time
    </Button>
  </div>
)}
```

**Logic:**
- **Accept:** Update status to 'booked', copy proposed → booked times
- **Reject:** Update status back to 'requested', clear proposed times

---

### STEP 4: Build Dentist Dashboard

**Current Gap:**
- Dentist has no UI to manage appointments
- Must use SQL to propose times
- Can't see appointment requests

**Required Pages:**

#### `/appointments/dentist/page.tsx`
- View all appointment requests (status: requested)
- Click appointment → Open modal to propose time
- View all upcoming appointments (status: booked, arrived, ongoing)
- Update appointment status (arrived, ongoing, completed)

**Features:**
```
┌─────────────────────────────────────────┐
│ Appointment Requests (3)                │
├─────────────────────────────────────────┤
│ ○ John Doe - Toothache                  │
│   Requested: Mon, Oct 20, 10:00 AM      │
│   [Propose Time] [Reject]               │
├─────────────────────────────────────────┤
│ ○ Jane Smith - Cleaning                 │
│   Requested: Tue, Oct 21, 2:00 PM       │
│   [Propose Time] [Reject]               │
└─────────────────────────────────────────┘
```

**Time Proposal Modal:**
- Date picker
- Time slot selector
- Duration selector (30min, 1hr, 1.5hr, 2hr)
- Notes field (optional)
- Auto-sets `proposed_start_time` and `proposed_end_time`

---

### STEP 5: Add Notifications System

**Trigger Points:**
1. Patient creates appointment → Notify dentist
2. Dentist proposes time → Notify patient
3. Patient accepts → Notify dentist
4. Patient rejects → Notify dentist
5. 24hrs before appointment → Notify both parties

**Implementation Options:**

**Option A: In-App Notifications**
- Create `notifications` table
- Show badge count in navbar
- Notifications dropdown component

**Option B: Email Notifications**
- Use Supabase Edge Functions
- Trigger on database events
- Send via SendGrid/Resend

**Option C: Both**
- Best user experience
- In-app for immediate alerts
- Email for offline users

---

## 🎯 Priority Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 🔴 HIGH | Apply migration (Step 1) | 5 min | Enables entire feature |
| 🔴 HIGH | Test workflow (Step 2) | 15 min | Validates implementation |
| 🟡 MEDIUM | Accept/Reject buttons (Step 3) | 1-2 hrs | Completes patient workflow |
| 🟡 MEDIUM | Dentist dashboard (Step 4) | 4-6 hrs | Completes dentist workflow |
| 🟢 LOW | Notifications (Step 5) | 2-3 hrs | Improves UX |

---

## 📊 Current Status Visualization

```
Appointment Flow:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Patient                Dentist                System   │
│    │                       │                      │      │
│    │ Create Request        │                      │      │
│    │──────────────────────>│                      │      │
│    │                       │                      │      │
│    │                       │ Review Request       │      │
│    │                       │                      │      │
│    │                       │ Propose Time         │      │
│    │<──────────────────────│                      │      │
│    │                       │                      │      │
│    │ View Proposal ✅      │                      │      │
│    │ (Purple Box)          │                      │      │
│    │                       │                      │      │
│    │ Accept? ⏳            │                      │      │
│    │ (No UI Yet)           │                      │      │
│    │                       │                      │      │
│    │──────────────────────>│                      │      │
│    │                       │                      │      │
│    │                       │                Trigger│      │
│    │                       │                Creates│      │
│    │                       │                History│✅   │
│    │                       │                      │      │
└──────────────────────────────────────────────────────────┘

✅ = Implemented
⏳ = Pending
```

---

## 🐛 Common Issues & Solutions

### Issue: "related_time is NULL in history"
**Diagnosis:**
```sql
SELECT appointment_id, status, related_time
FROM appointment_status_history
WHERE related_time IS NULL;
```

**Causes:**
1. Migration not applied yet → Run `update_appointment_history_trigger.sql`
2. Time column not set before status change → Update both in same query
3. Status doesn't map to a time → Check CASE statement logic

**Fix:**
```sql
-- Always update time + status together
UPDATE appointments
SET 
  status = 'proposed',
  proposed_start_time = '2024-10-25 14:00:00+08',
  proposed_end_time = '2024-10-25 15:00:00+08'
WHERE appointment_id = '...';
```

---

### Issue: "Frontend doesn't show appointment time"
**Checklist:**
1. Check browser console for errors
2. Verify data in database has `related_time` populated
3. Inspect StatusEntry objects in React DevTools
4. Check if conditional render is working: `{entry.relatedTime && ...}`

**Debug Query:**
```typescript
// Add console.log in fetchActiveAppointment
console.log('History data:', history);
console.log('Mapped entries:', statusHistory);
```

---

### Issue: "Time shows wrong timezone"
**Cause:** Browser timezone differs from database (+08:00 Philippines)

**Check Database:**
```sql
SELECT 
  related_time,
  related_time::text as stored_value
FROM appointment_status_history;
```

**Should see:** `2024-10-20 10:00:00+08`

**Frontend formats to user's local timezone** - this is expected behavior. If you want to force Philippines time:

```typescript
relatedTime: entry.related_time 
  ? new Date(entry.related_time).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',  // Force Philippines timezone
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  : undefined
```

---

## 📞 Need Help?

Refer to:
- `database/README_appointment_history.md` - Complete technical documentation
- `database/testing/manual_appointment_updates.sql` - SQL testing helpers
- `database/migrations/update_appointment_history_trigger.sql` - Migration to apply

**Stuck on something?** Check if:
1. ✅ Migration applied successfully
2. ✅ Database has sample data to test with
3. ✅ Frontend shows any console errors
4. ✅ User has correct permissions (RLS policies)
