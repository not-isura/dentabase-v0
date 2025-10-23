'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  doctorId: string;
}

interface DoctorAvailability {
  day: string;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

interface BookedAppointment {
  appointment_id: string;
  booked_start_time: string;
  booked_end_time: string;
  status: string;
}

interface AcceptAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm: (endTime: string) => void;
}

const formatTime = (time: string): string => {
  if (!time || !time.includes(':')) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return '';
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export default function AcceptAppointmentModal({ 
  open, 
  onOpenChange, 
  appointment,
  onConfirm 
}: AcceptAppointmentModalProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(today));
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);

  // Calculate week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  // Get appointment date as Date object
  const appointmentDate = useMemo(() => {
    if (!appointment) return null;
    const date = new Date(appointment.date + 'T00:00:00');
    return date;
  }, [appointment]);

  // Generate available weeks (12 weeks from today)
  const availableWeeks = useMemo(() => {
    const weeks: { label: string; value: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(getWeekStart(today));
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const label = `${weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} – ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

      weeks.push({ label, value: weekStart.toISOString() });
    }
    return weeks;
  }, [today]);

  // Fetch doctor availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!open || !appointment) return;

      console.log('🏥 Fetching availability for doctor:', appointment.doctorId);

      setIsLoadingAvailability(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('doc_availability')
          .select('day, start_time, end_time, is_enabled')
          .eq('doctor_id', appointment.doctorId);

        if (error) throw error;
        
        console.log('📅 Fetched Doctor Availability:', data);
        
        // Map database fields to component interface
        const mappedData: DoctorAvailability[] = (data || []).map(item => ({
          day: item.day,
          startTime: item.start_time,
          endTime: item.end_time,
          isEnabled: item.is_enabled
        }));
        
        console.log('📅 Mapped Doctor Availability:', mappedData);
        
        setDoctorAvailability(mappedData);
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [open, appointment]);

  // Fetch booked appointments for the week
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!open || !appointment) return;

      setIsLoadingAppointments(true);
      try {
        const supabase = createClient();

        const startOfWeek1 = getWeekStart(today);
        const endOfWeek12 = new Date(startOfWeek1);
        endOfWeek12.setDate(startOfWeek1.getDate() + 12 * 7);

        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_id, booked_start_time, booked_end_time, status')
          .eq('doctor_id', appointment.doctorId)
          .gte('booked_start_time', startOfWeek1.toISOString())
          .lt('booked_start_time', endOfWeek12.toISOString())
          .in('status', ['booked', 'arrived', 'ongoing', 'completed'])
          .order('booked_start_time', { ascending: true });

        if (error) throw error;
        setBookedAppointments(data || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [open, appointment, today]);

  // Get availability for a specific date
  const getDayAvailability = useCallback(
    (date: Date) => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      console.log('🔍 Checking availability for:', {
        date: date.toDateString(),
        dayName,
        allAvailability: doctorAvailability
      });
      
      const availability = doctorAvailability.find(
        (avail) => avail.day === dayName && avail.isEnabled
      );
      
      console.log('✅ Found availability:', availability);
      
      return availability
        ? { startTime: availability.startTime, endTime: availability.endTime }
        : null;
    },
    [doctorAvailability]
  );

  // Reset when modal opens
  useEffect(() => {
    if (open && appointment) {
      // Set to appointment's week
      const aptDate = new Date(appointment.date + 'T00:00:00');
      setCurrentWeekStart(getWeekStart(aptDate));
      
      // Auto-calculate default end time (1 hour after start)
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const endHour = hours + 1;
      setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }, [open, appointment]);

  const handleWeekSelect = (weekValue: string) => {
    setCurrentWeekStart(new Date(weekValue));
    setIsWeekDropdownOpen(false);
  };

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    if (newWeekStart >= getWeekStart(today)) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    const maxWeekStart = new Date(getWeekStart(today));
    maxWeekStart.setDate(maxWeekStart.getDate() + 11 * 7);
    if (newWeekStart <= maxWeekStart) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const getDayLabel = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getDateNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  const isToday = (date: Date): boolean => {
    return formatLocalDate(date) === formatLocalDate(today);
  };

  // Validation logic for end time
  const currentValidation = useMemo(() => {
    if (!selectedEndTime || !appointment || !appointmentDate) {
      return { isValid: false, message: '' };
    }

    const requestedStartTime = appointment.time;
    const selectedEnd = selectedEndTime;

    // Rule 1: Check minimum 1-hour duration
    const startMinutes = parseInt(requestedStartTime.split(':')[0]) * 60 + parseInt(requestedStartTime.split(':')[1]);
    const endMinutes = parseInt(selectedEnd.split(':')[0]) * 60 + parseInt(selectedEnd.split(':')[1]);
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes < 60) {
      return { 
        isValid: false, 
        message: 'Appointment duration must be at least 1 hour' 
      };
    }

    // Rule 2: Check if end time is within doctor's availability
    const availability = getDayAvailability(appointmentDate);
    if (availability) {
      const availEndMinutes = parseInt(availability.endTime.split(':')[0]) * 60 + parseInt(availability.endTime.split(':')[1]);
      
      if (endMinutes > availEndMinutes) {
        return { 
          isValid: false, 
          message: `End time must be within doctor's availability (ends at ${formatTime(availability.endTime)})` 
        };
      }
    }

    // Rule 3: Check for collision with other appointments
    const appointmentDateStr = formatLocalDate(appointmentDate);
    
    for (const bookedAppt of bookedAppointments) {
      const bookedStart = bookedAppt.booked_start_time;
      const bookedEnd = bookedAppt.booked_end_time;
      
      if (!bookedStart || !bookedEnd) continue;

      const bookedStartDate = new Date(bookedStart);
      const bookedEndDate = new Date(bookedEnd);

      if (Number.isNaN(bookedStartDate.getTime()) || Number.isNaN(bookedEndDate.getTime())) {
        continue;
      }

      if (formatLocalDate(bookedStartDate) !== appointmentDateStr) continue;

      const bookedStartMinutes = bookedStartDate.getHours() * 60 + bookedStartDate.getMinutes();
      const bookedEndMinutes = bookedEndDate.getHours() * 60 + bookedEndDate.getMinutes();

      // Check if new appointment overlaps with booked appointment (inclusive of internal start)
      if (startMinutes < bookedEndMinutes && endMinutes > bookedStartMinutes) {
        const conflictStart = `${String(bookedStartDate.getHours()).padStart(2, '0')}:${String(bookedStartDate.getMinutes()).padStart(2, '0')}`;
        const conflictEnd = `${String(bookedEndDate.getHours()).padStart(2, '0')}:${String(bookedEndDate.getMinutes()).padStart(2, '0')}`;

        return { 
          isValid: false, 
          message: `Time conflicts with another appointment (${formatTime(conflictStart)} - ${formatTime(conflictEnd)})` 
        };
      }
    }

    return { isValid: true, message: 'Time slot available!' };
  }, [selectedEndTime, appointment, appointmentDate, bookedAppointments, getDayAvailability]);

  const handleContinue = () => {
    if (selectedEndTime) {
      onConfirm(selectedEndTime);
      onOpenChange(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl text-[hsl(258_46%_25%)] flex items-center">
            <Check className="mr-2 h-6 w-6" />
            Accept Appointment
          </DialogTitle>
          <DialogDescription className="text-[hsl(258_22%_50%)]">
            Select a new date and time for {appointment.patientName}&apos;s appointment with the doctor.
          </DialogDescription>
        </DialogHeader>

        {/* Week Navigation Controls */}
        <div className="border-b border-gray-200 bg-white py-2 px-2">
          <div className="flex items-center justify-center gap-1.5 relative">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
                disabled={currentWeekStart <= getWeekStart(today)}
                className="h-7 w-7 border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)] disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <button
                onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[hsl(258_46%_25%)] bg-white hover:bg-[hsl(258_46%_25%/0.05)] transition-colors"
              >
                <span className="font-medium text-sm text-[hsl(258_46%_25%)] min-w-[180px] text-center">
                  {currentWeekStart.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })} – {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
                disabled={(() => {
                  const nextWeekStart = new Date(currentWeekStart);
                  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
                  const maxWeekStart = new Date(getWeekStart(today));
                  maxWeekStart.setDate(maxWeekStart.getDate() + 11 * 7);
                  return nextWeekStart > maxWeekStart;
                })()}
                className="h-7 w-7 border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)] disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              {/* Week Dropdown */}
              {isWeekDropdownOpen && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-[240px] bg-white border border-[hsl(258_46%_25%)] rounded-lg shadow-lg max-h-[280px] overflow-y-auto z-50">
                  {availableWeeks.map((week) => {
                    const isCurrentWeek = new Date(week.value).getTime() === currentWeekStart.getTime();
                    return (
                      <button
                        key={week.value}
                        onClick={() => handleWeekSelect(week.value)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors border-b border-gray-100 last:border-b-0 ${
                          isCurrentWeek
                            ? 'bg-[hsl(258_46%_25%)] text-white font-semibold'
                            : 'text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_98%)]'
                        }`}
                      >
                        {week.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        {/* Scrollable Calendar Area */}
        <div className="flex-1 overflow-y-auto pt-0.5 pb-2">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[hsl(258_46%_25%)]">
                <div className="border-r border-[hsl(258_46%_30%)]"></div>

                {weekDays.map((date, index) => {
                  const dayLabel = getDayLabel(date);
                  const dateNumber = getDateNumber(date);
                  const isTodayDate = isToday(date);
                  const isAppointmentDay = appointmentDate && formatLocalDate(date) === formatLocalDate(appointmentDate);

                  return (
                    <div
                      key={index}
                      className={`text-center py-2 border-r border-[hsl(258_46%_30%)] last:border-r-0 ${
                        isTodayDate ? 'bg-[hsl(258_46%_20%)]' : isAppointmentDay ? 'bg-[hsl(258_46%_35%)]' : ''
                      }`}
                    >
                      <div className="text-white text-[10px] font-medium uppercase tracking-wide">
                        {dayLabel}
                      </div>
                      {isTodayDate ? (
                        <div className="bg-white text-[hsl(258_46%_25%)] rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-0.5 text-base font-bold">
                          {dateNumber}
                        </div>
                      ) : isAppointmentDay ? (
                        <div className="bg-white text-[hsl(258_46%_35%)] rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-0.5 text-base font-bold">
                          {dateNumber}
                        </div>
                      ) : (
                        <div className="text-white text-base font-bold mt-0.5 h-7 flex items-center justify-center">
                          {dateNumber}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Schedule Grid */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-white min-h-[400px]">
                {/* Time Column */}
                <div className="border-r border-gray-300 bg-gray-50">
                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-gray-200 last:border-b-0 flex items-center justify-center"
                    >
                      <span className="text-xs font-semibold text-gray-600">
                        {hour <= 12 ? hour : hour - 12}:00 {hour < 12 ? 'AM' : 'PM'}
                      </span>
                    </div>
                  ))}
                </div>

                {weekDays.map((date, dayIndex) => {
                  const isPast = date < today;
                  const availability = getDayAvailability(date);
                  const isAppointmentDay = appointmentDate && formatLocalDate(date) === formatLocalDate(appointmentDate);

                  return (
                    <div
                      key={dayIndex}
                      className={`border-r border-gray-200 last:border-r-0 relative ${
                        isPast ? 'bg-gray-50' : 'bg-white'
                      } ${isAppointmentDay ? 'bg-purple-50/40' : ''}`}
                    >
                      {/* Hour grid lines */}
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                        <div key={hour} className="h-12 border-b border-gray-200 last:border-b-0" />
                      ))}

                      {/* Availability overlay */}
                      {availability && !isPast && (() => {
                        const [startHour, startMin] = availability.startTime.split(':').map(Number);
                        const [endHour, endMin] = availability.endTime.split(':').map(Number);

                        const topOffset = (startHour - 6) * 48 + (startMin / 60) * 48;
                        const durationHours = endHour - startHour + (endMin - startMin) / 60;
                        const height = durationHours * 48;

                        return (
                          <div
                            className="absolute inset-x-0 bg-green-50/40 border-l-4 border-green-400 pointer-events-none"
                            style={{
                              top: `${topOffset}px`,
                              height: `${height}px`,
                            }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500" />
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />

                            <div className="absolute -top-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(availability.startTime)}
                            </div>
                            <div className="absolute -bottom-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(availability.endTime)}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Booked Appointments */}
                      {bookedAppointments
                        .filter((apt) => {
                          if (!apt.booked_start_time) return false;
                          const aptDate = new Date(apt.booked_start_time);
                          return formatLocalDate(aptDate) === formatLocalDate(date);
                        })
                        .map((apt) => {
                          const startTime = new Date(apt.booked_start_time);
                          const endTime = new Date(apt.booked_end_time);

                          const startHour = startTime.getHours();
                          const startMin = startTime.getMinutes();
                          const endHour = endTime.getHours();
                          const endMin = endTime.getMinutes();

                          const topOffset = (startHour - 6) * 48 + (startMin / 60) * 48;
                          const durationHours = endHour - startHour + (endMin - startMin) / 60;
                          const height = durationHours * 48;

                          const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
                          const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

                          return (
                            <div
                              key={apt.appointment_id}
                              className="absolute bg-red-100 border-2 border-red-300 rounded-lg p-2 pointer-events-auto z-10"
                              style={{
                                top: `${topOffset + 4}px`,
                                left: '8px',
                                right: '8px',
                                height: `${height - 8}px`,
                              }}
                            >
                              <div className="flex flex-col h-full justify-center">
                                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wide">
                                  Occupied
                                </span>
                                <p className="text-xs font-semibold text-red-800 mt-0.5">
                                  {formatTime(startTimeStr)} - {formatTime(endTimeStr)}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                      {/* Requested Appointment Highlight */}
                      {isAppointmentDay && appointment && selectedEndTime && currentValidation.isValid && (() => {
                        const [startHour, startMin] = appointment.time.split(':').map(Number);
                        const [endHour, endMin] = selectedEndTime.split(':').map(Number);

                        const topOffset = (startHour - 6) * 48 + (startMin / 60) * 48;
                        const durationHours = endHour - startHour + (endMin - startMin) / 60;
                        const height = durationHours * 48;

                        return (
                          <div
                            className="absolute bg-purple-200/50 border-2 border-[hsl(258_46%_40%)] rounded-lg p-2 pointer-events-none z-20"
                            style={{
                              top: `${topOffset + 4}px`,
                              left: '8px',
                              right: '8px',
                              height: `${height - 8}px`,
                            }}
                          >
                            <div className="flex flex-col h-full justify-center">
                              <span className="text-[9px] font-bold text-[hsl(258_46%_30%)] uppercase tracking-wide">
                                Requested
                              </span>
                              <p className="text-[10px] font-semibold text-[hsl(258_46%_25%)] mt-0.5">
                                {formatTime(appointment.time)} - {formatTime(selectedEndTime)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Overlay content */}
                      <div className="absolute inset-0 pointer-events-none">
                        {isPast ? (
                          <div className="flex items-center justify-center h-full p-3">
                            <p className="text-xs text-gray-400 text-center">Past date</p>
                          </div>
                        ) : !availability ? (
                          <div className="flex items-center justify-center h-full p-3">
                            <p className="text-xs text-gray-400 text-center">No availability</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        {/* Time Selection - Always visible at bottom */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3">
          <div className="flex items-stretch justify-center gap-6">
            {/* Requested Time Card */}
            <div className="flex flex-col justify-center px-4 py-3 bg-purple-50 rounded border border-purple-200">
              <p className="text-[10px] text-purple-700 mb-1">Requested Start</p>
              <p className="text-xs font-bold text-purple-900">
                {formatDateShort(appointment.date)} • {formatTime(appointment.time)}
              </p>
            </div>

            <div className="flex items-center">
              <ArrowRight className="h-5 w-5 text-[hsl(258_46%_25%)]" />
            </div>

            {/* End Time Picker */}
            <div className="flex flex-col justify-center gap-1">
              <span className="text-xs font-medium text-gray-600">End Time</span>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <select
                    className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer"
                    onChange={(e) => {
                      const hour12 = parseInt(e.target.value);
                      const currentTime = selectedEndTime.split(':');
                      const currentHour24 = parseInt(currentTime[0]);
                      const isPM = currentHour24 >= 12;

                      let newHour24 = hour12;
                      if (isPM) {
                        newHour24 = hour12 === 12 ? 12 : hour12 + 12;
                      } else {
                        newHour24 = hour12 === 12 ? 0 : hour12;
                      }

                      const hourStr = String(newHour24).padStart(2, '0');
                      setSelectedEndTime(`${hourStr}:${currentTime[1]}`);
                    }}
                    value={
                      selectedEndTime
                        ? (() => {
                            const hour24 = parseInt(selectedEndTime.split(':')[0]);
                            if (hour24 === 0) return '12';
                            if (hour24 > 12) return String(hour24 - 12);
                            return String(hour24);
                          })()
                        : '10'
                    }
                  >
                    {[...Array(12)].map((_, i) => {
                      const hour = i + 1;
                      return (
                        <option key={hour} value={String(hour)}>
                          {String(hour).padStart(2, '0')}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-3 h-3 text-[hsl(258_46%_25%)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <span className="text-sm font-bold text-[hsl(258_46%_25%)]">:</span>

                <div className="relative">
                  <select
                    className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer"
                    onChange={(e) => {
                      const minute = e.target.value;
                      const currentTime = selectedEndTime.split(':');
                      setSelectedEndTime(`${currentTime[0]}:${minute}`);
                    }}
                    value={selectedEndTime ? selectedEndTime.split(':')[1] : '00'}
                  >
                    <option value="00">00</option>
                    <option value="30">30</option>
                  </select>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-3 h-3 text-[hsl(258_46%_25%)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const currentTime = selectedEndTime.split(':');
                    const currentHour24 = parseInt(currentTime[0]);
                    let newHour24;

                    if (currentHour24 >= 12) {
                      newHour24 = currentHour24 === 12 ? 0 : currentHour24 - 12;
                    } else {
                      newHour24 = currentHour24 === 0 ? 12 : currentHour24 + 12;
                    }

                    const hourStr = String(newHour24).padStart(2, '0');
                    setSelectedEndTime(`${hourStr}:${currentTime[1]}`);
                  }}
                  className="px-3 py-1 bg-[hsl(258_46%_25%)] text-white text-xs font-bold rounded hover:bg-[hsl(258_46%_30%)] transition-colors min-w-[48px]"
                >
                  {selectedEndTime && parseInt(selectedEndTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Feedback */}
          {selectedEndTime && (
            <div className="mt-3 px-4">
              <div
                className={`text-xs px-4 py-2 rounded-md ${
                  currentValidation.isValid
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {currentValidation.message}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedEndTime || !currentValidation.isValid}
            style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
            className="cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
