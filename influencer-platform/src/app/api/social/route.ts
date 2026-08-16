import { z } from "zod";
import { handler, ok, parseBody } from "@/lib/api";
import { Platform } from "@/lib/db";
import { flags } from "@/lib/env";
import { requireUser } from "@/lib/session";
import { disconnectPlatform, listConnections } from "@/services/socialAuth";

/** GET /api/social — connection status for every platform. */
export const GET = handler(async () => {
  const user = await requireUser();
  const connections = await listConnections(user.id);

  const byPlatform = new Map(connections.map((c) => [c.platform, c]));

  const availability: Record<Platform, boolean> = {
    [Platform.TIKTOK]: flags.tiktokReady || flags.useMockMetrics,
    [Platform.INSTAGRAM]: flags.instagramReady,
    [Platform.YOUTUBE]: flags.youtubeReady,
  };

  return ok(
    Object.values(Platform).map((platform) => {
      const connection = byPlatform.get(platform);
      return {
        platform,
        connected: Boolean(connection?.isActive),
        integrationAvailable: availability[platform],
        username: connection?.username ?? null,
        displayName: connection?.displayName ?? null,
        avatarUrl: connection?.avatarUrl ?? null,
        followerCount: connection?.followerCount ?? 0,
        connectedAt: connection?.connectedAt ?? null,
        lastSyncedAt: connection?.lastSyncedAt ?? null,
        expiresAt: connection?.expiresAt ?? null,
        needsReconnect: Boolean(connection && !connection.isActive),
      };
    })
  );
});

/** DELETE /api/social — disconnect a platform. */
export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  const { platform } = await parseBody(
    req,
    z.object({ platform: z.nativeEnum(Platform) })
  );

  await disconnectPlatform(user.id, platform);
  return ok({ disconnected: platform });
});
