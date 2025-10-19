# 🎨 Appointment Status Color Guide

## Complete Status Flow & Color System

### 📊 Status Flow Overview
```
Requested → To Confirm → Booked → Arrived → Ongoing → Completed
           ↓
        Cancelled / Rejected
```

---

## 🎨 Color System by Status

### 1. **REQUESTED** (Patient submits appointment)
- **Status Badge**: `bg-blue-100 text-blue-800 border-blue-200`
- **Progress Tracker**: Dark purple filled circle `bg-[hsl(258_46%_25%)]` with checkmark
- **Display Label**: "Requested"
- **Time Display**: Only start time shown (no end time - clinic decides duration)
- **History Label**: "Requested time:"

---

### 2. **TO CONFIRM / PROPOSED** (Dentist reviews and proposes time)
- **Status Badge**: `bg-purple-100 text-purple-800 border-purple-200`
- **Progress Tracker**: Dark purple filled circle `bg-[hsl(258_46%_25%)]` with checkmark
- **Display Label**: "To Confirm" (changed from "Proposed" for better UX)
- **Time Display**: Full range with end time
- **History Label**: "Appointment time:"

#### **Two Scenarios:**

**A. Confirmed Time (times match)**
- **Box Color**: Green `bg-green-50 border-green-200`
- **Icon Background**: `bg-green-600`
- **Label**: "CONFIRMED TIME" `text-green-900`
- **Date**: `text-green-900`
- **Time**: `text-green-700` with full range (start - end)
- **Message**: `text-green-600` "Your requested time has been confirmed..."
- **Button**: "Confirm Appointment" (purple)

**B. Alternative Time (times different)**
- **Box Color**: Purple `bg-purple-50 border-purple-200`
- **Icon Background**: `bg-purple-600`
- **Label**: "PROPOSED NEW TIME" `text-purple-900`
- **Date**: `text-purple-900`
- **Time**: `text-purple-700` with full range (start - end)
- **Message**: `text-purple-600` "The dentist has proposed an alternative time..."
- **Button**: "Accept Proposed Time" (purple)

---

### 3. **BOOKED** (Patient confirmed appointment)
- **Status Badge**: `bg-green-100 text-green-800 border-green-200`
- **Progress Tracker**: Dark purple filled number `bg-[hsl(258_46%_25%)]` with "3"
- **Display Label**: "Booked"
- **Time Display**: Full range with end time (copied from proposed times)
- **Scheduled For**: Shows complete time range
- **History Label**: "Appointment time:"

---

### 4. **ARRIVED** (Patient checked in at clinic)
- **Status Badge**: `bg-teal-100 text-teal-800 border-teal-200`
- **Progress Tracker**: Step 4 (future)
- **Display Label**: "Arrived"
- **Time Display**: Uses booked times
- **History Label**: "Appointment time:"

---

### 5. **ONGOING** (Appointment in progress)
- **Status Badge**: `bg-orange-100 text-orange-800 border-orange-200`
- **Progress Tracker**: Step 5 (future)
- **Display Label**: "Ongoing"
- **Time Display**: Uses booked times
- **History Label**: "Appointment time:"

---

### 6. **COMPLETED** (Appointment finished)
- **Status Badge**: `bg-gray-100 text-gray-800 border-gray-200` (default)
- **Progress Tracker**: Step 6 - Final checkmark
- **Display Label**: "Completed"
- **Time Display**: Uses booked times
- **History Label**: "Appointment time:"

---

### 7. **CANCELLED** (Patient/Dentist cancelled)
- **Status Badge**: `bg-gray-100 text-gray-800 border-gray-200` (default)
- **Progress Tracker**: Red X icon
- **Display Label**: "Cancelled"
- **Time Display**: No end time (NULL)
- **History Label**: "Requested time:"

---

### 8. **REJECTED** (Dentist rejected)
- **Status Badge**: `bg-gray-100 text-gray-800 border-gray-200` (default)
- **Progress Tracker**: Red X icon
- **Display Label**: "Rejected"
- **Time Display**: No end time (NULL)
- **History Label**: "Requested time:"

---

## 🎯 UI Component Colors

