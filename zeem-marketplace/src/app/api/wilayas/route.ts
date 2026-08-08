import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cached } from "@/lib/redis";

/**
 * All 58 wilayas + communes. This list is immutable between seeds, so it is
 * cached in Redis for 24h — it's hit on every checkout.
 */
export async function GET() {
  const wilayas = await cached("wilayas:all", 86400, () =>
    db.wilaya.findMany({
      orderBy: { code: "asc" },
      include: { communes: { orderBy: { name: "asc" } } },
    })
  );
  return NextResponse.json({ wilayas });
}
