# Rejected & Cancelled Appointments - Test Guide

## Overview
This guide covers all test scenarios for rejected and cancelled appointment workflows, including UI display, status tracking, history recording, and role-based permissions.

---

## Test Setup

### Prerequisites
- Active appointments in various statuses (requested, proposed, booked, arrived, ongoing)
- Test users for each role: Patient, Dentist, Staff, Admin
- Clean status history for accurate testing

### Test Data Requirements
```sql
-- Create test appointments for different scenarios
-- 1. Appointment at "requested" status
-- 2. Appointment at "proposed" status  
-- 3. Appointment at "booked" status
-- 4. Appointment at "arrived" status
-- 5. Appointment at "ongoing" status
```

---

## Part 1: REJECTED Appointments (Admin Only)

### Test Case 1.1: Reject at "Requested" Status
**Pre-condition:** Appointment exists with status = 'requested'

**Steps:**
1. Login as **Admin**
2. Navigate to Admin Appointments page
3. Locate appointment with status "Requested"
4. Click **"Reject"** button
5. Modal opens with title "Reject Appointment"
6. Enter note in "Note to Patient" field: "Doctor unavailable on this date"
7. Click **"Reject Appointment"** button

**Expected Results:**
- ✅ Modal closes immediately
- ✅ Appointment status updates to "rejected"
- ✅ Red banner appears: "Rejected - Your appointment request has been declined by the clinic"
- ✅ Status history shows TWO entries:
  - Default message: "Your appointment has been rejected."
  - Custom note (blue box labeled "Dentist/Staff Note:"): "Doctor unavailable on this date"
- ✅ Status tracker shows:
  - Step 1 (Requested): ✓ Checkmark with purple fill
  - Step 2 (To Confirm): ❌ Red X symbol
  - Steps 3-6: Gray circles (not reached)
- ✅ Database check:
  ```sql
  SELECT status, feedback, feedback_type FROM appointments WHERE appointment_id = ?;
  -- status: 'rejected'
  -- feedback: 'Doctor unavailable on this date'
  -- feedback_type: 'rejected'
  ```
- ✅ History table check:
  ```sql
  SELECT notes, feedback, status FROM appointment_status_history 
  WHERE appointment_id = ? AND status = 'rejected';
  -- notes: 'Your appointment has been rejected.'
  -- feedback: 'Doctor unavailable on this date'
  -- Count: 1 row only (no duplicate)
  ```

---

### Test Case 1.2: Reject at "Proposed" Status
**Pre-condition:** Appointment exists with status = 'proposed'

**Steps:**
1. Login as **Admin**
2. Navigate to Admin Appointments page
3. Locate appointment with status "Proposed"
4. Click **"Reject"** button
5. Enter note: "Patient medical history requires specialist consultation"
6. Click **"Reject Appointment"** button

**Expected Results:**
- ✅ Status updates to "rejected"
- ✅ Red banner appears
- ✅ Status tracker shows:
  - Step 1 (Requested): ✓ Checkmark
  - Step 2 (To Confirm): ✓ Checkmark (was proposed, so confirmed)
  - Step 3 (Booked): ❌ Red X symbol
  - Steps 4-6: Gray circles
- ✅ History entry created with custom note
- ✅ No duplicate entries in database

---

### Test Case 1.3: Reject at "Booked" Status
**Pre-condition:** Appointment exists with status = 'booked'

**Steps:**
1. Login as **Admin**
2. Locate appointment with status "Booked"
3. Click **"Reject"** button
4. Enter note: "Emergency clinic closure"
5. Click **"Reject Appointment"** button

**Expected Results:**
- ✅ Status updates to "rejected"
- ✅ Status tracker shows:
  - Steps 1-3: ✓ Checkmarks (Requested → To Confirm → Booked)
  - Step 4 (Arrived): ❌ Red X symbol
  - Steps 5-6: Gray circles
- ✅ History shows rejection note: "Emergency clinic closure"

---

