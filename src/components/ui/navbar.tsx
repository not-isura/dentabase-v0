"use client";

import React, { useState, useEffect } from "react";
import { Clock, User, Settings, LogOut, Bell, HelpCircle, Shield, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  children?: React.ReactNode;
  showDateTime?: boolean;
  className?: string;
  leftOffset?: string; // For when sidebar width changes - supports responsive classes
}

interface NavbarLeftProps {
  children: React.ReactNode;
  className?: string;
}

interface NavbarRightProps {
  children: React.ReactNode;
  className?: string;
}

interface DateTimeProps {
  className?: string;
  showIcon?: boolean;
  updateInterval?: number; // milliseconds - default 60000 (1 minute)
  showSeconds?: boolean;   // whether to show seconds
}

interface UserProfileProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onSettingsClick?: () => void;
  onSignOutClick?: () => void;
  className?: string;
}

// Main Navbar Component
export function Navbar({ 
  children, 
  showDateTime = true, 
  className,
  leftOffset = "left-64 xl:left-64 lg:left-64 md:left-16 sm:left-16" // Responsive sidebar width offset
}: NavbarProps) {
  return (
    <nav className={cn(
      "fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b shadow-sm z-10 transition-all duration-300 ease-in-out",
      leftOffset,
      className
    )}>
      <div className="flex items-center justify-between h-full px-6">
        {showDateTime && (
          <NavbarLeft>
            <DateTime />
          </NavbarLeft>
        )}
        {children}
      </div>
    </nav>
  );
}

// Left section of navbar
export function NavbarLeft({ children, className }: NavbarLeftProps) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {children}
    </div>
  );
}

// Right section of navbar
export function NavbarRight({ children, className }: NavbarRightProps) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      {children}
    </div>
  );
}

// DateTime component
export function DateTime({ 
  className, 
  showIcon = true, 
  updateInterval = 60000, // Default: update every minute
  showSeconds = false     // Default: don't show seconds
}: DateTimeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time based on specified interval
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, [updateInterval]);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(showSeconds && { second: '2-digit' })
  };

  return (
    <div className={cn("flex items-center space-x-2 text-sm text-[hsl(258_22%_50%)]", className)}>
      {showIcon && <Clock className="h-4 w-4" />}
      <span>{currentTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      })}</span>
      <span className="text-[hsl(258_22%_50%)]">•</span>
      <span>{currentTime.toLocaleTimeString('en-US', timeOptions)}</span>
    </div>
  );
}

// User Profile Dropdown Component
export function UserProfile({ 
  userName = "Dr. Smith", 
  userEmail = "doctor@dentabase.com",
  userRole = "Administrator",
  onSettingsClick,
  onSignOutClick,
  className 
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsOpen(false);
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Default behavior - navigate to settings
      window.location.href = "/settings";
    }
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    if (onSignOutClick) {
      onSignOutClick();
    } else {
      // Default behavior - redirect to login
      console.log("Signing out...");
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { 
      icon: User, 
      label: "My Profile", 
      onClick: () => {
        setIsOpen(false);
        // Navigate to profile page (not in sidebar)
        window.location.href = "/profile";
      }
    },
    { 
      icon: Bell, 
      label: "Notifications", 
      onClick: () => {
        setIsOpen(false);
        // Navigate to notifications page (not in sidebar)
        window.location.href = "/notifications";
      }
    },
    { 
      icon: Shield, 
      label: "Privacy & Security", 
      onClick: () => {
        setIsOpen(false);
        // Navigate to privacy page (not in sidebar)
        window.location.href = "/privacy";
      }
    },
    { 
      icon: HelpCircle, 
      label: "Help & Support", 
      onClick: () => {
        setIsOpen(false);
        // Navigate to help page (not in sidebar)
        window.location.href = "/help";
      }
    },
    { icon: Settings, label: "Settings", onClick: handleSettingsClick },
    { icon: LogOut, label: "Sign Out", onClick: handleSignOutClick, danger: true }
  ];

  return (
    <div className={cn("relative", className)}>
      {/* Profile Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[hsl(258_46%_25%/0.1)] transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-[hsl(258_46%_25%)] flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-[hsl(258_46%_25%)]">{userName}</p>
          <p className="text-xs text-[hsl(258_22%_50%)]">{userRole}</p>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-[hsl(258_22%_50%)] transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[hsl(258_22%_90%)] rounded-lg shadow-lg z-20">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-[hsl(258_22%_90%)]">
              <p className="font-medium text-[hsl(258_46%_25%)]">{userName}</p>
              <p className="text-sm text-[hsl(258_22%_50%)]">{userEmail}</p>
              <p className="text-xs text-[hsl(258_22%_50%)] mt-1">{userRole}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-[hsl(258_46%_25%/0.05)] transition-colors",
                    item.danger ? "text-red-600 hover:bg-red-50" : "text-[hsl(258_46%_25%)]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
