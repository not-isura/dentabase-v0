"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Eye, EyeOff, FileText, UserCheck, Trash2, X, Check, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password validation functions
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isDifferentFromCurrent = newPassword !== currentPassword || newPassword === "";
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";
  const currentPasswordValid = currentPassword.length > 0;
  const newPasswordValid = hasMinLength && hasNumber && hasSymbol && isDifferentFromCurrent && newPassword !== "";

  const getPasswordErrors = () => {
    const errors = [];
    if (!hasMinLength) errors.push("must contain at least 8 characters");
    if (!hasNumber) errors.push("must contain at least 1 number");
    if (!hasSymbol) errors.push("must contain at least 1 symbol");
    return errors;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/settings')}
          className="text-[hsl(258_22%_50%)] hover:text-[hsl(258_46%_25%)] transition-colors cursor-pointer font-medium"
        >
          Settings
        </button>
        <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
        <span className="text-[hsl(258_46%_25%)] font-semibold">Privacy & Security</span>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Privacy & Security</h2>
        <p className="text-[hsl(258_22%_50%)]">Manage your privacy settings and security preferences</p>
      </div>

      {/* Security Settings Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Configure your account security and authentication options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Change Password Section */}
            <div>
              <h3 className="text-lg font-medium text-[hsl(258_46%_25%)] mb-2">Change Password</h3>
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Password Requirements
                </h4>
                <ul className="space-y-2">
                  <li className={`flex items-center text-sm transition-all duration-300 ${
                    hasMinLength 
                      ? "text-green-600 line-through" 
                      : "text-gray-600"
                  }`}>
                    {hasMinLength ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                    )}
                    Minimum 8 characters
                  </li>
                  <li className={`flex items-center text-sm transition-all duration-300 ${
                    hasNumber 
                      ? "text-green-600 line-through" 
                      : "text-gray-600"
                  }`}>
                    {hasNumber ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                    )}
                    At least 1 number
                  </li>
                  <li className={`flex items-center text-sm transition-all duration-300 ${
                    hasSymbol 
                      ? "text-green-600 line-through" 
                      : "text-gray-600"
                  }`}>
                    {hasSymbol ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                    )}
                    At least 1 symbol (!@#$%^&*)
                  </li>
                  <li className={`flex items-center text-sm transition-all duration-300 ${
                    isDifferentFromCurrent && newPassword !== "" 
                      ? "text-green-600 line-through" 
                      : "text-gray-600"
                  }`}>
                    {isDifferentFromCurrent && newPassword !== "" ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 mr-2 border-2 border-gray-300 rounded-full"></div>
                    )}
                    New password must be different from current password
                  </li>
                </ul>
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:border-transparent ${
                        currentPassword && currentPasswordValid 
                          ? "border-green-500 bg-green-50" 
                          : currentPassword && !currentPasswordValid 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300"
                      }`}
                    />
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      {currentPassword && currentPasswordValid && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[hsl(258_46%_25%)]"
                    >
                      {showCurrentPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:border-transparent ${
                        newPassword && newPasswordValid 
                          ? "border-green-500 bg-green-50" 
                          : newPassword && !newPasswordValid 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300"
                      }`}
                    />
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      {newPassword && newPasswordValid && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[hsl(258_46%_25%)]"
                    >
                      {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-[hsl(258_46%_25%)] mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(258_46%_25%)] focus:border-transparent ${
                        confirmPassword && passwordsMatch 
                          ? "border-green-500 bg-green-50" 
                          : confirmPassword && !passwordsMatch 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-300"
                      }`}
                    />
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      {confirmPassword && passwordsMatch && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[hsl(258_46%_25%)]"
                    >
                      {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && passwordsMatch && (
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Passwords match!
                    </p>
                  )}
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-600 mt-2">
                      Passwords do not match
                    </p>
                  )}
                </div>
                <Button className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_20%)] text-white">
                  <Key className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <UserCheck className="h-5 w-5 mr-2" />
            Account Management
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Manage your account settings and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Delete Account Section */}
            <div>
              <h3 className="text-lg font-medium text-red-600 mb-2">Delete Account</h3>
              <div className="max-w-md">
                <p className="text-sm text-[hsl(258_22%_50%)] mb-4">
                  If you're sure you want to proceed with account deletion, click the button below. 
                  You'll be asked to confirm your identity before the deletion process begins.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmName("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• All your patient records will be permanently deleted</li>
                  <li>• Your appointment history will be lost</li>
                  <li>• Practice settings and data will be removed</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                To confirm account deletion, please type your full name "FIRST_NAME LAST_NAME"
              </p>
              
              <div>
                
                <input
                  id="delete-confirm-name"
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmName("");
                }}
                className="flex-1 cursor-pointer hover:bg-gray-500 hover:text-white transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmName.trim() === ""}
                className={`flex-1 text-white font-medium transition-all duration-200 ${
                  deleteConfirmName.trim() === "" 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300" 
                    : "bg-red-600 hover:bg-red-700 hover:shadow-lg active:bg-red-800 cursor-pointer"
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Controls Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <FileText className="h-5 w-5 mr-2" />
            Privacy Policy
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Learn how we handle your information and protect your privacy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-[hsl(258_46%_25%)]">
            <div className="mb-6">
              <p className="text-sm text-[hsl(258_22%_50%)] mb-4">
                <strong>Effective Date:</strong> September 26, 2025
              </p>
              <p className="text-sm mb-4">
                Dentabase ("we," "our," or "us") values your privacy. This Privacy Policy explains how we handle your information when you use our dental practice management application.
              </p>
            </div>

            <div className="space-y-6 text-sm">
              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">1. Information We Collect</h4>
                <ul className="list-disc list-inside space-y-1 text-[hsl(258_22%_50%)] ml-4">
                  <li><strong>Account Information:</strong> When you create an account, we collect a username and password.</li>
                  <li><strong>Patient Data:</strong> Any patient records, appointments, treatment notes, and dental information you add is stored securely.</li>
                  <li><strong>Practice Information:</strong> Your dental practice details and settings are stored to personalize your experience.</li>
                  <li>We do not collect personal information such as email, phone number, or location unless explicitly provided by you in the app.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">2. How We Use Your Information</h4>
                <p className="text-[hsl(258_22%_50%)] mb-2">We use the information you provide only to:</p>
                <ul className="list-disc list-inside space-y-1 text-[hsl(258_22%_50%)] ml-4">
                  <li>Create and manage your account</li>
                  <li>Allow you to log in and use app features</li>
                  <li>Store your dental practice data securely</li>
                  <li>Provide appointment scheduling and patient management functionality</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">3. Data Storage & Security</h4>
                <ul className="list-disc list-inside space-y-1 text-[hsl(258_22%_50%)] ml-4">
                  <li>All data is stored securely using Supabase, a trusted cloud database platform</li>
                  <li>Your information is encrypted both in transit and at rest</li>
                  <li>We implement industry-standard security measures to protect your data</li>
                  <li>You are responsible for keeping your login credentials safe</li>
                  <li>All patient data is handled in compliance with healthcare privacy standards</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">4. Sharing of Information</h4>
                <ul className="list-disc list-inside space-y-1 text-[hsl(258_22%_50%)] ml-4">
                  <li>We do not share, sell, or rent your information to any third parties</li>
                  <li>Your patient data remains confidential and is only accessible by authorized users in your practice</li>
                  <li>Data may only be shared when legally required or with your explicit consent</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">5. Your Rights</h4>
                <ul className="list-disc list-inside space-y-1 text-[hsl(258_22%_50%)] ml-4">
                  <li>You can update or delete your account information at any time within the app</li>
                  <li>You may request data export or account deletion by contacting us</li>
                  <li>You have the right to access and review all data associated with your account</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">6. Healthcare Privacy Compliance</h4>
                <p className="text-[hsl(258_22%_50%)]">
                  We are committed to protecting patient health information and maintaining compliance with applicable healthcare privacy regulations. All patient data is treated with the highest level of confidentiality.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">7. Children's Privacy</h4>
                <p className="text-[hsl(258_22%_50%)]">
                  Our app is intended for healthcare professionals and is not designed for children under 13. We do not knowingly collect information from children.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">8. Changes to This Policy</h4>
                <p className="text-[hsl(258_22%_50%)]">
                  We may update this Privacy Policy from time to time. Any changes will be reflected within the app, with a revised effective date.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-[hsl(258_46%_25%)] mb-2">9. Contact Us</h4>
                <p className="text-[hsl(258_22%_50%)]">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-[hsl(258_22%_50%)] mt-2">
                  📧 <span className="text-[hsl(258_46%_25%)]">privacy@dentabase.com</span>
                </p>
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
