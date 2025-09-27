"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Filter } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Appointments</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage your dental appointments and schedule</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
          <Button variant="outline" className="cursor-pointer">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Sample Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Appointment Management</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Manage your dental appointments and schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Appointments Page</h3>
            <p>This is a sample appointments page. The full appointment management functionality will be implemented here.</p>
            <p className="mt-2">Features will include: booking, scheduling, patient management, and appointment history.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
