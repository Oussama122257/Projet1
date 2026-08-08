import { db } from "@/lib/db";

export interface PriceSuggestion {
  suggestedMin: number;
  suggestedMax: number;
  suggested: number;
  marketAverage: number | null;
  sampleSize: number;
  scope: "wilaya" | "national" | "none";
}

/**
 * AI Price Suggestion for sellers: average of similar products (same
 * category) in the same wilaya; falls back to national market when the
 * local sample is too small. Suggested band = avg ± 15%, rounded to 50 DZD.
 */
export async function suggestPrice(params: {
  category: string;
  storeWilayaId: string;
  excludeStoreId?: string;
}): Promise<PriceSuggestion> {
  const baseWhere = {
    category: { equals: params.category, mode: "insensitive" as const },
    status: "PUBLISHED" as const,
    ...(params.excludeStoreId ? { storeId: { not: params.excludeStoreId } } : {}),
  };

  // Local market first — prices differ between Alger and Tamanrasset.
  const local = await db.product.aggregate({
    where: { ...baseWhere, store: { wilayaId: params.storeWilayaId } },
    _avg: { price: true },
    _count: true,
  });

  let avg = local._avg.price;
  let count = local._count;
  let scope: PriceSuggestion["scope"] = "wilaya";

  if (count < 3) {
    const national = await db.product.aggregate({
      where: baseWhere,
      _avg: { price: true },
      _count: true,
    });
    avg = national._avg.price;
    count = national._count;
    scope = "national";
  }

  if (!avg || count === 0) {
    return { suggestedMin: 0, suggestedMax: 0, suggested: 0, marketAverage: null, sampleSize: 0, scope: "none" };
  }

  const round50 = (n: number) => Math.round(n / 50) * 50;
  return {
    suggested: round50(avg),
    suggestedMin: round50(avg * 0.85),
    suggestedMax: round50(avg * 1.15),
    marketAverage: Math.round(avg),
    sampleSize: count,
    scope,
  };
}
