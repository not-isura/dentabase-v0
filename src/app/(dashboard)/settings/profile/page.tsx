"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft, Lock, Bell, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PersonalSettingsPage() {
  const router = useRouter();

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
          <User className="h-6 w-6 mr-3" />
          Personal Settings
        </h2>
        <p className="text-[hsl(258_22%_50%)]">Your profile and account preferences</p>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Personal Settings</CardTitle>
          <CardDescription>Manage your personal account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Personal Settings Page</h3>
            <p>This page will contain personal settings functionality.</p>
            <p className="mt-2">Features will include: profile information, change password, notification preferences, and display settings.</p>
            
            {/* Placeholder Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Bell className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
