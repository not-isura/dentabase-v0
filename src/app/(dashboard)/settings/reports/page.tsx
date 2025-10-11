"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft, ChevronRight, Download, Activity, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsAnalyticsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/settings')}
          className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] transition-colors cursor-pointer font-medium"
        >
          Settings
        </button>
        <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
        <span className="text-[hsl(258_46%_25%)] font-semibold">Reports & Analytics</span>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)] flex items-center">
          <BarChart3 className="h-6 w-6 mr-3" />
          Reports & Analytics
        </h2>
        <p className="text-[hsl(258_22%_50%)]">System reports and user activity analytics</p>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Reports & Analytics</CardTitle>
          <CardDescription>View system reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Reports & Analytics Page</h3>
            <p>This page will contain reports and analytics functionality.</p>
            <p className="mt-2">Features will include: user activity logs, system usage reports, export data, and performance metrics.</p>
            
            {/* Placeholder Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button variant="outline" className="cursor-pointer">
                <Activity className="h-4 w-4 mr-2" />
                Activity Logs
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Usage Reports
              </Button>
              <Button variant="outline" className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
