"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft, Database, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SystemConfigurationPage() {
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
          <Settings className="h-6 w-6 mr-3" />
          System Configuration
        </h2>
        <p className="text-[hsl(258_22%_50%)]">System-wide settings and configurations</p>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">System Configuration</CardTitle>
          <CardDescription>Configure system-wide settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">System Configuration Page</h3>
            <p>This page will contain system configuration functionality.</p>
            <p className="mt-2">Features will include: database backup, email settings, SMS configuration, and security policies.</p>
            
            {/* Placeholder Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" className="cursor-pointer">
                <Database className="h-4 w-4 mr-2" />
                Database Settings
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Mail className="h-4 w-4 mr-2" />
                Email Config
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Shield className="h-4 w-4 mr-2" />
                Security Policies
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
