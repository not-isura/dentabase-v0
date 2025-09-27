import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, User, Phone, Mail, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Hide Radix Select scroll arrows
const hideScrollArrowsStyle = `
  [data-radix-select-scroll-up-button],
  [data-radix-select-scroll-down-button] {
    display: none !important;
  }
`;

// Custom Dropdown Component
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}

function CustomSelect({ value, onChange, options, placeholder, required }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-left flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>{displayValue}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-[140px] overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-md last:rounded-b-md"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NewAppointmentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (appointment: any) => void;
  trigger?: React.ReactNode;
}

export function NewAppointmentModal({ isOpen, onClose, onSave, trigger }: NewAppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    date: "",
    time: "",
    service: "",
    duration: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppointment = {
      id: Date.now().toString(),
      ...formData,
      status: "pending" as const
    };
    onSave?.(newAppointment);
    onClose?.();
    setFormData({
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      date: "",
      time: "",
      service: "",
      duration: "",
      notes: ""
    });
  };

  const services = [
    "Regular Cleaning",
    "Deep Cleaning",
    "Dental Filling",
    "Root Canal",
    "Crown Placement",
    "Tooth Extraction",
    "Consultation",
    "Orthodontic Consultation",
    "Teeth Whitening",
    "Dental Implant"
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  const durations = [
    "30 min", "45 min", "60 min", "90 min", "120 min"
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideScrollArrowsStyle }} />
      <Dialog open={isOpen} onOpenChange={onClose}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-gray-800">
            <Calendar className="mr-2 h-5 w-5" />
            Schedule New Appointment
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Fill in the patient details and appointment information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-4 w-4" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Full Name *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Phone Number *</Label>
                  <Input
                    id="patientPhone"
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Email Address</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <CustomSelect
                    value={formData.time}
                    onChange={(value) => setFormData({ ...formData, time: value })}
                    options={timeSlots}
                    placeholder="Select time"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <CustomSelect
                    value={formData.service}
                    onChange={(value) => setFormData({ ...formData, service: value })}
                    options={services}
                    placeholder="Select service"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <CustomSelect
                    value={formData.duration}
                    onChange={(value) => setFormData({ ...formData, duration: value })}
                    options={durations}
                    placeholder="Select duration"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
            >
              Schedule Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}