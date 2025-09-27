"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Settings as SettingsIcon, 
  User, 
  BarChart3,
  Shield,
  Bell,
  Database,
  ChevronRight,
  HelpCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsCategory {
  icon: any;
  title: string;
  description: string;
  items: string[];
  route: string;
  priority?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  
  // System management settings categories
  const systemSettings: SettingsCategory[] = [
    {
      icon: Users,
      title: "Account Management",
      description: "Create and manage dentist and staff accounts",
      items: ["Create Dentist Account", "Create Staff Account", "Manage User Roles", "User Permissions"],
      route: "/settings/accounts",
      priority: true
    },
    {
      icon: Building2,
      title: "Clinic Operations",
      description: "Clinic information and operational settings",
      items: ["Clinic Information", "Working Hours", "Appointment Slots", "Service Types"],
      route: "/settings/practice"
    },
    {
      icon: SettingsIcon,
      title: "System Configuration",
      description: "System-wide settings and configurations",
      items: ["Database Backup", "Email Settings", "SMS Configuration", "Security Policies"],
      route: "/settings/system"
    }
  ];

  // Personal settings for all users
  const personalSettings: SettingsCategory[] = [
    {
      icon: User,
      title: "My Profile",
      description: "Your profile and account preferences",
      items: ["Profile Picture", "Personal Information", "Contact Information", "Additional Details"],
      route: "/settings/profile"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure your notification preferences",
      items: ["Email Notifications", "SMS Alerts", "Desktop Notifications", "Appointment Reminders"],
      route: "/settings/notifications"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Security settings and privacy controls",
      items: ["Two-Factor Authentication", "Login Sessions", "Access Logs", "Data Privacy"],
      route: "/settings/security"
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      description: "Get assistance and access documentation",
      items: ["User Guide", "FAQ", "Contact Support", "System Status"],
      route: "/settings/help"
    }
  ];

  // Analytics and reports settings
  const analyticsSettings: SettingsCategory[] = [
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "System reports and user activity analytics",
      items: ["User Activity Logs", "System Usage Reports", "Export Data", "Performance Metrics"],
      route: "/settings/reports"
    }
  ];

  // For UI focus, display all settings categories
  const allSettings = [
    ...systemSettings,
    ...personalSettings,
    ...analyticsSettings
  ];

  const handleCardClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Settings</h2>
        <p className="text-[hsl(258_22%_50%)]">
          Manage your account, system settings, and preferences
        </p>
      </div>

      {/* Settings Categories Grid */}
      <div className="space-y-8">
        
        {/* SYSTEM MANAGEMENT SECTION */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Administrator Settings
            </h3>
            <p className="text-sm text-[hsl(258_22%_50%)]">
              System management and administrative controls
            </p>
          </div>

          {/* Administrator Access Badge */}
          <div className="bg-gradient-to-r from-[hsl(258_46%_25%)] to-[hsl(258_46%_30%)] text-white px-4 py-2 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Administrator Access</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {systemSettings.map((category, index) => (
              <Card 
                key={`admin-${index}`} 
                className="bg-white hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-[hsl(258_46%_25%)] hover:border-l-[hsl(258_46%_20%)]"
                onClick={() => handleCardClick(category.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[hsl(258_46%_25%)] text-white">
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-[hsl(258_46%_25%)] text-lg">{category.title}</CardTitle>
                        <CardDescription className="text-[hsl(258_22%_50%)] text-sm mt-1">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[hsl(258_22%_50%)] opacity-50" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center text-sm text-[hsl(258_22%_50%)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(258_46%_25%)] mr-2 opacity-60"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                    {category.items.length > 3 && (
                      <div className="text-xs text-[hsl(258_22%_50%)] mt-2">
                        +{category.items.length - 3} more options
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* PERSONAL SECTION */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Settings
            </h3>
            <p className="text-sm text-[hsl(258_22%_50%)]">
              Your account preferences and personal configurations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {personalSettings.map((category, index) => (
              <Card 
                key={`general-${index}`} 
                className="bg-white hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-[hsl(258_46%_25%)]"
                onClick={() => handleCardClick(category.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[hsl(258_46%_25%)] text-white">
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-[hsl(258_46%_25%)] text-lg">{category.title}</CardTitle>
                        <CardDescription className="text-[hsl(258_22%_50%)] text-sm mt-1">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[hsl(258_22%_50%)] opacity-50" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center text-sm text-[hsl(258_22%_50%)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(258_46%_25%)] mr-2 opacity-60"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                    {category.items.length > 3 && (
                      <div className="text-xs text-[hsl(258_22%_50%)] mt-2">
                        +{category.items.length - 3} more options
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </h3>
            <p className="text-sm text-[hsl(258_22%_50%)]">
              System analytics and reporting tools
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {analyticsSettings.map((category, index) => (
              <Card 
                key={`analytics-${index}`} 
                className="bg-white hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-[hsl(258_46%_25%)]"
                onClick={() => handleCardClick(category.route)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[hsl(258_46%_25%)] text-white">
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-[hsl(258_46%_25%)] text-lg">{category.title}</CardTitle>
                        <CardDescription className="text-[hsl(258_22%_50%)] text-sm mt-1">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[hsl(258_22%_50%)] opacity-50" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center text-sm text-[hsl(258_22%_50%)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(258_46%_25%)] mr-2 opacity-60"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                    {category.items.length > 3 && (
                      <div className="text-xs text-[hsl(258_22%_50%)] mt-2">
                        +{category.items.length - 3} more options
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {/* System Info Footer */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed">
        <CardContent className="text-center py-6">
          <div className="flex items-center justify-center space-x-4 text-sm text-[hsl(258_22%_50%)]">
            <div className="flex items-center space-x-1">
              <Database className="h-4 w-4" />
              <span>Dentabase v1.0.0</span>
            </div>
            <span>•</span>
            <span>Last updated: September 2024</span>
            <span>•</span>
            <span className="text-green-600">System Healthy</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
