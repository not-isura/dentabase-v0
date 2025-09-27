"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Filter, Download } from "lucide-react";

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Records</h2>
        <p className="text-[hsl(258_22%_50%)]">Access and manage patient medical records and treatment history</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            New Record
          </Button>
          <Button variant="outline" className="cursor-pointer">
            <Filter className="h-4 w-4 mr-2" />
            Filter Records
          </Button>
          <Button variant="outline" className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Sample Content */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Medical Records</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Access and manage patient medical records and treatment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-[hsl(258_22%_50%)]">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Records Page</h3>
            <p>This is a sample records page. The full medical records management functionality will be implemented here.</p>
            <p className="mt-2">Features will include: treatment records, X-rays, notes, prescriptions, and medical history tracking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
