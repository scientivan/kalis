import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST } from "../src/app/api/backend/[...path]/route";
test("proxy rejects unrelated endpoints before contacting backend", async () => {
  const response = await GET(
    new NextRequest("http://localhost/api/backend/.env"),
    { params: Promise.resolve({ path: [".env"] }) },
  );
  assert.equal(response.status, 404);
});
test("cross-origin mutation is rejected without a backend call", async () => {
  const response = await POST(
    new NextRequest("http://localhost/api/backend/api/runs", {
      method: "POST",
      headers: { origin: "https://other.invalid" },
      body: "{}",
    }),
    { params: Promise.resolve({ path: ["api", "runs"] }) },
  );
  assert.equal(response.status, 403);
});
test("same-origin sealed execution forwards no browser cookies or private session key", async () => {
  const original = globalThis.fetch;
  let seen = "";
  globalThis.fetch = async (url, options) => {
    seen = String(url);
    assert.equal(
      (options?.headers as Record<string, string>).Cookie,
      undefined,
    );
    assert.equal(String(options?.body).includes("sessionSecret"), false);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  try {
    const r = await POST(
      new NextRequest("http://localhost/api/backend/api/runs/demo/execute", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "X-Kalis-Workspace": "demo-1",
          cookie: "private-cookie",
        },
        body: JSON.stringify({
          data: { epk: "public", nonce: "random", ct: "encrypted" },
        }),
      }),
      { params: Promise.resolve({ path: ["api", "runs", "demo", "execute"] }) },
    );
    assert.equal(r.status, 200);
    assert.match(seen, /api\/runs\/demo\/execute$/);
  } finally {
    globalThis.fetch = original;
  }
});
