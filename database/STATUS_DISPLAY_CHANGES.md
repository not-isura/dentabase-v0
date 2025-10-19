# Status Display Changes: "Proposed" → "To Confirm"

## Changes Made

### 1. ✅ Status Label Changed

**Before:**
- Progress Tracker: `Requested → Proposed → Booked → ...`
- Status History: Shows "Proposed"

**After:**
- Progress Tracker: `Requested → To Confirm → Booked → ...`
- Status History: Shows "To Confirm"

---

### 2. ✅ Smart Description Logic

The description now changes based on whether the dentist confirmed the requested time or proposed a different time.

#### Scenario A: Dentist Confirms Requested Time ✅

**Condition:**
```typescript
requested_start_time === proposed_start_time
```

**Example:**
- Patient requests: Oct 20, 10:00 AM
- Dentist confirms: Oct 20, 10:00 AM (same time!)

**Display:**
```
┌─────────────────────────────────────────────┐
│ OCT 18, 2024                2:30 PM         │
│ To Confirm                                  │
│ Your requested time has been confirmed.     │
│ Please confirm your appointment.            │
│ ┌─────────────────────────────────────────┐ │
│ │ 📅 Appointment time: Mon, Oct 20,      │ │
│ │    10:00 AM - 11:00 AM                 │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

#### Scenario B: Dentist Proposes Alternative Time ⏰

**Condition:**
```typescript
requested_start_time !== proposed_start_time
```

**Example:**
- Patient requests: Oct 20, 10:00 AM
- Dentist proposes: Oct 25, 2:00 PM (different!)

**Display:**
```
┌─────────────────────────────────────────────┐
│ OCT 18, 2024                2:30 PM         │
│ To Confirm                                  │
│ The dentist has proposed an alternative    │
│ time for your appointment. Please review   │
│ and confirm.                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 📅 Appointment time: Mon, Oct 25,      │ │
│ │    2:00 PM - 3:00 PM                   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Code Logic

### Status Display
```typescript
// In progress tracker
const steps = ['Requested', 'To Confirm', 'Booked', ...];

// In history mapping
status: entry.status === 'proposed' 
  ? 'To Confirm'  // Display as "To Confirm"
  : entry.status.charAt(0).toUpperCase() + entry.status.slice(1)
```

### Smart Description
```typescript
const generateDescription = (entry: any) => {
  if (entry.status === 'proposed') {
    const requestedTime = appointment.requested_start_time;
    const proposedTime = appointment.proposed_start_time;
    
    // Compare timestamps
    if (requestedTime && proposedTime && 
        new Date(requestedTime).getTime() === new Date(proposedTime).getTime()) {
      // Times match - dentist confirmed
      return 'Your requested time has been confirmed. Please confirm your appointment.';
    } else {
      // Times differ - dentist proposed alternative
      return 'The dentist has proposed an alternative time for your appointment. Please review and confirm.';
    }
  }
  
  // Other statuses use default notes
  return entry.notes || `Status changed to ${entry.status}`;
};
```

---

## Visual Comparison

### Progress Tracker

**Before:**
```
○ Requested → ○ Proposed → ○ Booked → ○ Arrived → ○ Ongoing → ○ Completed
```

**After:**
```
○ Requested → ○ To Confirm → ○ Booked → ○ Arrived → ○ Ongoing → ○ Completed
                  ^^^^^^^^^^
                  Changed!
```

---

### Status History

**Before:**
```
┌────────────────────────────────────────┐
│ OCT 18, 2024            2:30 PM        │
│ Proposed                               │ ← Old label
│ Status updated to proposed             │ ← Generic message
└────────────────────────────────────────┘
```

**After (Same Time):**
```
┌────────────────────────────────────────┐
│ OCT 18, 2024            2:30 PM        │
│ To Confirm                             │ ← New label
│ Your requested time has been           │ ← Smart message
│ confirmed. Please confirm your         │
│ appointment.                           │
└────────────────────────────────────────┘
```

**After (Different Time):**
```
┌────────────────────────────────────────┐
│ OCT 18, 2024            2:30 PM        │
│ To Confirm                             │ ← New label
│ The dentist has proposed an            │ ← Smart message
│ alternative time for your appointment. │
│ Please review and confirm.             │
└────────────────────────────────────────┘
```

---

## Why These Changes?

