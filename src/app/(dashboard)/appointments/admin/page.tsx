"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, User, Phone, Mail, ArrowLeft, Check, X, AlertTriangle, RotateCcw, Users, Stethoscope, FileText, Flag, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CalendarRange from "@/components/ui/calendar-range";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AdminNewAppointmentModal } from "@/components/AdminNewAppointmentModal";
import RescheduleModal from "@/components/RescheduleModal";
import AcceptAppointmentModal from "@/components/AcceptAppointmentModal";
import { StatusFlowGuide } from "@/components/StatusFlowGuide";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  date: string;
  time: string;
  service: string;
  concern?: string;
  status: "requested" | "proposed" | "booked" | "arrived" | "ongoing" | "completed" | "cancelled" | "rejected";
  duration: string;
  doctorId: string;
  doctorName: string;
  notes?: string;
  actionReason?: string;
  // ISO timestamp when the appointment was requested
  requestedAt?: string;
  // New fields for proposed/booked times
  proposedStartTime?: string;
  proposedEndTime?: string;
  bookedStartTime?: string;
  bookedEndTime?: string;
  // Status history
  statusHistory?: Array<{
    history_id: string;
    status: string;
    changed_at: string;
    notes?: string;
    changed_by_user_id: string;
    changed_by_name?: string;
  }>;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  todayAppointments: number;
  pendingApprovals: number;
}

function getStatusColor(status: Appointment["status"]) {
  switch (status) {
    case "requested":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "proposed":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "booked":
      return "bg-green-100 text-green-800 border-green-200";
    case "arrived":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "ongoing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getStatusDisplayLabel(status: Appointment["status"]) {
  switch (status) {
    case "requested":
      return "Incoming";
    case "proposed":
      return "Awaiting";
    case "booked":
      return "Confirmed";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(n => n.length > 0);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  // First letter of first name + first letter of last name
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateTime(dateStr: string, timeStr: string) {
  // Combine date (YYYY-MM-DD) and time (HH:mm) into a local Date
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);

  const mmddyy = new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }).format(dt);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dt);

  return `${mmddyy}, ${time}`;
}

function formatDateShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

function formatTime12h(timeStr: string) {
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date();
  dt.setHours(hh || 0, mm || 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
}

function formatDateTimeFromISO(iso?: string) {
  if (!iso) return "-";
  const dt = new Date(iso);
  const date = new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }).format(dt);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
  return `${date}, ${time}`;
}

function formatRequestedConcise(iso?: string) {
  if (!iso) return "-";
  const dt = new Date(iso);
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(dt); // e.g., Sep 28
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dt); // e.g., 2:30 PM
  return `${monthDay}, ${time}`; // e.g., Sep 28, 2:30 PM
}

