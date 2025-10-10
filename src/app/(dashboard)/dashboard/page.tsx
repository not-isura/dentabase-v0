"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, FileText, TrendingUp, Clock, AlertCircle, Sparkles } from "lucide-react";
import { DashboardMessageHandler } from "@/components/dashboard-message-handler";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  // 🎯 Get real user data from Auth Context
  const { user, isLoading: isLoadingUser } = useAuth();

  const stats = [
    {
      title: "Today's Appointments",
      value: "8",
      description: "2 pending confirmations",
      icon: Calendar,
      trend: "+12% from yesterday"
    },
    {
      title: "Total Patients",
      value: "324",
      description: "Active patients",
      icon: Users,
      trend: "+5 new this week"
    },
    {
      title: "Records Updated",
      value: "15",
      description: "Today",
      icon: FileText,
      trend: "All up to date"
    },
    {
      title: "Average Wait Time",
      value: "12 min",
      description: "This week",
      icon: Clock,
      trend: "-3 min improved"
    }
  ];

  const recentActivity = [
    { time: "2:30 PM", action: "Appointment completed", patient: "John Smith" },
    { time: "1:15 PM", action: "Patient checked in", patient: "Maria Garcia" },
    { time: "11:45 AM", action: "New patient registered", patient: "Alex Johnson" },
    { time: "10:30 AM", action: "New appointment scheduled", patient: "Sarah Johnson" },
    { time: "09:45 AM", action: "Patient check-in completed", patient: "Mike Chen" },
    { time: "09:15 AM", action: "Treatment record updated", patient: "Emily Davis" },
    { time: "08:30 AM", action: "Appointment confirmed", patient: "David Wilson" }
  ];

  return (
    <div className="space-y-6">
      {/* Message Handler */}
      <DashboardMessageHandler />

      {/* Personalized Welcome Section */}
      <div className="bg-gradient-to-r from-[hsl(258_46%_25%)] to-[hsl(258_46%_30%)] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              {isLoadingUser ? (
                "Loading..."
              ) : user ? (
                <>
                  <Sparkles className="h-8 w-8 mr-3" />
                  Welcome back, {user.first_name}!
                </>
              ) : (
                "Welcome to Dentabase"
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Overview</h2>
        <p className="text-[hsl(258_22%_50%)]">Here's what's happening in your practice today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(258_22%_50%)]">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-[hsl(258_46%_25%)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(258_46%_25%)]">{stat.value}</div>
              <p className="text-xs text-[hsl(258_22%_50%)]">
                {stat.description}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white">
          <CardHeader>
            <CardTitle className="text-[hsl(258_46%_25%)]">Today's Schedule</CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "9:00 AM", patient: "John Smith", type: "Routine Cleaning", status: "confirmed" },
                { time: "10:30 AM", patient: "Maria Garcia", type: "Root Canal", status: "in-progress" },
                { time: "1:00 PM", patient: "Alex Johnson", type: "Consultation", status: "pending" },
                { time: "2:30 PM", patient: "Sarah Wilson", type: "Filling", status: "confirmed" },
              ].map((appointment, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[hsl(258_46%_25%)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{appointment.patient}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(258_22%_50%)]">{appointment.time} • {appointment.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white">
          <CardHeader>
            <CardTitle className="text-[hsl(258_46%_25%)]">Recent Activity</CardTitle>
            <CardDescription className="text-[hsl(258_22%_50%)]">
              Latest updates from your practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(258_46%_25%)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[hsl(258_46%_25%)]">{activity.action}</p>
                    <p className="text-xs text-[hsl(258_22%_50%)]">{activity.patient} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts/Notifications */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <AlertCircle className="h-5 w-5 mr-2" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Equipment Maintenance Due</p>
                <p className="text-xs text-yellow-600">Dental chair #2 requires scheduled maintenance</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Appointment Reminder</p>
                <p className="text-xs text-blue-600">Send reminders for tomorrow's appointments (5 patients)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extra content to demonstrate scrolling */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Practice Performance</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Monthly overview and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <h4 className="font-medium text-[hsl(258_46%_25%)]">Performance Metric {i + 1}</h4>
                <p className="text-sm text-[hsl(258_22%_50%)] mt-1">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
