'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AppointmentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientName: string;
  appointmentDate: string; // ISO date string
  appointmentTime: string; // HH:MM format
  onBack: () => void;
  onConfirm: (concern: string) => void;
}

export default function AppointmentConfirmationModal({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  doctorSpecialization,
  patientName,
  appointmentDate,
  appointmentTime,
  onBack,
  onConfirm,
}: AppointmentConfirmationModalProps) {
  const [concern, setConcern] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatDisplayTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const handleConfirm = async () => {
    if (!concern.trim()) {
      alert('Please describe your concern before confirming.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(concern);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] flex flex-col p-0">
        {/* Header - Fixed */}
        <div className="flex flex-col space-y-1.5 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl text-[hsl(258_46%_25%)]">
            Confirm Appointment Request
          </DialogTitle>
          <DialogDescription className="text-[hsl(258_22%_50%)]">
            Review your appointment details and describe your concern before submitting.
          </DialogDescription>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="space-y-6">
          {/* Appointment Summary */}
          <div className="rounded-lg border border-[hsl(258_46%_25%/0.2)] bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] mb-4">
              Appointment Summary
            </h3>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Patient
                  </p>
                  <p className="text-sm font-bold text-[hsl(258_46%_25%)]">
                    {patientName}
                  </p>
                </div>
              </div>

              {/* Dentist Info */}
              <div className="flex items-center gap-3">
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
                  <p className="text-xs text-gray-600 mt-0.5">
                    {doctorSpecialization}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-sm font-bold text-[hsl(258_46%_25%)]">
                    {formatDisplayDate(appointmentDate)}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Requested Time
                  </p>
                  <p className="text-sm font-bold text-[hsl(258_46%_25%)]">
                    {formatDisplayTime(appointmentTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This is a request. The clinic will review and may propose an alternative time if needed.
              </p>
            </div>
          </div>

          {/* Concern Field */}
          <div className="space-y-2">
            <Label htmlFor="concern" className="text-sm font-semibold text-[hsl(258_46%_25%)]">
              Describe Your Concern <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="concern"
              placeholder="Please describe your symptoms, concerns, or reason for this appointment..."
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              rows={4}
              className="resize-none border-[hsl(258_46%_25%)] focus:ring-[hsl(258_46%_25%)]"
              required
            />
            <p className="text-xs text-gray-500">
              This helps the doctor prepare for your visit.
            </p>
          </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-row justify-between gap-3 px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
          >
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!concern.trim() || isSubmitting}
            className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
