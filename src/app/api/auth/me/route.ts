import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, withErrorHandling, jsonError } from "@/lib/api";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      allowAiAnalysis: true,
      allowAiPerformance: true,
      allowAiCaptions: true,
      allowAiRecommendations: true,
      preferredAiProvider: true,
    },
  });
  if (!user) return jsonError(401, "unauthenticated", "Session user no longer exists");
  return NextResponse.json(user);
});
