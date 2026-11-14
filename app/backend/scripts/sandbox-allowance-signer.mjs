// Sandbox signer for the Wallet allowance. Signs ONE action from the sandbox sub-account only when
// (1) its recomputed action hash is in the approvable list from wallet-allowance-guard, (2) the owner
// approved that exact hash, and (3) the amount fits the sandbox balance on chain. The agent never holds
// the owner's main key; the sandbox key can lose at most the sandbox balance.
// Usage:
//   node scripts/sandbox-allowance-signer.mjs sign <answer.json> <action id> --owner-approves <hash>
//   node scripts/sandbox-allowance-signer.mjs raw-transfer <receiver> <near>   (bypass the guard, to show the chain still refuses over-balance)
//   node scripts/sandbox-allowance-signer.mjs fc-key-transfer <receiver> <near> (try a transfer with a function-call key)
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { KeyPair, connect, keyStores, utils } from "near-api-js";

const SANDBOX = "allowance.auth-test.scientivan.testnet";
const RPC = "https://rpc.testnet.fastnear.com";
const [mode, ...rest] = process.argv.slice(2);
const credFile = (f) => JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${f}`, "utf8"));
async function account(keyFile) {
  const ks = new keyStores.InMemoryKeyStore();
  await ks.setKey("testnet", SANDBOX, KeyPair.fromString(credFile(keyFile).private_key));
  return (await connect({ networkId: "testnet", nodeUrl: RPC, keyStore: ks })).account(SANDBOX);
}
const log = (o) => console.log(JSON.stringify(o, null, 2));

if (mode === "sign") {
  const [answerFile, id, flag, ownerHash] = rest;
  const answer = JSON.parse(fs.readFileSync(answerFile, "utf8"));
  const item = (answer.approvable || []).find((a) => a.id === id);
  if (!item) { log({ refused: true, reason: `action ${id} is not in the approvable list (it was BLOCKED or unknown)` }); process.exit(2); }
  const canon = `${item.signer}|${item.kind}|${item.receiver.toLowerCase()}|${item.method}|${item.amount_yocto}|${item.id}`;
  const hash = crypto.createHash("sha256").update(canon).digest("hex");
  if (hash !== item.action_hash) { log({ refused: true, reason: "action hash does not match the action" }); process.exit(2); }
  if (flag !== "--owner-approves" || ownerHash !== hash) { log({ refused: true, reason: "the owner has not approved this exact action hash", action_hash: hash }); process.exit(2); }
  if (item.kind !== "transfer" || item.signer !== SANDBOX) { log({ refused: true, reason: "this signer only sends transfers from the sandbox" }); process.exit(2); }
  const acct = await account(`${SANDBOX}.json`);
  const bal = BigInt((await acct.getAccountBalance()).available);
  if (BigInt(item.amount_yocto) > bal) { log({ refused: true, reason: "amount is above the sandbox balance" }); process.exit(2); }
  const tx = await acct.sendMoney(item.receiver, BigInt(item.amount_yocto));
  log({ signed: true, signer: SANDBOX, receiver: item.receiver, amount_near: item.amount_near, action_hash: hash, tx: tx.transaction.hash, status: tx.status });
} else if (mode === "raw-transfer" || mode === "fc-key-transfer") {
  const [receiver, near] = rest;
  const keyFile = mode === "raw-transfer" ? `${SANDBOX}.json` : `${SANDBOX}.fc-key.json`;
  const acct = await account(keyFile);
  try {
    const tx = await acct.sendMoney(receiver, BigInt(utils.format.parseNearAmount(near)));
    log({ mode, sent: true, tx: tx.transaction.hash, status: tx.status });
  } catch (e) {
    log({ mode, sent: false, refused_by: "NEAR testnet", error_type: e.type || null, error: String(e.message).slice(0, 400) });
  }
} else throw new Error("usage: sign | raw-transfer | fc-key-transfer");
