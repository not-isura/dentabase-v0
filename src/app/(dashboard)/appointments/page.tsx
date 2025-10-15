import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = profile?.role;

  if (role === "patient") {
    redirect("/appointments/patient");
  }

  if (role === "dentist" || role === "dental_staff") {
    redirect("/appointments/admin");
  }

  redirect("/404");
}
