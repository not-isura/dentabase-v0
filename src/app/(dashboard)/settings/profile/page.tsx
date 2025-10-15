"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DoctorSchedule from "@/components/doctor-schedule";
import EditScheduleModal from "@/components/edit-schedule-modal";
import { 
  ArrowLeft, 
  ChevronRight,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Shield,
  UserCircle,
  Contact
} from "lucide-react";

export default function SettingsProfilePage() {
  const router = useRouter();
  
  // 🎯 Get user data from Auth Context (already loaded!)
  const { user, patientProfile, isLoading: isLoadingAuth, refreshUser } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Validation states
  const [phoneError, setPhoneError] = useState('');
  const [emergencyPhoneError, setEmergencyPhoneError] = useState('');

  // Role-specific profiles (to be loaded)
  const [dentistProfile, setDentistProfile] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);

  // Editable fields (only for patients)
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNo, setEmergencyContactNo] = useState("");

  // Edit Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  // Helper functions for validation
  const capitalizeNames = (name: string): string => {
    return name.split(/(\s+|-)/)
      .map((part) => part === ' ' || part === '-' ? part : 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  };

  const isValidName = (name: string): boolean => {
    return /^[a-zA-Z\s\-']*$/.test(name);
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  };

  const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 11 && cleaned.startsWith('09');
  };

  // Initialize editable fields when user data loads
  useEffect(() => {
    if (user) {
      setPhone(user.phone_number || "");
    }
    if (patientProfile) {
      setAddress(patientProfile.address || "");
      setEmergencyContactName(patientProfile.emergency_contact_name || "");
      setEmergencyContactNo(patientProfile.emergency_contact_no || "");
    }
  }, [user, patientProfile]);

  // Fetch role-specific profiles for dentist and staff
  useEffect(() => {
    const fetchRoleProfile = async () => {
      if (!user) return;

      const supabase = createClient();

      if (user.role === 'dentist') {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', user.user_id)
          .single();
        
        if (data) {
          console.log('Dentist profile loaded:', data);
          setDentistProfile(data);
        }
        if (error) {
          console.error('Error loading dentist profile:', error);
        }
      } else if (user.role === 'dental_staff') {
        // Join with doctors table to get doctor info, then join with users to get doctor's name
        const { data, error } = await supabase
          .from('staff')
          .select(`
            *,
            doctors:doctor_id (
              doctor_id,
              users:user_id (
                first_name,
                middle_name,
                last_name
              )
            )
          `)
          .eq('user_id', user.user_id)
          .single();
        
        if (data) {
          console.log('Staff profile loaded:', data);
          setStaffProfile(data);
        }
        if (error) {
          console.error('Error loading staff profile:', error);
        }
      }
    };

    fetchRoleProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!phone || !address || !emergencyContactName || !emergencyContactNo) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
      setError("Phone number must be 11 digits starting with 09.");
      return;
    }

    // Validate emergency contact phone
    if (!validatePhoneNumber(emergencyContactNo)) {
      setError("Emergency contact number must be 11 digits starting with 09.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();

      // Update phone number in users table
      const { error: userError } = await supabase
        .from("users")
        .update({ phone_number: phone })
        .eq("user_id", user.user_id);

      if (userError) throw userError;

      // If user is a patient, update patient table
      if (user.role === "patient" && patientProfile) {
        const { error: patientError } = await supabase
          .from("patient")
          .update({
            address,
            emergency_contact_name: emergencyContactName,
            emergency_contact_no: emergencyContactNo,
          })
          .eq("patient_id", patientProfile.patient_id);

        if (patientError) throw patientError;
      }

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setPhoneError('');
      setEmergencyPhoneError('');

      // Refresh Auth Context to show updated data
      await refreshUser();

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle schedule modal
  const handleOpenScheduleModal = () => {
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
  };

  const handleScheduleSaved = () => {
    // Refresh the schedule component by updating the key
    setScheduleRefreshKey(prev => prev + 1);
    setSuccessMessage("Schedule updated successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Scroll to top of page to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    // Reset to original values
    if (user) setPhone(user.phone_number || "");
    if (patientProfile) {
      setAddress(patientProfile.address || "");
      setEmergencyContactName(patientProfile.emergency_contact_name || "");
      setEmergencyContactNo(patientProfile.emergency_contact_no || "");
    }
    setIsEditing(false);
    setError(null);
    setPhoneError('');
    setEmergencyPhoneError('');
  };

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push("/settings")}
            className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] transition-colors cursor-pointer font-medium"
          >
            Settings
          </button>
          <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
          <span className="text-[hsl(258_46%_25%)] font-semibold">My Profile</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">My Profile</h2>
          <p className="text-[hsl(258_22%_50%)]">Manage your personal information and account preferences</p>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push("/settings")}
          className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] transition-colors cursor-pointer font-medium"
        >
          Settings
        </button>
        <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
        <span className="text-[hsl(258_46%_25%)] font-semibold">My Profile</span>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">My Profile</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage your personal information and account preferences</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information Card (Read-Only) */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <UserCircle className="h-5 w-5 mr-2" />
            Basic Information
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Your account details (read-only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center text-[hsl(258_22%_50%)]">
              <Mail className="h-4 w-4 mr-2" />
              Email Address
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[hsl(258_46%_25%)]">{user.email}</p>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[hsl(258_22%_50%)]">First Name</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[hsl(258_46%_25%)]">{user.first_name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(258_22%_50%)]">Middle Name</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[hsl(258_46%_25%)]">{user.middle_name || "—"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(258_22%_50%)]">Last Name</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[hsl(258_46%_25%)]">{user.last_name}</p>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-[hsl(258_22%_50%)]">Gender</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[hsl(258_46%_25%)] capitalize">{user.gender}</p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className="flex items-center text-[hsl(258_22%_50%)]">
              <Phone className="h-4 w-4 mr-2" />
              Phone Number
            </Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[hsl(258_46%_25%)]">
                {user.phone_number ? formatPhoneNumber(user.phone_number) : "Not set"}
              </p>
            </div>
          </div>

          {/* Role and Member Since */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center text-[hsl(258_22%_50%)]">
                <Shield className="h-4 w-4 mr-2" />
                Account Role
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[hsl(258_46%_25%)] capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center text-[hsl(258_22%_50%)]">
                <Calendar className="h-4 w-4 mr-2" />
                Member Since
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[hsl(258_46%_25%)]">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card (Editable for Patients) */}
      {user.role === "patient" && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
              <Contact className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">
              Your contact details and emergency contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center text-[hsl(258_22%_50%)]">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number <span className="text-red-500 ml-1">*</span>
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="phone"
                    type="tel"
                    value={formatPhoneNumber(phone)}
                    onChange={(e) => {
                      const cleaned = cleanPhoneNumber(e.target.value);
                      if (cleaned.length > 11) return;
                      setPhone(cleaned);
                      if (cleaned.length > 0 && !validatePhoneNumber(cleaned)) {
                        if (cleaned.length < 11) setPhoneError('Phone number must be 11 digits');
                        else if (!cleaned.startsWith('09')) setPhoneError('Phone number must start with 09');
                      } else {
                        setPhoneError('');
                      }
                    }}
                    placeholder="09XX XXX XXXX"
                    required
                    className={`border-[hsl(258_46%_25%/0.3)] ${phoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {phoneError}
                    </p>
                  )}
                </>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[hsl(258_46%_25%)]">{phone ? formatPhoneNumber(phone) : "Not set"}</p>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center text-[hsl(258_22%_50%)]">
                <MapPin className="h-4 w-4 mr-2" />
                Address <span className="text-red-500 ml-1">*</span>
              </Label>
              {isEditing ? (
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-[hsl(258_46%_25%/0.3)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[hsl(258_46%_25%)]">{address || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Emergency Contact Section */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-4">Emergency Contact</h4>
              
              {/* Emergency Contact Name */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="emergencyName" className="text-[hsl(258_22%_50%)]">
                  Contact Name <span className="text-red-500 ml-1">*</span>
                </Label>
                {isEditing ? (
                  <Input
                    id="emergencyName"
                    value={emergencyContactName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !isValidName(value)) return;
                      setEmergencyContactName(capitalizeNames(value));
                    }}
                    placeholder="Full name of emergency contact"
                    required
                    className="border-[hsl(258_46%_25%/0.3)]"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[hsl(258_46%_25%)]">{emergencyContactName || "Not set"}</p>
                  </div>
                )}
              </div>

              {/* Emergency Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone" className="text-[hsl(258_22%_50%)]">
                  Contact Number <span className="text-red-500 ml-1">*</span>
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formatPhoneNumber(emergencyContactNo)}
                      onChange={(e) => {
                        const cleaned = cleanPhoneNumber(e.target.value);
                        if (cleaned.length > 11) return;
                        setEmergencyContactNo(cleaned);
                        if (cleaned.length > 0 && !validatePhoneNumber(cleaned)) {
                          if (cleaned.length < 11) setEmergencyPhoneError('Phone number must be 11 digits');
                          else if (!cleaned.startsWith('09')) setEmergencyPhoneError('Phone number must start with 09');
                        } else {
                          setEmergencyPhoneError('');
                        }
                      }}
                      placeholder="09XX XXX XXXX"
                      required
                      className={`border-[hsl(258_46%_25%/0.3)] ${emergencyPhoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {emergencyPhoneError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {emergencyPhoneError}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[hsl(258_46%_25%)]">{emergencyContactNo ? formatPhoneNumber(emergencyContactNo) : "Not set"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    className='!bg-white hover:!bg-gray-50 cursor-pointer active:scale-95 transition-all border-gray-300'
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !phone || !address || !emergencyContactName || !emergencyContactNo || phoneError !== '' || emergencyPhoneError !== ''}
                    className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_22%)] cursor-pointer text-white active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_22%)] text-white cursor-pointer active:scale-95 transition-all"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Patient Users Card - Dentist/Staff Profile */}
      {user.role !== "patient" && user.role !== "admin" && (
        <>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
                <Shield className="h-5 w-5 mr-2" />
                {user.role === 'dentist' ? 'Dentist Information' : 'Staff Information'}
              </CardTitle>
              <CardDescription className="text-[hsl(258_22%_50%)]">
                Your professional information (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.role === 'dentist' && dentistProfile && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[hsl(258_22%_50%)]">Specialization</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[hsl(258_46%_25%)]">{dentistProfile.specialization || "Not set"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[hsl(258_22%_50%)]">License Number</Label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[hsl(258_46%_25%)]">{dentistProfile.license_number || "Not set"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[hsl(258_22%_50%)]">Room Number</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-[hsl(258_46%_25%)]">{dentistProfile.room_number || "Not assigned"}</p>
                    </div>
                  </div>
                </>
              )}

              {user.role === 'dental_staff' && staffProfile && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[hsl(258_22%_50%)]">Position</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-[hsl(258_46%_25%)]">{staffProfile.position_title || "Not set"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[hsl(258_22%_50%)]">Assigned Doctor</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-[hsl(258_46%_25%)]">
                        {staffProfile.doctors?.users 
                          ? `Dr. ${staffProfile.doctors.users.first_name} ${staffProfile.doctors.users.middle_name ? staffProfile.doctors.users.middle_name + ' ' : ''}${staffProfile.doctors.users.last_name}`
                          : "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!dentistProfile && !staffProfile && (
                <div className="text-center py-8">
                  <p className="text-[hsl(258_22%_50%)]">No additional profile information available.</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-[hsl(258_22%_50%)] italic">
                  Professional information cannot be edited directly. Please contact your administrator for updates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Schedule Section */}
          {user.role === 'dentist' && dentistProfile?.doctor_id && (
            <DoctorSchedule 
              key={scheduleRefreshKey}
              doctorId={dentistProfile.doctor_id}
              title="My Weekly Availability"
              description="Your availability schedule for patient appointments"
              showEditButton={true}
              onEditClick={handleOpenScheduleModal}
            />
          )}

          {user.role === 'dental_staff' && staffProfile?.doctor_id && (
            <DoctorSchedule 
              key={scheduleRefreshKey}
              doctorId={staffProfile.doctor_id}
              title="Assigned Doctor's Weekly Availability"
              description={`Schedule for ${staffProfile.doctors?.users ? `Dr. ${staffProfile.doctors.users.first_name} ${staffProfile.doctors.users.last_name}` : 'your assigned doctor'}`}
              showEditButton={false}
            />
          )}
        </>
      )}

      {/* Edit Schedule Modal */}
      {user.role === 'dentist' && dentistProfile?.doctor_id && (
        <EditScheduleModal
          doctorId={dentistProfile.doctor_id}
          isOpen={isScheduleModalOpen}
          onClose={handleCloseScheduleModal}
          onSave={handleScheduleSaved}
        />
      )}
    </div>
  );
}
