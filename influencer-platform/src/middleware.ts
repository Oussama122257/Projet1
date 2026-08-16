import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Route protection by role.
 *
 * The role travels in the JWT, so this runs at the edge with no database round
 * trip. Anyone landing in the wrong section is redirected to their own home
 * rather than shown a 403 — a brand visiting /admin has simply gone the wrong
 * way, not done something wrong.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const home =
      role === "BRAND" ? "/brand" : role === "ADMIN" ? "/admin" : "/influencer";

    // /dashboard is a role-resolving redirect target used after sign-in.
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL(home, req.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(home, req.url));
    }
    if (pathname.startsWith("/brand") && role !== "BRAND" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(home, req.url));
    }
    if (
      pathname.startsWith("/influencer") &&
      role !== "INFLUENCER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard", "/brand/:path*", "/influencer/:path*", "/admin/:path*"],
};
