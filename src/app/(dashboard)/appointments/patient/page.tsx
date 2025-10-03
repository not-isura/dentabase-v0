"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plus, X } from "lucide-react";

type StatusEntry = {
  date: string;
  time: string;
  description: string;
};

type StageState = {
  currentStep: number;
  history: StatusEntry[];
  rejectedStepIndices?: number[];
};

interface ProgressTrackerProps {
  steps: string[];
  currentStep: number;
  rejectedStepIndices?: number[];
}

interface StatusHistoryProps {
  history: StatusEntry[];
}

interface SimulateButtonProps {
  onClick: () => void;
  label?: string;
}

interface AppointmentCardProps {
  title: string;
  feedbackLabel: string;
  initialStage: number;
  stages: StageState[];
  simulateLabel?: string;
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
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{entry.date}</span>
            <span>{entry.time}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-[hsl(258_46%_25%)]">
            {entry.description}
          </p>
        </div>
      ))}
    </div>
  );
};

const SimulateButton: React.FC<SimulateButtonProps> = ({ onClick, label = "Simulate Progression" }) => (
  <Button
    variant="outline"
    className="cursor-pointer border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
    onClick={onClick}
  >
    {label}
  </Button>
);

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  title,
  feedbackLabel,
  initialStage,
  stages,
  simulateLabel
}) => {
  const safeInitialIndex = Math.min(Math.max(initialStage, 0), Math.max(stages.length - 1, 0));
  const [stageIndex, setStageIndex] = useState(safeInitialIndex);
  const startingStage = stages[safeInitialIndex] ?? stages[0];
  const [currentStep, setCurrentStep] = useState(startingStage.currentStep);
  const [history, setHistory] = useState<StatusEntry[]>(startingStage.history);
  const [rejectedSteps, setRejectedSteps] = useState<number[]>(startingStage.rejectedStepIndices ?? []);

  const steps = useMemo(
    () => ["Request Sent", "Pending", feedbackLabel, "Completed"],
    [feedbackLabel]
  );
  const isAppointmentComplete = currentStep >= steps.length;

  const handleSimulate = () => {
    const nextStageIndex = (stageIndex + 1) % stages.length;
    const nextStage = stages[nextStageIndex];

    setStageIndex(nextStageIndex);
    setCurrentStep(nextStage.currentStep);
    setHistory(nextStage.history);
    setRejectedSteps(nextStage.rejectedStepIndices ?? []);
    // TODO: Replace this local update with Supabase API call
    // await supabase.from("appointments").update({ status: newStatus }).eq("id", appointmentId);
  };

  return (
    <Card className="border border-[hsl(258_46%_25%/0.12)] shadow-sm">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl text-[hsl(258_46%_25%)]">{title}</CardTitle>
          <CardDescription className="text-sm text-[hsl(258_22%_50%)]">
            Practice-only demo showcasing appointment lifecycle
          </CardDescription>
        </div>
        <Button
          className="flex items-center gap-2 bg-[hsl(258_46%_25%)] text-white"
          disabled={!isAppointmentComplete}
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProgressTracker
          steps={steps}
          currentStep={currentStep}
          rejectedStepIndices={rejectedSteps}
        />

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
              Status History
            </h4>
            <SimulateButton onClick={handleSimulate} label={simulateLabel} />
          </div>
          <StatusHistory history={history} />
        </section>

        <p className="text-xs text-gray-500">
          {/* TODO: Replace with real timestamps from Supabase when backend is connected */}
          Timestamps and statuses are mock data for UI preview purposes.
        </p>
      </CardContent>
    </Card>
  );
};

export default function AppointmentsPatientPage() {
  const approvedStages: StageState[] = [
    {
      currentStep: 1,
      history: [
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Pending Confirmation" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent" }
      ]
    },
    {
      currentStep: 2,
      history: [
        { date: "Mar 11, 2025", time: "8:00 AM", description: "Request Approved" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Pending Confirmation" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent" }
      ]
    },
    {
      currentStep: 2,
      history: [
        { date: "Mar 12, 2025", time: "6:40 AM", description: "Marked as Arrived" },
        { date: "Mar 11, 2025", time: "8:00 AM", description: "Request Approved" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Pending Confirmation" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent" }
      ]
    },
    {
      currentStep: 3,
      history: [
        { date: "Mar 12, 2025", time: "7:00 AM", description: "In Progress" },
        { date: "Mar 12, 2025", time: "6:40 AM", description: "Marked as Arrived" },
        { date: "Mar 11, 2025", time: "8:00 AM", description: "Request Approved" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Pending Confirmation" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent" }
      ]
    },
    {
      currentStep: 4,
      history: [
        { date: "Mar 12, 2025", time: "8:00 AM", description: "Complete (Finished Appointment)" },
        { date: "Mar 12, 2025", time: "7:00 AM", description: "In Progress" },
        { date: "Mar 12, 2025", time: "6:40 AM", description: "Marked as Arrived" },
        { date: "Mar 11, 2025", time: "8:00 AM", description: "Request Approved" },
        { date: "Mar 11, 2025", time: "7:45 AM", description: "Waiting for Feedback" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent → Pending Confirmation" }
      ]
    }
  ];

  const rejectedStages: StageState[] = [
    {
      currentStep: 1,
      history: [
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Pending Confirmation" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent" }
      ]
    },
    {
      currentStep: 4,
      history: [
        { date: "Mar 12, 2025", time: "8:00 AM", description: "Request Declined" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Pending Confirmation" },
        { date: "Mar 11, 2025", time: "7:00 AM", description: "Request Sent" }
      ],
      rejectedStepIndices: [2, 3]
    }
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Appointments</h2>
        <p className="text-[hsl(258_22%_50%)]">
          Practice-only preview of patient appointment flows
        </p>
      </header>

      <AppointmentCard
        title="Appointment (Approved Flow)"
        feedbackLabel="Status"
        initialStage={0}
        stages={approvedStages}
      />

      <AppointmentCard
        title="Appointment (Rejected Flow)"
        feedbackLabel="Status"
        initialStage={0}
        stages={rejectedStages}
        simulateLabel="Simulate Rejection"
      />
    </div>
  );
}
