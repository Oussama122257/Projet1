import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Role-based route guarding:
 *  /dashboard/seller/** → SELLER (or ADMIN)
 *  /dashboard/admin/**  → ADMIN
 *  /dashboard/agent/**  → AGENT (or ADMIN)
 * Everything else (storefront, fast checkout) is public — guests can buy.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const login = new URL("/login", req.nextUrl);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    if (pathname.startsWith("/dashboard/seller") && role !== "SELLER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    if (pathname.startsWith("/dashboard/agent") && role !== "AGENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
