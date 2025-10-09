"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";

export function DashboardMessageHandler() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  }, [searchParams]);

  if (!message) return null;

  return (
    <div className="mb-4">
      <Alert variant="info">
        {message}
      </Alert>
    </div>
  );
}
