"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/stores/cart";
import { useWilayas } from "@/hooks/use-wilayas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDZD } from "@/lib/utils";
import { trackPurchase } from "@/components/meta-pixel";

interface CartOrderResponse {
  reference: string;
  total: number;
  itemsTotal: number;
  shippingTotal: number;
  shipmentCount: number;
  pixelEventId: string;
  contentIds: string[];
  suggestRegister: boolean;
}

/**
 * Cart checkout (multi-vendor). The server splits the order into one
 * shipment per store and returns the itemized breakdown shown on success.
 */
export default function CheckoutPage() {
  const { items, itemsTotal, storeCount, clear } = useCart();
  const { data: wilayas } = useWilayas();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaId, setWilayaId] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<CartOrderResponse | null>(null);

  const communes = useMemo(
    () => wilayas?.find((w) => w.id === wilayaId)?.communes ?? [],
    [wilayas, wilayaId]
  );

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/orders/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          fullName,
          phone: phone.replace(/\s/g, ""),
          wilayaId,
          communeId,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      return data as CartOrderResponse;
    },
    onSuccess: (data) => {
      trackPurchase({ eventId: data.pixelEventId, value: data.total, contentIds: data.contentIds });
      setResult(data);
      clear();
    },
  });

  if (result) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald2" />
        <h1 className="mt-4 text-2xl font-bold text-navy-700">Commande confirmée !</h1>
        <p className="mt-2 text-muted-foreground">
          Référence: <span className="font-mono font-bold text-navy-700">{result.reference}</span>
        </p>
        <div className="glass mt-6 space-y-2 p-4 text-left text-sm">
          <div className="flex justify-between"><span>Articles</span><span>{formatDZD(result.itemsTotal)}</span></div>
          <div className="flex justify-between">
            <span>Livraison ({result.shipmentCount} colis)</span>
            <span>{formatDZD(result.shippingTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-black text-gold-600">
            <span>Total à payer (COD)</span><span>{formatDZD(result.total)}</span>
          </div>
        </div>
        {result.suggestRegister && (
          <p className="mt-4 text-sm text-muted-foreground">
            💡 <Link href="/register" className="font-semibold text-gold-600 underline">Créez un compte</Link>{" "}
            pour suivre vos commandes et enregistrer vos adresses.
          </p>
        )}
        <Button asChild variant="gold" className="mt-6">
          <Link href={`/orders/${result.reference}`}>Suivre ma commande</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted-foreground">Votre panier est vide.</p>
        <Button asChild variant="gold" className="mt-4"><Link href="/products">Boutique</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy-700">Finaliser la commande</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paiement à la livraison — {storeCount()} colis, {items.length} article(s).
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          checkout.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="co-name">Nom complet</Label>
            <Input id="co-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="co-phone">Téléphone (+213)</Label>
            <Input id="co-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0550 12 34 56" required />
          </div>
          <div>
            <Label htmlFor="co-wilaya">Wilaya</Label>
            <Select id="co-wilaya" value={wilayaId} onChange={(e) => { setWilayaId(e.target.value); setCommuneId(""); }} required>
              <option value="">Choisir…</option>
              {wilayas?.map((w) => (
                <option key={w.id} value={w.id}>{String(w.code).padStart(2, "0")} — {w.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="co-commune">Commune</Label>
            <Select id="co-commune" value={communeId} onChange={(e) => setCommuneId(e.target.value)} disabled={!wilayaId} required>
              <option value="">Choisir…</option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="co-address">Adresse complète</Label>
          <Input id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, bâtiment, repères…" required />
        </div>

        <div className="glass p-4 text-sm">
          <div className="flex justify-between">
            <span>Sous-total articles</span>
            <span className="font-semibold">{formatDZD(itemsTotal())}</span>
          </div>
          <div className="mt-1 flex justify-between text-muted-foreground">
            <span>Livraison ({storeCount()} colis)</span>
            <span>calculée par wilaya à la confirmation</span>
          </div>
        </div>

        {checkout.isError && (
          <p className="text-sm font-medium text-red-600">{(checkout.error as Error).message}</p>
        )}

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={checkout.isPending}>
          {checkout.isPending ? "Confirmation…" : "Confirmer — payer à la livraison"}
        </Button>
      </form>
    </div>
  );
}
