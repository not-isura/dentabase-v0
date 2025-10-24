# 🔄 Hybrid Appointment History Tracking

## Overview

The appointment history tracking system uses a **hybrid approach** that combines database triggers for simple status changes with manual code-based insertion for actions requiring custom notes.

---

## 📋 How It Works

### **Database Trigger** (Auto-Insert)
- **File**: `database/migrations/hybrid_appointment_history_trigger.sql`
- **Handles**: Simple status changes with generic patient-friendly notes
- **Statuses**: `requested`, `booked`, `arrived`, `ongoing`, `completed`
- **Logic**: 
  - Automatically creates history when appointment status changes
  - Uses default patient-friendly notes
  - Skips auto-insertion when `feedback` or `feedback_type` is set (indicating manual handling)

### **Manual Code Insert** (Custom Notes)
- **File**: `src/app/(dashboard)/appointments/admin/page.tsx`
- **Handles**: Actions requiring custom feedback or detailed notes
- **Statuses**: `proposed`, `rejected`, `cancelled`
- **Logic**:
  - Inserts history record BEFORE updating appointment
  - Sets `feedback` field during appointment update to signal trigger to skip
  - Includes custom patient-friendly notes + optional staff feedback

---

## 🎯 Status Breakdown

| Status | Handling | Notes Type | Function |
|--------|----------|------------|----------|
| `requested` | **Trigger** | Generic | Initial appointment creation |
| `proposed` | **Manual** | Custom | Accept/Reschedule with feedback |
| `booked` | **Trigger** | Generic | Patient confirms appointment |
| `arrived` | **Trigger** | Generic | Patient checks in |
| `ongoing` | **Trigger** | Generic | Appointment in progress |
| `completed` | **Trigger** | Generic | Appointment finished |
| `rejected` | **Manual** | Custom | Admin rejects with reason |
| `cancelled` | **Manual** | Custom | Admin cancels with reason |

---

## 🔧 Implementation Details

### **Accept Appointment** (`handleAcceptAppointmentConfirm`)
```typescript
// 1. Insert history manually with custom note
await supabase
  .from('appointment_status_history')
  .insert({ notes: customNote, ... });

// 2. Update appointment with feedback flag to skip trigger
await supabase
  .from('appointments')
  .update({ 
    status: 'proposed',
    feedback: 'Accepted' // Signals trigger to skip
  });
```

### **Reschedule** (`handleSubmitProposedTime`)
```typescript
// 1. Insert history manually
await supabase
  .from('appointment_status_history')
  .insert({ notes: customNote, ... });

// 2. Update with feedback flag
await supabase
  .from('appointments')
  .update({ 
    status: 'proposed',
    feedback: 'Rescheduled' // Signals trigger to skip
  });
```

### **Reject/Cancel** (`handleStatusChange`)
```typescript
if (needsManualHistory) {
  // 1. Insert history manually with reason
  await supabase
    .from('appointment_status_history')
    .insert({ notes: reasonNote, ... });
}

// 2. Update with feedback_type to skip trigger
await supabase
  .from('appointments')
  .update({ 
    status: newStatus,
    feedback: reason,
    feedback_type: 'rejected' or 'cancelled'
  });
```

### **Simple Status Changes** (Arrive, Ongoing, Complete)
```typescript
// Just update status - trigger handles history automatically
await supabase
  .from('appointments')
  .update({ status: newStatus });
// ✅ Trigger auto-creates history with default note
```

---

## 🎨 Patient-Friendly Notes

All history entries use patient-facing language:

| Status | Default Note |
|--------|-------------|
| `requested` | "Your appointment request has been received." |
| `proposed` | "Your appointment has been accepted. Please confirm the time." |
| `booked` | "Your appointment has been confirmed." |
| `arrived` | "You have checked in. Please wait to be called." |
| `ongoing` | "Your appointment is now in progress." |
| `completed` | "Your appointment has been completed. Thank you for visiting!" |
| `rejected` | "Unfortunately, your appointment request could not be accommodated." |
| `cancelled` | "Your appointment has been cancelled." |

### With Optional Feedback
```
[Default Note]

Note: [Staff's custom message]
```

---

## ✅ Benefits of Hybrid Approach

1. **Automatic Tracking**: Simple status changes are tracked automatically without code changes
2. **Custom Control**: Complex actions with feedback are handled with full control
3. **No Duplicates**: Trigger smartly skips when manual insert is done
4. **Patient-Friendly**: All notes use consistent patient-facing language
5. **Maintainability**: Clear separation of concerns

---

## 🚀 Setup Instructions

### 1. Deploy the Trigger
Run this in Supabase SQL Editor:
```sql
-- File: database/migrations/hybrid_appointment_history_trigger.sql
-- This will drop old trigger and create the new hybrid one
```

### 2. Test the Implementation

#### Test Auto-Insert (Simple Status Change)
```typescript
// Should auto-create history
await supabase
  .from('appointments')
  .update({ status: 'arrived' })
  .eq('appointment_id', id);

// Check: SELECT * FROM appointment_status_history WHERE appointment_id = id;
// Should show generic note: "You have checked in. Please wait to be called."
```

#### Test Manual Insert (Custom Notes)
```typescript
// Should create custom history
await handleStatusChange(id, 'rejected', 'Doctor unavailable');

// Check: Should show custom note with reason
```

---

## 🐛 Troubleshooting

### "Error inserting status history"
- **Cause**: Duplicate insertion (both manual + trigger)
- **Fix**: Ensure `feedback` field is set when updating status for manual-insert statuses
- **Check**: Review code to ensure history is inserted BEFORE appointment update

### Trigger Not Working
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'appointment_status_change_trigger';

-- If missing, re-run hybrid_appointment_history_trigger.sql
```

### History Not Showing Custom Notes
- **Check**: Is history inserted before status update?
- **Check**: Is `feedback` field set in appointment update?
- **Check**: Order should be: INSERT history → UPDATE appointment

---

## 📝 Maintenance Notes

### Adding New Status Requiring Custom Notes
1. Add status to `needsManualHistory` array in `handleStatusChange`
2. Add default note to `defaultNotes` object
3. Update trigger to skip auto-insert for this status

### Changing Default Notes
- **For auto-insert statuses**: Update trigger SQL
- **For manual-insert statuses**: Update `defaultNotes` in code

---

## 🎯 Summary

- ✅ **Trigger handles**: `requested`, `booked`, `arrived`, `ongoing`, `completed`
- ✅ **Manual code handles**: `proposed`, `rejected`, `cancelled`
- ✅ **No duplicates**: Trigger skips when `feedback` is set
- ✅ **Patient-friendly**: All notes use consistent language
- ✅ **Error-free**: Resolved "Error inserting status history" issue

---

**Last Updated**: October 22, 2025
**Trigger Version**: `hybrid_appointment_history_trigger.sql`
**Code Version**: Latest in `appointments/admin/page.tsx`
