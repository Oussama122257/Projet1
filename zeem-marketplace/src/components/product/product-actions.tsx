"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import { FastCheckoutModal } from "./fast-checkout-modal";
import { SizeRecommender } from "./size-recommender";
import { cn } from "@/lib/utils";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    sizes: string[];
    colors: string[];
    stock: number;
    storeId: string;
    storeName: string;
    storeWilaya: string;
  };
}

/**
 * Product page interaction block: variant pickers + the two CTAs.
 * "Ajouter au Panier" (outline) — multi-vendor cart flow.
 * "Acheter Maintenant" (solid gold) — 5-field guest COD fast checkout.
 */
export function ProductActions({ product }: Props) {
  const add = useCart((s) => s.add);
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [fastOpen, setFastOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const needsSize = product.sizes.length > 0 && !size;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    add(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
        size,
        color,
        storeId: product.storeId,
        storeName: product.storeName,
        storeWilaya: product.storeWilaya,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="space-y-5">
      {product.sizes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-navy-700">Taille</span>
            <SizeRecommender productId={product.id} onRecommend={setSize} />
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  "h-10 min-w-10 rounded-xl border-2 px-3 text-sm font-bold transition-all",
                  size === s
                    ? "border-gold bg-gold text-navy-800"
                    : "border-border bg-white text-navy-700 hover:border-gold"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.colors.length > 0 && (
        <div>
          <span className="mb-2 block text-sm font-semibold text-navy-700">Couleur</span>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all",
                  color === c
                    ? "border-gold bg-gold-50 text-navy-800"
                    : "border-border bg-white hover:border-gold"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-navy-700">Quantité</span>
        <div className="flex items-center rounded-xl border">
          <button className="p-2 hover:bg-muted" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Moins">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-bold">{quantity}</span>
          <button className="p-2 hover:bg-muted" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} aria-label="Plus">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="text-xs font-medium text-red-600">Plus que {product.stock} en stock !</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="outline" size="lg" disabled={outOfStock || needsSize} onClick={handleAddToCart}>
          <ShoppingBag className="h-5 w-5" />
          {added ? "Ajouté ✓" : "Ajouter au Panier"}
        </Button>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            disabled={outOfStock || needsSize}
            onClick={() => setFastOpen(true)}
          >
            <Zap className="h-5 w-5" /> Acheter Maintenant
          </Button>
        </motion.div>
      </div>
      {needsSize && <p className="text-xs text-muted-foreground">Choisissez une taille pour continuer.</p>}
      {outOfStock && <p className="text-sm font-semibold text-red-600">Rupture de stock</p>}

      <FastCheckoutModal
        open={fastOpen}
        onOpenChange={setFastOpen}
        product={product}
        quantity={quantity}
        size={size}
        color={color}
      />
    </div>
  );
}