### 1. Better User Language
- ✅ **"To Confirm"** is clearer than "Proposed"
- ✅ Users understand they need to take action
- ✅ Matches common booking app patterns

### 2. Context-Aware Messages
- ✅ **Same time:** "Your time is confirmed, just acknowledge it"
- ✅ **Different time:** "We proposed a new time, please review"
- ✅ Reduces confusion about what happened

### 3. Call to Action
- ✅ Both messages end with "Please confirm"
- ✅ Clear next step for the user
- ✅ Encourages engagement

---

## User Journey Examples

### Journey 1: Dentist Confirms Requested Time

```
1. Patient: "I want Oct 20 at 10:00 AM"
   Status: Requested
   Display: "Your appointment request has been sent."

2. Dentist: "Oct 20 at 10:00 AM works!"
   Status: To Confirm (was "proposed" in DB)
   Display: "Your requested time has been confirmed. 
            Please confirm your appointment."
   
3. Patient: Clicks "Accept"
   Status: Booked
   Display: "Your appointment is confirmed."
```

### Journey 2: Dentist Proposes Different Time

```
1. Patient: "I want Oct 20 at 10:00 AM"
   Status: Requested
   Display: "Your appointment request has been sent."

2. Dentist: "Sorry, how about Oct 25 at 2:00 PM?"
   Status: To Confirm (was "proposed" in DB)
   Display: "The dentist has proposed an alternative time 
            for your appointment. Please review and confirm."
   Shows: 📅 Oct 25, 2:00 PM - 3:00 PM (in purple box)
   
3. Patient: Clicks "Accept"
   Status: Booked
   Display: "Your appointment is confirmed."
```

---

## Database vs Display

**Important:** The database still uses `'proposed'` status internally!

| Database | Display |
|----------|---------|
| `status = 'proposed'` | Shows as **"To Confirm"** |
| `notes = 'Status updated to proposed'` | Shows **smart description** |

This is just a **display transformation** - no database changes needed!

---

## Testing Scenarios

### Test Case 1: Same Time Confirmation
```sql
-- Setup: Create appointment
INSERT INTO appointments (...) VALUES (
  requested_start_time: '2025-10-20T10:00:00+08:00',
  status: 'requested'
);

-- Dentist confirms same time
UPDATE appointments SET
  status = 'proposed',
  proposed_start_time = '2025-10-20T10:00:00+08:00', -- Same!
  proposed_end_time = '2025-10-20T11:00:00+08:00'
WHERE ...;

-- Expected Display:
-- Status: "To Confirm"
-- Description: "Your requested time has been confirmed. Please confirm your appointment."
```

### Test Case 2: Different Time Proposal
```sql
-- Setup: Create appointment
INSERT INTO appointments (...) VALUES (
  requested_start_time: '2025-10-20T10:00:00+08:00',
  status: 'requested'
);

-- Dentist proposes different time
UPDATE appointments SET
  status = 'proposed',
  proposed_start_time = '2025-10-25T14:00:00+08:00', -- Different!
  proposed_end_time = '2025-10-25T15:00:00+08:00'
WHERE ...;

-- Expected Display:
-- Status: "To Confirm"
-- Description: "The dentist has proposed an alternative time... Please review and confirm."
```

---

## Files Changed

| File | Changes |
|------|---------|
| `page.tsx` (patient) | 1. Changed steps array: "Proposed" → "To Confirm"<br>2. Added `generateDescription()` function<br>3. Updated status mapping in history<br>4. Updated milestone messages |

---

## Backward Compatibility

✅ **Existing appointments:** Will work perfectly
- Database status stays as `'proposed'`
- Display automatically shows "To Confirm"
- Smart description kicks in based on time comparison

✅ **No migration needed:** This is purely a UI change

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Status Label** | "Proposed" | "To Confirm" |
| **Description (Same Time)** | "Status updated to proposed" | "Your requested time has been confirmed. Please confirm your appointment." |
| **Description (Different Time)** | "Status updated to proposed" | "The dentist has proposed an alternative time for your appointment. Please review and confirm." |
| **User Clarity** | Unclear what "proposed" means | Clear action: "To Confirm" |
| **Context Awareness** | Generic message | Smart message based on time comparison |

**Ready to test!** Just refresh the page to see the new labels and smart descriptions. 🚀
