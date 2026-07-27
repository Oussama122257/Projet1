"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function MetricoolForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/integrations/metricool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userToken: form.get("userToken"),
        metricoolUserId: form.get("metricoolUserId"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Connection failed");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="userToken">Metricool API token (X-Mc-Auth)</Label>
          <Input
            id="userToken"
            name="userToken"
            type="password"
            placeholder="From Account Settings → API"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="metricoolUserId">Metricool user ID</Label>
          <Input id="metricoolUserId" name="metricoolUserId" required autoComplete="off" />
        </div>
      </div>
      <p className="text-xs text-content-tertiary">
        Requires a Metricool Advanced or Custom plan. The token is validated against the official
        API, encrypted at rest, and never exposed to the browser or AI providers.
      </p>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Validating…" : "Connect Metricool"}
      </Button>
    </form>
  );
}
