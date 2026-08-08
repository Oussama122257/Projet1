import Link from "next/link";
import { db } from "@/lib/db";
import { smartSearch } from "@/lib/ai/search";
import { PRODUCT_CATEGORIES } from "@/data/wilayas";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Listing page. `?q=` runs AI smart search; `?category=` filters. */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const products = q
    ? (await smartSearch(q)).products
    : await db.product.findMany({
        where: { status: "PUBLISHED", ...(category ? { category } : {}) },
        include: { store: { include: { wilaya: true } } },
        orderBy: { createdAt: "desc" },
        take: 48,
      });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy-700">
        {q ? `Résultats pour « ${q} »` : category ? category : "Tous les produits"}
      </h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/products"
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
            !category ? "border-gold bg-gold text-navy-800" : "bg-white hover:border-gold"
          )}
        >
          Tout
        </Link>
        {PRODUCT_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/products?category=${encodeURIComponent(cat)}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium",
              category === cat ? "border-gold bg-gold text-navy-800" : "bg-white hover:border-gold"
            )}
          >
            {cat}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Aucun produit trouvé. Essayez une autre recherche.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id, name: p.name, slug: p.slug, price: p.price,
                comparePrice: p.comparePrice, images: p.images, category: p.category,
                storeName: p.store.name, wilayaName: p.store.wilaya.name,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
