import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { aiAvailable, jsonCompletion } from "./openai";
import { PRODUCT_CATEGORIES } from "@/data/wilayas";

interface ParsedQuery {
  keywords: string[];
  category?: string;
  colors?: string[];
  occasion?: string;
  maxPrice?: number;
}

/**
 * AI Smart Search: "robe pour mariage verte" → understands intent.
 * Step 1 — GPT parses the natural-language query into structured filters
 *          (category, colors, occasion, budget).
 * Step 2 — Prisma full-text-ish query combines those filters.
 * Fallback — plain keyword matching when no OpenAI key is configured.
 */
export async function smartSearch(query: string, wilayaId?: string) {
  let parsed: ParsedQuery = { keywords: query.split(/\s+/).filter((w) => w.length > 2) };

  if (aiAvailable()) {
    try {
      parsed = await jsonCompletion<ParsedQuery>(
        `Tu analyses des recherches de mode en français/arabe/darija algérienne.
Catégories valides: ${PRODUCT_CATEGORIES.join(", ")}.
Réponds en JSON: {"keywords": string[] (termes produit, sans stopwords),
"category": string|null, "colors": string[] (en français) | null,
"occasion": string|null (mariage, soirée, quotidien…), "maxPrice": number|null (DZD)}`,
        query
      );
    } catch {
      // AI down → keep keyword fallback
    }
  }

  const or: Prisma.ProductWhereInput[] = [];
  for (const kw of parsed.keywords ?? []) {
    or.push({ name: { contains: kw, mode: "insensitive" } });
    or.push({ description: { contains: kw, mode: "insensitive" } });
  }
  if (parsed.occasion) {
    or.push({ description: { contains: parsed.occasion, mode: "insensitive" } });
  }

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    ...(or.length > 0 ? { OR: or } : {}),
    ...(parsed.category ? { category: { equals: parsed.category, mode: "insensitive" } } : {}),
    ...(parsed.colors?.length
      ? { colors: { hasSome: parsed.colors.map((c) => c[0].toUpperCase() + c.slice(1)) } }
      : {}),
    ...(parsed.maxPrice ? { price: { lte: parsed.maxPrice } } : {}),
    // Buyers can browse everything; wilayaId only boosts local stores below.
  };

  const products = await db.product.findMany({
    where,
    include: { store: { include: { wilaya: true } } },
    orderBy: [{ soldCount: "desc" }, { views: "desc" }],
    take: 24,
  });

  // Local-first ranking: same-wilaya stores float to the top (cheaper + faster delivery).
  if (wilayaId) {
    products.sort((a, b) =>
      Number(b.store.wilayaId === wilayaId) - Number(a.store.wilayaId === wilayaId)
    );
  }

  return { products, parsed };
}
