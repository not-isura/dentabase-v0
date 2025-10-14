"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  ArrowLeft,
  UserCheck,
  Plus,
  Search,
  MoreVertical,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

type UserRole = "admin" | "dentist" | "dental_staff" | "patient";
type AccountStatus = "active" | "inactive";

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  details?: string[];
}


interface NewAccount {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  phoneNumber: string;
  gender: 'male' | 'female' | 'other' | 'unspecified';
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  specialization: string;
  licenseNumber: string;
  clinicAssignment: string;
  scheduleAvailability: string;
  designation: string;
  assignedDoctor: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNo: string;
}

const INITIAL_ACCOUNT_STATE: NewAccount = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  tempPassword: "dentabase2025",
  phoneNumber: "",
  gender: "unspecified",
  role: "admin",
  status: "active",
  emailVerified: true,
  specialization: "",
  licenseNumber: "",
  clinicAssignment: "",
  scheduleAvailability: "",
  designation: "",
  assignedDoctor: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNo: ""
};

const ROLE_LABEL_MAP: Record<UserRole, string> = {
  admin: "Admin",
  dentist: "Dentist",
  "dental_staff": "Dental Staff",
  patient: "Patient"
};

interface ExistingUser {
  user_id: string;
  auth_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number?: string;
  gender: string;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at?: string;
  roleData?: any;
}

interface EditUserData extends NewAccount {
  user_id: string;
}

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

