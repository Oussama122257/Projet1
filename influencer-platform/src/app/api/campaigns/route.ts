import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import {
  prisma,
  CampaignStatus,
  Platform,
  PricingModel,
  Role,
} from "@/lib/db";
import { requireBrand, requireUser } from "@/lib/session";

const createSchema = z
  .object({
    title: z.string().min(3).max(120),
    description: z.string().max(4000).optional(),
    brief: z.string().max(8000).optional(),
    pricingModel: z.nativeEnum(PricingModel),
    /** Cents per 1,000 views. */
    cpmRate: z.number().int().min(0).default(0),
    /** Cents per click. */
    cpcRate: z.number().int().min(0).default(0),
    budgetCents: z.number().int().min(1000, "Budget must be at least $10"),
    minPayoutThresholdCents: z.number().int().min(100).default(1000),
    platforms: z.array(z.nativeEnum(Platform)).min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    requirements: z.string().max(4000).optional(),
    hashtags: z.array(z.string().max(60)).max(20).default([]),
    targetCountries: z.array(z.string().length(2)).max(50).default([]),
    status: z
      .enum([CampaignStatus.DRAFT, CampaignStatus.ACTIVE])
      .default(CampaignStatus.DRAFT),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })
  .refine(
    (d) =>
      d.pricingModel === PricingModel.CPC ? d.cpcRate > 0 : true,
    { message: "CPC campaigns need a click rate above zero", path: ["cpcRate"] }
  )
  .refine(
    (d) => (d.pricingModel === PricingModel.CPM ? d.cpmRate > 0 : true),
    { message: "CPM campaigns need a view rate above zero", path: ["cpmRate"] }
  )
  .refine(
    (d) =>
      d.pricingModel === PricingModel.HYBRID
        ? d.cpmRate > 0 && d.cpcRate > 0
        : true,
    {
      message: "Hybrid campaigns need both a view rate and a click rate",
      path: ["pricingModel"],
    }
  );

/**
 * GET /api/campaigns
 *
 * Brands see their own campaigns; influencers see the open marketplace (active
 * campaigns only) annotated with whether they have already applied.
 */
export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const scope = url.searchParams.get("scope") ?? "auto";

  const asMarketplace =
    scope === "marketplace" || (scope === "auto" && user.role === Role.INFLUENCER);

  if (asMarketplace) {
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
      include: {
        brand: { select: { id: true, name: true, companyName: true, image: true } },
        applications: {
          where: { influencerId: user.id },
          select: { id: true, status: true },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(
      campaigns.map(({ applications, ...c }) => ({
        ...c,
        myApplication: applications[0] ?? null,
      }))
    );
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      brandId: user.role === Role.ADMIN ? undefined : user.id,
      ...(status ? { status: status as CampaignStatus } : {}),
    },
    include: {
      _count: { select: { applications: true } },
      applications: {
        select: { status: true, earningsCents: true, views: true, clicks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    campaigns.map(({ applications, ...c }) => ({
      ...c,
      stats: {
        totalApplications: applications.length,
        approved: applications.filter((a) => a.status === "APPROVED").length,
        pending: applications.filter((a) => a.status === "PENDING").length,
        totalViews: applications.reduce((s, a) => s + a.views, 0),
        totalClicks: applications.reduce((s, a) => s + a.clicks, 0),
      },
    }))
  );
});

/** POST /api/campaigns — brands only. */
export const POST = handler(async (req: Request) => {
  const user = await requireBrand();
  const body = await parseBody(req, createSchema);

  const campaign = await prisma.campaign.create({
    data: {
      brandId: user.id,
      title: body.title,
      description: body.description,
      brief: body.brief,
      pricingModel: body.pricingModel,
      cpmRate: body.cpmRate,
      cpcRate: body.cpcRate,
      budgetCents: body.budgetCents,
      minPayoutThresholdCents: body.minPayoutThresholdCents,
      platforms: body.platforms,
      startDate: body.startDate,
      endDate: body.endDate,
      requirements: body.requirements,
      hashtags: body.hashtags,
      targetCountries: (body.targetCountries ?? []).map((c) => c.toUpperCase()),
      status: body.status,
    },
  });

  await recordAudit({
    action: "campaign.created",
    entityType: "Campaign",
    entityId: campaign.id,
    actorId: user.id,
    metadata: {
      budgetCents: campaign.budgetCents,
      pricingModel: campaign.pricingModel,
    },
  });

  return ok(campaign, 201);
});
