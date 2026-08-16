import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageBody, PageHeader } from "@/components/layout/app-shell";
import { ConnectionCards } from "@/components/influencer/connection-cards";
import { prisma, Platform } from "@/lib/db";
import { flags } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: { error?: string; connected?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const links = await prisma.socialAccount.findMany({
    where: { userId: user.id },
  });

  const byPlatform = new Map(links.map((l) => [l.platform, l]));

  const available: Record<Platform, boolean> = {
    TIKTOK: flags.tiktokReady || flags.useMockMetrics,
    INSTAGRAM: flags.instagramReady,
    YOUTUBE: flags.youtubeReady,
  };

  const connections = Object.values(Platform).map((platform) => {
    const link = byPlatform.get(platform);
    return {
      platform,
      connected: Boolean(link?.isActive),
      integrationAvailable: available[platform],
      username: link?.username ?? null,
      displayName: link?.displayName ?? null,
      followerCount: link?.followerCount ?? 0,
      connectedAt: link?.connectedAt?.toISOString() ?? null,
      lastSyncedAt: link?.lastSyncedAt?.toISOString() ?? null,
      needsReconnect: Boolean(link && !link.isActive),
    };
  });

  return (
    <PageBody>
      <PageHeader
        title="Connect your accounts"
        description="We read public performance metrics for the content you submit to campaigns — nothing else. Tokens are encrypted at rest and can be revoked here at any time."
      />

      <div className="mt-8">
        <ConnectionCards
          connections={connections}
          error={searchParams.error}
          justConnected={searchParams.connected}
        />
      </div>
    </PageBody>
  );
}
