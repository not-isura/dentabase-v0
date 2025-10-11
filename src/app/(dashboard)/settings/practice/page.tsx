"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, ChevronRight, Clock, CalendarDays, List, User } from "lucide-react";
import { useRouter } from "next/navigation";


export default function ClinicOperationsPage() {
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
        <span className="text-[hsl(258_46%_25%)] font-semibold">Clinic Operations</span>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)] flex items-center">
          <Building2 className="h-6 w-6 mr-3" />
          Clinic Operations & Scheduling
        </h2>
        <p className="text-[hsl(258_22%_50%)]">Manage clinic information, working hours, appointment slots, and service types</p>
      </div>

      {/* Clinic Information */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Clinic Information</CardTitle>
          <CardDescription>Basic details about your clinic</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Clinic Name</label>
              <input type="text" className="w-full border rounded px-3 py-2 mt-1" placeholder="Enter clinic name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Address</label>
              <input type="text" className="w-full border rounded px-3 py-2 mt-1" placeholder="Street, City, State, Zip" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Contact Number</label>
                <input type="text" className="w-full border rounded px-3 py-2 mt-1" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Email</label>
                <input type="email" className="w-full border rounded px-3 py-2 mt-1" placeholder="Email address" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Website</label>
              <input type="text" className="w-full border rounded px-3 py-2 mt-1" placeholder="Website (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Description/About</label>
              <textarea className="w-full border rounded px-3 py-2 mt-1" rows={3} placeholder="Short description about the clinic" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(258_46%_25%)]">Logo/Image</label>
              <input type="file" className="w-full border rounded px-3 py-2 mt-1" />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" className="bg-[hsl(258_46%_25%)] text-white">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
            <Clock className="h-5 w-5" /> Working Hours
          </CardTitle>
          <CardDescription>Set your clinic's operating hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl mx-auto">
            <table className="w-full text-[hsl(258_22%_50%)]">
              <thead>
                <tr>
                  <th className="text-left py-2">Day</th>
                  <th className="text-left py-2">Open</th>
                  <th className="text-left py-2">Close</th>
                  <th className="text-left py-2">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                  <tr key={day}>
                    <td className="py-2">{day}</td>
                    <td className="py-2"><input type="time" className="border rounded px-2" /></td>
                    <td className="py-2"><input type="time" className="border rounded px-2" /></td>
                    <td className="py-2"><input type="checkbox" defaultChecked /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline">Copy to All</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Slots & Service Types (Combined) */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)] flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Appointment Slots & Service Types
          </CardTitle>
          <CardDescription>Configure slots and services for each doctor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl mx-auto space-y-6">
            {/* Doctor Selector */}
            <div>
              <label className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-1">Select Doctor</label>
              <select className="w-full border rounded px-3 py-2">
                <option>Dr. Stone</option>
                <option>Dr. Smith</option>
                <option>Dr. Lee</option>
              </select>
            </div>
            {/* Slots Table */}
            <table className="w-full text-[hsl(258_22%_50%)]">
              <thead>
                <tr>
                  <th className="text-left py-2">Time Slot</th>
                  <th className="text-left py-2">Service Type</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Example slots, replace with dynamic data later */}
                {[
                  { time: "8:00 AM", service: "Cleaning" },
                  { time: "10:00 AM", service: "Consultation" },
                  { time: "1:00 PM", service: "Filling" },
                  { time: "3:00 PM", service: "Extraction" }
                ].map((slot, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      <input type="time" className="border rounded px-2" value={slot.time} readOnly />
                    </td>
                    <td className="py-2">
                      <select className="border rounded px-2">
                        <option>Cleaning</option>
                        <option>Consultation</option>
                        <option>Filling</option>
                        <option>Extraction</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <Button type="button" size="sm" variant="outline">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline">Add Slot</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
