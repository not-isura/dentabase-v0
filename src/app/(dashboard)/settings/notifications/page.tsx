"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Settings as SettingsIcon, Volume2, Mail, Smartphone, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsNotificationsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push("/settings")}
          className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] transition-colors cursor-pointer font-medium"
        >
          Settings
        </button>
        <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
        <span className="text-[hsl(258_46%_25%)] font-semibold">Notifications</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Notifications</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage your notification preferences and settings</p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Notifications Page</h3>
            <p>This page will contain notification management functionality.</p>
            <p className="mt-2">Features will include: email notifications, SMS alerts, push notifications, and appointment reminders.</p>
            
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" className="cursor-pointer">
                <Mail className="h-4 w-4 mr-2" />
                Email Settings
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Smartphone className="h-4 w-4 mr-2" />
                SMS Settings
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Volume2 className="h-4 w-4 mr-2" />
                Sound Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Recent Notifications</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            View your latest notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[hsl(258_22%_50%)]">
            <p className="text-sm">No recent notifications to display</p>
            <p className="text-xs mt-1">Notifications will appear here when available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
