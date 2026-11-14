// Ciphertext-only relay. The runner, not the backend session, verifies private ownership.
import * as documents from "./protections/documents.js";
import { resolveManifest } from "./protections/routes.js";
import { principal } from "./principal.js";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { callRunner, checkAttestation } from "./outlayer.js";
import { ApiError } from "./market.js";
import * as db from "./db.js";
import { PRIVATE_RUNNER_HASH } from "./private-release.js";
const cfg = () => {
  const native = process.env.KALIS_PRIVATE_LOCAL_RUNNER;
  const enabled = !!native || process.env.KALIS_PRIVATE_ENABLED === "1";
  return {
    enabled:
      enabled &&
      (!!native ||
        (!!process.env.KALIS_PRIVATE_TEE_KEY &&
          !!process.env.KALIS_PRIVATE_RECEIPT_KEY)),
    mode: native ? "local_native" : "tee",
    protocol: "kalis-private/v1",
    ownership: "device-key",
    project: "scientivan.testnet/kalis-private",
    runner_hash: PRIVATE_RUNNER_HASH,
    tee_pubkey: process.env.KALIS_PRIVATE_TEE_KEY || null,
    receipt_pubkey: process.env.KALIS_PRIVATE_RECEIPT_KEY || null,
    native,
  };
};
// execFile's promise API has no stdin option. Feed exactly the sealed input without a shell.
async function runNative(input) {
  return await new Promise((resolve, reject) => {
    const child = execFile(
      process.env.KALIS_PRIVATE_LOCAL_RUNNER,
      [],
      {
        timeout: 180000,
        maxBuffer: 2_000_000,
        env: {
          ...process.env,
          PROTECTED_SEAL_KEY: process.env.KALIS_PRIVATE_DEV_SEAL_KEY,
        },
      },
      (error, stdout) => {
        if (error)
          return reject(
            new ApiError(
              502,
              "private_runner_failed",
              "The local private development runner failed.",
            ),
          );
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(
            new ApiError(
              502,
              "private_runner_failed",
              "The local private development runner returned an invalid response.",
            ),
          );
        }
      },
    );
    child.stdin.end(JSON.stringify(input));
  });
}
const loopback = (req) =>
  ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket?.remoteAddress);
export function registerPrivateRoutes(route) {
  route("POST", /^\/api\/public-documents$/, async (_q, _m, b, req) => {
    if (b?.public_document !== true)
      throw new ApiError(
        400,
        "public_consent_required",
        "Confirm that this is a public document before using backend extraction.",
      );
    const owner = principal(req);
    const ws =
      "public-" +
      crypto.createHash("sha256").update(owner.id).digest("hex").slice(0, 40);
    return documents.ingest(ws, {
      ...b,
      manifest: await resolveManifest(b.method_id, b.run_id, req),
    });
  });
  route("GET", /^\/api\/privacy\/config$/, async (_q, _m, _b, req) => {
    const c = cfg();
    if (c.native) {
      if (!loopback(req))
        throw new ApiError(
          403,
          "local_only",
          "Native development is available only on loopback.",
        );
      if (
        !process.env.KALIS_PRIVATE_DEV_SEAL_KEY ||
        !process.env.KALIS_PRIVATE_STATE_DIR
      )
        throw new ApiError(
          503,
          "private_dev_not_configured",
          "Use an isolated state directory and a throwaway development seal key.",
        );
      const pub = await runNative({ cmd: "pubkey" });
      c.tee_pubkey = pub.tee_pubkey;
      c.receipt_pubkey = pub.completion_pubkey;
    }
    const { native, ...publicConfig } = c;
    return {
      ...publicConfig,
      note: c.native
        ? "Local native development only. This is not a TEE."
        : "Private data is owned by this browser's signing key. Clearing browser data loses access. Activation requires a separate private runner and pinned keys.",
    };
  });
  route("POST", /^\/api\/privacy\/execute$/, async (_q, _m, b, req) => {
    const c = cfg();
    if (!c.enabled)
      throw new ApiError(
        503,
        "private_runner_unavailable",
        "Private protections are waiting for the new TEE runner to be activated. No plaintext fallback is used.",
      );
    if (
      !b ||
      Object.keys(b).length !== 1 ||
      !b.request ||
      Object.keys(b.request).sort().join(",") !== "ct,epk,nonce"
    )
      throw new ApiError(
        400,
        "sealed_request_required",
        "Send only a sealed private request.",
      );
    const s = b.request;
    const canonical = (v, n) =>
      typeof v === "string" &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(v) &&
      Buffer.from(v, "base64").toString("base64") === v &&
      (!n || Buffer.from(v, "base64").length === n);
    if (
      !canonical(s.epk, 32) ||
      !canonical(s.nonce, 12) ||
      !canonical(s.ct) ||
      s.ct.length > 1_650_000 ||
      Buffer.from(s.ct, "base64").length < 16
    )
      throw new ApiError(
        400,
        "sealed_request_required",
        "Invalid sealed private request.",
      );
    const input = { cmd: "protect", request: s };
    if (c.native) {
      if (!loopback(req))
        throw new ApiError(
          403,
          "local_only",
          "Native development is available only on loopback.",
        );
      if (
        !process.env.KALIS_PRIVATE_DEV_SEAL_KEY ||
        !process.env.KALIS_PRIVATE_STATE_DIR
      )
        throw new ApiError(
          503,
          "private_dev_not_configured",
          "The isolated private development runner is not configured.",
        );
      return { mode: "local_native", output: await runNative(input) };
    }
    return remotePrivate(input,c.project);
  });
}
// Relay retries reuse an OutLayer call. Only commitments and encrypted outputs are persisted.
const inFlight = new Map();
async function remotePrivate(input, project) {
 const key = crypto.createHash("sha256").update(JSON.stringify([input.request.epk,input.request.nonce,input.request.ct])).digest("hex");
 if (inFlight.has(key)) return inFlight.get(key);
 const task = (async()=>{
  const prior = db.get("private_calls",key);
  if (prior?.response) return prior.response;
  const r = await callRunner(input,{
   project, secretsRef:{profile:"private",account_id:"scientivan.testnet"},
   resumeCallId:prior?.call_id||null,
   onStarted:call_id=>db.put("private_calls",key,{id:key,call_id,status:"pending",created_at:prior?.created_at||db.nowIso()})
  });
  if(r.status!=="completed"||!r.output?.ok)throw new ApiError(502,"private_runner_refused","The private runner refused the encrypted request. Retry the same request or inspect its status before creating another.");
  const att=await checkAttestation(r.call_id,{inputText:r.inputText,output:r.output,runnerHash:PRIVATE_RUNNER_HASH});
  if(!att.executed_build_ok||!att.input_hash_ok||!att.output_hash_ok)throw new ApiError(502,"private_attestation_mismatch","The private execution does not match the pinned runner.");
  const response={mode:"tee",call_id:r.call_id,output:r.output};
  db.put("private_calls",key,{id:key,call_id:r.call_id,status:"completed",response,created_at:prior?.created_at||db.nowIso()});
  return response;
 })();
 inFlight.set(key,task);
 try{return await task;}finally{inFlight.delete(key);}
}
