"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "unspecified">("unspecified");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNo, setEmergencyContactNo] = useState("");
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Personal Info, 2: Contact & Emergency

  // Password validation
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const passwordStrength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':\\"|<>?,./`~]/.test(password);
  const passwordMeetsAllRequirements = passwordStrength && hasLowercase && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if still on Step 1
    if (currentStep === 1) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!passwordsMatch) {
        throw new Error("Passwords do not match");
      }
      if (!passwordStrength) {
        throw new Error("Password must be at least 8 characters long");
      }

      const supabase = createClient();

      // Step 1: Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create account");
      }

      console.log("✅ Auth account created:", authData.user.id);

      // Step 2 & 3: Call database function to create user profile and patient record
      // This function bypasses RLS, allowing unverified users to create their profile
      const { data: profileResult, error: profileError } = await supabase.rpc(
        "create_user_profile",
        {
          p_auth_id: authData.user.id,
          p_first_name: firstName.trim(),
          p_middle_name: middleName.trim() || null,
          p_last_name: lastName.trim(),
          p_phone_number: phone.trim() || null,
          p_gender: gender,
          p_address: address.trim(),
          p_emergency_contact_name: emergencyContactName.trim(),
          p_emergency_contact_no: emergencyContactNo.trim(),
        }
      );

      if (profileError) {
        console.error("❌ Profile creation error:", profileError);
        throw new Error("Failed to create user profile: " + profileError.message);
      }

      // Check if the function returned an error
      if (profileResult && !profileResult.success) {
        console.error("❌ Profile creation failed:", profileResult.error);
        throw new Error(profileResult.message || "Failed to create user profile");
      }

      console.log("✅ User profile and patient record created:", profileResult);

      // Step 4: Check if email verification is required
      const needsVerification = !authData.user.email_confirmed_at;

      if (needsVerification) {
        // Email verification required
        console.log("📧 Email verification required. Verification email sent to:", authData.user.email);
        
        // Sign out the temporary session
        await supabase.auth.signOut();
        
        // Redirect to login with info message
        router.push(
          "/login?type=info&message=Registration successful! Please check your email to verify your account before logging in."
        );
      } else {
        // No email verification needed - user is already logged in
        console.log("✅ Registration successful! No email verification required.");
        
        // Redirect directly to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during registration");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(258_46%_25%/0.1)] via-[hsl(330_100%_99%)] to-[hsl(36_60%_78%/0.1)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="h-24 w-24 rounded-full bg-[hsl(258_46%_25%)] mx-auto mb-4 flex items-center justify-center">
            <Image 
              src="/logo-white-outline.png" 
              alt="Dentabase Logo" 
              width={64} 
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[hsl(258_46%_25%)]">Create Your Account</h1>
          <p className="text-[hsl(258_22%_50%)] mt-2">Join Dentabase as a patient</p>
        </div>

        {/* Registration Card */}
        <Card className="border-border/50 shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-[hsl(258_46%_25%)]">Patient Registration</CardTitle>
            <CardDescription className="text-center text-[hsl(258_22%_50%)]">
              Step {currentStep} of 2: {currentStep === 1 ? "Personal Information" : "Contact & Emergency Details"}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Registration Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[hsl(258_46%_25%)]">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Name Fields - Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[hsl(258_46%_25%)]">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName" className="text-[hsl(258_46%_25%)]">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        type="text"
                        placeholder="Optional"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[hsl(258_46%_25%)]">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-[hsl(258_46%_25%)]">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isLoading}
                    >
                      <option value="unspecified">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[hsl(258_46%_25%)]">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {password && (
                      <div className="space-y-1">
                        <p className={`text-xs ${passwordMeetsAllRequirements ? 'text-green-600 font-medium' : 'text-amber-600'}`}>
                          {passwordMeetsAllRequirements ? '✓ Password meets all requirements' : 'Password requirements:'}
                        </p>
                        {!passwordMeetsAllRequirements && (
                          <ul className="text-xs space-y-0.5 ml-4">
                            <li className={passwordStrength ? 'text-green-600' : 'text-gray-500'}>
                              {passwordStrength ? '✓' : '○'} At least 8 characters
                            </li>
                            <li className={hasLowercase ? 'text-green-600' : 'text-gray-500'}>
                              {hasLowercase ? '✓' : '○'} One lowercase letter (a-z)
                            </li>
                            <li className={hasUppercase ? 'text-green-600' : 'text-gray-500'}>
                              {hasUppercase ? '✓' : '○'} One uppercase letter (A-Z)
                            </li>
                            <li className={hasNumber ? 'text-green-600' : 'text-gray-500'}>
                              {hasNumber ? '✓' : '○'} One number (0-9)
                            </li>
                            <li className={hasSpecial ? 'text-green-600' : 'text-gray-500'}>
                              {hasSpecial ? '✓' : '○'} One special character (!@#$%^&*...)
                            </li>
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[hsl(258_46%_25%)]">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmPassword && (
                      <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Contact & Emergency Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[hsl(258_46%_25%)]">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+63XXXXXXXXXX or 09XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-[hsl(258_22%_50%)]">
                      Format: +63XXXXXXXXXX (will be auto-normalized)
                    </p>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[hsl(258_46%_25%)]">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="address"
                      placeholder="Complete address (Street, Barangay, City, Province)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      disabled={isLoading}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-[hsl(258_46%_25%)]" />
                      <h3 className="font-semibold text-[hsl(258_46%_25%)]">Emergency Contact</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName" className="text-[hsl(258_46%_25%)]">
                        Emergency Contact Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="emergencyContactName"
                        type="text"
                        placeholder="Full name of emergency contact"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactNo" className="text-[hsl(258_46%_25%)]">
                        Emergency Contact Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="emergencyContactNo"
                        type="tel"
                        placeholder="+63XXXXXXXXXX or 09XXXXXXXXX"
                        value={emergencyContactNo}
                        onChange={(e) => setEmergencyContactNo(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* Navigation Buttons */}
              <div className="flex gap-3 w-full">
                {currentStep === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault(); // Explicitly prevent form submission
                      e.stopPropagation(); // Stop event bubbling
                      setCurrentStep(1);
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                )}
                
                {currentStep === 1 ? (
                  <Button
                    type="button"
                    className="flex-1 bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white"
                    onClick={(e) => {
                      e.preventDefault(); // Explicitly prevent form submission
                      e.stopPropagation(); // Stop event bubbling
                      
                      // Validate step 1 fields
                      if (!email || !firstName || !lastName || !password || !confirmPassword) {
                        setError("Please fill in all required fields");
                        return;
                      }
                      if (!passwordsMatch) {
                        setError("Passwords do not match");
                        return;
                      }
                      if (!passwordStrength) {
                        setError("Password must be at least 8 characters long");
                        return;
                      }
                      
                      // Validate Supabase password requirements
                      const hasLowercase = /[a-z]/.test(password);
                      const hasUppercase = /[A-Z]/.test(password);
                      const hasNumber = /[0-9]/.test(password);
                      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':\\"|<>?,./`~]/.test(password);
                      
                      if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
                        setError("Password must contain at least one lowercase letter, uppercase letter, number, and special character");
                        return;
                      }
                      
                      setError(null);
                      setCurrentStep(2);
                    }}
                    disabled={isLoading}
                  >
                    Next: Contact Details
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white"
                    disabled={isLoading || !address || !emergencyContactName || !emergencyContactNo}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                )}
              </div>

              {/* Login Link */}
              <div className="text-center text-sm">
                <span className="text-gray-500">Already have an account?</span>{" "}
                <Link href="/login" className="text-[hsl(258_46%_25%)] hover:underline font-medium">
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Privacy Notice */}
        <div className="mt-6 text-center text-xs text-[hsl(258_22%_50%)]">
          By creating an account, you agree to our{" "}
          <Link href="/privacy" className="underline hover:text-[hsl(258_46%_25%)]">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline hover:text-[hsl(258_46%_25%)]">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}