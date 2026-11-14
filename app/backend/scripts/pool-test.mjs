// Social Money pools against a running backend and NEAR testnet (spends real testnet NEAR).
// Usage: node scripts/pool-test.mjs [base url] [part: escrow|group|all]
// escrow: the bounty pool contract (POOL_CONTRACT). The API returns unsigned calls; this script signs them as the
// user's wallet would, with kalis-backer-1114.testnet and kalis-dev-1114.testnet (keys from ~/.near-credentials).
// group: group purchase, then the organizer re-seals the answer to two member device keys.
// Accounts: kalis-buyer.testnet and platform.scientivan.testnet (keys from app/backend/.env),
// auth-test.scientivan.testnet (key from ~/.near-credentials). Keys are never printed.
// Writes the transaction hashes it produced to data/pool-test-record.json.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { KeyPair, connect, keyStores } from "near-api-js";
import { nep413Hash } from "../src/auth.js";
import { config, DATA_DIR } from "../src/config.js";
import * as kalis from "../src/kalis-crypto.js";
import * as gs from "../../web/src/lib/backend/group-seal.js";

const BASE = process.argv[2] || "http://localhost:8787";
const PART = process.argv[3] || "all";
const DAO = "kalis-fund.sputnik-v2.testnet";
function cred(id) { try { return JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${id}.json`, "utf8")).private_key; } catch { return null; } }
const KEYS = {
  "kalis-buyer.testnet": process.env.DEMO_BUYER_KEY,
  "platform.scientivan.testnet": process.env.SETTLER_KEY,
  "kalis-backer-1114.testnet": cred("kalis-backer-1114.testnet"),
  "kalis-dev-1114.testnet": cred("kalis-dev-1114.testnet"),
  "auth-test.scientivan.testnet": JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/auth-test.scientivan.testnet.json`, "utf8")).private_key,
};
const [ORG, A, B] = ["kalis-buyer.testnet", "auth-test.scientivan.testnet", "platform.scientivan.testnet"];
const record = { at: new Date().toISOString(), base: BASE, txs: [] };
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
const tx = (what, hash) => { record.txs.push({ what, hash, explorer: `https://testnet.nearblocks.io/txns/${hash}` }); console.log(`  tx ${what}: ${hash}`); };

async function api(method, p, body, token) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;
const db_peek = (id) => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "db", "group_runs.json"), "utf8"))[id]; } catch { return null; } };

const accts = new Map();
async function acct(id) {
  if (accts.has(id)) return accts.get(id);
  const ks = new keyStores.InMemoryKeyStore();
  await ks.setKey("testnet", id, KeyPair.fromString(KEYS[id]));
  const a = await (await connect({ networkId: "testnet", nodeUrl: config.rpc, keyStore: ks })).account(id);
  accts.set(id, a); return a;
}
async function login(id) {
  const kp = KeyPair.fromString(KEYS[id]);
  const ch = (await api("POST", "/api/auth/challenge", { account_id: id })).body;
  const sig = Buffer.from(kp.sign(nep413Hash({ message: ch.message, nonce: Buffer.from(ch.nonce, "base64"), recipient: ch.recipient })).signature).toString("base64");
  const r = await api("POST", "/api/auth/verify", { challenge_id: ch.challenge_id, account_id: id, public_key: kp.getPublicKey().toString(), signature: sig });
  if (!r.body?.session_token) throw new Error(`login ${id}: ${JSON.stringify(r.body)}`);
  return r.body.session_token;
}
async function transfer(from, to, yocto) { const out = await (await acct(from)).sendMoney(to, BigInt(yocto)); return out.transaction.hash; }
async function fcall(from, contractId, methodName, args, deposit, tgas = 150) {
  const out = await (await acct(from)).functionCall({ contractId, methodName, args, attachedDeposit: BigInt(deposit), gas: BigInt(tgas) * 10n ** 12n });
  if (out.status?.Failure) throw new Error(`${methodName} failed: ${JSON.stringify(out.status.Failure)}`);
  return out.transaction.hash;
}

const T = { [ORG]: await login(ORG), [A]: await login(A), [B]: await login(B) };
const POOLS = process.env.POOL_CONTRACT || "kalis-pools-1114.testnet";
const [P1, P2] = ["kalis-backer-1114.testnet", "kalis-dev-1114.testnet"];
const chain = (method, args) => fetch(config.rpc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "query", params: { request_type: "call_function", finality: "final", account_id: POOLS, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString("base64") } }) }).then((r) => r.json()).then((j) => JSON.parse(Buffer.from(j.result.result).toString()));
const settle = () => new Promise((r) => setTimeout(r, 4000)); // let receipts reach final
async function sign(who, c) { // what the wallet does with an unsigned contract_call
  if (c.signer_must_be && c.signer_must_be !== who) throw new Error("wrong signer");
  const out = await (await acct(who)).functionCall({ contractId: c.receiver_id, methodName: c.method_name, args: c.args, attachedDeposit: BigInt(c.deposit_yocto), gas: BigInt(c.gas_tgas) * 10n ** 12n });
  return out;
}