### Test Case 1.4: Reject with Empty Note
**Pre-condition:** Appointment exists with any active status

**Steps:**
1. Login as **Admin**
2. Click **"Reject"** button
3. Leave "Note to Patient" field **empty**
4. Click **"Reject Appointment"** button

**Expected Results:**
- ✅ Modal closes
- ✅ Status updates to "rejected"
- ✅ History shows default message only: "Your appointment has been rejected."
- ✅ No custom note displayed (since none was provided)
- ✅ Database `feedback` field is empty or null

---

### Test Case 1.5: Reject Modal Cancellation
**Pre-condition:** Appointment exists with any active status

**Steps:**
1. Login as **Admin**
2. Click **"Reject"** button
3. Modal opens
4. Enter some text in note field
5. Click outside modal or press ESC key

**Expected Results:**
- ✅ Modal closes
- ✅ Appointment status remains **unchanged**
- ✅ No history entry created
- ✅ No database changes made

---

## Part 2: CANCELLED Appointments (Staff/Dentist/Admin)

### Test Case 2.1: Cancel at "Requested" Status (Staff)
**Pre-condition:** Appointment exists with status = 'requested'

**Steps:**
1. Login as **Staff**
2. Navigate to Admin Appointments page
3. Locate appointment with status "Requested"
4. Click **"Cancel"** button
5. Modal opens with title "Cancel Appointment"
6. Enter note in "Note to Patient" field: "Patient requested cancellation"
7. Click **"Cancel Appointment"** button

**Expected Results:**
- ✅ Modal closes immediately
- ✅ Appointment status updates to "cancelled"
- ✅ Red banner appears: "Cancelled - Appointment has been cancelled"
- ✅ Status history shows:
  - Default message: "Your appointment has been cancelled."
  - Custom note (blue box): "Patient requested cancellation"
- ✅ Status tracker shows:
  - Step 1 (Requested): ✓ Checkmark
  - Step 2 (To Confirm): ❌ Red X symbol
  - Steps 3-6: Gray circles
- ✅ Database check:
  ```sql
  SELECT status, feedback, feedback_type FROM appointments WHERE appointment_id = ?;
  -- status: 'cancelled'
  -- feedback: 'Patient requested cancellation'
  -- feedback_type: 'cancelled'
  ```
- ✅ No RLS policy error (42501)
- ✅ No duplicate history entries

---

### Test Case 2.2: Cancel at "Booked" Status (Dentist)
**Pre-condition:** Appointment exists with status = 'booked'

**Steps:**
1. Login as **Dentist**
2. Navigate to Admin Appointments page
3. Locate appointment with status "Booked"
4. Click **"Cancel"** button
5. Enter note: "Dentist called in sick"
6. Click **"Cancel Appointment"** button

**Expected Results:**
- ✅ Status updates to "cancelled"
- ✅ Red banner appears
- ✅ Status tracker shows:
  - Steps 1-3: ✓ Checkmarks (Requested → To Confirm → Booked)
  - Step 4 (Arrived): ❌ Red X symbol
  - Steps 5-6: Gray circles
- ✅ History entry created with note "Dentist called in sick"
- ✅ No RLS policy error
- ✅ Dentist can successfully insert 'cancelled' status into history

---

### Test Case 2.3: Cancel at "Arrived" Status (Admin)
**Pre-condition:** Appointment exists with status = 'arrived'

**Steps:**
1. Login as **Admin**
2. Locate appointment with status "Arrived"
3. Click **"Cancel"** button
4. Enter note: "Patient left before treatment"
5. Click **"Cancel Appointment"** button

**Expected Results:**
- ✅ Status updates to "cancelled"
- ✅ Status tracker shows:
  - Steps 1-4: ✓ Checkmarks (up to Arrived)
  - Step 5 (Ongoing): ❌ Red X symbol
  - Step 6: Gray circle
- ✅ History shows cancellation note

---

### Test Case 2.4: Cancel at "Ongoing" Status
**Pre-condition:** Appointment exists with status = 'ongoing'

