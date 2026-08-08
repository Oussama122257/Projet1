"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function DeliveryToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [on, setOn] = useState(isActive);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const next = !on;
    const res = await fetch("/api/admin/deliveries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: next }),
    });
    if (res.ok) setOn(next);
    setBusy(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        on ? "bg-emerald2" : "bg-gray-300"
      )}
      aria-label={on ? "Désactiver" : "Activer"}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}
