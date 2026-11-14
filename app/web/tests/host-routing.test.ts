import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

function request(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}
for (const host of ["kalis.scientivan.dev", "www.kalis.scientivan.dev"]) {
  test(`${host} serves landing at root and preserves query`, () => {
    const response = proxy(request(host, "/?ref=demo"));
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-middleware-rewrite"), `https://${host}/landing?ref=demo`);
  });
}
for (const path of ["/landing", "/landing/landscape.webp", "/_next/static/chunk.js", "/icon.svg"]) {
  test(`landing asset ${path} stays on public host`, () => {
    assert.equal(proxy(request("kalis.scientivan.dev", path)).headers.get("x-middleware-next"), "1");
  });
}
test("application links on public host redirect to app", () => {
  const response = proxy(request("kalis.scientivan.dev", "/marketplace?sort=recent"));
  assert.equal(response.headers.get("location"), "https://app.kalis.scientivan.dev/marketplace?sort=recent");
});
test("application root remains unchanged", () => {
  assert.equal(proxy(request("app.kalis.scientivan.dev", "/")).headers.get("x-middleware-next"), "1");
});
