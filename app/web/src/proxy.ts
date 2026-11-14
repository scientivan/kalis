// Host routing for the single Vercel project serving kalis.scientivan.dev and app.kalis.scientivan.dev.
// Serve the landing at the public root while keeping application routes on the app host.
import { NextResponse, type NextRequest } from "next/server";

const LANDING_HOST = "kalis.scientivan.dev";
const APP_ORIGIN = "https://app.kalis.scientivan.dev";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === LANDING_HOST || host === `www.${LANDING_HOST}`) {
    const pathname = request.nextUrl.pathname;
    if (pathname === "/") {
      const destination = request.nextUrl.clone();
      destination.pathname = "/landing";
      return NextResponse.rewrite(destination);
    }
    if (pathname === "/landing" || pathname.startsWith("/landing/") ||
        pathname.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, APP_ORIGIN), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
