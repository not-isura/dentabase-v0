'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Stethoscope, CircleOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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

interface DoctorSchedulesClientProps {
  initialDoctorSchedules: DoctorScheduleCardData[];
  disabledDoctorSchedules: DoctorScheduleCardData[];
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
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-10 animate-pulse" />
        <div className="absolute inset-4 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
          <Image
            src="/logo-white-outline.png"
            alt="Dentabase loading"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <p className="mt-6 text-[hsl(258_22%_50%)] text-sm">Fetching the latest schedules...</p>
    </div>
  );
};

const EmptyState = () => (
  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="py-12 text-center text-[hsl(258_22%_50%)]">
      <CalendarDays className="mx-auto mb-4 h-10 w-10 opacity-60" />
      <p>No schedules found. Doctors will appear here once availability is added.</p>
    </CardContent>
  </Card>
);

export default function DoctorSchedulesClient({
  initialDoctorSchedules,
  disabledDoctorSchedules,
}: DoctorSchedulesClientProps) {
  const [activeSchedules, setActiveSchedules] = useState(initialDoctorSchedules);
  const [disabledSchedules, setDisabledSchedules] = useState(disabledDoctorSchedules);
  const [isFetching, setIsFetching] = useState(
    initialDoctorSchedules.length === 0 && disabledDoctorSchedules.length === 0
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveSchedules(initialDoctorSchedules);
    setDisabledSchedules(disabledDoctorSchedules);
  }, [initialDoctorSchedules, disabledDoctorSchedules]);

  const fetchSchedules = useCallback(async () => {
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
        .sort((a, b) => a.name.localeCompare(b.name));

      const activeDoctors = formatted.filter((doctor) => doctor.schedules.length > 0);
      const disabledDoctors = formatted.filter((doctor) => doctor.schedules.length === 0);

      setActiveSchedules(activeDoctors);
      setDisabledSchedules(disabledDoctors);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch doctor schedules:', err);
      setError('Unable to load doctor schedules right now.');
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (initialDoctorSchedules.length === 0 && disabledDoctorSchedules.length === 0) {
      fetchSchedules();
    }
  }, [fetchSchedules, initialDoctorSchedules.length, disabledDoctorSchedules.length]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('doctor-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doc_availability' }, () => {
        fetchSchedules();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSchedules]);

  const content = useMemo(() => {
    if (error) {
      return (
        <Card className="bg-white border border-red-200">
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      );
    }

    if (activeSchedules.length === 0) {
      return null;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeSchedules.map((doctor) => (
          <Card
            key={doctor.doctorId}
            className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[hsl(258_22%_65%)] text-[hsl(258_46%_25%)] text-lg font-semibold">
                    {getInitial(doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
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
        ))}
      </div>
    );
  }, [activeSchedules, error]);

  const showEmptyState =
    activeSchedules.length === 0 && disabledSchedules.length === 0 && !isFetching && !error;

  const disabledContent = useMemo(() => {
    if (disabledSchedules.length === 0) {
      return null;
    }

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-sm">
              <CircleOff className="h-4 w-4" aria-hidden="true" />
              <span>Unavailable</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {disabledSchedules.map((doctor) => (
                <Card
                  key={doctor.doctorId}
                  className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gray-200 text-[hsl(258_46%_25%)] text-lg font-semibold">
                          {getInitial(doctor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
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
                </Card>
              ))}
            </div>
          </div>
        );
  }, [disabledSchedules]);

  if (isFetching && activeSchedules.length === 0 && disabledSchedules.length === 0) {
    return <LoadingState />;
  }

  if (showEmptyState) {
    return <EmptyState />;
  }

  return (
    <div className="relative">
      {isFetching && (activeSchedules.length > 0 || disabledSchedules.length > 0) && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
          <LoadingState />
        </div>
      )}
      <div className="space-y-8">
        {content}
        {disabledContent}
      </div>
    </div>
  );
}
