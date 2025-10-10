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
import { 
  ArrowLeft, 
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

  // Editable fields (only for patients)
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNo, setEmergencyContactNo] = useState("");

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

  const handleSave = async () => {
    if (!user) return;

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
  };

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
            className="text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.1)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
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
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings")}
          className="text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.1)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
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
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  className="border-[hsl(258_46%_25%/0.3)]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[hsl(258_46%_25%)]">{phone || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center text-[hsl(258_22%_50%)]">
                <MapPin className="h-4 w-4 mr-2" />
                Address
              </Label>
              {isEditing ? (
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  rows={3}
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
                  Contact Name
                </Label>
                {isEditing ? (
                  <Input
                    id="emergencyName"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Full name of emergency contact"
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
                  Contact Number
                </Label>
                {isEditing ? (
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={emergencyContactNo}
                    onChange={(e) => setEmergencyContactNo(e.target.value)}
                    placeholder="+63 912 345 6789"
                    className="border-[hsl(258_46%_25%/0.3)]"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-[hsl(258_46%_25%)]">{emergencyContactNo || "Not set"}</p>
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
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !phone}
                    className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)]"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)]"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Patient Users Card */}
      {user.role !== "patient" && (
        <Card className="bg-gray-50">
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-[hsl(258_46%_25%)]" />
            <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] mb-2">
              Staff/Dentist Profile
            </h3>
            <p className="text-[hsl(258_22%_50%)]">
              Additional profile features for staff members will be available soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
