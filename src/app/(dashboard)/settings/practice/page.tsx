"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Clock, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PracticeManagementPage() {
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
          <Building2 className="h-6 w-6 mr-3" />
          Practice Management
        </h2>
        <p className="text-[hsl(258_22%_50%)]">Manage clinic information and operational settings</p>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Practice Management</CardTitle>
          <CardDescription>Configure your dental practice settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Practice Management Page</h3>
            <p>This page will contain practice management functionality.</p>
            <p className="mt-2">Features will include: clinic information, working hours, appointment slots, and service types.</p>
            
            {/* Placeholder Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" className="cursor-pointer">
                <MapPin className="h-4 w-4 mr-2" />
                Clinic Info
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Clock className="h-4 w-4 mr-2" />
                Working Hours
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Phone className="h-4 w-4 mr-2" />
                Contact Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
