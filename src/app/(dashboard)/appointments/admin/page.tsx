"use client";



import { useState } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewAppointmentModal } from "@/components/NewAppointmentModal";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  service: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  duration: string;
  notes?: string;
}

const sampleAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    patientEmail: "sarah.j@email.com",
    patientPhone: "(555) 123-4567",
    date: "2024-01-15",
    time: "09:00",
    service: "Regular Cleaning",
    status: "confirmed",
    duration: "60 min",
    notes: "First time patient"
  },
  {
    id: "2",
    patientName: "Michael Chen",
    patientEmail: "m.chen@email.com",
    patientPhone: "(555) 234-5678",
    date: "2024-01-15",
    time: "10:30",
    service: "Root Canal",
    status: "confirmed",
    duration: "90 min"
  },
  {
    id: "3",
    patientName: "Emily Davis",
    patientEmail: "emily.davis@email.com",
    patientPhone: "(555) 345-6789",
    date: "2024-01-15",
    time: "14:00",
    service: "Dental Filling",
    status: "pending",
    duration: "45 min"
  },
  {
    id: "4",
    patientName: "Robert Wilson",
    patientEmail: "r.wilson@email.com",
    patientPhone: "(555) 456-7890",
    date: "2024-01-16",
    time: "09:30",
    service: "Consultation",
    status: "completed",
    duration: "30 min"
  }
];

function getStatusColor(status: Appointment["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const { toast } = useToast();

  const handleNewAppointment = (newAppointment: Appointment) => {
    setAppointments([...appointments, newAppointment]);
    toast({
      title: "Appointment Scheduled",
      description: `Appointment for ${newAppointment.patientName} has been scheduled successfully.`,
    });
  };

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayAppointments = filteredAppointments.filter(
    (apt) => apt.date === "2024-01-15"
  );

  const upcomingAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.date) > new Date("2024-01-15")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Appointments</h2>
          <p className="text-muted-foreground">Manage your dental appointments</p>
        </div>
        <Button 
          style={{ backgroundColor: 'hsl(258, 46%, 25%)', color: 'white' }}
          className="hover:opacity-90"
          onClick={() => setIsNewAppointmentOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {appointments.filter(apt => apt.status === "confirmed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {appointments.filter(apt => apt.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Today's Appointments
          </CardTitle>
          <CardDescription>January 15, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No appointments scheduled for today</p>
            ) : (
              todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar>
                    <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                      {getInitials(appointment.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{appointment.patientName}</h4>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {appointment.time} ({appointment.duration})
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        {appointment.service}
                      </span>
                      <span className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {appointment.patientPhone}
                      </span>
                    </div>
                    
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Contact
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
          <CardDescription>Complete list of appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar>
                  <AvatarFallback style={{ backgroundColor: 'hsl(258, 22%, 65%)', color: 'hsl(258, 46%, 25%)' }}>
                    {getInitials(appointment.patientName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{appointment.patientName}</h4>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {new Date(appointment.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {appointment.time} ({appointment.duration})
                    </span>
                    <span className="flex items-center">
                      <User className="mr-1 h-3 w-3" />
                      {appointment.service}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Mail className="mr-1 h-3 w-3" />
                      {appointment.patientEmail}
                    </span>
                    <span className="flex items-center">
                      <Phone className="mr-1 h-3 w-3" />
                      {appointment.patientPhone}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSave={handleNewAppointment}
      />
    </div>
  );
}