**Steps:**
1. Login as **Staff** or **Dentist**
2. Locate appointment with status "Ongoing"
3. Click **"Cancel"** button
4. Enter note: "Medical emergency - treatment incomplete"
5. Click **"Cancel Appointment"** button

**Expected Results:**
- ✅ Status updates to "cancelled"
- ✅ Status tracker shows:
  - Steps 1-5: ✓ Checkmarks (up to Ongoing)
  - Step 6 (Completed): ❌ Red X symbol
- ✅ History entry created successfully

---

### Test Case 2.5: Cancel with Long Note Text
**Pre-condition:** Appointment exists with any active status

**Steps:**
1. Login as **Staff**
2. Click **"Cancel"** button
3. Enter a very long note (500+ characters): "Patient called to cancel due to unexpected work emergency. They mentioned they will need to reschedule once their work situation stabilizes. Patient was very apologetic and requested to be contacted when new slots are available. Follow-up required in 2 weeks."
4. Click **"Cancel Appointment"** button

**Expected Results:**
- ✅ Status updates to "cancelled"
- ✅ Full note text is saved and displayed correctly
- ✅ Note wraps properly in the UI (no text overflow)
- ✅ Database stores complete note without truncation

---

## Part 3: Patient View Tests

### Test Case 3.1: Patient Views Own Rejected Appointment
**Pre-condition:** Patient has appointment rejected by admin

**Steps:**
1. Login as **Patient** (whose appointment was rejected)
2. Navigate to Patient Appointments page

**Expected Results:**
- ✅ Appointment is displayed (NOT hidden)
- ✅ Red banner shows: "Rejected - Your appointment request has been declined by the clinic"
- ✅ Banner includes red X icon
- ✅ Single button displayed: **"Dismiss to Create New"**
- ✅ Status tracker shows:
  - Last completed step: ✓ Checkmark
  - Next step: ❌ Red X symbol
  - Remaining steps: Gray circles
- ✅ Status history displays:
  - Default rejection message
  - Custom note from dentist/staff (if provided)
  - **NO "Dr." prefix** (because viewing as patient)
- ✅ Console logs show:
  ```
  Found active appointment: {
    id: [appointment_id],
    status: 'rejected',
    is_active: true
  }
  ```

---

### Test Case 3.2: Patient Views Own Cancelled Appointment
**Pre-condition:** Patient has appointment cancelled by staff/dentist

**Steps:**
1. Login as **Patient**
2. Navigate to Patient Appointments page

**Expected Results:**
- ✅ Appointment is displayed (NOT hidden)
- ✅ Red banner shows: "Cancelled - Appointment has been cancelled"
- ✅ Banner includes red X icon
- ✅ Single button displayed: **"Dismiss to Create New"**
- ✅ Status tracker shows appropriate checkmarks and X symbol
- ✅ Status history displays cancellation details
- ✅ Console logs confirm appointment found with status 'cancelled'

---

### Test Case 3.3: Patient Dismisses Rejected Appointment
**Pre-condition:** Patient viewing their rejected appointment

**Steps:**
1. Login as **Patient**
2. View rejected appointment
3. Click **"Dismiss to Create New"** button

**Expected Results:**
- ✅ Appointment `is_active` flag set to `false` in database
- ✅ Appointment disappears from patient view
- ✅ "No Active Appointment" message appears
- ✅ **"Book New Appointment"** button becomes visible
- ✅ Patient can now book a new appointment (no "already have active appointment" error)

---

### Test Case 3.4: Patient Dismisses Cancelled Appointment
**Pre-condition:** Patient viewing their cancelled appointment

**Steps:**
1. Login as **Patient**
2. View cancelled appointment
3. Click **"Dismiss to Create New"** button

**Expected Results:**
- ✅ Appointment marked as inactive
- ✅ Patient can book new appointment immediately
- ✅ No errors or restrictions

---

### Test Case 3.5: Patient Cannot Book New While Rejected Exists
**Pre-condition:** Patient has active rejected appointment (not yet dismissed)

