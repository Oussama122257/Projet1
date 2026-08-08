import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatDZD } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  category: string;
  storeName: string;
  wilayaName: string;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-enter group glass overflow-hidden p-0 transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gold-50">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">👗</div>
        )}
        {discount && discount > 0 && (
          <Badge variant="gold" className="absolute left-2 top-2">
            −{discount}%
          </Badge>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-semibold text-navy-700">{product.name}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-gold-600">{formatDZD(product.price)}</span>
          {product.comparePrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatDZD(product.comparePrice)}
            </span>
          )}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-gold-600" />
          {product.storeName} · {product.wilayaName}
        </p>
      </div>
    </Link>
  );
}
