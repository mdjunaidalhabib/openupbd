import { NextResponse } from "next/server";

// JWT expiration check
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
  } catch (err) {
    console.error("JWT parse error:", err);
    return true;
  }
}

export function proxy(req) {
  const token = req.cookies.get("admin_token")?.value || "";
  const { pathname, origin } = req.nextUrl;

  // =============================
  // LOGIN PAGE LOGIC
  // =============================
  if (pathname === "/login") {
    // If logged in, redirect to dashboard
    if (token && !isJwtExpired(token)) {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }
    return NextResponse.next();
  }

  // =============================
  // PROTECT ADMIN ROUTES
  // =============================
  if (pathname.startsWith("/admin")) {
    // Token missing
    if (!token) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // Token expired
    if (isJwtExpired(token)) {
      const res = NextResponse.redirect(`${origin}/login`);
      // Clear expired token
      res.cookies.set("admin_token", "", { path: "/", expires: new Date(0) });
      return res;
    }

    return NextResponse.next();
  }

  // =============================
  // ALLOW OTHER ROUTES
  // =============================
  return NextResponse.next();
}

// =============================
// CONFIGURE ROUTES TO APPLY MIDDLEWARE
// =============================
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
