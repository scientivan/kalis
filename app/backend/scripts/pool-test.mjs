// Social Money pools against a running backend and NEAR testnet (spends real testnet NEAR).
// Usage: node scripts/pool-test.mjs [base url] [part: bounty|refund|group|all]
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

const BASE = process.argv[2] || "http://localhost:8787";
const PART = process.argv[3] || "all";
const DAO = "kalis-fund.sputnik-v2.testnet";
const KEYS = {
  "kalis-buyer.testnet": process.env.DEMO_BUYER_KEY,
  "platform.scientivan.testnet": process.env.SETTLER_KEY,
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
check("three testnet accounts sign in with NEP-413", Object.values(T).every(Boolean));

if (PART === "bounty" || PART === "all") {
  // Crowdfunded bounty on DAO bounty 1, completed only by a council-approved BountyDone.
  const pool = await api("POST", "/api/pools/bounties", { dao_bounty_id: 1, title: "Make portfolio-rebalance use less fuel on 3-asset cases (crowdfunded)", target_near: "0.02", deadline_days: 3 }, T[A]);
  check("a signed-in account starts a pool on a real DAO bounty", pool.status === 200 && pool.body.state === "open", pool.body.id || JSON.stringify(pool.body));
  const id = pool.body.id; record.bounty_pool = id;
  check("a demo workspace cannot pledge", code(await api("POST", `/api/pools/bounties/${id}/pledges`, { amount_near: "0.01" })) === "login_required");
  const p1 = await api("POST", `/api/pools/bounties/${id}/pledges`, { amount_near: "0.01" }, T[A]);
  const p2 = await api("POST", `/api/pools/bounties/${id}/pledges`, { amount_near: "0.01" }, T[B]);
  check("two accounts pledge, no NEAR moves", p2.body.pledged_near === "0.02" && p2.body.paid_near === "0" && p1.status === 200);
  check("paying before the DAO approves is refused", code(await api("POST", `/api/pools/bounties/${id}/pledges/me/paid`, { tx_hash: "11111111111111111111111111111111111111111111" }, T[A])) === "not_completed");
  // The contributor claims the bounty and asks for payout (both real DAO calls with the DAO's 1 NEAR bonds).
  tx("bounty_claim (contributor claims bounty 1, 1 NEAR bond held by the DAO)", await fcall(ORG, DAO, "bounty_claim", { id: 1, deadline: String(3n * 86400n * 10n ** 9n) }, 10n ** 24n, 100));
  tx("add_proposal BountyDone (payout request, 1 NEAR proposal bond)", await fcall(ORG, DAO, "add_proposal", { proposal: { description: `Bounty 1 done by ${ORG}. Crowdfunded pool ${id}. [kalis:${id}]`, kind: { BountyDone: { bounty_id: 1, receiver_id: ORG } } } }, 10n ** 24n));
  const after = (await api("GET", `/api/pools/bounties/${id}`, null, T[A])).body;
  check("the pool sees the pending BountyDone on chain and stays open until the council votes", after.state === "open" && after.pending_done?.status === "InProgress", `proposal ${after.pending_done?.proposal_id}`);
  record.pending_done_proposal = after.pending_done?.proposal_id;
}

if (PART === "pay") {
  // After the council (scientivan.testnet) approves the BountyDone: each pledger pays the contributor.
  const id = process.argv[4];
  for (const who of [A, B]) {
    const v = (await api("GET", `/api/pools/bounties/${id}`, null, T[who])).body;
    check(`${who} sees the pool completed with a transfer to sign`, v.state === "completed" && v.pay_call?.receiver_id, v.state);
    if (!v.pay_call) continue;
    const h = await transfer(who, v.pay_call.receiver_id, v.pay_call.deposit_yocto); tx(`pledge payment ${who} to ${v.pay_call.receiver_id}`, h);
    const r = await api("POST", `/api/pools/bounties/${id}/pledges/me/paid`, { tx_hash: h }, T[who]);
    check(`${who}'s payment is verified on chain`, r.body.my_pledge?.paid_tx === h, code(r));
  }
}

if (PART === "refund" || PART === "all") {
  const pool = await api("POST", "/api/pools/bounties", { dao_bounty_id: 2, title: "Crowdfunded bounty that expires (refund path)", target_near: "0.01", deadline: new Date(Date.now() + 15000).toISOString() }, T[B]);
  const id = pool.body.id; record.refund_pool = id;
  await api("POST", `/api/pools/bounties/${id}/pledges`, { amount_near: "0.005" }, T[A]);
  const before = BigInt((await (await acct(A)).getAccountBalance()).total);
  await new Promise((r) => setTimeout(r, 17000));
  const v = (await api("GET", `/api/pools/bounties/${id}`, null, T[A])).body;
  const afterBal = BigInt((await (await acct(A)).getAccountBalance()).total);
  check("after the deadline the pool is released and the pledge is void", v.state === "released" && v.released_reason === "deadline_passed" && !v.pay_call);
  check("the pledger's balance never moved, so there is nothing to refund", afterBal === before);
  check("a released pool takes no pledges", code(await api("POST", `/api/pools/bounties/${id}/pledges`, { amount_near: "0.005" }, T[A])) === "pool_closed");
  const c = await api("POST", "/api/pools/bounties", { dao_bounty_id: 2, title: "Pool the creator cancels", target_near: "0.01" }, T[B]);
  check("only the creator can cancel", code(await api("POST", `/api/pools/bounties/${c.body.id}/cancel`, {}, T[A])) === "not_creator");
  check("the creator cancels and the pool is released", (await api("POST", `/api/pools/bounties/${c.body.id}/cancel`, {}, T[B])).body.released_reason === "cancelled");
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
  const ex = await api("POST", `/api/runs/${paid.body.run_id}/execute`, { data: sealed.sealed, async: true }, T[ORG]);
  let op;
  for (let i = 0; i < 60 && ex.body.operation_id; i++) { op = (await api("GET", `/api/operations/${ex.body.operation_id}`, null, T[ORG])).body; if (op.status !== "pending") break; await new Promise((r) => setTimeout(r, 5000)); }
  check("the run executes once in the TEE", op?.status === "succeeded", op?.error?.message);
  const exec = (await api("GET", `/api/runs/${paid.body.run_id}/execution`, null, T[ORG])).body;
  const opened = exec?.output ? kalis.openAnswer(sealed.secret, exec.output) : null;
  check("the organizer opens the sealed answer with the data key", !!opened);
  record.group_run_id = paid.body.run_id;
  const settle = await api("POST", `/api/runs/${paid.body.run_id}/settle`, {}, T[ORG]);
  if (settle.body?.settle_tx) tx("settle (escrow release)", settle.body.settle_tx);
}

fs.writeFileSync(path.join(DATA_DIR, `pool-test-record-${PART}.json`), JSON.stringify(record, null, 1));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
