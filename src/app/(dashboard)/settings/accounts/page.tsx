"use client";

import React, { useState, useEffect } from "react";
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
  EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type UserRole = "admin" | "dentist" | "dental_staff" | "patient";
type AccountStatus = "active" | "inactive";


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
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AccountManagementPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAccount, setNewAccount] = useState<NewAccount>(INITIAL_ACCOUNT_STATE);

  // Mock data for existing users - in real app, this would come from Supabase
  const [existingUsers] = useState<ExistingUser[]>([
    {
      user_id: '1',
      first_name: 'Dr. Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@dentabase.com',
      role: 'dentist',
      status: 'active',
      created_at: '2024-09-01T10:00:00Z'
    },
    {
      user_id: '2',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      email: 'maria.rodriguez@dentabase.com',
      role: 'dental_staff',
      status: 'active',
      created_at: '2024-09-15T14:30:00Z'
    }
  ]);

  // Protect route - redirect non-admins
  useEffect(() => {
    if (!isLoadingAuth && user && user.role !== 'admin') {
      router.push('/404');
    }
  }, [user, isLoadingAuth, router]);

  // Show loading state while checking auth or if unauthorized
  if (isLoadingAuth || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(258_46%_25%)] border-t-transparent mx-auto mb-4" />
          <p className="text-[hsl(258_22%_50%)]">Loading...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof NewAccount, value: string) => {
    setNewAccount(prev => ({ ...prev, [field]: value }));
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

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

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
          // Doctor-specific fields
          specialization: newAccount.specialization,
          licenseNumber: newAccount.licenseNumber,
          clinicAssignment: newAccount.clinicAssignment,
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

      // Success! Reset form
      setNewAccount({
        ...INITIAL_ACCOUNT_STATE,
        role: newAccount.role,
        status: newAccount.status,
      });
      
      alert(`${roleLabel} account created successfully!\n\nEmail: ${newAccount.email}\nTemp Password: ${newAccount.tempPassword}\n\nPlease share these credentials with the new user.`);
      
      // Clear password after showing it
      setShowPassword(false);
    } catch (error: any) {
      console.error("Error creating account:", error);
      alert(`Failed to create account:\n${error.message}`);
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

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "dentist":
        return "bg-[hsl(258_46%_25%/0.1)] text-[hsl(258_46%_25%)]";
      case "dental_staff":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/settings')}
          className="text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.1)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
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
      <div className="border-b border-[hsl(258_22%_90%)]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'create'
                ? 'border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)]'
                : 'border-transparent text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] hover:border-[hsl(258_22%_90%)]'
            }`}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Create Accounts
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'manage'
                ? 'border-[hsl(258_46%_25%)] text-[hsl(258_46%_25%)]'
                : 'border-transparent text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] hover:border-[hsl(258_22%_90%)]'
            }`}
          >
            <UserCheck className="h-4 w-4 inline mr-2" />
            Manage Users
          </button>
        </nav>
      </div>

      {/* Create Accounts Tab */}
      {activeTab === "create" && (
        <div className="space-y-6">
          <Card className="mx-auto max-w-4xl bg-white">
            <CardHeader>
              <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Create Account
              </CardTitle>
              <CardDescription>
                Complete the details below to add a new team member. All fields can be edited later from the Manage tab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-8">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[hsl(258_22%_50%)]">General Information</h3>
                    <p className="text-xs text-gray-500">These details apply to every account regardless of role.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
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
                        placeholder="Optional"
                        className="mt-1"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p>
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
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
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAccount.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        placeholder="name@dentabase.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={newAccount.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        placeholder="Optional"
                        className="mt-1"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p>
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <select
                        id="gender"
                        value={newAccount.gender}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        required
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="unspecified">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div>
                      <Label htmlFor="tempPassword">Temporary Password *</Label>
                      <div className="mt-1">
                        <div className="relative w-full">
                          <Input
                            id="tempPassword"
                            type={showPassword ? "text" : "password"}
                            value={newAccount.tempPassword}
                            onChange={(e) => handleInputChange("tempPassword", e.target.value)}
                            required
                            placeholder="dentabase2025"
                            className="pr-10"
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
                      <p className="mt-1 text-xs text-gray-500">Default password: dentabase2025. Users should change it after first login.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:content-start">
                      <div>
                        <Label htmlFor="role">Role *</Label>
                        <select
                          id="role"
                          value={newAccount.role}
                          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                          className="mt-1 w-full rounded-md border border-[hsl(258_22%_90%)] bg-white px-3 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)]"
                        >
                          <option value="admin">Admin</option>
                          <option value="dentist">Dentist</option>
                          <option value="dental_staff">Dental Staff</option>
                          <option value="patient">Patient</option>
                        </select>
                      </div>
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
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          value={newAccount.specialization}
                          onChange={(e) => handleInputChange("specialization", e.target.value)}
                          placeholder="e.g., General Dentistry, Orthodontics"
                          className="mt-1"
                        />
                        <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p>
                      </div>
                      <div>
                        <Label htmlFor="licenseNumber">License / PRC Number</Label>
                        <Input
                          id="licenseNumber"
                          value={newAccount.licenseNumber}
                          onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                          placeholder="Optional"
                          className="mt-1"
                        />
                        <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p>
                      </div>
                      <div>
                        <Label htmlFor="clinicAssignment">Clinic Room / Chair Assignment</Label>
                        <Input
                          id="clinicAssignment"
                          value={newAccount.clinicAssignment}
                          onChange={(e) => handleInputChange("clinicAssignment", e.target.value)}
                          placeholder="Optional"
                          className="mt-1"
                        />
                        <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="scheduleAvailability">Schedule Availability</Label>
                        <textarea
                          id="scheduleAvailability"
                          value={newAccount.scheduleAvailability}
                          onChange={(e) => handleInputChange("scheduleAvailability", e.target.value)}
                          placeholder="Optional notes or upcoming schedule blocks"
                          className="mt-1 min-h-[90px] w-full rounded-md border border-[hsl(258_22%_90%)] px-3 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)]"
                        />
                        <p className="mt-1 text-xs text-gray-500">Optional placeholder – integrate with calendar in the future.</p>
                      </div>
                    </div>
                  )}

                  {newAccount.role === "dental_staff" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="designation">Position / Designation</Label>
                        <Input
                          id="designation"
                          value={newAccount.designation}
                          onChange={(e) => handleInputChange("designation", e.target.value)}
                          placeholder="e.g., Dental Assistant, Hygienist"
                          className="mt-1"
                        />
                        <p className="mt-1 text-xs text-gray-500">Optional field – can be updated later.</p>
                      </div>
                      <div>
                        <Label htmlFor="assignedDoctor">Assigned Doctor</Label>
                        <select
                          id="assignedDoctor"
                          value={newAccount.assignedDoctor}
                          onChange={(e) => handleInputChange("assignedDoctor", e.target.value)}
                          className="mt-1 w-full rounded-md border border-[hsl(258_22%_90%)] bg-white px-3 py-2 text-sm text-[hsl(258_46%_25%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%/0.3)]"
                        >
                          <option value="">Select doctor (optional)</option>
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
                        <Label htmlFor="address">Address *</Label>
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
                        <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                        <Input
                          id="emergencyContactName"
                          value={newAccount.emergencyContactName}
                          onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                          placeholder="Full name"
                          className="mt-1"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">Name of emergency contact person.</p>
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactNo">Emergency Contact Number *</Label>
                        <Input
                          id="emergencyContactNo"
                          value={newAccount.emergencyContactNo}
                          onChange={(e) => handleInputChange("emergencyContactNo", e.target.value)}
                          placeholder="Phone number"
                          className="mt-1"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">Contact number for emergencies.</p>
                      </div>
                    </div>
                  )}

                  {newAccount.role === "admin" && (
                    <div className="rounded-md border border-dashed border-[hsl(258_22%_90%)] bg-[hsl(258_46%_25%/0.02)] p-4 text-sm text-[hsl(258_22%_50%)]">
                      Admin accounts only require the general information above. No extra fields needed.
                    </div>
                  )}
                </section>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[hsl(258_46%_25%)] px-6 text-white hover:bg-[hsl(258_46%_22%)]"
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
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(258_22%_50%)]" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-[hsl(258_46%_25%)]">Existing Users</CardTitle>
              <CardDescription>Manage existing dentist and staff accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(258_22%_90%)]">
                      <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-[hsl(258_46%_25%)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingUsers.map((user) => (
                      <tr key={user.user_id} className="border-b border-[hsl(258_22%_90%)] hover:bg-[hsl(258_46%_25%/0.02)]">
                        <td className="py-3 px-4">
                          <div className="font-medium text-[hsl(258_46%_25%)]">
                            {user.first_name} {user.middle_name} {user.last_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[hsl(258_22%_50%)]">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyles(user.role)}`}>
                            {formatRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[hsl(258_22%_50%)]">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button className="p-1 hover:bg-[hsl(258_46%_25%/0.1)] rounded">
                            <MoreVertical className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {existingUsers.length === 0 && (
                <div className="text-center py-8 text-[hsl(258_22%_50%)]">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                  <p className="text-sm mt-1">Create your first user account to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
