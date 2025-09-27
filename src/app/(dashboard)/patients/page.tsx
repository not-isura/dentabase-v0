"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Search } from "lucide-react";

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Patients</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage patient information and medical history</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
          <Button variant="outline" className="cursor-pointer">
            <Search className="h-4 w-4 mr-2" />
            Search Patients
          </Button>
        </div>
      </div>

      {/* Sample Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Patient Management</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Manage patient information and medical history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Patients Page</h3>
            <p>This is a sample patients page. The full patient management functionality will be implemented here.</p>
            <p className="mt-2">Features will include: patient profiles, contact information, medical history, and treatment plans.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
