import { redirect } from "next/navigation";

export default function Home() {
  // Immediate server-side redirect to login page
  redirect("/login");
}
