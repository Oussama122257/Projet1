"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useWilaya } from "@/stores/wilaya";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";

interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  category: string;
  store: { name: string; wilaya: { name: string } };
}

/** "Tendances dans votre wilaya" — driven by the header wilaya selector. */
export function TrendingSection() {
  const { wilayaId, wilayaName } = useWilaya();

  const { data } = useQuery({
    queryKey: ["trending", wilayaId],
    enabled: !!wilayaId,
    queryFn: async () => {
      const res = await fetch(`/api/products?wilayaId=${wilayaId}`);
      return (await res.json()) as { products: ApiProduct[] };
    },
  });

  if (!wilayaId || !data?.products.length) return null;

  const products: ProductCardData[] = data.products.slice(0, 4).map((p) => ({
    id: p.id, name: p.name, slug: p.slug, price: p.price,
    comparePrice: p.comparePrice, images: p.images, category: p.category,
    storeName: p.store.name, wilayaName: p.store.wilaya.name,
  }));

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-bold text-navy-700">
        <MapPin className="h-5 w-5 text-gold-600" /> Tendances à {wilayaName}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
