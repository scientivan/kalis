// Kalis backend HTTP API (Node 20+, no framework). See ../API.md for the contract.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { config, METHODS_DIR, DATA_DIR, ROOT } from "./config.js";
import { view, balance, callMarket, serverAccountId } from "./near.js";
import { callRunner, checkAttestation } from "./outlayer.js";
import { sha256Hex, fromB64, verifyCompletion, methodKind, PROMPT_SELLER_WARNING } from "./kalis-crypto.js";
import { registerPrivateRoutes } from "./private-api.js";
import { registerProtectionRoutes } from "./protections/routes.js";
import { registerRunRoutes } from "./runs-api.js";
import { registerArtifactRoutes } from "./artifacts-api.js";
import { registerReviewRoutes } from "./reviews-api.js";
import { registerActivityRoutes } from "./activity-api.js";
import { registerManifestRoutes } from "./manifest-validate.js";
import { registerCommunityRoutes } from "./community-api.js";
import { registerAuthRoutes } from "./auth.js";
import { registerSellerRoutes, PROMPT_WARNING_VERSION, coverUrl } from "./sellers-api.js";
import { registerEvidenceRoutes } from "./evidence-api.js";
import { ApiError, toNear, getMethod, versionView, manifestByHash, sealedMethodByHash } from "./market.js";
import { AuthError } from "./principal.js";
import { capabilities } from "./capabilities.js";

// ---------- handlers ----------
const routes = [];
const route = (method, pattern, fn) => routes.push({ method, pattern, fn });

route("GET", /^\/api\/capabilities$/, async () => capabilities());

route("GET", /^\/api\/health$/, async () => ({ ok: true, network: config.network, time: new Date().toISOString() }));

route("GET", /^\/api\/config$/, async () => {
  const c = await view(config.market, "get_config");
  return {
    network: config.network, rpc: config.rpc, explorer: config.explorer, market: config.market,
    dao: c.dao, platform: c.platform, platform_share_pct: c.platform_share_pct, min_dao_share_pct: c.min_dao_share_pct,
    refund_timeout_minutes: Number(c.timeout_ns) / 60e9,
    runner: {
      project: config.runner.project, tee_pubkey: config.runner.teePubkey, completion_pubkey: c.runner_pubkey,
      build_hash: config.runner.buildHash, key_version: config.runner.keyVersion,
      attestation_note: "Intel/NVIDIA chains not verified (not_verified)",
      preflight_note: "Seal data only to tee_pubkey. A run's attestation must name build_hash (or the runner_hash of the version you pay for); compare before trusting a result.",
    },
    demo_topup: { enabled: Boolean(config.secrets.demoBuyer?.key), buyer_account: serverAccountId("demoBuyer"), label: "Mock fiat top-up. A platform-held testnet account pays on your behalf. No real money moves." },
    crypto_module: "/kalis-crypto.js",
    method_kinds: {
      wasm: "Program (WASM). Seller code runs in the sandbox; it may ask the AI models its manifest lists.",
      prompt: "Prompt for an AI model. The runner sends the sealed prompt and the buyer data to one private attested model.",
      seller_prompt_warning: PROMPT_SELLER_WARNING,
      seller_prompt_warning_version: PROMPT_WARNING_VERSION,
    },
  };
});

// Methods registered only to test the publication flow. Still readable by id, hidden from the market list.
const HIDDEN_METHODS = new Set(["demo-publish-test"]);
route("GET", /^\/api\/methods$/, async (q) => {
  const list = await view(config.market, "list_methods", { from_index: 0, limit: 100 });
  const rows = await Promise.all(list.map(async (m) => {
    const latest = m.version_count ? await view(config.market, "get_version", { method_id: m.method_id }) : null;
    return { ...m, listed: !HIDDEN_METHODS.has(m.method_id), cover_url: coverUrl(m.method_id), latest: latest ? await versionView(m.method_id, latest) : null };
  }));
  return q.get("all") === "1" ? rows : rows.filter((m) => m.listed);
});

route("GET", /^\/api\/methods\/([^/]+)$/, async (_q, [id]) => getMethod(id));

route("GET", /^\/api\/methods\/([^/]+)\/versions\/(\d+)\/manifest$/, async (_q, [id, n]) => {
  const v = await view(config.market, "get_version", { method_id: id, number: Number(n) });
  if (!v) throw new ApiError(404, "unknown_version", "No such version");
  const text = manifestByHash(id, v.manifest_hash);
  if (!text) throw new ApiError(404, "manifest_missing", "The manifest file for this version is not on this server");
  return { raw: text, manifest_hash: v.manifest_hash };
});

