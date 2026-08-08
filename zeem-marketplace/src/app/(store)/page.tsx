import Link from "next/link";
import { Sparkles, Truck, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { PRODUCT_CATEGORIES } from "@/data/wilayas";
import { ProductCard } from "@/components/product/product-card";
import { TrendingSection } from "./trending-section";

export const dynamic = "force-dynamic";

const CATEGORY_EMOJI: Record<string, string> = {
  Robes: "👗", Kaftans: "✨", Hijabs: "🧕", Abayas: "🖤", Chemises: "👔",
  Pantalons: "👖", Vestes: "🧥", Chaussures: "👠", Sacs: "👜",
  Accessoires: "💍", Enfants: "🧸", Sport: "⚽",
};

/** Homepage: hero (flash sales), categories grid, trending-in-your-wilaya. */
export default async function HomePage() {
  const [flashSale, latest] = await Promise.all([
    db.flashSale.findFirst({
      where: { isActive: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      include: { store: { include: { wilaya: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      <section className="card-enter mt-6 overflow-hidden rounded-2xl bg-navy-700 text-white">
        <div className="relative px-6 py-14 md:px-12 md:py-20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <p className="flex items-center gap-2 text-sm font-semibold text-gold">
            <Sparkles className="h-4 w-4" />
            {flashSale ? `⚡ ${flashSale.title} — jusqu'à −${flashSale.discountPercent}%` : "Nouveautés chaque jour"}
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight md:text-5xl">
            La mode algérienne,
            <br />
            livrée <span className="text-gold">chez vous</span>.
          </h1>
          <p className="mt-4 max-w-md text-navy-100">
            Kaftans, robes, hijabs et plus, des meilleures boutiques des 58 wilayas.
            Payez en espèces à la livraison.
          </p>
          <Link
            href="/products"
            className="btn-gold mt-6 inline-flex items-center rounded-xl px-8 py-3"
          >
            Découvrir la boutique
          </Link>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-navy-100">
            <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-gold" /> Paiement à la livraison</span>
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> 58 wilayas couvertes</span>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-navy-700">Catégories</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {PRODUCT_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="glass flex flex-col items-center gap-2 p-4 text-center transition-transform hover:-translate-y-1"
            >
              <span className="text-3xl">{CATEGORY_EMOJI[cat] ?? "🛍️"}</span>
              <span className="text-sm font-semibold text-navy-700">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending in your wilaya (client component using geoloc/selected wilaya) */}
      <TrendingSection />

      {/* Latest products */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-700">Nouveautés</h2>
          <Link href="/products" className="text-sm font-semibold text-gold-600 hover:underline">
            Tout voir →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((p) => (
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
      </section>
    </div>
  );
}
