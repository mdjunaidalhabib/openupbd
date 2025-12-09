import { NextResponse } from "next/server";

function isJwtExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8")
    );

    if (!payload?.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

export function middleware(req) {
  const token = req.cookies.get("admin_token")?.value || "";
  const { pathname, origin } = req.nextUrl;

  // =============================
  // LOGIN PAGE LOGIC
  // =============================
  if (pathname === "/login") {
    if (token && !isJwtExpired(token)) {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }
    return NextResponse.next();
  }

  // =============================
  // PROTECT ADMIN ROUTES
  // =============================
  if (pathname.startsWith("/admin")) {
    // token missing
    if (!token) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // token expired
    if (isJwtExpired(token)) {
      const res = NextResponse.redirect(`${origin}/login`);
      res.cookies.set("admin_token", "", { path: "/", expires: new Date(0) });
      return res;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
