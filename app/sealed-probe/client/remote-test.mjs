// Seal one case, run it on OutLayer testnet (on-chain mode), open the answer.
// In on-chain mode the input sits in a public transaction and the output in a
// public callback, so this is a stricter test than the HTTPS path: anyone,
// including the coordinator and every chain observer, sees the same bytes.
// Usage: node client/remote-test.mjs <tee_pubkey_hex> <case_id> <workdir>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { seal, open } from "./sealed.mjs";

const [teePub, caseId, workdir] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const { id, ...data } = cases.find((c) => c.id === caseId);
const { request, secret } = seal(teePub, data);
const reqPath = path.join(workdir, `request-${id}.json`);
fs.writeFileSync(reqPath, JSON.stringify(request));
console.log("PLAINTEXT (stays on buyer machine):", JSON.stringify(data));
console.log("SENT (what OutLayer sees):", JSON.stringify(request).slice(0, 160) + "...");

const out = execFileSync("outlayer", ["run", "scientivan.testnet/sealed-probe", "--input", reqPath,
  "--secrets-profile", "default", "--secrets-account", "scientivan.testnet"], { encoding: "utf8" });
const tx = out.match(/Tx: (\S+)/)?.[1];
const response = JSON.parse(out.slice(out.indexOf("{")));
console.log("TX:", tx);
console.log("RETURNED (what OutLayer sees):", JSON.stringify(response).slice(0, 160) + "...");
console.log("OPENED BY BUYER:", JSON.stringify(open(secret, response)));
