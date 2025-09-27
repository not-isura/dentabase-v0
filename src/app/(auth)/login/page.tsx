"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      // TODO: Implement actual login logic with onLogin callback
      console.log("Login attempted with:", email, password);
      
      // Redirect to dashboard after successful login
      window.location.href = "/dashboard";
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