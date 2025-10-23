'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    patientName: string;
    date: string;
    time: string;
    doctorId: string;
    doctorName: string;
  } | null;
  onSubmit: (data: { date: string; startTime: string; endTime: string; reason?: string }) => void;
  isSubmitting?: boolean;
}

interface DoctorAvailability {
  day: string;
  startTime: string;
  endTime: string;
}

interface BookedAppointment {
  appointment_id: string;
  booked_start_time: string;
  booked_end_time: string;
  status: string;
}

// Helper functions for date manipulation
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Get Sunday
  return new Date(d.setDate(diff));
};

// Format date as YYYY-MM-DD using LOCAL timezone (not UTC)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateRange = (startDate: Date): string => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);
  const year = endDate.getFullYear();
  
  return `${start} – ${end}, ${year}`;
};

const getDayLabel = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

const getDateNumber = (date: Date): number => {
  return date.getDate();
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [rawHour, rawMinute] = time.split(':');
  const hour = parseInt(rawHour ?? '0', 10);
  const minute = rawMinute ?? '00';

  if (Number.isNaN(hour)) return time;

  const period = hour >= 12 ? 'PM' : 'AM';
  let adjustedHour = hour % 12;
  if (adjustedHour === 0) adjustedHour = 12;

  return `${adjustedHour}:${minute.slice(0, 2)} ${period}`;
};

const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Generate available weeks for next 3 months
const generateAvailableWeeks = (): { label: string; value: string }[] => {
  const weeks = [];
  const today = new Date();
  const startOfCurrentWeek = getWeekStart(today);
  
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(startOfCurrentWeek);
    weekStart.setDate(startOfCurrentWeek.getDate() + (i * 7));
    
    weeks.push({
      label: formatDateRange(weekStart),
      value: weekStart.toISOString(),
    });
  }
  
  return weeks;
};

