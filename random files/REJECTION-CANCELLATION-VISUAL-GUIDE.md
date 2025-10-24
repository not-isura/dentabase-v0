# Rejection & Cancellation - Visual Status Tracker Guide

## Quick Reference

### **Available Actions by Status:**
- **Requested** → Can **REJECT** or **CANCEL**
- **Proposed** → Can only **CANCEL**
- **Booked** → Can only **CANCEL**
- **Arrived** → Can only **CANCEL**
- **Ongoing** → Can only **CANCEL**

---

## Scenario 1: REJECT at "Requested" Status

**When:** Admin rejects appointment at initial request stage  
**Action:** Click "Reject" button → Enter note → Confirm

### Status Tracker Display:
```
✅ Requested (completed - patient made the request)
❌ To Confirm (X symbol - rejected here)
⚪ Booked (not reached)
⚪ Arrived (not reached)
⚪ Ongoing (not reached)
⚪ Completed (not reached)
```

**What Patient Sees:**
- 🔴 Red banner: "Rejected - Your appointment request has been declined by the clinic"
- Button: "Dismiss to Create New"

---

## Scenario 2: CANCEL at "Requested" Status

**When:** Staff/Dentist/Admin cancels appointment at initial request stage  
**Action:** Click "Cancel" button → Enter note → Confirm

### Status Tracker Display:
```
✅ Requested (completed - patient made the request)
❌ To Confirm (X symbol - cancelled here)
⚪ Booked (not reached)
⚪ Arrived (not reached)
⚪ Ongoing (not reached)
⚪ Completed (not reached)
```

**What Patient Sees:**
- 🔴 Red banner: "Cancelled - Appointment has been cancelled"
- Button: "Dismiss to Create New"

---

## Scenario 3: CANCEL at "Proposed" Status

**When:** Admin proposed time, but then cancels before patient confirms  
**Action:** Click "Cancel" button → Enter note → Confirm

### Status Tracker Display:
```
✅ Requested (completed - patient made the request)
✅ To Confirm (completed - admin proposed time)
❌ Booked (X symbol - cancelled before confirmation)
⚪ Arrived (not reached)
⚪ Ongoing (not reached)
⚪ Completed (not reached)
```

**What Patient Sees:**
- 🔴 Red banner: "Cancelled - Appointment has been cancelled"
- Button: "Dismiss to Create New"

---

## Scenario 4: CANCEL at "Booked" Status

**When:** Appointment confirmed, but cancelled before patient arrives  
**Action:** Click "Cancel" button → Enter note → Confirm

### Status Tracker Display:
```
✅ Requested (completed)
✅ To Confirm (completed)
✅ Booked (completed - was confirmed)
❌ Arrived (X symbol - cancelled before arrival)
⚪ Ongoing (not reached)
⚪ Completed (not reached)
```

**What Patient Sees:**
- 🔴 Red banner: "Cancelled - Appointment has been cancelled"
- Button: "Dismiss to Create New"

---

## Scenario 5: CANCEL at "Arrived" Status

**When:** Patient arrived at clinic, but appointment cancelled  
**Action:** Click "Cancel" button → Enter note → Confirm

### Status Tracker Display:
```
✅ Requested (completed)
✅ To Confirm (completed)
✅ Booked (completed)
✅ Arrived (completed - patient showed up)
❌ Ongoing (X symbol - cancelled before treatment started)
⚪ Completed (not reached)
```

**What Patient Sees:**
- 🔴 Red banner: "Cancelled - Appointment has been cancelled"
- Button: "Dismiss to Create New"

---

## Scenario 6: CANCEL at "Ongoing" Status

**When:** Treatment started but had to be terminated  
**Action:** Click "Cancel" button → Enter note → Confirm

### Status Tracker Display:
```
✅ Requested (completed)
✅ To Confirm (completed)
✅ Booked (completed)
✅ Arrived (completed)
✅ Ongoing (completed - treatment was in progress)
❌ Completed (X symbol - cancelled before completion)
```

**What Patient Sees:**
- 🔴 Red banner: "Cancelled - Appointment has been cancelled"
- Button: "Dismiss to Create New"

---

## Key Rules Summary

### 1. **REJECT Action**
- ✅ **Available:** Only at "Requested" status
- 👤 **Who:** Admin only
- 🎯 **Purpose:** Decline initial appointment request
- 📊 **Visual:** X appears on "To Confirm" step

