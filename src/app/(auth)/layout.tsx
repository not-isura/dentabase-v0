import { AuthGuard } from "@/components/auth-guard";
import { AuthLoadingSpinner } from "@/components/auth-loading-spinner";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthLoadingSpinner />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
