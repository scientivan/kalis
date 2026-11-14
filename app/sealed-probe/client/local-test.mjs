// Local round-trip: seal 12 cases, run the native build with a throwaway key,
// open the answers, compare with the Python oracle results.
// Usage: node client/local-test.mjs <native-binary>
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { seal, open } from "./sealed.mjs";

const bin = process.argv[2];
const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
const expected = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/method-results.json", import.meta.url)));
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex") };
const call = (obj) => JSON.parse(execFileSync(bin, { input: JSON.stringify(obj), env }).toString());

const { tee_pubkey } = call({ cmd: "pubkey" });
let pass = 0;
for (const c of cases) {
  const { id, ...data } = c;
  const { request, secret } = seal(tee_pubkey, data);
  const wire = JSON.stringify(request);
  if (wire.includes(String(data.cash)) && wire.includes("holdings")) throw new Error("plaintext leaked");
  const response = call(request);
  const got = open(secret, response);
  const exp = expected.find((e) => e.id === id);
  const expStatus = exp.oracle ? "feasible" : "infeasible";
  const ok = got.status === expStatus &&
    (got.status === "infeasible" || Math.abs(got.cost - exp.oracle.cost) < 1e-6);
  pass += ok;
  console.log(id, ok ? "OK" : "MISMATCH", got.status, got.delta ?? "", got.cost ?? "");
}
console.log(`${pass}/${cases.length} match the Python oracle`);
