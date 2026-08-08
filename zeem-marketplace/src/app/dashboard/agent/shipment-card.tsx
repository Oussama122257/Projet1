"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDZD } from "@/lib/utils";
import { formatAlgerianPhone } from "@/lib/phone";

interface ShipmentInfo {
  id: string;
  reference: string;
  codAmount: number;
  sellerName: string;
  sellerWilaya: string;
  buyerName: string;
  buyerPhone: string;
  destination: string;
}

/**
 * One task card. Delivery mode has the two critical actions:
 *  📞 Appeler — tel: link to the buyer
 *  ✅ Collecté — confirms cash received → triggers the COD payout logic
 */
export function ShipmentCard({ shipment, mode }: { shipment: ShipmentInfo; mode: "pickup" | "delivery" }) {
  const router = useRouter();
  const [collectOpen, setCollectOpen] = useState(false);
  const [amount, setAmount] = useState(String(shipment.codAmount));

  const collect = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${shipment.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualCollected: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data;
    },
    onSuccess: () => {
      setCollectOpen(false);
      router.refresh();
    },
  });

  return (
    <div className="glass card-enter p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-bold text-muted-foreground">{shipment.reference}</p>
          <p className="font-bold text-navy-700">
            {mode === "pickup" ? `🏪 ${shipment.sellerName}` : shipment.buyerName}
          </p>
          <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
            {mode === "pickup" ? `Boutique — ${shipment.sellerWilaya}` : shipment.destination}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-gold-50 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">À encaisser</p>
          <p className="font-black text-gold-700">{formatDZD(shipment.codAmount)}</p>
        </div>
      </div>

      {mode === "delivery" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${shipment.buyerPhone}`}>
              <Phone className="h-4 w-4" /> Appeler
            </a>
          </Button>
          <Button variant="success" size="sm" onClick={() => setCollectOpen(true)}>
            <CheckCircle2 className="h-4 w-4" /> Collecté ✅
          </Button>
        </div>
      )}
      {mode === "delivery" && shipment.buyerPhone && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {formatAlgerianPhone(shipment.buyerPhone)}
        </p>
      )}

      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer l&apos;encaissement</DialogTitle>
            <DialogDescription>
              {shipment.reference} — montant attendu: {formatDZD(shipment.codAmount)}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor={`amt-${shipment.id}`}>Montant reçu (DA)</Label>
            <Input
              id={`amt-${shipment.id}`}
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {collect.isError && (
            <p className="mt-2 text-sm font-medium text-red-600">{(collect.error as Error).message}</p>
          )}
          <Button
            variant="success"
            className="mt-4 w-full"
            disabled={collect.isPending}
            onClick={() => collect.mutate()}
          >
            {collect.isPending ? "Validation…" : "Confirmer — colis livré, cash reçu"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
