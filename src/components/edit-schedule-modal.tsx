"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, AlertCircle, Save } from "lucide-react";

interface ScheduleDay {
  availability_id: string;
  doctor_id: string;
  day: string;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
}

interface EditScheduleModalProps {
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

type WeekSchedule = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
    startTime: string;
    endTime: string;
  };
};

export default function EditScheduleModal({
  doctorId,
  isOpen,
  onClose,
  onSave,
}: EditScheduleModalProps) {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({}); // Individual errors per day
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Selected days (enabled days)
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  // Week schedule with times
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({
    monday: { startTime: '09:00 AM', endTime: '05:00 PM' },
    tuesday: { startTime: '09:00 AM', endTime: '05:00 PM' },
    wednesday: { startTime: '09:00 AM', endTime: '05:00 PM' },
    thursday: { startTime: '09:00 AM', endTime: '05:00 PM' },
    friday: { startTime: '09:00 AM', endTime: '05:00 PM' },
    saturday: { startTime: '09:00 AM', endTime: '05:00 PM' },
    sunday: { startTime: '09:00 AM', endTime: '05:00 PM' },
  });

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch schedule data
  useEffect(() => {
    if (isOpen && doctorId) {
      fetchSchedule();
    }
  }, [isOpen, doctorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('doc_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day');

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setSchedule(data);
        
        // Populate selectedDays and weekSchedule from fetched data
        const enabledDays: string[] = [];
        const newSchedule: WeekSchedule = { ...weekSchedule };

        data.forEach((day) => {
          const dayName = day.day.charAt(0).toUpperCase() + day.day.slice(1).toLowerCase();
          const dayKey = day.day.toLowerCase() as keyof WeekSchedule;

          if (day.is_enabled) {
            enabledDays.push(dayName);
          }

          // Convert 24h to 12h format
          newSchedule[dayKey] = {
            startTime: convertTo12Hour(day.start_time),
            endTime: convertTo12Hour(day.end_time),
          };
        });

        setSelectedDays(enabledDays);
        setWeekSchedule(newSchedule);
      } else {
        setError('No schedule data found');
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError(err.message || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '09:00 AM';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;

    const period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Helper: Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    const [timePart, period] = time12h.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  // Helper: Parse time string to components
  const parseTime = (timeString: string): { hour: string; minute: string; period: string } => {
    const [time, period] = timeString.split(' ');
    const [hour, minute] = time.split(':');
    return { hour, minute, period };
  };

  // Helper: Build time string from components
  const buildTimeString = (hour: string, minute: string, period: string): string => {
    return `${hour.padStart(2, '0')}:${minute} ${period}`;
  };

  // Helper: Sort days in week order
  const sortDaysInWeekOrder = (days: string[]): string[] => {
    return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  };

  // Toggle day selection
  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      const isRemoving = prev.includes(day);
      
      // If removing the day, also clear any error for it
      if (isRemoving) {
        setScheduleErrors(prevErrors => {
          const updated = { ...prevErrors };
          delete updated[day];
          return updated;
        });
      }
      
      return isRemoving ? prev.filter((d) => d !== day) : [...prev, day];
    });
  };

  // Update time component
  const updateTimeComponent = (
    day: string,
    field: 'startTime' | 'endTime',
    component: 'hour' | 'minute' | 'period',
    value: string
  ) => {
    // Clear error for this specific day
    setScheduleErrors(prev => {
      const updated = { ...prev };
      delete updated[day];
      return updated;
    });

    const dayKey = day.toLowerCase() as keyof WeekSchedule;
    const currentTime = weekSchedule[dayKey][field];
    const parsed = parseTime(currentTime);

    const updatedTime = {
      hour: component === 'hour' ? value : parsed.hour,
      minute: component === 'minute' ? value : parsed.minute,
      period: component === 'period' ? value : parsed.period,
    };

    const newTimeString = buildTimeString(updatedTime.hour, updatedTime.minute, updatedTime.period);

    setWeekSchedule((prev) => {
      const updated = {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          [field]: newTimeString,
        },
      };

      // Validate that end time is after start time
      const schedule = updated[dayKey];
      const start24 = convertTo24Hour(schedule.startTime);
      const end24 = convertTo24Hour(schedule.endTime);
      
      if (!isValidTimeRange(start24, end24)) {
        // Set error for this specific day
        setScheduleErrors(prevErrors => ({
          ...prevErrors,
          [day]: 'End time must be later than start time'
        }));
      }

      return updated;
    });
  };

  // Validate time range
  const isValidTimeRange = (startTime: string, endTime: string): boolean => {
    const parseTime = (time: string): number => {
      const [hoursStr, minutesStr] = time.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      return hours * 60 + minutes;
    };

    return parseTime(endTime) > parseTime(startTime);
  };

  // Save changes
  const handleSave = async () => {
    // Validate all enabled days
    const errors: Record<string, string> = {};
    
    for (const day of selectedDays) {
      const dayKey = day.toLowerCase() as keyof WeekSchedule;
      const schedule = weekSchedule[dayKey];
      const start24 = convertTo24Hour(schedule.startTime);
      const end24 = convertTo24Hour(schedule.endTime);
      
      if (!isValidTimeRange(start24, end24)) {
        errors[day] = 'End time must be later than start time';
      }
    }

    if (Object.keys(errors).length > 0) {
      setScheduleErrors(errors);
      // Don't set global error, let individual day errors show
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Update all 7 days
      const updates = schedule.map(day => {
        const dayName = day.day.charAt(0).toUpperCase() + day.day.slice(1).toLowerCase();
        const dayKey = day.day.toLowerCase() as keyof WeekSchedule;
        const isEnabled = selectedDays.includes(dayName);

        return {
          availability_id: day.availability_id,
          doctor_id: doctorId,
          day: day.day,
          start_time: convertTo24Hour(weekSchedule[dayKey].startTime),
          end_time: convertTo24Hour(weekSchedule[dayKey].endTime),
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        };
      });

      const { error: updateError } = await supabase
        .from('doc_availability')
        .upsert(updates, { onConflict: 'availability_id' });

      if (updateError) throw updateError;

      // Success!
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[hsl(258_22%_90%)] p-6 flex items-center justify-between z-10 shadow-sm">
          <div>
            <h3 className="text-xl font-semibold text-[hsl(258_46%_25%)]">
              Edit Weekly Availability
            </h3>
            <p className="text-sm text-[hsl(258_22%_50%)] mt-1">
              Update your schedule for each day of the week
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] cursor-pointer active:scale-90 transition-all disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              {/* Pulsating logo loading animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-10 animate-pulse"></div>
                <div className="absolute inset-2 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
                  <div className="animate-fade-in-out">
                    <img
                      src="/logo-white-outline.png"
                      alt="Loading"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[hsl(258_22%_50%)]">Loading schedule...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !isLoading && (
          <div className="p-6">
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Schedule Editor */}
        {!isLoading && schedule.length > 0 && (
          <div className="p-6">
            <div className="space-y-4">
              {/* Day Selector Buttons */}
              <div>
                <Label>Select Days</Label>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Click to enable or disable each day. Set times for enabled days below.
                </p>
                <div className="flex flex-wrap gap-2">
                  {dayOrder.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      disabled={isSaving}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedDays.includes(day)
                          ? 'bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_22%)]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Pickers for Selected Days */}
              {selectedDays.length > 0 && (
                <div className="mt-6 space-y-3">
                  <Label>Set Times for Enabled Days</Label>
                  {sortDaysInWeekOrder(selectedDays).map((day) => {
                    const dayKey = day.toLowerCase() as keyof WeekSchedule;
                    const daySchedule = weekSchedule[dayKey];
                    
                    const startTime = parseTime(daySchedule.startTime);
                    const endTime = parseTime(daySchedule.endTime);

                    return (
                      <div key={day} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">{day}</h4>
                        
                        {/* Single row layout */}
                        <div className="flex items-center gap-10 flex-wrap">
                          {/* Start Time Section */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Hour - Custom Dropdown */}
                              <div className="relative custom-dropdown">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === `${day}-start-hour` ? null : `${day}-start-hour`)}
                                  disabled={isSaving}
                                  className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {startTime.hour}
                                </button>
                                {openDropdown === `${day}-start-hour` && (
                                  <div className="absolute z-50 mt-1 w-16 max-h-48 overflow-y-auto bg-white border-2 border-[hsl(258_46%_25%/0.2)] rounded-lg shadow-lg">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                                      const hourStr = hour.toString().padStart(2, '0');
                                      return (
                                        <button
                                          key={hour}
                                          type="button"
                                          onClick={() => {
                                            updateTimeComponent(day, 'startTime', 'hour', hourStr);
                                            setOpenDropdown(null);
                                          }}
                                          className={`w-full px-2 py-1.5 text-sm text-center transition-all hover:bg-[hsl(258_46%_95%)] ${
                                            startTime.hour === hourStr
                                              ? 'bg-[hsl(258_46%_25%)] text-white font-semibold'
                                              : 'text-[hsl(258_46%_25%)]'
                                          }`}
                                        >
                                          {hourStr}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              
                              <span className="text-gray-400 font-semibold">:</span>
                              
                              {/* Minute - Custom Dropdown */}
                              <div className="relative custom-dropdown">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === `${day}-start-minute` ? null : `${day}-start-minute`)}
                                  disabled={isSaving}
                                  className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {startTime.minute}
                                </button>
                                {openDropdown === `${day}-start-minute` && (
                                  <div className="absolute z-50 mt-1 w-16 bg-white border-2 border-[hsl(258_46%_25%/0.2)] rounded-lg shadow-lg">
                                    {['00', '15', '30', '45'].map((minute) => (
                                      <button
                                        key={minute}
                                        type="button"
                                        onClick={() => {
                                          updateTimeComponent(day, 'startTime', 'minute', minute);
                                          setOpenDropdown(null);
                                        }}
                                        className={`w-full px-2 py-1.5 text-sm text-center transition-all hover:bg-[hsl(258_46%_95%)] ${
                                          startTime.minute === minute
                                            ? 'bg-[hsl(258_46%_25%)] text-white font-semibold'
                                            : 'text-[hsl(258_46%_25%)]'
                                        }`}
                                      >
                                        {minute}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* AM/PM - Toggle Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const newPeriod = startTime.period === 'AM' ? 'PM' : 'AM';
                                  updateTimeComponent(day, 'startTime', 'period', newPeriod);
                                }}
                                disabled={isSaving}
                                className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-semibold hover:border-[hsl(258_46%_25%/0.5)] hover:bg-[hsl(258_46%_95%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {startTime.period}
                              </button>
                            </div>
                          </div>

                          {/* "to" separator */}
                          <span className="text-sm text-gray-500 font-medium">to</span>

                          {/* End Time Section */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Hour - Custom Dropdown */}
                              <div className="relative custom-dropdown">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === `${day}-end-hour` ? null : `${day}-end-hour`)}
                                  disabled={isSaving}
                                  className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {endTime.hour}
                                </button>
                                {openDropdown === `${day}-end-hour` && (
                                  <div className="absolute z-50 mt-1 w-16 max-h-48 overflow-y-auto bg-white border-2 border-[hsl(258_46%_25%/0.2)] rounded-lg shadow-lg">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                                      const hourStr = hour.toString().padStart(2, '0');
                                      return (
                                        <button
                                          key={hour}
                                          type="button"
                                          onClick={() => {
                                            updateTimeComponent(day, 'endTime', 'hour', hourStr);
                                            setOpenDropdown(null);
                                          }}
                                          className={`w-full px-2 py-1.5 text-sm text-center transition-all hover:bg-[hsl(258_46%_95%)] ${
                                            endTime.hour === hourStr
                                              ? 'bg-[hsl(258_46%_25%)] text-white font-semibold'
                                              : 'text-[hsl(258_46%_25%)]'
                                          }`}
                                        >
                                          {hourStr}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              
                              <span className="text-gray-400 font-semibold">:</span>
                              
                              {/* Minute - Custom Dropdown */}
                              <div className="relative custom-dropdown">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === `${day}-end-minute` ? null : `${day}-end-minute`)}
                                  disabled={isSaving}
                                  className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {endTime.minute}
                                </button>
                                {openDropdown === `${day}-end-minute` && (
                                  <div className="absolute z-50 mt-1 w-16 bg-white border-2 border-[hsl(258_46%_25%/0.2)] rounded-lg shadow-lg">
                                    {['00', '15', '30', '45'].map((minute) => (
                                      <button
                                        key={minute}
                                        type="button"
                                        onClick={() => {
                                          updateTimeComponent(day, 'endTime', 'minute', minute);
                                          setOpenDropdown(null);
                                        }}
                                        className={`w-full px-2 py-1.5 text-sm text-center transition-all hover:bg-[hsl(258_46%_95%)] ${
                                          endTime.minute === minute
                                            ? 'bg-[hsl(258_46%_25%)] text-white font-semibold'
                                            : 'text-[hsl(258_46%_25%)]'
                                        }`}
                                      >
                                        {minute}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* AM/PM - Toggle Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const newPeriod = endTime.period === 'AM' ? 'PM' : 'AM';
                                  updateTimeComponent(day, 'endTime', 'period', newPeriod);
                                }}
                                disabled={isSaving}
                                className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-semibold hover:border-[hsl(258_46%_25%/0.5)] hover:bg-[hsl(258_46%_95%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {endTime.period}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Individual Error Message for this day */}
                        {scheduleErrors[day] && (
                          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {scheduleErrors[day]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedDays.length === 0 && (
                <p className="text-sm text-gray-500 italic mt-4">
                  No days selected. Click the day buttons above to enable availability.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!isLoading && (
          <div className="sticky bottom-0 bg-white border-t border-[hsl(258_22%_90%)] p-6 flex justify-end gap-3 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="!bg-white hover:!bg-gray-50 cursor-pointer active:scale-95 transition-all border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || Object.keys(scheduleErrors).length > 0}
              className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_22%)] text-white cursor-pointer active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