if (PART === "escrow" || PART === "all") {
  T[P1] = await login(P1); T[P2] = await login(P2);
  const mk = await api("POST", "/api/pools/bounties", { dao_bounty_id: 2, deadline_days: 0.0012, title: "API escrow test: short deadline" }, T[P1]);
  check("API returns an unsigned create_pool for the creator's wallet", mk.body?.contract_call?.method_name === "create_pool" && mk.body.contract_call.signer_must_be === P1, code(mk));
  const made = await sign(P1, mk.body.contract_call); tx("create_pool (via API)", made.transaction.hash);
  const pid = Number(Buffer.from(made.status.SuccessValue, "base64").toString());
  record.escrow_pool = pid;
  for (const who of [P1, P2]) {
    const pl = await api("POST", `/api/pools/bounties/${pid}/pledges`, { amount_near: "0.02" }, T[who]);
    check(`unsigned pledge for ${who} attaches the locked amount`, pl.body?.contract_call?.deposit_yocto === "20000000000000000000000", code(pl));
    tx(`pledge 0.02 NEAR (${who})`, (await sign(who, pl.body.contract_call)).transaction.hash);
  }
  await settle();
  const v = (await api("GET", `/api/pools/bounties/${pid}`, null, T[P1])).body;
  check("two pledges are locked in the contract", v.locked_near === "0.04" && v.pledgers.length === 2, `${v.locked_near} NEAR, ${v.pledgers.length} pledgers`);
  check("the pool reports escrow custody", /locked in/.test(v.custody));
  check("no refund before the deadline", code(await api("POST", `/api/pools/bounties/${pid}/refund`, {}, T[P1])) === "cannot_refund");
  check("no release without an approved BountyDone", code(await api("POST", `/api/pools/bounties/${pid}/release`, {}, T[P1])) === "cannot_release");
  const direct = await sign(P1, { receiver_id: POOLS, method_name: "release", args: { pool_id: pid, proposal_id: 5 }, deposit_yocto: "0", gas_tgas: 100 });
  const refusedLog = direct.receipts_outcome.flatMap((r) => r.outcome.logs).find((l) => l.includes("release refused"));
  check("the contract itself refuses release without a valid approved BountyDone", !!refusedLog, refusedLog); tx("release refused on chain", direct.transaction.hash);
  await settle();
  check("pool is still open with funds locked after the refused release", (await chain("get_pool", { pool_id: pid })).state === "Open");
  await new Promise((r) => setTimeout(r, Math.max(0, Date.parse(v.deadline) - Date.now()) + 3000));
  const rf = await api("POST", `/api/pools/bounties/${pid}/refund`, {}, T[P2]);
  check("after the deadline the API returns refund for the pledger's own wallet", rf.body?.contract_call?.signer_must_be === P2, code(rf));
  tx("refund (via API, after deadline)", (await sign(P2, rf.body.contract_call)).transaction.hash);
  await settle();
  check("the pledger's pledge is returned and the other stays locked", (await chain("get_pledge", { pool_id: pid, account_id: P2 })) === "0" && (await chain("get_pool", { pool_id: pid })).total === "20000000000000000000000");
  check("no new pledges after the deadline", code(await api("POST", `/api/pools/bounties/${pid}/pledges`, { amount_near: "0.02" }, T[P1])) === "pool_closed");
}

