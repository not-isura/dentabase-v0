"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BarChart3, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportsAnalyticsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push("/settings")}
          className="cursor-pointer font-medium text-[hsl(258_22%_50%)] transition-colors hover:text-[hsl(258_46%_25%)]"
        >
          Settings
        </button>
        <ChevronRight className="h-4 w-4 text-[hsl(258_22%_40%)]" />
        <span className="font-semibold text-[hsl(258_46%_25%)]">Reports & Analytics</span>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(258_46%_25%)]">
            <BarChart3 className="h-5 w-5" />
            Reports & Analytics
          </CardTitle>
          <CardDescription>This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-10 text-[hsl(258_22%_50%)]">
            <AlertTriangle className="h-12 w-12 text-[hsl(35_90%_55%)]" />
            <p className="max-w-md text-center text-sm">
              Insights and exports are coming soon. We&apos;ll surface activity logs, usage summaries, and data downloads
              once the reporting pipeline is ready.
            </p>
            <Button variant="outline" className="cursor-pointer" onClick={() => router.push("/settings")}>Back to Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
