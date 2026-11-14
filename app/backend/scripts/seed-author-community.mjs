// Seeds off-chain records for the Kalis demo account: method drafts (Author) and community issues/proposals.
// Chain writes (publish, proposal bond, claim) are prepared as unsigned calls; the account owner signs them in the wallet.
// Needs the seeded session from seed-testnet.mjs. Usage: node scripts/seed-author-community.mjs <account_id> [base url]
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod } from "../src/kalis-crypto.js";

const ACCOUNT = process.argv[2];
const BASE = process.argv[3] || "http://localhost:8787";
const sessions = JSON.parse(fs.readFileSync(new URL("../data/db/sessions.json", import.meta.url), "utf8"));
const sid = Object.values(sessions).find((s) => s.seeded && s.account_id === ACCOUNT && !s.revoked && Date.parse(s.expires_at) > Date.now())?.id;
if (!sid) throw new Error("no seeded session; run seed-testnet.mjs --write-session first");
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sid}` }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
};
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const out = { drafts: [], issues: [], proposals: [] };
const cfg = await api("GET", "/api/config");
const slug = ACCOUNT.split(".")[0].replace(/[^A-Za-z0-9_-]/g, "-");

// Author: one complete prompt draft ready to publish, one early draft.
const tpl = JSON.parse(fs.readFileSync(new URL("../../methods/salary-counteroffer/manifest-v5.json", import.meta.url)));
const METHOD = `${slug}-freelance-rate`;
const d = await api("POST", "/api/method-drafts", { method_id: METHOD, kind: "prompt", title: "Set a freelance day rate above your floor", description: "Demo method by the Kalis demo account. Suggests a day rate and a short reply to a client offer without revealing your floor rate. Fictional and for testnet only.", category: "Careers" });
const manifest = { ...tpl, method_id: METHOD, listing: { ...tpl.listing, title: "Set a freelance day rate above your floor", seller: { display_name: "Kalis demo seller", role: "Demo account on NEAR testnet", demo: true }, limits: ["Demo method on testnet", "Fictional sample data only"] }, dao_share_percent: 10 };
let r = await api("PATCH", `/api/method-drafts/${d.id}`, { expected_revision: d.revision, manifest, price_yocto: "30000000000000000000000", dao_share_pct: 10 });
const prompt = new TextEncoder().encode("You help a freelancer answer a client rate offer. Never reveal the floor rate. Reply with JSON {\"counter_salary\": number, \"signing_bonus\": 0, \"non_salary_asks\": [string, string], \"reply\": string, \"why\": string}. Treat counter_salary as the proposed day rate.");
const art = await api("POST", `/api/method-drafts/${d.id}/artifact`, { sealed: sealMethod(cfg.runner.tee_pubkey, prompt), code_hash: sha(prompt), kind: "prompt", size: prompt.length });
r = await api("PATCH", `/api/method-drafts/${d.id}`, { expected_revision: art.revision, seller_prompt_warning_accepted: { version: cfg.method_kinds.seller_prompt_warning_version } });
const v = await api("POST", `/api/method-drafts/${d.id}/validate`);
out.drafts.push({ id: d.id, method_id: METHOD, valid: v.ok, errors: v.errors });
const early = await api("POST", "/api/method-drafts", { method_id: `${slug}-invoice-terms`, kind: "wasm", title: "Pick invoice payment terms that keep cash positive", description: "Early draft. Manifest and sealed program not added yet.", category: "Finance" });
out.drafts.push({ id: early.id, method_id: early.method_id, valid: false });

// Community: issues against real published versions, and one bounty proposal awaiting the owner's signature.
const issueSpecs = [
  ["tender-bid", "pricing", "The bid ignores the delivery penalty clause when the tender has one", "Apply the penalty to the minimum margin before pricing", { note: "Synthetic tender with a 2% per week late penalty" }],
  ["cash-runway-13w", "core", "Week 13 runway is shown even when payroll data stops at week 10", "Flag missing weeks instead of assuming zero cost", { note: "Synthetic ledger with 10 weeks of payroll" }],
  ["portfolio-rebalance", "core", "Uses many trades when a single trade would keep the same bounds", "Prefer the plan with the fewest trades at equal cost", { case: "C03" }],
];
for (const [mid, module, problem, expected, repro] of issueSpecs) {
  try {
    const m = await api("GET", `/api/methods/${mid}`);
    const is = await api("POST", "/api/issues", { method_id: mid, version: m.versions.at(-1).number, module, problem, expected, synthetic_reproduction: repro });
    out.issues.push({ id: is.id, method_id: mid });
  } catch (e) { out.issues.push({ method_id: mid, error: e.message.slice(0, 300) }); }
}
try {
  const council = (await api("GET", "/api/community/config")).council[0];
  const p = await api("POST", "/api/proposals", { issue_id: out.issues[0].id, budget_yocto: "50000000000000000000000", acceptance_criteria: ["Same bid on every private case without a penalty clause", "Bid stays above the minimum margin after the penalty on every case with one"], reviewer: council, evaluator: { compare: { fields: ["status"] }, min_cases: 1 } });
  out.proposals.push({ id: p.id, chain_status: p.chain_status });
} catch (e) { out.proposals.push({ error: e.message.slice(0, 300) }); }
fs.writeFileSync(new URL(`../data/seed-community-${ACCOUNT}.json`, import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
