import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "../src/app/api/backend/[...path]/route";
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

for (const [method, handler, path] of [
  ["PATCH", PATCH, ["api", "me", "preferences"]],
  ["DELETE", DELETE, ["api", "artifacts", "artifact-1"]],
] as const) {
  test(`${method} mutations reject foreign origins`, async () => {
    const r = await handler(new NextRequest(`http://localhost/api/backend/${path.join("/")}`, { method, headers: {origin:"https://foreign.invalid"}, body:"{}" }), {params:Promise.resolve({path:[...path]})});
    assert.equal(r.status,403);
  });
  test(`${method} forwards only the allowed session and body`, async () => {
    const original=globalThis.fetch;
    globalThis.fetch=async (_url, options)=>{
      assert.equal(options?.method,method);
      const headers=options?.headers as Record<string,string>;
      assert.equal(headers.Authorization,`Bearer ${"a".repeat(64)}`);
      assert.equal(headers.cookie,undefined);
      assert.equal(options?.body,"{}");
      return new Response("{}",{status:200});
    };
    try{
      const r=await handler(new NextRequest(`http://localhost/api/backend/${path.join("/")}`,{method,headers:{origin:"http://localhost",authorization:`Bearer ${"a".repeat(64)}`,cookie:"private"},body:"{}"}),{params:Promise.resolve({path:[...path]})});
      assert.equal(r.status,200);
    } finally {globalThis.fetch=original;}
  });
}
test("proxy refuses unknown nested operations",async()=>{
  const r=await POST(new NextRequest("http://localhost/api/backend/api/bounties/b1/withdraw",{method:"POST",headers:{origin:"http://localhost"},body:"{}"}),{params:Promise.resolve({path:["api","bounties","b1","withdraw"]})});
  assert.equal(r.status,404);
});
