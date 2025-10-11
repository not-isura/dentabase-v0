"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, PatientProfile, AuthContextType } from "@/types/auth.types";

// Create the context with undefined as initial value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * 
 * Responsibilities:
 * 1. Fetch user data on mount
 * 2. Subscribe to Supabase auth state changes
 * 3. Provide user data to all child components
 * 4. Handle loading and error states
 * 5. Provide methods to refresh and update user data
 * 
 * Usage:
 * Wrap your app with this provider in layout.tsx
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutUserSnapshot, setLogoutUserSnapshot] = useState<UserProfile | null>(null);

  /**
   * Fetch user profile data from database
   * Combines data from auth.users + users table + patient table (if applicable)
   */
  const fetchUserProfile = useCallback(async () => {
    console.log("🔄 [AuthContext] Fetching user profile...");
    
    try {
      const supabase = createClient();
      
      // 1. Get authenticated user from Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        // Silently handle "Auth session missing" errors (expected when logged out)
        if (authError.message?.includes("Auth session missing")) {
          console.log("ℹ️ [AuthContext] No active session (user is logged out)");
        } else {
          console.error("❌ [AuthContext] Auth error:", authError);
        }
        setUser(null);
        setPatientProfile(null);
        setIsLoading(false);
        return;
      }
      
      if (!authUser) {
        console.log("ℹ️ [AuthContext] No authenticated user found");
        setUser(null);
        setPatientProfile(null);
        setIsLoading(false);
        return;
      }
      
      console.log("✅ [AuthContext] Auth user found:", authUser.email);
      
      // 2. Fetch user profile from 'users' table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();
      
      if (userError || !userData) {
        console.error("❌ [AuthContext] Error fetching user data:", userError);
        setUser(null);
        setPatientProfile(null);
        setIsLoading(false);
        return;
      }
      
      // 3. Combine auth data with user data
      const userProfile: UserProfile = {
        ...userData,
        email: authUser.email || "",
      };
      
      console.log("✅ [AuthContext] User profile loaded:", {
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        role: userProfile.role,
        email: userProfile.email,
      });
      
      setUser(userProfile);
      
      // 4. If user is a patient, fetch patient profile
      if (userProfile.role === "patient") {
        console.log("🔄 [AuthContext] Fetching patient profile...");
        
        const { data: patientData, error: patientError } = await supabase
          .from("patient")
          .select("*")
          .eq("user_id", userProfile.user_id)
          .single();
        
        if (patientError || !patientData) {
          console.warn("⚠️ [AuthContext] No patient profile found:", patientError);
          setPatientProfile(null);
        } else {
          console.log("✅ [AuthContext] Patient profile loaded");
          setPatientProfile(patientData);
        }
      } else {
        console.log("ℹ️ [AuthContext] User is not a patient, skipping patient profile fetch");
        setPatientProfile(null);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      // Silently handle "Auth session missing" errors (expected when logged out)
      if (error?.message?.includes("Auth session missing") || error?.name === "AuthSessionMissingError") {
        console.log("ℹ️ [AuthContext] No active session (user is logged out)");
      } else {
        console.error("❌ [AuthContext] Unexpected error:", error);
      }
      setUser(null);
      setPatientProfile(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from database
   * Call this after updating profile to sync the context
   */
  const refreshUser = useCallback(async () => {
    console.log("🔄 [AuthContext] Manually refreshing user data...");
    setIsLoading(true);
    await fetchUserProfile();
  }, [fetchUserProfile]);

  /**
   * Update user data locally (optimistic update)
   * Note: This doesn't persist to database, just updates the context
   */
  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    console.log("🔄 [AuthContext] Optimistically updating user:", updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  /**
   * Update patient profile locally (optimistic update)
   * Note: This doesn't persist to database, just updates the context
   */
  const updatePatientProfile = useCallback((updates: Partial<PatientProfile>) => {
    console.log("🔄 [AuthContext] Optimistically updating patient profile:", updates);
    setPatientProfile((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    console.log("🚀 [AuthContext] Initializing Auth Context...");
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Subscribe to auth state changes
  useEffect(() => {
    const supabase = createClient();
    
    console.log("👂 [AuthContext] Subscribing to auth state changes...");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 [AuthContext] Auth state changed: ${event}`, {
        hasSession: !!session,
        userEmail: session?.user?.email,
      });
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("🔄 [AuthContext] Re-fetching user profile due to auth change...");
        // Clear logout state when signing in with new account
        setIsLoggingOut(false);
        setLogoutUserSnapshot(null);
        fetchUserProfile();
      } else if (event === "SIGNED_OUT") {
        console.log("👋 [AuthContext] User signed out, clearing context...");
        // Only clear if not in the middle of a manual logout (to prevent UI flash)
        if (!isLoggingOut) {
          setUser(null);
          setPatientProfile(null);
          setIsLoading(false);
        }
      }
    });
    
    return () => {
      console.log("🛑 [AuthContext] Unsubscribing from auth state changes...");
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, isLoggingOut]);

  const value: AuthContextType = {
    user,
    patientProfile,
    displayUser: isLoggingOut ? logoutUserSnapshot : user, // Use snapshot during logout
    isLoading,
    isAuthenticated: !!user,
    isLoggingOut,
    refreshUser,
    updateUser,
    updatePatientProfile,
    setIsLoggingOut: (value: boolean) => {
      if (value && user) {
        // Take a snapshot of current user before logout
        setLogoutUserSnapshot(user);
      } else if (!value) {
        // Clear snapshot when not logging out
        setLogoutUserSnapshot(null);
      }
      setIsLoggingOut(value);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
