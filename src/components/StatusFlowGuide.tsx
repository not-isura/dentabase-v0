"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Check, X, Clock, User, Flag, CheckCircle2, AlertTriangle, XCircle, Calendar, Stethoscope, RotateCcw, Phone, FileText } from 'lucide-react';

interface StatusFlowGuideProps {
  variant: 'admin' | 'patient';
}

export function StatusFlowGuide({ variant }: StatusFlowGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 text-[hsl(258_46%_35%)] border-[hsl(258_46%_35%)] hover:bg-[hsl(258_46%_95%)] hover:text-[hsl(258_46%_25%)] transition-colors"
      >
        <Info className="h-4 w-4" />
        Status Flow Guide
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[hsl(258_46%_25%)] flex items-center gap-2">
              <Info className="h-6 w-6" />
              {variant === 'admin' ? 'Appointment Status Flow - Dentist/Staff' : 'Appointment Status Flow - Patient View'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {variant === 'admin' ? <AdminFlowContent /> : <PatientFlowContent />}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)} className="bg-[hsl(258_46%_35%)] hover:bg-[hsl(258_46%_25%)] text-white">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminFlowContent() {
  return (
    <>
      {/* Normal Flow */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Normal Appointment Flow
        </h3>
        
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                1
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Incoming</div>
                <p className="text-sm text-gray-600">Patient submits appointment request</p>
              </div>
            </div>

            <div className="ml-4 border-l-2 border-purple-300 h-4"></div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                2
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Awaiting</div>
                <p className="text-sm text-gray-600 mb-2">Admin proposes appointment time</p>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-xs font-medium text-purple-700 mb-1">Actions:</div>
                  <div className="text-xs text-gray-600">• Click "Reschedule" to propose time</div>
                  <div className="text-xs text-red-600">• Click "Reject" to decline request</div>
                  <div className="text-xs text-yellow-600">• Click "Cancel" to cancel appointment</div>
                </div>
              </div>
            </div>

            <div className="ml-4 border-l-2 border-purple-300 h-4"></div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                3
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Confirmed</div>
                <p className="text-sm text-gray-600 mb-2">Patient accepts proposed time</p>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="text-xs font-medium text-green-700 mb-1">Actions:</div>
                  <div className="text-xs text-gray-600">• Click "Mark as Arrived" when patient arrives</div>
                  <div className="text-xs text-yellow-600">• Click "Cancel" if needed</div>
                </div>
              </div>
            </div>

            <div className="ml-4 border-l-2 border-purple-300 h-4"></div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                4
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Arrived</div>
                <p className="text-sm text-gray-600 mb-2">Patient is at clinic</p>
                <div className="bg-white rounded-lg p-3 border border-teal-200">
                  <div className="text-xs font-medium text-teal-700 mb-1">Actions:</div>
                  <div className="text-xs text-gray-600">• Click "Mark as Ongoing" when treatment starts</div>
                  <div className="text-xs text-yellow-600">• Click "Cancel" if patient leaves</div>
                </div>
              </div>
            </div>

            <div className="ml-4 border-l-2 border-purple-300 h-4"></div>

            {/* Step 5 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                5
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Ongoing</div>
                <p className="text-sm text-gray-600 mb-2">Treatment in progress</p>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-xs font-medium text-orange-700 mb-1">Actions:</div>
                  <div className="text-xs text-gray-600">• Click "Mark as Complete" when done</div>
                  <div className="text-xs text-yellow-600">• Click "Cancel" if treatment incomplete</div>
                </div>
              </div>
            </div>

            <div className="ml-4 border-l-2 border-purple-300 h-4"></div>

            {/* Step 6 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Completed</div>
                <p className="text-sm text-gray-600">Appointment successfully finished</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection & Cancellation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Rejection & Cancellation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reject */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-red-900">REJECT</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="font-medium text-red-800 min-w-fit">When:</div>
                <div className="text-red-700">At "Requested" status only</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-red-800 min-w-fit">Who:</div>
                <div className="text-red-700">Admin only</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-red-800 min-w-fit">Note:</div>
                <div className="text-red-700">Required - explain reason to patient</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-red-800 min-w-fit">Result:</div>
                <div className="text-red-700">X appears on "To Confirm" step</div>
              </div>
            </div>
          </div>

          {/* Cancel */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <X className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">CANCEL</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="font-medium text-yellow-800 min-w-fit">When:</div>
                <div className="text-yellow-700">At ANY status</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-yellow-800 min-w-fit">Who:</div>
                <div className="text-yellow-700">Admin, Dentist, Staff</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-yellow-800 min-w-fit">Note:</div>
                <div className="text-yellow-700">Required - explain reason to patient</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-yellow-800 min-w-fit">Result:</div>
                <div className="text-yellow-700">X appears on next step after last completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Quick Tips
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Arrive, Ongoing, Complete:</strong> Simple confirmation (no note required)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Reject, Cancel:</strong> Note required (visible to patient)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Status History:</strong> Shows all changes with timestamps and notes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span><strong>Dr. Prefix:</strong> Automatically added for dentists in history</span>
          </li>
        </ul>
      </div>
    </>
  );
}

function PatientFlowContent() {
  return (
    <>
      {/* Normal Flow */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Your Appointment Journey
        </h3>
        
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                1
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Requested</div>
                <p className="text-sm text-gray-600 mb-2">You submitted an appointment request</p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Waiting for clinic to review your appointment</span>
                  </div>
                  <div className="text-xs text-gray-600 pl-6">
                    Clinic may <span className="font-semibold text-green-700">accept</span>, <span className="font-semibold text-red-700">reject</span>, or <span className="font-semibold text-blue-700">reschedule</span> your appointment
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                2
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">To Confirm</div>
                <p className="text-sm text-gray-600 mb-2">Clinic reviewed your appointment</p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-purple-200 space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 mt-0.5" />
                    <div>
                      <span className="font-medium text-green-700">No schedule changes:</span>
                      <div className="text-gray-600 mt-1">Accept to book your appointment at your requested time</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs pt-2 border-t border-gray-200">
                    <RotateCcw className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <span className="font-medium text-blue-700">Rescheduled:</span>
                      <div className="text-gray-600 mt-1">Clinic proposed a different time - accept or reject the new schedule</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                3
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Booked</div>
                <p className="text-sm text-gray-600 mb-2">Your appointment is confirmed</p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Remember to arrive on time at the clinic</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                4
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Arrived</div>
                <p className="text-sm text-gray-600 mb-2">You are at the clinic</p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-teal-200">
                  <div className="flex items-center gap-2 text-xs text-teal-700">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Staff will mark you as arrived</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                5
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Ongoing</div>
                <p className="text-sm text-gray-600 mb-2">Treatment is in progress</p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 text-xs text-orange-700">
                    <Stethoscope className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Dentist is working on your treatment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Completed</div>
                <p className="text-sm text-gray-600 mb-2">Your treatment is finished</p>
                <div className="mt-2 bg-white rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Thank you for visiting our clinic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tracker Legend */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
          <Info className="h-5 w-5 text-purple-600" />
          Status Tracker Symbols
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white shadow-md">
                <Check className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-900">Checkmark</div>
              <div className="text-xs text-purple-700 mt-1">Step completed</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md">
                <X className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-900">Cross Symbol</div>
              <div className="text-xs text-red-700 mt-1">Rejected/Cancelled</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-400 font-bold shadow-sm">
                1
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Number</div>
              <div className="text-xs text-gray-700 mt-1">Not yet reached</div>
            </div>
          </div>
        </div>
      </div>

      {/* What If Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[hsl(258_46%_25%)] flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          What If My Appointment Is...
        </h3>

        <div className="space-y-3">
          {/* Rejected */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white mt-0.5">
                <X className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-red-900 mb-1">Rejected</div>
                <p className="text-sm text-red-700 mb-2">Your appointment request was declined by the clinic</p>
                <div className="bg-white rounded-lg p-3 text-xs text-red-800 space-y-1.5">
                  <div className="font-medium flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    What to do:
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Check the note from clinic for the reason</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Click "Dismiss to Create New" to book again</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Try a different date or time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 mb-1">Cancelled</div>
                <p className="text-sm text-yellow-700 mb-2">Your appointment was cancelled</p>
                <div className="bg-white rounded-lg p-3 text-xs text-yellow-800 space-y-1.5">
                  <div className="font-medium flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    What to do:
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Check the note from clinic for the reason</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Click "Dismiss to Create New" to reschedule</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Contact clinic if you have questions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          What You Can Do
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <span><strong>Book Appointment:</strong> Request a new appointment with your preferred date and time</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <span><strong>Confirm Time:</strong> Accept or reject the time proposed by clinic</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <span><strong>Cancel:</strong> Cancel your appointment if you cannot make it</span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <span><strong>View History:</strong> See all status changes and notes from clinic</span>
          </li>
        </ul>
      </div>
    </>
  );
}
