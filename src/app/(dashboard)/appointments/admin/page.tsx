"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, User, Phone, Mail, ArrowLeft, Check, X, AlertTriangle, RotateCcw, Users, Stethoscope, FileText, Flag, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CalendarRange from "@/components/ui/calendar-range";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

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
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
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
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
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
  const { toast } = useToast();
  
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

      // Fetch appointments with patient and doctor details
      const { data: appointmentsData, error: appointmentsError } = await supabase
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
            users (
              first_name,
              middle_name,
              last_name
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

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
        
        return {
          id: apt.appointment_id,
          patientName: apt.patient?.users 
            ? `${apt.patient.users.first_name || ''} ${apt.patient.users.middle_name || ''} ${apt.patient.users.last_name || ''}`.trim()
            : 'Unknown Patient',
          patientEmail: apt.patient?.users?.email || 'N/A',
          patientPhone: apt.patient?.users?.phone_number || 'N/A',
          emergencyContactName: apt.patient?.emergency_contact_name || 'N/A',
          emergencyContactNumber: apt.patient?.emergency_contact_no || 'N/A',
          date: displayDate.toISOString().split('T')[0],
          time: displayDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
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

  // Propose Time handlers
  const handleProposeTime = (appointment: Appointment) => {
    setProposeAppointment(appointment);
    setProposeDate(appointment.date);
    setProposeTime(appointment.time);
    setProposeEndTime("");
    setProposeReason("");
    setIsProposeTimeOpen(true);
  };

  // Accept Appointment handler
  const handleAcceptAppointment = async () => {
    if (!acceptAppointment || !acceptEndTime) {
      toast({
        title: "Validation Error",
        description: "Please select an end time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAccepting(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          proposed_start_time: acceptAppointment.time,
          proposed_end_time: acceptEndTime,
          status: 'proposed',
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', acceptAppointment.id);

      if (error) throw error;

      toast({
        title: "Appointment Accepted",
        description: "Appointment has been accepted and sent to patient for confirmation.",
      });

      setIsAcceptModalOpen(false);
      setAcceptAppointment(null);
      setAcceptEndTime("");
      fetchAppointments();
    } catch (error) {
      console.error('Error accepting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to accept appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSubmitProposedTime = async () => {
    if (!proposeAppointment || !proposeDate || !proposeTime || !proposeEndTime) {
      toast({
        title: "Validation Error",
        description: "Please select date, start time, and end time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProposing(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('appointments')
        .update({ 
          appointment_date: proposeDate,
          appointment_time: proposeTime,
          proposed_start_time: proposeTime,
          proposed_end_time: proposeEndTime,
          status: 'proposed',
          notes: proposeReason ? `Rescheduled: ${proposeReason}` : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', proposeAppointment.id);

      if (error) throw error;

      toast({
        title: "Time Rescheduled",
        description: "New appointment time has been sent to the patient for confirmation.",
      });

      setIsProposeTimeOpen(false);
      setProposeAppointment(null);
      setProposeDate("");
      setProposeTime("");
      setProposeEndTime("");
      setProposeReason("");
      fetchAppointments();
    } catch (error) {
      console.error('Error proposing time:', error);
      toast({
        title: "Error",
        description: "Failed to propose new time. Please try again.",
        variant: "destructive",
      });
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
          table: 'appointments',
          filter: 'is_active=eq.true'
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
    toast({
      title: "Appointment Scheduled",
      description: `Appointment for ${newAppointment.patientName} has been scheduled successfully.`,
    });
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
      const supabase = createClient();
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add reason to notes if provided
      if (reason) {
        updateData.notes = reason;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      const nice = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      toast({
        title: "Status Updated",
        description: reason ? `${nice}. Reason: ${reason}` : `Appointment status changed to ${nice}.`,
      });

      // Refresh appointments to get latest data
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
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
    if (pendingAction.type === "accept") {
      handleStatusChange(apt.id, "proposed");
    } else if (pendingAction.type === "arrive") {
      handleStatusChange(apt.id, "arrived");
    } else if (pendingAction.type === "ongoing") {
      handleStatusChange(apt.id, "ongoing");
    } else if (pendingAction.type === "complete") {
      handleStatusChange(apt.id, "completed");
    } else if (pendingAction.type === "cancel") {
      handleStatusChange(apt.id, "cancelled", actionReasonText.trim());
    } else if (pendingAction.type === "reject") {
      handleStatusChange(apt.id, "rejected", actionReasonText.trim());
    }
    setIsConfirmDialogOpen(false);
    setActionReasonText("");
    if (isAppointmentModalOpen) setIsAppointmentModalOpen(false);
  };

  const applyReasonAction = () => {
    // capture reason first, then confirm
    if (!pendingAction.appointment) return;
    if (!actionReasonText.trim()) return;
    setIsReasonDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentNotes(appointment.notes || "");
    setIsAppointmentModalOpen(true);
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
      toast({
        title: "Notes Updated",
        description: "Appointment notes have been saved.",
      });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Appointments</h2>
          <p className="text-[hsl(258_22%_50%)]">Manage your dental appointments</p>
        </div>
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
                      className="h-12 border-b border-gray-200 last:border-b-0 flex items-center justify-center"
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
                  
                  // Filter appointments for this day (exclude cancelled)
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
                        
                        const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                        const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                        const height = durationHours * 48;
                        
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
                        // Parse time (HH:mm format)
                        const [hours, minutes] = appointment.time.split(':').map(Number);
                        
                        // Calculate position (6 AM = 0, each hour = 48px)
                        const topOffset = ((hours - 6) * 48) + ((minutes / 60) * 48);
                        
                        // Parse duration (e.g., "60 min")
                        const durationMatch = appointment.duration.match(/(\d+)/);
                        const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
                        const height = (durationMinutes / 60) * 48;
                        
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
                              {appointment.time}
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

              {/* Notes Section */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Notes & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Current Notes</label>
                    <p className="text-[hsl(258_46%_25%)] mt-1">{selectedAppointment.notes || "No notes available"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Add/Update Notes</label>
                    <textarea
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                      rows={3}
                      placeholder="Add notes or special instructions..."
                    />
                  </div>
                  <Button onClick={handleAddNotes} variant="outline" size="sm" className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]">
                    <FileText className="h-4 w-4 mr-1" />
                    Save Notes
                  </Button>
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

      {/* Confirm Action Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white">
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
          <div className="text-[hsl(258_22%_50%)] text-sm">
            {pendingAction.type === "accept" && "The appointment will be marked as Awaiting. Patient needs to confirm their appointment."}
            {pendingAction.type === "arrive" && "This will mark the appointment as Arrived (Checked-In)."}
            {pendingAction.type === "ongoing" && "This will mark the appointment as Ongoing (treatment in progress)."}
            {pendingAction.type === "complete" && "This will mark the appointment as Completed."}
            {pendingAction.type === "cancel" && (actionReasonText ? `Reason: ${actionReasonText}` : "Cancellation requires a reason.")}
            {pendingAction.type === "reject" && (actionReasonText ? `Reason: ${actionReasonText}` : "Rejection requires a reason.")}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]">Cancel</Button>
            <Button onClick={applyConfirmedAction} style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }} className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity transition-transform duration-200 ease-in-out active:scale-[0.97]">Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reason-required Dialog */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)]">
              {pendingAction.type === "reject" && "Reject appointment"}
              {pendingAction.type === "cancel" && "Cancel appointment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[hsl(258_22%_50%)] text-sm">Please provide a reason. This will be visible in the appointment details.</p>
            <textarea
              value={actionReasonText}
              onChange={(e) => setActionReasonText(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
              rows={3}
              placeholder={pendingAction.type === "reject" ? "Reason for rejection..." : "Reason for cancellation..."}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReasonDialogOpen(false)} className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]">Back</Button>
              <Button onClick={applyReasonAction} disabled={!actionReasonText.trim()} style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }} className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity transition-transform duration-200 ease-in-out active:scale-[0.97] disabled:opacity-60">Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={isProposeTimeOpen} onOpenChange={setIsProposeTimeOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)] flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Reschedule Appointment
            </DialogTitle>
            <p className="text-sm text-[hsl(258_22%_50%)] mt-2">
              Suggest a new date and time for this appointment
            </p>
          </DialogHeader>
          
          {proposeAppointment && (
            <div className="space-y-4 py-4">
              {/* Patient Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold text-[hsl(258_46%_25%)]">{proposeAppointment.patientName}</p>
              </div>

              {/* Current Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Current Date</p>
                  <p className="font-medium text-amber-900">{formatDateShort(proposeAppointment.date)}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Current Time</p>
                  <p className="font-medium text-amber-900">{proposeAppointment.time}</p>
                </div>
              </div>

              {/* New Date & Time */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                    New Date *
                  </label>
                  <Input
                    type="date"
                    value={proposeDate}
                    onChange={(e) => setProposeDate(e.target.value)}
                    className="w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                      Start Time *
                    </label>
                    <Input
                      type="time"
                      value={proposeTime}
                      onChange={(e) => setProposeTime(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                      End Time *
                    </label>
                    <Input
                      type="time"
                      value={proposeEndTime}
                      onChange={(e) => setProposeEndTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                    Message to Patient (Optional)
                  </label>
                  <textarea
                    value={proposeReason}
                    onChange={(e) => setProposeReason(e.target.value)}
                    placeholder="e.g., Doctor unavailable, emergency case priority..."
                    className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsProposeTimeOpen(false);
                    setProposeAppointment(null);
                    setProposeDate("");
                    setProposeTime("");
                    setProposeEndTime("");
                    setProposeReason("");
                  }}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitProposedTime}
                  disabled={!proposeDate || !proposeTime || !proposeEndTime || isProposing}
                  style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
                  className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
                >
                  {isProposing ? "Rescheduling..." : "Reschedule"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Appointment Modal - Set End Time */}
      <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)] flex items-center">
              <Check className="mr-2 h-5 w-5" />
              Accept Appointment
            </DialogTitle>
            <p className="text-sm text-[hsl(258_22%_50%)] mt-2">
              Confirm the appointment time and set the end time
            </p>
          </DialogHeader>
          
          {acceptAppointment && (
            <div className="space-y-4 py-4">
              {/* Patient Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Patient</p>
                <p className="font-semibold text-[hsl(258_46%_25%)]">{acceptAppointment.patientName}</p>
              </div>

              {/* Requested Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Requested Date</p>
                  <p className="font-medium text-green-900">{formatDateShort(acceptAppointment.date)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Requested Time</p>
                  <p className="font-medium text-green-900">{acceptAppointment.time}</p>
                </div>
              </div>

              {/* End Time Input */}
              <div>
                <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                  End Time *
                </label>
                <Input
                  type="time"
                  value={acceptEndTime}
                  onChange={(e) => setAcceptEndTime(e.target.value)}
                  className="w-full"
                  placeholder="Select end time"
                />
                <p className="text-xs text-[hsl(258_22%_50%)] mt-1">
                  The start time will be the patient's requested time: {acceptAppointment.time}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAcceptModalOpen(false);
                    setAcceptAppointment(null);
                    setAcceptEndTime("");
                  }}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAcceptAppointment}
                  disabled={!acceptEndTime || isAccepting}
                  style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
                  className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
                >
                  {isAccepting ? "Accepting..." : "Accept Appointment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSave={handleNewAppointment}
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

                // Sort appointments by time
                const sortedAppointments = [...dayAppointments].sort((a, b) => {
                  return a.time.localeCompare(b.time);
                });

                return sortedAppointments.map((appointment) => (
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
                ));
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
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center text-[hsl(258_46%_25%)]">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Weekly Schedule - Quick View
              </DialogTitle>
              <div className="flex items-center gap-2">
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
                        
                        const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                        const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                        const height = durationHours * 48;
                        
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
                        const topOffset = ((hours - 6) * 48) + ((minutes / 60) * 48);
                        const durationMatch = appointment.duration.match(/(\d+)/);
                        const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
                        const height = (durationMinutes / 60) * 48;
                        
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
  );
}
