"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-200 rounded-full blur-2xl opacity-50"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <AlertTriangle className="h-20 w-20 text-red-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Something went wrong!
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            We're sorry, but an unexpected error occurred.
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full"
            variant="outline"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          
          <a href="/dashboard" className="block">
            <Button
              className="w-full"
              style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </a>
        </div>

        {/* Support Note */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            If this problem persists, please{" "}
            <a
              href="mailto:support@dentabase.com"
              className="text-[hsl(258_46%_25%)] hover:underline font-medium"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
