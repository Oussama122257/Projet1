import { NextResponse } from "next/server";
import { fail, handler } from "@/lib/api";
import { Platform } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { buildAuthUrl, createOAuthState } from "@/services/socialAuth";

type Params = { params: { platform: string } };

/**
 * GET /api/social/:platform/connect
 *
 * Kicks off the OAuth handshake. Redirects rather than returning a URL so the
 * `state` cookie/row and the browser navigation are created in one hop.
 */
export const GET = handler(async (_req: Request, { params }: Params) => {
  const user = await requireUser();

  const platform = params.platform.toUpperCase() as Platform;
  if (!Object.values(Platform).includes(platform)) {
    return fail(`Unknown platform "${params.platform}"`, 404);
  }

  const state = await createOAuthState(user.id, platform);

  try {
    return NextResponse.redirect(buildAuthUrl(platform, state));
  } catch (err) {
    // Missing credentials for a phase-2 platform is a configuration state, not
    // a crash — send the user back with an explainable error.
    const message = err instanceof Error ? err.message : "Integration unavailable";
    const url = new URL("/influencer/connections", process.env.NEXTAUTH_URL);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
});
