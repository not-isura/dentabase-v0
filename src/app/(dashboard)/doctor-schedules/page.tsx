import DoctorSchedulesClient, { DoctorScheduleCardData } from "./DoctorSchedulesClient";
import { createClient as createServerClient } from "@/lib/supabase/server";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const formatMiddleInitials = (middleName: string | null) => {
  if (!middleName) {
    return null;
  }

  const initials = middleName
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}.`)
    .join("");

  return initials.length > 0 ? initials : null;
};

const formatName = (
  firstName: string | null,
  middleName: string | null,
  lastName: string | null
) => {
  const formattedFirst = firstName?.trim();
  const middleInitials = formatMiddleInitials(middleName);
  const formattedLast = lastName?.trim();

  const nameParts = [formattedFirst, middleInitials, formattedLast].filter(Boolean);

  if (nameParts.length === 0) {
    return "Doctor";
  }

  return `Dr. ${nameParts.join(" ")}`.trim();
};

type RawAvailability = {
  availability_id: string;
  doctor_id: string;
  day: string;
  start_time: string | null;
  end_time: string | null;
  is_enabled: boolean | null;
};

const formatSchedules = (
  availability: RawAvailability[]
): DoctorScheduleCardData["schedules"] => {
  return availability
    .filter((item) => item.is_enabled)
    .map((item) => ({
      availabilityId: item.availability_id,
      day: item.day,
      dayLabel: DAY_LABELS[item.day.toLowerCase()] ?? item.day,
      startTime: item.start_time ?? "",
      endTime: item.end_time ?? "",
    }))
    .sort((a, b) => {
      const aIndex = DAY_ORDER.indexOf(a.day.toLowerCase());
      const bIndex = DAY_ORDER.indexOf(b.day.toLowerCase());
      const dayCompare = (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);

      if (dayCompare !== 0) {
        return dayCompare;
      }

      return a.startTime.localeCompare(b.startTime);
    });
};

export default async function DoctorSchedulesPage() {
  const supabase = await createServerClient();

  const { data: doctorsData, error: doctorsError } = await supabase
    .from("doctors")
    .select(
      `doctor_id, user_id, specialization, room_number, users ( first_name, middle_name, last_name )`
    )
    .order("user_id");

  if (doctorsError) {
    console.error("Error fetching doctors:", doctorsError);
  }

  const { data: availabilityData, error: availabilityError } = await supabase
    .from("doc_availability")
    .select("availability_id, doctor_id, day, start_time, end_time, is_enabled");

  if (availabilityError) {
    console.error("Error fetching doctor availability:", availabilityError);
  }

  const availabilityByDoctor = new Map<string, RawAvailability[]>();

  (availabilityData ?? []).forEach((entry) => {
    const existing = availabilityByDoctor.get(entry.doctor_id) ?? [];
    availabilityByDoctor.set(entry.doctor_id, [...existing, entry]);
  });

  const scheduleCards: DoctorScheduleCardData[] = (doctorsData ?? []).map((doctor) => {
    const user = (doctor as any).users;
    const rawAvailability = availabilityByDoctor.get(doctor.doctor_id) ?? [];

    return {
      doctorId: doctor.doctor_id,
      name: formatName(user?.first_name ?? null, user?.middle_name ?? null, user?.last_name ?? null),
      specialization: doctor.specialization ?? "Not specified",
      clinicRoom: doctor.room_number ?? "Not assigned",
      schedules: formatSchedules(rawAvailability),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const activeDoctors = scheduleCards.filter((doctor) => doctor.schedules.length > 0);
  const disabledDoctors = scheduleCards.filter((doctor) => doctor.schedules.length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(258_46%_25%)]">Doctor Schedules</h1>
        <p className="text-[hsl(258_22%_50%)]">
          Review each doctor&apos;s availability and clinic assignments.
        </p>
      </div>
      <DoctorSchedulesClient
        initialDoctorSchedules={activeDoctors}
        disabledDoctorSchedules={disabledDoctors}
      />
    </div>
  );
}
