import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/health", "/api/integrations/apify/webhook"];

/**
 * Session guard (edge runtime): verifies the JWT cookie for all app pages and
 * API routes except the public ones. Kept dependency-light — full env
 * validation happens in the node runtime, not here.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("cl_session")?.value;
  const secret = process.env.AUTH_SECRET;
  let valid = false;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "unauthenticated", message: "Sign in required" } },
        { status: 401 },
      );
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"],
};
