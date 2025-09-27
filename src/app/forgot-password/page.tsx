"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate sending reset email
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      console.log("Password reset requested for:", email);
    }, 1500);
  };

  const handleBackToLogin = () => {
    window.location.href = "/login";
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

        {/* Forgot Password Card */}
        <Card className="border-border/50 shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-[hsl(258_46%_25%)]">
              {isSubmitted ? "Check Your Email" : "Forgot Password?"}
            </CardTitle>
            <CardDescription className="text-center text-[hsl(258_22%_50%)]">
              {isSubmitted 
                ? "We've sent a password reset link to your email address"
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[hsl(258_46%_25%)] pb-0.4 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(258_22%_50%)] h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer" 
                  disabled={isLoading || !email}
                >
                  {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-[hsl(258_46%_25%)] font-medium">Reset link sent!</p>
                  <p className="text-sm text-[hsl(258_22%_50%)]">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-[hsl(258_22%_50%)]">
                    Check your email and follow the instructions to reset your password.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={handleBackToLogin}
                  className="w-full bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer"
                >
                  Back to Login
                </Button>
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full cursor-pointer"
                >
                  Resend Email
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center text-[hsl(258_46%_25%)] hover:text-[hsl(258_46%_25%/0.8)] text-sm font-bold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-4 text-center">
          <p className="text-sm text-[hsl(258_22%_50%)]">
            Still having trouble? Contact your system administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}