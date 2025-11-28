import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("admin_token")?.value || "";
  const { pathname, origin } = req.nextUrl;

  const isProd = process.env.NODE_ENV === "production";

  // 🌀 Development Debug Log
  if (!isProd) {
    console.log("🌀 [Middleware Triggered]:", pathname);
    console.log("🔑 Token Found:", token ? "✅ Yes" : "❌ No");
  }

  // 🔒 Protected routes
  if (pathname.startsWith("/admin") && !token) {
    const redirectUrl = `${origin}/login`;
    if (!isProd) console.log("🔁 Redirecting to:", redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // 🚫 Prevent logged-in admins from seeing login again
  if (pathname.startsWith("/login") && token) {
    const redirectUrl = `${origin}/admin/dashboard`;
    if (!isProd)
      console.log("🚀 Already logged in → Redirecting to:", redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // ✅ Allow normal access
  return NextResponse.next();
}

// ✅ Middleware Scope
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
