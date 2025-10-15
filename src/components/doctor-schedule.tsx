"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, XCircle, Edit } from "lucide-react";

interface ScheduleDay {
  availability_id: string;
  doctor_id: string;
  day: string;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface DoctorScheduleProps {
  doctorId: string;
  title?: string;
  description?: string;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

export default function DoctorSchedule({ 
  doctorId, 
  title = "Weekly Availability Schedule",
  description = "View the doctor's availability schedule for the week",
  showEditButton = false,
  onEditClick
}: DoctorScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Day order for sorting
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Day display names
  const dayNames: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!doctorId) {
        setError("No doctor ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        const { data, error: fetchError } = await supabase
          .from('doc_availability')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('day', { ascending: true });

        if (fetchError) {
          console.error('Error fetching schedule:', fetchError);
          setError(fetchError.message);
        } else if (data) {
          // Sort by day order
          const sortedData = data.sort((a, b) => {
            return dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase());
          });
          setSchedule(sortedData);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(err.message || "Failed to load schedule");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [doctorId]);

  // Helper: Convert 24-hour time to 12-hour format
  const formatTime = (time24: string): string => {
    if (!time24) return '';
    
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return `${hours}:${minutes} ${period}`;
  };

  // Helper: Get day initials for mobile
  const getDayInitial = (day: string): string => {
    return dayNames[day.toLowerCase()]?.slice(0, 3) || day.slice(0, 3);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <Calendar className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-white border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            Error Loading Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (schedule.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
            <Calendar className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          <CardDescription className="text-[hsl(258_22%_50%)]">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-[hsl(258_22%_50%)] text-sm">
              No schedule has been set.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-[hsl(258_46%_25%)]">
          <Calendar className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription className="text-[hsl(258_22%_50%)]">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-[hsl(258_22%_90%)]">
          <table className="w-full">
            <thead className="bg-[hsl(258_46%_95%)]">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-[hsl(258_46%_25%)] border-b border-[hsl(258_22%_90%)]">
                  Day
                </th>
                <th className="text-left py-3 px-4 font-semibold text-[hsl(258_46%_25%)] border-b border-[hsl(258_22%_90%)]">
                  Availability
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((day, index) => (
                <tr 
                  key={day.availability_id}
                  className={`${index !== schedule.length - 1 ? 'border-b border-[hsl(258_22%_90%)]' : ''} hover:bg-[hsl(258_46%_98%)] transition-colors`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[hsl(258_46%_25%)]">
                        {dayNames[day.day.toLowerCase()] || day.day}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {day.is_enabled ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                        <span className="text-[hsl(258_46%_25%)] font-medium">
                          {formatTime(day.start_time)} – {formatTime(day.end_time)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-600 text-sm font-medium">Not available</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {schedule.map((day) => (
            <div
              key={day.availability_id}
              className={`p-4 rounded-lg border ${
                day.is_enabled
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[hsl(258_46%_25%)]">
                  {dayNames[day.day.toLowerCase()] || day.day}
                </h4>
                {!day.is_enabled && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              {day.is_enabled ? (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[hsl(258_22%_50%)]" />
                  <span className="text-[hsl(258_46%_25%)] font-medium">
                    {formatTime(day.start_time)} – {formatTime(day.end_time)}
                  </span>
                </div>
              ) : (
                <span className="text-red-600 text-sm font-medium">Not available</span>
              )}
            </div>
          ))}
        </div>

        {/* Edit Button */}
        {showEditButton && onEditClick && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onEditClick}
              className="bg-[hsl(258_46%_25%)] hover:bg-[hsl(258_46%_22%)] text-white cursor-pointer active:scale-95 transition-all"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Schedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
