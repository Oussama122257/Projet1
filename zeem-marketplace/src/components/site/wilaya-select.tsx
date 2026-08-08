"use client";

import { MapPin } from "lucide-react";
import { useWilayas } from "@/hooks/use-wilayas";
import { useWilaya } from "@/stores/wilaya";

/** Header wilaya picker — filters "trending" & boosts local stores in search. */
export function WilayaSelect() {
  const { data: wilayas } = useWilayas();
  const { wilayaId, setWilaya } = useWilaya();

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-white px-2 py-1.5">
      <MapPin className="h-4 w-4 shrink-0 text-gold-600" />
      <select
        className="max-w-[130px] bg-transparent text-sm font-medium text-navy-700 outline-none"
        value={wilayaId ?? ""}
        onChange={(e) => {
          const w = wilayas?.find((w) => w.id === e.target.value);
          setWilaya(w?.id ?? null, w?.name ?? null);
        }}
        aria-label="Choisir votre wilaya"
      >
        <option value="">Toute l&apos;Algérie</option>
        {wilayas?.map((w) => (
          <option key={w.id} value={w.id}>
            {String(w.code).padStart(2, "0")} — {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
