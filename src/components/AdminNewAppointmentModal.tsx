"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Calendar as CalendarIcon, Clock, ArrowLeft, FileText, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Patient {
  patient_id: string;
  user_id: string;
  users: {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}

interface DoctorAvailability {
  day: string;
  startTime: string;
  endTime: string;
}

interface BookedAppointment {
  appointment_id: string;
  requested_start_time: string;
  booked_start_time?: string;
  booked_end_time?: string;
  status: string;
}

interface AdminNewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  doctorId?: string;
  doctorName?: string;
}

type Step = 'search' | 'schedule';

// Helper functions
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

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

export function AdminNewAppointmentModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  doctorId: initialDoctorId,
  doctorName: initialDoctorName 
}: AdminNewAppointmentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Doctor info
  const [doctorId, setDoctorId] = useState(initialDoctorId || '');
  const [doctorName, setDoctorName] = useState(initialDoctorName || '');

  // Calendar schedule selection
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(today));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Concern
  const [concern, setConcern] = useState('');

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

  // Load patients when modal opens
  useEffect(() => {
    if (open) {
      loadPatients();
      loadDoctorInfo();
    } else {
      resetModal();
    }
  }, [open]);

  // Filter patients based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient => {
        const fullName = `${patient.users.first_name} ${patient.users.middle_name} ${patient.users.last_name}`.toLowerCase();
        const email = patient.users.email.toLowerCase();
        const phone = patient.users.phone_number.toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      });
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  // Fetch doctor availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!open || !doctorId) return;

      setIsLoadingAvailability(true);
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('doc_availability')
          .select('day, start_time, end_time')
          .eq('doctor_id', doctorId)
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
  }, [open, doctorId]);

  // Fetch booked appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!open || !doctorId) return;

      setIsLoadingAppointments(true);
      try {
        const supabase = createClient();
        
        const startOfWeek1 = getWeekStart(today);
        const endOfWeek12 = new Date(startOfWeek1);
        endOfWeek12.setDate(startOfWeek1.getDate() + (12 * 7));

        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_id, requested_start_time, booked_start_time, booked_end_time, status')
          .eq('doctor_id', doctorId)
          .gte('booked_start_time', startOfWeek1.toISOString())
          .lt('booked_start_time', endOfWeek12.toISOString())
          .in('status', ['booked', 'arrived', 'ongoing', 'completed'])
          .order('booked_start_time', { ascending: true });

        if (error) {
          console.error('Error fetching appointments:', error);
          setBookedAppointments([]);
        } else {
          console.log('📋 ALL FETCHED APPOINTMENTS FOR VALIDATION:', {
            doctorId,
            totalAppointments: data?.length || 0,
            appointments: data?.map(apt => ({
              appointment_id: apt.appointment_id,
              status: apt.status,
              booked_start_time: apt.booked_start_time,
              booked_end_time: apt.booked_end_time,
              requested_start_time: apt.requested_start_time
            }))
          });
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
  }, [open, doctorId]);

  const resetModal = () => {
    setCurrentStep('search');
    setSearchQuery('');
    setSelectedPatient(null);
    setSelectedDay(null);
    setSelectedTime('');
    setSelectedEndTime('');
    setConcern('');
    setError(null);
    setCurrentWeekStart(getWeekStart(today));
    setShowConfirmDialog(false);
  };

  // Validation: Check if selected time range is valid
  const validateSelectedTime = useCallback((date: Date | null, startTime: string, endTime: string): { isValid: boolean; errorMessage: string } => {
    if (!date || !startTime || !endTime) {
      return { isValid: false, errorMessage: '' };
    }

    // Get doctor availability for the selected day
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const availability = doctorAvailability.find((avail) => avail.day === dayName);
    
    if (!availability) {
      return { isValid: false, errorMessage: 'No availability for this day' };
    }

    // Parse times to minutes for comparison
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    // Parse doctor's working hours
    const [docStartHour, docStartMin] = availability.startTime.split(':').map(Number);
    const [docEndHour, docEndMin] = availability.endTime.split(':').map(Number);
    const docStartInMinutes = docStartHour * 60 + docStartMin;
    const docEndInMinutes = docEndHour * 60 + docEndMin;

    // 1. Check if end time is after start time
    if (endTimeInMinutes <= startTimeInMinutes) {
      return { 
        isValid: false, 
        errorMessage: 'End time must be after start time' 
      };
    }

    // 2. Check minimum duration (30 minutes)
    const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
    if (durationInMinutes < 30) {
      return { 
        isValid: false, 
        errorMessage: 'Appointment duration must be at least 30 minutes' 
      };
    }

    // 3. Check if start time is within working hours
    if (startTimeInMinutes < docStartInMinutes) {
      return { 
        isValid: false, 
        errorMessage: `Start time must be at or after ${formatTime(availability.startTime)}` 
      };
    }

    // 4. Check if end time is within working hours
    if (endTimeInMinutes > docEndInMinutes) {
      return { 
        isValid: false, 
        errorMessage: `End time must be at or before ${formatTime(availability.endTime)}` 
      };
    }

    // 5. Check for collision with existing appointments
    const dateStr = formatLocalDate(date);
    
    console.log('🔍 Validation Debug:', {
      selectedDate: dateStr,
      selectedStartTime: startTime,
      selectedEndTime: endTime,
      startTimeInMinutes,
      endTimeInMinutes,
      totalBookedAppointments: bookedAppointments.length
    });
    
    const conflictingAppointments = bookedAppointments.filter((appointment) => {
      // Skip appointments without booked times
      if (!appointment.booked_start_time || !appointment.booked_end_time) return false;
      
      const appointmentDate = new Date(appointment.booked_start_time);
      const appointmentDateStr = formatLocalDate(appointmentDate);
      
      // Only check appointments on the same day
      if (appointmentDateStr !== dateStr) return false;

      const appointmentStartTime = new Date(appointment.booked_start_time);
      const appointmentEndTime = new Date(appointment.booked_end_time);
      
      const appointmentStartHour = appointmentStartTime.getHours();
      const appointmentStartMin = appointmentStartTime.getMinutes();
      const appointmentEndHour = appointmentEndTime.getHours();
      const appointmentEndMin = appointmentEndTime.getMinutes();
      
      const appointmentStartInMinutes = appointmentStartHour * 60 + appointmentStartMin;
      const appointmentEndInMinutes = appointmentEndHour * 60 + appointmentEndMin;

      const hasOverlap = startTimeInMinutes < appointmentEndInMinutes && endTimeInMinutes > appointmentStartInMinutes;
      
      console.log('  📅 Checking appointment:', {
        appointmentId: appointment.appointment_id,
        appointmentDate: appointmentDateStr,
        appointmentStart: `${appointmentStartHour}:${appointmentStartMin.toString().padStart(2, '0')}`,
        appointmentEnd: `${appointmentEndHour}:${appointmentEndMin.toString().padStart(2, '0')}`,
        appointmentStartInMinutes,
        appointmentEndInMinutes,
        hasOverlap
      });

      // Check if the selected time slot overlaps with this appointment
      // Overlap occurs if: newStart < existingEnd AND newEnd > existingStart
      return hasOverlap;
    });
    
    console.log('❌ Conflicting appointments found:', conflictingAppointments.length);

    if (conflictingAppointments.length > 0) {
      // Show details of ALL conflicting appointments
      console.log('🚨 CONFLICTING APPOINTMENTS DETAILS:');
      conflictingAppointments.forEach((conflict, index) => {
        console.log(`\n  Conflict #${index + 1}:`, {
          appointment_id: conflict.appointment_id,
          status: conflict.status,
          booked_start_time: conflict.booked_start_time,
          booked_end_time: conflict.booked_end_time,
          requested_start_time: conflict.requested_start_time,
          'Database Query': `SELECT * FROM appointments WHERE appointment_id = '${conflict.appointment_id}';`
        });
      });
      
      // Show details of the first conflicting appointment
      const firstConflict = conflictingAppointments[0];
      const conflictStart = new Date(firstConflict.booked_start_time!);
      const conflictEnd = new Date(firstConflict.booked_end_time!);
      
      const conflictStartStr = `${conflictStart.getHours()}:${conflictStart.getMinutes().toString().padStart(2, '0')}`;
      const conflictEndStr = `${conflictEnd.getHours()}:${conflictEnd.getMinutes().toString().padStart(2, '0')}`;
      
      return { 
        isValid: false, 
        errorMessage: 'Conflicts with existing appointment' 
      };
    }

    // All validations passed
    return { isValid: true, errorMessage: '' };
  }, [doctorAvailability, bookedAppointments]);

  // Get current validation state
  const currentValidation = useMemo(() => {
    if (!selectedDay || !selectedTime || !selectedEndTime) {
      return { isValid: false, errorMessage: '' };
    }
    return validateSelectedTime(selectedDay, selectedTime, selectedEndTime);
  }, [selectedDay, selectedTime, selectedEndTime, validateSelectedTime]);

  const loadDoctorInfo = async () => {
    if (initialDoctorId && initialDoctorName) {
      setDoctorId(initialDoctorId);
      setDoctorName(initialDoctorName);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      if (userData.role === 'dentist') {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('doctor_id, users!inner(first_name, last_name)')
          .eq('user_id', userData.user_id)
          .single();

        if (doctorData) {
          const dId = doctorData.doctor_id;
          const doctorUser = doctorData.users as any;
          const dName = `Dr. ${doctorUser.last_name}`;
          setDoctorId(dId);
          setDoctorName(dName);
        }
      }
    } catch (err) {
      console.error('Error loading doctor info:', err);
    }
  };

  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('patient')
        .select(`
          patient_id,
          user_id,
          users!inner (
            first_name,
            middle_name,
            last_name,
            email,
            phone_number
          )
        `);

      if (error) throw error;

      const transformedData = (data || []).map((patient: any) => ({
        patient_id: patient.patient_id,
        user_id: patient.user_id,
        users: patient.users
      })) as Patient[];

      setPatients(transformedData);
      setFilteredPatients(transformedData);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Failed to load patients');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const getDayAvailability = useCallback((date: Date): DoctorAvailability | null => {
    const dayName = getDayName(date);
    return doctorAvailability.find((avail) => avail.day === dayName) || null;
  }, [doctorAvailability]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentStep('schedule');
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
    
    if (!isPast && availability) {
      if (selectedDay?.toDateString() === date.toDateString()) {
        setSelectedDay(null);
        setSelectedTime('');
        setSelectedEndTime('');
      } else {
        setSelectedDay(date);
        const currentTime = '09:00';
        setSelectedTime(currentTime);
        const [hours, minutes] = currentTime.split(':').map(Number);
        const endHour = hours + 1;
        setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDay || !selectedTime || !concern.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const supabase = createClient();

      const dateStr = formatLocalDate(selectedDay);
      const startDateTime = `${dateStr}T${selectedTime}:00+08:00`;
      const endDateTime = selectedEndTime ? `${dateStr}T${selectedEndTime}:00+08:00` : null;

      // Since dentist/staff is creating this (for walk-in), set status to 'booked' immediately
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: selectedPatient.patient_id,
          doctor_id: doctorId,
          requested_start_time: startDateTime,
          booked_start_time: startDateTime,
          booked_end_time: endDateTime,
          status: 'booked',
          concern: concern.trim(),
          is_active: true
        });

      if (insertError) throw insertError;

      setShowConfirmDialog(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      resetModal();
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'schedule') {
      setCurrentStep('search');
    }
  };

  const handleContinueToConfirm = () => {
    if (selectedDay && selectedTime) {
      setShowConfirmDialog(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[hsl(258_46%_25%)] flex items-center gap-2">
            {currentStep === 'search' && (
              <>
                <User className="h-6 w-6" />
                Select Patient
              </>
            )}
            {currentStep === 'schedule' && (
              <>
                <Clock className="h-6 w-6" />
                New Appointment
              </>
            )}
          </DialogTitle>
          {currentStep === 'schedule' && selectedPatient && (
            <DialogDescription className="text-[hsl(258_22%_50%)]">
              Select date and time for {selectedPatient.users.first_name} {selectedPatient.users.last_name}'s appointment with {doctorName}.
            </DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Patient Search */}
        {currentStep === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-base"
              />
            </div>

            <div className="border border-gray-200 rounded-lg min-h-[400px] max-h-[400px] overflow-y-auto">
              {isLoadingPatients ? (
                <div className="p-8 text-center text-gray-500">Loading patients...</div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No patients found matching your search' : 'No patients available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.patient_id}
                      onClick={() => handlePatientSelect(patient)}
                      className="w-full p-4 hover:bg-purple-50 transition-colors text-left flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">
                          {`${patient.users.first_name} ${patient.users.middle_name || ''} ${patient.users.last_name}`.trim()}
                        </div>
                        <div className="text-sm text-gray-600">{patient.users.email}</div>
                        <div className="text-sm text-gray-500">{patient.users.phone_number}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Calendar Schedule Selection */}
        {currentStep === 'schedule' && selectedPatient && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Week Navigation */}
            <div className="border-b border-gray-200 bg-white py-2">
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

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto pt-0.5 pb-2">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Day Headers */}
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
                        {/* Selection border */}
                        {isSelected && (
                          <>
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500 z-30" />
                            <div className="absolute top-0 bottom-0 right-0 w-1 bg-blue-500 z-30" />
                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 z-30" />
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 z-30" />
                          </>
                        )}

                        {/* Hour grid lines */}
                        {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
                          <div
                            key={hour}
                            className="h-12 border-b border-gray-200 last:border-b-0"
                          />
                        ))}

                        {/* Availability overlay */}
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

                        {/* Booked Appointments overlay */}
                        {bookedAppointments
                          .filter((apt) => {
                            if (!apt.booked_start_time) return false;
                            const aptDate = new Date(apt.booked_start_time);
                            return formatLocalDate(aptDate) === formatLocalDate(date);
                          })
                          .map((apt) => {
                            const startTime = new Date(apt.booked_start_time!);
                            const endTime = new Date(apt.booked_end_time!);
                            
                            const startHour = startTime.getHours();
                            const startMin = startTime.getMinutes();
                            const endHour = endTime.getHours();
                            const endMin = endTime.getMinutes();
                            
                            const topOffset = ((startHour - 6) * 48) + ((startMin / 60) * 48);
                            const durationHours = (endHour - startHour) + ((endMin - startMin) / 60);
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

                        {/* New Appointment Preview */}
                        {selectedDay && selectedTime && selectedEndTime && currentValidation.isValid && 
                         formatLocalDate(date) === formatLocalDate(selectedDay) && (() => {
                          const [startHour, startMin] = selectedTime.split(':').map(Number);
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
                                  New Appointment
                                </span>
                                <p className="text-[10px] font-semibold text-[hsl(258_46%_25%)] mt-0.5">
                                  {formatTime(selectedTime)} - {formatTime(selectedEndTime)}
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

            {/* Time Selection Bar */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3">
              <div className="flex items-stretch justify-center gap-4">
                {/* Date Info */}
                <div className="px-4 py-2 bg-white rounded border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 min-w-[180px]">
                      <p className="text-xs font-medium text-gray-600 mb-1">Date</p>
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
                            disabled={!selectedDay}
                            className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            onChange={(e) => {
                              if (!selectedTime) return;
                              const hour12 = parseInt(e.target.value);
                              const currentTime = selectedTime.split(':');
                              const currentHour24 = parseInt(currentTime[0]);
                              const isPM = currentHour24 >= 12;
                              
                              let newHour24 = hour12;
                              if (isPM) {
                                newHour24 = hour12 === 12 ? 12 : hour12 + 12;
                              } else {
                                newHour24 = hour12 === 12 ? 0 : hour12;
                              }
                              
                              const hourStr = String(newHour24).padStart(2, '0');
                              const newTime = `${hourStr}:${currentTime[1]}`;
                              setSelectedTime(newTime);
                              const [hours, minutes] = newTime.split(':').map(Number);
                              const endHour = hours + 1;
                              setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                            }}
                            value={selectedTime ? (() => {
                              const hour24 = parseInt(selectedTime.split(':')[0]);
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
                            disabled={!selectedDay}
                            className="appearance-none px-2 py-1 pr-6 text-xs font-bold border border-[hsl(258_46%_25%)] rounded bg-white text-[hsl(258_46%_25%)] focus:outline-none focus:ring-1 focus:ring-[hsl(258_46%_25%)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            onChange={(e) => {
                              if (!selectedTime) return;
                              const minute = e.target.value;
                              const currentHour = selectedTime.split(':')[0];
                              const newTime = `${currentHour}:${minute}`;
                              setSelectedTime(newTime);
                              const [hours, minutes] = newTime.split(':').map(Number);
                              const endHour = hours + 1;
                              setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                            }}
                            value={selectedTime ? selectedTime.split(':')[1] : '00'}
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
                          disabled={!selectedDay}
                          onClick={() => {
                            if (!selectedTime) return;
                            const currentTime = selectedTime.split(':');
                            const currentHour24 = parseInt(currentTime[0]);
                            let newHour24;
                            
                            if (currentHour24 >= 12) {
                              newHour24 = currentHour24 === 12 ? 0 : currentHour24 - 12;
                            } else {
                              newHour24 = currentHour24 === 0 ? 12 : currentHour24 + 12;
                            }
                            
                            const hourStr = String(newHour24).padStart(2, '0');
                            const newTime = `${hourStr}:${currentTime[1]}`;
                            setSelectedTime(newTime);
                            const [hours, minutes] = newTime.split(':').map(Number);
                            const endHour = hours + 1;
                            setSelectedEndTime(`${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                          }}
                          className="px-3 py-1 bg-[hsl(258_46%_25%)] text-white text-xs font-bold rounded hover:bg-[hsl(258_46%_30%)] transition-colors min-w-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {selectedTime && parseInt(selectedTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
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
                  {selectedDay && selectedTime && selectedEndTime && (
                    <div className="mt-3">
                      {!currentValidation.isValid && currentValidation.errorMessage && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-red-700 font-medium leading-relaxed">
                            {currentValidation.errorMessage}
                          </p>
                        </div>
                      )}

                      {currentValidation.isValid && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-xs text-green-700 font-medium leading-relaxed">
                            Time slot available!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <DialogFooter className="flex flex-row justify-between gap-3 sm:justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleContinueToConfirm}
                disabled={!selectedDay || !selectedTime || !currentValidation.isValid}
                className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50"
              >
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[hsl(258_46%_25%)]">
              Confirm New Appointment
            </DialogTitle>
            <DialogDescription className="text-[hsl(258_22%_50%)]">
              Review the appointment details and add a concern or reason for visit
            </DialogDescription>
          </DialogHeader>
          
          {/* Appointment Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">New Appointment Schedule</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Patient:</span>
                <span className="text-sm font-bold text-[hsl(258_46%_25%)]">
                  {selectedPatient ? `${selectedPatient.users.first_name} ${selectedPatient.users.middle_name || ''} ${selectedPatient.users.last_name}`.trim() : 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Doctor:</span>
                <span className="text-sm font-bold text-[hsl(258_46%_25%)]">
                  {doctorName || 'Not selected'}
                </span>
              </div>
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
                  {selectedTime ? formatTime(selectedTime) : 'Not selected'}
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
              Concern / Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Enter the patient's concern or reason for the appointment..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:border-transparent resize-none"
              autoFocus
            />
            <p className="text-xs text-[hsl(258_22%_50%)] mt-1">
              This will be saved with the appointment details.
            </p>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
              className="border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.08)]"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!concern.trim() || isSubmitting}
              className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_30%)] disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
