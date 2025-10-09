import { DashboardLayout } from "@/components/dashboard-layout";
import { RouteGuard } from "@/components/route-guard";
import { AuthLoadingSpinner } from "@/components/auth-loading-spinner";
import { Suspense } from "react";

export default function DashboardLayoutRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthLoadingSpinner />}>
      <RouteGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </RouteGuard>
    </Suspense>
  );
}