function CustomDropdown({ value, onChange, options, placeholder, icon, className = '' }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-full pl-10 pr-4 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white py-2 text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-left flex items-center active:scale-[0.98]"
      >
        {icon && <span className="absolute left-3">{icon}</span>}
        <span>{selectedOption?.label || placeholder}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border-2 border-[hsl(258_46%_25%/0.2)] rounded-lg shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-all cursor-pointer active:scale-[0.98] ${
                option.value === value
                  ? 'bg-[hsl(258_46%_25%)] text-white font-semibold'
                  : 'text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_95%)] font-medium'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountManagementPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAccount, setNewAccount] = useState<NewAccount>(INITIAL_ACCOUNT_STATE);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // New states for validation and confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emergencyPhoneError, setEmergencyPhoneError] = useState('');
  
  // Edit dialog validation states
  const [editPhoneError, setEditPhoneError] = useState('');
  const [editEmergencyPhoneError, setEditEmergencyPhoneError] = useState('');

  // Schedule availability state
  type DaySchedule = { startTime: string; endTime: string };
  type WeekSchedule = {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
  };
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({});
  const [scheduleError, setScheduleError] = useState<string>('');
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({}); // Individual errors per day
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Track which dropdown is open

  // Manage Users Tab State
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchInput, setSearchInput] = useState(''); // Input field value
  const [searchQuery, setSearchQuery] = useState(''); // Actual search query sent to API
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EditUserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true); // true = view mode, false = edit mode
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Protect route - redirect non-admins
  useEffect(() => {
    if (!isLoadingAuth && currentUser && currentUser.role !== 'admin') {
      router.push('/404');
    }
  }, [currentUser, isLoadingAuth, router]);

  // Fetch users when manage tab is active
  useEffect(() => {
    if (activeTab === 'manage' && currentUser?.role === 'admin') {
      fetchUsers();
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [activeTab, roleFilter, statusFilter, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(existingUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = existingUsers.slice(startIndex, endIndex);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Show loading state while checking auth or if unauthorized
  if (isLoadingAuth || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          {/* Pulsating logo loading animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer ripple rings - pulse outward */}
            <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-10 animate-pulse"></div>
            
            {/* Solid purple circle */}
            <div className="absolute inset-2 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
              {/* Logo with fade animation */}
              <div className="animate-fade-in-out">
                <img
                  src="/logo-white-outline.png"
                  alt="Loading"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          </div>
          
          <p className="text-[hsl(258_22%_50%)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setExistingUsers(data.users || []);
      } else {
        showNotification('error', 'Failed to Load Users', data.error || 'Could not fetch users');
        setExistingUsers([]);
      }
    } catch (error: any) {
      showNotification('error', 'Network Error', 'Failed to connect to server');
      setExistingUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch single user details for editing/viewing
  const fetchUserDetails = async (userId: string, viewMode: boolean = true) => {
    // Open modal immediately with loading state
    setShowEditDialog(true);
    setIsViewMode(viewMode);
    setSelectedUser(null); // Clear previous data to show loading
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        const user = data.user;
        const roleData = user.roleData || {};
        
        setSelectedUser({
          user_id: user.user_id,
          firstName: user.first_name,
          middleName: user.middle_name || '',
          lastName: user.last_name,
          email: user.email,
          tempPassword: 'dentabase2025',
          phoneNumber: user.phone_number || '',
          gender: user.gender,
          role: user.role,
          status: user.status,
          emailVerified: true,
          specialization: roleData.specialization || '',
          licenseNumber: roleData.license_number || '',
          clinicAssignment: roleData.clinic_assignment || '',
          scheduleAvailability: roleData.schedule_availability || '',
          designation: roleData.designation || '',
          assignedDoctor: roleData.assigned_doctor || '',
          address: roleData.address || '',
          emergencyContactName: roleData.emergency_contact_name || '',
          emergencyContactNo: roleData.emergency_contact_no || ''
        });
      } else {
        setShowEditDialog(false); // Close modal on error
        showNotification('error', 'Failed to Load User', data.error || 'Could not fetch user details');
      }
    } catch (error: any) {
      setShowEditDialog(false); // Close modal on error
      showNotification('error', 'Network Error', 'Failed to connect to server');
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Validate phone number
    if (selectedUser.phoneNumber && !validatePhoneNumber(selectedUser.phoneNumber)) {
      showNotification('error', 'Invalid Phone Number', 'Phone number must be 11 digits starting with 09.');
      return;
    }

    // Validate role-specific required fields
    if (selectedUser.role === 'dentist') {
      if (!selectedUser.specialization || !selectedUser.licenseNumber) {
        showNotification('error', 'Missing Required Fields', 'Please fill in Specialization and License Number for dentist.');
        return;
      }
    }

    if (selectedUser.role === 'dental_staff') {
      if (!selectedUser.designation || !selectedUser.assignedDoctor) {
        showNotification('error', 'Missing Required Fields', 'Please fill in Position and Assigned Doctor for staff.');
        return;
      }
    }

    if (selectedUser.role === 'patient') {
      if (!selectedUser.emergencyContactNo || !validatePhoneNumber(selectedUser.emergencyContactNo)) {
        showNotification('error', 'Invalid Emergency Contact Number', 'Emergency contact number must be 11 digits starting with 09.');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUser)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(
          'success',
          'User Updated Successfully',
          `${selectedUser.firstName} ${selectedUser.lastName}'s information has been updated.`
        );
        setShowEditDialog(false);
        setSelectedUser(null);
        setIsViewMode(true); // Reset view mode
        setEditPhoneError(''); // Clear error states
        setEditEmergencyPhoneError('');
        fetchUsers(); // Refresh the list
      } else {
        showNotification('error', 'Failed to Update User', data.error || 'Could not update user');
      }
    } catch (error: any) {
      showNotification('error', 'Network Error', 'Failed to connect to server');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users?userId=${selectedUser.user_id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(
          'success',
          'User Deleted Successfully',
          `${selectedUser.firstName} ${selectedUser.lastName} has been removed from the system.`
        );
        setShowDeleteDialog(false);
        setShowEditDialog(false); // Also close the view/edit dialog
        setSelectedUser(null);
        setIsViewMode(true); // Reset view mode
        fetchUsers(); // Refresh the list
      } else {
        showNotification('error', 'Failed to Delete User', data.error || 'Could not delete user');
      }
    } catch (error: any) {
      showNotification('error', 'Network Error', 'Failed to connect to server');
    } finally {
      setIsDeleting(false);
    }
  };

  // Notification helpers
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string, details?: string[]) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message, details }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Helper function: Capitalize names properly
  const capitalizeNames = (name: string): string => {
    if (!name) return '';
    
    // Split by spaces and hyphens, capitalize each part
    return name
      .split(/(\s+|-)/)
      .map((part) => {
        if (part === ' ' || part === '-') return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
  };

  // Helper function: Validate name (letters, spaces, hyphens, apostrophes only)
  const isValidName = (name: string): boolean => {
    return /^[a-zA-Z\s\-']*$/.test(name);
  };

  // Helper function: Validate email comprehensively
  const validateEmail = (email: string): boolean => {
    // Basic pattern: something@domain.extension
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    
    if (!emailRegex.test(email)) return false;
    
    // Additional check: domain should have at least 2 chars before the dot
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const domain = parts[1];
    const domainParts = domain.split('.');
    
    // Domain before dot should have at least 2 characters
    if (domainParts[0].length < 2) return false;
    
    return true;
  };

  // Helper function: Format phone number for display (09XX XXX XXXX)
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  };

  // Helper function: Clean phone number (remove formatting)
  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  // Helper function: Validate phone number (11 digits starting with 09)
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 11 && cleaned.startsWith('09');
  };

  // Helper function: Generate time options (15-minute intervals)
  const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const formattedMinute = minute.toString().padStart(2, '0');
        times.push(`${displayHour.toString().padStart(2, '0')}:${formattedMinute} ${period}`);
      }
    }
    return times;
  };

  // Helper function: Parse time string to components
  const parseTime = (timeString: string): { hour: string; minute: string; period: string } => {
    const [time, period] = timeString.split(' ');
    const [hour, minute] = time.split(':');
    return { hour, minute, period };
  };

  // Helper function: Build time string from components
  const buildTimeString = (hour: string, minute: string, period: string): string => {
    return `${hour.padStart(2, '0')}:${minute} ${period}`;
  };

  // Helper function: Toggle day selection
  const toggleDay = (day: string) => {
    setScheduleError('');
    if (selectedDays.includes(day)) {
      // Remove day
      setSelectedDays(prev => prev.filter(d => d !== day));
      // Remove schedule for that day
      setWeekSchedule(prev => {
        const updated = { ...prev };
        delete updated[day.toLowerCase() as keyof WeekSchedule];
        return updated;
      });
      // Remove error for that day
      setScheduleErrors(prev => {
        const updated = { ...prev };
        delete updated[day];
        return updated;
      });
    } else {
      // Add day with default time
      setSelectedDays(prev => [...prev, day]);
      setWeekSchedule(prev => ({
        ...prev,
        [day.toLowerCase()]: { startTime: '09:00 AM', endTime: '05:00 PM' }
      }));
    }
  };

  // Helper function: Update schedule time
  const updateScheduleTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setScheduleError('');
    setWeekSchedule(prev => {
      const dayKey = day.toLowerCase() as keyof WeekSchedule;
      const currentSchedule = prev[dayKey] || { startTime: '09:00 AM', endTime: '05:00 PM' };
      
      const updated = {
        ...prev,
        [dayKey]: {
          ...currentSchedule,
          [field]: value
        }
      };

      // Validate that end time is after start time
      const schedule = updated[dayKey]!;
      if (!isValidTimeRange(schedule.startTime, schedule.endTime)) {
        setScheduleError(`${day}: End time must be later than start time`);
      }

      return updated;
    });
  };

  // Helper function: Update time component (hour, minute, or period)
  const updateTimeComponent = (
    day: string, 
    field: 'startTime' | 'endTime', 
    component: 'hour' | 'minute' | 'period', 
    value: string
  ) => {
    // Clear main schedule error
    setScheduleError('');
    
    // Clear error for this specific day
    setScheduleErrors(prev => {
      const updated = { ...prev };
      delete updated[day];
      return updated;
    });
    
    setWeekSchedule(prev => {
      const dayKey = day.toLowerCase() as keyof WeekSchedule;
      const currentSchedule = prev[dayKey] || { startTime: '09:00 AM', endTime: '05:00 PM' };
      
      // Parse current time
      const currentTime = parseTime(currentSchedule[field]);
      
      // Update the specific component
      const updatedTime = {
        hour: component === 'hour' ? value : currentTime.hour,
        minute: component === 'minute' ? value : currentTime.minute,
        period: component === 'period' ? value : currentTime.period,
      };
      
      // Build new time string
      const newTimeString = buildTimeString(updatedTime.hour, updatedTime.minute, updatedTime.period);
      
      const updated = {
        ...prev,
        [dayKey]: {
          ...currentSchedule,
          [field]: newTimeString
        }
      };

      // Validate that end time is after start time
      const schedule = updated[dayKey]!;
      if (!isValidTimeRange(schedule.startTime, schedule.endTime)) {
        // Set error for this specific day
        setScheduleErrors(prevErrors => ({
          ...prevErrors,
          [day]: 'End time must be later than start time'
        }));
      }

      return updated;
    });
  };

  // Helper function: Validate time range
  const isValidTimeRange = (startTime: string, endTime: string): boolean => {
    const parseTime = (time: string): number => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };

    return parseTime(endTime) > parseTime(startTime);
  };

  // Helper function: Sort days in week order
  const sortDaysInWeekOrder = (days: string[]): string[] => {
    const weekOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));
  };

  // Helper function: Format schedule for storage
  const formatScheduleForStorage = (): string => {
    if (selectedDays.length === 0) return '';
    
    // Sort days in week order before formatting
    const sortedDays = sortDaysInWeekOrder(selectedDays);
    
    const scheduleLines = sortedDays.map(day => {
      const dayKey = day.toLowerCase() as keyof WeekSchedule;
      const schedule = weekSchedule[dayKey];
      if (!schedule) return '';
      return `${day}: ${schedule.startTime} - ${schedule.endTime}`;
    }).filter(Boolean);

    return scheduleLines.join('\n');
  };

  // Helper function: Convert 12-hour time to 24-hour format for database
  const convertTo24Hour = (time12h: string): string => {
    const [timePart, period] = time12h.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  // Helper function: Convert 24-hour time to 12-hour format for UI
  const convertTo12Hour = (time24h: string): string => {
    const [hoursStr, minutesStr] = time24h.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  // Helper function: Format schedule for database insertion
  const formatScheduleForDB = (doctorId: string) => {
    const availabilityRecords = [];
    
    for (const [day, schedule] of Object.entries(weekSchedule)) {
      if (schedule) {
        availabilityRecords.push({
          doctor_id: doctorId,
          day: day, // already lowercase (monday, tuesday, etc.)
          start_time: convertTo24Hour(schedule.startTime),
          end_time: convertTo24Hour(schedule.endTime)
        });
      }
    }
    
    return availabilityRecords;
  };

  const handleInputChange = (field: keyof NewAccount, value: string) => {
    // Handle name fields with auto-capitalization and validation
    if (field === 'firstName' || field === 'middleName' || field === 'lastName' || field === 'emergencyContactName') {
      // Only allow valid characters
      if (value && !isValidName(value)) {
        return; // Block invalid characters
      }
      
      const capitalized = capitalizeNames(value);
      setNewAccount(prev => ({ ...prev, [field]: capitalized }));
      return;
    }
    
    // Handle email field with validation
    if (field === 'email') {
      setNewAccount(prev => ({ ...prev, email: value }));
      
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address (e.g., name@domain.com)');
      } else {
        setEmailError('');
      }
      return;
    }
    
    // Handle phone number fields with formatting and validation
    if (field === 'phoneNumber') {
      const cleaned = cleanPhoneNumber(value);
      
      // Only allow up to 11 digits
      if (cleaned.length > 11) return;
      
      const formatted = formatPhoneNumber(cleaned);
      setNewAccount(prev => ({ ...prev, phoneNumber: cleaned }));
      
      if (cleaned.length > 0 && !validatePhoneNumber(cleaned)) {
        if (cleaned.length < 11) {
          setPhoneError('Phone number must be 11 digits');
        } else if (!cleaned.startsWith('09')) {
          setPhoneError('Phone number must start with 09');
        }
      } else {
        setPhoneError('');
      }
      return;
    }
    
    // Handle emergency contact phone number separately
    if (field === 'emergencyContactNo') {
      const cleaned = cleanPhoneNumber(value);
      
      // Only allow up to 11 digits
      if (cleaned.length > 11) return;
      
      const formatted = formatPhoneNumber(cleaned);
      setNewAccount(prev => ({ ...prev, emergencyContactNo: cleaned }));
      
      if (cleaned.length > 0 && !validatePhoneNumber(cleaned)) {
        if (cleaned.length < 11) {
          setEmergencyPhoneError('Phone number must be 11 digits');
        } else if (!cleaned.startsWith('09')) {
          setEmergencyPhoneError('Phone number must start with 09');
        }
      } else {
        setEmergencyPhoneError('');
      }
      return;
    }
    
    setNewAccount(prev => ({ 
      ...prev, 
      [field]: field === 'emailVerified' ? value === 'true' : value 
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    setNewAccount(prev => ({
      ...prev,
      role,
      ...(role === "dentist"
        ? { designation: "", assignedDoctor: "", address: "", emergencyContactName: "", emergencyContactNo: "" }
        : {}),
      ...(role === "dental_staff"
        ? { specialization: "", licenseNumber: "", clinicAssignment: "", scheduleAvailability: "", address: "", emergencyContactName: "", emergencyContactNo: "" }
        : {}),
      ...(role === "patient"
        ? { specialization: "", licenseNumber: "", clinicAssignment: "", scheduleAvailability: "", designation: "", assignedDoctor: "" }
        : {}),
      ...(role === "admin"
        ? {
            specialization: "",
            licenseNumber: "",
            clinicAssignment: "",
            scheduleAvailability: "",
            designation: "",
            assignedDoctor: "",
            address: "",
            emergencyContactName: "",
            emergencyContactNo: ""
          }
        : {})
    }));
  };

  // Handle form submission - show confirmation modal first
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newAccount.firstName || !newAccount.lastName || !newAccount.email || !newAccount.phoneNumber) {
      showNotification('error', 'Validation Error', 'Please fill in all required fields.', []);
      return;
    }
    
    // Validate email
    if (!validateEmail(newAccount.email)) {
      showNotification('error', 'Invalid Email', 'Please enter a valid email address.', []);
      return;
    }
    
    // Validate phone number (now required)
    if (!validatePhoneNumber(newAccount.phoneNumber)) {
      showNotification('error', 'Invalid Phone Number', 'Phone number must be 11 digits starting with 09.', []);
      return;
    }
    
    // Validate dentist-specific required fields
    if (newAccount.role === 'dentist') {
      if (!newAccount.specialization || !newAccount.licenseNumber || !newAccount.clinicAssignment) {
        showNotification('error', 'Validation Error', 'Please fill in all required dentist fields (Specialization, License Number, Clinic Room).', []);
        return;
      }
      
      // Check if schedule availability is provided
      if (selectedDays.length === 0) {
        setScheduleError('Please select at least one day for schedule availability.');
        return;
      }
      
      // Check for any schedule errors
      const errorDays = Object.keys(scheduleErrors);
      if (errorDays.length > 0) {
        setScheduleError('Please fix the time range errors in the selected days.');
        return;
      }
      
      // Clear schedule error if validation passes
      setScheduleError('');
    }
    
    // Validate dental staff-specific required fields
    if (newAccount.role === 'dental_staff') {
      if (!newAccount.designation || !newAccount.assignedDoctor) {
        showNotification('error', 'Validation Error', 'Please fill in all required staff fields (Position, Assigned Doctor).', []);
        return;
      }
    }
    
    // Validate patient-specific required fields
    if (newAccount.role === 'patient') {
      if (!newAccount.address || !newAccount.emergencyContactName || !newAccount.emergencyContactNo) {
        showNotification('error', 'Validation Error', 'Please fill in all required patient fields.', []);
        return;
      }
      
      // Validate emergency contact phone number
      if (!validatePhoneNumber(newAccount.emergencyContactNo)) {
        showNotification('error', 'Invalid Emergency Contact Number', 'Emergency contact number must be 11 digits starting with 09.', []);
        return;
      }
    }
    
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleCreateAccount = async () => {
    setIsSaving(true);
    setShowConfirmModal(false);

    const roleLabel = ROLE_LABEL_MAP[newAccount.role];

    try {
      // Call the API to create user
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newAccount.email,
          tempPassword: newAccount.tempPassword,
          firstName: newAccount.firstName,
          middleName: newAccount.middleName,
          lastName: newAccount.lastName,
          phoneNumber: newAccount.phoneNumber,
          gender: newAccount.gender,
          role: newAccount.role,
          status: newAccount.status,
          emailVerified: newAccount.emailVerified,
          // Doctor-specific fields
          specialization: newAccount.specialization,
          licenseNumber: newAccount.licenseNumber,
          clinicAssignment: newAccount.clinicAssignment,
          scheduleAvailability: formatScheduleForStorage(),
          // Staff-specific fields
          designation: newAccount.designation,
          assignedDoctor: newAccount.assignedDoctor,
          // Patient-specific fields
          address: newAccount.address,
          emergencyContactName: newAccount.emergencyContactName,
          emergencyContactNo: newAccount.emergencyContactNo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Debug: Log API response
      console.log('✅ API Response:', data);
      console.log('📋 Account role:', newAccount.role);
      console.log('📅 Selected days:', selectedDays);
      console.log('🔑 Doctor ID from API:', data.doctorId);

      // If dentist account with schedule, save availability to database
      if (newAccount.role === 'dentist' && selectedDays.length > 0 && data.doctorId) {
        console.log('🚀 Attempting to save schedule to database...');
        
        try {
          const supabase = createClient();
          
          // Format schedule for database
          const scheduleRecords = formatScheduleForDB(data.doctorId);
          console.log('📝 Formatted schedule records:', JSON.stringify(scheduleRecords, null, 2));
          
          // Insert all availability records
          const { data: insertData, error: scheduleError } = await supabase
            .from('doc_availability')
            .insert(scheduleRecords)
            .select();

          console.log('💾 Insert result:', { insertData, scheduleError });

          if (scheduleError) {
            console.error('❌ Error saving schedule:', scheduleError);
            console.error('Error details:', {
              message: scheduleError.message,
              code: scheduleError.code,
              details: scheduleError.details,
              hint: scheduleError.hint
            });
            showNotification(
              'info', 
              'Partial Success', 
              `${newAccount.firstName} ${newAccount.lastName}'s account was created, but schedule could not be saved.`,
              ['You can update the schedule later from the Manage Users tab.', `Error: ${scheduleError.message}`]
            );
            return; // Exit early, don't show success notification again
          }
          
          console.log('✅ Schedule saved successfully!');
        } catch (scheduleErr: any) {
          console.error('❌ Exception while handling schedule:', scheduleErr);
          console.error('Exception details:', {
            message: scheduleErr.message,
            stack: scheduleErr.stack
          });
          showNotification(
            'info',
            'Partial Success',
            `${newAccount.firstName} ${newAccount.lastName}'s account was created, but schedule could not be saved.`,
            ['You can update the schedule later from the Manage Users tab.', `Error: ${scheduleErr.message}`]
          );
          return; // Exit early
        }
      } else {
        console.log('⚠️ Skipping schedule save. Conditions:', {
          isDentist: newAccount.role === 'dentist',
          hasDays: selectedDays.length > 0,
          hasDoctorId: !!data.doctorId,
          selectedDaysCount: selectedDays.length,
          doctorIdValue: data.doctorId
        });
      }

      // Success! Show notification
      showNotification(
        'success',
        'Account Created Successfully',
        `${newAccount.firstName} ${newAccount.lastName} has been added to the system.`,
        [
          `Email: ${newAccount.email}`,
          ...(newAccount.role === 'dentist' && selectedDays.length > 0 
            ? [`Schedule: ${selectedDays.length} day(s) configured`] 
            : [])
        ]
      );

      // Reset form
      setNewAccount({
        ...INITIAL_ACCOUNT_STATE,
        role: newAccount.role,
        status: newAccount.status,
      });
      
      // Clear password after showing it
      setShowPassword(false);
      // Clear errors
      setEmailError('');
      setPhoneError('');
      setEmergencyPhoneError('');
      // Clear schedule
      setSelectedDays([]);
      setWeekSchedule({});
      setScheduleError('');
      setScheduleErrors({});
    } catch (error: any) {
      console.error("Error creating account:", error);
      showNotification(
        'error',
        'Failed to Create Account',
        error.message || 'An unexpected error occurred while creating the account.',
        ['Please check the form and try again.']
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatRoleLabel = (role: string) => {
    const mapped = ROLE_LABEL_MAP[role as UserRole];
    if (mapped) return mapped;
    return role
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const formatMiddleInitial = (middleName: string) => {
    if (!middleName || middleName.trim() === '') return '';
    
    // Split by spaces to handle multiple middle names (e.g., "Dela Cruz" -> "D.C.")
    const parts = middleName.trim().split(/\s+/);
    const initials = parts.map(part => part.charAt(0).toUpperCase() + '.').join('');
    
    return initials;
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-orange-100 text-orange-800";
      case "dentist":
        return "bg-purple-100 text-purple-800";
      case "dental_staff":
        return "bg-blue-100 text-blue-800";
      case "patient":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom styles for select dropdowns */}
      <style jsx global>{`
        select.filter-select option {
          padding: 10px 16px;
          background-color: white;
          color: hsl(258, 46%, 25%);
          font-size: 14px;
        }
        
        select.filter-select option:hover {
          background-color: hsl(258, 46%, 95%);
          color: hsl(258, 46%, 25%);
        }
        
        select.filter-select option:checked {
          background-color: hsl(258, 46%, 25%);
          color: white;
          font-weight: 600;
        }
        
        /* Firefox-specific styles */
        @-moz-document url-prefix() {
          select.filter-select option:checked {
            background: hsl(258, 46%, 25%) linear-gradient(0deg, hsl(258, 46%, 25%) 0%, hsl(258, 46%, 25%) 100%);
          }
        }
      `}</style>

      {/* Notification Stack - Fixed Position */}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg border shadow-lg p-4 animate-in slide-in-from-right-5 ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {notification.type === 'info' && (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    notification.type === 'success'
                      ? 'text-green-900'
                      : notification.type === 'error'
                      ? 'text-red-900'
                      : 'text-blue-900'
                  }`}
                >
                  {notification.title}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    notification.type === 'success'
                      ? 'text-green-700'
                      : notification.type === 'error'
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}
                >
                  {notification.message}
                </p>
                {notification.details && notification.details.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {notification.details.map((detail, index) => (
                      <p
                        key={index}
                        className={`text-xs font-medium ${
                          notification.type === 'success'
                            ? 'text-green-800'
                            : notification.type === 'error'
                            ? 'text-red-800'
                            : 'text-blue-800'
                        }`}
                      >
                        {detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className={`flex-shrink-0 rounded-md p-1 hover:bg-white/50 transition-all cursor-pointer active:scale-90 ${
                  notification.type === 'success'
                    ? 'text-green-600'
                    : notification.type === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/settings')}
          className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] transition-colors cursor-pointer font-medium"
        >
          Settings
        </button>
        <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
        <span className="text-[hsl(258_46%_25%)] font-semibold">Account Management</span>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)] flex items-center">
          <Users className="h-6 w-6 mr-3" />
          Account Management
        </h2>
        <p className="text-[hsl(258_22%_50%)]">Create and manage dentist and staff accounts</p>
      </div>



      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav
          role="tablist"
          aria-label="Account management navigation"
          className="flex gap-2 md:gap-3 py-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'create'}
            aria-controls="tab-create-panel"
            id="tab-create"
            onClick={() => setActiveTab('create')}
            className={`inline-flex items-center gap-2 px-4 py-2 -mb-[1px] rounded-t-md text-sm font-medium cursor-pointer select-none transition-colors transition-transform duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
              activeTab === 'create'
                ? 'bg-[hsl(258_46%_25%)] text-white border-b-2 border-white/90'
                : 'text-gray-700 hover:text-purple-800 hover:bg-purple-100'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Accounts</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manage'}
            aria-controls="tab-manage-panel"
            id="tab-manage"
            onClick={() => setActiveTab('manage')}
            className={`inline-flex items-center gap-2 px-4 py-2 -mb-[1px] rounded-t-md text-sm font-medium cursor-pointer select-none transition-colors transition-transform duration-200 ease-in-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
              activeTab === 'manage'
                ? 'bg-[hsl(258_46%_25%)] text-white border-b-2 border-white/90'
                : 'text-gray-700 hover:text-purple-800 hover:bg-purple-100'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Manage Users</span>
          </button>
        </nav>
      </div>

      {/* Create Accounts Tab */}
      {activeTab === "create" && (
        <div id="tab-create-panel" aria-labelledby="tab-create" role="tabpanel" className="space-y-6">
          <Card className="mx-auto max-w-4xl bg-white mb-10">
            <CardHeader>
              <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Create Account
              </CardTitle>
              <CardDescription>
                Complete the details below to add a new team member. All fields can be edited later from the Manage tab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-8">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">General Information</h3>
                    <p className="text-xs text-gray-500">These details apply to every account regardless of role.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="firstName"
                        value={newAccount.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                        placeholder="Juan"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={newAccount.middleName}
                        onChange={(e) => handleInputChange("middleName", e.target.value)}
                        placeholder="Santos"
                        className="mt-1"
                      />
                      {/* <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p> */}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="lastName"
                        value={newAccount.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required
                        placeholder="Dela Cruz"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAccount.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        placeholder="name@dentabase.com"
                        className={`mt-1 ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {emailError && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {emailError}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="phoneNumber"
                        value={formatPhoneNumber(newAccount.phoneNumber)}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        placeholder="09XX XXX XXXX"
                        required
                        className={`mt-1 ${phoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {phoneError && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {phoneError}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                      <select
                        id="gender"
                        value={newAccount.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        required
                        className="mt-1 h-10 w-full rounded-md border-1 border-[hsl(258_22%_90%)] bg-white pl-3 pr-8 py-2 text-sm text-[hsl(258_46%_25%)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)] focus:border-[hsl(258_46%_25%)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all"
                      >
                        <option value="unspecified">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr]">
                    <div>
                      <Label htmlFor="tempPassword">Temporary Password <span className="text-red-500">*</span></Label>
                      <div className="mt-1">
                        <div className="relative w-full">
                          <Input
                            id="tempPassword"
                            type={showPassword ? "text" : "password"}
                            value={newAccount.tempPassword}
                            readOnly
                            required
                            placeholder="dentabase2025"
                            className="pr-10 bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)]"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Users should change it after first login.</p>
                    </div>
                    <div>
                      <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                      <select
                        id="role"
                        value={newAccount.role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="mt-1 h-10 w-full rounded-md border-1 border-[hsl(258_22%_90%)] bg-white pl-3 pr-8 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)] focus:border-[hsl(258_46%_25%)] cursor-pointer transition-all"
                      >
                        <option value="admin">Admin</option>
                        <option value="dentist">Dentist</option>
                        <option value="dental_staff">Dental Staff</option>
                        <option value="patient">Patient</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="emailVerified">Email Verification</Label>
                      <div className="mt-2 flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleInputChange("emailVerified", String(!newAccount.emailVerified))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:ring-offset-2 cursor-pointer ${
                            newAccount.emailVerified ? 'bg-[hsl(258_46%_25%)]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              newAccount.emailVerified ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-[hsl(258_22%_50%)]">
                          {newAccount.emailVerified ? 'Auto-verify' : 'Send email'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {newAccount.emailVerified 
                          ? 'User can log in immediately.' 
                          : 'User must verify email first.'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-t border-[hsl(258_22%_90%)] pt-6">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">Role-Specific Information</h3>
                    <p className="text-xs text-gray-500">Complete the fields that are relevant to the selected role.</p>
                  </div>

                  {newAccount.role === "dentist" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="specialization">Specialization <span className="text-red-500">*</span></Label>
                        <Input
                          id="specialization"
                          value={newAccount.specialization}
                          onChange={(e) => handleInputChange("specialization", e.target.value)}
                          placeholder="e.g., General Dentistry, Orthodontics"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="licenseNumber">License Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="licenseNumber"
                          value={newAccount.licenseNumber}
                          onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                          placeholder="e.g., 123456"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="clinicAssignment">Clinic Room Assignment <span className="text-red-500">*</span></Label>
                        <Input
                          id="clinicAssignment"
                          value={newAccount.clinicAssignment}
                          onChange={(e) => handleInputChange("clinicAssignment", e.target.value)}
                          placeholder="e.g., Room 101"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="scheduleAvailability">Schedule Availability <span className="text-red-500">*</span></Label>
                        
                        {/* Day Selector */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-95 ${
                                selectedDays.includes(day)
                                  ? 'bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_22%)]'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>

                        {/* Time Pickers for Selected Days */}
                        {selectedDays.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {sortDaysInWeekOrder(selectedDays).map((day) => {
                              const dayKey = day.toLowerCase() as keyof WeekSchedule;
                              const schedule = weekSchedule[dayKey];
                              
                              const startTime = parseTime(schedule?.startTime || '09:00 AM');
                              const endTime = parseTime(schedule?.endTime || '05:00 PM');

                              return (
                                <div key={day} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <h4 className="text-sm font-semibold text-[hsl(258_46%_25%)] mb-3">{day}</h4>
                                  
                                  {/* Single row layout packed to the left with even spacing */}
                                  <div className="flex items-center gap-10">
                                    {/* Start Time Section */}
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5">
                                        {/* Hour - Custom Dropdown */}
                                        <div className="relative custom-dropdown">
                                          <button
                                            type="button"
                                            onClick={() => setOpenDropdown(openDropdown === `${day}-start-hour` ? null : `${day}-start-hour`)}
                                            className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95"
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
                                            className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95"
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
                                          className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-semibold hover:border-[hsl(258_46%_25%/0.5)] hover:bg-[hsl(258_46%_95%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95"
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
                                            className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95"
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
                                            className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-medium hover:border-[hsl(258_46%_25%/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95"
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
                                          className="w-16 h-9 px-2 rounded-lg border-2 border-[hsl(258_22%_90%)] bg-white text-sm text-[hsl(258_46%_25%)] font-semibold hover:border-[hsl(258_46%_25%/0.5)] hover:bg-[hsl(258_46%_95%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.2)] focus:border-[hsl(258_46%_25%)] transition-all cursor-pointer text-center active:scale-95"
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

                        {/* Helper Text */}
                        <p className="mt-2 text-xs text-gray-500">
                          {selectedDays.length === 0 
                            ? 'Select days to set working hours for this dentist' 
                            : `${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''} selected`}
                        </p>
                        
                        {/* Error Message Card */}
                        {scheduleError && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span>{scheduleError}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {newAccount.role === "dental_staff" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="designation">Position / Designation <span className="text-red-500">*</span></Label>
                        <Input
                          id="designation"
                          value={newAccount.designation}
                          onChange={(e) => handleInputChange("designation", e.target.value)}
                          placeholder="e.g., Dental Assistant, Hygienist"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignedDoctor">Assigned Doctor <span className="text-red-500">*</span></Label>
                        <select
                          id="assignedDoctor"
                          value={newAccount.assignedDoctor}
                          onChange={(e) => handleInputChange("assignedDoctor", e.target.value)}
                          className="mt-1 h-10 w-full rounded-md border-1 border-[hsl(258_22%_90%)] bg-white pl-3 pr-8 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)] focus:border-[hsl(258_46%_25%)] cursor-pointer transition-all"
                          required
                        >
                          <option value="">Select doctor</option>
                          <option value="dr-john-doe">Dr. John Doe</option>
                          <option value="dr-jane-smith">Dr. Jane Smith</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Placeholder list – connect to Doctor accounts once available.</p>
                      </div>
                    </div>
                  )}

                  {newAccount.role === "patient" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="address"
                          value={newAccount.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Street, City, Province"
                          className="mt-1"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">Required for patient records.</p>
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactName">Emergency Contact Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="emergencyContactName"
                          value={newAccount.emergencyContactName}
                          onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                          placeholder="Full name"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactNo">Emergency Contact Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="emergencyContactNo"
                          value={formatPhoneNumber(newAccount.emergencyContactNo)}
                          onChange={(e) => handleInputChange("emergencyContactNo", e.target.value)}
                          placeholder="09XX XXX XXXX"
                          className={`mt-1 ${emergencyPhoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
                          required
                        />
                        {emergencyPhoneError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {emergencyPhoneError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {newAccount.role === "admin" && (
                    <div className="rounded-md border border-dashed border-[hsl(258_22%_90%)] bg-[hsl(258_46%_25%/0.02)] p-4 text-sm text-[hsl(258_22%_50%)]">
                      Admin accounts only require the general information above. No extra fields needed.
                    </div>
                  )}
                </section>

                <div className="flex justify-end pt-2 pb-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[hsl(258_46%_25%)] px-6 text-white hover:bg-[hsl(258_46%_22%)] cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving Account...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Save Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage Users Tab */}
      {activeTab === 'manage' && (
        <div id="tab-manage-panel" aria-labelledby="tab-manage" role="tabpanel" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="relative flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
                    <Input
                      placeholder="Search users by name or email..."
                      className="pl-10"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isLoadingUsers}
                    className="h-10 bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_22%)] cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Role Filter - Custom Dropdown */}
                  <CustomDropdown
                    value={roleFilter}
                    onChange={(value) => setRoleFilter(value as any)}
                    options={[
                      { value: 'all', label: 'All Roles' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'dentist', label: 'Dentist' },
                      { value: 'dental_staff', label: 'Dental Staff' },
                      { value: 'patient', label: 'Patient' }
                    ]}
                    icon={<Filter className="h-4 w-4 text-[hsl(258_22%_50%)]" />}
                    className="min-w-[140px]"
                  />

                  {/* Status Filter - Custom Dropdown */}
                  <CustomDropdown
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as any)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                    icon={<Filter className="h-4 w-4 text-[hsl(258_22%_50%)]" />}
                    className="min-w-[130px]"
                  />

                  <Button 
                    variant="outline"
                    onClick={fetchUsers}
                    disabled={isLoadingUsers}
                    className="h-10 cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed hover:bg-[hsl(258_46%_25%/0.05)]"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white mb-10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[hsl(258_46%_25%)]">All Users</CardTitle>
                  <CardDescription>
                    {isLoadingUsers ? 'Loading users...' : `${existingUsers.length} user(s) found`}
                  </CardDescription>
                </div>
                
                {/* Page Navigator - Top Right */}
                {!isLoadingUsers && existingUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 cursor-pointer active:scale-90 transition-transform disabled:cursor-not-allowed hover:bg-[hsl(258_46%_25%/0.05)]"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-sm font-medium text-[hsl(258_46%_25%)] min-w-[100px] text-center">
                      Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 cursor-pointer active:scale-90 transition-transform disabled:cursor-not-allowed hover:bg-[hsl(258_46%_25%/0.05)]"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    {/* Loading animation with ripple effect - matches auth loading */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      {/* Outer ripple rings - pulse outward */}
                      <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping"></div>
                      <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-10 animate-pulse"></div>
                      
                      {/* Solid purple circle */}
                      <div className="absolute inset-2 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
                        {/* Logo with fade animation */}
                        <div className="animate-fade-in-out">
                          <img
                            src="/logo-white-outline.png"
                            alt="Loading"
                            className="w-12 h-12 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading text */}
                    <p className="text-[hsl(258_22%_50%)]">Loading users...</p>
                  </div>
                </div>
              ) : existingUsers.length === 0 ? (
                <div className="text-center py-12 text-[hsl(258_22%_50%)]">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No users found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: '15%' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-[hsl(258_22%_90%)]">
                        <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Name</th>
                        <th className="text-center py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Role</th>
                        <th className="text-center py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Created</th>
                        <th className="text-center py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => (
                        <tr 
                          key={user.user_id} 
                          onClick={() => fetchUserDetails(user.user_id, true)}
                          className="border-b border-[hsl(258_22%_90%)] hover:bg-[hsl(258_46%_25%/0.05)] cursor-pointer transition-all active:bg-[hsl(258_46%_25%/0.08)]"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-[hsl(258_46%_25%)] truncate">
                              {user.first_name} {user.middle_name ? formatMiddleInitial(user.middle_name) + ' ' : ''}{user.last_name}
                            </div>
                            {user.email && (
                              <div className="text-xs text-[hsl(258_22%_50%)] truncate">{user.email}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium min-w-[80px] ${getRoleBadgeStyles(user.role)}`}>
                                {formatRoleLabel(user.role)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-medium min-w-[70px] ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-[hsl(258_22%_50%)]">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  fetchUserDetails(user.user_id, false); // Open in edit mode
                                }}
                                className="h-8 w-8 p-0 hover:bg-[hsl(258_46%_25%/0.1)] cursor-pointer active:scale-90 transition-transform"
                                title="Edit user"
                              >
                                <Edit2 className="h-4 w-4 text-[hsl(258_46%_25%)]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  setSelectedUser({
                                    user_id: user.user_id,
                                    firstName: user.first_name,
                                    middleName: user.middle_name || '',
                                    lastName: user.last_name,
                                    email: user.email,
                                    tempPassword: '',
                                    phoneNumber: '',
                                    gender: user.gender as any,
                                    role: user.role,
                                    status: user.status,
                                    emailVerified: true,
                                    specialization: '',
                                    licenseNumber: '',
                                    clinicAssignment: '',
                                    scheduleAvailability: '',
                                    designation: '',
                                    assignedDoctor: '',
                                    address: '',
                                    emergencyContactName: '',
                                    emergencyContactNo: ''
                                  });
                                  setShowDeleteDialog(true);
                                }}
                                disabled={user.auth_id === currentUser?.auth_id}
                                className={`h-8 w-8 p-0 transition-transform ${user.auth_id === currentUser?.auth_id ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-50 cursor-pointer active:scale-90'}`}
                                title={user.auth_id === currentUser?.auth_id ? "Cannot delete yourself" : "Delete user"}
                              >
                                <Trash2 className={`h-4 w-4 ${user.auth_id === currentUser?.auth_id ? 'text-gray-300' : 'text-red-600'}`} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls - Bottom */}
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 pb-4">
                  <div className="text-sm font-medium text-[hsl(258_46%_25%)]">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, existingUsers.length)}</span> of <span className="font-semibold">{existingUsers.length}</span> users
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-9 w-9 p-0"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-sm font-medium text-[hsl(258_46%_25%)] min-w-[100px] text-center">
                      Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-9 w-9 p-0"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* View/Edit User Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[hsl(258_22%_90%)] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[hsl(258_46%_25%)]">
                  {isViewMode ? 'User Details' : 'Edit User'}
                </h3>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedUser(null);
                    setIsViewMode(true);
                    setEditPhoneError('');
                    setEditEmergencyPhoneError('');
                  }}
                  className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] cursor-pointer active:scale-90 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {!selectedUser ? (
              /* Loading State */
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  {/* Pulsating logo loading animation */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    {/* Outer ripple rings - pulse outward */}
                    <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-10 animate-pulse"></div>
                    
                    {/* Solid purple circle */}
                    <div className="absolute inset-2 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
                      {/* Logo with fade animation */}
                      <div className="animate-fade-in-out">
                        <img
                          src="/logo-white-outline.png"
                          alt="Loading"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[hsl(258_22%_50%)]">Loading user details...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateUser} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-firstName"
                      value={selectedUser.firstName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && !isValidName(value)) return;
                        setSelectedUser({ ...selectedUser, firstName: capitalizeNames(value) });
                      }}
                      required
                      disabled={isViewMode}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-lastName"
                      value={selectedUser.lastName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && !isValidName(value)) return;
                        setSelectedUser({ ...selectedUser, lastName: capitalizeNames(value) });
                      }}
                      required
                      disabled={isViewMode}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-middleName">Middle Name</Label>
                    <Input
                      id="edit-middleName"
                      value={selectedUser.middleName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && !isValidName(value)) return;
                        setSelectedUser({ ...selectedUser, middleName: capitalizeNames(value) });
                      }}
                      disabled={isViewMode}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-phoneNumber"
                      value={formatPhoneNumber(selectedUser.phoneNumber)}
                      onChange={(e) => {
                        const cleaned = cleanPhoneNumber(e.target.value);
                        if (cleaned.length > 11) return;
                        setSelectedUser({ ...selectedUser, phoneNumber: cleaned });
                        if (cleaned.length > 0 && !validatePhoneNumber(cleaned)) {
                          if (cleaned.length < 11) setEditPhoneError('Phone number must be 11 digits');
                          else if (!cleaned.startsWith('09')) setEditPhoneError('Phone number must start with 09');
                        } else {
                          setEditPhoneError('');
                        }
                      }}
                      disabled={isViewMode}
                      required
                      placeholder="09XX XXX XXXX"
                      className={`mt-1 ${editPhoneError && !isViewMode ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {editPhoneError && !isViewMode && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {editPhoneError}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-gender">Gender <span className="text-red-500">*</span></Label>
                    <select
                      id="edit-gender"
                      value={selectedUser.gender}
                      onChange={(e) => setSelectedUser({ ...selectedUser, gender: e.target.value as any })}
                      required
                      disabled={isViewMode}
                      className="mt-1 h-10 w-full rounded-md border-1 border-[hsl(258_22%_90%)] bg-white pl-3 pr-8 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)] focus:border-[hsl(258_46%_25%)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                      <option value="unspecified">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div> 
                    <Label htmlFor="edit-status">Status <span className="text-red-500">*</span></Label>
                    <select
                      id="edit-status"
                      value={selectedUser.status}
                      onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as AccountStatus })}
                      required
                      disabled={isViewMode}
                      className="mt-1 h-10 w-full rounded-md border-1 border-[hsl(258_22%_90%)] bg-white pl-3 pr-8 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)] focus:border-[hsl(258_46%_25%)] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {selectedUser.role === 'dentist' && (
                <div className="space-y-4 border-t border-[hsl(258_22%_90%)] pt-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
                    Dentist Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-specialization">Specialization <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-specialization"
                        value={selectedUser.specialization}
                        onChange={(e) => setSelectedUser({ ...selectedUser, specialization: e.target.value })}
                        disabled={isViewMode}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-licenseNumber">License Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-licenseNumber"
                        value={selectedUser.licenseNumber}
                        onChange={(e) => setSelectedUser({ ...selectedUser, licenseNumber: e.target.value })}
                        disabled={isViewMode}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-clinicAssignment">Clinic Room</Label>
                      <Input
                        id="edit-clinicAssignment"
                        value={selectedUser.clinicAssignment}
                        onChange={(e) => setSelectedUser({ ...selectedUser, clinicAssignment: e.target.value })}
                        disabled={isViewMode}
                        placeholder="e.g., Room 101"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-scheduleAvailability">Schedule Availability</Label>
                      <Input
                        id="edit-scheduleAvailability"
                        value={selectedUser.scheduleAvailability}
                        onChange={(e) => setSelectedUser({ ...selectedUser, scheduleAvailability: e.target.value })}
                        disabled={isViewMode}
                        placeholder="e.g., Mon-Fri 9AM-5PM"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'dental_staff' && (
                <div className="space-y-4 border-t border-[hsl(258_22%_90%)] pt-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
                    Staff Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-designation">Position <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-designation"
                        value={selectedUser.designation}
                        onChange={(e) => setSelectedUser({ ...selectedUser, designation: e.target.value })}
                        disabled={isViewMode}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-assignedDoctor">Assigned Doctor <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-assignedDoctor"
                        value={selectedUser.assignedDoctor}
                        onChange={(e) => setSelectedUser({ ...selectedUser, assignedDoctor: e.target.value })}
                        disabled={isViewMode}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === 'patient' && (
                <div className="space-y-4 border-t border-[hsl(258_22%_90%)] pt-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">
                    Patient Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-address">Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-address"
                        value={selectedUser.address}
                        onChange={(e) => setSelectedUser({ ...selectedUser, address: e.target.value })}
                        required
                        disabled={isViewMode}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-emergencyContactName">Emergency Contact Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-emergencyContactName"
                          value={selectedUser.emergencyContactName}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && !isValidName(value)) return;
                            setSelectedUser({ ...selectedUser, emergencyContactName: capitalizeNames(value) });
                          }}
                          required
                          disabled={isViewMode}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-emergencyContactNo">Emergency Contact Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-emergencyContactNo"
                          value={formatPhoneNumber(selectedUser.emergencyContactNo)}
                          onChange={(e) => {
                            const cleaned = cleanPhoneNumber(e.target.value);
                            if (cleaned.length > 11) return;
                            setSelectedUser({ ...selectedUser, emergencyContactNo: cleaned });
                            if (cleaned.length > 0 && !validatePhoneNumber(cleaned)) {
                              if (cleaned.length < 11) setEditEmergencyPhoneError('Phone number must be 11 digits');
                              else if (!cleaned.startsWith('09')) setEditEmergencyPhoneError('Phone number must start with 09');
                            } else {
                              setEditEmergencyPhoneError('');
                            }
                          }}
                          required
                          disabled={isViewMode}
                          placeholder="09XX XXX XXXX"
                          className={`mt-1 ${editEmergencyPhoneError && !isViewMode ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {editEmergencyPhoneError && !isViewMode && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {editEmergencyPhoneError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
            )}

            {/* Action Buttons at Bottom - Outside Form */}
            {selectedUser && (
              <div className="p-6 pt-0">
                <div className="flex items-center gap-3 pt-4 border-t border-[hsl(258_22%_90%)]">
                  {isViewMode ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => setIsViewMode(false)}
                        className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_22%)] cursor-pointer active:scale-95 transition-transform"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEditDialog(false);
                          setShowDeleteDialog(true);
                        }}
                        disabled={selectedUser.user_id === currentUser?.user_id}
                        className={`border-red-200 text-red-600 hover:bg-red-50 transition-transform ${selectedUser.user_id === currentUser?.user_id ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsViewMode(true); // Return to view mode without submitting
                          setEditPhoneError(''); // Clear validation errors
                          setEditEmergencyPhoneError('');
                        }}
                        disabled={isUpdating}
                        className="cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Manually trigger form submission
                          const form = document.querySelector('form');
                          if (form) {
                            form.requestSubmit();
                          }
                        }}
                        disabled={isUpdating}
                        className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_22%)] cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                      >
                        {isUpdating ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Updating...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Account Creation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[hsl(258_46%_95%)] flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-[hsl(258_46%_25%)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)]">Confirm Account Creation</h3>
                    <p className="text-sm text-[hsl(258_22%_50%)]">Please review the information before creating the account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] cursor-pointer active:scale-90 transition-transform"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Account Information Display */}
              <div className="space-y-6">
                {/* General Information */}
                <div className="border-b border-[hsl(258_22%_90%)] pb-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)] mb-3">
                    General Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Full Name</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">
                        {newAccount.firstName} {newAccount.middleName && `${newAccount.middleName} `}{newAccount.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Email Address</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Phone Number</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">
                        {newAccount.phoneNumber ? formatPhoneNumber(newAccount.phoneNumber) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Gender</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">
                        {newAccount.gender === 'male' ? 'Male' : newAccount.gender === 'female' ? 'Female' : newAccount.gender === 'other' ? 'Other' : 'Prefer not to say'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="border-b border-[hsl(258_22%_90%)] pb-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)] mb-3">
                    Account Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Role</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">
                        {ROLE_LABEL_MAP[newAccount.role]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Status</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">
                        {newAccount.status === 'active' ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Temporary Password</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.tempPassword}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(258_22%_50%)]">Email Verification</p>
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">
                        {newAccount.emailVerified ? 'Auto-verified (can login immediately)' : 'Requires email verification'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role-Specific Information */}
                {(newAccount.role === 'dentist' || newAccount.role === 'dental_staff' || newAccount.role === 'patient') && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)] mb-3">
                      Role-Specific Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {newAccount.role === 'dentist' && (
                        <>
                          {newAccount.specialization && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">Specialization</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.specialization}</p>
                            </div>
                          )}
                          {newAccount.licenseNumber && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">License Number</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.licenseNumber}</p>
                            </div>
                          )}
                          {newAccount.clinicAssignment && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">Clinic Room</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.clinicAssignment}</p>
                            </div>
                          )}
                          {selectedDays.length > 0 && (
                            <div className="col-span-2">
                              <p className="text-xs text-[hsl(258_22%_50%)] mb-2">Schedule Availability</p>
                              <div className="space-y-1">
                                {selectedDays.map((day) => {
                                  const dayKey = day.toLowerCase() as keyof WeekSchedule;
                                  const schedule = weekSchedule[dayKey];
                                  if (!schedule) return null;
                                  return (
                                    <div key={day} className="flex items-center gap-2 text-sm">
                                      <span className="font-medium text-[hsl(258_46%_25%)] min-w-[100px]">{day}:</span>
                                      <span className="text-[hsl(258_22%_50%)]">
                                        {schedule.startTime} - {schedule.endTime}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {newAccount.role === 'dental_staff' && (
                        <>
                          {newAccount.designation && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">Designation</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.designation}</p>
                            </div>
                          )}
                          {newAccount.assignedDoctor && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">Assigned Doctor</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.assignedDoctor}</p>
                            </div>
                          )}
                        </>
                      )}
                      {newAccount.role === 'patient' && (
                        <>
                          {newAccount.address && (
                            <div className="col-span-2">
                              <p className="text-xs text-[hsl(258_22%_50%)]">Address</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.address}</p>
                            </div>
                          )}
                          {newAccount.emergencyContactName && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">Emergency Contact</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.emergencyContactName}</p>
                            </div>
                          )}
                          {newAccount.emergencyContactNo && (
                            <div>
                              <p className="text-xs text-[hsl(258_22%_50%)]">Emergency Contact Number</p>
                              <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{newAccount.emergencyContactNo}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[hsl(258_22%_90%)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSaving}
                  className="cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={isSaving}
                  className="bg-[hsl(258_46%_25%)] text-white hover:bg-[hsl(258_46%_22%)] cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm & Create Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)]">Delete User</h3>
                  <p className="text-sm text-[hsl(258_22%_50%)]">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-[hsl(258_22%_50%)] mb-6">
                Are you sure you want to delete <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>? 
                All associated data will be permanently removed from the system.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setSelectedUser(null);
                  }}
                  disabled={isDeleting}
                  className="cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700 cursor-pointer active:scale-95 transition-transform disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
