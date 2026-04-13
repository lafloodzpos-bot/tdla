import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/pin") || path.startsWith("/_next") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }
  try {
    const baseUrl = request.nextUrl.origin;
    const statusRes = await fetch(baseUrl + "/api/pin", { headers: { cookie: request.headers.get("cookie") || "" } });
    const status = await statusRes.json();
    if (!status.enabled) return NextResponse.redirect(new URL("/pin", request.url));
    if (status.public) return NextResponse.next();
    if (!status.authed) return NextResponse.redirect(new URL("/pin", request.url));
  } catch {}
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|admin|pin|_next|favicon).*)"],
};
