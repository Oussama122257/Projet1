import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { smartSearch } from "@/lib/ai/search";
import { PRODUCT_CATEGORIES } from "@/data/wilayas";

/**
 * GET /api/products?q=robe+mariage&category=Robes&wilayaId=…&page=1
 * `q` triggers AI smart search; otherwise standard filtered listing.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const wilayaId = url.searchParams.get("wilayaId") ?? undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 24;

  if (q) {
    const { products, parsed } = await smartSearch(q, wilayaId);
    return NextResponse.json({ products, parsed, page: 1, hasMore: false });
  }

  const where = {
    status: "PUBLISHED" as const,
    ...(category ? { category } : {}),
    ...(wilayaId ? { store: { wilayaId } } : {}),
  };
  const products = await db.product.findMany({
    where,
    include: { store: { include: { wilaya: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  });

  return NextResponse.json({
    products: products.slice(0, pageSize),
    page,
    hasMore: products.length > pageSize,
  });
}

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  category: z.enum(PRODUCT_CATEGORIES),
  weight: z.number().positive().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  aiGeneratedDesc: z.boolean().default(false),
});

/** POST /api/products — seller creates a product in their own store. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Réservé aux vendeurs." }, { status: 403 });
  }
  const store = await db.store.findUnique({ where: { userId: session.user.id } });
  if (!store) return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });
  if (!store.isActive) {
    return NextResponse.json(
      { error: "Boutique en attente de validation par l'équipe Zeem." },
      { status: 403 }
    );
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Champs invalides." }, { status: 400 });

  let slug = slugify(parsed.data.name);
  if (await db.product.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const product = await db.product.create({
    data: { ...parsed.data, comparePrice: parsed.data.comparePrice ?? null, slug, storeId: store.id },
  });
  return NextResponse.json({ product }, { status: 201 });
}
