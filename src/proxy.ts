import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(SESSION_COOKIE)?.value;

  // Allow login page always
  if (pathname === "/portal/login") return NextResponse.next();

  // Protect /portal/* routes
  if (pathname.startsWith("/portal")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
    // Role check: only axiploy_admin
    try {
      const user = JSON.parse(session);
      if (user.role !== "axiploy_admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/portal/dashboard";
        return NextResponse.redirect(url);
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
