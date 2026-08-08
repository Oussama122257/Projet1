"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { formatDZD } from "@/lib/utils";

/**
 * Cart page — items grouped by store so buyers see up-front that stores in
 * different wilayas mean separate shipments (each with its own fee).
 */
export default function CartPage() {
  const { items, setQuantity, remove, itemsTotal, storeCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold text-navy-700">Votre panier est vide</h1>
        <Button asChild variant="gold" className="mt-6">
          <Link href="/products">Découvrir les produits</Link>
        </Button>
      </div>
    );
  }

  const byStore = new Map<string, typeof items>();
  for (const item of items) {
    byStore.set(item.storeId, [...(byStore.get(item.storeId) ?? []), item]);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy-700">Mon Panier</h1>
      {storeCount() > 1 && (
        <p className="mt-2 rounded-xl bg-gold-50 p-3 text-sm text-navy-700">
          🚚 Votre panier contient des articles de <strong>{storeCount()} boutiques</strong> —
          il sera livré en {storeCount()} colis séparés, chacun avec ses frais de livraison.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {[...byStore.entries()].map(([storeId, storeItems]) => (
          <div key={storeId} className="glass p-4">
            <p className="mb-3 text-sm font-bold text-navy-700">
              🏪 {storeItems[0].storeName}
              <span className="ml-2 font-normal text-muted-foreground">
                ({storeItems[0].storeWilaya})
              </span>
            </p>
            <div className="space-y-3">
              {storeItems.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold-50 text-2xl">👗</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}`} className="truncate text-sm font-semibold text-navy-700 hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm font-bold text-gold-600">{formatDZD(item.price)}</p>
                  </div>
                  <div className="flex items-center rounded-xl border">
                    <button className="p-1.5 hover:bg-muted" onClick={() => setQuantity(item.productId, item.quantity - 1, item.size, item.color)}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button className="p-1.5 hover:bg-muted" onClick={() => setQuantity(item.productId, item.quantity + 1, item.size, item.color)}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                    onClick={() => remove(item.productId, item.size, item.color)}
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass mt-6 flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">Sous-total ({items.length} articles)</p>
          <p className="text-2xl font-black text-navy-700">{formatDZD(itemsTotal())}</p>
          <p className="text-xs text-muted-foreground">+ frais de livraison calculés à l&apos;étape suivante</p>
        </div>
        <Button asChild variant="gold" size="lg">
          <Link href="/checkout">Commander (COD)</Link>
        </Button>
      </div>
    </div>
  );
}
