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

  // ✅ token থাকলে কিন্তু expire হলে → cookie clear + login এ পাঠাবে
  if (token && isJwtExpired(token)) {
    const res = NextResponse.redirect(`${origin}/login`);

    res.cookies.set("admin_token", "", {
      path: "/",
      expires: new Date(0),
    });

    return res;
  }

  // 🔒 /admin এর ভিতরের যেকোনো route এ token না থাকলে → login
  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // 🚫 শুধু exact /login এ গেলে এবং token থাকলে → dashboard
  // (old code এ startsWith("/login") ছিল, এতে loop হচ্ছিল)
  if (pathname === "/login" && token) {
    return NextResponse.redirect(`${origin}/admin/dashboard`);
  }

  return NextResponse.next();
}

// ✅ Middleware Scope
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
