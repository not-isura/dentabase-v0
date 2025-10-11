"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Book, MessageCircle, Phone, Mail, ExternalLink, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "To book an appointment, navigate to the 'Appointments' section in your dashboard. Click 'New Appointment' and fill in the patient details, preferred date and time, and appointment type. You can also add notes about the visit if needed."
    },
    {
      question: "Can I reschedule or cancel my appointment?",
      answer: "Yes, you can reschedule or cancel appointments from the 'Appointments' page. Find the appointment you want to modify, click on it, and select either 'Reschedule' or 'Cancel'. For rescheduling, choose a new date and time that works for both you and your patient."
    },
    {
      question: "What happens if I forget my password?",
      answer: "If you forget your password, go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a password reset link. You can also change your password anytime from the Privacy & Security settings in your dashboard."
    },
    {
      question: "Is my dental history private?",
      answer: "Absolutely. All patient data and dental records are stored securely using industry-standard encryption. Your information is protected in compliance with healthcare privacy regulations. We never share your data with third parties without your explicit consent."
    },
    {
      question: "Do I need to pay online? (if applicable)",
      answer: "Payment requirements depend on your practice's billing setup. Some practices may require online payment for certain services, while others handle billing separately. Check with your dental practice for their specific payment policies and available payment methods."
    },
    {
      question: "Which devices/browsers are supported?",
      answer: "Dentabase works on all modern devices including desktops, tablets, and smartphones. We support the latest versions of Chrome, Firefox, Safari, and Edge browsers. For the best experience, ensure your browser is up to date and JavaScript is enabled."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
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
        <span className="text-[hsl(258_46%_25%)] font-semibold">Help & Support</span>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Help & Support</h2>
        <p className="text-[hsl(258_22%_50%)]">Get help and support for using Dentabase</p>
      </div>

      {/* Help Resources Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <HelpCircle className="h-5 w-5 mr-2" />
            Help Resources
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Find answers and get assistance with Dentabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Documentation Section */}
            <div>
              <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] mb-4 flex items-center">
                <Book className="h-5 w-5 mr-2" />
                Documentation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                  <h4 className="font-medium text-[hsl(258_46%_25%)] mb-2">Overview of the System</h4>
                  <p className="text-sm text-[hsl(258_22%_50%)] mb-3">
                    Dentabase is a comprehensive dental practice management platform designed to streamline your workflow. 
                    Book, reschedule, and cancel appointments with ease. Manage patient records, treatment notes, and dental history. 
                    Track notifications, view your dashboard analytics, and maintain complete control over your practice operations. 
                    Our secure platform ensures HIPAA compliance while providing an intuitive interface for dental professionals.
                  </p>
                  <Button variant="outline" size="sm" className="text-xs">
                    Read More
                  </Button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                  <h4 className="font-medium text-[hsl(258_46%_25%)] mb-2">Appointment Guide</h4>
                  <p className="text-sm text-[hsl(258_22%_50%)] mb-3">
                    Navigate to the 'Appointments' section to manage your schedule. Click 'New Appointment' to book - 
                    fill in patient details, select date/time, choose appointment type, and add notes. To modify existing appointments, 
                    find the appointment in your schedule and click to edit. You can reschedule by selecting a new time slot or 
                    cancel if needed. All changes are saved automatically and patients can be notified of updates.
                  </p>
                  <Button variant="outline" size="sm" className="text-xs">
                    Read More
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="cursor-pointer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
                <Button className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_25%/0.9)] text-white cursor-pointer">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Contact Information</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Get in touch with our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Phone className="h-8 w-8 mx-auto mb-2 text-[hsl(258_46%_25%)]" />
              <h4 className="font-medium text-[hsl(258_46%_25%)]">Phone Support</h4>
              <p className="text-sm text-[hsl(258_22%_50%)] mt-1">1-800-DENTABASE</p>
              <p className="text-xs text-[hsl(258_22%_50%)]">Mon-Fri 9AM-6PM EST</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Mail className="h-8 w-8 mx-auto mb-2 text-[hsl(258_46%_25%)]" />
              <h4 className="font-medium text-[hsl(258_46%_25%)]">Email Support</h4>
              <p className="text-sm text-[hsl(258_22%_50%)] mt-1">support@dentabase.com</p>
              <p className="text-xs text-[hsl(258_22%_50%)]">24-48 hour response</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <ExternalLink className="h-8 w-8 mx-auto mb-2 text-[hsl(258_46%_25%)]" />
              <h4 className="font-medium text-[hsl(258_46%_25%)]">Online Resources</h4>
              <p className="text-sm text-[hsl(258_22%_50%)] mt-1">Knowledge Base</p>
              <p className="text-xs text-[hsl(258_22%_50%)]">Available 24/7</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Frequently Asked Questions</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Common questions and answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="font-medium text-[hsl(258_46%_25%)]">{faq.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-[hsl(258_46%_25%)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[hsl(258_46%_25%)]" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-3">
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-[hsl(258_22%_50%)] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Guides Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-[hsl(258_46%_25%)]">Troubleshooting Guides</CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            Solutions to common issues and problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-[hsl(258_46%_25%)] mb-2">I can't log in</h4>
                  <p className="text-sm text-[hsl(258_22%_50%)] mb-3">
                    Reset your password using "Forgot Password" on the login page, or check if your account is active.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs cursor-pointer hover:bg-[hsl(258_46%_25%)] hover:text-white"
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-[hsl(258_46%_25%)] mb-2">I didn't receive a confirmation email</h4>
              <p className="text-sm text-[hsl(258_22%_50%)]">
                Check your spam folder or resend confirmation. Make sure the email address is correct and try again in a few minutes.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-[hsl(258_46%_25%)] mb-2">My appointment didn't save</h4>
              <p className="text-sm text-[hsl(258_22%_50%)]">
                Make sure all required fields are filled before submission. Check your internet connection and try saving again.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-[hsl(258_46%_25%)] mb-2">The page looks broken</h4>
              <p className="text-sm text-[hsl(258_22%_50%)]">
                Try clearing your browser cache or using another browser. Make sure JavaScript is enabled and your browser is up to date.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
