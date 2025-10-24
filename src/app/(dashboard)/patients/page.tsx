"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  CalendarIcon,
  Clock,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  MapPin,
  NotebookPen,
  Phone,
  Search,
  User,
  Users
} from "lucide-react";

type RosterTab = "roster" | "history";

interface PatientSummary {
  patientId: string;
  patientName: string;
  email: string;
  phone: string;
  totalAppointments: number;
  lastAppointmentStatus: string;
  lastAppointmentTime: string | null;
}

interface AppointmentHistoryEntry {
  historyId: string;
  status: string;
  changedAt: string;
  notes?: string | null;
  feedback?: string | null;
  changedByName?: string;
  changedByRole?: string;
}

interface PatientAppointmentDetail {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  concern?: string | null;
  status: "requested" | "proposed" | "booked" | "arrived" | "ongoing" | "completed" | "cancelled" | "rejected";
  date: string;
  time: string;
  duration: string;
  doctorId: string;
  doctorName: string;
  doctorNote?: string | null;
  requestedAt?: string;
  proposedStartTime?: string | null;
  proposedEndTime?: string | null;
  bookedStartTime?: string | null;
  bookedEndTime?: string | null;
  statusHistory?: AppointmentHistoryEntry[];
}

interface PatientProfileDetail {
  patientId: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactNumber?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function getStatusColor(status: PatientAppointmentDetail["status"]) {
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

function getStatusDisplayLabel(status: PatientAppointmentDetail["status"]) {
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
  const parts = name.trim().split(" ").filter((part) => part.length > 0);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime12h(timeStr: string) {
  const [hh, mm] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hh || 0, mm || 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatTime12hFromISO(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatDateShortFromISO(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start) return "";
  const startLabel = formatTime12hFromISO(start);
  if (!end) return startLabel;
  const endLabel = formatTime12hFromISO(end);
  return `${startLabel} - ${endLabel}`;
}

function transformAppointmentRecord(apt: any): PatientAppointmentDetail {
  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "60 min";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs <= 0) return "60 min";
    const diffMinutes = Math.round(diffMs / 60000);
    return `${diffMinutes} min`;
  };

  const bestStart = apt.booked_start_time || apt.proposed_start_time || apt.requested_start_time || apt.created_at;
  const displayDate = new Date(bestStart || new Date().toISOString());
  const year = displayDate.getFullYear();
  const month = String(displayDate.getMonth() + 1).padStart(2, "0");
  const day = String(displayDate.getDate()).padStart(2, "0");
  const hours = String(displayDate.getHours()).padStart(2, "0");
  const minutes = String(displayDate.getMinutes()).padStart(2, "0");

  const patientRecord = apt.patient;
  const patientUserRaw = patientRecord?.users;
  const patientUser = Array.isArray(patientUserRaw) ? patientUserRaw[0] : patientUserRaw;

  const nameParts = [patientUser?.first_name, patientUser?.middle_name, patientUser?.last_name]
    .filter(Boolean)
    .map((part: string) => part.trim());
  const fullName = nameParts.join(" ") || "Unnamed Patient";

  const doctorUserRaw = apt.doctors?.users;
  const doctorUser = Array.isArray(doctorUserRaw) ? doctorUserRaw[0] : doctorUserRaw;
  const doctorName = doctorUser
    ? `Dr. ${doctorUser.last_name || doctorUser.first_name || "Unknown"}`
    : "Dr. Unknown";

  return {
    id: apt.appointment_id,
    patientName: fullName,
    patientEmail: patientUser?.email || "N/A",
    patientPhone: patientUser?.phone_number || "N/A",
    emergencyContactName: patientRecord?.emergency_contact_name || "N/A",
    emergencyContactNumber: patientRecord?.emergency_contact_no || "N/A",
    concern: apt.concern || "N/A",
    status: apt.status,
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    duration: calculateDuration(
      apt.booked_start_time || apt.proposed_start_time || apt.requested_start_time,
      apt.booked_end_time || apt.proposed_end_time || null
    ),
    doctorId: apt.doctor_id,
    doctorName,
    doctorNote: apt.doctor_note,
    requestedAt: apt.created_at,
    proposedStartTime: apt.proposed_start_time,
    proposedEndTime: apt.proposed_end_time,
    bookedStartTime: apt.booked_start_time,
    bookedEndTime: apt.booked_end_time,
    statusHistory: []
  } satisfies PatientAppointmentDetail;
}

export default function PatientsPage() {
  const [activeTab, setActiveTab] = useState<RosterTab>("roster");
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterPatients, setRosterPatients] = useState<PatientSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointmentDetail[]>([]);
  const [isAppointmentListOpen, setIsAppointmentListOpen] = useState<boolean>(false);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState<boolean>(false);
  const [isLoadingPatientAppointments, setIsLoadingPatientAppointments] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointmentDetail | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [doctorNoteDraft, setDoctorNoteDraft] = useState<string>("");
  const [doctorNoteError, setDoctorNoteError] = useState<string | null>(null);
  const [doctorNoteSuccess, setDoctorNoteSuccess] = useState<string | null>(null);
  const [isSavingDoctorNote, setIsSavingDoctorNote] = useState<boolean>(false);
  const [loadingPatientId, setLoadingPatientId] = useState<string | null>(null);
  const [isPatientProfileOpen, setIsPatientProfileOpen] = useState<boolean>(false);
  const [profilePatientSummary, setProfilePatientSummary] = useState<PatientSummary | null>(null);
  const [patientProfileDetail, setPatientProfileDetail] = useState<PatientProfileDetail | null>(null);
  const [isLoadingPatientProfile, setIsLoadingPatientProfile] = useState<boolean>(false);
  const [patientProfileError, setPatientProfileError] = useState<string | null>(null);
  const [loadingProfilePatientId, setLoadingProfilePatientId] = useState<string | null>(null);
  const [clinicHistoryAppointments, setClinicHistoryAppointments] = useState<PatientAppointmentDetail[]>([]);
  const [isLoadingHistoryList, setIsLoadingHistoryList] = useState<boolean>(false);
  const [historyListError, setHistoryListError] = useState<string | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "completed" | "cancelled" | "rejected">("all");
  const [historySearchTerm, setHistorySearchTerm] = useState<string>("");

  const resetPatientContext = () => {
    setSelectedPatient(null);
    setPatientAppointments([]);
    setSelectedAppointment(null);
    setModalError(null);
    setDoctorNoteDraft("");
    setDoctorNoteError(null);
    setDoctorNoteSuccess(null);
    setIsLoadingHistory(false);
    setIsLoadingPatientAppointments(false);
    setLoadingPatientId(null);
    setIsAppointmentListOpen(false);
    setIsAppointmentDetailOpen(false);
  };

  const handleListOpenChange = (open: boolean) => {
    if (open) {
      setIsAppointmentListOpen(true);
    } else {
      resetPatientContext();
    }
  };

  const handleDetailOpenChange = (open: boolean) => {
    if (open) {
      setIsAppointmentDetailOpen(true);
      return;
    }

    setIsAppointmentDetailOpen(false);
    setDoctorNoteError(null);
    setDoctorNoteSuccess(null);
    setIsLoadingHistory(false);
  };

  const handleProfileOpenChange = (open: boolean) => {
    if (open) {
      setIsPatientProfileOpen(true);
      return;
    }

    setIsPatientProfileOpen(false);
    setProfilePatientSummary(null);
    setPatientProfileDetail(null);
    setPatientProfileError(null);
    setIsLoadingPatientProfile(false);
    setLoadingProfilePatientId(null);
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!doctorNoteSuccess) return undefined;
    const timeout = window.setTimeout(() => setDoctorNoteSuccess(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [doctorNoteSuccess]);

  const loadClinicHistory = async () => {
    try {
      setIsLoadingHistoryList(true);
      setHistoryListError(null);

      const supabase = createClient();

      const baseSelect = `
          appointment_id,
          doctor_id,
          concern,
          status,
          doctor_note,
          requested_start_time,
          proposed_start_time,
          proposed_end_time,
          booked_start_time,
          booked_end_time,
          created_at,
          patient:patient_id (
            patient_id,
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
            users (
              first_name,
              middle_name,
              last_name
            )
          )
        `;

      const historyStatuses = ["completed", "cancelled", "rejected", "booked", "arrived", "ongoing"] as const;
      const nowIso = new Date().toISOString();

      let historyQuery = supabase
        .from("appointments")
        .select(baseSelect)
        .in("status", historyStatuses)
        .order("requested_start_time", { ascending: false })
        .limit(100);

      historyQuery = historyQuery.or(
        `and(booked_start_time.not.is.null,booked_start_time.lt.${nowIso}),and(booked_start_time.is.null,proposed_start_time.not.is.null,proposed_start_time.lt.${nowIso}),and(booked_start_time.is.null,proposed_start_time.is.null,requested_start_time.lt.${nowIso})`
      );

      if (currentDoctorId) {
        historyQuery = historyQuery.eq("doctor_id", currentDoctorId);
      }

      const { data, error } = await historyQuery;

      if (error) {
        console.error("Failed to load clinic history:", error);
        setHistoryListError("Failed to load appointment history.");
        setClinicHistoryAppointments([]);
        return;
      }

      const transformed = (data || []).map((apt: any) => transformAppointmentRecord(apt));
      setClinicHistoryAppointments(transformed);
    } catch (error) {
      console.error("Unexpected error loading clinic history:", error);
      setHistoryListError("An unexpected error occurred while loading appointment history.");
      setClinicHistoryAppointments([]);
    } finally {
      setIsLoadingHistoryList(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      void loadClinicHistory();
    }
  }, [activeTab, currentDoctorId]);

  const loadRoster = async () => {
    try {
      setIsLoadingRoster(true);
      setRosterError(null);
      setCurrentDoctorId(null);

      const supabase = createClient();

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error while loading patients:", authError);
        setRosterError("Authentication failed. Please try again.");
        return;
      }

      if (!user) {
        setRosterError("Not authenticated.");
        return;
      }

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("user_id, role")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userRecord) {
        console.error("Failed to load user record:", userError);
        setRosterError("Failed to load account details.");
        return;
      }

      let doctorId: string | null = null;

      if (userRecord.role === "dentist") {
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("doctor_id")
          .eq("user_id", userRecord.user_id)
          .single();

        if (doctorError || !doctorData) {
          console.error("Failed to load doctor profile:", doctorError);
          setRosterError("Unable to determine doctor assignment.");
          return;
        }
        doctorId = doctorData.doctor_id;
        setCurrentDoctorId(doctorData.doctor_id);
      } else if (userRecord.role === "staff" || userRecord.role === "dental_staff") {
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("doctor_id")
          .eq("user_id", userRecord.user_id)
          .single();

        if (staffError || !staffData) {
          console.error("Failed to load staff profile:", staffError);
          setRosterError("Unable to determine supervising doctor.");
          return;
        }

        if (!staffData.doctor_id) {
          setRosterError("No supervising doctor assigned.");
          return;
        }

        doctorId = staffData.doctor_id;
        setCurrentDoctorId(staffData.doctor_id);
      }

      let appointmentsQuery = supabase
        .from("appointments")
        .select(
          `
            appointment_id,
            status,
            doctor_id,
            created_at,
            requested_start_time,
            proposed_start_time,
            booked_start_time,
            booked_end_time,
            patient:patient_id (
              patient_id,
              emergency_contact_name,
              emergency_contact_no,
              users (
                first_name,
                middle_name,
                last_name,
                email,
                phone_number
              )
            )
          `
        )
        .not("patient_id", "is", null)
        .order("created_at", { ascending: false });

      if (doctorId) {
        appointmentsQuery = appointmentsQuery.eq("doctor_id", doctorId);
      }

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) {
        console.error("Appointments query failed:", appointmentsError);
        setRosterError("Failed to load patient roster.");
        return;
      }

      const patientMap = new Map<string, PatientSummary & { latestTimestamp: number }>();

      (appointmentsData || []).forEach((apt: any) => {
        const patientRecord = apt.patient;
        const patientUser = patientRecord?.users;
        if (!patientRecord || !patientUser) return;

        const patientId = patientRecord.patient_id;
        const nameParts = [patientUser.first_name, patientUser.middle_name, patientUser.last_name]
          .filter(Boolean)
          .map((part: string) => part.trim());
        const fullName = nameParts.join(" ") || "Unnamed Patient";

        const bestStart = apt.booked_start_time || apt.proposed_start_time || apt.requested_start_time;
        const timestamp = bestStart ? new Date(bestStart).getTime() : new Date(apt.created_at).getTime();

        const previous = patientMap.get(patientId);

        if (previous) {
          const latestTimestamp = Math.max(previous.latestTimestamp, timestamp);
          patientMap.set(patientId, {
            ...previous,
            totalAppointments: previous.totalAppointments + 1,
            latestTimestamp,
            lastAppointmentStatus: latestTimestamp === timestamp ? apt.status : previous.lastAppointmentStatus,
            lastAppointmentTime:
              latestTimestamp === timestamp
                ? bestStart
                : previous.lastAppointmentTime
          });
        } else {
          patientMap.set(patientId, {
            patientId,
            patientName: fullName,
            email: patientUser.email || "N/A",
            phone: patientUser.phone_number || "N/A",
            totalAppointments: 1,
            lastAppointmentStatus: apt.status,
            lastAppointmentTime: bestStart,
            latestTimestamp: timestamp
          });
        }
      });

      const sortedPatients = Array.from(patientMap.values())
        .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
        .map(({ latestTimestamp, ...rest }) => rest);

      setRosterPatients(sortedPatients);
    } catch (error) {
      console.error("Unexpected error loading patient roster:", error);
      setRosterError("An unexpected error occurred while loading patients.");
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const loadPatientProfile = async (patient: PatientSummary): Promise<PatientProfileDetail> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("patient")
      .select(
        `
          patient_id,
          address,
          emergency_contact_no,
          emergency_contact_name,
          created_at,
          updated_at,
          users:user_id (
            first_name,
            middle_name,
            last_name,
            email,
            phone_number
          )
        `
      )
      .eq("patient_id", patient.patientId)
      .single();

    if (error || !data) {
      throw error || new Error("Patient record not found");
    }

    const userRecordRaw = data.users;
    const userRecord = Array.isArray(userRecordRaw) ? userRecordRaw[0] : userRecordRaw;

    const nameParts = [userRecord?.first_name, userRecord?.middle_name, userRecord?.last_name]
      .filter(Boolean)
      .map((part: string) => part.trim());
    const fullName = nameParts.length ? nameParts.join(" ") : patient.patientName;

    return {
      patientId: data.patient_id,
      fullName,
      email: userRecord?.email || patient.email,
      phone: userRecord?.phone_number || patient.phone,
      address: data.address,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactNumber: data.emergency_contact_no,
      createdAt: data.created_at,
      updatedAt: data.updated_at ?? null
    } satisfies PatientProfileDetail;
  };

