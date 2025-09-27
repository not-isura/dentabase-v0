import { DashboardLayout } from "@/components/dashboard-layout";

export default function DashboardLayoutRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