export default function RescheduleModal({
  open,
  onOpenChange,
  appointment,
  onSubmit,
  isSubmitting = false,
}: RescheduleModalProps) {
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(today));
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [showReasonDialog, setShowReasonDialog] = useState<boolean>(false);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableWeeks = useMemo(() => generateAvailableWeeks(), []);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
    };

    if (isWeekDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWeekDropdownOpen]);

  // Fetch doctor availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!open || !appointment?.doctorId) return;

      setIsLoadingAvailability(true);
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('doc_availability')
          .select('day, start_time, end_time')
          .eq('doctor_id', appointment.doctorId)
          .eq('is_enabled', true);

        if (error) {
          console.error('Error fetching availability:', error);
          setDoctorAvailability([]);
        } else {
          const transformed = (data || []).map((avail: any) => ({
            day: avail.day.toLowerCase(),
            startTime: avail.start_time,
            endTime: avail.end_time,
          }));
          setDoctorAvailability(transformed);
        }
      } catch (err) {
        console.error('Unexpected error fetching availability:', err);
        setDoctorAvailability([]);
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [open, appointment?.doctorId]);

  // Fetch booked appointments from database
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!open || !appointment?.doctorId) return;

      setIsLoadingAppointments(true);
      try {
        const supabase = createClient();
        
        // Calculate 12-week date range
        const startOfWeek1 = getWeekStart(today);
        const endOfWeek12 = new Date(startOfWeek1);
        endOfWeek12.setDate(startOfWeek1.getDate() + (12 * 7));

        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_id, booked_start_time, booked_end_time, status')
          .eq('doctor_id', appointment.doctorId)
          .gte('booked_start_time', startOfWeek1.toISOString())
          .lt('booked_start_time', endOfWeek12.toISOString())
          .in('status', ['booked', 'arrived', 'ongoing', 'completed'])
          .order('booked_start_time', { ascending: true });

        if (error) {
          console.error('Error fetching appointments:', error);
          setBookedAppointments([]);
        } else {
          setBookedAppointments(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching appointments:', err);
        setBookedAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [open, appointment?.doctorId, today]);

  // Get availability for a specific day
  const getDayAvailability = useCallback((date: Date): DoctorAvailability | null => {
    const dayName = getDayName(date);
    return doctorAvailability.find((avail) => avail.day === dayName) || null;
  }, [doctorAvailability]);

  // Check if a time slot is reserved based on real appointment data
  const isSlotReserved = useCallback((date: Date, time: string): boolean => {
    const dateStr = formatLocalDate(date);
    
    // Check against real booked appointments
    return bookedAppointments.some((appt) => {
      const appointmentDate = new Date(appt.booked_start_time);
      const appointmentDateStr = formatLocalDate(appointmentDate);
      
      // Check if appointment is on the same day
      if (appointmentDateStr !== dateStr) return false;

      // Extract time in HH:MM format using LOCAL timezone
      const startTime = new Date(appt.booked_start_time);
      const endTime = new Date(appt.booked_end_time);
      
      const startHour = startTime.getHours();
      const startMin = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMin = endTime.getMinutes();
      
      const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      
      // Check if the time slot falls within the appointment range
      return time >= startTimeStr && time < endTimeStr;
    });
  }, [bookedAppointments]);

  // Validation logic for reschedule times
  const currentValidation = useMemo(() => {
    if (!selectedSlot || !selectedEndTime || !selectedDay) {
      return { isValid: false, message: '' };
    }

    const startTime = selectedSlot.time;
    const endTime = selectedEndTime;

    // Convert times to minutes for easier comparison
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Rule 1: End time must be after start time
    if (endMinutes <= startMinutes) {
      return {
        isValid: false,
        message: 'End time must be after start time'
      };
    }

    // Rule 2: Minimum 1-hour duration
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 60) {
      return {
        isValid: false,
        message: 'Appointment duration must be at least 1 hour'
      };
    }

    // Rule 3: Check if within doctor's availability
    const availability = getDayAvailability(selectedDay);
    if (availability) {
      const [availStartHour, availStartMin] = availability.startTime.split(':').map(Number);
      const [availEndHour, availEndMin] = availability.endTime.split(':').map(Number);
      const availStartMinutes = availStartHour * 60 + availStartMin;
      const availEndMinutes = availEndHour * 60 + availEndMin;

      if (startMinutes < availStartMinutes || endMinutes > availEndMinutes) {
        return {
          isValid: false,
          message: `Time must be within doctor's availability (${formatTime(availability.startTime)} - ${formatTime(availability.endTime)})`
        };
      }
    }

    // Rule 4: Check for collision with other appointments
    const dateStr = formatLocalDate(selectedDay);
    for (const appt of bookedAppointments) {
      // Skip the current appointment being rescheduled
      if (appointment && appt.appointment_id === appointment.id) continue;

      const appointmentDate = new Date(appt.booked_start_time);
      const appointmentDateStr = formatLocalDate(appointmentDate);

      if (appointmentDateStr !== dateStr) continue;

      const bookedStart = new Date(appt.booked_start_time);
      const bookedEnd = new Date(appt.booked_end_time);

      const bookedStartMinutes = bookedStart.getHours() * 60 + bookedStart.getMinutes();
      const bookedEndMinutes = bookedEnd.getHours() * 60 + bookedEnd.getMinutes();

      // Check overlap: newStart < bookedEnd AND newEnd > bookedStart
      if (startMinutes < bookedEndMinutes && endMinutes > bookedStartMinutes) {
        return {
          isValid: false,
          message: 'Time conflicts with another appointment'
        };
      }
    }

    // Rule 5: Cannot reschedule to the past
    const now = new Date();
    const selectedDateTime = new Date(selectedDay);
    selectedDateTime.setHours(startHour, startMin, 0, 0);
    
    if (selectedDateTime < now) {
      return {
        isValid: false,
        message: 'Cannot reschedule to a past time'
      };
    }

    return { isValid: true, message: 'Time slot available!' };
  }, [selectedSlot, selectedEndTime, selectedDay, bookedAppointments, getDayAvailability, appointment]);

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    // Don't allow going back before today
    if (newWeekStart >= getWeekStart(today)) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    // Don't allow going beyond 12 weeks
    const maxWeekStart = new Date(getWeekStart(today));
    maxWeekStart.setDate(maxWeekStart.getDate() + (11 * 7));
    
    if (newWeekStart <= maxWeekStart) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const handleWeekSelect = (weekValue: string) => {
    setCurrentWeekStart(new Date(weekValue));
    setIsWeekDropdownOpen(false);
  };

  const toggleWeekDropdown = () => {
    setIsWeekDropdownOpen(!isWeekDropdownOpen);
  };

  const handleDayClick = (date: Date) => {
    const isPast = date < new Date(today.setHours(0, 0, 0, 0));
    const availability = getDayAvailability(date);
    
    // Only allow selection if not past and has availability
    if (!isPast && availability) {
      // Toggle: if clicking the same day, unselect it
      if (selectedDay?.toDateString() === date.toDateString()) {
        setSelectedDay(null);
        setSelectedSlot(null);
        setSelectedEndTime('');
      } else {
        setSelectedDay(date);
        const dateStr = formatLocalDate(date);
        const currentTime = selectedSlot?.time || '09:00';
        setSelectedSlot({ date: dateStr, time: currentTime });
        // Default end time to 1 hour after start
        const [hours, minutes] = currentTime.split(':').map(Number);
        const endHour = hours + 1;
        setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
    }
  };

  const handleTimeSlotClick = (time: string) => {
    if (selectedDay) {
      const dateStr = formatLocalDate(selectedDay);
      setSelectedSlot({ date: dateStr, time });
      // Auto-update end time to 1 hour after start
      const [hours, minutes] = time.split(':').map(Number);
      const endHour = hours + 1;
      setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  };

  const handleSubmit = () => {
    // Show reason dialog instead of submitting directly
    setShowReasonDialog(true);
  };

  const handleConfirmReschedule = () => {
    if (selectedSlot && selectedEndTime && onSubmit) {
      onSubmit({
        date: selectedSlot.date,
        startTime: selectedSlot.time,
        endTime: selectedEndTime,
        reason: rescheduleReason,
      });
      setShowReasonDialog(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDay(null);
      setSelectedSlot(null);
      setSelectedEndTime('');
      setRescheduleReason('');
      setShowReasonDialog(false);
      setCurrentWeekStart(getWeekStart(today));
    }
  }, [open]);

  if (!appointment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl text-[hsl(258_46%_25%)] flex items-center">
            <Clock className="mr-2 h-6 w-6" />
            Reschedule Appointment
          </DialogTitle>
          <DialogDescription className="text-[hsl(258_22%_50%)]">
            Select a new date and time for {appointment.patientName}'s appointment with {appointment.doctorName}.
          </DialogDescription>
        </DialogHeader>

        {/* Week Navigation Controls */}
        <div className="border-b border-gray-200 bg-white py-2 px-2">
          <div className="flex items-center justify-center gap-1.5 relative" ref={dropdownRef}>
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
              onClick={toggleWeekDropdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[hsl(258_46%_25%)] bg-white hover:bg-[hsl(258_46%_25%/0.05)] transition-colors"
            >
              <span className="font-medium text-sm text-[hsl(258_46%_25%)] min-w-[180px] text-center">
                {formatDateRange(currentWeekStart)}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-[hsl(258_46%_25%)] transition-transform ${isWeekDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              disabled={(() => {
                const nextWeekStart = new Date(currentWeekStart);
                nextWeekStart.setDate(currentWeekStart.getDate() + 7);
                const maxWeekStart = new Date(getWeekStart(today));
                maxWeekStart.setDate(maxWeekStart.getDate() + (11 * 7));
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
            {/* Day Headers Row */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[hsl(258_46%_25%)]">
              <div className="border-r border-[hsl(258_46%_30%)]"></div>
              
              {weekDays.map((date, index) => {
                const dayLabel = getDayLabel(date);
                const dateNumber = getDateNumber(date);
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={`text-center py-2 border-r border-[hsl(258_46%_30%)] last:border-r-0 ${
                      isTodayDate ? 'bg-[hsl(258_46%_20%)]' : ''
                    }`}
                  >
                    <div className="text-white text-[10px] font-medium uppercase tracking-wide">
                      {dayLabel}
                    </div>
                    {isTodayDate ? (
                      <div className="bg-white text-[hsl(258_46%_25%)] rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-0.5 text-base font-bold">
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
                const isPast = date < new Date(today.setHours(0, 0, 0, 0));
                const availability = getDayAvailability(date);
                const isSelected = selectedDay?.toDateString() === date.toDateString();
                const isClickable = !isPast && availability;

                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDayClick(date)}
                    className={`border-r border-gray-200 last:border-r-0 relative transition-all ${
                      isPast ? 'bg-gray-50' : 'bg-white'
                    } ${
                      isClickable ? 'cursor-pointer hover:bg-blue-50/30' : 'cursor-not-allowed'
                    } ${
                      isSelected ? 'bg-blue-50/50 z-20' : ''
                    }`}
                  >
                    {/* Selection border overlay */}
                    {isSelected && (
                      <>
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500 z-30 animate-in slide-in-from-left duration-300" />
                        <div className="absolute top-0 bottom-0 right-0 w-1 bg-blue-500 z-30 animate-in slide-in-from-right duration-300" />
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-30 animate-in slide-in-from-top duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 z-30 animate-in slide-in-from-bottom duration-300" />
                      </>
                    )}

                    {/* Hour grid lines */}
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                      <div
                        key={hour}
                        className="h-12 border-b border-gray-200 last:border-b-0"
                      />
                    ))}

                    {/* Working Hours Background */}
                    {availability && !isPast && (() => {
                      const [startHour, startMin] = availability.startTime.split(':').map(Number);
                      const [endHour, endMin] = availability.endTime.split(':').map(Number);
                      
                      const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                      const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
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

                    {/* Rescheduled Appointment Preview */}
                    {selectedDay && selectedSlot && selectedEndTime && currentValidation.isValid && 
                     formatLocalDate(date) === formatLocalDate(selectedDay) && (() => {
                      const [startHour, startMin] = selectedSlot.time.split(':').map(Number);
                      const [endHour, endMin] = selectedEndTime.split(':').map(Number);

                      const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                      const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
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
                              Rescheduled
                            </span>
                            <p className="text-[10px] font-semibold text-[hsl(258_46%_25%)] mt-0.5">
                              {formatTime(selectedSlot.time)} - {formatTime(selectedEndTime)}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Overlay content */}
                    <div className="absolute inset-0 pointer-events-none">
                      {isPast ? (
                        <div className="flex items-center justify-center h-full p-3 pointer-events-auto">
                          <p className="text-xs text-gray-400 text-center">Past date</p>
                        </div>
                      ) : !availability ? (
                        <div className="flex items-center justify-center h-full p-3 pointer-events-auto">
                          <p className="text-xs text-gray-400 text-center">No availability</p>
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const dateStr = formatLocalDate(date);
                            const dayAppointments = bookedAppointments.filter((appt) => {
                              const appointmentDate = new Date(appt.booked_start_time);
                              const appointmentDateStr = formatLocalDate(appointmentDate);
                              return appointmentDateStr === dateStr;
                            });

                            return dayAppointments.map((appt) => {
                              const startTime = new Date(appt.booked_start_time);
                              const endTime = new Date(appt.booked_end_time);
                              
                              const startHour = startTime.getHours();
                              const startMin = startTime.getMinutes();
                              const endHour = endTime.getHours();
                              const endMin = endTime.getMinutes();
                              
                              const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
                              const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
                              
                              const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                              const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                              const height = durationHours * 48;
                              
                              return (
                                <div
                                  key={`appointment-${appt.appointment_id}`}
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
                            });
                          })()}
                        </>
                      )}
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
            {/* Current Appointment Card */}
            <div className="flex flex-col justify-center px-4 py-3 bg-amber-50 rounded border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Current</p>
              <p className="text-sm font-bold text-amber-900">{formatDateShort(appointment.date)} • {formatTime(appointment.time)}</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* New Date/Time Card */}
            <div className="px-4 py-2 bg-white rounded border border-blue-200 shadow-sm">
              <div className="flex items-center gap-4">
                {/* New Date Info */}
                <div className="flex-shrink-0 min-w-[180px]">
                  <p className="text-xs font-medium text-gray-600 mb-1">New Date</p>
                  <p className="text-sm font-bold text-[hsl(258_46%_25%)]">
                    {selectedDay ? selectedDay.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'No Date Selected'}
                  </p>
                </div>

                {/* Start Time Picker */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-600">Start</span>
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                <select
                  disabled={!selectedSlot}
                  className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => {
                    if (!selectedSlot) return;
                    const hour12 = parseInt(e.target.value);
                    const currentTime = selectedSlot.time.split(':');
                    const currentHour24 = parseInt(currentTime[0]);
                    const isPM = currentHour24 >= 12;
                    
                    let newHour24 = hour12;
                    if (isPM) {
                      newHour24 = hour12 === 12 ? 12 : hour12 + 12;
                    } else {
                      newHour24 = hour12 === 12 ? 0 : hour12;
                    }
                    
                    const hourStr = String(newHour24).padStart(2, '0');
                    handleTimeSlotClick(`${hourStr}:${currentTime[1]}`);
                  }}
                  value={selectedSlot ? (() => {
                    const hour24 = parseInt(selectedSlot.time.split(':')[0]);
                    if (hour24 === 0) return '12';
                    if (hour24 > 12) return String(hour24 - 12);
                    return String(hour24);
                  })() : '09'}
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
                  <svg className="w-3 h-3 text-[hsl(258_46%_25%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <span className="text-sm font-bold text-[hsl(258_46%_25%)]">:</span>

              <div className="relative">
                <select
                  disabled={!selectedSlot}
                  className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => {
                    if (!selectedSlot) return;
                    const minute = e.target.value;
                    const currentHour = selectedSlot.time.split(':')[0];
                    handleTimeSlotClick(`${currentHour}:${minute}`);
                  }}
                  value={selectedSlot ? selectedSlot.time.split(':')[1] : '00'}
                >
                  <option value="00">00</option>
                  <option value="30">30</option>
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-[hsl(258_46%_25%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                disabled={!selectedSlot}
                onClick={() => {
                  if (!selectedSlot) return;
                  const currentTime = selectedSlot.time.split(':');
                  const currentHour24 = parseInt(currentTime[0]);
                  let newHour24;
                  
                  if (currentHour24 >= 12) {
                    newHour24 = currentHour24 === 12 ? 0 : currentHour24 - 12;
                  } else {
                    newHour24 = currentHour24 === 0 ? 12 : currentHour24 + 12;
                  }
                  
                  const hourStr = String(newHour24).padStart(2, '0');
                  handleTimeSlotClick(`${hourStr}:${currentTime[1]}`);
                }}
                className="px-3 py-1 bg-[hsl(258_46%_25%)] text-white text-xs font-bold rounded hover:bg-[hsl(258_46%_30%)] transition-colors min-w-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedSlot && parseInt(selectedSlot.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
              </button>
                </div>
              </div>

              {/* End Time Picker */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">End</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                <select
                  disabled={!selectedEndTime}
                  className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => {
                    if (!selectedEndTime) return;
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
                  value={selectedEndTime ? (() => {
                    const hour24 = parseInt(selectedEndTime.split(':')[0]);
                    if (hour24 === 0) return '12';
                    if (hour24 > 12) return String(hour24 - 12);
                    return String(hour24);
                  })() : '10'}
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
                  <svg className="w-3 h-3 text-[hsl(258_46%_25%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <span className="text-sm font-bold text-[hsl(258_46%_25%)]">:</span>

              <div className="relative">
                <select
                  disabled={!selectedEndTime}
                  className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => {
                    if (!selectedEndTime) return;
                    const minute = e.target.value;
                    const currentHour = selectedEndTime.split(':')[0];
                    setSelectedEndTime(`${currentHour}:${minute}`);
                  }}
                  value={selectedEndTime ? selectedEndTime.split(':')[1] : '00'}
                >
                  <option value="00">00</option>
                  <option value="30">30</option>
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-[hsl(258_46%_25%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                disabled={!selectedEndTime}
                onClick={() => {
                  if (!selectedEndTime) return;
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
                className="px-3 py-1 bg-[hsl(258_46%_25%)] text-white text-xs font-bold rounded hover:bg-[hsl(258_46%_30%)] transition-colors min-w-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {selectedEndTime && parseInt(selectedEndTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                </button>
                  </div>
                </div>
              </div>

              {/* Validation Feedback */}
              {selectedSlot && selectedEndTime && (
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
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between gap-3 sm:justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSlot || !selectedEndTime || !currentValidation.isValid || isSubmitting}
            className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Reason Confirmation Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)]">
              Confirm Reschedule
            </DialogTitle>
            <DialogDescription className="text-[hsl(258_22%_50%)]">
              Review the new appointment schedule and add a note for the patient (optional)
            </DialogDescription>
          </DialogHeader>
          
          {/* New Schedule Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">New Appointment Schedule</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Date:</span>
                <span className="text-sm font-bold text-[hsl(258_46%_25%)]">
                  {selectedDay ? selectedDay.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Start Time:</span>
                <span className="text-sm font-bold text-[hsl(258_46%_25%)]">
                  {selectedSlot ? formatTime(selectedSlot.time) : 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">End Time:</span>
                <span className="text-sm font-bold text-[hsl(258_46%_25%)]">
                  {selectedEndTime ? formatTime(selectedEndTime) : 'Not selected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="py-2">
            <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
              Note to Patient (Optional)
            </label>
            <textarea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="e.g., Doctor had an emergency, rescheduling for your convenience..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:border-transparent resize-none"
              autoFocus
            />
            <p className="text-xs text-[hsl(258_22%_50%)] mt-1">
              This note will be visible to the patient in their appointment history.
            </p>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReasonDialog(false)}
              disabled={isSubmitting}
              className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmReschedule}
              disabled={isSubmitting}
              className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
