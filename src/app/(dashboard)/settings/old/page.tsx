"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bell, Shield, Database, Settings } from "lucide-react";

export default function SettingsPage() {
  const settingsCategories = [
    {
      icon: User,
      title: "Profile Settings",
      description: "Manage your account information and preferences",
      items: ["Personal Information", "Change Password", "Email Preferences"]
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure appointment reminders and system alerts",
      items: ["Email Notifications", "SMS Alerts", "Desktop Notifications"]
    },
    {
      icon: Shield,
      title: "Security",
      description: "Security settings and access controls",
      items: ["Two-Factor Authentication", "Login Sessions", "Access Logs"]
    },
    {
      icon: Database,
      title: "System Settings",
      description: "Practice management and system configuration",
      items: ["Practice Information", "Working Hours", "System Backup"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Settings</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage your account and system preferences</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category, index) => (
          <Card key={index} className="bg-white hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-[hsl(258_46%_25%/0.1)] flex items-center justify-center">
                  <category.icon className="h-5 w-5 text-[hsl(258_46%_25%)]" />
                </div>
                <div>
                  <CardTitle className="text-[hsl(258_46%_25%)]">{category.title}</CardTitle>
                  <CardDescription className="text-[hsl(258_22%_50%)]">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] cursor-pointer">
                    • {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Info */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">System Information</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Current system status and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[hsl(258_22%_50%)]">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Settings Page</h3>
            <p>This is a sample settings page. The full settings management functionality will be implemented here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