route("GET", /^\/api\/methods\/([^/]+)\/versions\/(\d+)\/sealed-method$/, async (_q, [id, n]) => {
  const v = await view(config.market, "get_version", { method_id: id, number: Number(n) });
  if (!v) throw new ApiError(404, "unknown_version", "No such version");
  const s = sealedMethodByHash(id, v.code_hash);
  if (!s) throw new ApiError(404, "sealed_method_missing", "The seller has not published a sealed build of this version");
  return s;
});

registerPrivateRoutes(route);
registerRunRoutes(route);
registerArtifactRoutes(route);
registerReviewRoutes(route);
registerActivityRoutes(route);
registerManifestRoutes(route);
registerCommunityRoutes(route);
registerAuthRoutes(route);
registerSellerRoutes(route);
registerEvidenceRoutes(route);

route("GET", /^\/api\/dao$/, async () => {
  const dao = (await view(config.market, "get_config")).dao;
  const [policy, bounties, lastId, amount] = await Promise.all([
    view(dao, "get_policy"), view(dao, "get_bounties", { from_index: 0, limit: 50 }), view(dao, "get_last_proposal_id"), balance(dao),
  ]);
  const proposals = lastId ? await view(dao, "get_proposals", { from_index: Math.max(0, lastId - 20), limit: 20 }) : [];
  const available = await view(dao, "get_available_amount");
  return {
    dao, balance_near: toNear(amount), available_near: toNear(available),
    council: policy.roles.find((r) => r.name === "council")?.kind?.Group || [],
    bounties: bounties.map((b) => ({ ...b, amount_near: toNear(b.amount) })),
    proposals: proposals.map((p) => ({ id: p.id, proposer: p.proposer, description: p.description, kind: Object.keys(p.kind)[0], status: p.status, kind_detail: p.kind })),
  };
});

registerProtectionRoutes(route);

// ---------- server ----------
const CRYPTO_FILE = path.join(ROOT, "src", "kalis-crypto.js");

function send(res, status, obj, type = "application/json") {
  res.writeHead(status, {
    "Content-Type": type, "Access-Control-Allow-Origin": config.corsOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Kalis-Workspace, Authorization, Idempotency-Key",
  });
  res.end(type === "application/json" ? JSON.stringify(obj) : obj);
}

async function readBody(req) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > 2_000_000) throw new ApiError(413, "too_large", "Body over 2 MB"); chunks.push(c); }
  if (!chunks.length) return null;
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new ApiError(400, "bad_json", "Body is not valid JSON"); }
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") return send(res, 204, "", "text/plain");
  if (req.method === "GET" && url.pathname === "/kalis-crypto.js") return send(res, 200, fs.readFileSync(CRYPTO_FILE, "utf8"), "text/javascript");
  // kalis-crypto.js re-exports runChecks from ./checks.js, so browsers resolve it next to the module.
  if (req.method === "GET" && url.pathname === "/checks.js") return send(res, 200, fs.readFileSync(path.join(ROOT, "src", "checks.js"), "utf8"), "text/javascript");
  // On-device .xlsx/.docx reader (RANCANGAN 65.3 option C): the file is parsed in the browser and never uploaded.
  if (req.method === "GET" && url.pathname === "/file-import.js") return send(res, 200, fs.readFileSync(path.join(ROOT, "src", "file-import.js"), "utf8"), "text/javascript");
  if (url.pathname.startsWith("/api/protections/")) return send(res, 410, { error: { code: "plaintext_protections_retired", message: "This plaintext protection API is retired. Use the sealed private relay. Legacy records are preserved and are not migrated automatically." } });
  const r = routes.find((x) => x.method === req.method && x.pattern.test(url.pathname));
  if (!r) return send(res, 404, { error: { code: "not_found", message: `${req.method} ${url.pathname} is not an API route` } });
  try {
    const body = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) ? await readBody(req) : null;
    const out = await r.fn(url.searchParams, url.pathname.match(r.pattern).slice(1).map(decodeURIComponent), body, req);
    if (out && out.__html) return send(res, 200, out.__html, "text/html; charset=utf-8");
    if (out && out.__file) { res.writeHead(200, { "Content-Type": out.__type, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": config.corsOrigin }); return res.end(fs.readFileSync(out.__file)); }
    send(res, 200, out);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(new Date().toISOString(), req.method, url.pathname, e.message);
    send(res, status, { error: { code: e.code || "internal", message: e.message, ...(e.details ? { details: e.details } : {}) } });
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(ROOT, "src", "server.js")) {
  server.listen(config.port, () => console.log(`Kalis backend on http://localhost:${config.port} (market ${config.market})`));
}
