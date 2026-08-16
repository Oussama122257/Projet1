import { z } from "zod";
import { fail, handler, ok, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import {
  prisma,
  ApplicationStatus,
  CampaignStatus,
  Platform,
  Role,
} from "@/lib/db";
import { requireUser } from "@/lib/session";

const applySchema = z.object({
  campaignId: z.string().min(1),
  pitch: z.string().max(2000).optional(),
  platform: z.nativeEnum(Platform).optional(),
});

/** GET /api/applications — scoped to whoever is asking. */
export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as ApplicationStatus | null;
  const campaignId = url.searchParams.get("campaignId");

  const where =
    user.role === Role.INFLUENCER
      ? { influencerId: user.id }
      : user.role === Role.BRAND
        ? { campaign: { brandId: user.id } }
        : {};

  const applications = await prisma.influencerApplication.findMany({
    where: {
      ...where,
      ...(status ? { status } : {}),
      ...(campaignId ? { campaignId } : {}),
    },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          pricingModel: true,
          cpmRate: true,
          cpcRate: true,
          budgetCents: true,
          minPayoutThresholdCents: true,
          status: true,
          endDate: true,
          brand: { select: { name: true, companyName: true, image: true } },
        },
      },
      influencer: {
        select: { id: true, name: true, handle: true, image: true, country: true },
      },
      fraudFlags: {
        where: { resolvedAt: null },
        select: { id: true, reason: true, severity: true },
      },
      snapshots: {
        orderBy: { capturedAt: "asc" },
        select: { capturedAt: true, views: true, clicks: true, earningsCents: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(applications);
});

/** POST /api/applications — an influencer applies to a campaign. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== Role.INFLUENCER) {
    return fail("Only influencers can apply to campaigns", 403);
  }

  const body = await parseBody(req, applySchema);

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId },
  });
  if (!campaign) return fail("Campaign not found", 404);
  if (campaign.status !== CampaignStatus.ACTIVE) {
    return fail("This campaign is not accepting applications", 422);
  }
  if (campaign.endDate < new Date()) {
    return fail("This campaign has already ended", 422);
  }
  if (body.platform && !campaign.platforms.includes(body.platform)) {
    return fail(
      `This campaign does not run on ${body.platform}`,
      422
    );
  }

  const existing = await prisma.influencerApplication.findUnique({
    where: {
      campaignId_influencerId: { campaignId: campaign.id, influencerId: user.id },
    },
  });
  if (existing) return fail("You have already applied to this campaign", 409);

  const application = await prisma.influencerApplication.create({
    data: {
      campaignId: campaign.id,
      influencerId: user.id,
      pitch: body.pitch,
      platform: body.platform ?? campaign.platforms[0],
      status: ApplicationStatus.PENDING,
    },
  });

  await recordAudit({
    action: "application.submitted",
    entityType: "InfluencerApplication",
    entityId: application.id,
    actorId: user.id,
    metadata: { campaignId: campaign.id },
  });

  return ok(application, 201);
});
