'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Stethoscope, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DoctorScheduleCardData {
  doctorId: string;
  name: string;
  specialization: string;
  clinicRoom: string;
  schedules: Array<{
    availabilityId: string;
    day: string;
    dayLabel: string;
    startTime: string;
    endTime: string;
  }>;
}

interface DoctorSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDoctorSelect?: (doctorId: string, doctorName: string, schedules: DoctorScheduleCardData['schedules']) => void;
}

const dayOrder = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const formatMiddleInitials = (middleName?: string | null) => {
  if (!middleName) {
    return null;
  }

  const initials = middleName
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ''}.`)
    .join('');

  return initials.length > 0 ? initials : null;
};

const formatDoctorName = (
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null
) => {
  const formattedFirst = firstName?.trim();
  const middleInitials = formatMiddleInitials(middleName);
  const formattedLast = lastName?.trim();

  const nameParts = [formattedFirst, middleInitials, formattedLast].filter(Boolean);

  if (nameParts.length === 0) {
    return 'Doctor';
  }

  return `Dr. ${nameParts.join(' ')}`.trim();
};

const formatTime = (time: string) => {
  if (!time) return '';

  const [rawHour, rawMinute] = time.split(':');
  const hour = parseInt(rawHour ?? '0', 10);
  const minute = rawMinute ?? '00';

  if (Number.isNaN(hour)) {
    return time;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  let adjustedHour = hour % 12;
  if (adjustedHour === 0) {
    adjustedHour = 12;
  }

  const hourDisplay = String(adjustedHour).padStart(2, '0');
  const minuteDisplay = minute.slice(0, 2).padStart(2, '0');

  return `${hourDisplay}:${minuteDisplay} ${period}`;
};

const getInitial = (name: string) => {
  if (!name) return '?';

  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  return parts[parts.length - 1].charAt(0).toUpperCase();
};

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-40 animate-pulse" />
      </div>
      <p className="mt-4 text-[hsl(258_22%_50%)] text-sm">Loading doctors...</p>
    </div>
  );
};

const EmptyState = () => (
  <div className="py-12 text-center text-[hsl(258_22%_50%)]">
    <CalendarDays className="mx-auto mb-4 h-10 w-10 opacity-60" />
    <p>No doctors available at the moment.</p>
  </div>
);

export default function DoctorSelectionModal({
  open,
  onOpenChange,
  onDoctorSelect,
}: DoctorSelectionModalProps) {
  const [doctors, setDoctors] = useState<DoctorScheduleCardData[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setIsFetching(true);
    try {
      const supabase = createClient();

      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select(
          `doctor_id, user_id, specialization, room_number, users ( first_name, middle_name, last_name )`
        )
        .order('user_id');

      if (doctorsError) {
        throw doctorsError;
      }

      const { data: availabilityData, error: availabilityError } = await supabase
        .from('doc_availability')
        .select('availability_id, doctor_id, day, start_time, end_time, is_enabled')
        .eq('is_enabled', true);

      if (availabilityError) {
        throw availabilityError;
      }

      const grouped = new Map<string, DoctorScheduleCardData['schedules']>();

      (availabilityData ?? []).forEach((item) => {
        const list = grouped.get(item.doctor_id) ?? [];
        list.push({
          availabilityId: item.availability_id,
          day: item.day,
          dayLabel: item.day,
          startTime: item.start_time ?? '',
          endTime: item.end_time ?? '',
        });
        grouped.set(item.doctor_id, list);
      });

      const formatted: DoctorScheduleCardData[] = (doctorsData ?? [])
        .map((doctor) => {
          const user = (doctor as any).users;
          const schedules = grouped.get(doctor.doctor_id) ?? [];

          const normalizedSchedules = schedules
            .map((schedule) => ({
              ...schedule,
              dayLabel: schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1),
            }))
            .sort((a, b) => {
              const aIndex = dayOrder.indexOf(a.day.toLowerCase());
              const bIndex = dayOrder.indexOf(b.day.toLowerCase());
              const dayCompare = (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);

              if (dayCompare !== 0) {
                return dayCompare;
              }

              return a.startTime.localeCompare(b.startTime);
            });

          return {
            doctorId: doctor.doctor_id,
            name: formatDoctorName(user?.first_name, user?.middle_name, user?.last_name),
            specialization: doctor.specialization ?? 'Not specified',
            clinicRoom: doctor.room_number ?? 'Not assigned',
            schedules: normalizedSchedules,
          };
        })
        .filter((doctor) => doctor.schedules.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

      setDoctors(formatted);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err);
      setError('Unable to load doctors right now.');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchDoctors();
      setSelectedDoctorId(null); // Reset selection when modal opens
    }
  }, [open, fetchDoctors]);

  useEffect(() => {
    if (!open) return;

    const supabase = createClient();

    const channel = supabase
      .channel('doctor-selection-modal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doc_availability' }, () => {
        fetchDoctors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => {
        fetchDoctors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, fetchDoctors]);

  const handleDoctorClick = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
  };

  const handleNext = () => {
    if (selectedDoctorId && onDoctorSelect) {
      const selectedDoctor = doctors.find(d => d.doctorId === selectedDoctorId);
      if (selectedDoctor) {
        onDoctorSelect(selectedDoctorId, selectedDoctor.name, selectedDoctor.schedules);
      }
    }
  };

  const handleBack = () => {
    onOpenChange(false);
  };

  const content = useMemo(() => {
    if (isFetching) {
      return <LoadingState />;
    }

    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      );
    }

    if (doctors.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 max-h-[60vh] overflow-y-auto px-1 py-1">
        {doctors.map((doctor) => {
          const isSelected = selectedDoctorId === doctor.doctorId;
          return (
            <Card
              key={doctor.doctorId}
              className={`relative border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isSelected
                  ? 'border-[hsl(258_46%_25%)] ring-2 ring-[hsl(258_46%_25%)] ring-offset-2 bg-[hsl(258_46%_98%)]'
                  : 'border-gray-200 hover:border-[hsl(258_46%_25%)]'
              }`}
              onClick={() => handleDoctorClick(doctor.doctorId)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(258_46%_25%)] text-white">
                  <Check className="h-4 w-4" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] text-lg font-semibold">
                      {getInitial(doctor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg text-[hsl(258_46%_25%)]">
                      {doctor.name}
                    </CardTitle>
                    <div className="flex flex-col gap-1 text-sm text-[hsl(258_22%_50%)]">
                      <span className="inline-flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        {doctor.specialization}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Clinic Room: {doctor.clinicRoom}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4 bg-[hsl(258_22%_90%)]" />
                <div className="rounded-lg border border-gray-200 bg-gray-50">
                  {doctor.schedules.map((slot) => (
                    <div
                      key={slot.availabilityId}
                      className="flex items-center justify-between px-4 py-2 border-b border-gray-200 last:border-b-0"
                    >
                      <span className="text-sm font-semibold text-[hsl(258_46%_25%)]">
                        {slot.dayLabel}
                      </span>
                      <span className="text-sm text-[hsl(258_22%_50%)]">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }, [doctors, isFetching, error, selectedDoctorId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[hsl(258_46%_25%)]">
            Select a Doctor
          </DialogTitle>
          <DialogDescription className="text-[hsl(258_22%_50%)]">
            Choose from our available doctors to schedule your appointment.
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter className="flex flex-row justify-between gap-3 sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedDoctorId}
            className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