**Steps:**
1. Login as **Patient**
2. Rejected appointment is displayed
3. Try to click **"Book New Appointment"** button (should not be visible)
4. Or try to access booking flow via URL manipulation

**Expected Results:**
- ✅ "Book New Appointment" button is hidden (only "Dismiss to Create New" visible)
- ✅ If somehow accessed, shows error: "You already have an active appointment. Please wait for it to be completed or cancelled before booking a new one."
- ✅ Must dismiss rejected appointment first before booking new

---

## Part 4: Status History Display Tests

### Test Case 4.1: Admin Views Rejected Appointment History
**Pre-condition:** Appointment rejected with custom note

**Steps:**
1. Login as **Admin**
2. Navigate to Admin Appointments page
3. Locate rejected appointment
4. Scroll to "Status History" section

**Expected Results:**
- ✅ History entries displayed in chronological order (newest first)
- ✅ Rejection entry shows:
  - Status badge: Red "REJECTED"
  - Date and time of rejection
  - Changed by user's name with "Dr." prefix if dentist
  - Default message: "Your appointment has been rejected."
  - Blue box labeled "Dentist/Staff Note:" with custom feedback
- ✅ All previous status changes displayed below

---

### Test Case 4.2: Staff Views Cancelled Appointment History
**Pre-condition:** Appointment cancelled by dentist with note

**Steps:**
1. Login as **Staff**
2. View cancelled appointment
3. Check status history

**Expected Results:**
- ✅ Cancellation entry shows:
  - Status badge: Red "CANCELLED"
  - Changed by: "Dr. [Dentist Name]" (with "Dr." prefix)
  - Default message: "Your appointment has been cancelled."
  - Custom note in blue box
- ✅ Proper formatting and spacing
- ✅ No duplicate entries

---

### Test Case 4.3: History Shows Correct User Role Prefix
**Pre-condition:** Multiple status changes by different users

**Steps:**
1. Create appointment flow with changes by:
   - Patient requests (no prefix)
   - Dentist proposes (Dr. prefix)
   - Staff accepts (no prefix)
   - Admin cancels (no prefix)
2. View status history

**Expected Results:**
- ✅ Patient name: "John Doe" (no prefix)
- ✅ Dentist name: "Dr. Jane Smith" (with Dr. prefix)
- ✅ Staff name: "Mike Johnson" (no prefix)
- ✅ Admin name: "Admin User" (no prefix)

---

## Part 5: Database & RLS Policy Tests

### Test Case 5.1: Staff Can Insert Cancelled Status
**Pre-condition:** Staff user logged in

**Steps:**
1. Login as **Staff**
2. Cancel an appointment with note
3. Check database directly:
   ```sql
   SELECT * FROM appointment_status_history 
   WHERE appointment_id = ? AND status = 'cancelled';
   ```

**Expected Results:**
- ✅ History entry created successfully
- ✅ No error code 42501 (RLS policy violation)
- ✅ `changed_by_user_id` matches staff user_id
- ✅ `notes` contains default message
- ✅ `feedback` contains custom note

---

### Test Case 5.2: Dentist Can Insert Cancelled Status
**Pre-condition:** Dentist user logged in

**Steps:**
1. Login as **Dentist**
2. Cancel an appointment
3. Verify database entry

**Expected Results:**
- ✅ No RLS policy error
- ✅ History entry created with dentist as `changed_by_user_id`
- ✅ Status = 'cancelled' allowed in RLS policy

---

### Test Case 5.3: Patient Can Insert Cancelled Status (Self-Cancel)
**Pre-condition:** System allows patient self-cancellation (if implemented)

**Steps:**
1. Login as **Patient**
2. Attempt to cancel own appointment
3. Check database

**Expected Results:**
- ✅ RLS policy allows patient to insert 'cancelled' status for own appointments
- ✅ History entry created successfully
- ✅ Array check: `ARRAY['requested', 'booked', 'cancelled']` includes 'cancelled'

---

