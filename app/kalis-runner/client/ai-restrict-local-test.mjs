// Local test of the optional `ai_restrict` field of the runner `run` command (buyer narrows the
// seller's model list, never widens it). Usage: NEAR_AI_API_KEY=... node client/ai-restrict-local-test.mjs <native runner>
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { sealMethod, sealData, openAnswer, verifyCompletion } from "./kalis.mjs";

const [bin] = process.argv.slice(2);
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (o) => JSON.parse(execFileSync(bin, { input: JSON.stringify(o), env, maxBuffer: 1 << 26 }).toString());
const { tee_pubkey } = call({ cmd: "pubkey" });
const DS = "deepseek-ai/DeepSeek-V4.1-Flash-1017", QW = "Qwen/Qwen3-VL-30B-A3B-Instruct";
const guest = fs.readFileSync(new URL("../../guest-ai-test/target/wasm32-unknown-unknown/release/guest_ai_test.wasm", import.meta.url));
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
function run(manifestObj, method, data, extra = {}) {
  const manifest = JSON.stringify(manifestObj);
  const { sealed, secret } = sealData(tee_pubkey, data);
  const out = call({ cmd: "run", run_id: `restrict-${Date.now()}`, manifest, method: sealMethod(tee_pubkey, method), data: sealed, ...extra });
  return { out, opened: openAnswer(secret, out), completion: verifyCompletion(out) };
}
const m = { kind: "wasm", ai: { allowed: [DS, QW] }, steps: [{ id: "ask_ai" }] };
const a = run(m, guest, { model: DS, question: "Reply with the single word OK." }, { ai_restrict: [DS] });
check("restrict to one allowed model: run ok, policy reported", a.opened.report.all_ok && JSON.stringify(a.opened.report.ai_policy.effective) === JSON.stringify([DS]), JSON.stringify(a.opened.report.ai_policy));
const b = run(m, guest, { model: QW, question: "hi" }, { ai_restrict: [DS] });
check("model the buyer excluded is refused inside the run", b.opened.report.ai_calls[0]?.ok === false && b.completion.record.all_ok === false);
const c = run(m, guest, { model: DS, question: "hi" }, { ai_restrict: ["openai/gpt-5"] });
const ci = c.opened.report.runner_stages.find((s) => s.id === "check_imports");
check("restriction with no overlap fails check_imports with the agreed message", ci && !ci.ok && ci.detail === "your model choice leaves no model the seller allows" && c.completion.record.all_ok === false);
check("buyer cannot widen: a model outside the seller list stays out", !c.opened.report.ai_policy.effective.includes("openai/gpt-5"));
const d = run(m, guest, { model: DS, question: "Reply with the single word OK." });
check("field absent: no ai_policy in the report, behaviour unchanged", d.opened.report.ai_policy === undefined && d.opened.report.all_ok);
check("completion record format unchanged (no ai_restrict inside)", !("ai_restrict" in a.completion.record) && Object.keys(a.completion.record).sort().join(",") === Object.keys(d.completion.record).sort().join(","));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