  const fetchPatientAppointments = async (patientId: string) => {
    const supabase = createClient();

    let appointmentsQuery = supabase
      .from("appointments")
      .select(
        `
          appointment_id,
          doctor_id,
          concern,
          status,
          doctor_note,
          requested_start_time,
          proposed_start_time,
          proposed_end_time,
          booked_start_time,
          booked_end_time,
          created_at,
          patient:patient_id (
            patient_id,
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
            users (
              first_name,
              middle_name,
              last_name
            )
          )
        `
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (currentDoctorId) {
      appointmentsQuery = appointmentsQuery.eq("doctor_id", currentDoctorId);
    }

    const { data, error } = await appointmentsQuery;

    if (error) {
      throw error;
    }

    const transformed: PatientAppointmentDetail[] = (data || []).map((apt: any) => transformAppointmentRecord(apt));

    return transformed;
  };

  const loadAppointmentHistory = async (appointmentId: string) => {
    try {
      setIsLoadingHistory(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appointment_status_history")
        .select(
          `
            history_id,
            status,
            changed_at,
            notes,
            feedback,
            users:changed_by_user_id (
              first_name,
              middle_name,
              last_name,
              role
            )
          `
        )
        .eq("appointment_id", appointmentId)
        .order("changed_at", { ascending: false });

      if (error) {
        console.error("Failed to load appointment history:", error);
        return;
      }

      const historyEntries: AppointmentHistoryEntry[] = (data || []).map((entry: any) => {
        const userRecord = entry.users;
        const nameParts = [userRecord?.first_name, userRecord?.middle_name, userRecord?.last_name]
          .filter(Boolean)
          .map((part: string) => part.trim());
        const displayName = nameParts.length ? nameParts.join(" ") : undefined;

        return {
          historyId: entry.history_id,
          status: entry.status,
          changedAt: entry.changed_at,
          notes: entry.notes,
          feedback: entry.feedback,
          changedByRole: userRecord?.role,
          changedByName: userRecord
            ? `${userRecord.role === "dentist" ? "Dr. " : ""}${displayName || "Unknown"}`.trim()
            : undefined
        };
      });

      setSelectedAppointment((previous) => {
        if (!previous || previous.id !== appointmentId) return previous;
        return {
          ...previous,
          statusHistory: historyEntries
        };
      });
    } catch (error) {
      console.error("Unexpected error loading appointment history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const selectPatientAppointment = async (appointment: PatientAppointmentDetail) => {
    setSelectedAppointment(appointment);
    setDoctorNoteDraft(appointment.doctorNote || "");
    setDoctorNoteError(null);
    setDoctorNoteSuccess(null);
    await loadAppointmentHistory(appointment.id);
  };

  const handleAppointmentSelect = (appointment: PatientAppointmentDetail) => {
    void selectPatientAppointment(appointment);
    setIsAppointmentDetailOpen(true);
  };

  const handleViewAppointments = async (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setIsAppointmentListOpen(true);
    setIsAppointmentDetailOpen(false);
    setPatientAppointments([]);
    setSelectedAppointment(null);
    setDoctorNoteDraft("");
    setDoctorNoteError(null);
    setDoctorNoteSuccess(null);
    setModalError(null);
    setIsLoadingPatientAppointments(true);
    setLoadingPatientId(patient.patientId);

    try {
      const appointments = await fetchPatientAppointments(patient.patientId);

      if (!appointments.length) {
        setModalError("No appointments found for this patient.");
        setPatientAppointments([]);
        setSelectedAppointment(null);
        return;
      }

      setPatientAppointments(appointments);
      setSelectedAppointment(appointments[0]);
      setDoctorNoteDraft(appointments[0].doctorNote || "");
      setDoctorNoteError(null);
      setDoctorNoteSuccess(null);
      void loadAppointmentHistory(appointments[0].id);
    } catch (error) {
      console.error("Failed to load patient appointments:", error);
      setModalError("Failed to load appointments for this patient.");
    } finally {
      setIsLoadingPatientAppointments(false);
      setLoadingPatientId(null);
    }
  };

  const handleViewProfile = async (patient: PatientSummary) => {
    setProfilePatientSummary(patient);
    setIsPatientProfileOpen(true);
    setPatientProfileDetail(null);
    setPatientProfileError(null);
    setIsLoadingPatientProfile(true);
    setLoadingProfilePatientId(patient.patientId);

    try {
      const detail = await loadPatientProfile(patient);
      setPatientProfileDetail(detail);
    } catch (error) {
      console.error("Failed to load patient profile:", error);
      setPatientProfileError("Unable to load patient profile.");
    } finally {
      setIsLoadingPatientProfile(false);
      setLoadingProfilePatientId(null);
    }
  };

  const handleSaveDoctorNote = async () => {
    if (!selectedAppointment) return;

    const trimmedDraft = doctorNoteDraft.trim();

    try {
      setIsSavingDoctorNote(true);
      setDoctorNoteError(null);

      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({ doctor_note: trimmedDraft.length ? trimmedDraft : null })
        .eq("appointment_id", selectedAppointment.id);

      if (error) {
        console.error("Failed to save doctor note:", error);
        setDoctorNoteError("Failed to save note. Please try again.");
        return;
      }

      setPatientAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? { ...appointment, doctorNote: trimmedDraft.length ? trimmedDraft : null }
            : appointment
        )
      );

      setSelectedAppointment((previous) =>
        previous ? { ...previous, doctorNote: trimmedDraft.length ? trimmedDraft : null } : previous
      );

      setClinicHistoryAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? { ...appointment, doctorNote: trimmedDraft.length ? trimmedDraft : null }
            : appointment
        )
      );

      setDoctorNoteSuccess(trimmedDraft.length ? "Doctor note updated." : "Doctor note cleared.");
    } catch (error) {
      console.error("Unexpected error saving doctor note:", error);
      setDoctorNoteError("Unexpected error while saving note.");
    } finally {
      setIsSavingDoctorNote(false);
    }
  };

