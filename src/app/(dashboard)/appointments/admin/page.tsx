"use client";



 import { useEffect, useRef, useState } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, User, Phone, Mail, ArrowLeft, Check, X, AlertTriangle, RotateCcw, Users, Stethoscope, FileText, Eye, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CalendarRange from "@/components/ui/calendar-range";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  service: string;
  status: "pending" | "approved" | "arrived" | "completed" | "cancelled" | "rejected";
  duration: string;
  doctorId: string;
  doctorName: string;
  notes?: string;
  actionReason?: string;
  // ISO timestamp when the appointment was requested
  requestedAt?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  todayAppointments: number;
  pendingApprovals: number;
}

const sampleAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    patientEmail: "sarah.j@email.com",
    patientPhone: "(555) 123-4567",
    date: "2024-01-15",
    time: "09:00",
    service: "Regular Cleaning",
    status: "completed",
    duration: "60 min",
    doctorId: "doc1",
    doctorName: "Dr. Smith",
    notes: "First time patient",
    requestedAt: "2024-01-12T15:40:00Z"
  },
  {
    id: "2",
    patientName: "Michael Chen",
    patientEmail: "m.chen@email.com",
    patientPhone: "(555) 234-5678",
    date: "2024-01-15",
    time: "10:30",
    service: "Root Canal",
    status: "arrived",
    duration: "90 min",
    doctorId: "doc2",
    doctorName: "Dr. Johnson",
    requestedAt: "2024-01-13T09:25:00Z"
  },
  {
    id: "3",
    patientName: "Emily Davis",
    patientEmail: "emily.davis@email.com",
    patientPhone: "(555) 345-6789",
    date: "2024-01-15",
    time: "14:00",
    service: "Dental Filling",
    status: "approved",
    duration: "45 min",
    doctorId: "doc1",
    doctorName: "Dr. Smith",
    requestedAt: "2024-01-14T11:05:00Z"
  },
  {
    id: "4",
    patientName: "Robert Wilson",
    patientEmail: "r.wilson@email.com",
    patientPhone: "(555) 456-7890",
    date: "2024-01-15",
    time: "09:30",
    service: "Consultation",
    status: "pending",
    duration: "30 min",
    doctorId: "doc3",
    doctorName: "Dr. Williams",
    requestedAt: "2024-01-14T16:45:00Z"
  },
  {
    id: "5",
    patientName: "Lisa Brown",
    patientEmail: "lisa.brown@email.com",
    patientPhone: "(555) 567-8901",
    date: "2024-01-16",
    time: "11:00",
    service: "Teeth Whitening",
    status: "rejected",
    duration: "45 min",
    doctorId: "doc2",
    doctorName: "Dr. Johnson",
    requestedAt: "2024-01-15T08:10:00Z"
  },
  {
    id: "6",
    patientName: "Daniel Roberts",
    patientEmail: "dan.roberts@email.com",
    patientPhone: "(555) 678-9012",
    date: "2024-01-16",
    time: "13:15",
    service: "Extraction",
    status: "cancelled",
    duration: "30 min",
    doctorId: "doc3",
    doctorName: "Dr. Williams",
    notes: "Allergic to penicillin",
    requestedAt: "2024-01-15T10:55:00Z"
  }
];

const sampleDoctors: Doctor[] = [
  {
    id: "doc1",
    name: "Dr. Smith",
    specialty: "General Dentistry",
    todayAppointments: 2,
    pendingApprovals: 1
  },
  {
    id: "doc2", 
    name: "Dr. Johnson",
    specialty: "Endodontics",
    todayAppointments: 2,
    pendingApprovals: 1
  },
  {
    id: "doc3",
    name: "Dr. Williams", 
    specialty: "Oral Surgery",
    todayAppointments: 0,
    pendingApprovals: 0
  }
];

