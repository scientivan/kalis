// Kalis client sealing (Node built-ins only), matching app/kalis-runner.
// Seller: sealMethod(teePubHex, wasmBytes) -> sealed blob (publishable; only the TEE can open it).
// Buyer:  sealData(teePubHex, caseObj) -> { sealed, secret }; openAnswer(secret, runnerOutput) -> answer.
import crypto from "node:crypto";

const INFO = {
  method: Buffer.from("kalis/v1/method"),
  data: Buffer.from("kalis/v1/request"),
  answer: Buffer.from("kalis/v1/answer"),
};
const X25519_SPKI_PREFIX = Buffer.from("302a300506032b656e032100", "hex");
const rawPub = (k) => k.export({ type: "spki", format: "der" }).subarray(12);
const pubFromRaw = (raw) => crypto.createPublicKey({ key: Buffer.concat([X25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
const derive = (shared, epk, tpk, info) => Buffer.from(crypto.hkdfSync("sha256", shared, Buffer.concat([epk, tpk]), info, 32));

function enc(key, nonce, data) {
  const c = crypto.createCipheriv("chacha20-poly1305", key, nonce, { authTagLength: 16 });
  return Buffer.concat([c.update(data), c.final(), c.getAuthTag()]);
}
function dec(key, nonce, data) {
  const d = crypto.createDecipheriv("chacha20-poly1305", key, nonce, { authTagLength: 16 });
  d.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]);
}

function seal(teePubHex, bytes, info) {
  const tpk = Buffer.from(teePubHex, "hex");
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519");
  const epk = rawPub(publicKey);
  const shared = crypto.diffieHellman({ privateKey, publicKey: pubFromRaw(tpk) });
  const nonce = crypto.randomBytes(12);
  const ct = enc(derive(shared, epk, tpk, info), nonce, bytes);
  return { sealed: { epk: epk.toString("base64"), nonce: nonce.toString("base64"), ct: ct.toString("base64") }, secret: { shared, epk, tpk, ct } };
}

export const sealMethod = (teePubHex, wasm) => seal(teePubHex, Buffer.from(wasm), INFO.method).sealed;
export const sealData = (teePubHex, caseObj) => seal(teePubHex, Buffer.from(JSON.stringify(caseObj)), INFO.data);

export function openAnswer(secret, out) {
  if (!out.ok) throw new Error(`runner error: ${out.error}`);
  if (out.tee_pubkey !== secret.tpk.toString("hex")) throw new Error("answer came from a different TEE key");
  if (out.data_ct_sha256 !== crypto.createHash("sha256").update(secret.ct).digest("hex")) throw new Error("answer is for a different request");
  const pt = dec(derive(secret.shared, secret.epk, secret.tpk, INFO.answer), Buffer.from(out.nonce, "base64"), Buffer.from(out.ct, "base64"));
  return JSON.parse(pt.toString().trimEnd()); // { method_sha256, manifest_sha256, answer, report }
}

// ---------------------------------------------------------------------------
// Buyer-side recheck for the portfolio method. Runs on the buyer's device with
// the buyer's own data, after the answer is opened. It can catch an answer that
// breaks a limit or misstates the cost. It cannot prove the answer is the
// cheapest, because that needs the seller's method.
// Returns { passed, checks: [{ id, ok, message }] }. Messages are plain
// sentences a UI can show as they are.
const fmt = (x) => Number(x).toFixed(2);
export function recheckPortfolio(data, answer) {
  const checks = [];
  const add = (id, ok, message) => checks.push({ id, ok, message });
  if (answer.status === "infeasible") {
    add("status", true, "The method found no trade that meets every limit. Kalis cannot confirm this on your device, so treat it as the method's claim.");
    return { passed: true, checks, unverifiable: ["infeasible"] };
  }
  if (answer.status !== "feasible" || !Array.isArray(answer.delta)) {
    add("status", false, "The method did not return a usable answer.");
    return { passed: false, checks };
  }
  const d = answer.delta, n = data.holdings.length;
  if (d.length !== n || !d.every(Number.isInteger)) {
    add("shape", false, `The answer lists ${d.length} trades for ${n} assets, or uses partial units.`);
    return { passed: false, checks };
  }
  const name = (i) => `Asset ${String.fromCharCode(65 + i)}`;
  const cost = d.reduce((s, x, i) => s + Math.abs(x) * data.prices[i] * data.fee_rates[i] + (x ? data.fixed_fees[i] : 0), 0);
  const values = data.holdings.map((h, i) => (h + d[i]) * data.prices[i]);
  const cash = data.cash - d.reduce((s, x, i) => s + x * data.prices[i], 0) - cost;
  const nav = values.reduce((a, b) => a + b, 0) + cash;
  const eps = 1e-6;
  d.forEach((x, i) => {
    if (x < -data.holdings[i]) add(`no_short_${i}`, false, `${name(i)} would sell ${-x} units but you only hold ${data.holdings[i]}.`);
    if (x > data.buy_limit) add(`buy_limit_${i}`, false, `${name(i)} would buy ${x} units, above your limit of ${data.buy_limit}.`);
    if (x < 0 && !data.allow_sell) add(`no_sell_${i}`, false, `${name(i)} would be sold, but you did not allow selling.`);
  });
  add("cash_minimum", cash >= data.reserve - eps, cash >= data.reserve - eps
    ? `Cash after the trades is ${fmt(cash)}, at or above your minimum of ${fmt(data.reserve)}.`
    : `Cash after the trades would be ${fmt(cash)}, below your minimum of ${fmt(data.reserve)}.`);
  values.forEach((v, i) => {
    const share = v / nav, ok = share >= data.lower[i] - eps && share <= data.upper[i] + eps;
    add(`share_${i}`, ok, ok
      ? `${name(i)} ends at ${(share * 100).toFixed(1)}% of the portfolio, inside your ${data.lower[i] * 100}% to ${data.upper[i] * 100}% range.`
      : `${name(i)} would end at ${(share * 100).toFixed(1)}% of the portfolio, outside your ${data.lower[i] * 100}% to ${data.upper[i] * 100}% range.`);
  });
  const sector = (values[0] + values[1]) / nav, sectorOk = sector <= data.sector_cap + eps;
  add("sector_cap", sectorOk, sectorOk
    ? `Assets A and B together end at ${(sector * 100).toFixed(1)}%, within your ${data.sector_cap * 100}% cap.`
    : `Assets A and B together would end at ${(sector * 100).toFixed(1)}%, above your ${data.sector_cap * 100}% cap.`);
  const costOk = Math.abs(cost - answer.cost) < 1e-6;
  add("cost_matches", costOk, costOk
    ? `The stated cost of ${fmt(answer.cost)} matches the cost your device calculated.`
    : `The method says the cost is ${fmt(answer.cost)}, but your device calculates ${fmt(cost)}.`);
  return { passed: checks.every((c) => c.ok), checks, unverifiable: ["cheapest"] };
}

// ---------------------------------------------------------------------------
// Completion record: public, signed inside the TEE, read by the escrow contract.
export const COMPLETION_PREFIX = "kalis-completion:v1:";
export function verifyCompletion(out, expectedPubkeyHex) {
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(out.completion_pubkey, "hex")]), format: "der", type: "spki" });
  const sigOk = crypto.verify(null, Buffer.from(COMPLETION_PREFIX + out.completion), pub, Buffer.from(out.completion_sig, "hex"));
  return { sigOk, keyOk: !expectedPubkeyHex || out.completion_pubkey === expectedPubkeyHex, record: JSON.parse(out.completion) };
}