### Test Case 5.4: Verify No Duplicate History Entries
**Pre-condition:** Any rejection or cancellation

**Steps:**
1. Perform reject or cancel action
2. Query database:
   ```sql
   SELECT COUNT(*) FROM appointment_status_history 
   WHERE appointment_id = ? AND status = 'rejected';
   -- or status = 'cancelled'
   ```

**Expected Results:**
- ✅ Count = 1 (exactly one entry)
- ✅ No duplicate from trigger auto-insert
- ✅ Manual insert + trigger skip detection working correctly

---

### Test Case 5.5: Trigger Skips Manual Inserts
**Pre-condition:** Hybrid trigger implemented

**Steps:**
1. Cancel appointment with feedback
2. Check trigger detection:
   - `feedback_type` = 'cancelled' set before update
   - Trigger sees feedback_type and skips auto-insert
3. Verify only manual insert exists

**Expected Results:**
- ✅ Trigger detects `feedback_type = 'cancelled'` flag
- ✅ Trigger skips its own insert logic
- ✅ Only manual history entry exists
- ✅ No error about duplicate inserts

---

## Part 6: Error Handling Tests

### Test Case 6.1: Network Error During Rejection
**Pre-condition:** Simulate network failure

**Steps:**
1. Login as **Admin**
2. Click "Reject" button
3. Enter note
4. Disconnect network
5. Click "Reject Appointment"

**Expected Results:**
- ✅ Error message displayed to user
- ✅ Enhanced error logging shows:
  - Error message
  - Error details
  - Error hint
  - Error code
