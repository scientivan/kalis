// Host routing for the single Vercel project serving kalis.scientivan.dev and app.kalis.scientivan.dev.
// TEMPORARY: the landing page does not exist yet, so the landing host redirects to the app.
// Replace this redirect with the landing route once Dien approves a landing design.
import { NextResponse, type NextRequest } from "next/server";

const LANDING_HOST = "kalis.scientivan.dev";
const APP_ORIGIN = "https://app.kalis.scientivan.dev";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === LANDING_HOST || host === `www.${LANDING_HOST}`) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, APP_ORIGIN), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
