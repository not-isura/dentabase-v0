/**
 * Auth Types - TypeScript interfaces for authentication and user data
 * 
 * These types match the database schema:
 * - users table: Main user profile information
 * - patient table: Additional data for patients only
 */

// Matches the 'users' table in database
export interface UserProfile {
  user_id: string;
  auth_id: string;
  email: string; // Added from auth.users table
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string | null;
  gender: 'male' | 'female' | 'other' | 'unspecified';
  role: 'admin' | 'patient' | 'dentist' | 'dental_staff';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

// Matches the 'patient' table in database (only for users with role='patient')
export interface PatientProfile {
  patient_id: string;
  user_id: string;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_no: string | null;
  created_at: string;
  updated_at: string;
}

// The shape of the Auth Context that components will consume
export interface AuthContextType {
  // User data
  user: UserProfile | null;
  patientProfile: PatientProfile | null;
  displayUser: UserProfile | null; // User to display in UI (persists during logout)
  
  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  
  // Actions
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  updatePatientProfile: (updates: Partial<PatientProfile>) => void;
  setIsLoggingOut: (value: boolean) => void;
}
