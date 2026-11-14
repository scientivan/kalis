// Buys, runs, settles and reviews methods as a real NEAR testnet buyer that pays from its own wallet.
// Signs in with NEP-413, signs pay_for_run itself, seals its data on this machine to the runner key,
// opens the answer and runs the buyer checks locally, then settles and writes a review only for a
// released run. The key is read from ~/.near-credentials/testnet/<account>.json and never printed.
// Usage: node scripts/buyer-wallet-runs.mjs <base url> <account> <method_id[:fixture.json]> ...
import fs from "node:fs";
import os from "node:os";
import { KeyPair, connect, keyStores } from "near-api-js";
import { nep413Hash } from "../src/auth.js";
import * as kalis from "../src/kalis-crypto.js";
import { runChecks } from "../src/checks.js";

const [BASE, ACCOUNT, ...IDS] = process.argv.slice(2);
if (!BASE || !ACCOUNT || !IDS.length) throw new Error("usage: buyer-wallet-runs.mjs <base> <account> <method_id...>");
const cred = JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${ACCOUNT}.json`, "utf8"));
const kp = KeyPair.fromString(cred.private_key);
let token = null;
const api = async (method, p, body) => {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = await api("POST", "/api/auth/challenge", { account_id: ACCOUNT });
const sig = Buffer.from(kp.sign(nep413Hash({ message: ch.message, nonce: Buffer.from(ch.nonce, "base64"), recipient: ch.recipient })).signature).toString("base64");
token = (await api("POST", "/api/auth/verify", { challenge_id: ch.challenge_id, account_id: ACCOUNT, public_key: kp.getPublicKey().toString(), signature: sig })).session_token;
const cfg = await api("GET", "/api/config");
const ks = new keyStores.InMemoryKeyStore();
await ks.setKey("testnet", ACCOUNT, kp);
const near = await connect({ networkId: "testnet", nodeUrl: "https://rpc.testnet.fastnear.com", keyStore: ks });
const acct = await near.account(ACCOUNT);
const outFile = new URL(`../data/buyer-runs-${ACCOUNT}.json`, import.meta.url);
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : { account: ACCOUNT, base: BASE, runs: [] };
const save = () => fs.writeFileSync(outFile, JSON.stringify(out, null, 2));

for (const arg of IDS) {
  const [id, fixture = "sample-input.json"] = arg.split(":");
  const rec = { method_id: id, fixture, at: new Date().toISOString() };
  out.runs.push(rec);
  try {
    const manifest = (await api("GET", `/api/methods/${id}`)).versions.at(-1).manifest;
    const { _note, ...data } = JSON.parse(fs.readFileSync(new URL(`../../methods/${id}/fixtures/${fixture}`, import.meta.url)));
    const { sealed, secret, dataCtSha256 } = kalis.sealData(cfg.runner.tee_pubkey, data);
    const created = await api("POST", "/api/runs", { method_id: id, data_ct_sha256: dataCtSha256, payment: "wallet", idempotency_key: `wallet-${id}-${fixture}-${dataCtSha256.slice(0, 16)}` });
    const c = created.contract_call;
    const tx = await acct.functionCall({ contractId: c.receiver_id, methodName: c.method_name, args: c.args, gas: BigInt(c.gas_tgas) * 10n ** 12n, attachedDeposit: BigInt(c.deposit_yocto) });
    Object.assign(rec, { run_id: created.run_id, version: created.version, pay_tx: tx.transaction.hash, pay_failure: tx.status?.Failure ? JSON.stringify(tx.status.Failure) : null });
    save(); console.log(id, "paid", rec.run_id, rec.pay_tx);
    for (let i = 0; i < 20; i++) { const r = await api("GET", `/api/runs/${created.run_id}`); if (r.status === "Paid") break; await sleep(3000); }
    let ex = null;
    for (let attempt = 0; attempt < 4 && !ex; attempt++) {
      const started = await api("POST", `/api/runs/${created.run_id}/execute`, { data: sealed, async: true });
      for (;;) {
        await sleep(10000);
        const op = await api("GET", `/api/operations/${started.operation_id}`);
        if (op.status === "succeeded") { ex = await api("GET", `/api/runs/${created.run_id}/execution`); rec.call_id = op.result.call_id; break; }
        if (op.status === "failed") {
          if (!/did not finish/.test(op.error?.message || "") || attempt === 3) throw new Error(op.error?.message || "execution failed");
          console.log("  OutLayer still queued, resuming the same call"); break;
        }
      }
    }
    const opened = kalis.openAnswer(secret, ex.output);
    const checks = runChecks(manifest, data, opened.answer);
    Object.assign(rec, { all_ok: opened.report.all_ok, status_field: opened.answer[manifest.outputs.status_field], checks: checks.counts, attestation: ex.attestation || null });
    save(); console.log(id, "executed", rec.call_id, JSON.stringify(checks.counts));
    const st = await api("POST", `/api/runs/${created.run_id}/settle`);
    Object.assign(rec, { settle_tx: st.settle_tx, settle_status: st.status, settle_reason: st.reason });
    save(); console.log(id, "settled", st.status, st.settle_tx);
    if (st.status === "Released") {
      const minutes = Math.max(1, Math.round((Date.parse(ex.at) - Date.parse(rec.at)) / 60000));
      const ok = opened.report.all_ok && checks.passed && !checks.has_cannot_check;
      const rating = ok ? (minutes <= 3 ? 5 : 4) : 2;
      const comment = ok
        ? `Every step finished and all ${checks.counts.pass} checks that applied passed on my device. Paid from my own testnet wallet; the answer took about ${minutes} minutes.`
        : `The run finished but some checks did not pass on my device. Took about ${minutes} minutes.`;
      const rv = await api("POST", `/api/methods/${id}/reviews`, { run_id: created.run_id, rating, comment, privacy_acknowledged: true, idempotency_key: `wallet-review-${created.run_id}` });
      Object.assign(rec, { review_id: rv.id, rating });
      save(); console.log(id, "review", rating, rv.id);
    }
  } catch (e) { rec.error = String(e.message).slice(0, 400); save(); console.log("ERR", id, rec.error); }
}
save();
