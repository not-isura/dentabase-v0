"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, User, Shield, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AuthTestComponent - Visual verification for Auth Context
 * 
 * This component displays:
 * - Loading state
 * - User data from Auth Context
 * - Patient profile (if user is a patient)
 * - Console logs for debugging
 * 
 * Usage:
 * Add this to any page to test Auth Context:
 * ```tsx
 * import { AuthTestComponent } from "@/components/auth-test-component";
 * <AuthTestComponent />
 * ```
 * 
 * TO REMOVE:
 * Delete this component and its import once testing is complete
 */
export function AuthTestComponent() {
  const { user, patientProfile, isLoading, isAuthenticated, refreshUser } = useAuth();

  return (
    <Card className="border-4 border-purple-500 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-900">
          <Shield className="h-5 w-5 mr-2" />
          🧪 Auth Context Test Component
        </CardTitle>
        <CardDescription className="text-purple-700">
          This component verifies that Auth Context is working correctly.
          <br />
          <strong>Check your browser console (F12)</strong> for detailed logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Loading State:</span>
          {isLoading ? (
            <div className="flex items-center text-blue-600">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Loaded
            </div>
          )}
        </div>

        {/* Authentication State */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Authenticated:</span>
          {isAuthenticated ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              No
            </div>
          )}
        </div>

        {/* User Data */}
        {!isLoading && (
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-bold text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              User Profile Data
            </h3>
            
            {user ? (
              <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">Email:</span>
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">Name:</span>
                  <span>{user.first_name} {user.middle_name || ''} {user.last_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">Role:</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">{user.role}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">Phone:</span>
                  <span>{user.phone_number || 'Not set'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Gender:</span>
                  <span>{user.gender}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Status:</span>
                  <span className={`px-2 py-1 rounded ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800">
                ⚠️ No user data found. User might not be logged in.
              </div>
            )}
          </div>
        )}

        {/* Patient Profile */}
        {!isLoading && user?.role === 'patient' && (
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-bold text-lg">👤 Patient Profile Data</h3>
            
            {patientProfile ? (
              <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Address:</span>
                  <p className="text-gray-700">{patientProfile.address || 'Not set'}</p>
                </div>
                
                <div>
                  <span className="font-semibold">Emergency Contact:</span>
                  <p className="text-gray-700">
                    {patientProfile.emergency_contact_name || 'Not set'}
                    {patientProfile.emergency_contact_no && ` - ${patientProfile.emergency_contact_no}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800">
                ⚠️ No patient profile found for this user.
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="border-t pt-4">
          <Button 
            onClick={refreshUser}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh User Data'
            )}
          </Button>
          <p className="text-xs text-gray-600 mt-2">
            Click to manually refresh user data from database
          </p>
        </div>

        {/* Instructions */}
        <div className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">✅ How to Verify:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Open browser console (Press F12)</li>
            <li>Look for logs starting with <code className="bg-blue-100 px-1">[AuthContext]</code></li>
            <li>Verify "User profile loaded" message appears</li>
            <li>Check that the data above matches your logged-in account</li>
            <li>Click "Refresh User Data" and verify console logs appear</li>
          </ol>
          
          <div className="mt-3 p-2 bg-white rounded border border-blue-200">
            <p className="text-xs font-mono text-blue-900">
              Expected console output:<br />
              ✅ [AuthContext] User profile loaded<br />
              ✅ [AuthContext] Patient profile loaded (if patient)
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="border-t pt-4 bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-800 font-semibold">
            🗑️ REMEMBER: Remove this test component after verification!
          </p>
          <p className="text-xs text-red-700 mt-1">
            This component is for testing only. Delete it and its import once Auth Context is working.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
