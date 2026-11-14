// Seller tool: seal a method WASM to the Kalis runner's TEE key and store the blob
// where the backend serves it. The sealed blob is public; only the TEE can open it.
// Usage: node scripts/seal-method.mjs <method_id> <method.wasm>
import fs from "node:fs";
import path from "node:path";
import { config, METHODS_DIR } from "../src/config.js";
import { sealMethod, sha256Hex } from "../src/kalis-crypto.js";

const [methodId, wasmPath] = process.argv.slice(2);
const wasm = new Uint8Array(fs.readFileSync(wasmPath));
const codeHash = sha256Hex(wasm);
const dir = path.join(METHODS_DIR, methodId, "sealed");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${codeHash}.json`);
fs.writeFileSync(file, JSON.stringify({ method_id: methodId, code_hash: codeHash, tee_pubkey: config.runner.teePubkey, sealed: sealMethod(config.runner.teePubkey, wasm) }));
console.log(`sealed ${wasmPath} (sha256 ${codeHash}) -> ${file}`);
