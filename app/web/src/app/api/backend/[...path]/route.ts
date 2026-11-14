import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const SAFE_GET =
  /^api\/(health|config|capabilities|dao|me|me\/(?:methods|transactions|earnings|balance)|activity|bounties|issues|community\/config|creators\/[\w.-]+|methods(?:\/[\w-]+(?:\/(?:rating-summary|reviews|cover|versions\/\d+\/(?:manifest|sealed-method|evidence)))?)?|runs\/[\w-]+|protections\/(?:credentials|outbound|memory(?:\/recall)?|documents(?:\/[\w-]+)?|audit))$/;
const SAFE_POST =
  /^api\/(auth\/(?:challenge|verify|logout)|method-drafts|methods\/[\w-]+\/(?:cover|reviews)|runs(?:\/[\w-]+\/(?:execute|settle))?|protections\/(?:credentials(?:\/[\w-]+\/(?:revoke|use))?|private-values|outbound(?:\/[\w-]+\/(?:approve|reject|execute))?|memory(?:\/[\w-]+\/(?:approve|reject|delete|edit))?|documents|browser))$/;
async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const path = (await ctx.params).path.join("/");
  if (
    !(req.method === "GET" && path === "mock/broker/demo-token") &&
    !(req.method === "GET" ? SAFE_GET : SAFE_POST).test(path)
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
  if (req.method === "POST" && req.headers.get("origin") !== req.nextUrl.origin)
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
      body: req.method === "POST" ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(path.endsWith("/execute") ? 240000 : 60000),
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
        "Content-Type": "application/json",
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