  const filteredRoster = useMemo(() => {
    if (!searchTerm) return rosterPatients;
    return rosterPatients.filter((patient) =>
      patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rosterPatients, searchTerm]);

  const filteredHistoryAppointments = useMemo(() => {
    const normalizedTerm = historySearchTerm.trim().toLowerCase();
    return clinicHistoryAppointments.filter((appointment) => {
      const matchesStatus =
  historyStatusFilter === "all" ? true : appointment.status === historyStatusFilter;

      if (!matchesStatus) return false;

      if (!normalizedTerm) return true;

      const termSources = [
        appointment.patientName,
        appointment.patientEmail,
        appointment.patientPhone,
        appointment.doctorName,
        appointment.concern || "",
        appointment.doctorNote || ""
      ];

      return termSources.some((source) => source.toLowerCase().includes(normalizedTerm));
    });
  }, [clinicHistoryAppointments, historySearchTerm, historyStatusFilter]);

  const historyFilterOptions: Array<{ key: "all" | "completed" | "cancelled" | "rejected"; label: string }> = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "rejected", label: "Rejected" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Patients</h2>
          <p className="text-[hsl(258_22%_50%)]">Review patient interactions and appointment history</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-2 md:gap-3" role="tablist" aria-label="Patient navigation">
          {[{ key: "roster", label: "Patient Roster", icon: Users }, { key: "history", label: "Appointment History", icon: FileText }].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`inline-flex items-center gap-2 px-4 py-2 -mb-[1px] rounded-t-md text-sm font-medium cursor-pointer transition-colors transition-transform duration-200 ease-in-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${activeTab === key
                  ? "bg-[hsl(258_46%_25%)] text-white border-b-2 border-white/90"
                  : "text-gray-700 hover:text-purple-800 hover:bg-purple-100"
                }`}
              onClick={() => setActiveTab(key as RosterTab)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "roster" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Patient Roster
                </CardTitle>
                <CardDescription className="text-[hsl(258_22%_50%)]">Your active patients linked to this care team</CardDescription>
                <div className="relative mt-3 w-full md:w-100">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
                  <Input
                    placeholder="Search by name, email, or phone"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9 h-9 text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRoster ? (
              <div className="flex h-48 items-center justify-center text-[hsl(258_22%_50%)]">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading patients…
                </div>
              </div>
            ) : rosterError ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">{rosterError}</p>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-[hsl(258_22%_50%)]">
                <Users className="h-10 w-10 opacity-60" />
                <p className="text-sm">No patients found.</p>
                <p className="text-xs">Patients appear here once they have completed at least one appointment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoster.map((patient) => {
                  const initials = patient.patientName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("") || "PT";

                  const formattedTime = patient.lastAppointmentTime
                    ? new Date(patient.lastAppointmentTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })
                    : "Unknown";

                  return (
                    <div
                      key={patient.patientId}
                      className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-1 items-start gap-4">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-[hsl(258_46%_25%)]">{patient.patientName}</div>
                          <div className="text-xs text-[hsl(258_22%_50%)]">{patient.email}</div>
                          <div className="text-xs text-[hsl(258_22%_50%)]">{patient.phone}</div>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[hsl(258_22%_50%)]">
                            <span className="inline-flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Last visit: {formattedTime}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Status: <span className="font-medium capitalize text-[hsl(258_46%_25%)]">{patient.lastAppointmentStatus}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Total appointments: <span className="font-medium text-[hsl(258_46%_25%)]">{patient.totalAppointments}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleViewProfile(patient)}
                          disabled={loadingProfilePatientId === patient.patientId}
                        >
                          {loadingProfilePatientId === patient.patientId ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading…
                            </span>
                          ) : (
                            "View Profile"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_25%/0.9)] cursor-pointer"
                          onClick={() => handleViewAppointments(patient)}
                          disabled={loadingPatientId === patient.patientId}
                        >
                          {loadingPatientId === patient.patientId ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading…
                            </span>
                          ) : (
                            "View Appointments"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Appointment History
              </CardTitle>
              <CardDescription className="text-[hsl(258_22%_50%)]">Review completed and closed appointments for your patients.</CardDescription>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
                  <Input
                    placeholder="Search by patient, doctor, or note"
                    value={historySearchTerm}
                    onChange={(event) => setHistorySearchTerm(event.target.value)}
                    className="pl-9 h-9 text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {historyFilterOptions.map(({ key, label }) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`cursor-pointer border ${historyStatusFilter === key
                          ? "bg-[hsl(258_46%_25%)] text-white border-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.92)]"
                          : "text-[hsl(258_46%_25%)] border-[hsl(258_22%_65%)] hover:bg-purple-50"}
                      `}
                      onClick={() => setHistoryStatusFilter(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHistoryList ? (
              <div className="flex h-48 items-center justify-center text-[hsl(258_22%_50%)]">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading appointment history…
                </div>
              </div>
            ) : historyListError ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm text-center">{historyListError}</p>
              </div>
            ) : filteredHistoryAppointments.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-[hsl(258_22%_50%)]">
                <Clock className="h-8 w-8 opacity-50" />
                <p className="text-sm">No past appointments match the current filters.</p>
                <p className="text-xs">Adjust the status filter or search to see more results.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistoryAppointments.map((appointment) => {
                  const initials = getInitials(appointment.patientName);
                  const visitStart = appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt;
                  const visitDateLabel = formatDateShortFromISO(visitStart) || formatDateShortFromISO(appointment.requestedAt);
                  const visitTimeLabel =
                    formatTimeRange(appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt, appointment.bookedEndTime || appointment.proposedEndTime || null) ||
                    formatTime12h(appointment.time);
                  const statusTimestamp = appointment.bookedEndTime || appointment.bookedStartTime || appointment.proposedEndTime || appointment.proposedStartTime || appointment.requestedAt;
                  const statusDateLabel = statusTimestamp ? formatDateShortFromISO(statusTimestamp) : "-";

                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => handleAppointmentSelect(appointment)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-transform transition-colors hover:border-[hsl(258_46%_25%)] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 cursor-pointer"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-1 items-start gap-3 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[hsl(258_46%_25%)]">{appointment.patientName}</p>
                              <span className="text-xs text-[hsl(258_22%_50%)]">{appointment.patientEmail}</span>
                            </div>
                            <div className="text-xs text-[hsl(258_22%_50%)]">
                              Doctor: <span className="font-medium text-[hsl(258_46%_25%)]">{appointment.doctorName}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-[hsl(258_22%_50%)]">
                              <span>Visit: <span className="font-medium text-[hsl(258_46%_25%)]">{visitDateLabel}</span></span>
                              <span>Time: <span className="font-medium text-[hsl(258_46%_25%)]">{visitTimeLabel}</span></span>
                            </div>
                            <div className="min-w-0 space-y-2">
                              <div className="flex w-full items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5">
                                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-900" />
                                <span className="text-xs font-semibold text-amber-900 flex-shrink-0">Concern:</span>
                                <span className="flex-1 truncate text-xs text-amber-900">{appointment.concern || "General Consultation"}</span>
                              </div>
                              {appointment.doctorNote && (
                                <div className="flex w-full items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-[hsl(258_46%_25%)] shadow-sm">
                                  <NotebookPen className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs font-semibold flex-shrink-0">Note:</span>
                                  <span className="flex-1 truncate text-xs">{appointment.doctorNote}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`text-xs border ${getStatusColor(appointment.status)} flex-shrink-0`}>{getStatusDisplayLabel(appointment.status)}</Badge>
                          <span className="text-xs text-[hsl(258_22%_50%)]">Updated: <span className="font-medium text-[hsl(258_46%_25%)]">{statusDateLabel}</span></span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isPatientProfileOpen && profilePatientSummary && (
        <Dialog open={isPatientProfileOpen} onOpenChange={handleProfileOpenChange}>
          <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col bg-white shadow-lg">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-[hsl(258_46%_25%)]">
                <User className="h-5 w-5" />
                Patient Profile
              </DialogTitle>
              <DialogDescription className="text-[hsl(258_22%_50%)]">
                {patientProfileDetail?.fullName || profilePatientSummary.patientName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              {isLoadingPatientProfile ? (
                <div className="flex h-48 items-center justify-center text-[hsl(258_22%_50%)]">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading patient profile…
                  </div>
                </div>
              ) : patientProfileError ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                  <p className="text-sm text-center">{patientProfileError}</p>
                </div>
              ) : patientProfileDetail ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] font-semibold">
                            {getInitials(patientProfileDetail.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-[hsl(258_46%_25%)]">{patientProfileDetail.fullName}</h3>
                          <p className="text-xs text-[hsl(258_22%_50%)]">
                            Patient since {patientProfileDetail.createdAt ? formatDateShortFromISO(patientProfileDetail.createdAt) : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                          <span className="text-[hsl(258_46%_25%)]">{patientProfileDetail.email || "No email on file"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                          <span className="text-[hsl(258_46%_25%)]">{patientProfileDetail.phone || "No phone on file"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                          <span className="text-[hsl(258_46%_25%)]">{patientProfileDetail.address || "Address not provided"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)] font-medium">{patientProfileDetail.emergencyContactName || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)]">{patientProfileDetail.emergencyContactNumber || "Not provided"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Care Snapshot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-[hsl(258_22%_50%)]">Total Appointments</p>
                        <p className="mt-1 text-xl font-semibold text-[hsl(258_46%_25%)]">{profilePatientSummary.totalAppointments}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-[hsl(258_22%_50%)]">Last Status</p>
                        {profilePatientSummary.lastAppointmentStatus ? (
                          <Badge className={`mt-2 w-fit text-xs border ${getStatusColor(profilePatientSummary.lastAppointmentStatus as PatientAppointmentDetail["status"])}`}>
                            {getStatusDisplayLabel(profilePatientSummary.lastAppointmentStatus as PatientAppointmentDetail["status"])}
                          </Badge>
                        ) : (
                          <p className="mt-2 text-sm text-[hsl(258_22%_50%)]">No status recorded</p>
                        )}
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-[hsl(258_22%_50%)]">Last Visit</p>
                        <p className="mt-1 text-sm text-[hsl(258_46%_25%)]">
                          {profilePatientSummary.lastAppointmentTime
                            ? (() => {
                                const dateLabel = formatDateShortFromISO(profilePatientSummary.lastAppointmentTime);
                                const timeLabel = formatTime12hFromISO(profilePatientSummary.lastAppointmentTime);
                                return timeLabel && timeLabel !== "-" ? `${dateLabel} · ${timeLabel}` : dateLabel;
                              })()
                            : "No visits recorded"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-sm text-[hsl(258_22%_50%)] italic">No profile details available.</p>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" className="ml-auto cursor-pointer" onClick={() => handleProfileOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isAppointmentListOpen && selectedPatient && (
        <Dialog open={isAppointmentListOpen} onOpenChange={handleListOpenChange}>
          <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col bg-white shadow-lg">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-[hsl(258_46%_25%)]">
                <CalendarIcon className="h-5 w-5" />
                Select an Appointment
              </DialogTitle>
              <DialogDescription className="text-[hsl(258_22%_50%)]">
                {selectedPatient.patientName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              {isLoadingPatientAppointments ? (
                <div className="flex h-48 items-center justify-center text-[hsl(258_22%_50%)]">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading appointments…
                  </div>
                </div>
              ) : modalError ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                  <p className="text-sm text-center">{modalError}</p>
                </div>
              ) : patientAppointments.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-[hsl(258_22%_50%)]">
                  <CalendarIcon className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No appointments found for this patient.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map((appointment) => {
                    const referenceTime = appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt;
                    const dateLabel = referenceTime
                      ? new Date(referenceTime).toLocaleString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                      })
                      : formatDateShortFromISO(appointment.requestedAt);
                    const startTime = appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt;
                    const endTime = appointment.bookedEndTime || appointment.proposedEndTime || null;
                    const timeLabel = formatTimeRange(startTime, endTime) || formatTime12h(appointment.time);

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => handleAppointmentSelect(appointment)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-left shadow-sm transition-transform transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 hover:border-[hsl(258_46%_25%)] hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[hsl(258_46%_25%)]">{dateLabel}</p>
                            <p className="text-xs text-[hsl(258_22%_50%)]">Time: <span className="font-medium text-[hsl(258_46%_25%)]">{timeLabel}</span></p>
                            <div className="mt-2 flex w-full items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 min-w-0">
                              <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-900" />
                              <span className="text-xs font-semibold text-amber-900 flex-shrink-0">Concern:</span>
                              <span className="flex-1 truncate text-xs text-amber-900">
                                {appointment.concern || "General Consultation"}
                              </span>
                            </div>
                            {appointment.doctorNote && (
                              <div className="mt-2 flex w-full items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-[hsl(258_46%_25%)] shadow-sm min-w-0">
                                <NotebookPen className="h-3 w-3 flex-shrink-0" />
                                <span className="text-xs font-semibold flex-shrink-0">Note:</span>
                                <span className="flex-1 truncate text-xs">
                                  {appointment.doctorNote}
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge className={`text-xs ${getStatusColor(appointment.status)} border flex-shrink-0`}>{getStatusDisplayLabel(appointment.status)}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" className="ml-auto cursor-pointer" onClick={() => handleListOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isAppointmentDetailOpen && selectedAppointment && (
        <Dialog open={isAppointmentDetailOpen} onOpenChange={handleDetailOpenChange}>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col bg-white shadow-lg">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <DialogTitle className="flex items-center gap-2 text-[hsl(258_46%_25%)]">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedAppointment.patientName}'s Appointment
                  </DialogTitle>
                  <DialogDescription className="text-[hsl(258_22%_50%)]">{selectedAppointment.doctorName}</DialogDescription>
                </div>
                <Badge className={`text-xs ${getStatusColor(selectedAppointment.status)} border`}>
                  {getStatusDisplayLabel(selectedAppointment.status)}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] font-semibold">
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

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)] font-medium">{selectedAppointment.emergencyContactName || "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)] font-medium">{selectedAppointment.emergencyContactNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Appointment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Patient's Concern
                    </label>
                    <p className="text-amber-900 mt-1 text-sm">{selectedAppointment.concern || "No concern specified"}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Submitted On</label>
                      <p className="text-[hsl(258_46%_25%)]">{formatDateShortFromISO(selectedAppointment.requestedAt)}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Requested Date</label>
                        <p className="text-[hsl(258_46%_25%)]">
                          {(() => {
                            const localDate = selectedAppointment.date ? new Date(`${selectedAppointment.date}T00:00:00`) : null;
                            return localDate
                              ? localDate.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                              })
                              : "Unknown";
                          })()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Requested Time</label>
                        <p className="text-[hsl(258_46%_25%)]">
                          {(() => {
                            const start = selectedAppointment.bookedStartTime || selectedAppointment.proposedStartTime || selectedAppointment.requestedAt;
                            const end = selectedAppointment.bookedEndTime || selectedAppointment.proposedEndTime || null;
                            return formatTimeRange(start, end) || formatTime12h(selectedAppointment.time);
                          })()}
                        </p>
                      </div>
                    </div>

                    {selectedAppointment.status !== "requested" && (
                      <div>
                        <label className="text-sm font-medium text-[hsl(258_22%_50%)]">Duration</label>
                        <p className="text-[hsl(258_46%_25%)]">{selectedAppointment.duration}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Manage Doctor Note
                  </CardTitle>
                  <CardDescription>Add quick context for this patient. Patients never see this note.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={doctorNoteDraft}
                    onChange={(event) => {
                      setDoctorNoteDraft(event.target.value);
                      if (doctorNoteError) setDoctorNoteError(null);
                      setDoctorNoteSuccess(null);
                    }}
                    className="w-full min-h-[120px] rounded-md border border-purple-200 bg-white px-3 py-2 text-sm text-[hsl(258_46%_25%)] shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    placeholder="Type a quick reminder for the care team…"
                  />
                  {doctorNoteError && <p className="text-sm text-red-600">{doctorNoteError}</p>}
                  {doctorNoteSuccess && <p className="text-sm text-green-600">{doctorNoteSuccess}</p>}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedAppointment) {
                          setDoctorNoteDraft(selectedAppointment.doctorNote || "");
                          setDoctorNoteError(null);
                          setDoctorNoteSuccess(null);
                        }
                      }}
                      disabled={isSavingDoctorNote || doctorNoteDraft === (selectedAppointment?.doctorNote || "")}
                      className="text-[hsl(258_46%_25%)] hover:bg-purple-50"
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveDoctorNote}
                      disabled={isSavingDoctorNote || doctorNoteDraft === (selectedAppointment?.doctorNote || "")}
                      className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_28%)]"
                    >
                      {isSavingDoctorNote ? "Saving…" : "Save Note"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex h-24 items-center justify-center text-[hsl(258_22%_50%)]">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading history…
                    </div>
                  ) : selectedAppointment.statusHistory && selectedAppointment.statusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAppointment.statusHistory.map((history) => (
                        <div key={history.historyId} className="border-l-4 border-[hsl(258_46%_25%)] pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(() => {
                                switch (history.status) {
                                  case "completed":
                                    return "bg-green-100 text-green-800";
                                  case "rejected":
                                  case "cancelled":
                                    return "bg-red-100 text-red-800";
                                  case "ongoing":
                                    return "bg-blue-100 text-blue-800";
                                  case "arrived":
                                    return "bg-purple-100 text-purple-800";
                                  case "booked":
                                    return "bg-emerald-100 text-emerald-800";
                                  case "proposed":
                                    return "bg-amber-100 text-amber-800";
                                  default:
                                    return "bg-gray-100 text-gray-800";
                                }
                              })()}`}
                            >
                              {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                            </span>
                            <span className="text-xs text-[hsl(258_22%_50%)]">
                              {new Date(history.changedAt).toLocaleString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true
                              })}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-[hsl(258_46%_25%)] mt-1 italic">"{history.notes}"</p>
                          )}
                          {history.feedback && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Dentist/Staff Note:</p>
                              <p className="text-sm text-blue-800">{history.feedback}</p>
                            </div>
                          )}
                          {history.changedByName && (
                            <p className="text-xs text-[hsl(258_22%_50%)] mt-1">By: {history.changedByName}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[hsl(258_22%_50%)] italic">No status history available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" className="ml-auto cursor-pointer" onClick={() => handleDetailOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
