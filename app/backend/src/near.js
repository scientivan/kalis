// NEAR access: read-only views over RPC, and signed calls for the two server accounts
// (the demo buyer behind the mock fiat top-up, and the settler that submits completion records).
import { connect, keyStores, KeyPair } from "near-api-js";
import { config } from "./config.js";

export async function rpc(method, params) {
  const r = await fetch(config.rpc, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw Object.assign(new Error(j.error.cause?.info?.error_message || j.error.message || "RPC error"), { code: "rpc_error" });
  return j.result;
}

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
  const status = out.status || {};
  const failure = status.Failure ? JSON.stringify(status.Failure) : null;
  let value = null;
  if (typeof status.SuccessValue === "string" && status.SuccessValue) value = JSON.parse(Buffer.from(status.SuccessValue, "base64").toString());
  return { txHash: out.transaction.hash, signer: acct.accountId, value, failure };
}

export const serverAccountId = (who) => config.secrets[who]?.accountId || null;