if (PART === "group" || PART === "all") {
  const g = await api("POST", "/api/pools/group-runs", { method_id: "portfolio-rebalance", members: [A, B], title: "Team rebalance before market open" }, T[ORG]);
  check("organizer starts a group purchase with the on-chain price split in three", g.status === 200 && g.body.share_near, `${g.body.price_near} NEAR, share ${g.body.share_near}`);
  const id = g.body.id; record.group_run = id;
  check("a non-member cannot record a share", code(await api("POST", `/api/pools/group-runs/${id}/shares`, { tx_hash: "11111111111111111111111111111111111111111111" }, T[ORG])) === "not_member");
  let firstTx;
  for (const who of [A, B]) {
    const v = (await api("GET", `/api/pools/group-runs/${id}`, null, T[who])).body;
    const h = await transfer(who, v.share_call.receiver_id, v.share_call.deposit_yocto); tx(`share ${who} to organizer ${ORG}`, h);
    firstTx ||= h;
    const r = await api("POST", `/api/pools/group-runs/${id}/shares`, { tx_hash: h }, T[who]);
    check(`${who}'s share is verified on chain`, r.body.members?.find((m) => m.account_id === who)?.share_tx === h, code(r));
  }
  const g2 = await api("POST", "/api/pools/group-runs", { method_id: "portfolio-rebalance", members: [A] }, T[ORG]);
  check("the same transaction cannot be counted twice", code(await api("POST", `/api/pools/group-runs/${g2.body.id}/shares`, { tx_hash: firstTx }, T[A])) === "tx_already_used");
  // Organizer pays the one run through the escrow and runs it once in the TEE.
  const cfg = (await api("GET", "/api/config")).body;
  const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
  const { id: _c, ...data } = cases.find((c) => c.id === "C03");
  const sealed = kalis.sealData(cfg.runner.tee_pubkey, data);
  const draft = (await api("POST", "/api/run-drafts", { method_id: "portfolio-rebalance", name: "Team rebalance", data_ct_sha256: sealed.dataCtSha256 }, T[ORG])).body;
  await api("POST", `/api/run-drafts/${draft.id}/consents`, { revision: draft.revision, kind: "method_terms" }, T[ORG]);
  const quote = (await api("POST", `/api/run-drafts/${draft.id}/quote`, { expected_revision: draft.revision }, T[ORG])).body;
  const paid = await api("POST", "/api/runs", { quote_id: quote.id, payment: "demo_topup", idempotency_key: `group-${id}` }, T[ORG]);
  check("organizer pays the run through the market escrow", paid.body.pay_tx, JSON.stringify(paid.body).slice(0, 200));
  if (paid.body.pay_tx) tx("pay_for_run (escrow, organizer)", paid.body.pay_tx);
  const early = await api("POST", `/api/pools/group-runs/${id}/run`, { run_id: paid.body.run_id }, T[A]);
  check("only the organizer links the run", code(early) === "not_organizer");
  const link = await api("POST", `/api/pools/group-runs/${id}/run`, { run_id: paid.body.run_id }, T[ORG]);
  check("the paid run is linked to the group purchase", link.body.state === "run_linked", code(link));
  let op;
  for (let attempt = 0; attempt < 5; attempt++) { // the runner gateway sometimes answers "Too many requests"
    const ex = await api("POST", `/api/runs/${paid.body.run_id}/execute`, { data: sealed.sealed, async: true }, T[ORG]);
    for (let i = 0; i < 60 && ex.body?.operation_id; i++) { op = (await api("GET", `/api/operations/${ex.body.operation_id}`, null, T[ORG])).body; if (op.status !== "pending") break; await new Promise((r) => setTimeout(r, 5000)); }
    if (op?.status === "succeeded" || !/Too many|rate/i.test(String(op?.error?.message || JSON.stringify(ex.body)))) break;
    console.log(`  runner rate limited, retry ${attempt + 1}`); await new Promise((r) => setTimeout(r, 30000));
  }
  check("the run executes once in the TEE", op?.status === "succeeded", op?.error?.message);
  const exec = (await api("GET", `/api/runs/${paid.body.run_id}/execution`, null, T[ORG])).body;
  const opened = exec?.output ? kalis.openAnswer(sealed.secret, exec.output) : null;
  check("the organizer opens the sealed answer with the data key", !!opened);
  // Re-seal for every member: members register device keys, the organizer's device seals, members open.
  const dev = { [A]: gs.newDeviceKey(), [B]: gs.newDeviceKey() };
  for (const who of [A, B]) check(`${who} registers a device public key`, (await api("POST", `/api/pools/group-runs/${id}/device-key`, { x25519_pub: dev[who].public_hex }, T[who])).status === 200);
  check("a non-member cannot register a key", code(await api("POST", `/api/pools/group-runs/${id}/device-key`, { x25519_pub: dev[A].public_hex }, T[ORG])) === "not_member");
  const gv = (await api("GET", `/api/pools/group-runs/${id}`, null, T[ORG])).body;
  const items = gv.members.map((m) => ({ account_id: m.account_id, sealed: gs.sealForMember(m.device_key, opened, { group_id: id, run_id: paid.body.run_id, account_id: m.account_id }) }));
  check("only the organizer can upload sealed answers", code(await api("POST", `/api/pools/group-runs/${id}/sealed-results`, { items }, T[A])) === "not_organizer");
  const up = await api("POST", `/api/pools/group-runs/${id}/sealed-results`, { items }, T[ORG]);
  check("organizer uploads one ciphertext per member", up.status === 200 && up.body.members.every((m) => m.result_sealed), code(up));
  const stored = JSON.stringify(db_peek(id));
  check("the backend stores no plaintext answer", !stored.includes(JSON.stringify(opened.answer).slice(1, 40)));
  for (const who of [A, B]) {
    const mine = (await api("GET", `/api/pools/group-runs/${id}`, null, T[who])).body.my_sealed_result;
    const got = mine && gs.openAsMember(dev[who].secret_hex, mine, { group_id: id, run_id: paid.body.run_id, account_id: who });
    check(`${who} opens the answer with their own device key`, JSON.stringify(got) === JSON.stringify(opened));
  }
  const theirs = (await api("GET", `/api/pools/group-runs/${id}`, null, T[A])).body.my_sealed_result;
  let cross = false; try { gs.openAsMember(dev[B].secret_hex, theirs, { group_id: id, run_id: paid.body.run_id, account_id: A }); cross = true; } catch {}
  check("another member's key cannot open it", !cross);
  record.group_run_id = paid.body.run_id;
  const settle = await api("POST", `/api/runs/${paid.body.run_id}/settle`, {}, T[ORG]);
  if (settle.body?.settle_tx) tx("settle (escrow release)", settle.body.settle_tx);
}

fs.writeFileSync(path.join(DATA_DIR, `pool-test-record-${PART}.json`), JSON.stringify(record, null, 1));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
