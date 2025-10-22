# Dentabase v0 - Dental Appointment System Context

## Project Overview
A comprehensive dental clinic management system built with Next.js, TypeScript, and Supabase. The system manages appointment scheduling, patient records, and doctor availability with role-based access control.

## Core Functionality

### Appointment Management System
- **Multi-status workflow**: requested → proposed → booked → arrived → ongoing → completed
- **Alternative flows**: rejected, cancelled
- **Admin controls**: Accept, Reschedule, Reject, Cancel, Mark as Arrived/Ongoing/Complete
- **Patient submission**: Request appointments with date/time preferences and medical concerns
- **Duration management**: Auto-calculated or manually set appointment durations

### Calendar & Scheduling Features
- **Three view modes**:
  - **Overall Tab**: Searchable/filterable appointment list with status badges
  - **Weekly Tab**: Time-grid calendar (6 AM - 5 PM) with working hours indicators
  - **Monthly Tab**: Calendar grid with appointment counts and color-coded status bars
- **Quick Week View Modal**: Popup weekly calendar accessible from appointment details
- **Week Navigation**: Previous/Next week controls with date range display
- **Working Hours Display**:
  - Green vertical bar (4px left border) with semi-transparent background
  - Time labels showing start/end times (12-hour format with AM/PM)
  - Database-driven from `doc_availability` table
  - "No availability" label for days without doctor schedules
- **Appointment Cards**:
  - Color-coded by status (blue=requested, amber=proposed, green=booked, purple=arrived, indigo=ongoing, gray=completed, red=cancelled, orange=rejected)
  - Show patient name, time, and status
  - Clickable to open details modal
  - Proper spacing (left: 12px, right: 4px in modal; left/right: 8px in main tab)
  - Cancelled appointments hidden from weekly views

### Doctor Availability System
- **Database Integration**: `doc_availability` table with columns:
  - `doctor_id`, `day` (lowercase: sunday, monday, etc.)
  - `start_time`, `end_time` (24-hour format)
  - `is_enabled` (boolean filter)
- **Dynamic Display**: Different working hours per doctor/day
- **Time Calculations**: 48px per hour grid, 6 AM baseline

### User Interface Components

#### Main Pages
- `/appointments/admin/page.tsx` (2975+ lines) - Central appointment management
- `/appointments/patient` - Patient-facing appointment requests
- Login/Register pages with role-based routing
- Dashboard layouts for admin vs patient roles

#### Key Modals
- **Appointment Details Modal**: Full patient info, emergency contacts, notes, action buttons
- **Quick Week View Modal**: Compact weekly calendar, centered navigation
- **Reschedule Modal**: Propose new date/time with current appointment context
- **Accept Modal**: Set end time when accepting requested appointments
- **Reason Dialogs**: Required for reject/cancel actions
- **Day Appointments Modal**: List view for monthly calendar day clicks
- **New Appointment Modal**: Admin can create appointments directly

#### Reusable Components
- `CalendarRange`: Custom date picker with range selection
- `NewAppointmentModal`: Appointment creation form
- Status badges with color-coded workflow labels
- Avatar components with patient initials
- Search/Filter controls with date range and status filters

## Technical Architecture

### Authentication & Authorization
- Supabase Auth for user management
- Role-based access: `admin`, `patient`, `doctor`
- Auth context handling across application
- Protected routes with role checks

### Database Schema
- **Location**: `/database/schema/`
- **Key Tables**:
  - `appointments` - Core appointment data
  - `doc_availability` - Doctor working hours/schedules
  - `users` - User accounts with roles
  - `patients` - Patient profiles
  - `doctors` - Doctor profiles
  - `appointment_status_history` - Audit trail for status changes

### State Management
- React `useState` for local component state
- `useEffect` hooks for data fetching on mount
- State variables:
  - `appointments` - All appointment records
  - `doctorAvailabilities` - Grouped by doctor_id
  - `currentWeekStart` / `quickViewWeekStart` - Week navigation
  - `calendarMonth` - Month view navigation
  - `selectedAppointment` - Currently viewed appointment
  - Various modal open/close states

### Helper Functions
- `formatLocalDate()` - Date to YYYY-MM-DD string
- `formatTime12h()` - Convert 24hr to 12hr format with AM/PM
- `getAvailabilityForDate()` - Find doctor schedule for specific date
- `getWeekDays()` - Generate array of 7 days from start date
- `formatDateRange()` - Display week range (e.g., "Oct 19 - Oct 25, 2025")
- `getStatusColor()` - Map status to Tailwind color classes
- `getStatusDisplayLabel()` - User-friendly status labels

### Styling Decisions
- Tailwind CSS with custom HSL color scheme: `hsl(258, 46%, 25%)` (purple)
- Responsive grid layouts: `grid-cols-[80px_repeat(7,1fr)]` for weekly calendar
- Transition animations: `active:scale-[0.97]` for button press effects
- Color-coded status system for visual clarity
- Semi-transparent overlays for past dates and working hours

## Recent Implementations

### Working Hours Feature
- Replaced hardcoded 9-5 hours with database-driven schedules
- Added `fetchDoctorAvailabilities()` function
- Integrated time labels (start/end) positioned outside green bar
- Consistent implementation across Weekly tab and Quick Week View modal

### Visual Enhancements
- Fixed green bar styling (was full background, now vertical bar)
- Added top/bottom indicator lines for working hours boundaries
- Increased appointment card margins to prevent overlap
- "No availability" labels for days without doctor schedules
- Removed cancelled appointments from weekly calendar views

### Modal UX Improvements
- Centered week navigation in Quick Week View modal
- Fixed overlapping close button (X) and navigation controls
- Proper spacing: title on line 1, navigation centered on line 2
- Added `pr-6` padding to account for close button

## Appointment Workflow Behavior

### Status Transitions
1. **Patient submits** → `requested` status
2. **Admin accepts** → `proposed` status (awaiting patient confirmation)
3. **Patient confirms** → `booked` status
4. **Patient arrives** → `arrived` status
5. **Treatment starts** → `ongoing` status
6. **Treatment ends** → `completed` status

### Alternative Flows
- **Admin rejects** → `rejected` status (requires reason)
- **Admin/Patient cancels** → `cancelled` status (requires reason)
- **Admin reschedules** → Update date/time, set to `proposed`

### Action Requirements
- **Accept**: Must set end time (calculates duration)
- **Reschedule**: Must provide new date + start/end time
- **Reject/Cancel**: Must provide reason (visible in appointment details)

## Current Development State
- Core appointment system fully functional
- Database integration complete with actual doctor schedules
- UI polished with proper spacing and responsive design
- Weekly calendar optimized for admin workflow
- Ready for production testing with real data

## Known Considerations
- Past dates show "Past date" overlay (no interactions)
- Multiple doctors on same day: uses first appointment's doctor for availability
- Time slots span 6 AM to 5 PM (6-17 hours)
- 48px per hour grid system for precise positioning
- Cancelled appointments excluded from weekly views but visible in Overall tab
