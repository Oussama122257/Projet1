"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function PipelineForm({ sources }: { sources: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        goal: form.get("goal"),
        timezone: form.get("timezone") || "UTC",
        sourceIds: selected,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Failed to create pipeline");
      return;
    }
    setOpen(false);
    setSelected([]);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Create pipeline</Button>;
  }

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-4 rounded-lg border border-surface-border bg-surface-raised p-5"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Fashion Page" required />
        </div>
        <div>
          <Label htmlFor="goal">Primary goal</Label>
          <select
            id="goal"
            name="goal"
            className="h-9 w-full rounded border border-surface-border bg-surface px-3 text-sm"
            defaultValue="ENGAGEMENT"
          >
            {["REACH", "ENGAGEMENT", "FOLLOWERS", "TRAFFIC", "CONVERSIONS"].map((g) => (
              <option key={g} value={g}>
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" placeholder="UTC" defaultValue="UTC" />
        </div>
      </div>
      <div>
        <Label>Sources</Label>
        {sources.length === 0 ? (
          <p className="text-xs text-content-tertiary">
            No sources available — add sources first, then attach them here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => {
              const active = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setSelected((prev) =>
                      active ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-accent-hover"
                      : "border-surface-border text-content-secondary hover:bg-surface-overlay"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create pipeline"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
