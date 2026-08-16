import { Platform, prisma } from "@/lib/db";
import { decryptJson, encryptJson, randomToken } from "@/lib/crypto";
import { env, flags } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

const log = createLogger("socialAuth");

/**
 * Social account linking.
 *
 * Distinct from NextAuth, which authenticates brands and admins into PayLoop.
 * This flow links a creator's *content* accounts so we can read metrics; the
 * resulting tokens are encrypted at rest and never leave the server.
 */

export type StoredToken = {
  accessToken: string;
  refreshToken?: string;
  /** Epoch milliseconds. */
  expiresAt?: number;
  platformUserId: string;
  scope?: string;
};

type TokenBundle = Partial<Record<Platform, StoredToken>>;

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

async function readBundle(userId: string): Promise<TokenBundle> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { socialTokens: true },
  });
  if (!user?.socialTokens) return {};

  const raw = user.socialTokens as Record<string, string>;
  const bundle: TokenBundle = {};

  for (const [platform, ciphertext] of Object.entries(raw)) {
    if (typeof ciphertext !== "string") continue;
    const decrypted = decryptJson<StoredToken>(ciphertext);
    if (decrypted) bundle[platform as Platform] = decrypted;
  }
  return bundle;
}

async function writeToken(
  userId: string,
  platform: Platform,
  token: StoredToken
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { socialTokens: true },
  });
  const raw = ((user?.socialTokens as Record<string, string>) ?? {});

  // Each platform's token is encrypted independently, so a rotation or a
  // disconnect touches exactly one entry.
  raw[platform] = encryptJson(token);

  await prisma.user.update({
    where: { id: userId },
    data: { socialTokens: raw },
  });
}

/** Decrypted token for one platform, or null if not connected. */
export async function getSocialToken(
  userId: string,
  platform: Platform
): Promise<StoredToken | null> {
  const bundle = await readBundle(userId);
  const token = bundle[platform];
  if (!token) return null;

  if (token.expiresAt && token.expiresAt < Date.now()) {
    const refreshed = await refreshToken(userId, platform, token);
    return refreshed;
  }
  return token;
}

export async function disconnectPlatform(
  userId: string,
  platform: Platform
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { socialTokens: true },
  });
  const raw = ((user?.socialTokens as Record<string, string>) ?? {});
  delete raw[platform];

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { socialTokens: raw } }),
    prisma.socialAccount.deleteMany({ where: { userId, platform } }),
  ]);

  await recordAudit({
    action: "social.disconnected",
    entityType: "User",
    entityId: userId,
    actorId: userId,
    metadata: { platform },
  });
}

// ---------------------------------------------------------------------------
// OAuth state (CSRF protection)
// ---------------------------------------------------------------------------

const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * The `state` parameter must be unguessable and single-use. It is stored as a
 * short-lived VerificationToken row so the callback can prove the redirect it
 * received is the one this server initiated.
 */
export async function createOAuthState(
  userId: string,
  platform: Platform
): Promise<string> {
  const state = randomToken(24);
  await prisma.verificationToken.create({
    data: {
      identifier: `oauth:${platform}:${userId}`,
      token: state,
      expires: new Date(Date.now() + STATE_TTL_MS),
    },
  });
  return state;
}

export async function consumeOAuthState(
  state: string
): Promise<{ userId: string; platform: Platform } | null> {
  const row = await prisma.verificationToken.findUnique({ where: { token: state } });
  if (!row) return null;

  // Single-use: delete before validating expiry so a replay always fails.
  await prisma.verificationToken.delete({ where: { token: state } }).catch(() => {});

  if (row.expires < new Date()) return null;

  const [, platform, userId] = row.identifier.split(":");
  if (!platform || !userId) return null;

  return { userId, platform: platform as Platform };
}

// ---------------------------------------------------------------------------
// TikTok — fully implemented (Login Kit v2)
// ---------------------------------------------------------------------------

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_URL = "https://open.tiktokapis.com/v2/user/info/";

const TIKTOK_SCOPES = ["user.info.basic", "user.info.stats", "video.list"];

export function buildTikTokAuthUrl(state: string): string {
  if (!flags.tiktokReady) {
    throw new Error("TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not configured");
  }
  const params = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY!,
    scope: TIKTOK_SCOPES.join(","),
    response_type: "code",
    redirect_uri: env.TIKTOK_REDIRECT_URI,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

type TikTokTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export async function exchangeTikTokCode(code: string): Promise<StoredToken> {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY!,
      client_secret: env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.TIKTOK_REDIRECT_URI,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await res.json()) as TikTokTokenResponse;

  if (!res.ok || body.error || !body.access_token || !body.open_id) {
    throw new Error(
      `TikTok token exchange failed: ${body.error_description ?? body.error ?? res.status}`
    );
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_in ? Date.now() + body.expires_in * 1000 : undefined,
    platformUserId: body.open_id,
    scope: body.scope,
  };
}

