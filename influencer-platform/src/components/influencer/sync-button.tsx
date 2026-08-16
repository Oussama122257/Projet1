"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Manual metric refresh.
 *
 * Hits the same pipeline as the hourly cron, so what a creator sees after
 * pressing this is exactly what the automated run would have produced.
 */
export function SyncButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [state, setState] = React.useState<"idle" | "syncing" | "error">("idle");

  async function sync() {
    setState("syncing");
    const res = await fetch(`/api/applications/${applicationId}/sync`, {
      method: "POST",
    });
    if (!res.ok) {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }
    router.refresh();
    setState("idle");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={sync}
      disabled={state === "syncing"}
      aria-label="Refresh metrics"
    >
      <RefreshCw
        className={cn("size-3.5", state === "syncing" && "animate-spin")}
        aria-hidden
      />
      {state === "error" ? "Failed" : "Refresh"}
    </Button>
  );
}
