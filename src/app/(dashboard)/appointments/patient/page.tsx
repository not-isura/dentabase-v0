"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Clock, Plus, X, Stethoscope, Calendar, FileText, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { StatusFlowGuide } from '@/components/StatusFlowGuide';
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
  notes?: string; // Notes from staff/admin
  feedback?: string; // Additional feedback from staff (separate from notes)
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
  
  // If there's a rejected step, find the last completed step before it
  const hasRejection = rejectedStepIndices.length > 0;
  const lastCompletedBeforeRejection = hasRejection ? Math.min(...rejectedStepIndices) - 1 : -1;

  return (
    <div className="w-full py-2">
      <div className="mx-auto flex w-[85%] max-w-2xl items-center justify-between md:w-2/3">
        {steps.map((_, index) => {
          const isRejected = rejectedSet.has(index);
          
          // For terminated flows (rejected/cancelled), show checkmarks up to the last completed step
          const isCompleted = hasRejection 
            ? index <= lastCompletedBeforeRejection 
            : normalizedStep > index;
          
          const isActive = !flowComplete && !hasRejection && index === normalizedStep;
          const hasCompletedLeft = hasRejection 
            ? index <= lastCompletedBeforeRejection 
            : normalizedStep >= index;
          const hasCompletedRight = hasRejection 
            ? index < lastCompletedBeforeRejection 
            : normalizedStep > index;

          return (
            <div key={`tracker-circle-${index}`} className="relative flex flex-1 items-center justify-center">
              {index > 0 && (
                <>
                  <span className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-1/2 -translate-y-1/2 rounded-full bg-gray-200" />
                  {hasCompletedLeft && (
                    <span className="pointer-events-none absolute left-0 top-1/2 h-[3px] w-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[hsl(258_46%_45%)] to-[hsl(258_46%_40%)] transition-all duration-500" />
                  )}
                </>
              )}
              {index < steps.length - 1 && (
                <>
                  <span className="pointer-events-none absolute right-0 top-1/2 h-[3px] w-1/2 -translate-y-1/2 rounded-full bg-gray-200" />
                  {hasCompletedRight && (
                    <span className="pointer-events-none absolute right-0 top-1/2 h-[3px] w-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[hsl(258_46%_40%)] to-[hsl(258_46%_45%)] transition-all duration-500" />
                  )}
                </>
              )}
              <div
                className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-[3px] text-base font-bold transition-all duration-300 shadow-sm ${
                  isRejected
                    ? "border-red-500 bg-red-500 text-white shadow-red-200"
                    : isCompleted || isActive
                      ? "border-[hsl(258_46%_45%)] bg-gradient-to-br from-[hsl(258_46%_45%)] to-[hsl(258_46%_35%)] text-white shadow-[hsl(258_46%_85%)] scale-110"
                      : "border-gray-300 bg-white text-gray-400 hover:border-gray-400"
                }`}
              >
                {isRejected ? <X className="h-5 w-5" /> : isCompleted ? <Check className="h-5 w-5" /> : index + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 mx-auto flex w-[85%] max-w-2xl justify-between text-xs font-semibold text-gray-600 md:w-2/3">
        {steps.map((label, index) => {
          const isActive = index === normalizedStep;
          return (
            <div key={label} className="flex flex-1 justify-center text-center">
              <span className={`max-w-[7rem] text-xs md:text-sm transition-all duration-300 ${
                isActive ? 'text-[hsl(258_46%_35%)] font-bold scale-105' : 'text-gray-600'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusHistory: React.FC<StatusHistoryProps> = ({ history }) => {
  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div
          key={`${entry.date}-${entry.time}-${index}`}
          className="rounded-xl border border-[hsl(258_46%_90%)] bg-gradient-to-br from-white to-[hsl(258_46%_97%)] p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:border-[hsl(258_46%_80%)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[hsl(258_46%_35%)] bg-[hsl(258_46%_95%)] px-2.5 py-1 rounded-lg border border-[hsl(258_46%_85%)]">
                  {entry.date}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1.5">
                {entry.status}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{entry.description}</p>
              
              {/* Show feedback from staff if available */}
              {entry.feedback && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Message from Clinic:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-line">{entry.feedback}</p>
                </div>
              )}
              
              {/* Show related appointment time if available */}
              {entry.relatedTime && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[hsl(258_46%_30%)] bg-[hsl(258_46%_95%)] border border-[hsl(258_46%_85%)] rounded-lg px-3 py-2 hover:bg-[hsl(258_46%_92%)] transition-colors duration-200">
                  <Calendar className="h-4 w-4 text-[hsl(258_46%_45%)]" />
                  <span className="font-semibold">
                    {entry.status === 'Requested' ? 'Requested time:' : 'Appointment time:'}
                  </span> 
                  <span className="font-bold">{entry.relatedTime}</span>
                  {entry.relatedEndTime && (
                    <><span className="font-bold">to</span><span className="font-bold">{entry.relatedEndTime}</span></>
                  )}
                </div>
              )}
            </div>
            <div className="hidden items-center gap-4 sm:flex sm:self-start sm:pt-1">
              <span className="hidden h-full w-px rounded-full bg-[hsl(258_46%_85%)] sm:block" aria-hidden="true" />
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[hsl(258_46%_30%)] bg-[hsl(258_46%_95%)] border border-[hsl(258_46%_85%)] px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-[hsl(258_46%_45%)]" />
                <span>{entry.time}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex sm:hidden">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[hsl(258_46%_30%)] bg-[hsl(258_46%_95%)] border border-[hsl(258_46%_85%)] px-3 py-2 rounded-lg">
              <Clock className="h-4 w-4 text-[hsl(258_46%_45%)]" />
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
  onCreateNew?: () => void; // NEW: Create new appointment handler
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
  onConfirm,
  onCreateNew
}) => {
  // Cancel modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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

  // Use the appropriate time based on status
  const displayTime = status.toLowerCase() === 'booked' && bookedStartTime 
    ? bookedStartTime 
    : requestedStartTime;

  const { dateStr, timeStr } = displayTime 
    ? formatDateTime(displayTime) 
    : { dateStr: '', timeStr: '' };

  // Status badge styling with enhanced colors
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'requested':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'proposed':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'booked':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'arrived':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'ongoing':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'cancelled':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'rejected':
        return 'bg-gray-100 text-gray-900 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  // Display "To Confirm" for proposed status in patient UI
  const displayStatus = status.toLowerCase() === 'proposed' ? 'To Confirm' : status;

  if (isLoading) {
    return (
      <Card className="border border-gray-100 shadow-lg bg-white rounded-xl overflow-hidden animate-pulse">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-7 w-56 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="h-16 w-full bg-gray-100 rounded-lg"></div>
          <div className="h-16 w-full bg-gray-100 rounded-lg"></div>
          <div className="h-24 w-full bg-gray-100 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-lg bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 pb-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
              Appointment Summary
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 leading-relaxed">
              Quick overview of your scheduled appointment
            </CardDescription>
          </div>
          <div className={`px-4 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${getStatusColor(status)}`}>
            {displayStatus}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Completed/Rejected/Cancelled Appointment Banner - Compact at Top */}
        {(status.toLowerCase() === 'completed' || status.toLowerCase() === 'rejected' || status.toLowerCase() === 'cancelled') && (
          <div className={`p-3 rounded-lg border shadow-sm ${
            status.toLowerCase() === 'completed' 
              ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  status.toLowerCase() === 'completed'
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  {status.toLowerCase() === 'completed' ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <X className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold ${
                    status.toLowerCase() === 'completed' ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </p>
                  <p className={`text-[10px] ${
                    status.toLowerCase() === 'completed' 
                      ? 'text-emerald-700' 
                      : 'text-red-700'
                  }`}>
                    {status.toLowerCase() === 'completed' 
                      ? 'Thank you for visiting!' 
                      : status.toLowerCase() === 'rejected'
                      ? 'Appointment could not be accommodated'
                      : 'Appointment has been cancelled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const supabase = createClient();
                      
                      // Set is_active to false to dismiss the appointment
                      const { error } = await supabase
                        .from('appointments')
                        .update({ is_active: false })
                        .eq('appointment_id', appointmentId);
                      
                      if (error) {
                        console.error('Error dismissing appointment:', error);
                        return;
                      }
                      
                      // Refresh to remove from UI and allow new appointment creation
                      window.location.reload();
                    } catch (error) {
                      console.error('Error dismissing:', error);
                    }
                  }}
                  size="sm"
                  className={`text-xs font-semibold py-1.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ${
                    status.toLowerCase() === 'completed'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5 inline" />
                  Dismiss to Create New
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dentist Info */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[hsl(258_46%_35%)] to-[hsl(258_46%_25%)] rounded-xl flex items-center justify-center shadow-md">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Dentist
            </p>
            <p className="text-base font-bold text-gray-900 mb-0.5">
              {doctorName}
            </p>
            <p className="text-sm text-gray-600">
              {doctorSpecialization}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[hsl(258_46%_35%)] to-[hsl(258_46%_25%)] rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {status.toLowerCase() === 'proposed' ? 'Requested Time' : 'Scheduled For'}
            </p>
            <p className="text-base font-bold text-gray-900 mb-1">
              {dateStr}
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{timeStr}</span>
              {/* Show end time for booked appointments */}
              {status.toLowerCase() === 'booked' && bookedEndTime && (() => {
                const endTime = new Date(bookedEndTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                return <span className="font-medium"> to {endTime}</span>;
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

          const buttonText = timesMatch ? 'Confirm' : 'Accept';
          
          return (
            <div className={`p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
              timesMatch 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
                : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110 ${
                  timesMatch ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  {timesMatch ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <Clock className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    timesMatch ? 'text-green-700' : 'text-purple-700'
                  }`}>
                    {label}
                  </p>
                  <div className="space-y-2">
                    <p className={`text-base font-bold ${timesMatch ? 'text-green-900' : 'text-purple-900'}`}>
                      {propDateStr}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                        timesMatch 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        <Clock className="h-4 w-4" />
                        {propTimeStr}
                        {propEndTimeStr && (
                          <> to {propEndTimeStr}</>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${
                      timesMatch ? 'text-green-600' : 'text-purple-600'
                    }`}>
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirm Button - Only inside the card with proper divider */}
              {onConfirm && (
                <>
                  <div className={`my-4 h-px ${timesMatch ? 'bg-green-200' : 'bg-purple-200'}`} />
                  <div className="flex justify-end">
                    <Button
                      onClick={onConfirm}
                      className={`w-full sm:w-auto bg-gradient-to-r font-semibold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                        timesMatch
                          ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                          : 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                      }`}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Concern */}
        <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:bg-gradient-to-br hover:from-amber-100 hover:to-orange-100 transition-all duration-300">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
              Your Concern
            </p>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">
              {concern}
            </p>
          </div>
        </div>

        {/* Cancel Button - Only show if appointment can be cancelled */}
        {status.toLowerCase() !== 'cancelled' && 
         status.toLowerCase() !== 'completed' && 
         status.toLowerCase() !== 'rejected' && 
         onCancel && (
          <div className="flex justify-end pt-6 border-t border-gray-100 mt-2">
            <Button
              onClick={() => setIsCancelModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel Appointment
            </Button>
          </div>
        )}
      </CardContent>

      {/* Cancel Confirmation Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl border-0">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center shadow-sm">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Cancel Appointment?
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 text-base leading-relaxed pt-3 pl-1">
              Are you sure you want to cancel your appointment with <span className="font-bold text-gray-900">{doctorName}</span>?
              <br />
              <br />
              <span className="text-sm text-gray-500 font-medium">
                This action cannot be undone. You will need to create a new appointment if you wish to reschedule.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
              className="w-full sm:w-auto border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 font-semibold px-6 py-2.5 rounded-xl transition-all duration-200"
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsCancelling(true);
                try {
                  if (onCancel) {
                    await onCancel();
                  }
                  setIsCancelModalOpen(false);
                } catch (error) {
                  console.error('Error cancelling:', error);
                } finally {
                  setIsCancelling(false);
                }
              }}
              disabled={isCancelling}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCancelling ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cancelling...
                </div>
              ) : (
                'Yes, Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        .eq('is_active', true)
        .in('status', ['requested', 'proposed', 'booked', 'arrived', 'ongoing', 'completed', 'rejected', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (appointmentError) {
        console.error('Appointment fetch error:', appointmentError);
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      if (!appointments || appointments.length === 0) {
        console.log('No appointments found with is_active=true');
        setActiveAppointment(null);
        setIsLoadingAppointment(false);
        return;
      }

      const appointment = appointments[0];
      console.log('Found active appointment:', {
        id: appointment.appointment_id,
        status: appointment.status,
        is_active: appointment.is_active
      });
      
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
        .select('status, changed_at, notes, feedback, changed_by_user_id, related_time, related_end_time') // ✅ Added feedback
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
        'rejected': -1, // Special case: terminated flow
        'cancelled': -1, // Special case: terminated flow
      };
      
      const currentStep = statusMap[appointment.status.toLowerCase()] ?? 0;
      
      // Calculate rejected step indices based on status
      const rejectedStepIndices: number[] = [];
      const currentStatus = appointment.status.toLowerCase();
      
      if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
        // Find the last completed step from status history
        let lastCompletedStep = currentStep;
        
        // Check status history to find the highest step reached
        if (statusHistory && statusHistory.length > 0) {
          const completedStatuses = statusHistory
            .map(h => h.status.toLowerCase())
            .filter(s => s !== 'rejected' && s !== 'cancelled');
          
          const maxStep = Math.max(
            ...completedStatuses.map(s => statusMap[s] ?? -1)
          );
          
          if (maxStep >= 0) {
            lastCompletedStep = maxStep;
          }
        }
        
        // The X mark goes on the NEXT step after the last completed one
        const rejectedStepIndex = lastCompletedStep + 1;
        if (rejectedStepIndex < steps.length) {
          rejectedStepIndices.push(rejectedStepIndex);
        }
      }
      
      // Helper function to generate description based on status and times
      const generateDescription = (entry: any) => {
        // Always use notes from database if available (consistent with admin view)
        if (entry.notes) {
          return entry.notes;
        }
        
        // Fallback for entries without notes
        return `Status changed to ${entry.status}`;
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
              notes: entry.notes || undefined, // Include notes from staff
              feedback: entry.feedback || undefined, // ✅ Include feedback from staff
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
        rejectedStepIndices, // Now dynamically calculated based on status
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

  // Real-time subscription for appointments and status history
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to appointments table changes
    const appointmentsChannel = supabase
      .channel('patient-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('📡 Appointment change detected:', payload);
          // Refetch the active appointment when any change occurs
          fetchActiveAppointment();
        }
      )
      .subscribe();

    // Subscribe to appointment_status_history table changes
    const statusHistoryChannel = supabase
      .channel('patient-status-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'appointment_status_history'
        },
        (payload) => {
          console.log('📡 Status history change detected:', payload);
          // Refetch the active appointment when status history changes
          fetchActiveAppointment();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(statusHistoryChannel);
    };
  }, []); // Empty dependency array - only set up once on mount

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
    <div className="space-y-8 pb-8">
      {/* Alert Notification */}
      {alert?.show && (
        <Alert 
          variant={alert.variant} 
          className="rounded-xl border-2 shadow-md animate-in slide-in-from-top-5 duration-300"
        >
          {alert.message}
        </Alert>
      )}

      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Patient Appointments</h2>
          <p className="text-base text-gray-600">
            Review the status of your latest appointment activity.
          </p>
        </div>
        <StatusFlowGuide variant="patient" />
      </header>

      {/* Appointment Summary - Only show when there's an active appointment */}
      {activeAppointment && activeAppointment.doctorName && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            onCreateNew={handleOpenModal}
          />
        </section>
      )}

      <section className="animate-in fade-in slide-in-from-bottom-5 duration-500">
        <AppointmentCard
          title="Upcoming Appointment"
          {...appointmentCardData}
          milestoneMessages={milestoneMessages}
          canCreate
          onCreate={handleOpenModal}
          emptyStateMessage="You don't have an active appointment request. Start a new one to secure your slot."
          isLoading={isLoadingAppointment}
        />
      </section>

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