type TikTokUserResponse = {
  data?: {
    user?: {
      open_id?: string;
      display_name?: string;
      avatar_url?: string;
      follower_count?: number;
      username?: string;
    };
  };
};

export async function fetchTikTokProfile(accessToken: string) {
  const fields = [
    "open_id",
    "display_name",
    "avatar_url",
    "follower_count",
    "username",
  ].join(",");

  const res = await fetch(`${TIKTOK_USER_URL}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`TikTok profile fetch failed: ${res.status}`);

  const body = (await res.json()) as TikTokUserResponse;
  const user = body.data?.user;
  if (!user?.open_id) throw new Error("TikTok profile response was empty");

  return {
    platformUserId: user.open_id,
    username: user.username ?? user.display_name ?? user.open_id,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    followerCount: user.follower_count ?? 0,
  };
}

async function refreshTikTokToken(token: StoredToken): Promise<StoredToken | null> {
  if (!token.refreshToken || !flags.tiktokReady) return null;

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY!,
      client_secret: env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await res.json()) as TikTokTokenResponse;
  if (!res.ok || !body.access_token) return null;

  return {
    ...token,
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? token.refreshToken,
    expiresAt: body.expires_in ? Date.now() + body.expires_in * 1000 : undefined,
  };
}

// ---------------------------------------------------------------------------
// Instagram / YouTube — phase 2 stubs behind the same shape
// ---------------------------------------------------------------------------

export function buildInstagramAuthUrl(state: string): string {
  if (!flags.instagramReady) {
    throw new Error("Instagram integration is not configured (phase 2)");
  }
  const params = new URLSearchParams({
    client_id: env.INSTAGRAM_APP_ID!,
    redirect_uri: env.INSTAGRAM_REDIRECT_URI,
    scope: "instagram_basic,instagram_manage_insights,pages_show_list",
    response_type: "code",
    state,
  });
  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

export function buildYouTubeAuthUrl(state: string): string {
  if (!flags.youtubeReady) {
    throw new Error("YouTube integration is not configured (phase 2)");
  }
  const params = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID!,
    redirect_uri: env.YOUTUBE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope:
      "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildAuthUrl(platform: Platform, state: string): string {
  switch (platform) {
    case Platform.TIKTOK:
      return buildTikTokAuthUrl(state);
    case Platform.INSTAGRAM:
      return buildInstagramAuthUrl(state);
    case Platform.YOUTUBE:
      return buildYouTubeAuthUrl(state);
  }
}

async function refreshToken(
  userId: string,
  platform: Platform,
  token: StoredToken
): Promise<StoredToken | null> {
  let refreshed: StoredToken | null = null;

  if (platform === Platform.TIKTOK) {
    refreshed = await refreshTikTokToken(token);
  }

  if (!refreshed) {
    log.warn("token expired and could not be refreshed", { userId, platform });
    await prisma.socialAccount.updateMany({
      where: { userId, platform },
      data: { isActive: false },
    });
    return null;
  }

  await writeToken(userId, platform, refreshed);
  await prisma.socialAccount.updateMany({
    where: { userId, platform },
    data: {
      isActive: true,
      expiresAt: refreshed.expiresAt ? new Date(refreshed.expiresAt) : null,
    },
  });
  return refreshed;
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------

/** Persist a completed OAuth handshake: encrypted token + visible profile row. */
export async function completeConnection(
  userId: string,
  platform: Platform,
  token: StoredToken,
  profile: {
    platformUserId: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    followerCount?: number;
  }
) {
  await writeToken(userId, platform, token);

  const account = await prisma.socialAccount.upsert({
    where: { userId_platform: { userId, platform } },
    create: {
      userId,
      platform,
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      followerCount: profile.followerCount ?? 0,
      scopes: token.scope?.split(",").filter(Boolean) ?? [],
      expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
      isActive: true,
    },
    update: {
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      followerCount: profile.followerCount ?? 0,
      scopes: token.scope?.split(",").filter(Boolean) ?? [],
      expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
      isActive: true,
      connectedAt: new Date(),
    },
  });

  await recordAudit({
    action: "social.connected",
    entityType: "User",
    entityId: userId,
    actorId: userId,
    metadata: { platform, username: profile.username },
  });

  return account;
}

export async function listConnections(userId: string) {
  return prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { connectedAt: "desc" },
  });
}
