import { db } from "@/lib/db";

interface SizeChartEntry {
  size: string;
  minWeightKg: number;
  maxWeightKg: number;
  minHeightCm: number;
  maxHeightCm: number;
}

export interface SizeRecommendation {
  size: string | null;
  confidence: "high" | "medium" | "low";
  message: string;
}

/**
 * AI Size Recommender: buyer enters weight (kg) + height (cm); we match
 * against the SELLER's own sizing chart (Algerian ateliers cut differently
 * from EU standards). Deterministic scoring — works offline, no API cost.
 */
export async function recommendSize(params: {
  productId: string;
  weightKg: number;
  heightCm: number;
}): Promise<SizeRecommendation> {
  const product = await db.product.findUnique({
    where: { id: params.productId },
    include: { sizeChart: true },
  });
  if (!product) return { size: null, confidence: "low", message: "Produit introuvable." };

  const entries = (product.sizeChart?.entries as unknown as SizeChartEntry[] | null) ?? null;

  if (!entries || entries.length === 0) {
    // Generic fallback grid when the seller provided no chart.
    const generic: SizeChartEntry[] = [
      { size: "S", minWeightKg: 45, maxWeightKg: 58, minHeightCm: 150, maxHeightCm: 165 },
      { size: "M", minWeightKg: 58, maxWeightKg: 70, minHeightCm: 158, maxHeightCm: 172 },
      { size: "L", minWeightKg: 70, maxWeightKg: 82, minHeightCm: 162, maxHeightCm: 178 },
      { size: "XL", minWeightKg: 82, maxWeightKg: 95, minHeightCm: 165, maxHeightCm: 185 },
      { size: "XXL", minWeightKg: 95, maxWeightKg: 120, minHeightCm: 168, maxHeightCm: 195 },
    ];
    const match = scoreEntries(generic, params.weightKg, params.heightCm, product.sizes);
    return match
      ? { size: match, confidence: "medium", message: `Nous recommandons la taille ${match} (grille standard).` }
      : { size: null, confidence: "low", message: "Impossible de recommander une taille — contactez le vendeur." };
  }

  const match = scoreEntries(entries, params.weightKg, params.heightCm, product.sizes);
  return match
    ? { size: match, confidence: "high", message: `Selon la grille du vendeur, la taille ${match} est idéale pour vous.` }
    : { size: null, confidence: "low", message: "Vos mensurations sortent de la grille — contactez le vendeur." };
}

function scoreEntries(
  entries: SizeChartEntry[],
  weightKg: number,
  heightCm: number,
  availableSizes: string[]
): string | null {
  const usable = availableSizes.length > 0
    ? entries.filter((e) => availableSizes.includes(e.size))
    : entries;

  let best: { size: string; score: number } | null = null;
  for (const e of usable) {
    // Distance 0 when inside the box; otherwise how far outside.
    const wMid = (e.minWeightKg + e.maxWeightKg) / 2;
    const hMid = (e.minHeightCm + e.maxHeightCm) / 2;
    const inW = weightKg >= e.minWeightKg && weightKg <= e.maxWeightKg;
    const inH = heightCm >= e.minHeightCm && heightCm <= e.maxHeightCm;
    if (inW && inH) return e.size;
    const score = Math.abs(weightKg - wMid) / 10 + Math.abs(heightCm - hMid) / 20;
    if (!best || score < best.score) best = { size: e.size, score };
  }
  // Accept a near-miss but not an absurd one.
  return best && best.score < 2.5 ? best.size : null;
}
