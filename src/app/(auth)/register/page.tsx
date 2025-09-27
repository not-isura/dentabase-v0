"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    setIsLoading(true);
    
    // Simulate registration delay
    setTimeout(() => {
      setIsLoading(false);
      // TODO: Implement actual registration logic
      console.log("Registration attempted with:", { firstName, lastName, email, contactNumber, password });
    }, 1000);
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

        {/* Registration Card */}
        <Card className="border-border/50 shadow-lg bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-[hsl(258_46%_25%)]">Create Account</CardTitle>
            <CardDescription className="text-center text-[hsl(258_22%_50%)]">
              Join Dentabase to manage your dental practice
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[hsl(258_46%_25%)] pb-0.4 block">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[hsl(258_46%_25%)] pb-0.4 block">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[hsl(258_46%_25%)] pb-0.4 block">Email</Label>
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
                <Label htmlFor="contactNumber" className="text-[hsl(258_46%_25%)] pb-0.4 block">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="Enter your contact number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[hsl(258_46%_25%)] pb-0.4 block">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[hsl(258_46%_25%)] pb-0.4 block">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer" 
                disabled={isLoading || !firstName || !lastName || !email || !contactNumber || !password || !confirmPassword}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm">
                <span className="text-gray-500">Already have an account?</span>{" "}
                <Link href="/login" className="text-[hsl(258_46%_25%)] hover:underline font-medium cursor-pointer">
                  Sign in here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}