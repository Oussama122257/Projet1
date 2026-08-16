import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { Platform } from "@/lib/db";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import {
  completeConnection,
  consumeOAuthState,
  exchangeTikTokCode,
  fetchTikTokProfile,
} from "@/services/socialAuth";

const log = createLogger("social:tiktok:callback");

function back(params: Record<string, string>) {
  const url = new URL("/influencer/connections", env.NEXTAUTH_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

/**
 * GET /api/social/tiktok/callback
 *
 * Completes the TikTok handshake. Every failure path lands the user back on the
 * connections page with a readable message rather than a JSON error body — this
 * URL is hit by a browser redirect, not by our own client code.
 */
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return back({
      error:
        url.searchParams.get("error_description") ??
        "TikTok authorization was declined",
    });
  }
  if (!code || !state) {
    return back({ error: "TikTok returned an incomplete response" });
  }

  const verified = await consumeOAuthState(state);
  if (!verified || verified.platform !== Platform.TIKTOK) {
    // Either a replay, an expired handshake, or a forged callback.
    return back({ error: "This connection link has expired — please try again" });
  }

  try {
    const token = await exchangeTikTokCode(code);
    const profile = await fetchTikTokProfile(token.accessToken);

    await completeConnection(verified.userId, Platform.TIKTOK, token, profile);

    return back({ connected: "tiktok" });
  } catch (err) {
    log.error("tiktok connection failed", {
      userId: verified.userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return back({ error: "Could not complete the TikTok connection" });
  }
});
