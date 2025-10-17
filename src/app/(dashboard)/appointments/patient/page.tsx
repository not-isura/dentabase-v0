"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Plus, X } from "lucide-react";
import DoctorSelectionModal from "./DoctorSelectionModal";
import ScheduleSelectionModal from "./ScheduleSelectionModal";

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
  const [selectedDoctor, setSelectedDoctor] = useState<{ 
    id: string; 
    name: string;
    schedules: Array<{
      availabilityId: string;
      day: string;
      dayLabel: string;
      startTime: string;
      endTime: string;
    }>;
  } | null>(null);

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

  const handleDoctorSelect = (doctorId: string, doctorName: string, schedules: Array<{
    availabilityId: string;
    day: string;
    dayLabel: string;
    startTime: string;
    endTime: string;
  }>) => {
    console.log('Selected doctor:', doctorId, doctorName);
    setSelectedDoctor({ id: doctorId, name: doctorName, schedules });
    setIsDoctorModalOpen(false);
    setIsScheduleModalOpen(true);
  };

  const handleBackToDoctor = () => {
    setIsScheduleModalOpen(false);
    setIsDoctorModalOpen(true);
  };

  const handleScheduleSelect = (scheduleData: any) => {
    console.log('Selected schedule:', scheduleData);
    // TODO: Implement final appointment confirmation logic
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-8">
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
    </div>
  );
}