### 2. **CANCEL Action**
- ✅ **Available:** At any status (Requested, Proposed, Booked, Arrived, Ongoing)
- 👤 **Who:** Admin, Staff, Dentist
- 🎯 **Purpose:** Terminate appointment at any stage
- 📊 **Visual:** X appears on the NEXT step after last completed

### 3. **Status Tracker Logic**
- ✅ **Checkmark** = Step was completed
- ❌ **X Symbol** = Appointment terminated at this point
- ⚪ **Gray Circle** = Step was never reached
- 🟣 **Purple Line** = Progress line connecting completed steps
- ⚫ **Gray Line** = Remaining steps not reached

### 4. **Patient Experience**
- Sees red banner for both rejected and cancelled
- Must click "Dismiss to Create New" to book again
- Cannot book new appointment while rejected/cancelled one is active
- Can view status history with notes from staff/dentist

---

## Workflow Decision Tree

```
Appointment Status?
│
├─ REQUESTED
│   ├─ Want to decline? → Use "REJECT" ✅
│   └─ Want to cancel? → Use "CANCEL" ✅
│
├─ PROPOSED
│   └─ Want to cancel? → Use "CANCEL" ✅
│
├─ BOOKED
│   └─ Want to cancel? → Use "CANCEL" ✅
│
├─ ARRIVED
│   └─ Want to cancel? → Use "CANCEL" ✅
│
└─ ONGOING
    └─ Want to cancel? → Use "CANCEL" ✅
```

---

## Visual Legend

| Symbol | Meaning | Color | Status |
|--------|---------|-------|--------|
| ✅ | Checkmark | Purple | Step completed successfully |
| ❌ | X Symbol | Red | Appointment terminated here |
| ⚪ | Number | Gray | Step not reached |
| 🟣 | Line | Purple | Progress connection |
| ⚫ | Line | Gray | Unreached connection |

---

## Common Examples

### Example 1: "Doctor Unavailable" (Reject at Request)
**Scenario:** Patient requests appointment, but doctor is unavailable that day.

**Action:** Admin clicks "Reject" → Note: "Doctor unavailable on this date"

**Result:**
```
✅ Requested
❌ To Confirm ← Rejected here
⚪ Booked
⚪ Arrived
⚪ Ongoing
⚪ Completed
```

---

### Example 2: "Patient No-Show" (Cancel at Arrived)
**Scenario:** Patient was marked as arrived but left before treatment.

**Action:** Staff clicks "Cancel" → Note: "Patient left before treatment"

**Result:**
```
✅ Requested
✅ To Confirm
✅ Booked
✅ Arrived
❌ Ongoing ← Cancelled here
⚪ Completed
```

---

### Example 3: "Emergency Closure" (Cancel at Booked)
**Scenario:** Clinic closes due to emergency after appointment was confirmed.

**Action:** Admin clicks "Cancel" → Note: "Emergency clinic closure"

**Result:**
```
✅ Requested
✅ To Confirm
✅ Booked
❌ Arrived ← Cancelled here
⚪ Ongoing
⚪ Completed
```

---

### Example 4: "Patient Changed Mind" (Cancel at Proposed)
**Scenario:** Admin proposed time, patient cancels before confirming.

**Action:** Staff clicks "Cancel" → Note: "Patient requested cancellation"

**Result:**
```
✅ Requested
✅ To Confirm
❌ Booked ← Cancelled here
⚪ Arrived
⚪ Ongoing
⚪ Completed
```

---

## Testing Checklist

Use this quick checklist to verify the visual display:

### For Each Scenario:
- [ ] Correct step shows ✅ checkmark (completed steps)
- [ ] Correct step shows ❌ X symbol (termination point)
- [ ] Remaining steps show ⚪ gray circles
- [ ] Purple connecting lines up to last completed step
- [ ] Gray connecting lines after termination
- [ ] Red banner displays correct message
- [ ] "Dismiss to Create New" button appears
- [ ] Status history shows custom note with "Dentist/Staff Note:" label

---

## Quick Test: Visual Verification

1. **Reject at Requested** → X on step 2 ✅
2. **Cancel at Requested** → X on step 2 ✅
3. **Cancel at Proposed** → X on step 3 ✅
4. **Cancel at Booked** → X on step 4 ✅
5. **Cancel at Arrived** → X on step 5 ✅
6. **Cancel at Ongoing** → X on step 6 ✅

All scenarios tested? ✅ Ready for production!