function getStatusColor(status: Appointment["status"]) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "arrived":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
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
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [doctors] = useState<Doctor[]>(sampleDoctors);
  const [activeTab, setActiveTab] = useState<"overall" | "doctors" | "calendar">("overall");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorTab, setDoctorTab] = useState<"appointments" | "calendar">("appointments");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDoctor, setFilterDoctor] = useState<string>("all");
  // Calendar picker state (demo uses fixed 'today' to match sample data)
  const demoToday = new Date("2024-01-15"); // NOTE: In production, use new Date()
  const minDate = new Date(demoToday.getFullYear(), demoToday.getMonth(), demoToday.getDate());
  const [selectedStart, setSelectedStart] = useState<Date | null>(minDate);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState("");
  type ActionType = "accept" | "arrive" | "complete" | "reject" | "cancel";
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: ActionType; appointment: Appointment | null }>({ type: "accept", appointment: null });
  const [actionReasonText, setActionReasonText] = useState("");
  const { toast } = useToast();

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
  const pendingApprovals = appointments.filter(apt => apt.status === "pending").length;
  const completedThisWeek = appointments.filter(apt => apt.status === "completed").length;

  const handleStatusChange = (appointmentId: string, newStatus: Appointment["status"], reason?: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus, actionReason: reason } : apt
      )
    );
    const nice = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    toast({
      title: "Status Updated",
      description: reason ? `${nice}. Reason: ${reason}` : `Appointment status changed to ${nice}.`,
    });
  };

  const openConfirm = (appointment: Appointment, type: ActionType) => {
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
      handleStatusChange(apt.id, "approved");
    } else if (pendingAction.type === "arrive") {
      handleStatusChange(apt.id, "arrived");
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
      filtered = filtered.filter(apt => apt.date === startStr);
    }

    // Doctor filtering
    if (filterDoctor !== "all") {
      filtered = filtered.filter(apt => apt.doctorId === filterDoctor);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Appointments</h2>
          <p className="text-[hsl(258_22%_50%)]">Manage your dental appointments</p>
        </div>
        <Button 
          style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
          className="hover:opacity-90"
          onClick={() => setIsNewAppointmentOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
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
      {!selectedDoctor && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overall")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overall"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overall Appointments
            </button>
            <button
              onClick={() => setActiveTab("doctors")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "doctors"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Doctor List
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "calendar"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overall Calendar View
            </button>
          </nav>
        </div>
      )}

      {/* Doctor View Header */}
      {selectedDoctor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoctor(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Doctor List
              </Button>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h3>
                <p className="text-gray-500">{selectedDoctor.specialty}</p>
              </div>
            </div>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setDoctorTab("appointments")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  doctorTab === "appointments"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Today's Appointments
              </button>
              <button
                onClick={() => setDoctorTab("calendar")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  doctorTab === "calendar"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Calendar View
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!selectedDoctor && activeTab === "overall" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Overall Appointments
                </CardTitle>
                <CardDescription className="text-[hsl(258_22%_50%)]">All appointments across all doctors</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Controls (Search + Filters) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="relative max-w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
                  <Input
                    placeholder="Search by patient or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                  />
                </div>
              </div>
              {/* Date Filter Popover */}
              <div className="relative inline-flex items-center gap-2" ref={popRef}>
                <span className="text-sm font-medium text-[hsl(258_22%_50%)]">Date:</span>
                <Button
                  variant="outline"
                  onClick={() => setIsDateFilterOpen((v) => !v)}
                  className="bg-white text-[hsl(258_46%_25%)] hover:bg-purple-50 active:bg-purple-100 active:scale-[0.98] cursor-pointer flex items-center gap-2 transition-colors transition-transform duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-[hsl(258_46%_25%)] text-sm">
                    {(() => {
                      const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      if (selectedStart && selectedEnd) return `${fmt.format(selectedStart)} – ${fmt.format(selectedEnd)}`;
                      if (selectedStart) return fmt.format(selectedStart);
                      return 'Select date';
                    })()}
                  </span>
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

              <div className="inline-flex items-center gap-2">
                <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Doctor:</label>
                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="h-9 px-3 border border-gray-300 rounded-md text-sm text-[hsl(258_46%_25%)] bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent cursor-pointer"
                >
                  <option value="all">All Doctors</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2">
                <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-3 border border-gray-300 rounded-md text-sm text-[hsl(258_46%_25%)] bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="arrived">Arrived</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Search removed: now integrated into filters */}

            {/* Appointments Table */}
            <div className="overflow-x-auto">
              <div className="h-[24rem] overflow-y-auto">
                {(() => {
                  const rows = getFilteredAppointments();
                  if (rows.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-[hsl(258_22%_50%)]">
                          <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-60" />
                          <p className="text-sm">No results found</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center py-3 px-4 font-medium text-[hsl(258_22%_50%)] w-[150px]">Requested On</th>
                          <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)] w-[28%]">Patient Name</th>
                          <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)] w-[22%]">Doctor Name</th>
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
                                  <div className="text-sm text-[hsl(258_22%_50%)]">{appointment.service}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-left text-[hsl(258_46%_25%)]">{appointment.doctorName}</td>
                            <td className="py-3 px-4 align-middle text-center">
                              <div className="whitespace-nowrap tabular-nums min-w-[140px] leading-tight mx-auto">
                                <div className="text-sm font-medium text-[hsl(258_46%_25%)]">{formatDateShort(appointment.date)}</div>
                                <div className="text-sm text-[hsl(258_22%_50%)]">{formatTime12h(appointment.time)}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 align-middle">
                              <div className="flex justify-center mx-auto">
                                <Badge className={`status-badge ${getStatusColor(appointment.status)}`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2 justify-center mx-auto" onClick={(e) => e.stopPropagation()}>
                                {appointment.status === "pending" && (
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
                                {appointment.status === "approved" && (
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
                                {appointment.status === "arrived" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openConfirm(appointment, "complete")}
                                      className="action-btn-w action-btn-compact text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 active:text-blue-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                                    >
                                      <Flag className="h-4 w-4 mr-1" />
                                      Complete
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
                                
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedDoctor && activeTab === "doctors" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
              <Users className="mr-2 h-5 w-5" />
              Doctor List
            </CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">Select a doctor to view their appointments and schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <Card 
                  key={doctor.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                          {getInitials(doctor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[hsl(258_46%_25%)]">{doctor.name}</h3>
                        <p className="text-sm text-[hsl(258_22%_50%)] flex items-center">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[hsl(258_46%_25%)]">{doctor.todayAppointments}</div>
                        <div className="text-xs text-[hsl(258_22%_50%)]">Today's Appointments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{doctor.pendingApprovals}</div>
                        <div className="text-xs text-[hsl(258_22%_50%)]">Pending Approvals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedDoctor && activeTab === "calendar" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Overall Calendar View
            </CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">Monthly/weekly calendar view of all appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-[hsl(258_22%_50%)]">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
              <p>Calendar view will be implemented here</p>
              <p className="text-sm">Show appointments across all doctors with filtering options</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor-specific views */}
      {selectedDoctor && doctorTab === "appointments" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
              <CalendarIcon className="mr-2 h-5 w-5" />
              {selectedDoctor.name}'s Appointments Today
            </CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">Appointments for {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Patient Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Service</th>
                    <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[hsl(258_22%_50%)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments
                    .filter(apt => apt.doctorId === selectedDoctor.id)
                    .map((appointment) => (
                    <tr 
                      key={appointment.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                              {getInitials(appointment.patientName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-[hsl(258_46%_25%)]">{appointment.patientName}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[hsl(258_46%_25%)]">{appointment.time}</td>
                      <td className="py-3 px-4 text-[hsl(258_46%_25%)]">{appointment.service}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="action-btn-w action-btn-compact">
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDoctor && doctorTab === "calendar" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
              <CalendarIcon className="mr-2 h-5 w-5" />
              {selectedDoctor.name}'s Calendar
            </CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">Weekly/monthly schedule view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-[hsl(258_22%_50%)]">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
              <p>Doctor's calendar view will be implemented here</p>
              <p className="text-sm">Show {selectedDoctor.name}'s schedule and availability</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-[hsl(258_46%_25%)]">
                <User className="mr-2 h-5 w-5" />
                Appointment Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
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
                      <p className="text-[hsl(258_22%_50%)]">{selectedAppointment.service}</p>
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
                </CardContent>
              </Card>

              {/* Doctor Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                        {getInitials(selectedAppointment.doctorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-[hsl(258_46%_25%)]">{selectedAppointment.doctorName}</h3>
                      <p className="text-[hsl(258_22%_50%)]">
                        {doctors.find(d => d.id === selectedAppointment.doctorId)?.specialty || "General Dentistry"}
                      </p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Date</label>
                      <p className="text-[hsl(258_46%_25%)]">{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Time</label>
                      <p className="text-[hsl(258_46%_25%)]">{selectedAppointment.time}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Requested On</label>
                      <p className="text-[hsl(258_46%_25%)]">{formatDateTimeFromISO(selectedAppointment.requestedAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Duration</label>
                      <p className="text-[hsl(258_46%_25%)]">{selectedAppointment.duration}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Status</label>
                      <Badge className={getStatusColor(selectedAppointment.status)}>
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </Badge>
                    </div>
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
                  <Button onClick={handleAddNotes} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Save Notes
                  </Button>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {selectedAppointment.status === "pending" && (
                  <>
                    <Button
                      onClick={() => openConfirm(selectedAppointment, "accept")}
                      className="action-btn-w bg-green-600 hover:bg-green-700 active:bg-green-800 text-white cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openReason(selectedAppointment, "reject")}
                      className="action-btn-w text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:text-red-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {selectedAppointment.status === "approved" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => openConfirm(selectedAppointment, "arrive")}
                      className="action-btn-w text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100 active:text-purple-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Mark as Arrived
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openReason(selectedAppointment, "cancel")}
                      className="action-btn-w text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}

                {selectedAppointment.status === "arrived" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => openConfirm(selectedAppointment, "complete")}
                      className="action-btn-w text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 active:text-blue-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openReason(selectedAppointment, "cancel")}
                      className="action-btn-w text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100 active:text-yellow-800 cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                

                {/* Optional: Reschedule stays available for non-cancelled/completed */}
                {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Reschedule",
                        description: "Reschedule functionality will be implemented here",
                      });
                    }}
                    className="action-btn-w cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="action-btn-w cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97]"
                >
                  Close
                </Button>
              </div>
            </div>
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
              {pendingAction.type === "complete" && "Mark appointment as Completed?"}
              {pendingAction.type === "cancel" && "Confirm cancellation?"}
              {pendingAction.type === "reject" && "Confirm rejection?"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-[hsl(258_22%_50%)] text-sm">
            {pendingAction.type === "accept" && "The appointment will be marked as Approved (Scheduled)."}
            {pendingAction.type === "arrive" && "This will mark the appointment as Arrived (Checked-In)."}
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

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSave={handleNewAppointment}
      />
    </div>
  );
}
