"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar, NavbarRight, UserProfile } from "@/components/ui/navbar";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingSpinner } from "@/components/auth-loading-spinner";
import { ROUTE_DEFINITIONS, findRouteByPath } from "@/config/routes";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 🎯 Get real user data from Auth Context
  const { displayUser, isLoading: isLoadingUser, setIsLoggingOut: setAuthLoggingOut } = useAuth();

  const [isAuthorizing, setIsAuthorizing] = useState(true);

  const userRole = displayUser?.role ?? null;

  const sidebarItems = useMemo(() => {
    if (!userRole) return [];
    return ROUTE_DEFINITIONS.filter((route) => route.showInSidebar && route.allowedRoles.includes(userRole));
  }, [userRole]);

  const normalizePath = (path: string) => {
    if (!path) return "/";
    if (path === "/") return "/";
    return path.endsWith("/") ? path.slice(0, -1) : path;
  };

  const isRouteActive = useMemo(() => {
    const currentPath = normalizePath(pathname);
    return (routeHref: string, exact = true) => {
      const routePath = normalizePath(routeHref);
      if (exact === false) {
        return currentPath === routePath || currentPath.startsWith(`${routePath}/`);
      }
      return currentPath === routePath;
    };
  }, [pathname]);

  useEffect(() => {
    setIsAuthorizing(true);
  }, [pathname]);

  useEffect(() => {
    if (isLoadingUser) return;

    if (!displayUser) {
      setIsAuthorizing(false);
      return;
    }

    const routeDefinition = findRouteByPath(pathname);

    if (routeDefinition && !routeDefinition.allowedRoles.includes(displayUser.role)) {
      router.replace("/404");
      return;
    }

    setIsAuthorizing(false);
  }, [displayUser, isLoadingUser, pathname, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-click
    
    setIsLoggingOut(true);
    setAuthLoggingOut(true); // Prevent Auth Context from clearing user data
    
    try {
      const supabase = createClient();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Logout error:", error);
        throw error;
      }
      
      console.log("✅ Logged out successfully");
      
      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to logout:", error);
      setIsLoggingOut(false);
      // Still redirect even if error occurs
      router.push("/login");
    }
  };

  if (isLoadingUser || isAuthorizing || !displayUser) {
    return <AuthLoadingSpinner />;
  }

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
                {sidebarItems.map((item) => {
                  const active = isRouteActive(item.href, item.exact !== false);

                  return (
                    <div key={item.href} className="mb-2">
                      <Link href={item.href} className="cursor-pointer group relative">
                      <Button
                        variant={active ? "default" : "ghost"}
                        className={`w-full font-semibold cursor-pointer transition-all duration-200
                          md:justify-center sm:justify-center lg:justify-start xl:justify-start
                          md:px-3 sm:px-3 lg:px-4 xl:px-4
                          ${active 
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
              userName={
                isLoadingUser 
                  ? "Loading..." 
                  : displayUser
                    ? `${displayUser.role === 'dentist' ? 'Dr. ' : ''}${displayUser.first_name} ${displayUser.last_name}` 
                    : "Guest User"
              }
              userEmail={
                isLoadingUser 
                  ? "Loading..." 
                  : displayUser?.email || "Not logged in"
              }
              userRole={
                isLoadingUser 
                  ? "Loading..." 
                  : displayUser 
                    ? displayUser.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) 
                    : "Guest"
              }
              onSettingsClick={() => {
                console.log("Navigate to settings");
                router.push("/settings");
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