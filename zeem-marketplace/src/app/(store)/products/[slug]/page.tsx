import { notFound } from "next/navigation";
import { MapPin, ShieldCheck, Truck, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/product/product-actions";
import { ProductGallery } from "./gallery";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { store: { include: { wilaya: true } } },
  });
  if (!product || product.status !== "PUBLISHED") notFound();

  // Fire-and-forget view counter (used by trending + AI price suggestions)
  db.product.update({ where: { id: product.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-5">
          <div>
            <Badge>{product.category}</Badge>
            <h1 className="mt-2 text-2xl font-bold text-navy-700 md:text-3xl">{product.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-gold-600" />
              {product.store.name} — {product.store.wilaya.name}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-gold-600">{formatDZD(product.price)}</span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatDZD(product.comparePrice)}
                </span>
                <Badge variant="gold">−{discount}%</Badge>
              </>
            )}
          </div>

          <ProductActions
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: product.images[0] ?? null,
              sizes: product.sizes,
              colors: product.colors,
              stock: product.stock,
              storeId: product.storeId,
              storeName: product.store.name,
              storeWilaya: product.store.wilaya.name,
            }}
          />

          <div className="glass grid grid-cols-3 gap-2 p-4 text-center text-xs font-medium text-navy-700">
            <div><Wallet className="mx-auto mb-1 h-5 w-5 text-gold-600" />Paiement à la livraison</div>
            <div><Truck className="mx-auto mb-1 h-5 w-5 text-gold-600" />58 wilayas</div>
            <div><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-gold-600" />Vendeur vérifié</div>
          </div>

          {product.description && (
            <div>
              <h2 className="font-bold text-navy-700">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
