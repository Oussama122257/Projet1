import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (req: Request) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const jobs = await db.job.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json(jobs);
});