// Helpers to format ISO timestamp into separate date/time lines to match table layout
function formatDateShortFromISO(iso?: string) {
  if (!iso) return "-";
  const dt = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

function formatTime12hFromISO(iso?: string) {
  if (!iso) return "-";
  const dt = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
}

export default function AdminAppointmentsPage() {
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Database state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorAvailabilities, setDoctorAvailabilities] = useState<Record<string, Array<{day: string, startTime: string, endTime: string}>>>({});
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"overall" | "weekly" | "calendar">("overall");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  // Calendar picker state (demo uses fixed 'today' to match sample data)
  const demoToday = new Date(); // Use actual current date
  const minDate = new Date(demoToday.getFullYear(), demoToday.getMonth(), demoToday.getDate());
  const [selectedStart, setSelectedStart] = useState<Date | null>(minDate);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  // When true and only selectedStart is set, treat as date >= selectedStart (upcoming)
  const [fromStart, setFromStart] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const [showListBottomFade, setShowListBottomFade] = useState(false);
  const [showListTopShadow, setShowListTopShadow] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const monthYearPickerRef = useRef<HTMLDivElement | null>(null);

  // Propose Time Modal state
  const [isProposeTimeOpen, setIsProposeTimeOpen] = useState(false);
  const [proposeAppointment, setProposeAppointment] = useState<Appointment | null>(null);
  const [proposeDate, setProposeDate] = useState("");
  const [proposeTime, setProposeTime] = useState("");
  const [proposeEndTime, setProposeEndTime] = useState("");
  const [proposeReason, setProposeReason] = useState("");
  const [isProposing, setIsProposing] = useState(false);

  // Accept Appointment Modal state (for setting end time)
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [acceptAppointment, setAcceptAppointment] = useState<Appointment | null>(null);
  const [acceptEndTime, setAcceptEndTime] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAcceptConfirmOpen, setIsAcceptConfirmOpen] = useState(false);
  const [acceptFeedback, setAcceptFeedback] = useState("");


  // Weekly calendar state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Sunday
    return new Date(today.setDate(diff));
  });

  // Helper functions for weekly calendar
  const getWeekDays = (startDate: Date): Date[] => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    const year = endDate.getFullYear();
    
    return `${start} – ${end}, ${year}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7));
      return newDate;
    });
  };

  // Get availability for a specific date (checks all doctors who have appointments on that day)
  const getAvailabilityForDate = (date: Date): {startTime: string, endTime: string} | null => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dateStr = formatLocalDate(date);
    
    // Find appointments on this date to determine which doctors are working
    const dayAppointments = appointments.filter(apt => apt.date === dateStr);
    
    if (dayAppointments.length === 0) {
      // No appointments, check if any doctor has availability for this day
      for (const doctorId in doctorAvailabilities) {
        const availabilities = doctorAvailabilities[doctorId];
        const dayAvail = availabilities.find(a => a.day === dayName);
        if (dayAvail) {
          return { startTime: dayAvail.startTime, endTime: dayAvail.endTime };
        }
      }
      return null;
    }
    
    // Get the doctor from the first appointment (or we could aggregate all doctors)
    const firstAppointment = dayAppointments[0];
    const doctorId = firstAppointment.doctorId;
    
    const doctorAvails = doctorAvailabilities[doctorId];
    if (!doctorAvails) return null;
    
    const dayAvail = doctorAvails.find(a => a.day === dayName);
    return dayAvail ? { startTime: dayAvail.startTime, endTime: dayAvail.endTime } : null;
  };

  // Fetch appointments from database
  const fetchAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      setError(null);
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        setError('Authentication failed');
        setIsLoadingAppointments(false);
        return;
      }

      if (!user) {
        setError('Not authenticated');
        setIsLoadingAppointments(false);
        return;
      }

      // Get current user's role and related IDs
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User data fetch error:', userError);
        setError('Failed to load user data');
        setIsLoadingAppointments(false);
        return;
      }

      console.log('Current user role:', userData.role);

      // Build base query
      let query = supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          concern,
          status,
          requested_start_time,
          proposed_start_time,
          proposed_end_time,
          booked_start_time,
          booked_end_time,
          availability_id,
          feedback_type,
          feedback,
          created_at,
          updated_at,
          is_active,
          patient (
            patient_id,
            user_id,
            emergency_contact_name,
            emergency_contact_no,
            users (
              first_name,
              middle_name,
              last_name,
              email,
              phone_number
            )
          ),
          doctors (
            doctor_id,
            specialization,
            user_id,
            users (
              first_name,
              middle_name,
              last_name
            )
          )
        `);
        // Removed .eq('is_active', true) to show all appointments including inactive ones

      // Apply role-based filtering
      if (userData.role === 'dentist') {
        // Dentist can only see their own patients
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('doctor_id, users!inner(first_name, last_name)')
          .eq('user_id', userData.user_id)
          .single();

        if (doctorError || !doctorData) {
          console.error('Doctor data fetch error:', doctorError);
          setError('Failed to load doctor data');
          setIsLoadingAppointments(false);
          return;
        }

        console.log('Filtering by doctor_id:', doctorData.doctor_id);
        setCurrentUserDoctorId(doctorData.doctor_id);
        const doctorUser = doctorData.users as any;
        setCurrentUserDoctorName(`Dr. ${doctorUser.last_name}`);
        query = query.eq('doctor_id', doctorData.doctor_id);

      } else if (userData.role === 'staff' || userData.role === 'dental_staff') {
        // Staff can only see their doctor's patients
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('doctor_id, doctors!inner(users!inner(first_name, last_name))')
          .eq('user_id', userData.user_id)
          .single();

        if (staffError || !staffData) {
          console.error('Staff data fetch error:', staffError);
          setError('Failed to load staff data');
          setIsLoadingAppointments(false);
          return;
        }

        // CRITICAL: Ensure doctor_id exists and is valid
        if (!staffData.doctor_id) {
          console.error('Staff member has no assigned doctor_id:', userData.user_id);
          setError('Staff member not assigned to any doctor. Please contact admin.');
          setIsLoadingAppointments(false);
          return;
        }

        console.log('✅ Filtering appointments by staff\'s doctor_id:', staffData.doctor_id);
        setCurrentUserDoctorId(staffData.doctor_id);
        const staffDoctor = staffData.doctors as any;
        const staffDoctorUser = staffDoctor.users as any;
        setCurrentUserDoctorName(`Dr. ${staffDoctorUser.last_name}`);
        
        // Apply doctor_id filter to query
        query = query.eq('doctor_id', staffData.doctor_id);
        console.log('✅ Query filter applied for doctor_id:', staffData.doctor_id);
      }
      // Admin can see all appointments (no additional filter)

      // Execute query
      const { data: appointmentsData, error: appointmentsError } = await query.order('created_at', { ascending: false });

      console.log('Appointments data:', appointmentsData);
      console.log('Appointments error:', appointmentsError);
      
      // Debug: Check patient data structure
      if (appointmentsData && appointmentsData.length > 0) {
        console.log('First appointment patient structure:', appointmentsData[0].patient);
        console.log('First appointment doctor structure:', appointmentsData[0].doctors);
      }

      if (appointmentsError) {
        console.error('Appointments fetch error:', appointmentsError);
        console.error('Error details:', JSON.stringify(appointmentsError, null, 2));
        console.error('Error message:', appointmentsError.message);
        console.error('Error code:', appointmentsError.code);
        console.error('Error hint:', appointmentsError.hint);
        console.error('Error details object:', appointmentsError.details);
        setError('Failed to load appointments');
        setIsLoadingAppointments(false);
        return;
      }

      // Transform database format to component format
      const transformedAppointments: Appointment[] = (appointmentsData || []).map((apt: any) => {
        // Calculate duration from start/end times
        const calculateDuration = (start?: string, end?: string) => {
          if (!start || !end) return '60 min';
          const startTime = new Date(start);
          const endTime = new Date(end);
          const diffMs = endTime.getTime() - startTime.getTime();
          const diffMins = Math.round(diffMs / 60000);
          return `${diffMins} min`;
        };

        // Determine which time to display based on status
        let displayTime = apt.requested_start_time;
        if (apt.status === 'booked' && apt.booked_start_time) {
          displayTime = apt.booked_start_time;
        } else if (apt.status === 'proposed' && apt.proposed_start_time) {
          displayTime = apt.proposed_start_time;
        }

        const displayDate = new Date(displayTime);
        
        // Calculate end time - fallback to 60 min if no end time exists
        const getEndTime = () => {
          if (apt.booked_end_time) return apt.booked_end_time;
          if (apt.proposed_end_time) return apt.proposed_end_time;
          // No requested_end_time in schema, default to 60 min
          const start = new Date(apt.requested_start_time);
          start.setMinutes(start.getMinutes() + 60);
          return start.toISOString();
        };

        // Format date using LOCAL timezone (not UTC) to prevent date shifting
        const year = displayDate.getFullYear();
        const month = String(displayDate.getMonth() + 1).padStart(2, '0');
        const day = String(displayDate.getDate()).padStart(2, '0');
        const localDateString = `${year}-${month}-${day}`;

        // Format time using local hours/minutes
        const hours = String(displayDate.getHours()).padStart(2, '0');
        const minutes = String(displayDate.getMinutes()).padStart(2, '0');
        const localTimeString = `${hours}:${minutes}`;
        
        return {
          id: apt.appointment_id,
          patientName: apt.patient?.users 
            ? `${apt.patient.users.first_name || ''} ${apt.patient.users.middle_name || ''} ${apt.patient.users.last_name || ''}`.trim()
            : 'Unknown Patient',
          patientEmail: apt.patient?.users?.email || 'N/A',
          patientPhone: apt.patient?.users?.phone_number || 'N/A',
          emergencyContactName: apt.patient?.emergency_contact_name || 'N/A',
          emergencyContactNumber: apt.patient?.emergency_contact_no || 'N/A',
          date: localDateString,
          time: localTimeString,
          service: apt.concern || 'General Consultation',
          concern: apt.concern || 'N/A',
          status: apt.status,
          duration: calculateDuration(
            apt.booked_start_time || apt.proposed_start_time || apt.requested_start_time,
            getEndTime()
          ),
          doctorId: apt.doctor_id,
          doctorName: apt.doctors?.users 
            ? `Dr. ${apt.doctors.users.last_name || 'Unknown'}`
            : 'Dr. Unknown',
          notes: apt.feedback || '',
          requestedAt: apt.created_at,
          proposedStartTime: apt.proposed_start_time,
          proposedEndTime: apt.proposed_end_time,
          bookedStartTime: apt.booked_start_time,
          bookedEndTime: apt.booked_end_time,
        };
      });

      setAppointments(transformedAppointments);
      setIsLoadingAppointments(false);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('An unexpected error occurred');
      setIsLoadingAppointments(false);
    }
  };

  // Fetch doctors from database
  const fetchDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const supabase = createClient();

      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select(`
          doctor_id,
          specialization,
          users:user_id (
            first_name,
            middle_name,
            last_name
          )
        `);

      if (doctorsError) {
        console.error('Doctors fetch error:', doctorsError);
        console.error('Error details:', JSON.stringify(doctorsError, null, 2));
        console.error('Error message:', doctorsError.message);
        console.error('Error code:', doctorsError.code);
        setIsLoadingDoctors(false);
        return;
      }

      // Transform doctors data
      const transformedDoctors: Doctor[] = (doctorsData || []).map((doc: any) => {
        const doctorName = doc.users 
          ? `Dr. ${doc.users.last_name || 'Unknown'}`
          : 'Dr. Unknown';
        
        return {
          id: doc.doctor_id,
          name: doctorName,
          specialty: doc.specialization || 'General Dentistry',
          todayAppointments: 0, // Will be calculated from appointments
          pendingApprovals: 0, // Will be calculated from appointments
        };
      });

      setDoctors(transformedDoctors);
      setIsLoadingDoctors(false);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setIsLoadingDoctors(false);
    }
  };

  // Fetch doctor availabilities from doc_availability table
  const fetchDoctorAvailabilities = async () => {
    try {
      const supabase = createClient();
      
      const { data: availabilitiesData, error } = await supabase
        .from('doc_availability')
        .select('doctor_id, day, start_time, end_time')
        .eq('is_enabled', true);

      if (error) {
        console.error('Error fetching doctor availabilities:', error);
        return;
      }

      // Group availabilities by doctor_id
      const grouped: Record<string, Array<{day: string, startTime: string, endTime: string}>> = {};
      
      (availabilitiesData || []).forEach((avail: any) => {
        if (!grouped[avail.doctor_id]) {
          grouped[avail.doctor_id] = [];
        }
        grouped[avail.doctor_id].push({
          day: avail.day.toLowerCase(), // sunday, monday, etc.
          startTime: avail.start_time,
          endTime: avail.end_time,
        });
      });

      setDoctorAvailabilities(grouped);
      console.log('Doctor availabilities loaded:', grouped);
    } catch (err) {
      console.error('Error fetching doctor availabilities:', err);
    }
  };

  // Notification helpers
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Propose Time handlers
  const handleProposeTime = (appointment: Appointment) => {
    setProposeAppointment(appointment);
    setProposeDate(appointment.date);
    setProposeTime(appointment.time);
    setProposeEndTime("");
    setProposeReason("");
    setIsProposeTimeOpen(true);
  };

  // Accept Appointment - Show confirmation dialog
  const handleAcceptAppointmentClick = () => {
    if (!acceptAppointment) {
      return;
    }
    
    // If no end time is set, set a default (1 hour after start time)
    if (!acceptEndTime) {
      const startTime = acceptAppointment.time;
      const [hours, minutes] = startTime.split(':').map(Number);
      let endHour = hours + 1;
      if (endHour >= 24) endHour = 23;
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      setAcceptEndTime(endTimeStr);
    }
    
    // Close the time selection modal and open confirmation
    setIsAcceptModalOpen(false);
    setIsAcceptConfirmOpen(true);
  };

  // Accept Appointment - Final submission
  const handleAcceptAppointmentConfirm = async () => {
    if (!acceptAppointment || !acceptEndTime) {
      return;
    }

    try {
      setIsAccepting(true);
      const supabase = createClient();
      
      // Fetch the original appointment to get the requested_start_time
      const { data: originalApt, error: fetchError } = await supabase
        .from('appointments')
        .select('requested_start_time, appointment_id')
        .eq('appointment_id', acceptAppointment.id)
        .single();

      if (fetchError) throw fetchError;
      if (!originalApt) throw new Error('Appointment not found');

      // Use the requested_start_time as the proposed_start_time
      const proposedStartTime = originalApt.requested_start_time;
      
      // Construct the proposed_end_time from the date and the acceptEndTime (HH:mm format)
      const startDate = new Date(proposedStartTime);
      const [endHours, endMinutes] = acceptEndTime.split(':').map(Number);
      const proposedEndTime = new Date(startDate);
      proposedEndTime.setHours(endHours, endMinutes, 0, 0);
      
      // Get user data for history (before updating appointment)
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Auth user:', user?.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user?.id) // ✅ FIX: Use auth_id instead of id
        .single();

      console.log('User data:', userData, 'Error:', userError);

      if (userError || !userData) {
        console.error('Failed to get user data:', userError);
        throw new Error('User data not found');
      }

      // HYBRID APPROACH: Insert status history manually with custom notes
      // This prevents the trigger from auto-creating a generic history entry
      const defaultNote = 'Your appointment has been accepted. Please confirm the time.';
      // ✅ FIX: Don't combine - store separately!
      // notes = default message only
      // feedback = staff's custom note only

      console.log('Attempting to insert history:', {
        appointment_id: acceptAppointment.id,
        status: 'proposed',
        changed_by_user_id: userData?.user_id,
        notes: defaultNote, // ✅ Only default message
        feedback: acceptFeedback.trim() || null, // ✅ Only custom feedback
        related_time: proposedStartTime,
        related_end_time: proposedEndTime.toISOString(),
      });

      const { data: historyData, error: historyError } = await supabase
        .from('appointment_status_history')
        .insert({
          appointment_id: acceptAppointment.id,
          status: 'proposed',
          changed_by_user_id: userData?.user_id,
          notes: defaultNote, // ✅ Store only the default message
          feedback: acceptFeedback.trim() || null, // ✅ Store feedback in separate column
          related_time: proposedStartTime,
          related_end_time: proposedEndTime.toISOString(),
          changed_at: new Date().toISOString()
        })
        .select();

      if (historyError) {
        console.error('Detailed history error:', {
          message: historyError.message,
          details: historyError.details,
          hint: historyError.hint,
          code: historyError.code,
          full: historyError
        });
        throw historyError; // Don't continue if history insert fails
      }

      console.log('History inserted successfully:', historyData);

      // Now update the appointment status (NO feedback field - that's in history!)
      const { error } = await supabase
        .from('appointments')
        .update({ 
          proposed_start_time: proposedStartTime,
          proposed_end_time: proposedEndTime.toISOString(),
          status: 'proposed',
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', acceptAppointment.id);

      if (error) throw error;

      // Close all modals and reset state
      setIsAcceptConfirmOpen(false);
      setAcceptAppointment(null);
      setAcceptEndTime("");
      setAcceptFeedback("");
      setIsAppointmentModalOpen(false);
      setSelectedAppointment(null);
      
      // Show success notification
      showNotification('success', 'Appointment Accepted', 'Appointment has been accepted and sent to patient for confirmation.');

      fetchAppointments();
    } catch (error) {
      console.error('Error accepting appointment:', error);
      showNotification('error', 'Error', 'Failed to accept appointment. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSubmitProposedTime = async (data: { date: string; startTime: string; endTime: string; reason?: string }) => {
    if (!proposeAppointment) {
      showNotification('error', 'Error', 'No appointment selected.');
      return;
    }

    try {
      setIsProposing(true);
      const supabase = createClient();
      
      // Construct full ISO timestamps from date and times
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`);
      
      // Get user data for history (before updating appointment)
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user?.id) // ✅ FIX: Use auth_id instead of id
        .single();

      // HYBRID APPROACH: Insert status history manually with custom notes
      const defaultNote = 'Your appointment time has been rescheduled. Please confirm the new time.';
      // ✅ FIX: Don't combine - store separately!
      
      const { error: historyError } = await supabase
        .from('appointment_status_history')
        .insert({
          appointment_id: proposeAppointment.id,
          status: 'proposed',
          changed_by_user_id: userData?.user_id,
          notes: defaultNote, // ✅ Only default message
          feedback: data.reason?.trim() || null, // ✅ Only custom feedback
          related_time: startDateTime.toISOString(),
          related_end_time: endDateTime.toISOString(),
          changed_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('Error inserting status history:', historyError);
        throw historyError; // Don't continue if history insert fails
      }

      // Now update the appointment (NO feedback field - that's in history!)
      const { error } = await supabase
        .from('appointments')
        .update({ 
          proposed_start_time: startDateTime.toISOString(),
          proposed_end_time: endDateTime.toISOString(),
          status: 'proposed',
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', proposeAppointment.id);

      if (error) throw error;

      // Close both modals
      setIsProposeTimeOpen(false);
      setProposeAppointment(null);
      setProposeDate("");
      setProposeTime("");
      setProposeEndTime("");
      setProposeReason("");
      setIsAppointmentModalOpen(false);
      setSelectedAppointment(null);
      
      // Show success notification
      showNotification('success', 'Time Rescheduled', 'New appointment time has been sent to the patient for confirmation.');

      fetchAppointments();
    } catch (error) {
      console.error('Error proposing time:', error);
      showNotification('error', 'Error', 'Failed to propose new time. Please try again.');
    } finally {
      setIsProposing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchDoctorAvailabilities();
  }, []);

  // Set up real-time subscription for appointments
  useEffect(() => {
    const supabase = createClient();
    
    // Create a channel for real-time updates
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'appointments'
          // Removed filter to listen to all appointments including inactive ones
        },
        (payload) => {
          console.log('Real-time appointment change:', payload);
          // Refresh appointments when any change occurs
          fetchAppointments();
        }
      )
      .subscribe();

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update doctor stats when appointments change
  useEffect(() => {
    if (appointments.length > 0 && doctors.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const updatedDoctors = doctors.map(doctor => {
        const doctorAppointments = appointments.filter(apt => apt.doctorId === doctor.id);
        const todayAppointments = doctorAppointments.filter(apt => apt.date === todayStr);
        const pendingApprovals = doctorAppointments.filter(apt => apt.status === 'requested');
        
        return {
          ...doctor,
          todayAppointments: todayAppointments.length,
          pendingApprovals: pendingApprovals.length,
        };
      });
      
      setDoctors(updatedDoctors);
    }
  }, [appointments]);

  // Close on outside click/ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isDateFilterOpen) return;
      const t = e.target as Node;
      if (popRef.current && !popRef.current.contains(t)) {
        setIsDateFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDateFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isDateFilterOpen]);

  // Manage bottom fade visibility for the appointments list
  useEffect(() => {
    const updateFade = () => {
      const el = listScrollRef.current;
      if (!el) {
        setShowListBottomFade(false);
        setShowListTopShadow(false);
        return;
      }
      const canScroll = el.scrollHeight > el.clientHeight + 1;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      const atTop = el.scrollTop <= 1;
      setShowListBottomFade(canScroll && !atBottom);
      setShowListTopShadow(canScroll && !atTop);
    };

    // Run after render to measure
    const rAF = requestAnimationFrame(updateFade);
    const el = listScrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateFade);
    }
    window.addEventListener("resize", updateFade);
    return () => {
      cancelAnimationFrame(rAF);
      if (el) el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
    };
  }, [appointments, activeTab, selectedStart, selectedEnd, filterStatus, searchTerm]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [currentUserDoctorId, setCurrentUserDoctorId] = useState<string>('');
  const [currentUserDoctorName, setCurrentUserDoctorName] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState("");
  type ActionType = "accept" | "arrive" | "ongoing" | "complete" | "reject" | "cancel";
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: ActionType; appointment: Appointment | null }>({ type: "accept", appointment: null });
  const [actionReasonText, setActionReasonText] = useState("");
  
  // Calendar view state
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
  const [pickerView, setPickerView] = useState<"month" | "year">("month"); // Track which view is active
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear()); // Track year for month view
  const [yearPageStart, setYearPageStart] = useState<number>(new Date().getFullYear() - 6); // Track year grid start
  const [isQuickWeekViewOpen, setIsQuickWeekViewOpen] = useState(false);
  const [quickViewWeekStart, setQuickViewWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Get Sunday
    return new Date(today.setDate(diff));
  });

  // Close month/year picker on outside click/ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isMonthYearPickerOpen) return;
      const t = e.target as Node;
      if (monthYearPickerRef.current && !monthYearPickerRef.current.contains(t)) {
        setIsMonthYearPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMonthYearPickerOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isMonthYearPickerOpen]);

  // Date helpers
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isBeforeDay = (a: Date, b: Date) => startOfDay(a).getTime() < startOfDay(b).getTime();
  const isAfterDay = (a: Date, b: Date) => startOfDay(a).getTime() > startOfDay(b).getTime();
  const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const formatMonthYear = (d: Date) => new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
  const formatLabel = (start: Date | null, end: Date | null) => {
    if (start && end) {
      const f = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
      return `${f.format(start)} – ${f.format(end)}`;
    }
    if (start) {
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start);
    }
    return "No date selected";
  };

  const handleNewAppointment = (newAppointment: Appointment) => {
    const appointmentWithDoctor = {
      ...newAppointment,
      doctorId: "doc1",
      doctorName: "Dr. Smith",
      requestedAt: new Date().toISOString(),
    };
    setAppointments([...appointments, appointmentWithDoctor]);
    showNotification('success', 'Appointment Scheduled', `Appointment for ${newAppointment.patientName} has been scheduled successfully.`);
  };

  const demoTodayStr = toYMD(minDate);
  const todayAppointments = appointments.filter(apt => apt.date === demoTodayStr);
  const pendingApprovals = appointments.filter(apt => apt.status === "requested").length;
  const completedThisWeek = appointments.filter(apt => apt.status === "completed").length;

  // Determine if any filters deviate from defaults
  // Defaults: Date = today (single day), Status = all, fromStart = false
  const hasNonDefaultFilters = !(
    filterStatus === "all" &&
    selectedEnd === null &&
    fromStart === false &&
    !!selectedStart && isSameDay(selectedStart, minDate)
  );

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment["status"], reason?: string) => {
    try {
      console.log('Updating appointment:', { appointmentId, newStatus, reason });
      const supabase = createClient();
      
      // Get current user for history record
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Get user_id from auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // HYBRID APPROACH: Determine if we need manual history insertion
      // Manual insert for: rejected, cancelled (need custom notes with reasons)
      // Auto-insert by trigger for: arrived, ongoing, completed (simple status changes)
      const needsManualHistory = ['rejected', 'cancelled'].includes(newStatus);

      if (needsManualHistory) {
        // Fetch appointment to get the correct time to snapshot
        const { data: appointmentData, error: fetchError } = await supabase
          .from('appointments')
          .select('requested_start_time')
          .eq('appointment_id', appointmentId)
          .single();

        if (fetchError) {
          console.error('Error fetching appointment:', fetchError);
          throw fetchError;
        }

        // Insert status history BEFORE updating appointment (for reject/cancel with custom notes)
        const defaultNotes: Record<string, string> = {
          'cancelled': 'Your appointment has been cancelled.',
          'rejected': 'Unfortunately, your appointment request could not be accommodated.'
        };

        const historyNotes = defaultNotes[newStatus] || `Your appointment status has been updated.`;
        // ✅ FIX: Don't combine - store separately!

        console.log('Attempting to insert history:', {
          appointment_id: appointmentId,
          status: newStatus,
          changed_by_user_id: userData.user_id,
          notes: historyNotes,
          feedback: reason?.trim() || null,
          related_time: appointmentData?.requested_start_time
        });

        const { error: historyError } = await supabase
          .from('appointment_status_history')
          .insert({
            appointment_id: appointmentId,
            status: newStatus,
            changed_by_user_id: userData.user_id,
            notes: historyNotes, // ✅ Only default message
            feedback: reason?.trim() || null, // ✅ Only custom feedback
            related_time: appointmentData?.requested_start_time,
            related_end_time: null
            // Don't set changed_at - let database handle it with DEFAULT now()
          });

        if (historyError) {
          console.error('Error inserting status history:', {
            message: historyError.message,
            details: historyError.details,
            hint: historyError.hint,
            code: historyError.code
          });
          throw historyError; // Don't continue if history insert fails
        }
      }
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add reason to feedback if provided (for rejected/cancelled status)
      // This also signals the trigger to skip auto-insertion
      if (reason || needsManualHistory) {
        updateData.feedback = reason || (needsManualHistory ? `Status changed to ${newStatus}` : undefined);
        // Set feedback_type based on status (using enum values: rejected, cancelled, rescheduled)
        if (newStatus === 'rejected') {
          updateData.feedback_type = 'rejected';
        } else if (newStatus === 'cancelled') {
          updateData.feedback_type = 'cancelled';
        }
      }

      console.log('Update data:', updateData);

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('appointment_id', appointmentId)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // For simple status changes (arrived, ongoing, completed), the trigger handles history automatically
      // No manual insertion needed

      // Show appropriate notification based on status
      if (newStatus === 'rejected') {
        showNotification('success', 'Appointment Rejected', reason ? `Appointment has been rejected. Reason: ${reason}` : 'Appointment has been rejected.');
      } else if (newStatus === 'cancelled') {
        showNotification('success', 'Appointment Cancelled', reason ? `Appointment has been cancelled. Reason: ${reason}` : 'Appointment has been cancelled.');
      } else if (newStatus === 'arrived') {
        showNotification('success', 'Patient Arrived', 'Patient has been marked as arrived.');
      } else if (newStatus === 'ongoing') {
        showNotification('success', 'Appointment Ongoing', 'Appointment is now ongoing.');
      } else if (newStatus === 'completed') {
        showNotification('success', 'Appointment Completed', 'Appointment has been marked as completed.');
      } else {
        const nice = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        showNotification('success', 'Status Updated', `Appointment status changed to ${nice}.`);
      }

      // Refresh appointments to get latest data
      fetchAppointments();
    } catch (error: any) {
      console.error('Error updating appointment status:', {
        message: error?.message || 'Unknown error',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        code: error?.code || 'No code',
        full: error
      });
      showNotification('error', 'Error', 'Failed to update appointment status. Please try again.');
    }
  };

  const openConfirm = (appointment: Appointment, type: ActionType) => {
    // Special handling for accept - open end time modal
    if (type === "accept") {
      setAcceptAppointment(appointment);
      setAcceptEndTime("");
      setIsAcceptModalOpen(true);
      return;
    }
    setPendingAction({ type, appointment });
    setIsConfirmDialogOpen(true);
  };

  const openReason = (appointment: Appointment, type: Extract<ActionType, "reject" | "cancel">) => {
    setPendingAction({ type, appointment });
    setActionReasonText("");
    setIsReasonDialogOpen(true);
  };

  const applyConfirmedAction = () => {
    if (!pendingAction.appointment) return;
    const apt = pendingAction.appointment;
    
    // Capture actionReasonText BEFORE clearing it
    const feedback = actionReasonText.trim();
    
    // Note: reject and cancel are handled by applyReasonAction(), not here
    if (pendingAction.type === "accept") {
      handleStatusChange(apt.id, "proposed", feedback);
    } else if (pendingAction.type === "arrive") {
      handleStatusChange(apt.id, "arrived", feedback);
    } else if (pendingAction.type === "ongoing") {
      handleStatusChange(apt.id, "ongoing", feedback);
    } else if (pendingAction.type === "complete") {
      handleStatusChange(apt.id, "completed", feedback);
    }
    setIsConfirmDialogOpen(false);
    setActionReasonText("");
    
    // Close appointment details modal if open
    if (isAppointmentModalOpen) {
      setIsAppointmentModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const applyReasonAction = () => {
    // For reject/cancel: directly execute the action with feedback
    if (!pendingAction.appointment) return;
    if (!actionReasonText.trim()) return;
    
    const apt = pendingAction.appointment;
    const feedback = actionReasonText.trim();
    
    if (pendingAction.type === "reject") {
      handleStatusChange(apt.id, "rejected", feedback);
    } else if (pendingAction.type === "cancel") {
      handleStatusChange(apt.id, "cancelled", feedback);
    }
    
    setIsReasonDialogOpen(false);
    setActionReasonText("");
    
    // Close appointment details modal if open
    if (isAppointmentModalOpen) {
      setIsAppointmentModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentNotes(appointment.notes || "");
    setIsAppointmentModalOpen(true);
    
    // Fetch status history for this appointment
    try {
      const supabase = createClient();
      const { data: historyData, error: historyError } = await supabase
        .from('appointment_status_history')
        .select(`
          history_id,
          status,
          changed_at,
          notes,
          feedback,
          changed_by_user_id,
          users:changed_by_user_id (
            first_name,
            middle_name,
            last_name,
            role
          )
        `)
        .eq('appointment_id', appointment.id)
        .order('changed_at', { ascending: false });

      if (!historyError && historyData) {
        const historyWithNames = historyData.map((h: any) => ({
          ...h,
          changed_by_name: h.users 
            ? `${h.users.role === 'dentist' ? 'Dr. ' : ''}${h.users.first_name || ''} ${h.users.middle_name || ''} ${h.users.last_name || ''}`.trim()
            : 'Unknown',
          changed_by_role: h.users?.role
        }));
        
        setSelectedAppointment({
          ...appointment,
          statusHistory: historyWithNames
        });
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleAddNotes = () => {
    if (selectedAppointment) {
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, notes: appointmentNotes }
            : apt
        )
      );
      showNotification('success', 'Notes Updated', 'Appointment notes have been saved.');
    }
  };

  const getFilteredAppointments = () => {
    let filtered = appointments;

    // Date filtering using calendar selection
    if (selectedStart && selectedEnd) {
      // Compare using YYYY-MM-DD strings to avoid timezone pitfalls
      let startStr = toYMD(selectedStart);
      let endStr = toYMD(selectedEnd);
      if (startStr > endStr) {
        const tmp = startStr; startStr = endStr; endStr = tmp;
      }
      filtered = filtered.filter(apt => apt.date >= startStr && apt.date <= endStr);
    } else if (selectedStart) {
      const startStr = toYMD(selectedStart);
      if (fromStart) {
        filtered = filtered.filter(apt => apt.date >= startStr);
      } else {
        filtered = filtered.filter(apt => apt.date === startStr);
      }
    }

    // Status filtering
    if (filterStatus !== "all") {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Navigation helpers from Doctor List to Overall with filters (doctor filter removed)
  const goToOverallWithDoctorToday = (doctorId: string) => {
    setSelectedStart(minDate);
    setSelectedEnd(null);
    setFromStart(false);
    setActiveTab("overall");
  };

  const goToOverallWithDoctorUpcoming = (doctorId: string) => {
    // Upcoming = from today to one year ahead (inclusive)
    const oneYearAhead = new Date(minDate.getFullYear() + 1, minDate.getMonth(), minDate.getDate());
    setSelectedStart(minDate);
    setSelectedEnd(oneYearAhead);
    setFromStart(false);
    setActiveTab("overall");
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = toYMD(date);
    return appointments.filter(apt => apt.date === dateStr);
  };

  const goToOverallWithDate = (date: Date) => {
    setSelectedStart(date);
    setSelectedEnd(null);
    setFromStart(false);
    setFilterStatus("all");
    setActiveTab("overall");
  };

  const handleDayClick = (date: Date) => {
    setSelectedCalendarDay(date);
    setIsDayModalOpen(true);
  };

  const navigateCalendarMonth = (direction: "prev" | "next") => {
    setCalendarMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    setCalendarMonth(new Date(demoToday.getFullYear(), demoToday.getMonth(), 1));
  };

  const goToMonthYear = (month: number, year: number) => {
    setCalendarMonth(new Date(year, month, 1));
    setIsMonthYearPickerOpen(false);
    setPickerView("month");
  };

  const handleMonthYearButtonClick = () => {
    setPickerYear(calendarMonth.getFullYear());
    setYearPageStart(calendarMonth.getFullYear() - 6);
    setPickerView("month");
    setIsMonthYearPickerOpen(!isMonthYearPickerOpen);
  };

  const changePickerYear = (delta: number) => {
    setPickerYear(prev => prev + delta);
  };

  const changeYearPage = (delta: number) => {
    setYearPageStart(prev => prev + delta * 12);
  };

  // Reset Filters: Date -> today, Status -> all
  const handleResetFilters = () => {
    setIsResetting(true);
    setFilterStatus("all");
    setSelectedStart(minDate);
    setSelectedEnd(null);
    setFromStart(false);
    setIsDateFilterOpen(false);
    // brief visual feedback
    setTimeout(() => setIsResetting(false), 180);
  };

  return (
    <>
      {/* Notification Stack - Fixed Position */}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg border shadow-lg p-4 animate-in slide-in-from-right-5 ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {notification.type === 'info' && (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    notification.type === 'success'
                      ? 'text-green-900'
                      : notification.type === 'error'
                      ? 'text-red-900'
                      : 'text-blue-900'
                  }`}
                >
                  {notification.title}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    notification.type === 'success'
                      ? 'text-green-700'
                      : notification.type === 'error'
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className={`flex-shrink-0 rounded-md p-1 hover:bg-white/50 transition-all cursor-pointer active:scale-90 ${
                  notification.type === 'success'
                    ? 'text-green-600'
                    : notification.type === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Appointments</h2>
          <p className="text-[hsl(258_22%_50%)]">Manage your dental appointments</p>
        </div>
        <StatusFlowGuide variant="admin" />
      </div>

      {/* Quick Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(258_22%_50%)]">Total Appointments Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(258_46%_25%)]">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(258_22%_50%)]">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingApprovals}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(258_22%_50%)]">Completed This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      {(
        <div className="border-b border-gray-200">
          <nav
            role="tablist"
            aria-label="Appointments navigation"
            className="flex gap-2 md:gap-3 py-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overall"}
              aria-controls="tab-overall-panel"
              id="tab-overall"
              onClick={() => setActiveTab("overall")}
              className={`inline-flex items-center gap-2 px-4 py-2 -mb-[1px] rounded-t-md text-sm font-medium cursor-pointer select-none transition-colors transition-transform duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                activeTab === "overall"
                  ? "bg-[hsl(258_46%_25%)] text-white border-b-2 border-white/90"
                  : "text-gray-700 hover:text-purple-800 hover:bg-purple-100"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Appointments</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "weekly"}
              aria-controls="tab-weekly-panel"
              id="tab-weekly"
              onClick={() => setActiveTab("weekly")}
              className={`inline-flex items-center gap-2 px-4 py-2 -mb-[1px] rounded-t-md text-sm font-medium cursor-pointer select-none transition-colors transition-transform duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                activeTab === "weekly"
                  ? "bg-[hsl(258_46%_25%)] text-white border-b-2 border-white/90"
                  : "text-gray-700 hover:text-purple-800 hover:bg-purple-100"
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Weekly</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "calendar"}
              aria-controls="tab-calendar-panel"
              id="tab-calendar"
              onClick={() => setActiveTab("calendar")}
              className={`inline-flex items-center gap-2 px-4 py-2 -mb-[1px] rounded-t-md text-sm font-medium cursor-pointer select-none transition-colors transition-transform duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                activeTab === "calendar"
                  ? "bg-[hsl(258_46%_25%)] text-white border-b-2 border-white/90"
                  : "text-gray-700 hover:text-purple-800 hover:bg-purple-100"
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Monthly</span>
            </button>
          </nav>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "overall" && (
        <Card id="tab-overall-panel" aria-labelledby="tab-overall" className="bg-white border border-gray-200 shadow-sm md:h-[40rem]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center text-[hsl(258_46%_25%)] mb-1">
                  {/* <CalendarIcon className="mr-2 h-5 w-5" /> */}
                  <FileText className="mr-2 h-5 w-5" />
                  List of Appointments
                </CardTitle>
                <CardDescription className="text-[hsl(258_22%_50%)]">Central hub for managing clinic appointments</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={fetchAppointments}
                  disabled={isLoadingAppointments}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAppointments ? 'animate-spin' : ''}`} />
                  Reload
                </Button>
                <Button 
                  style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
                  className="hover:opacity-90 cursor-pointer active:opacity-80 transition-opacity transition-transform duration-200 ease-in-out active:scale-[0.97]"
                  onClick={() => setIsNewAppointmentOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Controls (Search + Filters) */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Row 1: Search (half-width) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative max-w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
                  <Input
                    placeholder="Search by patient or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                  />
                </div>
                {/* Empty space for balance */}
                <div aria-hidden="true" className="hidden md:block" />
              </div>
              
              {/* Row 2: Filters with nested grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Date Filter - 1/3 of row */}
                <div className="relative inline-flex items-center gap-2" ref={popRef}>
                  <span className="text-sm font-medium text-[hsl(258_22%_50%)] whitespace-nowrap">Date:</span>
                  <Button
                    variant="outline"
                    onClick={() => setIsDateFilterOpen((v) => !v)}
                    className="bg-white text-[hsl(258_46%_25%)] hover:bg-purple-50 active:bg-purple-100 active:scale-[0.98] cursor-pointer flex items-center gap-2 transition-colors transition-transform duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 w-full max-w-full"
                  >
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-[hsl(258_46%_25%)] text-sm truncate">{(() => {
                      const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      if (selectedStart && selectedEnd) return `${fmt.format(selectedStart)} – ${fmt.format(selectedEnd)}`;
                      if (selectedStart) return fmt.format(selectedStart);
                      return 'Select date';
                    })()}</span>
                  </Button>
                  {isDateFilterOpen && (
                    <div
                      className="absolute z-50 mt-2 left-0 top-full shadow-lg animate-[fadeDown_150ms_ease-out]"
                      style={{ minWidth: 280 }}
                    >
                      <CalendarRange
                        selectedStart={selectedStart}
                        selectedEnd={selectedEnd}
                        onChange={(s, e) => {
                          setSelectedStart(s);
                          setSelectedEnd(e);
                          // Do not auto-close; allow continued selection
                        }}
                        currentMonth={currentMonth}
                        onMonthChange={(d) => setCurrentMonth(d)}
                        minDate={minDate}
                        yearRange={{ start: minDate.getFullYear() - 1, end: minDate.getFullYear() + 5 }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Nested grid for Status, Reset - 2/3 of row */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status Filter - 2/3 of nested grid */}
                  <div className="sm:col-span-2 inline-flex items-center gap-2">
                    <label className="text-sm font-medium text-[hsl(258_22%_50%)] whitespace-nowrap">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-9 px-3 border border-gray-300 rounded-md text-sm text-[hsl(258_46%_25%)] bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent cursor-pointer flex-1 min-w-0"
                    >
                      <option value="all">All Status</option>
                      <option value="requested">Incoming</option>
                      <option value="proposed">Awaiting</option>
                      <option value="booked">Confirmed</option>
                      <option value="arrived">Arrived</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  {/* Reset Filters - 1/5 of nested grid */}
                  <div className="sm:col-span-1 flex items-center justify-start sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      disabled={!hasNonDefaultFilters}
                      aria-hidden={!hasNonDefaultFilters}
                      tabIndex={hasNonDefaultFilters ? 0 : -1}
                      className={`border-purple-300 text-purple-700 transition-colors transition-transform transition-opacity duration-200 ease-out active:scale-[0.97] whitespace-nowrap
                        ${hasNonDefaultFilters ? "opacity-100 scale-100 hover:text-purple-800 hover:bg-purple-50 active:bg-purple-100 active:text-purple-900 cursor-pointer" : "opacity-0 scale-95 pointer-events-none select-none"}`}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search removed: now integrated into filters */}

            {/* Appointments Table with bottom fade indicator */}
            <div className="overflow-x-auto">
              <div className={`relative ${isResetting ? 'opacity-60 transition-opacity duration-150' : 'transition-opacity duration-150'}`}>
                <div ref={listScrollRef} className="h-[24rem] overflow-y-auto">
                {(() => {
                  // Show loading state
                  if (isLoadingAppointments) {
                    return (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-[hsl(258_22%_50%)]">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(258_46%_25%)] mx-auto mb-3"></div>
                          <p className="text-sm">Loading appointments...</p>
                        </div>
                      </div>
                    );
                  }

                  // Show error state
                  if (error) {
                    return (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-red-600">
                          <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
                          <p className="text-sm">{error}</p>
                          <Button 
                            onClick={fetchAppointments} 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  const rows = getFilteredAppointments();
                  if (rows.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-[hsl(258_22%_50%)]">
                          <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-60" />
                          <p className="text-sm">No appointments found</p>
                          {appointments.length > 0 && (
                            <p className="text-xs mt-2">Try adjusting your filters</p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return (
                       <table className="w-full">
                         <thead className={`sticky top-0 z-10 bg-white ${showListTopShadow ? 'shadow-sm' : ''}`}>
                        <tr className="border-b border-gray-200">
                          <th className="text-center py-3 px-4 font-medium text-[hsl(258_22%_50%)] w-[150px]">Submitted On</th>
                          <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)] w-[35%]">Patient Name</th>
                          <th className="text-center py-3 px-4 font-medium text-[hsl(258_22%_50%)] w-[160px]">Date & Time</th>
                          <th className="text-center py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Status</th>
                          <th className="text-center py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((appointment) => (
                          <tr 
                            key={appointment.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            <td className="py-3 px-4 text-center align-middle">
                              <div className="whitespace-nowrap tabular-nums min-w-[140px] leading-tight mx-auto">
                                <div className="text-sm font-medium text-[hsl(258_46%_25%)]">{formatDateShortFromISO(appointment.requestedAt)}</div>
                                <div className="text-sm text-[hsl(258_22%_50%)]">{formatTime12hFromISO(appointment.requestedAt)}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                                    {getInitials(appointment.patientName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                  <div className="font-medium text-[hsl(258_46%_25%)]">{appointment.patientName}</div>
                                  <div className="text-sm text-[hsl(258_22%_50%)] flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {appointment.patientPhone}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle text-center">
                              <div className="whitespace-nowrap tabular-nums min-w-[140px] leading-tight mx-auto">
                                <div className="text-sm font-medium text-[hsl(258_46%_25%)]">{formatDateShort(appointment.date)}</div>
                                <div className="text-sm text-[hsl(258_22%_50%)]">{formatTime12h(appointment.time)}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex justify-center mx-auto">
                                <Badge className={`status-badge ${getStatusColor(appointment.status)}`}>
                                  {getStatusDisplayLabel(appointment.status)}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2 justify-center mx-auto" onClick={(e) => e.stopPropagation()}>
                                {/* Incoming (Requested) → Accept, Reject */}
                                {appointment.status === "requested" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openConfirm(appointment, "accept")}
                                      className="action-btn-w action-btn-compact text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 active:text-green-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReason(appointment, "reject")}
                                      className="action-btn-w action-btn-compact text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:text-red-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                
                                {/* Awaiting (Proposed) → Cancel only */}
                                {appointment.status === "proposed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openReason(appointment, "cancel")}
                                    className="action-btn-w action-btn-compact text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                                
                                {/* Confirmed (Booked) → Arrived, Cancel */}
                                {appointment.status === "booked" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openConfirm(appointment, "arrive")}
                                      className="action-btn-w action-btn-compact text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100 active:text-purple-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <User className="h-4 w-4 mr-1" />
                                      Arrived
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReason(appointment, "cancel")}
                                      className="action-btn-w action-btn-compact text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                
                                {/* Arrived → Ongoing, Cancel */}
                                {appointment.status === "arrived" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openConfirm(appointment, "ongoing")}
                                      className="action-btn-w action-btn-compact text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 active:text-blue-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <Flag className="h-4 w-4 mr-1" />
                                      Ongoing
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReason(appointment, "cancel")}
                                      className="action-btn-w action-btn-compact text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                                
                                {/* Ongoing → Complete */}
                                {appointment.status === "ongoing" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openConfirm(appointment, "complete")}
                                    className="action-btn-w action-btn-compact text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 active:text-green-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
                </div>
                {showListBottomFade && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white transition-opacity duration-200"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "weekly" && (
        <Card id="tab-weekly-panel" aria-labelledby="tab-weekly" className="bg-white border border-gray-200 shadow-sm md:h-[48rem]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-[hsl(258_46%_25%)] mb-1">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription className="text-[hsl(258_22%_50%)]">Weekly view with appointment details</CardDescription>
              </div>
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="h-8 w-8 p-0 border-gray-300 hover:bg-purple-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-[hsl(258_46%_25%)] min-w-[180px] text-center">
                  {formatDateRange(currentWeekStart)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="h-8 w-8 p-0 border-gray-300 hover:bg-purple-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Weekly Calendar Grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers Row - with Time column */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[hsl(258_46%_25%)]">
                {/* Empty corner cell for time column */}
                <div className="border-r border-[hsl(258_46%_30%)]"></div>
                
                {getWeekDays(currentWeekStart).map((date, index) => {
                  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNumber = date.getDate();
                  const today = new Date();
                  const isTodayDate = date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`text-center py-2 border-r border-[hsl(258_46%_30%)] last:border-r-0 ${
                        isTodayDate ? 'bg-[hsl(258_46%_20%)]' : ''
                      }`}
                    >
                      <div className="text-white text-[10px] font-medium uppercase tracking-wide">
                        {dayLabel}
                      </div>
                      {isTodayDate ? (
                        <div className="bg-white text-[hsl(258_46%_25%)] rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-0.5 text-base font-bold">
                          {dateNumber}
                        </div>
                      ) : (
                        <div className="text-white text-base font-bold mt-0.5 h-7 flex items-center justify-center">
                          {dateNumber}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Schedule Grid with Time Column */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-white min-h-[400px]">
                {/* Time Column */}
                <div className="border-r border-gray-300 bg-gray-50">
                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-200 last:border-b-0 flex items-center justify-center"
                    >
                      <span className="text-xs font-semibold text-gray-600">
                        {hour <= 12 ? hour : hour - 12}:00 {hour < 12 ? 'AM' : 'PM'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {getWeekDays(currentWeekStart).map((date, dayIndex) => {
                  const dateStr = formatLocalDate(date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;
                  
                  // Filter appointments for this day - ONLY show confirmed appointments that occupy time slots
                  const dayAppointments = appointments.filter((apt) => 
                    apt.date === dateStr && 
                    ['booked', 'arrived', 'ongoing', 'completed'].includes(apt.status)
                  );
                  
                  // Get doctor availability for this date
                  const availability = getAvailabilityForDate(date);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`border-r border-gray-200 last:border-r-0 relative ${
                        isPast ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      {/* Working Hours Background Indicator */}
                      {!isPast && availability && (() => {
                        const [startHour, startMin] = availability.startTime.split(':').map(Number);
                        const [endHour, endMin] = availability.endTime.split(':').map(Number);
                        
                        const topOffset = ((startHour - 6) * 64) + ((startMin / 60) * 64);
                        const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                        const height = durationHours * 64;
                        
                        // Format time for labels (12-hour format)
                        const formatTime = (hour: number, min: number) => {
                          const period = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
                        };
                        
                        return (
                          <div
                            className="absolute inset-x-0 bg-green-50/40 border-l-4 border-green-400 pointer-events-none"
                            style={{
                              top: `${topOffset}px`,
                              height: `${height}px`,
                            }}
                          >
                            {/* Top indicator line */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500" />
                            {/* Bottom indicator line */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                            
                            {/* Start time label - ABOVE the top line */}
                            <div className="absolute -top-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(startHour, startMin)}
                            </div>
                            {/* End time label - BELOW the bottom line */}
                            <div className="absolute -bottom-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(endHour, endMin)}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Hour grid lines */}
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                        <div
                          key={hour}
                          className="h-16 border-b border-gray-200 last:border-b-0"
                        />
                      ))}

                      {/* Render appointments */}
                      {dayAppointments.map((appointment) => {
                        // Parse time (HH:mm format)
                        const [hours, minutes] = appointment.time.split(':').map(Number);
                        
                        // Calculate position (6 AM = 0, each hour = 64px)
                        const topOffset = ((hours - 6) * 64) + ((minutes / 60) * 64);
                        
                        // Parse duration (e.g., "60 min")
                        const durationMatch = appointment.duration.match(/(\d+)/);
                        const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
                        const height = (durationMinutes / 60) * 64;
                        
                        // Calculate end time
                        const endMinutes = minutes + durationMinutes;
                        const endHours = hours + Math.floor(endMinutes / 60);
                        const endMins = endMinutes % 60;
                        
                        // Format time to 12-hour format
                        const formatTime12Hour = (h: number, m: number) => {
                          const period = h >= 12 ? 'PM' : 'AM';
                          const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                          return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
                        };
                        
                        const timeRange = `${formatTime12Hour(hours, minutes)} - ${formatTime12Hour(endHours, endMins)}`;
                        
                        // Get status color
                        const statusColors = {
                          requested: 'bg-blue-100 border-blue-300 text-blue-800',
                          proposed: 'bg-amber-100 border-amber-300 text-amber-800',
                          booked: 'bg-green-100 border-green-300 text-green-800',
                          arrived: 'bg-purple-100 border-purple-300 text-purple-800',
                          ongoing: 'bg-indigo-100 border-indigo-300 text-indigo-800',
                          completed: 'bg-gray-100 border-gray-300 text-gray-800',
                          cancelled: 'bg-red-100 border-red-300 text-red-800',
                          rejected: 'bg-orange-100 border-orange-300 text-orange-800',
                        };
                        
                        const colorClass = statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-100 border-gray-300 text-gray-800';
                        
                        return (
                          <div
                            key={appointment.id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={`absolute ${colorClass} border-2 rounded-lg p-1.5 cursor-pointer hover:shadow-lg transition-shadow z-10 overflow-hidden`}
                            style={{
                              top: `${topOffset + 4}px`,
                              left: '8px',
                              right: '8px',
                              height: `${Math.max(height - 8, 36)}px`,
                            }}
                          >
                            <div className="text-[9px] font-bold truncate leading-tight">
                              {appointment.patientName}
                            </div>
                            <div className="text-[8px] truncate leading-tight mt-0.5">
                              {timeRange}
                            </div>
                            <div className="text-[8px] font-semibold truncate leading-tight mt-0.5 capitalize">
                              {appointment.status}
                            </div>
                          </div>
                        );
                      })}

                      {/* Past date overlay */}
                      {isPast && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 pointer-events-none">
                          <p className="text-xs text-gray-400 text-center px-2">Past date</p>
                        </div>
                      )}
                      
                      {/* No availability label */}
                      {!isPast && !availability && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-xs text-gray-400 text-center px-2 font-medium">No availability</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending/Non-blocking Appointments Section */}
            {(() => {
              // Get all pending appointments for the current week (requested, proposed, rejected, cancelled)
              const weekDays = getWeekDays(currentWeekStart);
              const pendingAppointments = appointments.filter((apt) => {
                const aptDate = weekDays.find(date => formatLocalDate(date) === apt.date);
                return aptDate && ['requested', 'proposed', 'rejected', 'cancelled'].includes(apt.status);
              });

              if (pendingAppointments.length === 0) return null;

              // Sort appointments: requested, proposed | cancelled, rejected (each group sorted by updated_at desc)
              const sortedAppointments = pendingAppointments.sort((a, b) => {
                // Define status priority order
                const statusOrder = {
                  'requested': 1,
                  'proposed': 2,
                  'cancelled': 3,
                  'rejected': 4
                };
                
                const orderA = statusOrder[a.status as keyof typeof statusOrder] || 5;
                const orderB = statusOrder[b.status as keyof typeof statusOrder] || 5;
                
                // First sort by status priority
                if (orderA !== orderB) {
                  return orderA - orderB;
                }
                
                // Within same status, sort by updated_at (newest first)
                const dateA = new Date(a.requestedAt || 0).getTime();
                const dateB = new Date(b.requestedAt || 0).getTime();
                return dateB - dateA;
              });

              // Separate into two groups for visual separation
              const activeGroup = sortedAppointments.filter(apt => 
                ['proposed', 'requested'].includes(apt.status)
              );
              const inactiveGroup = sortedAppointments.filter(apt => 
                ['cancelled', 'rejected'].includes(apt.status)
              );

              return (
                <div className="mt-6 border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-sm font-bold text-gray-700">Pending Requests & Other Statuses</h3>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                      {pendingAppointments.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">These appointments do not occupy time slots on the calendar</p>
                  
                  {/* Active Group: Proposed, Requested */}
                  {activeGroup.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                      {activeGroup.map((appointment) => {
                        const statusColors = {
                          requested: 'bg-blue-50 border-blue-200 text-blue-900',
                          proposed: 'bg-amber-50 border-amber-200 text-amber-900',
                        };
                        
                        const statusBadgeColors = {
                          requested: 'bg-blue-100 text-blue-800',
                          proposed: 'bg-amber-100 text-amber-800',
                        };
                        
                        const colorClass = statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-50 border-gray-200 text-gray-900';
                        const badgeClass = statusBadgeColors[appointment.status as keyof typeof statusBadgeColors] || 'bg-gray-100 text-gray-800';
                        
                        return (
                          <div
                            key={appointment.id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={`${colorClass} border-2 rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-all duration-200`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{appointment.patientName}</p>
                                <p className="text-[10px] text-gray-600 truncate mt-0.5">{appointment.patientPhone}</p>
                              </div>
                              <span className={`${badgeClass} text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide flex-shrink-0`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-700 mt-1.5">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">
                                {(() => {
                                  const aptDate = new Date(appointment.date + 'T' + appointment.time);
                                  return aptDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }) + ' at ' + aptDate.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit', 
                                    hour12: true 
                                  });
                                })()}
                              </span>
                            </div>
                            {appointment.concern && (
                              <p className="text-[10px] text-gray-600 mt-1.5 line-clamp-1 italic">"{appointment.concern}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Separator Bar */}
                  {activeGroup.length > 0 && inactiveGroup.length > 0 && (
                    <div className="my-4 border-t-2 border-gray-300"></div>
                  )}

                  {/* Inactive Group: Cancelled, Rejected */}
                  {inactiveGroup.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {inactiveGroup.map((appointment) => {
                        const statusColors = {
                          rejected: 'bg-orange-50 border-orange-200 text-orange-900',
                          cancelled: 'bg-red-50 border-red-200 text-red-900',
                        };
                        
                        const statusBadgeColors = {
                          rejected: 'bg-orange-100 text-orange-800',
                          cancelled: 'bg-red-100 text-red-800',
                        };
                        
                        const colorClass = statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-50 border-gray-200 text-gray-900';
                        const badgeClass = statusBadgeColors[appointment.status as keyof typeof statusBadgeColors] || 'bg-gray-100 text-gray-800';
                        
                        return (
                          <div
                            key={appointment.id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={`${colorClass} border-2 rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-all duration-200`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{appointment.patientName}</p>
                                <p className="text-[10px] text-gray-600 truncate mt-0.5">{appointment.patientPhone}</p>
                              </div>
                              <span className={`${badgeClass} text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide flex-shrink-0`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-700 mt-1.5">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">
                                {(() => {
                                  const aptDate = new Date(appointment.date + 'T' + appointment.time);
                                  return aptDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }) + ' at ' + aptDate.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit', 
                                    hour12: true 
                                  });
                                })()}
                              </span>
                            </div>
                            {appointment.concern && (
                              <p className="text-[10px] text-gray-600 mt-1.5 line-clamp-1 italic">"{appointment.concern}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {activeTab === "calendar" && (
        <Card id="tab-calendar-panel" aria-labelledby="tab-calendar" className="bg-white border border-gray-200 shadow-sm md:h-[48rem]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-[hsl(258_46%_25%)] mb-1">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Calendar View
                </CardTitle>
                <CardDescription className="text-[hsl(258_22%_50%)]">Monthly overview of all appointments</CardDescription>
              </div>
              {/* Month Navigation */}
              <div className="flex items-center gap-2 relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="cursor-pointer hover:bg-purple-50 active:bg-purple-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97] text-[hsl(258_46%_25%)] border-purple-200"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCalendarMonth("prev")}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <button
                    onClick={handleMonthYearButtonClick}
                    className="text-sm font-semibold text-[hsl(258_46%_25%)] min-w-[140px] text-center px-3 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer"
                  >
                    {formatMonthYear(calendarMonth)}
                  </button>
                  
                  {/* Month/Year Picker Dropdown */}
                  {isMonthYearPickerOpen && (
                    <div ref={monthYearPickerRef} className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-[280px] p-3">
                      {/* Header with navigation and view toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {pickerView === "year" && (
                            <button
                              className="p-1 rounded hover:bg-gray-100"
                              onClick={() => setPickerView("month")}
                              aria-label="Back"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="px-2 py-1 rounded hover:bg-gray-100 text-sm font-medium text-[hsl(258_46%_25%)]"
                            onClick={() => setPickerView(pickerView === "month" ? "year" : "month")}
                            aria-label="Change view"
                          >
                            {pickerView === "month" && <span>{pickerYear}</span>}
                            {pickerView === "year" && <span>{yearPageStart} – {yearPageStart + 11}</span>}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1 rounded hover:bg-gray-100"
                            onClick={() => {
                              if (pickerView === "month") changePickerYear(-1);
                              else changeYearPage(-1);
                            }}
                            aria-label="Previous"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-gray-100"
                            onClick={() => {
                              if (pickerView === "month") changePickerYear(1);
                              else changeYearPage(1);
                            }}
                            aria-label="Next"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Month/Year Grid */}
                      <div className="transition-all duration-150 ease-out">
                        {pickerView === "month" ? (
                          // Month Grid (3x4)
                          <div className="grid grid-cols-3 gap-2">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monthName, idx) => {
                              const isSelected = idx === calendarMonth.getMonth() && pickerYear === calendarMonth.getFullYear();
                              return (
                                <button
                                  key={monthName}
                                  onClick={() => goToMonthYear(idx, pickerYear)}
                                  className={`px-2 py-2 rounded border text-sm transition-colors ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                                      : 'text-[hsl(258_46%_25%)] border-gray-200 hover:bg-purple-50'
                                  }`}
                                >
                                  {monthName}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          // Year Grid (3x4)
                          <div className="max-h-[180px] overflow-y-auto pr-1">
                            <div className="grid grid-cols-3 gap-2">
                              {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((year) => {
                                const isSelected = year === pickerYear;
                                return (
                                  <button
                                    key={year}
                                    onClick={() => {
                                      setPickerYear(year);
                                      setPickerView("month");
                                    }}
                                    className={`px-2 py-2 rounded border text-sm transition-colors ${
                                      isSelected
                                        ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                                        : 'text-[hsl(258_46%_25%)] border-gray-200 hover:bg-purple-50'
                                    }`}
                                  >
                                    {year}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div className="text-xs text-[hsl(258_22%_50%)]">
                          {formatMonthYear(calendarMonth)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = demoToday;
                            goToMonthYear(today.getMonth(), today.getFullYear());
                            setPickerYear(today.getFullYear());
                            setYearPageStart(today.getFullYear() - 6);
                          }}
                          className="text-[hsl(258_46%_25%)] hover:bg-purple-50 px-2 py-1 text-xs"
                        >
                          Today
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCalendarMonth("next")}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden px-1">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-[hsl(258_22%_50%)] py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pb-4">
                {(() => {
                  const daysInMonth = getDaysInMonth(calendarMonth);
                  const firstDay = getFirstDayOfMonth(calendarMonth);
                  const days: React.ReactElement[] = [];
                  
                  // Empty cells before first day
                  for (let i = 0; i < firstDay; i++) {
                    days.push(
                      <div key={`empty-${i}`} className="h-16 sm:h-20 md:h-24 bg-gray-50 rounded-md" />
                    );
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                    const dayAppointments = getAppointmentsForDay(date);
                    const appointmentCount = dayAppointments.length;
                    const isToday = isSameDay(date, demoToday);
                    
                    days.push(
                      <div
                        key={day}
                        onClick={() => handleDayClick(date)}
                        className={`h-16 sm:h-20 md:h-24 border rounded-md p-1 sm:p-1.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 relative group ${
                          appointmentCount > 0 
                            ? 'bg-white border-purple-200 hover:border-purple-400' 
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        } ${isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
                      >
                        {/* Day number */}
                        <div className={`text-xs sm:text-sm font-bold ${
                          appointmentCount > 0 
                            ? 'text-[hsl(258_46%_20%)]' 
                            : 'text-gray-500'
                        } ${isToday ? 'text-purple-600' : ''}`}>
                          {day}
                        </div>
                        
                        {/* Appointment preview bars */}
                        {appointmentCount > 0 && (
                          <div className="mt-0.5 sm:mt-1 space-y-0.5">
                            {dayAppointments.slice(0, 3).map((apt, idx) => (
                              <div
                                key={apt.id}
                                className={`h-1.5 sm:h-2 rounded-full ${
                                  apt.status === 'completed' ? 'bg-emerald-500' :
                                  apt.status === 'requested' ? 'bg-yellow-500' :
                                  apt.status === 'proposed' ? 'bg-amber-500' :
                                  apt.status === 'booked' ? 'bg-green-500' :
                                  apt.status === 'arrived' ? 'bg-purple-500' :
                                  apt.status === 'ongoing' ? 'bg-blue-500' :
                                  apt.status === 'cancelled' ? 'bg-gray-400' :
                                  apt.status === 'rejected' ? 'bg-red-500' :
                                  'bg-purple-500'
                                }`}
                              />
                            ))}
                            {appointmentCount > 3 && (
                              <div className="text-[8px] sm:text-[9px] text-[hsl(258_46%_35%)] font-medium text-center mt-0.5">
                                +{appointmentCount - 3}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Hover tooltip */}
                        {appointmentCount > 0 && (
                          <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-[hsl(258_46%_25%)] text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                              {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor-specific views removed to avoid duplication. All appointment listings reside in Overall tab. */}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-white shadow-lg">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between pr-8">
                <DialogTitle className="flex items-center text-[hsl(258_46%_25%)]">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Appointment Details
                </DialogTitle>
                <Badge className={`status-badge ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusDisplayLabel(selectedAppointment.status)}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Patient Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                        {getInitials(selectedAppointment.patientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-[hsl(258_46%_25%)]">{selectedAppointment.patientName}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                      <span className="text-[hsl(258_46%_25%)]">{selectedAppointment.patientEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                      <span className="text-[hsl(258_46%_25%)]">{selectedAppointment.patientPhone}</span>
                    </div>
                  </div>
                  
                  {/* Emergency Contact Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)] font-medium">{selectedAppointment.emergencyContactName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)] font-medium">{selectedAppointment.emergencyContactNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Details */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Appointment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Patient Concern/Reason */}
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Patient's Concern
                    </label>
                    <p className="text-amber-900 mt-1 text-sm">{selectedAppointment.concern || 'No concern specified'}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Submitted On</label>
                      <p className="text-[hsl(258_46%_25%)]">
                        {(() => {
                          const dt = new Date(selectedAppointment.requestedAt || '');
                          const date = dt.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                          const time = dt.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          });
                          return `${date}, ${time}`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Requested Date</label>
                        <p className="text-[hsl(258_46%_25%)]">
                          {new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Requested Time</label>
                        <p className="text-[hsl(258_46%_25%)]">{formatTime12h(selectedAppointment.time)}</p>
                      </div>
                    </div>

                    {selectedAppointment.status !== "requested" && (
                      <div>
                        <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Duration</label>
                        <p className="text-[hsl(258_46%_25%)]">{selectedAppointment.duration}</p>
                      </div>
                    )}
                  </div>
                  {selectedAppointment.actionReason && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Reason</label>
                      <p className="text-[hsl(258_46%_25%)] mt-1">{selectedAppointment.actionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointment Status History */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedAppointment.statusHistory && selectedAppointment.statusHistory.length > 0 ? (
                      selectedAppointment.statusHistory.map((history: any, index: number) => (
                        <div key={index} className="border-l-4 border-[hsl(258_46%_25%)] pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              history.status === 'completed' ? 'bg-green-100 text-green-800' :
                              history.status === 'rejected' || history.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              history.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                              history.status === 'arrived' ? 'bg-purple-100 text-purple-800' :
                              history.status === 'booked' ? 'bg-emerald-100 text-emerald-800' :
                              history.status === 'proposed' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                            </span>
                            <span className="text-xs text-[hsl(258_22%_50%)]">
                              {new Date(history.changed_at).toLocaleString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-[hsl(258_46%_25%)] mt-1 italic">
                              "{history.notes}"
                            </p>
                          )}
                          {history.feedback && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Dentist/Staff Note:</p>
                              <p className="text-sm text-blue-800">{history.feedback}</p>
                            </div>
                          )}
                          {history.changed_by_name && (
                            <p className="text-xs text-[hsl(258_22%_50%)] mt-1">
                              By: {history.changed_by_name}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[hsl(258_22%_50%)] italic">No status history available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons Footer */}
            <DialogFooter className="border-t pt-4">
              <div className="flex flex-wrap gap-2 w-full justify-between">
                {/* Quick Week View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickWeekViewOpen(true)}
                  className="text-[hsl(258_46%_25%)] hover:bg-purple-50 active:bg-purple-100 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Quick Week View
                </Button>

                <div className="flex flex-wrap gap-2 justify-end">
                  {/* Incoming (Requested) → Accept, Reschedule, Reject (modal only) */}
                  {selectedAppointment.status === "requested" && (
                  <>
                    <Button
                      onClick={() => openConfirm(selectedAppointment, "accept")}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProposeTime(selectedAppointment)}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 active:bg-indigo-100 active:text-indigo-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReason(selectedAppointment, "reject")}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:text-red-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                  )}

                  {/* Awaiting (Proposed) → Cancel only */}
                  {selectedAppointment.status === "proposed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReason(selectedAppointment, "cancel")}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}

                  {/* Confirmed (Booked) → Arrived, Cancel */}
                  {selectedAppointment.status === "booked" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirm(selectedAppointment, "arrive")}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100 active:text-purple-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Mark as Arrived
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReason(selectedAppointment, "cancel")}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {/* Arrived → Ongoing, Cancel */}
                  {selectedAppointment.status === "arrived" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirm(selectedAppointment, "ongoing")}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 active:text-blue-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Mark as Ongoing
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReason(selectedAppointment, "cancel")}
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}

                  {/* Ongoing → Complete */}
                  {selectedAppointment.status === "ongoing" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirm(selectedAppointment, "complete")}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 active:text-green-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Action Dialog - Simple confirmation for arrived/ongoing/complete */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)]">
              {pendingAction.type === "accept" && "Accept this appointment?"}
              {pendingAction.type === "arrive" && "Mark appointment as Arrived?"}
              {pendingAction.type === "ongoing" && "Mark appointment as Ongoing?"}
              {pendingAction.type === "complete" && "Mark appointment as Completed?"}
              {pendingAction.type === "cancel" && "Confirm cancellation?"}
              {pendingAction.type === "reject" && "Confirm rejection?"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-[hsl(258_22%_50%)]">
              {pendingAction.type === "arrive" && "Confirm that the patient has arrived at the clinic."}
              {pendingAction.type === "ongoing" && "Confirm that the treatment has started."}
              {pendingAction.type === "complete" && "Confirm that the appointment has been completed successfully."}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]">Cancel</Button>
            <Button onClick={applyConfirmedAction} style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }} className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity transition-transform duration-200 ease-in-out active:scale-[0.97]">Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject/Cancel Dialog */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)]">
              {pendingAction.type === "reject" && "Reject appointment"}
              {pendingAction.type === "cancel" && "Cancel appointment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[hsl(258_46%_25%)] mb-2 block">
                Note to Patient
              </label>
              <textarea
                value={actionReasonText}
                onChange={(e) => setActionReasonText(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                rows={3}
                placeholder={pendingAction.type === "reject" ? "Reason for rejection..." : "Reason for cancellation..."}
              />
              <p className="text-xs text-[hsl(258_22%_50%)] mt-1">
                This note will be visible to the patient in their appointment history.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReasonDialogOpen(false)} className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]">Cancel</Button>
              <Button onClick={applyReasonAction} disabled={!actionReasonText.trim()} style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }} className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity transition-transform duration-200 ease-in-out active:scale-[0.97] disabled:opacity-60">
                {pendingAction.type === "reject" ? "Reject" : "Cancel Appointment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <RescheduleModal
        open={isProposeTimeOpen}
        onOpenChange={setIsProposeTimeOpen}
        appointment={proposeAppointment ? {
          id: proposeAppointment.id,
          patientName: proposeAppointment.patientName,
          date: proposeAppointment.date,
          time: proposeAppointment.time,
          doctorId: proposeAppointment.doctorId,
          doctorName: proposeAppointment.doctorName,
        } : null}
        onSubmit={handleSubmitProposedTime}
        isSubmitting={isProposing}
      />

      {/* Accept Appointment Modal - New Design */}
      <AcceptAppointmentModal
        open={isAcceptModalOpen}
        onOpenChange={setIsAcceptModalOpen}
        appointment={acceptAppointment ? {
          id: acceptAppointment.id,
          patientName: acceptAppointment.patientName,
          date: acceptAppointment.date,
          time: acceptAppointment.time,
          doctorId: acceptAppointment.doctorId
        } : null}
        onConfirm={(endTime) => {
          setAcceptEndTime(endTime);
          setIsAcceptModalOpen(false);
          setIsAcceptConfirmOpen(true);
        }}
      />

      {/* Accept Appointment Confirmation Dialog */}
      <Dialog open={isAcceptConfirmOpen} onOpenChange={setIsAcceptConfirmOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)]">
              Confirm Appointment Acceptance
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Appointment Schedule Summary */}
            {acceptAppointment && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">Appointment Schedule</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Patient:</span>
                    <span className="text-sm font-bold text-[hsl(258_46%_25%)]">{acceptAppointment.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Date:</span>
                    <span className="text-sm font-bold text-[hsl(258_46%_25%)]">{formatDateShort(acceptAppointment.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Start Time:</span>
                    <span className="text-sm font-bold text-[hsl(258_46%_25%)]">{formatTime12h(acceptAppointment.time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">End Time:</span>
                    <span className="text-sm font-bold text-[hsl(258_46%_25%)]">{acceptEndTime ? formatTime12h(acceptEndTime) : 'Not selected'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Note to Patient Field */}
            <div>
              <label className="text-sm font-medium text-[hsl(258_46%_25%)] mb-2 block">
                Note to Patient (Optional)
              </label>
              <textarea
                value={acceptFeedback}
                onChange={(e) => setAcceptFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                rows={3}
                placeholder="Add any notes that the patient should see..."
              />
              <p className="text-xs text-[hsl(258_22%_50%)] mt-1">
                This note will be visible to the patient in their appointment history.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAcceptConfirmOpen(false);
                setIsAcceptModalOpen(true);
              }} 
              className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
            >
              Back
            </Button>
            <Button 
              onClick={handleAcceptAppointmentConfirm} 
              disabled={isAccepting}
              style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }} 
              className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity transition-transform duration-200 ease-in-out active:scale-[0.97] disabled:opacity-60"
            >
              {isAccepting ? "Accepting..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Appointment Modal */}
      <AdminNewAppointmentModal
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
        onSuccess={fetchAppointments}
        doctorId={currentUserDoctorId}
        doctorName={currentUserDoctorName}
      />

      {/* Day Appointments Modal */}
      {selectedCalendarDay && (
        <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden bg-white shadow-lg flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[hsl(258_46%_25%)] text-base sm:text-lg">
                <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="line-clamp-2">
                  {new Intl.DateTimeFormat(undefined, { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }).format(selectedCalendarDay)}
                </span>
              </DialogTitle>
              <p className="text-xs sm:text-sm text-[hsl(258_22%_50%)] mt-1">
                {(() => {
                  const count = getAppointmentsForDay(selectedCalendarDay).length;
                  return count === 0 ? 'No appointments' : `${count} appointment${count !== 1 ? 's' : ''} scheduled`;
                })()}
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-2 sm:py-4 space-y-2 sm:space-y-3">
              {(() => {
                const dayAppointments = getAppointmentsForDay(selectedCalendarDay);
                
                if (dayAppointments.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-[hsl(258_22%_50%)]">
                      <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 mb-3 opacity-50" />
                      <p className="text-xs sm:text-sm">No appointments scheduled for this day</p>
                    </div>
                  );
                }

                // Custom sorting: requested, proposed first, then cancelled, rejected
                const sortedAppointments = [...dayAppointments].sort((a, b) => {
                  // Define status priority order
                  const statusOrder: Record<string, number> = {
                    'requested': 1,
                    'proposed': 2,
                    'booked': 3,
                    'arrived': 4,
                    'ongoing': 5,
                    'completed': 6,
                    'cancelled': 7,
                    'rejected': 8
                  };
                  
                  const orderA = statusOrder[a.status] || 99;
                  const orderB = statusOrder[b.status] || 99;
                  
                  // Primary sort by status priority
                  if (orderA !== orderB) {
                    return orderA - orderB;
                  }
                  
                  // Secondary sort by time (for same status)
                  return a.time.localeCompare(b.time);
                });

                // Split into groups: active (proposed, requested) and inactive (cancelled, rejected)
                const activeGroup = sortedAppointments.filter(apt => 
                  ['proposed', 'requested'].includes(apt.status)
                );
                const confirmedGroup = sortedAppointments.filter(apt => 
                  ['booked', 'arrived', 'ongoing', 'completed'].includes(apt.status)
                );
                const inactiveGroup = sortedAppointments.filter(apt => 
                  ['cancelled', 'rejected'].includes(apt.status)
                );

                return (
                  <>
                    {/* Active Group - Proposed & Requested */}
                    {activeGroup.length > 0 && (
                      <>
                        {activeGroup.map((appointment) => (
                          <Card
                            key={appointment.id}
                            className="border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              // Don't close day modal - allow nested modal behavior
                              handleAppointmentClick(appointment);
                            }}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                {/* Left: Patient info */}
                                <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1 flex-shrink-0">
                                    <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                                      {getInitials(appointment.patientName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-[hsl(258_46%_25%)] truncate">
                                      {appointment.patientName}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-[hsl(258_22%_50%)] truncate">
                                      {appointment.service}
                                    </p>
                                    <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                      <div className="flex items-center text-[10px] sm:text-xs text-[hsl(258_22%_50%)]">
                                        <Stethoscope className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                                        <span className="truncate">{appointment.doctorName}</span>
                                      </div>
                                      <span className="text-gray-300 hidden sm:inline">•</span>
                                      <div className="flex items-center text-[10px] sm:text-xs text-[hsl(258_22%_50%)]">
                                        <Clock className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                                        {appointment.duration}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Time and status */}
                                <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                                  <div className="text-base sm:text-lg font-bold text-[hsl(258_46%_25%)]">
                                    {formatTime12h(appointment.time)}
                                  </div>
                                  <Badge className={`status-badge text-[10px] sm:text-xs ${getStatusColor(appointment.status)}`}>
                                    {getStatusDisplayLabel(appointment.status)}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}

                    {/* Confirmed Group - Booked, Arrived, Ongoing, Completed */}
                    {confirmedGroup.length > 0 && (
                      <>
                        {confirmedGroup.map((appointment) => (
                          <Card
                            key={appointment.id}
                            className="border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              handleAppointmentClick(appointment);
                            }}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                {/* Left: Patient info */}
                                <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1 flex-shrink-0">
                                    <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                                      {getInitials(appointment.patientName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-[hsl(258_46%_25%)] truncate">
                                      {appointment.patientName}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-[hsl(258_22%_50%)] truncate">
                                      {appointment.service}
                                    </p>
                                    <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                      <div className="flex items-center text-[10px] sm:text-xs text-[hsl(258_22%_50%)]">
                                        <Stethoscope className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                                        <span className="truncate">{appointment.doctorName}</span>
                                      </div>
                                      <span className="text-gray-300 hidden sm:inline">•</span>
                                      <div className="flex items-center text-[10px] sm:text-xs text-[hsl(258_22%_50%)]">
                                        <Clock className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                                        {appointment.duration}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Time and status */}
                                <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                                  <div className="text-base sm:text-lg font-bold text-[hsl(258_46%_25%)]">
                                    {formatTime12h(appointment.time)}
                                  </div>
                                  <Badge className={`status-badge text-[10px] sm:text-xs ${getStatusColor(appointment.status)}`}>
                                    {getStatusDisplayLabel(appointment.status)}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}

                    {/* Separator between active/confirmed and inactive */}
                    {(activeGroup.length > 0 || confirmedGroup.length > 0) && inactiveGroup.length > 0 && (
                      <div className="my-4 border-t-2 border-gray-300"></div>
                    )}

                    {/* Inactive Group - Cancelled & Rejected */}
                    {inactiveGroup.length > 0 && (
                      <>
                        {inactiveGroup.map((appointment) => (
                          <Card
                            key={appointment.id}
                            className="border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              handleAppointmentClick(appointment);
                            }}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-4">
                                {/* Left: Patient info */}
                                <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1 flex-shrink-0">
                                    <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                                      {getInitials(appointment.patientName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-[hsl(258_46%_25%)] truncate">
                                      {appointment.patientName}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-[hsl(258_22%_50%)] truncate">
                                      {appointment.service}
                                    </p>
                                    <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                      <div className="flex items-center text-[10px] sm:text-xs text-[hsl(258_22%_50%)]">
                                        <Stethoscope className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                                        <span className="truncate">{appointment.doctorName}</span>
                                      </div>
                                      <span className="text-gray-300 hidden sm:inline">•</span>
                                      <div className="flex items-center text-[10px] sm:text-xs text-[hsl(258_22%_50%)]">
                                        <Clock className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                                        {appointment.duration}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Time and status */}
                                <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                                  <div className="text-base sm:text-lg font-bold text-[hsl(258_46%_25%)]">
                                    {formatTime12h(appointment.time)}
                                  </div>
                                  <Badge className={`status-badge text-[10px] sm:text-xs ${getStatusColor(appointment.status)}`}>
                                    {getStatusDisplayLabel(appointment.status)}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer with close button */}
            <div className="border-t pt-3 sm:pt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDayModalOpen(false)}
                className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97] text-sm"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Week View Modal */}
      <Dialog open={isQuickWeekViewOpen} onOpenChange={setIsQuickWeekViewOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden bg-white shadow-lg flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center text-[hsl(258_46%_25%)] mb-3">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Weekly Schedule - Quick View
            </DialogTitle>
            <div className="flex items-center justify-center gap-2 pr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newStart = new Date(quickViewWeekStart);
                  newStart.setDate(newStart.getDate() - 7);
                  setQuickViewWeekStart(newStart);
                }}
                className="h-8 w-8 p-0 border-gray-300 hover:bg-purple-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-[hsl(258_46%_25%)] min-w-[180px] text-center">
                {formatDateRange(quickViewWeekStart)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newStart = new Date(quickViewWeekStart);
                  newStart.setDate(newStart.getDate() + 7);
                  setQuickViewWeekStart(newStart);
                }}
                className="h-8 w-8 p-0 border-gray-300 hover:bg-purple-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers Row */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[hsl(258_46%_25%)]">
                <div className="border-r border-[hsl(258_46%_30%)]"></div>
                {getWeekDays(quickViewWeekStart).map((date, index) => {
                  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNumber = date.getDate();
                  const today = new Date();
                  const isTodayDate = date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`text-center py-2 border-r border-[hsl(258_46%_30%)] last:border-r-0 ${
                        isTodayDate ? 'bg-[hsl(258_46%_20%)]' : ''
                      }`}
                    >
                      <div className="text-white text-[10px] font-medium uppercase tracking-wide">
                        {dayLabel}
                      </div>
                      {isTodayDate ? (
                        <div className="bg-white text-[hsl(258_46%_25%)] rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-0.5 text-base font-bold">
                          {dateNumber}
                        </div>
                      ) : (
                        <div className="text-white text-base font-bold mt-0.5 h-7 flex items-center justify-center">
                          {dateNumber}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Schedule Grid with Time Column */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-white min-h-[400px]">
                {/* Time Column */}
                <div className="border-r border-gray-300 bg-gray-50">
                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-gray-200 last:border-b-0 flex items-center justify-center"
                    >
                      <span className="text-xs font-semibold text-gray-600">
                        {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {getWeekDays(quickViewWeekStart).map((date, dayIndex) => {
                  const dateStr = formatLocalDate(date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;
                  
                  const dayAppointments = appointments.filter((apt) => apt.date === dateStr && apt.status !== 'cancelled');
                  
                  // Get doctor availability for this date
                  const availability = getAvailabilityForDate(date);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`border-r border-gray-200 last:border-r-0 relative ${
                        isPast ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      {/* Working Hours Background Indicator */}
                      {!isPast && availability && (() => {
                        const [startHour, startMin] = availability.startTime.split(':').map(Number);
                        const [endHour, endMin] = availability.endTime.split(':').map(Number);
                        
                        const topOffset = ((startHour - 6) * 64) + ((startMin / 60) * 64);
                        const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                        const height = durationHours * 64;
                        
                        // Format time for labels (12-hour format)
                        const formatTime = (hour: number, min: number) => {
                          const period = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
                        };
                        
                        return (
                          <div
                            className="absolute inset-x-0 bg-green-50/40 border-l-4 border-green-400 pointer-events-none"
                            style={{
                              top: `${topOffset}px`,
                              height: `${height}px`,
                            }}
                          >
                            {/* Top indicator line */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500" />
                            {/* Bottom indicator line */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                            
                            {/* Start time label - ABOVE the top line */}
                            <div className="absolute -top-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(startHour, startMin)}
                            </div>
                            {/* End time label - BELOW the bottom line */}
                            <div className="absolute -bottom-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(endHour, endMin)}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Hour grid lines */}
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                        <div
                          key={hour}
                          className="h-12 border-b border-gray-200 last:border-b-0"
                        />
                      ))}

                      {/* Render appointments */}
                      {dayAppointments.map((appointment) => {
                        const [hours, minutes] = appointment.time.split(':').map(Number);
                        const topOffset = ((hours - 6) * 64) + ((minutes / 60) * 64);
                        const durationMatch = appointment.duration.match(/(\d+)/);
                        const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
                        const height = (durationMinutes / 60) * 64;
                        
                        const statusColors = {
                          requested: 'bg-blue-100 border-blue-300 text-blue-800',
                          proposed: 'bg-amber-100 border-amber-300 text-amber-800',
                          booked: 'bg-green-100 border-green-300 text-green-800',
                          arrived: 'bg-purple-100 border-purple-300 text-purple-800',
                          ongoing: 'bg-indigo-100 border-indigo-300 text-indigo-800',
                          completed: 'bg-gray-100 border-gray-300 text-gray-800',
                          cancelled: 'bg-red-100 border-red-300 text-red-800',
                          rejected: 'bg-orange-100 border-orange-300 text-orange-800',
                        };
                        
                        const colorClass = statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-100 border-gray-300 text-gray-800';
                        
                        return (
                          <div
                            key={appointment.id}
                            onClick={() => {
                              setIsQuickWeekViewOpen(false);
                              setSelectedAppointment(appointment);
                              setIsAppointmentModalOpen(true);
                            }}
                            className={`absolute px-2 py-1 rounded border cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
                            style={{ 
                              top: `${topOffset + 2}px`, 
                              left: '12px',
                              right: '4px',
                              height: `${Math.max(height - 4, 24)}px`, 
                              minHeight: '24px'
                            }}
                          >
                            <div className="text-[9px] font-semibold truncate">
                              {appointment.patientName}
                            </div>
                            <div className="text-[8px] truncate">
                              {formatTime12h(appointment.time)}
                            </div>
                          </div>
                        );
                      })}

                      {/* Past date overlay */}
                      {isPast && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 pointer-events-none">
                          <p className="text-xs text-gray-400 text-center px-2">Past date</p>
                        </div>
                      )}
                      
                      {/* No availability label */}
                      {!isPast && !availability && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-xs text-gray-400 text-center px-2 font-medium">No availability</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsQuickWeekViewOpen(false)}
              className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
