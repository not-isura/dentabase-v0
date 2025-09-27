"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Edit, Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">My Profile</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage your personal information and account preferences</p>
      </div>

      {/* Profile Overview Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Update your personal details and profile settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <div className="h-24 w-24 rounded-full bg-[hsl(258_46%_25%)] flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">My Profile Page</h3>
            <p>This page will contain user profile management functionality.</p>
            <p className="mt-2">Features will include: personal information, profile photo, contact details, and account preferences.</p>
            
            {/* Placeholder Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <Button className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
