"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserPlus, 
  ArrowLeft, 
  Shield, 
  UserCheck, 
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = 'dentist' | 'staff';

interface NewUser {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

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
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [createTab, setCreateTab] = useState<'dentist' | 'staff'>('dentist');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for new user creation
  const [newUser, setNewUser] = useState<NewUser>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'dentist'
  });

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
      role: 'staff',
      status: 'active',
      created_at: '2024-09-15T14:30:00Z'
    }
  ]);

  // Redirect if not admin
  if (userProfile?.role !== 'admin') {
    router.push('/settings');
    return null;
  }

  const handleInputChange = (field: keyof NewUser, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Implement Supabase user creation
      console.log('Creating user:', newUser);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset form
      setNewUser({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: createTab
      });
      
      alert(`${createTab.charAt(0).toUpperCase() + createTab.slice(1)} account created successfully!`);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
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

      {/* Admin Badge */}
      <div className="bg-gradient-to-r from-[hsl(258_46%_25%)] to-[hsl(258_46%_30%)] text-white px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">Administrator Privileges Required</span>
        </div>
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
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Account Type Selection */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-[hsl(258_46%_25%)]">Select Account Type</CardTitle>
              <CardDescription>Choose the type of account you want to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setCreateTab('dentist');
                    setNewUser(prev => ({ ...prev, role: 'dentist' }));
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    createTab === 'dentist'
                      ? 'border-[hsl(258_46%_25%)] bg-[hsl(258_46%_25%/0.05)]'
                      : 'border-[hsl(258_22%_90%)] hover:border-[hsl(258_46%_25%)]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      createTab === 'dentist' ? 'bg-[hsl(258_46%_25%)] text-white' : 'bg-[hsl(258_46%_25%/0.1)] text-[hsl(258_46%_25%)]'
                    }`}>
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[hsl(258_46%_25%)]">Dentist Account</h3>
                      <p className="text-sm text-[hsl(258_22%_50%)]">Full access to patient records and procedures</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setCreateTab('staff');
                    setNewUser(prev => ({ ...prev, role: 'staff' }));
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    createTab === 'staff'
                      ? 'border-[hsl(258_46%_25%)] bg-[hsl(258_46%_25%/0.05)]'
                      : 'border-[hsl(258_22%_90%)] hover:border-[hsl(258_46%_25%)]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      createTab === 'staff' ? 'bg-[hsl(258_46%_25%)] text-white' : 'bg-[hsl(258_46%_25%/0.1)] text-[hsl(258_46%_25%)]'
                    }`}>
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[hsl(258_46%_25%)]">Staff Account</h3>
                      <p className="text-sm text-[hsl(258_22%_50%)]">Appointment management and basic operations</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Account Creation Form */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-[hsl(258_46%_25%)]">
                Create {createTab.charAt(0).toUpperCase() + createTab.slice(1)} Account
              </CardTitle>
              <CardDescription>
                Fill in the details to create a new {createTab} account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      placeholder="Enter first name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      type="text"
                      value={newUser.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      placeholder="Enter middle name (optional)"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      placeholder="Enter last name"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        placeholder="Enter password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={newUser.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        placeholder="Confirm password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)]"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setNewUser({
                      firstName: '',
                      middleName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      role: createTab
                    })}
                  >
                    Clear Form
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_20%)]"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create {createTab.charAt(0).toUpperCase() + createTab.slice(1)} Account
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'dentist' 
                              ? 'bg-[hsl(258_46%_25%/0.1)] text-[hsl(258_46%_25%)]'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
