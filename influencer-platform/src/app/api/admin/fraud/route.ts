import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { resolveFlag } from "@/services/fraudDetection";

/** GET /api/admin/fraud — the review queue. */
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const resolved = url.searchParams.get("resolved") === "true";

  const flags = await prisma.fraudFlag.findMany({
    where: resolved ? { resolvedAt: { not: null } } : { resolvedAt: null },
    include: {
      application: {
        include: {
          influencer: {
            select: { id: true, name: true, handle: true, image: true, country: true },
          },
          campaign: { select: { id: true, title: true, pricingModel: true } },
          snapshots: {
            orderBy: { capturedAt: "desc" },
            take: 12,
            select: {
              capturedAt: true,
              views: true,
              clicks: true,
              viewsDelta: true,
              geoDistribution: true,
            },
          },
        },
      },
      resolvedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return ok(flags);
});

const resolveSchema = z.object({
  flagId: z.string().min(1),
  resolution: z.enum(["CLEARED", "UPHELD"]),
  note: z.string().max(2000).optional(),
});

/** POST /api/admin/fraud — clear or uphold a flag. */
export const POST = handler(async (req: Request) => {
  const admin = await requireAdmin();
  const body = await parseBody(req, resolveSchema);

  const result = await resolveFlag(
    body.flagId,
    body.resolution,
    admin.id,
    body.note
  );

  return ok(result);
});
