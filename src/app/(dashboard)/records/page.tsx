"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CalendarIcon,
  Clock,
  Loader2,
  MessageCircle,
  Search,
  Stethoscope
} from "lucide-react";

type HistoryStatus = "requested" | "proposed" | "booked" | "arrived" | "ongoing" | "completed" | "cancelled" | "rejected";

interface AppointmentHistoryEntry {
  historyId: string;
  status: string;
  changedAt: string;
  notes?: string | null;
  feedback?: string | null;
  changedByName?: string;
  changedByRole?: string;
}

interface PatientAppointmentRecord {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorInitials: string;
  status: HistoryStatus;
  concern?: string | null;
  requestedAt?: string;
  updatedAt?: string | null;
  proposedStartTime?: string | null;
  proposedEndTime?: string | null;
  bookedStartTime?: string | null;
  bookedEndTime?: string | null;
  statusHistory?: AppointmentHistoryEntry[];
}

function getStatusColor(status: HistoryStatus) {
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

function getStatusDisplayLabel(status: HistoryStatus) {
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

function formatTime12hFromISO(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start) return "";
  const startLabel = formatTime12hFromISO(start);
  if (!end) return startLabel;
  const endLabel = formatTime12hFromISO(end);
  return `${startLabel} - ${endLabel}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function transformAppointmentRecord(apt: any): PatientAppointmentRecord {
  const doctorUserRaw = apt.doctors?.users;
  const doctorUser = Array.isArray(doctorUserRaw) ? doctorUserRaw[0] : doctorUserRaw;
  const doctorName = doctorUser
    ? `Dr. ${[doctorUser.first_name, doctorUser.last_name].filter(Boolean).join(" ") || "Unknown"}`
    : "Dr. Unknown";

  return {
    id: apt.appointment_id,
    doctorId: apt.doctor_id,
    doctorName,
    doctorInitials: getInitials(doctorName.replace(/^Dr\.\s*/, "")),
    status: apt.status,
    concern: apt.concern || "",
    requestedAt: apt.requested_start_time || apt.created_at,
    updatedAt: apt.updated_at || null,
    proposedStartTime: apt.proposed_start_time,
    proposedEndTime: apt.proposed_end_time,
    bookedStartTime: apt.booked_start_time,
    bookedEndTime: apt.booked_end_time,
    statusHistory: []
  } satisfies PatientAppointmentRecord;
}

export default function RecordsPage() {
  const [appointments, setAppointments] = useState<PatientAppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointmentRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    void loadPatientHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPatientHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error while loading records:", authError);
        setError("Authentication failed. Please try again.");
        return;
      }

      if (!user) {
        setError("Not authenticated.");
        return;
      }

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userRecord) {
        console.error("Failed to load user record for patient:", userError);
        setError("Unable to load your account details.");
        return;
      }

      const { data: patientRecord, error: patientError } = await supabase
        .from("patient")
        .select("patient_id")
        .eq("user_id", userRecord.user_id)
        .single();

      if (patientError || !patientRecord) {
        console.error("Failed to load patient profile:", patientError);
        setError("No patient record found for this account.");
        return;
      }

      const nowIso = new Date().toISOString();
      const historyStatuses: HistoryStatus[] = ["completed", "cancelled", "rejected", "booked", "arrived", "ongoing"];

      let query = supabase
        .from("appointments")
        .select(
          `
            appointment_id,
            doctor_id,
            status,
            concern,
            requested_start_time,
            proposed_start_time,
            proposed_end_time,
            booked_start_time,
            booked_end_time,
            created_at,
            updated_at,
            doctors (
              users (
                first_name,
                middle_name,
                last_name
              )
            )
          `
        )
        .eq("patient_id", patientRecord.patient_id)
        .in("status", historyStatuses)
        .order("requested_start_time", { ascending: false })
        .limit(100);

      query = query.or(
        `and(booked_start_time.not.is.null,booked_start_time.lt.${nowIso}),and(booked_start_time.is.null,proposed_start_time.not.is.null,proposed_start_time.lt.${nowIso}),and(booked_start_time.is.null,proposed_start_time.is.null,requested_start_time.lt.${nowIso})`
      );

      const { data, error: appointmentsError } = await query;

      if (appointmentsError) {
        console.error("Appointments history query failed:", appointmentsError);
        setError("Failed to load your appointment history.");
        setAppointments([]);
        return;
      }

      const transformed = (data || []).map((apt: any) => transformAppointmentRecord(apt));
      setAppointments(transformed);
    } catch (error) {
      console.error("Unexpected error loading patient records:", error);
      setError("An unexpected error occurred while loading your records.");
    } finally {
      setIsLoading(false);
    }
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
        console.error("Failed to load appointment history for record view:", error);
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
      console.error("Unexpected error loading appointment history for patient:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectAppointment = (appointment: PatientAppointmentRecord) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
    void loadAppointmentHistory(appointment.id);
  };

  const handleDetailOpenChange = (open: boolean) => {
    if (!open) {
      setIsDetailOpen(false);
      setSelectedAppointment(null);
      setIsLoadingHistory(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "all" ? true : appointment.status === statusFilter;

      if (!matchesStatus) return false;

      if (!normalizedTerm) return true;

      const haystack = [
        appointment.doctorName,
        appointment.concern || "",
        formatDateShortFromISO(appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt || ""),
        formatTimeRange(appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt, appointment.bookedEndTime || appointment.proposedEndTime || null)
      ];

      return haystack.some((value) => value.toLowerCase().includes(normalizedTerm));
    });
  }, [appointments, searchTerm, statusFilter]);

  const statusFilters: Array<{ key: "all" | "completed" | "cancelled" | "rejected"; label: string }> = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "rejected", label: "Rejected" }
  ];

  const renderTimeLabel = (appointment: PatientAppointmentRecord) => {
    const start = appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt;
    const end = appointment.bookedEndTime || appointment.proposedEndTime || null;
    return formatTimeRange(start, end);
  };

  return (
    <div className="space-y-6">
      <div>
  <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Appointment History</h2>
  <p className="text-[hsl(258_22%_50%)]">Review past visits, stated concerns, and status updates for your care.</p>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Past Appointments
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Only visits that have already happened are listed here with their outcomes.
          </CardDescription>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
              <Input
                placeholder="Search by doctor, concern, or date"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9 h-9 text-[hsl(258_46%_25%)] placeholder:text-[hsl(258_22%_50%)]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusFilters.map(({ key, label }) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={`cursor-pointer border ${statusFilter === key
                      ? "bg-[hsl(258_46%_25%)] text-white border-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.92)]"
                      : "text-[hsl(258_46%_25%)] border-[hsl(258_22%_65%)] hover:bg-purple-50"}
                  `}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-[hsl(258_22%_50%)]">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your appointments…
              </div>
            </div>
          ) : error ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm text-center">{error}</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-[hsl(258_22%_50%)]">
              <CalendarIcon className="h-8 w-8 opacity-50" />
              <p className="text-sm">No past appointments match the current filters.</p>
              <p className="text-xs">Adjust the filters or check back after your next visit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => {
                const visitDateLabel = formatDateShortFromISO(
                  appointment.bookedStartTime || appointment.proposedStartTime || appointment.requestedAt
                );
                const visitTimeLabel = renderTimeLabel(appointment) || "";
                const statusTimestamp =
                  appointment.updatedAt ||
                  appointment.bookedEndTime ||
                  appointment.bookedStartTime ||
                  appointment.proposedEndTime ||
                  appointment.proposedStartTime ||
                  appointment.requestedAt;
                const statusDateLabel = statusTimestamp ? formatDateShortFromISO(statusTimestamp) : "-";

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => handleSelectAppointment(appointment)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-transform transition-colors hover:border-[hsl(258_46%_25%)] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 cursor-pointer"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-1 items-start gap-3 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] font-semibold">
                            {appointment.doctorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[hsl(258_46%_25%)]">{appointment.doctorName}</p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
                              <Stethoscope className="h-3 w-3" />
                              Your Care Team
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-[hsl(258_22%_50%)]">
                            <span>Visit: <span className="font-medium text-[hsl(258_46%_25%)]">{visitDateLabel}</span></span>
                            {visitTimeLabel && (
                              <span>Time: <span className="font-medium text-[hsl(258_46%_25%)]">{visitTimeLabel}</span></span>
                            )}
                          </div>
                          <div className="flex w-full items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5">
                            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-900" />
                            <span className="text-xs font-semibold text-amber-900 flex-shrink-0">Concern:</span>
                            <span className="flex-1 truncate text-xs text-amber-900">{appointment.concern || "General consultation"}</span>
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

      {isDetailOpen && selectedAppointment && (
        <Dialog open={isDetailOpen} onOpenChange={handleDetailOpenChange}>
          <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col bg-white shadow-lg">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <DialogTitle className="flex items-center gap-2 text-[hsl(258_46%_25%)]">
                    <CalendarIcon className="h-5 w-5" />
                    Visit Details
                  </DialogTitle>
                  <DialogDescription className="text-[hsl(258_22%_50%)]">{selectedAppointment.doctorName}</DialogDescription>
                </div>
                <Badge className={`text-xs border ${getStatusColor(selectedAppointment.status)} flex-shrink-0`}>
                  {getStatusDisplayLabel(selectedAppointment.status)}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Care Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] font-semibold">
                      {selectedAppointment.doctorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[hsl(258_46%_25%)]">{selectedAppointment.doctorName}</p>
                    <p className="text-xs text-[hsl(258_22%_50%)]">Dentist</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Appointment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[hsl(258_46%_25%)]">
                  <div>
                    <span className="text-[hsl(258_22%_50%)]">Date:</span>
                    <p className="font-medium">{formatDateShortFromISO(selectedAppointment.bookedStartTime || selectedAppointment.proposedStartTime || selectedAppointment.requestedAt)}</p>
                  </div>
                  <div>
                    <span className="text-[hsl(258_22%_50%)]">Time:</span>
                    <p className="font-medium">{renderTimeLabel(selectedAppointment) || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[hsl(258_22%_50%)]">Concern:</span>
                    <p className="font-medium">{selectedAppointment.concern || "General consultation"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileTimelineIcon />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex h-24 items-center justify-center text-[hsl(258_22%_50%)]">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading status history…
                    </div>
                  ) : selectedAppointment.statusHistory && selectedAppointment.statusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAppointment.statusHistory.map((history) => (
                        <div key={history.historyId} className="border-l-4 border-[hsl(258_46%_25%)] pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-[hsl(258_46%_25%)]">
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
                            <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Team Feedback:</p>
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
                    <p className="text-sm text-[hsl(258_22%_50%)] italic">No history updates recorded.</p>
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

function FileTimelineIcon() {
  return (
    <svg
      className="h-4 w-4 text-[hsl(258_46%_25%)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M16 13h-4l-1.5 3L9 11l-1 2H6" />
    </svg>
  );
}
