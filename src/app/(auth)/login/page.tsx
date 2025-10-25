"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"info" | "warning" | "success" | "error">("info");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Get message from URL on mount
  useEffect(() => {
    const message = searchParams.get('message');
    const type = searchParams.get('type'); // Get message type from URL
    
    if (message) {
      setInfoMessage(decodeURIComponent(message));
      
      // Determine variant based on type parameter or message content
      if (type === 'warning' || type === 'error') {
        setMessageVariant('warning');
      } else if (type === 'success') {
        setMessageVariant('success');
      } else if (message.toLowerCase().includes('login to continue') || message.toLowerCase().includes('session expired')) {
        setMessageVariant('warning');
      } else {
        setMessageVariant('info');
      }
      
      // Clear message from URL after 5 seconds
      setTimeout(() => {
        setInfoMessage(null);
      }, 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Handle specific error: Email not confirmed
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setShowResendVerification(true);
          throw new Error(
            "Please verify your email address. Check your inbox for a verification link, or click 'Resend verification email' below."
          );
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("No user data returned");
      }

      // 2. Query users table to get role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, first_name")
        .eq("auth_id", authData.user.id)
        .single();

      if (userError) {
        throw new Error("Failed to fetch user data: " + userError.message);
      }

      if (!userData) {
        throw new Error("User profile not found");
      }

      console.log("✅ Login successful:", userData);

      // 3. Redirect based on role
      switch (userData.role) {
        case "patient":
          router.push("/appointments/patient");
          break;
        case "dentist":
          router.push("/appointments/admin");
          break;
        case "dental_staff":
          router.push("/appointments/admin");
          break;
        case "admin":
          router.push("/settings");
          break;
        default:
          router.push("/settings");
      }

      // Force a router refresh to update session state
      router.refresh();
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during login");
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (resendError) {
        throw new Error(resendError.message);
      }

      setInfoMessage("Verification email sent! Please check your inbox.");
      setMessageVariant("success");
      setShowResendVerification(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setInfoMessage(null);
      }, 5000);
    } catch (err) {
      console.error("❌ Resend verification error:", err);
      setError(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(258_46%_25%/0.1)] via-[hsl(330_100%_99%)] to-[hsl(36_60%_78%/0.1)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-3xl font-bold text-[hsl(258_46%_25%)]">Dentabase</h1>
          <p className="text-[hsl(258_22%_50%)] mt-2">Dental Appointment & Patient Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-[hsl(258_46%_25%)]">Welcome Back</CardTitle>
            <CardDescription className="text-center text-[hsl(258_22%_50%)]">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Info Message from URL */}
              {infoMessage && (
                <Alert variant={messageVariant}>
                  {infoMessage}
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Login Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    {showResendVerification && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full text-[hsl(258_46%_25%)] border-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.1)]"
                        onClick={handleResendVerification}
                        disabled={isResending}
                      >
                        {isResending ? "Sending..." : "Resend Verification Email"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[hsl(258_46%_25%)] pb-0.4 block ">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[hsl(258_46%_25%)] pb-0.4 block ">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-right -mt-2 -mb-2">
                <Link href="/forgot-password" className="text-sm text-[hsl(258_46%_25%)] hover:underline cursor-pointer">
                  Forgot Password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer" 
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-center text-sm">
                <span className="text-gray-500">Don't have an account?</span>{" "}
                <Link href="/register" className="text-[hsl(258_46%_25%)] hover:underline font-medium cursor-pointer">
                  Sign up here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}