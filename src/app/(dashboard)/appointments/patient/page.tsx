"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Check, Clock, Plus, X } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import DoctorSelectionModal from './DoctorSelectionModal';
import ScheduleSelectionModal from './ScheduleSelectionModal';
import AppointmentConfirmationModal from './AppointmentConfirmationModal';

type StatusEntry = {
  date: string;
  time: string;
  status: string;
  description: string;
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
  emptyStateMessage = "No active appointment requests at the moment."
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
      <CardHeader className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="text-left">
          <CardTitle className="text-xl text-[hsl(258_46%_25%)]">{title}</CardTitle>
          <CardDescription className="text-sm text-[hsl(258_22%_50%)]">
            {description ?? "Keep an eye on every milestone of your appointment request."}
          </CardDescription>
          {latestMessage && (
            <p className="mt-3 text-sm text-[hsl(258_22%_40%)]">
              {latestMessage}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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

            <p className="text-xs text-gray-500">
              {/* TODO: Replace with real timestamps from Supabase when backend is connected */}
              Timestamps and statuses are mock data for UI preview purposes.
            </p>
          </>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md border border-dashed border-[hsl(258_46%_25%/0.2)] bg-[hsl(258_46%_98%)] p-6 text-center">
              <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)]">No Active Appointment</h4>
              <p className="mt-2 text-sm text-[hsl(258_22%_45%)]">{emptyStateMessage}</p>
              {canCreate && (
                <div className="mt-4 flex justify-center">
                  <Button
                    className="flex items-center gap-2 bg-[hsl(258_46%_25%)] text-white"
                    onClick={onCreate}
                  >
                    <Plus className="h-4 w-4" />
                    Make an Appointment
                  </Button>
                </div>
              )}
            </div>
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
    Proposed: "The clinic has proposed a new schedule.",
    Booked: "Your appointment is confirmed.",
    Arrived: "You have been marked as arrived at the clinic.",
    Ongoing: "Your appointment is currently ongoing.",
    Completed: "Your appointment is completed. Thank you!",
    default: "Keep track of your appointment steps here."
  };

  // Placeholder: set to null to mimic no active appointment session
  const activeAppointment = null as {
    steps: string[];
    currentStep: number;
    history: StatusEntry[];
    rejectedStepIndices?: number[];
  } | null;

  const appointmentCardData = activeAppointment
    ? {
        steps: activeAppointment.steps,
        currentStep: activeAppointment.currentStep,
        history: activeAppointment.history,
        rejectedStepIndices: activeAppointment.rejectedStepIndices
      }
    : {};

  const handleOpenModal = () => {
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
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // 5. Success - close modals and reset state
      console.log('✅ Appointment request submitted successfully!');
      
      setAlert({
        show: true,
        variant: 'success',
        message: 'Appointment request submitted successfully! The clinic will review and confirm your appointment.'
      });
      
      setIsConfirmationModalOpen(false);
      setSelectedDoctor(null);
      setSelectedSchedule(null);
      
      // Auto-dismiss alert after 5 seconds
      setTimeout(() => {
        setAlert(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setAlert({
        show: true,
        variant: 'error',
        message: 'Failed to submit appointment request. Please try again.'
      });
      
      // Auto-dismiss alert after 5 seconds
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

      <AppointmentCard
        title="Upcoming Appointment"
        {...appointmentCardData}
        milestoneMessages={milestoneMessages}
        canCreate
        onCreate={handleOpenModal}
        emptyStateMessage="You don't have an active appointment request. Start a new one to secure your slot."
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
