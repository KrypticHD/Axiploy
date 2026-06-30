import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPortal = pathname.startsWith("/portal") &&
    !pathname.startsWith("/portal/login") &&
    !pathname.startsWith("/portal/reset-password") &&
    !pathname.startsWith("/portal/auth");
  const isAdmin = pathname.startsWith("/admin");

  if (!isPortal && !isAdmin) return NextResponse.next();

  const session = req.cookies.get("axiploy_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/portal/login", req.url));
  }

  try {
    const parsed = JSON.parse(session);
    if (isAdmin && parsed.role !== "axiploy_admin") {
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/portal/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
