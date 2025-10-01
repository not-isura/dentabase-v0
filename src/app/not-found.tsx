"use client";

import Link from "next/link";
import { SearchX, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen max-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-100/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative max-w-2xl w-full text-center space-y-6">
        {/* Icon and 404 */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-purple-600/30 rounded-full blur-2xl scale-110"></div>
              
              {/* Icon container */}
              <div className="relative bg-white/80 backdrop-blur-sm rounded-full p-6 sm:p-7 shadow-xl border border-purple-100">
                <SearchX className="h-16 w-16 sm:h-20 sm:w-20 text-[hsl(258_46%_25%)]" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* 404 Text with gradient */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold bg-gradient-to-br from-[hsl(258_46%_25%)] via-[hsl(258_46%_35%)] to-[hsl(258_46%_45%)] bg-clip-text text-transparent leading-none tracking-tight whitespace-nowrap">
            404
          </h1>
        </div>

        {/* Messages */}
        <div className="space-y-3 px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">
            Oops! Page Not Found
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto whitespace-nowrap">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto whitespace-nowrap">
            Try returning to the homepage or check the URL for any typos.
          </p>
        </div>

        {/* Call to Action Button */}
        <div className="pt-3">
          <Link href="/dashboard" className="inline-block group">
            <Button
              size="default"
              className="text-sm sm:text-base px-6 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 whitespace-nowrap"
              style={{ 
                backgroundColor: 'hsl(258, 46%, 25%)', 
                color: 'white'
              }}
            >
              <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold">Back to Home</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Additional helpful text */}
        <div className="pt-6 space-y-2">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
            Need help? Contact our{" "}
            <a
              href="mailto:support@dentabase.com"
              className="text-[hsl(258_46%_25%)] hover:text-[hsl(258_46%_35%)] font-medium underline underline-offset-2 transition-colors"
            >
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
