"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SourceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        url: form.get("url"),
        platform: "instagram",
        monitoringFrequencyMins: Number(form.get("frequency") ?? 1440),
        authorizationConfirmed: form.get("authorized") === "on" ? true : false,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Failed to create source");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Add source</Button>;
  }

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-4 rounded-lg border border-surface-border bg-surface-raised p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="My brand account" required />
        </div>
        <div>
          <Label htmlFor="url">Profile URL</Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://www.instagram.com/yourprofile/"
            required
          />
        </div>
        <div>
          <Label htmlFor="frequency">Monitoring frequency (minutes)</Label>
          <Input id="frequency" name="frequency" type="number" min={60} defaultValue={1440} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-content-secondary">
        <input type="checkbox" name="authorized" required className="mt-0.5 accent-indigo-500" />
        <span>
          I confirm that I own this profile&apos;s content or hold explicit permission to reuse
          it, per the Acceptable Use Policy. Scanning is blocked without this attestation.
        </span>
      </label>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create source"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ScanButton({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function scan() {
    setState("loading");
    const res = await fetch(`/api/sources/${sourceId}/scan`, { method: "POST" });
    if (res.ok) {
      setState("done");
      setMessage("Scan queued");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setState("error");
      setMessage(body?.error?.message ?? "Scan failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={scan} disabled={state === "loading"}>
        {state === "loading" ? "Queuing…" : "Scan now"}
      </Button>
      {message ? (
        <span className={`text-[11px] ${state === "error" ? "text-danger" : "text-success"}`}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
