// Seller publication end to end on testnet, plus version and run evidence.
// Usage: node scripts/sellers-test.mjs [base url] [account] [executed run id for evidence]
// Signs in with the account's full access key from ~/.near-credentials/testnet/<account>.json (never
// printed), publishes a tiny fictional prompt method "demo-publish-test", and signs the returned
// contract calls itself (testnet; spends about 0.2 NEAR, most of it refunded as excess deposit).
import fs from "node:fs";
import os from "node:os";
import { KeyPair, connect, keyStores } from "near-api-js";
import { nep413Hash } from "../src/auth.js";
import { sealMethod, sha256Hex } from "../src/kalis-crypto.js";

const BASE = process.argv[2] || "http://localhost:8787";
const ACCOUNT = process.argv[3] || "auth-test.scientivan.testnet";
const RUN = process.argv[4] || null;
const METHOD = "demo-publish-test";
const cred = JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${ACCOUNT}.json`, "utf8"));
const key = KeyPair.fromString(cred.private_key);
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
async function api(method, p, body, headers = {}) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;

// sign in
const ch = (await api("POST", "/api/auth/challenge", { account_id: ACCOUNT })).body;
const sig = Buffer.from(key.sign(nep413Hash({ message: ch.message, nonce: Buffer.from(ch.nonce, "base64"), recipient: ch.recipient })).signature).toString("base64");
const login = (await api("POST", "/api/auth/verify", { challenge_id: ch.challenge_id, account_id: ACCOUNT, public_key: key.getPublicKey().toString(), signature: sig })).body;
const A = { Authorization: `Bearer ${login.session_token}` };
const DEMO = { "X-Kalis-Workspace": `sellers-${Date.now().toString(36)}` };
const cfg = (await api("GET", "/api/config")).body;

// ownership and auth
check("a demo workspace cannot create a method draft", code(await api("POST", "/api/method-drafts", { method_id: METHOD, kind: "prompt", title: "x" }, DEMO)) === "login_required");
check("a seller cannot draft a new version of someone else's method", code(await api("POST", "/api/method-drafts", { method_id: "tender-bid", kind: "wasm", title: "Take over" }, A)) === "not_owner");

// draft
const d0 = await api("POST", "/api/method-drafts", { method_id: METHOD, kind: "prompt", title: "Demo publish test (ignore)", description: "Automated publication test. Fictional.", category: "Test" }, A);
check("seller creates a draft", d0.status === 200 && d0.body.revision === 1, d0.body.error?.message);
const id = d0.body.id;
check("a demo workspace cannot read or edit the draft", code(await api("PATCH", `/api/method-drafts/${id}`, { expected_revision: 1, title: "hijack" }, DEMO)) === "login_required");
check("an incomplete draft cannot be published", code(await api("POST", `/api/method-drafts/${id}/publish`, { expected_revision: 1 }, A)) === "draft_invalid");

// manifest from the salary template
const tpl = JSON.parse(fs.readFileSync(new URL("../../methods/salary-counteroffer/manifest-v5.json", import.meta.url)));
const manifest = { ...tpl, method_id: METHOD, listing: { ...tpl.listing, title: "Demo publish test (ignore)", seller: { display_name: "Auth Test (demo seller)", role: "Test account", demo: true }, limits: ["Automated test listing", "Fictional"] }, dao_share_percent: 9 };
let r = await api("PATCH", `/api/method-drafts/${id}`, { expected_revision: 1, manifest, price_yocto: "10000000000000000000000", dao_share_pct: 9 }, A);
check("stale revision is refused", code(await api("PATCH", `/api/method-drafts/${id}`, { expected_revision: 1, title: "x" }, A)) === "revision_conflict");
const v9 = await api("POST", `/api/method-drafts/${id}/validate`, null, A);
check("DAO share 9 is refused", v9.body.ok === false && v9.body.errors.some((e) => e.path === "dao_share_pct"));
r = await api("PATCH", `/api/method-drafts/${id}`, { expected_revision: r.body.revision, manifest: { ...manifest, dao_share_percent: 10 }, dao_share_pct: 10 }, A);

// artifact
const prompt = new TextEncoder().encode("You are a demo method used only to test publication. Reply with the JSON {\"counter_salary\": 0, \"signing_bonus\": 0, \"non_salary_asks\": [\"a\", \"b\"], \"reply\": \"test\", \"why\": \"test\"}.");
check("plaintext prompt upload is refused", code(await api("POST", `/api/method-drafts/${id}/artifact`, { prompt: "secret text", code_hash: sha256Hex(prompt), kind: "prompt" }, A)) === "plaintext_refused");
const art = await api("POST", `/api/method-drafts/${id}/artifact`, { sealed: sealMethod(cfg.runner.tee_pubkey, prompt), code_hash: sha256Hex(prompt), kind: "prompt", size: prompt.length }, A);
check("sealed artifact is accepted", art.status === 200 && art.body.artifact.sealed === true);
const vNoWarn = await api("POST", `/api/method-drafts/${id}/validate`, null, A);
check("a prompt needs the leak warning accepted", vNoWarn.body.errors.some((e) => e.path === "seller_prompt_warning_accepted"));
r = await api("PATCH", `/api/method-drafts/${id}`, { expected_revision: art.body.revision, seller_prompt_warning_accepted: { version: cfg.method_kinds.seller_prompt_warning_version } }, A);
const vOk = await api("POST", `/api/method-drafts/${id}/validate`, null, A);
check("complete draft validates", vOk.body.ok === true && vOk.body.kind === "prompt", JSON.stringify(vOk.body.errors).slice(0, 200));

// publish
const pub = await api("POST", `/api/method-drafts/${id}/publish`, { expected_revision: r.body.revision, idempotency_key: `pub-${Date.now()}` }, A);
check("publish returns unsigned calls with the exact manifest hash", pub.status === 200 && pub.body.calls.at(-1).args.manifest_hash === vOk.body.manifest_hash && pub.body.calls.at(-1).args.runner_hash === cfg.runner.build_hash, pub.body.error?.message);
const again = await api("POST", `/api/method-drafts/${id}/publish`, { expected_revision: r.body.revision }, A);
check("retrying publish returns the same pending publication", again.body.replayed === true && again.body.publication_id === pub.body.publication_id);
check("confirm before signing is refused", code(await api("POST", `/api/method-drafts/${id}/confirm`, {}, A)) === "not_on_chain_yet");

// the seller wallet signs (here: near-api-js with the test key)
const ks = new keyStores.InMemoryKeyStore();
await ks.setKey("testnet", ACCOUNT, key);
const acct = await (await connect({ networkId: "testnet", nodeUrl: "https://rpc.testnet.fastnear.com", keyStore: ks })).account(ACCOUNT);
let lastTx = null;
for (const c of pub.body.calls) {
  const out = await acct.functionCall({ contractId: c.receiver_id, methodName: c.method_name, args: c.args, gas: BigInt(c.gas_tgas) * 10n ** 12n, attachedDeposit: BigInt(c.deposit_yocto) });
  lastTx = out.transaction.hash;
  console.log(`  signed ${c.method_name} tx ${lastTx}`);
}
await new Promise((res) => setTimeout(res, 2000));
const conf = await api("POST", `/api/method-drafts/${id}/confirm`, { tx_hash: lastTx }, A);
check("confirm finds the version on chain", conf.body.published === true && conf.body.version >= 1, conf.body.error?.message);
check("confirming twice changes nothing", (await api("POST", `/api/method-drafts/${id}/confirm`, { tx_hash: lastTx }, A)).body.already_published === true);
check("a published draft is locked", code(await api("PATCH", `/api/method-drafts/${id}`, { expected_revision: 99, title: "x" }, A)) === "draft_locked");
const mine = await api("GET", "/api/me/methods", null, A);
check("my methods lists the published method", mine.body.listed.some((m) => m.method_id === METHOD) && mine.body.drafts.some((x) => x.id === id && x.state === "published" && !x.artifact?.sealed?.ct));
const creator = await api("GET", `/api/creators/${ACCOUNT}`);
check("creator profile shows the method from chain", creator.body.methods.some((m) => m.method_id === METHOD));
const listed = await api("GET", `/api/methods/${METHOD}`);
check("the market lists the version as runnable", listed.body.versions?.at(-1)?.runnable === true);

// evidence
const ev5 = await api("GET", "/api/methods/portfolio-rebalance/versions/5/evidence");
check("version evidence is served with scope and limits", ev5.body.available === true && ev5.body.dataset.kind === "synthetic" && ev5.body.limits.length > 0);
const evNone = await api("GET", "/api/methods/portfolio-rebalance/versions/1/evidence");
check("missing evidence says so", evNone.body.available === false && evNone.body.reason);
if (RUN) {
  const re = await api("GET", `/api/runs/${RUN}/evidence`);
  const txt = JSON.stringify(re.body);
  check("run evidence verifies completion and hashes", re.body.verification?.status === "verified_with_limits", re.body.verification?.status);
  check("run evidence carries no plaintext or secret", !/"secret"|"answer"\s*:|holdings/.test(txt) && re.body.verification.checks.intel_nvidia_certificate_chain === "not_verified");
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
