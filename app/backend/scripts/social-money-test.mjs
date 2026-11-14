// Social Money on testnet: royalty, tip, stake-backed rating against a released run.
// Usage: node scripts/social-money-test.mjs <base url> <released run id> [workspace header of the run]
// The buyer wallet is played by the demo buyer key from .env (the account that paid for the run). The
// signed transfer is the same unsigned call the browser wallet would sign.
import assert from "node:assert/strict";
import { connect, keyStores, KeyPair } from "near-api-js";
import { config } from "../src/config.js";

const [BASE = "http://localhost:8787", RUN, WS] = process.argv.slice(2);
assert.ok(RUN, "pass a released run id");
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(WS ? { "X-Kalis-Workspace": WS } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, j: await r.json() };
};
const ks = new keyStores.InMemoryKeyStore();
const s = config.secrets.demoBuyer;
await ks.setKey("testnet", s.accountId, KeyPair.fromString(s.key));
const buyer = await (await connect({ networkId: "testnet", nodeUrl: config.rpc, keyStore: ks })).account(s.accountId);
const sign = async (call) => { assert.equal(call.kind, "transfer"); assert.equal(call.signer_must_be, buyer.accountId); return (await buyer.sendMoney(call.receiver_id, BigInt(call.deposit_yocto))).transaction.hash; };

// 1. royalty (paid at settle; this call is idempotent)
const roy = await api("POST", `/api/runs/${RUN}/royalty`);
assert.equal(roy.status, 200); assert.equal(roy.j.applies, true); assert.ok(roy.j.tx_hash);
console.log("royalty", roy.j.amount.display, "to", roy.j.transfers.map((t) => t.account).join(","), roy.j.tx_hash, "replayed", roy.j.replayed);

// 2. tip
const social = (await api("GET", `/api/runs/${RUN}/social`)).j;
assert.equal((await api("POST", `/api/runs/${RUN}/tip`, { amount_near: "5" })).status, 400, "tip above 1 NEAR is refused");
assert.equal((await api("POST", `/api/runs/${RUN}/tip`, { amount_near: "0.02", to: "someone.testnet" })).status, 400, "tip to a stranger is refused");
const tipTo = social.contributors[0] || social.seller;
const tip = await api("POST", `/api/runs/${RUN}/tip`, { amount_near: "0.02", to: social.seller });
assert.equal(tip.status, 200);
const tipTx = await sign(tip.j.contract_call);
const tipRec = await api("POST", `/api/runs/${RUN}/tips`, { tx_hash: tipTx });
assert.equal(tipRec.status, 200, JSON.stringify(tipRec.j)); assert.equal(tipRec.j.tip.from, buyer.accountId);
console.log("tip", tipRec.j.tip.amount.display, "to", tipRec.j.tip.to, tipTx);
assert.equal((await api("POST", `/api/runs/${RUN}/tips`, { tx_hash: tipTx })).j.replayed, true);
console.log("contributor also tippable:", tipTo);

// 3. stake-backed rating
let rev = await api("POST", "/api/methods/" + roy.j.method_id + "/reviews", { run_id: RUN, rating: 5, comment: "Result matched my own spreadsheet. Testnet run.", privacy_acknowledged: true, idempotency_key: `social-${RUN}` });
assert.equal(rev.status, 200, JSON.stringify(rev.j));
const rid = rev.j.review.id;
assert.equal((await api("POST", `/api/reviews/${rid}/stake`, { amount_near: "0.5" })).status, 400, "stake above 0.1 NEAR is refused");
const st = await api("POST", `/api/reviews/${rid}/stake`, { amount_near: "0.02" });
assert.equal(st.status, 200, JSON.stringify(st.j));
const stTx = await sign(st.j.contract_call);
assert.equal((await api("POST", `/api/reviews/${rid}/stake/confirm`, { tx_hash: tipTx })).status, 422, "a tip tx cannot back a stake");
const stRec = await api("POST", `/api/reviews/${rid}/stake/confirm`, { tx_hash: stTx });
assert.equal(stRec.status, 200, JSON.stringify(stRec.j));
console.log("stake", stRec.j.stake.amount.display, "to", stRec.j.stake.to, stTx);
const ms = (await api("GET", `/api/methods/${roy.j.method_id}/social`)).j;
assert.ok(ms.stakes.by_review[rid]);
console.log("method social", JSON.stringify({ tips: ms.tips, royalties: { count: ms.royalties.count, total: ms.royalties.total.display }, stakes: { count: ms.stakes.count, total: ms.stakes.total.display } }));
console.log("ALL SOCIAL MONEY CHECKS PASSED");
