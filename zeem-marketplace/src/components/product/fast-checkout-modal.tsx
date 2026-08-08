"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Truck, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useWilayas } from "@/hooks/use-wilayas";
import { formatDZD } from "@/lib/utils";
import { trackPurchase, trackInitiateCheckout } from "@/components/meta-pixel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string; price: number };
  quantity: number;
  size?: string;
  color?: string;
}

/**
 * "Acheter Maintenant" — the 5-field COD fast checkout (no account):
 * Nom complet, Téléphone (+213, auto-formaté), Wilaya, Commune, Adresse.
 * Shipping recalculates live when the wilaya changes.
 */
export function FastCheckoutModal({ open, onOpenChange, product, quantity, size, color }: Props) {
  const { data: wilayas } = useWilayas();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaId, setWilayaId] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [address, setAddress] = useState("");
  const [success, setSuccess] = useState<{ reference: string; total: number } | null>(null);

  const communes = useMemo(
    () => wilayas?.find((w) => w.id === wilayaId)?.communes ?? [],
    [wilayas, wilayaId]
  );

  // Auto-format phone as the buyer types: 0550123456 → 0550 12 34 56
  const formatPhoneInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8), digits.slice(8, 10)];
    setPhone(parts.filter(Boolean).join(" "));
  };

  const checkout = useMutation({
    mutationFn: async () => {
      const utm = new URLSearchParams(window.location.search);
      const res = await fetch("/api/orders/fast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          size,
          color,
          fullName,
          phone: phone.replace(/\s/g, ""),
          wilayaId,
          communeId,
          address,
          utmSource: utm.get("utm_source") ?? undefined,
          utmCampaign: utm.get("utm_campaign") ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data as {
        reference: string;
        total: number;
        pixelEventId: string;
        contentIds: string[];
      };
    },
    onSuccess: (data) => {
      // Browser-side Purchase now; server CAPI re-fires the same eventID on
      // COD collection → Meta deduplicates.
      trackPurchase({ eventId: data.pixelEventId, value: data.total, contentIds: data.contentIds });
      setSuccess({ reference: data.reference, total: data.total });
    },
  });

  const itemsTotal = product.price * quantity;
  const canSubmit = fullName.length >= 3 && phone.replace(/\s/g, "").length === 10 && wilayaId && communeId && address.length >= 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center"
            >
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald2" />
              <h3 className="mt-4 text-xl font-bold text-navy-700">Commande confirmée !</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Référence: <span className="font-mono font-bold text-navy-700">{success.reference}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vous paierez <strong className="text-gold-600">{formatDZD(success.total)}</strong> en
                espèces à la livraison. Gardez votre téléphone allumé, le livreur vous appellera.
              </p>
              <Button variant="gold" className="mt-6 w-full" onClick={() => onOpenChange(false)}>
                Continuer mes achats
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gold" /> Acheter Maintenant
                </DialogTitle>
                <DialogDescription>
                  {quantity}× {product.name} — paiement à la livraison, sans compte.
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  trackInitiateCheckout(itemsTotal, [product.id]);
                  checkout.mutate();
                }}
              >
                <div>
                  <Label htmlFor="fc-name">Nom complet</Label>
                  <Input id="fc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amina Benali" required />
                </div>
                <div>
                  <Label htmlFor="fc-phone">Téléphone (+213)</Label>
                  <Input id="fc-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => formatPhoneInput(e.target.value)} placeholder="0550 12 34 56" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fc-wilaya">Wilaya</Label>
                    <Select id="fc-wilaya" value={wilayaId} onChange={(e) => { setWilayaId(e.target.value); setCommuneId(""); }} required>
                      <option value="">Choisir…</option>
                      {wilayas?.map((w) => (
                        <option key={w.id} value={w.id}>
                          {String(w.code).padStart(2, "0")} — {w.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fc-commune">Commune</Label>
                    <Select id="fc-commune" value={communeId} onChange={(e) => setCommuneId(e.target.value)} disabled={!wilayaId} required>
                      <option value="">Choisir…</option>
                      {communes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="fc-address">Adresse complète</Label>
                  <Input id="fc-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, bâtiment, repères…" required />
                </div>

                <div className="rounded-xl bg-gold-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Produit ({quantity}×)</span>
                    <span className="font-semibold">{formatDZD(itemsTotal)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" /> Livraison
                    </span>
                    <span>{wilayaId ? "calculée à la confirmation" : "choisissez votre wilaya"}</span>
                  </div>
                </div>

                {checkout.isError && (
                  <p className="text-sm font-medium text-red-600">{(checkout.error as Error).message}</p>
                )}

                <Button type="submit" variant="gold" size="lg" className="w-full" disabled={!canSubmit || checkout.isPending}>
                  {checkout.isPending ? "Confirmation…" : "Confirmer la commande (COD)"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  💵 Vous payez en espèces à la réception du colis.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
