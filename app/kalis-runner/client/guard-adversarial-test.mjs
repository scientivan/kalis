// Adversarial set for wallet-allowance-guard on the native runner. Runs every case twice: with the real
// private AI (NEAR AI Cloud) and with AI unreachable (structural rules and policy only), to show what each
// layer adds. Usage: node client/guard-adversarial-test.mjs [native runner] [method.wasm]
import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer } from "./kalis.mjs";

const env0 = Object.fromEntries(fs.readFileSync(new URL("../../../.env", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const bin = process.argv[2] || new URL("../target/release/kalis-runner", import.meta.url).pathname;
const dir = new URL("../../methods/wallet-allowance-guard/", import.meta.url);
const wasm = fs.readFileSync(process.argv[3] || new URL("method.wasm", dir));
const manifestText = fs.readFileSync(new URL("manifest.json", dir), "utf8");
const { cases } = JSON.parse(fs.readFileSync(new URL("fixtures/adversarial-set.json", dir)));
const seal = crypto.randomBytes(32).toString("hex");
const mk = (ai) => ({ ...process.env, NEAR_AI_API_KEY: ai ? env0.NEAR_API_KEY : "", PROTECTED_SEAL_KEY: seal });
const call = (o, env) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey } = call({ cmd: "pubkey" }, mk(false));
const callAsync = (o, env) => new Promise((res, rej) => {
  const p = spawn(bin, { env }); let b = ""; p.stdout.on("data", (d) => (b += d)); p.on("error", rej);
  p.on("close", () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); p.stdin.end(JSON.stringify(o));
});
const run = async (data, ai) => {
  const { sealed, secret } = sealData(tee_pubkey, data);
  const r = await callAsync({ cmd: "run", run_id: `adv-${Date.now()}`, manifest: manifestText, method: sealMethod(tee_pubkey, wasm), data: sealed }, mk(ai));
  if (!r.ok) throw new Error(r.error);
  return openAnswer(secret, r).answer;
};
const rows = [];
await Promise.all(cases.map(async (c) => {
  await Promise.all([false, true].map(async (ai) => {
    let a;
    try { a = await run(c.input, ai); } catch (e) { rows.push({ name: c.name, kind: c.kind, ai, error: String(e.message) }); return; }
    const t = a.actions.find((x) => x.id === c.target);
    rows.push({ name: c.name, kind: c.kind, ai, ai_reviewed: a.ai_reviewed, verdict: t?.verdict, rules: (t?.reasons || []).map((r) => r.rule) });
  }));
}));
const sum = (ai) => {
  const r = rows.filter((x) => x.ai === ai);
  const atk = r.filter((x) => x.kind === "attack"), ben = r.filter((x) => x.kind === "benign");
  return { attacks: atk.length, blocked: atk.filter((x) => x.verdict === "BLOCK").length, warned_only: atk.filter((x) => x.verdict === "WARN").length, missed: atk.filter((x) => x.verdict === "ALLOW").length,
    benign: ben.length, benign_allow: ben.filter((x) => x.verdict === "ALLOW").length, benign_warn: ben.filter((x) => x.verdict === "WARN").length, benign_block_false_positive: ben.filter((x) => x.verdict === "BLOCK").length };
};
rows.sort((a, b) => a.name.localeCompare(b.name) || a.ai - b.ai);
for (const r of rows) console.log(`${r.ai ? "AI " : "noAI"} ${r.kind.padEnd(6)} ${r.name.padEnd(36)} ${r.verdict || r.error}  ${(r.rules || []).join(",")}`);
const out = { at: new Date().toISOString(), structural_and_policy_only: sum(false), with_private_ai: sum(true), rows };
console.log(JSON.stringify({ structural_and_policy_only: out.structural_and_policy_only, with_private_ai: out.with_private_ai }, null, 1));
fs.writeFileSync(new URL("evidence/adversarial-local-latest.json", dir), JSON.stringify(out, null, 2));
