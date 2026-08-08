import { NextResponse } from "next/server";
import { smartSearch } from "@/lib/ai/search";

/** GET /api/ai/search?q=robe+pour+mariage+verte&wilayaId=… */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ products: [], parsed: null });

  const { products, parsed } = await smartSearch(q, url.searchParams.get("wilayaId") ?? undefined);
  return NextResponse.json({
    parsed,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images[0] ?? null,
      category: p.category,
      store: p.store.name,
      wilaya: p.store.wilaya.name,
    })),
  });
}
