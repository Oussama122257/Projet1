"use client";

import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

/** Confirm order → auto-generate courier waybill; then print it. */
export function ConfirmShipmentButton({
  shipmentId,
  hasWaybill,
  waybillUrl,
  delivered,
}: {
  shipmentId: string;
  hasWaybill: boolean;
  waybillUrl: string | null;
  delivered: boolean;
}) {
  const router = useRouter();
  const confirm = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data;
    },
    onSuccess: () => router.refresh(),
  });

  if (delivered) return <span className="text-xs text-muted-foreground">—</span>;

  if (hasWaybill && waybillUrl) {
    return (
      <a
        href={waybillUrl}
        target="_blank"
        className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline"
      >
        <Printer className="h-4 w-4" /> Bordereau
      </a>
    );
  }

  return (
    <Button size="sm" variant="gold" onClick={() => confirm.mutate()} disabled={confirm.isPending}>
      {confirm.isPending ? "…" : "Confirmer + bordereau"}
    </Button>
  );
}
