"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Home
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar, NavbarRight, UserProfile } from "@/components/ui/navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/appointments/admin", label: "Admin Appointments", icon: Calendar },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log("Logout clicked");
    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(258_46%_25%/0.02)] via-[hsl(330_100%_99%)] to-[hsl(36_60%_78%/0.02)]">
      <div className="flex">
        {/* Responsive Sidebar */}
        <aside className="fixed left-0 top-0 h-screen bg-white border-r shadow-sm flex flex-col transition-all duration-300 ease-in-out
                          w-64 xl:w-64 lg:w-64 md:w-16 sm:w-16">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-3 sm:p-3">
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-8 md:justify-center sm:justify-center md:space-x-0 sm:space-x-0 lg:justify-start lg:space-x-3 xl:justify-start xl:space-x-3">
                <div className="h-10 w-10 rounded-full bg-[hsl(258_46%_25%)] flex items-center justify-center">
                  <Image 
                    src="/logo-white-outline.png" 
                    alt="Dentabase Logo" 
                    width={24} 
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="md:hidden sm:hidden lg:block xl:block">
                  <h1 className="text-lg font-bold text-[hsl(258_46%_25%)]">Dentabase</h1>
                  <p className="text-xs text-[hsl(258_22%_50%)]">Dental Management</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isAppointmentsTab = item.href === "/appointments";
                  const isSettingsTab = item.href === "/settings";
                  const isActive =
                    pathname === item.href ||
                    (isAppointmentsTab && pathname.startsWith("/appointments") && !pathname.startsWith("/appointments/admin")) ||
                    (isSettingsTab && pathname.startsWith("/settings"));

                  return (
                    <div key={item.href} className="mb-2">
                      <Link href={item.href} className="cursor-pointer group relative">
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full font-semibold cursor-pointer transition-all duration-200
                          md:justify-center sm:justify-center lg:justify-start xl:justify-start
                          md:px-3 sm:px-3 lg:px-4 xl:px-4
                          ${isActive 
                            ? "bg-[hsl(258_46%_25%)] text-white" 
                            : "text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.1)]"
                        }`}
                      >
                        <item.icon className="h-4 w-4 md:mr-0 sm:mr-0 lg:mr-3 xl:mr-3" />
                        <span className="md:hidden sm:hidden lg:inline xl:inline">{item.label}</span>
                      </Button>
                      
                      {/* Tooltip for collapsed mode */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap
                                     hidden md:block sm:block lg:hidden xl:hidden">
                        {item.label}
                      </div>
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Reusable Navbar Component */}
        <Navbar 
          showDateTime={true}
          // DateTime will update every minute without seconds (optimal for dental practice)
        >
          <NavbarRight>
            <UserProfile 
              userName="Dr. Sarah Wilson"
              userEmail="sarah.wilson@dentabase.com"
              userRole="Practice Manager"
              onSettingsClick={() => {
                console.log("Navigate to settings");
                window.location.href = "/settings";
              }}
              onSignOutClick={handleLogout}
            />
          </NavbarRight>
        </Navbar>

        {/* Main Content - Responsive margins to match sidebar */}
        <main className="flex-1 pt-16 transition-all duration-300 ease-in-out
                        ml-64 xl:ml-64 lg:ml-64 md:ml-16 sm:ml-16">
          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}