### Appointment Summary Card
- **Background**: `bg-gradient-to-br from-blue-50 to-purple-50`
- **Border**: `border-[hsl(258_46%_25%/0.12)]`
- **Title**: `text-[hsl(258_46%_25%)]`
- **Description**: `text-[hsl(258_22%_50%)]`

### Status History Cards
- **Background**: `bg-[hsl(258_46%_98%)]`
- **Border**: `border-[hsl(258_46%_25%/0.1)]`
- **Status Label**: `text-[hsl(258_46%_25%)]`
- **Description**: `text-[hsl(258_22%_45%)]`
- **Time Badge**: `bg-white border-[hsl(258_46%_25%/0.2)] text-[hsl(258_46%_25%)]`

### Buttons

#### **Confirm Appointment Button** (when status = proposed)
- **Background**: `bg-[hsl(258_46%_45%)]`
- **Hover**: `hover:bg-[hsl(258_46%_35%)]`
- **Text**: `text-white`
- **Icon**: Check icon `<Check />`
- **Variants**:
  - "Confirm Appointment" (when times match)
  - "Accept Proposed Time" (when times different)

#### **Cancel Appointment Button**
- **Current**: `border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400`
- **Variant**: Outline style
- **Display**: Only when status allows cancellation

---

## 📱 Progress Tracker Steps

```
Step 1: Requested     (✓ filled dark purple)
Step 2: To Confirm    (✓ filled dark purple)
Step 3: Booked        (3 filled dark purple)
Step 4: Arrived       (4 gray outline)
Step 5: Ongoing       (5 gray outline)
Step 6: Completed     (6 gray outline)
```

**Active Step**: Dark purple background `bg-[hsl(258_46%_25%)]` with white text/icon
**Future Step**: Light gray `bg-gray-200 text-gray-400`
**Rejected**: Red X icon replacing progress

---

## 🎨 Theme Colors Reference

### Primary Purple Theme
- `hsl(258_46%_25%)` - Dark purple (main brand)
- `hsl(258_46%_35%)` - Medium purple (hover states)
- `hsl(258_46%_45%)` - Light purple (buttons)
- `hsl(258_46%_98%)` - Very light purple (backgrounds)
- `hsl(258_22%_50%)` - Muted purple (descriptions)
- `hsl(258_22%_45%)` - Darker muted purple (text)

### Status-Specific Colors
- **Blue**: Requested state
- **Purple**: Proposed/To Confirm state
- **Green**: Success/Confirmed/Booked state
- **Teal**: Arrived state
- **Orange**: Ongoing/Active state
- **Red**: Cancel/Reject actions
- **Gray**: Completed/Inactive states

---

## 💡 UX Design Principles

1. **Progressive Information**
   - Requested: Only start time (clinic decides duration)
   - Proposed: Full time range (dentist sets schedule)
   - Booked: Confirmed time range (locked in)

2. **Visual Hierarchy**
   - Green = Positive action (confirmed/approved)
   - Purple = Needs attention (to confirm)
   - Red = Destructive action (cancel/reject)
   - Blue = Initial state (just requested)

3. **Consistency**
   - Status badges use light backgrounds with dark text
   - Progress tracker uses brand purple for completed steps
   - Time displays conditionally show end time based on context

---

## ✅ Current Implementation Status

- ✅ Requested → Only start time, no end time
- ✅ To Confirm → Smart labels (Confirmed vs Proposed)
- ✅ To Confirm → Color coding (Green vs Purple)
- ✅ To Confirm → Full time range display
- ✅ Booked → Full time range from proposed times
- ✅ Confirm button with smart text
- ✅ Cancel button (outline red)
- ⏳ **Next**: Polish button UI/UX
- ⏳ **Next**: Add confirm/cancel button interactions

---

## 🎯 Next Steps: Button Polish

### Proposed Improvements:

1. **Confirm Button**
   - Add loading state during confirmation
   - Add success animation after confirmation
   - Improve button sizing and padding
   - Add tooltip explaining action

2. **Cancel Button**
   - Add confirmation modal before cancelling
   - Add loading state
   - Improve hover states
   - Add icon (X icon)

3. **Button Group Layout**
   - Stack buttons vertically on mobile
   - Side-by-side on desktop
   - Proper spacing and alignment
   - Responsive design

