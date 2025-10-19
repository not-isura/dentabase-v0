"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Check, Clock, Plus, X, Stethoscope, Calendar, FileText } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import DoctorSelectionModal from './DoctorSelectionModal';
import ScheduleSelectionModal from './ScheduleSelectionModal';
import AppointmentConfirmationModal from './AppointmentConfirmationModal';

type StatusEntry = {
  date: string;
  time: string;
  status: string;
  description: string;
  relatedTime?: string; // Snapshot of appointment START time at this status
  relatedEndTime?: string; // Snapshot of appointment END time at this status
};

interface ProgressTrackerProps {
  steps: string[];
  currentStep: number;
  rejectedStepIndices?: number[];
}

interface StatusHistoryProps {
  history: StatusEntry[];
}

interface AppointmentCardProps {
  title: string;
  steps?: string[];
  currentStep?: number;
  history?: StatusEntry[];
  rejectedStepIndices?: number[];
  description?: string;
  canCreate?: boolean;
  onCreate?: () => void;
  milestoneMessages?: Record<string, string>;
  emptyStateMessage?: string;
  isLoading?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, currentStep, rejectedStepIndices = [] }) => {
  const totalSteps = steps.length;
  const normalizedStep = Math.max(0, Math.min(currentStep, totalSteps));
  const flowComplete = normalizedStep >= totalSteps;
  const rejectedSet = useMemo(() => new Set(rejectedStepIndices), [rejectedStepIndices]);

  return (
    <div className="w-full">
      <div className="mx-auto flex w-[80%] max-w-2xl items-center justify-between md:w-2/3">
        {steps.map((_, index) => {
          const isCompleted = normalizedStep > index;
          const isActive = !flowComplete && index === normalizedStep;
          const hasCompletedLeft = normalizedStep >= index;
          const hasCompletedRight = normalizedStep > index;
          const isRejected = rejectedSet.has(index);

          return (
            <div key={`tracker-circle-${index}`} className="relative flex flex-1 items-center justify-center">
              {index > 0 && (
                <>
                  <span className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-1/2 -translate-y-1/2 rounded-full bg-gray-300" />
                  {hasCompletedLeft && (
                    <span className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-1/2 -translate-y-1/2 rounded-full bg-[hsl(258_46%_25%)] transition-colors duration-300" />
                  )}
                </>
              )}
              {index < steps.length - 1 && (
                <>
                  <span className="pointer-events-none absolute right-0 top-1/2 h-[2px] w-1/2 -translate-y-1/2 rounded-full bg-gray-300" />
                  {hasCompletedRight && (
                    <span className="pointer-events-none absolute right-0 top-1/2 h-[2px] w-1/2 -translate-y-1/2 rounded-full bg-[hsl(258_46%_25%)] transition-colors duration-300" />
                  )}
                </>
              )}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-base font-semibold transition-colors duration-200 ${
                  isRejected
                    ? "border-red-500 bg-red-500 text-white"
                    : isCompleted || isActive
                      ? "border-[hsl(258_46%_25%)] bg-[hsl(258_46%_25%)] text-white"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {isRejected ? <X className="h-4 w-4" /> : isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 mx-auto flex w-[80%] max-w-2xl justify-between text-xs font-medium text-gray-500 md:w-2/3">
        {steps.map((label) => (
          <div key={label} className="flex flex-1 justify-center text-center">
            <span className="max-w-[7rem] text-xs md:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusHistory: React.FC<StatusHistoryProps> = ({ history }) => {
  return (
    <div className="space-y-3">
      {history.map((entry, index) => (
        <div
          key={`${entry.date}-${entry.time}-${index}`}
          className="rounded-lg border border-[hsl(258_46%_25%/0.1)] bg-[hsl(258_46%_98%)] p-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {entry.date}
              </span>
              <p className="mt-1 text-sm font-semibold text-[hsl(258_46%_25%)]">
                {entry.status}
              </p>
              <p className="text-sm text-[hsl(258_22%_45%)]">{entry.description}</p>
              {/* Show related appointment time if available */}
              {entry.relatedTime && (
                <p className="mt-2 text-xs text-[hsl(258_46%_25%)] bg-white border border-[hsl(258_46%_25%/0.2)] rounded px-2 py-1 inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">
                    {entry.status === 'Requested' ? 'Requested time:' : 'Appointment time:'}
                  </span> 
                  {entry.relatedTime}
                  {entry.relatedEndTime && (
                    <span> - {entry.relatedEndTime}</span>
                  )}
                </p>
              )}
            </div>
            <div className="hidden items-center gap-3 sm:flex sm:self-center">
              <span className="hidden h-10 w-px rounded-full bg-[hsl(258_46%_25%/0.12)] sm:block" aria-hidden="true" />
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[hsl(258_46%_25%)]">
                <Clock className="h-3.5 w-3.5" />
                <span>{entry.time}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 flex sm:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[hsl(258_46%_25%)]">
              <Clock className="h-3.5 w-3.5" />
              <span>{entry.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  title,
  steps,
  currentStep,
  history,
  rejectedStepIndices,
  description,
  canCreate = false,
  onCreate,
  milestoneMessages = {},
  emptyStateMessage = "No active appointment requests at the moment.",
  isLoading = false
}) => {
  const hasAppointment = Array.isArray(steps) && steps.length > 0 && typeof currentStep === "number";
  const normalizedSteps = hasAppointment ? (steps as string[]) : [];
  const normalizedHistory = hasAppointment ? (history ?? []) : [];
  const normalizedCurrentStep = hasAppointment ? (currentStep as number) : 0;
  const normalizedRejected = hasAppointment ? rejectedStepIndices ?? [] : [];
  const latestLabel = hasAppointment
    ? normalizedSteps[Math.min(normalizedCurrentStep, normalizedSteps.length - 1)] ?? normalizedSteps[0]
    : undefined;
  const latestMessage = latestLabel ? milestoneMessages[latestLabel] ?? milestoneMessages.default : undefined;

  return (
    <Card className="border border-[hsl(258_46%_25%/0.12)] shadow-sm">
      <CardContent className="space-y-6 pt-6">
        {hasAppointment ? (
          <>
            <ProgressTracker
              steps={normalizedSteps}
              currentStep={normalizedCurrentStep}
              rejectedStepIndices={normalizedRejected}
            />

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
                  Status History
                </h4>
              </div>
              <StatusHistory history={normalizedHistory} />
            </section>
          </>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md border border-dashed border-[hsl(258_46%_25%/0.2)] bg-[hsl(258_46%_98%)] p-6 text-center">
              {isLoading ? (
                <>
                  <div className="h-4 w-32 mx-auto bg-gray-200 rounded animate-pulse"></div>
                  <div className="mt-2 h-3 w-64 mx-auto bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)]">No Active Appointment</h4>
                  <p className="mt-2 text-sm text-[hsl(258_22%_45%)]">{emptyStateMessage}</p>
                  {canCreate && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        className="flex items-center gap-2 bg-[hsl(258_46%_25%)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onCreate}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                        Make an Appointment
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Appointment Summary Component
interface AppointmentSummaryProps {
  doctorName: string;
  doctorSpecialization: string;
  requestedStartTime: string;
  proposedStartTime?: string; // NEW: Proposed time from dentist
  proposedEndTime?: string; // Proposed end time from dentist
  bookedStartTime?: string; // Confirmed appointment start time
  bookedEndTime?: string; // Confirmed appointment end time
  status: string;
  concern: string;
  isLoading?: boolean;
  appointmentId?: string;
  onCancel?: () => void;
  onConfirm?: () => void; // NEW: Confirm appointment handler
}

const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  doctorName,
  doctorSpecialization,
  requestedStartTime,
  proposedStartTime,
  proposedEndTime,
  bookedStartTime,
  bookedEndTime,
  status,
  concern,
  isLoading = false,
  appointmentId,
  onCancel,
  onConfirm
}) => {
  // Format date and time for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = requestedStartTime 
    ? formatDateTime(requestedStartTime) 
    : { dateStr: '', timeStr: '' };

  // Status badge styling
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'requested':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'proposed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'booked':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'arrived':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'ongoing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-[hsl(258_46%_25%/0.12)] shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[hsl(258_46%_25%/0.12)] shadow-sm bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl text-[hsl(258_46%_25%)]">
              Appointment Summary
            </CardTitle>
            <CardDescription className="text-sm text-[hsl(258_22%_50%)]">
              Quick overview of your scheduled appointment
            </CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${getStatusColor(status)}`}>
            {status}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dentist Info */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Dentist
            </p>
            <p className="text-sm font-bold text-[hsl(258_46%_25%)]">
              {doctorName}
            </p>
            <p className="text-xs text-gray-600">
              {doctorSpecialization}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {status.toLowerCase() === 'proposed' ? 'Requested Time' : 'Scheduled For'}
            </p>
            <p className="text-sm font-bold text-[hsl(258_46%_25%)]">
              {dateStr}
            </p>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeStr}
              {/* Show end time for booked appointments */}
              {status.toLowerCase() === 'booked' && bookedEndTime && (() => {
                const endTime = new Date(bookedEndTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                return <span className="font-medium"> - {endTime}</span>;
              })()}
            </p>
          </div>
        </div>

        {/* Proposed Time - Only show when status is 'proposed' */}
        {status.toLowerCase() === 'proposed' && proposedStartTime && (() => {
          const { dateStr: propDateStr, timeStr: propTimeStr } = formatDateTime(proposedStartTime);
          
          // Check if proposed time matches requested time
          const timesMatch = requestedStartTime && proposedStartTime && 
            new Date(requestedStartTime).getTime() === new Date(proposedStartTime).getTime();
          
          const label = timesMatch ? 'Confirmed Time' : 'Proposed New Time';
          const message = timesMatch 
            ? 'Your requested time has been confirmed. Please confirm your appointment.'
            : 'The dentist has proposed an alternative time for your appointment.';
          
          // Format end time if available
          const propEndTimeStr = proposedEndTime ? new Date(proposedEndTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : null;
          
          // Different colors based on whether times match
          const bgColor = timesMatch ? 'bg-green-50' : 'bg-purple-50';
          const borderColor = timesMatch ? 'border-green-200' : 'border-purple-200';
          const iconBgColor = timesMatch ? 'bg-green-600' : 'bg-purple-600';
          const labelColor = timesMatch ? 'text-green-900' : 'text-purple-900';
          const dateColor = timesMatch ? 'text-green-900' : 'text-purple-900';
          const timeColor = timesMatch ? 'text-green-700' : 'text-purple-700';
          const messageColor = timesMatch ? 'text-green-600' : 'text-purple-600';
          
          return (
            <div className={`flex items-start gap-3 ${bgColor} border ${borderColor} rounded-lg p-3`}>
              <div className={`flex-shrink-0 w-10 h-10 ${iconBgColor} rounded-full flex items-center justify-center`}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className={`text-xs font-medium ${labelColor} uppercase tracking-wide`}>
                  {label}
                </p>
                <p className={`text-sm font-bold ${dateColor}`}>
                  {propDateStr}
                </p>
                <p className={`text-xs ${timeColor} flex items-center gap-1`}>
                  <Clock className="h-3 w-3" />
                  {propTimeStr}
                  {propEndTimeStr && (
                    <span className="font-medium"> - {propEndTimeStr}</span>
                  )}
                </p>
                <p className={`text-xs ${messageColor} mt-2`}>
                  {message}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Confirm Button - Only show when status is 'proposed' */}
        {status.toLowerCase() === 'proposed' && onConfirm && (() => {
          const timesMatch = requestedStartTime && proposedStartTime && 
            new Date(requestedStartTime).getTime() === new Date(proposedStartTime).getTime();
          
          const buttonText = timesMatch ? 'Confirm Appointment' : 'Accept Proposed Time';
          const buttonDescription = timesMatch 
            ? 'Click to confirm your appointment at your requested time'
            : 'Click to accept the dentist\'s proposed time';
          
          return (
            <div className="pt-2">
              <Button
                onClick={onConfirm}
                className="w-full bg-[hsl(258_46%_45%)] hover:bg-[hsl(258_46%_35%)] text-white font-semibold"
              >
                <Check className="h-4 w-4 mr-2" />
                {buttonText}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                {buttonDescription}
              </p>
            </div>
          );
        })()}

        {/* Concern */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Your Concern
            </p>
            <p className="text-sm text-[hsl(258_46%_25%)] mt-1 leading-relaxed">
              {concern}
            </p>
          </div>
        </div>

        {/* Cancel Button - Only show if appointment can be cancelled */}
        {status.toLowerCase() !== 'cancelled' && 
         status.toLowerCase() !== 'completed' && 
         status.toLowerCase() !== 'rejected' && 
         onCancel && (
          <div className="pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              Cancel Appointment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AppointmentsPatientPage() {
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<{ 
    id: string; 
    name: string;
    specialization: string;
    schedules: Array<{
      availabilityId: string;
      day: string;
      dayLabel: string;
      startTime: string;
      endTime: string;
    }>;
  } | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<{
    doctorId: string;
    date: string;
    time: string;
  } | null>(null);
  
  // Alert/notification state
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Patient info - fetch from database
  const [patientName, setPatientName] = useState<string>('Loading...');
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);

  // Active appointment state
  const [activeAppointment, setActiveAppointment] = useState<{
    steps: string[];
    currentStep: number;
    history: StatusEntry[];
    rejectedStepIndices?: number[];
    // Full appointment details for summary
    appointmentId?: string;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialization?: string;
    requestedStartTime?: string;
    proposedStartTime?: string; // NEW: Proposed time from dentist
    proposedEndTime?: string; // Proposed end time from dentist
    bookedStartTime?: string; // Confirmed appointment start time
    bookedEndTime?: string; // Confirmed appointment end time
    status?: string;
    concern?: string;
  } | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);

  // Fetch patient name on mount
  useEffect(() => {
    const fetchPatientName = async () => {
      try {
        const supabase = createClient();
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          setPatientName('Guest');
          setIsLoadingPatient(false);
          return;
        }

        // Get user profile from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, middle_name, last_name')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('User fetch error:', userError);
          setPatientName('Patient');
          setIsLoadingPatient(false);
          return;
        }

        // Format full name
        const middleInitial = userData.middle_name 
          ? `${userData.middle_name.charAt(0)}.` 
          : '';
        
        const fullName = [
          userData.first_name,
          middleInitial,
          userData.last_name
        ].filter(Boolean).join(' ').trim();

        setPatientName(fullName || 'Patient');
        setIsLoadingPatient(false);
      } catch (error) {
        console.error('Error fetching patient name:', error);
        setPatientName('Patient');
        setIsLoadingPatient(false);
      }
    };

    fetchPatientName();
  }, []);

  const milestoneMessages = {
    Requested: "Your appointment request has been sent.",
    "To Confirm": "Please review and confirm your appointment schedule.",
    Booked: "Your appointment is confirmed.",
    Arrived: "You have been marked as arrived at the clinic.",
    Ongoing: "Your appointment is currently ongoing.",
    Completed: "Your appointment is completed. Thank you!",
    default: "Keep track of your appointment steps here."
  };

  // Fetch active appointment from database
  const fetchActiveAppointment = async () => {
    try {
      setIsLoadingAppointment(true);
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      // Get user_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User fetch error:', userError);
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      // Get patient_id
      const { data: patientData, error: patientError } = await supabase
        .from('patient')
        .select('patient_id')
        .eq('user_id', userData.user_id)
        .single();

      if (patientError || !patientData) {
        console.error('Patient fetch error:', patientError);
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      // Fetch the most recent active appointment with doctor details
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_id (
            user_id,
            specialization
          )
        `)
        .eq('patient_id', patientData.patient_id)
        .in('status', ['requested', 'proposed', 'booked', 'arrived', 'ongoing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (appointmentError) {
        console.error('Appointment fetch error:', appointmentError);
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      if (!appointments || appointments.length === 0) {
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      const appointment = appointments[0];
      
      // Fetch doctor's name from users table
      let doctorName = 'Doctor';
      let doctorSpecialization = 'General Dentistry';
      
      if (appointment.doctor) {
        const { data: doctorUser, error: doctorError } = await supabase
          .from('users')
          .select('first_name, middle_name, last_name')
          .eq('user_id', appointment.doctor.user_id)
          .single();
        
        if (!doctorError && doctorUser) {
          const middleInitial = doctorUser.middle_name 
            ? `${doctorUser.middle_name.charAt(0)}.` 
            : '';
          doctorName = [
            doctorUser.first_name,
            middleInitial,
            doctorUser.last_name
          ].filter(Boolean).join(' ').trim();
        }
        
        doctorSpecialization = appointment.doctor.specialization || 'General Dentistry';
      }
      
      // Fetch status history from appointment_status_history table
      const { data: statusHistory, error: historyError } = await supabase
        .from('appointment_status_history')
        .select('status, changed_at, notes, changed_by_user_id, related_time, related_end_time')
        .eq('appointment_id', appointment.appointment_id)
        .order('changed_at', { ascending: false }); // Latest first

      if (historyError) {
        console.error('❌ History fetch error details:', {
          message: historyError.message,
          details: historyError.details,
          hint: historyError.hint,
          code: historyError.code,
          full: historyError,
          appointmentId: appointment.appointment_id
        });
      }
      
      console.log('📊 History fetch result:', {
        found: statusHistory?.length || 0,
        entries: statusHistory,
        appointmentId: appointment.appointment_id
      });

      // Map appointment data to progress tracker format
      const steps = ['Requested', 'To Confirm', 'Booked', 'Arrived', 'Ongoing', 'Completed'];
      const statusMap: Record<string, number> = {
        'requested': 0,
        'proposed': 1, // Maps to "To Confirm" in steps array
        'booked': 2,
        'arrived': 3,
        'ongoing': 4,
        'completed': 5,
      };
      
      const currentStep = statusMap[appointment.status.toLowerCase()] ?? 0;
      
      // Helper function to generate description based on status and times
      const generateDescription = (entry: any) => {
        // If it's the proposed status, check if times match
        if (entry.status === 'proposed') {
          const requestedTime = appointment.requested_start_time;
          const proposedTime = appointment.proposed_start_time;
          
          // If proposed_start_time is null, it means dentist hasn't set a specific time yet
          if (!proposedTime) {
            return 'The dentist is reviewing your appointment request.';
          }
          
          // If times are the same, dentist confirmed the requested time
          if (requestedTime && proposedTime && 
              new Date(requestedTime).getTime() === new Date(proposedTime).getTime()) {
            return 'Your requested time has been confirmed. Please confirm your appointment.';
          } else {
            // Times are different, dentist proposed alternative
            return 'The dentist has proposed an alternative time for your appointment. Please review and confirm.';
          }
        }
        
        // For other statuses, use notes or default
        return entry.notes || `Status changed to ${entry.status}`;
      };
      
      // Convert database history to UI format
      const history: StatusEntry[] = statusHistory && statusHistory.length > 0
        ? statusHistory.map(entry => {
            const generatedDesc = generateDescription(entry);
            return {
              date: new Date(entry.changed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              time: new Date(entry.changed_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              status: entry.status === 'proposed' 
                ? 'To Confirm'  // Change "Proposed" to "To Confirm" in history display
                : entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
              description: generatedDesc,
              relatedTime: entry.related_time ? new Date(entry.related_time).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : undefined,
              relatedEndTime: entry.related_end_time ? new Date(entry.related_end_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : undefined
            };
          })
        : [
            {
              date: new Date(appointment.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              time: new Date(appointment.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              status: 'Requested',
              description: 'Initial appointment request',
              relatedTime: appointment.requested_start_time ? new Date(appointment.requested_start_time).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : undefined,
              // No relatedEndTime for requested status - clinic decides duration
              relatedEndTime: undefined
            }
          ];

      setActiveAppointment({
        steps,
        currentStep,
        history,
        rejectedStepIndices: [],
        // Store full appointment details
        appointmentId: appointment.appointment_id,
        doctorId: appointment.doctor_id,
        doctorName,
        doctorSpecialization,
        requestedStartTime: appointment.requested_start_time,
        proposedStartTime: appointment.proposed_start_time, // From appointments table
        proposedEndTime: appointment.proposed_end_time, // Proposed end time from dentist
        bookedStartTime: appointment.booked_start_time, // Confirmed appointment start
        bookedEndTime: appointment.booked_end_time, // Confirmed appointment end
        status: appointment.status,
        concern: appointment.concern
      });
      
      setIsLoadingAppointment(false);
    } catch (error) {
      console.error('Error fetching active appointment:', error);
      setActiveAppointment(null);
      setIsLoadingAppointment(false);
    }
  };

  // Fetch active appointment on mount
  useEffect(() => {
    fetchActiveAppointment();
  }, []);

  const appointmentCardData = activeAppointment
    ? {
        steps: activeAppointment.steps,
        currentStep: activeAppointment.currentStep,
        history: activeAppointment.history,
        rejectedStepIndices: activeAppointment.rejectedStepIndices
      }
    : {};

  const handleOpenModal = () => {
    // Enforce strict policy: only 1 active appointment at a time
    if (activeAppointment) {
      setAlert({
        show: true,
        variant: 'error',
        message: 'You already have an active appointment. Please wait for it to be completed or cancelled before booking a new one.'
      });
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setAlert(null);
      }, 5000);
      
      return;
    }
    
    setIsDoctorModalOpen(true);
  };

  const handleDoctorSelect = (doctorId: string, doctorName: string, specialization: string, schedules: Array<{
    availabilityId: string;
    day: string;
    dayLabel: string;
    startTime: string;
    endTime: string;
  }>) => {
    console.log('Selected doctor:', doctorId, doctorName, specialization);
    setSelectedDoctor({ id: doctorId, name: doctorName, specialization, schedules });
    setIsDoctorModalOpen(false);
    setIsScheduleModalOpen(true);
  };

  const handleBackToDoctor = () => {
    setIsScheduleModalOpen(false);
    setIsDoctorModalOpen(true);
  };

  const handleScheduleSelect = (scheduleData: any) => {
    console.log('Selected schedule:', scheduleData);
    setSelectedSchedule(scheduleData);
    setIsScheduleModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  const handleBackToSchedule = () => {
    setIsConfirmationModalOpen(false);
    setIsScheduleModalOpen(true);
  };

  const handleConfirmAppointment = async (concern: string) => {
    if (!selectedDoctor || !selectedSchedule) return;

    try {
      const supabase = createClient();

      // 1. Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        setAlert({
          show: true,
          variant: 'error',
          message: 'You must be logged in to book an appointment.'
        });
        return;
      }

      // 2. First, get the user_id from the users table using auth_id
      console.log('🔍 Looking up user with auth_id:', user.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('❌ User lookup error:', userError);
        setAlert({
          show: true,
          variant: 'error',
          message: 'Could not find your user profile. Please contact support.'
        });
        return;
      }

      console.log('✅ Found user_id:', userData.user_id);

      // 3. Now get patient_id from the patient table using user_id
      const { data: patientData, error: patientError } = await supabase
        .from('patient')
        .select('patient_id')
        .eq('user_id', userData.user_id)
        .single();

      if (patientError || !patientData) {
        console.error('❌ Patient lookup error:', patientError);
        console.log('📋 Debug info:', {
          auth_id: user.id,
          user_id: userData.user_id,
          error: patientError
        });
        setAlert({
          show: true,
          variant: 'error',
          message: 'Could not find your patient profile. Please contact support.'
        });
        return;
      }

      console.log('✅ Found patient_id:', patientData.patient_id);

      // 4. Construct the full timestamp for requested_start_time with timezone
      // The user selected time is in their LOCAL timezone (Philippines = UTC+8)
      // Format: YYYY-MM-DDTHH:MM:SS+08:00 (explicit timezone offset)
      const requestedStartTime = `${selectedSchedule.date}T${selectedSchedule.time}:00+08:00`;

      console.log('📝 Submitting appointment:', {
        patientId: patientData.patient_id,
        doctorId: selectedDoctor.id,
        localTime: `${selectedSchedule.date} ${selectedSchedule.time}`,
        requestedStartTime,
        concern,
      });

      // 5. Insert appointment into database
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientData.patient_id,
          doctor_id: selectedDoctor.id,
          requested_start_time: requestedStartTime,
          status: 'requested',
          concern: concern.trim(),
        });

      if (insertError) {
        console.error('❌ Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          full: insertError
        });
        throw insertError;
      }

      // 5. Success - close modals and reset state
      console.log('✅ Appointment request submitted successfully!');
      
      setAlert({
        show: true,
        variant: 'success',
        message: 'Appointment request submitted successfully! The clinic will review and confirm your appointment.'
      });
      
      // 6. Refresh the appointment list to show the newly created appointment
      await fetchActiveAppointment();
      
      setIsConfirmationModalOpen(false);
      setSelectedDoctor(null);
      setSelectedSchedule(null);
      
      // Auto-dismiss alert after 5 seconds
      setTimeout(() => {
        setAlert(null);
      }, 5000);
      
    } catch (error: any) {
      console.error('❌ Error submitting appointment:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
        full: error
      });
      setAlert({
        show: true,
        variant: 'error',
        message: `Failed to submit appointment request. ${error?.message || 'Please try again.'}`
      });
      
      // Auto-dismiss alert after 5 seconds
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  };

  const handleCancelAppointment = async () => {
    if (!activeAppointment?.appointmentId) return;

    // Confirm cancellation
    if (!confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();

      // Update appointment status to cancelled
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('appointment_id', activeAppointment.appointmentId);

      if (error) {
        console.error('Cancel error:', error);
        throw error;
      }

      setAlert({
        show: true,
        variant: 'success',
        message: 'Appointment cancelled successfully.'
      });

      // Refresh to update UI (will show as cancelled or remove from active)
      await fetchActiveAppointment();

      // Auto-dismiss
      setTimeout(() => {
        setAlert(null);
      }, 5000);

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setAlert({
        show: true,
        variant: 'error',
        message: 'Failed to cancel appointment. Please try again.'
      });

      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  };

  const handleAcceptProposedAppointment = async () => {
    if (!activeAppointment?.appointmentId) return;

    try {
      const supabase = createClient();

      // First, fetch the current appointment to get proposed_end_time
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select('proposed_start_time, proposed_end_time')
        .eq('appointment_id', activeAppointment.appointmentId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      // When patient confirms, update status to 'booked'
      // Copy BOTH proposed_start_time AND proposed_end_time to booked times
      const updateData: any = { 
        status: 'booked',
        booked_start_time: appointmentData.proposed_start_time,
        booked_end_time: appointmentData.proposed_end_time
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('appointment_id', activeAppointment.appointmentId);

      if (error) {
        console.error('Confirm error:', error);
        throw error;
      }

      setAlert({
        show: true,
        variant: 'success',
        message: 'Appointment confirmed successfully! See you soon.'
      });

      // Refresh to update UI
      await fetchActiveAppointment();

      // Auto-dismiss
      setTimeout(() => {
        setAlert(null);
      }, 5000);

    } catch (error) {
      console.error('Error confirming appointment:', error);
      setAlert({
        show: true,
        variant: 'error',
        message: 'Failed to confirm appointment. Please try again.'
      });

      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alert Notification */}
      {alert?.show && (
        <Alert variant={alert.variant}>
          {alert.message}
        </Alert>
      )}

      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Patient Appointments</h2>
        <p className="text-[hsl(258_22%_50%)]">
          Review the status of your latest appointment activity.
        </p>
      </header>

      {/* Appointment Summary - Only show when there's an active appointment */}
      {activeAppointment && activeAppointment.doctorName && (
        <AppointmentSummary
          doctorName={activeAppointment.doctorName}
          doctorSpecialization={activeAppointment.doctorSpecialization || 'General Dentistry'}
          requestedStartTime={activeAppointment.requestedStartTime || ''}
          proposedStartTime={activeAppointment.proposedStartTime}
          proposedEndTime={activeAppointment.proposedEndTime}
          bookedStartTime={activeAppointment.bookedStartTime}
          bookedEndTime={activeAppointment.bookedEndTime}
          status={activeAppointment.status || 'requested'}
          concern={activeAppointment.concern || 'No concern specified'}
          isLoading={isLoadingAppointment}
          appointmentId={activeAppointment.appointmentId}
          onCancel={handleCancelAppointment}
          onConfirm={handleAcceptProposedAppointment}
        />
      )}

      <AppointmentCard
        title="Upcoming Appointment"
        {...appointmentCardData}
        milestoneMessages={milestoneMessages}
        canCreate
        onCreate={handleOpenModal}
        emptyStateMessage="You don't have an active appointment request. Start a new one to secure your slot."
        isLoading={isLoadingAppointment}
      />

      <DoctorSelectionModal
        open={isDoctorModalOpen}
        onOpenChange={setIsDoctorModalOpen}
        onDoctorSelect={handleDoctorSelect}
      />

      {selectedDoctor && (
        <ScheduleSelectionModal
          open={isScheduleModalOpen}
          onOpenChange={setIsScheduleModalOpen}
          doctorId={selectedDoctor.id}
          doctorName={selectedDoctor.name}
          doctorSchedules={selectedDoctor.schedules}
          onBack={handleBackToDoctor}
          onScheduleSelect={handleScheduleSelect}
        />
      )}

      {selectedDoctor && selectedSchedule && (
        <AppointmentConfirmationModal
          open={isConfirmationModalOpen}
          onOpenChange={setIsConfirmationModalOpen}
          doctorId={selectedDoctor.id}
          doctorName={selectedDoctor.name}
          doctorSpecialization={selectedDoctor.specialization}
          patientName={patientName}
          appointmentDate={selectedSchedule.date}
          appointmentTime={selectedSchedule.time}
          onBack={handleBackToSchedule}
          onConfirm={handleConfirmAppointment}
        />
      )}
    </div>
  );
}