- ✅ Console logs full error object
- ✅ Modal remains open (doesn't close on error)
- ✅ No partial database changes

---

### Test Case 6.2: Concurrent Status Change
**Pre-condition:** Two admins viewing same appointment

**Steps:**
1. Admin A and Admin B both open same appointment
2. Admin A rejects the appointment
3. Admin B tries to cancel the same appointment

**Expected Results:**
- ✅ First action succeeds
- ✅ Second action either:
  - Succeeds and updates from 'rejected' to 'cancelled', OR
  - Shows error if business logic prevents status change
- ✅ No data corruption
- ✅ History shows both changes (if both succeed)

---

### Test Case 6.3: Missing Required Fields
**Pre-condition:** Database validation enabled

**Steps:**
1. Attempt to insert history without `changed_by_user_id`
2. Attempt to insert without `appointment_id`
3. Attempt to insert without `status`

**Expected Results:**
- ✅ Database constraint violations caught
- ✅ User-friendly error messages displayed
- ✅ No partial data saved

---

## Part 7: Console Logging Tests

### Test Case 7.1: Debug Logs for Patient View
**Pre-condition:** Debug logging enabled

**Steps:**
1. Login as **Patient**
2. Navigate to appointments page
3. Open browser console

**Expected Results - Scenario A (Appointment Found):**
```
Found active appointment: {
  id: 'abc-123-def',
  status: 'cancelled',
  is_active: true
}
```

**Expected Results - Scenario B (No Appointment):**
```
No appointments found with is_active=true
```

---

### Test Case 7.2: Enhanced Error Logging
**Pre-condition:** Trigger error during rejection/cancellation

**Steps:**
1. Cause an error (e.g., invalid appointment ID)
2. Check console logs

**Expected Results:**
```
❌ Error details: {
  message: "...",
  details: "...",
  hint: "...",
  code: "...",
  full: {...}
}
```

---

## Part 8: Edge Cases

### Test Case 8.1: Reject Already Rejected Appointment
**Pre-condition:** Appointment already rejected

**Steps:**
1. Try to reject again

**Expected Results:**
- ✅ Either:
  - Button disabled/hidden for rejected appointments, OR
  - Action fails with appropriate message

---

### Test Case 8.2: Cancel Already Cancelled Appointment
**Pre-condition:** Appointment already cancelled

**Steps:**
1. Try to cancel again

**Expected Results:**
- ✅ Button disabled/hidden for cancelled appointments
- ✅ Or shows error: "Cannot cancel already cancelled appointment"

---

### Test Case 8.3: Special Characters in Note
**Pre-condition:** Any active appointment

**Steps:**
1. Click Reject/Cancel
2. Enter note with special characters: `<script>alert('test')</script>`, `'; DROP TABLE--`, `\n\t\r`
3. Submit

**Expected Results:**
- ✅ Special characters properly escaped
- ✅ No XSS vulnerability
- ✅ No SQL injection
- ✅ Text displays correctly in UI

---

### Test Case 8.4: Very Short Note (1 character)
**Pre-condition:** Any active appointment

**Steps:**
1. Click Reject/Cancel
2. Enter single character note: "."
3. Submit

**Expected Results:**
- ✅ Note saves successfully
- ✅ Displays correctly in history

---

## Part 9: UI/UX Tests

### Test Case 9.1: Modal Responsiveness
**Pre-condition:** Any active appointment

**Steps:**
1. Click Reject/Cancel on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected Results:**
- ✅ Modal centered on all screen sizes
- ✅ Text field properly sized
- ✅ Button accessible
- ✅ No horizontal scrolling required

---

### Test Case 9.2: Status Tracker Visual States
**Pre-condition:** Cancelled appointment at step 2

**Steps:**
1. View appointment as patient
2. Inspect status tracker

**Expected Results:**
- ✅ Step 1: Purple circle with white checkmark, purple fill
- ✅ Step 2: Red circle with white X, red fill, shadow
- ✅ Steps 3-6: Gray circles with gray numbers
- ✅ Connecting lines: Purple up to last completed, gray after
- ✅ Active step label: Bold and larger text
- ✅ Smooth transitions/animations

---

### Test Case 9.3: Banner Color and Icon
**Pre-condition:** View rejected appointment as patient

**Steps:**
1. Check banner appearance

**Expected Results:**
- ✅ Background: Red/pink gradient
- ✅ Icon: Red circle with white X
- ✅ Text: "Rejected" heading in red/dark color
- ✅ Message: "Your appointment request has been declined by the clinic"
- ✅ Button: Red with white text "Dismiss to Create New"

---

## Summary Checklist

### Core Functionality
- [ ] Reject creates correct history entry
- [ ] Cancel creates correct history entry
- [ ] No duplicate entries in database
- [ ] Status tracker shows checkmarks correctly
- [ ] Status tracker shows X symbol at correct position
- [ ] RLS policy allows cancelled for staff/dentist
- [ ] Patient view displays rejected appointments
- [ ] Patient view displays cancelled appointments
- [ ] Dismiss button removes appointment from view

### UI/UX
- [ ] Single modal for reject/cancel
- [ ] Custom note field works
- [ ] Red banner displays correctly
- [ ] Status history shows "Dentist/Staff Note" box
- [ ] "Dr." prefix for dentists in history
- [ ] Responsive design on all devices

### Security
- [ ] RLS policies enforced
- [ ] No unauthorized status changes
- [ ] XSS prevention working
- [ ] SQL injection prevention working

### Error Handling
- [ ] Enhanced error logging functional
- [ ] Debug console logs helpful
- [ ] Network errors handled gracefully
- [ ] User-friendly error messages

---

## Test Execution Notes

**Total Test Cases:** 39  
**Estimated Testing Time:** 4-6 hours  
**Priority:** High (affects patient experience)  
**Regression Risk:** Medium (changes status flow logic)

### Testing Order Recommendation:
1. Database & RLS Policy Tests (Part 5) - Foundation
2. REJECTED Appointments (Part 1) - Core functionality
3. CANCELLED Appointments (Part 2) - Core functionality
4. Patient View Tests (Part 3) - User experience
5. Status History Display (Part 4) - Visual verification
6. Console Logging (Part 7) - Debugging aids
7. Error Handling (Part 6) - Edge cases
8. UI/UX Tests (Part 9) - Polish
9. Edge Cases (Part 8) - Coverage completion

