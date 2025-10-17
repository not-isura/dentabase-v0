'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScheduleSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  doctorSchedules: Array<{
    availabilityId: string;
    day: string;
    dayLabel: string;
    startTime: string;
    endTime: string;
  }>;
  onBack: () => void;
  onScheduleSelect?: (scheduleData: any) => void;
}

interface DoctorAvailability {
  day: string;
  startTime: string;
  endTime: string;
}

// Helper functions for date manipulation
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Get Sunday
  return new Date(d.setDate(diff));
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

// Generate time slots between start and end time
const generateTimeSlots = (startTime: string, endTime: string, intervalMinutes: number = 30): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeStr);
    
    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }
  
  return slots;
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

export default function ScheduleSelectionModal({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  doctorSchedules,
  onBack,
  onScheduleSelect,
}: ScheduleSelectionModalProps) {
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(today));
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert the passed schedules to the format we need
  const doctorAvailability = useMemo(() => {
    return doctorSchedules.map(schedule => ({
      day: schedule.day.toLowerCase(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));
  }, [doctorSchedules]);

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

  // Get availability for a specific day
  const getDayAvailability = useCallback((date: Date): DoctorAvailability | null => {
    const dayName = getDayName(date);
    return doctorAvailability.find((avail) => avail.day === dayName) || null;
  }, [doctorAvailability]);

  // Mock reserved slots for October 17, 2025
  const isSlotReserved = useCallback((date: Date, time: string): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if it's October 17, 2025
    if (dateStr === '2025-10-17') {
      // Reserved: 7:00 AM - 9:00 AM (exactly 2 hours)
      const reserved7to9 = ['07:00', '07:30', '08:00', '08:30', '09:00'];
      // Reserved: 11:00 AM - 1:00 PM (exactly 2 hours)
      const reserved11to1 = ['11:00', '11:30', '12:00', '12:30', '13:00'];
      
      return [...reserved7to9, ...reserved11to1].includes(time);
    }
    
    return false;
  }, []);

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
    setCurrentWeekStart(newWeekStart);
  };

  const handleWeekSelect = (weekValue: string) => {
    setCurrentWeekStart(new Date(weekValue));
    setIsWeekDropdownOpen(false);
  };

  const toggleWeekDropdown = () => {
    setIsWeekDropdownOpen(!isWeekDropdownOpen);
  };

  const handleNext = () => {
    if (selectedSlot && onScheduleSelect) {
      onScheduleSelect({ 
        doctorId, 
        date: selectedSlot.date,
        time: selectedSlot.time 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[hsl(258_46%_25%)]">
            Select Schedule
          </DialogTitle>
          <DialogDescription className="text-[hsl(258_22%_50%)]">
            Choose a date and time for your appointment with {doctorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Week Navigation Controls */}
          <div className="flex items-center justify-center mb-6 gap-2 relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousWeek}
              disabled={currentWeekStart <= getWeekStart(today)}
              className="h-9 w-9 border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Clickable Week Label with Dropdown */}
            <button
              onClick={toggleWeekDropdown}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-[hsl(258_46%_25%)] bg-white hover:bg-[hsl(258_46%_25%/0.05)] transition-colors"
            >
              <span className="font-semibold text-[hsl(258_46%_25%)] min-w-[200px] text-center">
                {formatDateRange(currentWeekStart)}
              </span>
              <ChevronDown className={`h-4 w-4 text-[hsl(258_46%_25%)] transition-transform ${isWeekDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              className="h-9 w-9 border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Custom Week Dropdown */}
            {isWeekDropdownOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[280px] bg-white border border-[hsl(258_46%_25%)] rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-50">
                {availableWeeks.map((week) => {
                  const isCurrentWeek = new Date(week.value).getTime() === currentWeekStart.getTime();
                  return (
                    <button
                      key={week.value}
                      onClick={() => handleWeekSelect(week.value)}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
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

          {/* Weekly Calendar Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers Row - with Time column */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[hsl(258_46%_25%)]">
              {/* Empty corner cell for time column */}
              <div className="border-r border-[hsl(258_46%_30%)]"></div>
              
              {weekDays.map((date, index) => {
                const dayLabel = getDayLabel(date);
                const dateNumber = getDateNumber(date);
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={`text-center py-3 border-r border-[hsl(258_46%_30%)] last:border-r-0 ${
                      isTodayDate ? 'bg-[hsl(258_46%_20%)]' : ''
                    }`}
                  >
                    <div className="text-white text-xs font-medium uppercase tracking-wide">
                      {dayLabel}
                    </div>
                    {isTodayDate ? (
                      <div className="bg-white text-[hsl(258_46%_25%)] rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1 text-lg font-bold">
                        {dateNumber}
                      </div>
                    ) : (
                      <div className="text-white text-lg font-bold mt-1">
                        {dateNumber}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Schedule Grid with Time Column */}
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

                  return (
                    <div
                      key={dayIndex}
                      className={`border-r border-gray-200 last:border-r-0 relative ${
                        isPast ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      {/* Hour grid lines */}
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour, index) => (
                        <div
                          key={hour}
                          className="h-12 border-b border-gray-200 last:border-b-0"
                        />
                      ))}

                      {/* Working Hours Background Indicator */}
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
                            {/* Top indicator line */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500" />
                            {/* Bottom indicator line */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                            
                            {/* Start time label - ABOVE the top line */}
                            <div className="absolute -top-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(availability.startTime)}
                            </div>
                            {/* End time label - BELOW the bottom line */}
                            <div className="absolute -bottom-5 right-1 bg-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700 shadow-sm">
                              {formatTime(availability.endTime)}
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
                            {/* Render occupied blocks positioned by time */}
                            {(() => {
                              const slots = generateTimeSlots(availability.startTime, availability.endTime, 30);
                              const groups: { reserved: boolean; slots: string[] }[] = [];
                              let currentGroup: { reserved: boolean; slots: string[] } | null = null;

                              // Group consecutive reserved/available slots together
                              slots.forEach((timeSlot) => {
                                const reserved = isSlotReserved(date, timeSlot);
                                
                                if (!currentGroup || currentGroup.reserved !== reserved) {
                                  currentGroup = { reserved, slots: [timeSlot] };
                                  groups.push(currentGroup);
                                } else {
                                  currentGroup.slots.push(timeSlot);
                                }
                              });

                              // Only render reserved blocks
                              return groups
                                .filter(group => group.reserved)
                                .map((group, groupIndex) => {
                                  const startTime = group.slots[0];
                                  const endTime = group.slots[group.slots.length - 1];
                                  
                                  // Calculate position based on start time (6 AM = 0, each hour = 48px)
                                  const [startHour, startMin] = startTime.split(':').map(Number);
                                  const [endHour, endMin] = endTime.split(':').map(Number);
                                  
                                  const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                                  const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
                                  const height = durationHours * 48;
                                  
                                  return (
                                    <div
                                      key={`group-${groupIndex}`}
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
                                          {formatTime(startTime)} - {formatTime(endTime)}
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

        <DialogFooter className="flex flex-row justify-between gap-3 sm:justify-between mt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled
            className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next (Coming Soon)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
