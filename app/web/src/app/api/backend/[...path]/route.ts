import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const SAFE_GET = /^api\/(health|config|capabilities|privacy\/config|dao|me(?:\/(?:methods|transactions|earnings|balance|preferences))?|activity|community\/config|creators\/[\w.-]+|methods(?:\/[\w-]+(?:\/(?:rating-summary|reviews|cover|versions\/\d+\/(?:manifest|sealed-method|evidence|contribution-package)))?)?|run-drafts\/[\w-]+|runs(?:\/[\w-]+(?:\/(?:events|evidence|execution|review-eligibility))?)?|operations\/[\w-]+|method-drafts\/[\w-]+|(?:issues|proposals|bounties|contributions|test-runs|private-test-cases|test-grants|artifacts)(?:\/[\w-]+(?:\/ciphertext)?)?|protections\/(?:credentials|outbound|memory(?:\/recall)?|documents(?:\/[\w-]+)?|audit))$/;
const SAFE_POST = /^api\/(privacy\/execute|public-documents|auth\/(?:challenge|verify|logout)|run-drafts(?:\/[\w-]+\/(?:consents|quote))?|method-drafts(?:\/[\w-]+\/(?:artifact|validate|publish|confirm))?|methods\/[\w-]+\/(?:cover|reviews)|runs(?:\/[\w-]+\/(?:execute|settle|reclaim))?|issues(?:\/[\w-]+\/close)?|proposals(?:\/[\w-]+\/vote)?|bounties\/[\w-]+\/(?:claim|contributions|payout)|contributions\/[\w-]+\/(?:tests|reviews|publish-version)|private-test-cases(?:\/[\w-]+\/grants)?|test-grants\/[\w-]+\/revoke|artifacts|protections\/(?:credentials(?:\/[\w-]+\/(?:revoke|use))?|private-values|outbound(?:\/[\w-]+\/(?:approve|reject|execute))?|memory(?:\/[\w-]+\/(?:approve|reject|delete|edit))?|documents|browser))$/;
const SAFE_PATCH = /^api\/(me(?:\/preferences)?|method-drafts\/[\w-]+|run-drafts\/[\w-]+)$/;
const SAFE_DELETE = /^api\/artifacts\/[\w-]+$/;
async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const path = (await ctx.params).path.join("/");
  if (path.startsWith("api/protections/")) return NextResponse.json({ error: { code: "plaintext_protections_retired", message: "Use the sealed private relay. No plaintext fallback is available." } }, { status: 410 });
  if (
    !(req.method === "GET" && /^(?:mock\/(?:broker\/demo-token|demo-token|catalog)|file-import\.js)$/.test(path)) &&
    !({ GET: SAFE_GET, POST: SAFE_POST, PATCH: SAFE_PATCH, DELETE: SAFE_DELETE }[req.method] || /$a/).test(path)
  )
    return NextResponse.json(
      {
        error: {
          code: "route_not_allowed",
          message: "This backend route is not exposed.",
        },
      },
      { status: 404 },
    );
  // nextUrl.origin reports "localhost" in dev even when the page is served from 127.0.0.1, so also accept the Host header origin.
  const origin = req.headers.get("origin");
  const hostOrigin = `${req.nextUrl.protocol}//${req.headers.get("host") || ""}`;
  if (req.method !== "GET" && origin !== req.nextUrl.origin && origin !== hostOrigin)
    return NextResponse.json(
      {
        error: {
          code: "origin_required",
          message: "Use this application to submit an operation.",
        },
      },
      { status: 403 },
    );
  const base = process.env.KALIS_BACKEND_URL || "http://127.0.0.1:8787";
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const workspace = req.headers.get("X-Kalis-Workspace");
    if (workspace && /^[A-Za-z0-9_-]{1,48}$/.test(workspace))
      headers["X-Kalis-Workspace"] = workspace;
    const auth = req.headers.get("authorization");
    if (auth && /^Bearer [0-9a-f]{64}$/.test(auth)) headers["Authorization"] = auth;
    const response = await fetch(base + "/" + path + req.nextUrl.search, {
      method: req.method,
      headers,
      body: ["POST", "PATCH", "DELETE"].includes(req.method) ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(/\/(execute|tests)$/.test(path) ? 240000 : 60000),
    });
    const type = response.headers.get("content-type") || "";
    if (/^image\/(png|jpeg|webp)$/.test(type))
      return new NextResponse(await response.arrayBuffer(), {
        status: response.status,
        headers: { "Content-Type": type, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=300" },
      });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": path === "file-import.js" ? "text/javascript; charset=utf-8" : "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "backend_unavailable",
          message:
            "The backend could not be reached or the request timed out. A submitted payment may still be pending. Inspect its status before trying another payment.",
        },
      },
      { status: 502 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;

export const PATCH = proxy;
export const DELETE = proxy;
