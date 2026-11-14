// NEAR access: read-only views over RPC, and signed calls for the two server accounts
// (the demo buyer behind the mock fiat top-up, and the settler that submits completion records).
import { connect, keyStores, KeyPair } from "near-api-js";
import { config } from "./config.js";

// Public testnet RPCs rate-limit bursts (fastnear answers "Rate limits exceeded"). Reads are cached for a few
// seconds, identical reads in flight share one request, and a limited or failing endpoint falls over to the next.
const RPCS = [...new Set([config.rpc, ...(process.env.NEAR_RPC_FALLBACKS || "https://test.rpc.fastnear.com,https://near-testnet.lava.build,https://rpc.testnet.near.org").split(",").map((x) => x.trim()).filter(Boolean)])];
const READ_TTL_MS = 8000;
const cache = new Map(); // key -> { at, value } | { promise }
const LIMITED = /rate limit|too many requests|429|exceeded/i;
let preferred = 0;

async function rpcOnce(url, method, params) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(15000) });
  const text = await r.text();
  if (r.status === 429 || (!r.ok && LIMITED.test(text))) throw Object.assign(new Error("rate limited"), { retryOther: true });
  let j; try { j = JSON.parse(text); } catch { throw Object.assign(new Error(`RPC answered ${r.status}`), { retryOther: true }); }
  if (j.error) {
    const msg = j.error.cause?.info?.error_message || j.error.data || j.error.message || "RPC error";
    if (LIMITED.test(String(msg)) || j.error.cause?.name === "INTERNAL_ERROR") throw Object.assign(new Error(String(msg)), { retryOther: true });
    throw Object.assign(new Error(String(msg)), { code: "rpc_error" });
  }
  return j.result;
}

async function rpcAny(method, params) {
  let last;
  for (let i = 0; i < RPCS.length; i++) {
    const idx = (preferred + i) % RPCS.length;
    try { const out = await rpcOnce(RPCS[idx], method, params); preferred = idx; return out; }
    catch (e) { if (!e.retryOther && e.name !== "TimeoutError" && e.name !== "TypeError") throw e; last = e; }
  }
  throw Object.assign(new Error("The NEAR testnet network is busy right now. Try again in a moment."), { code: "rpc_unavailable", status: 503, cause: last });
}

export async function rpc(method, params) {
  if (method !== "query") return rpcAny(method, params);
  const key = JSON.stringify(params);
  const hit = cache.get(key);
  if (hit?.promise) return hit.promise;
  if (hit && Date.now() - hit.at < READ_TTL_MS) return hit.value;
  const promise = rpcAny(method, params)
    .then((value) => { cache.set(key, { at: Date.now(), value }); return value; })
    .catch((e) => { if (hit && Date.now() - hit.at < 120000) { cache.set(key, hit); return hit.value; } cache.delete(key); throw e; });
  cache.set(key, { promise });
  return promise;
}

/** Drop cached reads after a write so the next view sees it. */
export const clearReadCache = () => cache.clear();

export async function view(contract, methodName, args = {}, finality = "optimistic") {
  const r = await rpc("query", { request_type: "call_function", finality, account_id: contract, method_name: methodName, args_base64: Buffer.from(JSON.stringify(args)).toString("base64") });
  if (r.error) throw Object.assign(new Error(r.error), { code: "view_error" });
  return JSON.parse(Buffer.from(r.result).toString() || "null");
}

export async function balance(accountId) {
  const r = await rpc("query", { request_type: "view_account", finality: "final", account_id: accountId });
  return r.amount;
}

const accounts = new Map();
async function account(who) {
  const s = config.secrets[who];
  if (!s?.key) throw Object.assign(new Error(`server account "${who}" is not configured`), { code: "not_configured", status: 503 });
  if (accounts.has(who)) return accounts.get(who);
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(config.network, s.accountId, KeyPair.fromString(s.key));
  const near = await connect({ networkId: config.network, nodeUrl: config.rpc, keyStore });
  const acct = await near.account(s.accountId);
  accounts.set(who, acct);
  return acct;
}

/** Call the market contract as a server account. Returns { txHash, value, failure }. */
export async function callMarket(who, methodName, args, depositYocto = "0", gasTgas = 100) {
  const acct = await account(who);
  const out = await acct.functionCall({
    contractId: config.market, methodName, args,
    gas: BigInt(gasTgas) * 10n ** 12n, attachedDeposit: BigInt(depositYocto),
  });
  clearReadCache();
  const status = out.status || {};
  const failure = status.Failure ? JSON.stringify(status.Failure) : null;
  let value = null;
  if (typeof status.SuccessValue === "string" && status.SuccessValue) value = JSON.parse(Buffer.from(status.SuccessValue, "base64").toString());
  return { txHash: out.transaction.hash, signer: acct.accountId, value, failure };
}

export const serverAccountId = (who) => config.secrets[who]?.accountId || null;
