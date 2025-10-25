"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SystemConfigurationPage() {
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
        <span className="font-semibold text-[hsl(258_46%_25%)]">System Configuration</span>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(258_46%_25%)]">
            <SettingsIcon className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>This section is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-10 text-[hsl(258_22%_50%)]">
            <AlertTriangle className="h-12 w-12 text-[hsl(35_90%_55%)]" />
            <p className="max-w-md text-center text-sm">
              Infrastructure controls are on the roadmap. We&apos;ll add database tooling, email providers, and security
              policies in an upcoming release.
            </p>
            <Button variant="outline" className="cursor-pointer" onClick={() => router.push("/settings")}>Back to Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
