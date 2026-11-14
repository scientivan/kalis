// Backend configuration. Public values are constants; secrets come from app/backend/.env.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const METHODS_DIR = path.resolve(ROOT, "../methods");
export const DATA_DIR = process.env.KALIS_DATA_DIR ? path.resolve(process.env.KALIS_DATA_DIR) : path.resolve(ROOT, "data"); // KALIS_DATA_DIR lets a second server run without sharing state

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, ".env"));
loadEnv(path.resolve(ROOT, "../../.env")); // Product/.env holds NEAR_API_KEY

export const config = {
  network: "testnet",
  rpc: process.env.NEAR_RPC || "https://rpc.testnet.fastnear.com",
  explorer: "https://explorer.testnet.near.org",
  market: process.env.MARKET_CONTRACT || "market.scientivan.testnet",
  outlayerApi: "https://testnet-api.outlayer.ai",
  runner: {
    project: "scientivan.testnet/kalis-runner",
    secretsRef: { profile: "default", account_id: "scientivan.testnet" },
    // X25519 key the runner seals to. Stable across runner builds (the keystore lock moves with the build).
    teePubkey: "d4dd5b661d908c178ab83ab17e1317b42d9521f37d5220fb51ad8d1f2ce3753e",
    // SHA-256 of the runner WASM build that new versions are published against (runner 0.5).
    buildHash: "823e991364e83b70dd0521aa1cdfd876b89436398b872a89da7e6af399a7647d",
    keyVersion: 1,
  },
  port: Number(process.env.PORT || 8787),
  publicBase: process.env.PUBLIC_BASE || `http://localhost:${process.env.PORT || 8787}`,
  nearAi: { base: "https://cloud-api.near.ai/v1", visionModel: "Qwen/Qwen3-VL-30B-A3B-Instruct", textModel: "deepseek-ai/DeepSeek-V4.1-Flash-1017", piiModel: "openai/privacy-filter" },
  corsOrigin: process.env.CORS_ORIGIN || "*",
  secrets: {
    demoBuyer: process.env.DEMO_BUYER_ACCOUNT && { accountId: process.env.DEMO_BUYER_ACCOUNT, key: process.env.DEMO_BUYER_KEY },
    settler: process.env.SETTLER_ACCOUNT && { accountId: process.env.SETTLER_ACCOUNT, key: process.env.SETTLER_KEY },
    outlayerPaymentKey: process.env.OUTLAYER_PAYMENT_KEY,
    nearAiKey: process.env.NEAR_API_KEY,
    credentialKey: process.env.CREDENTIAL_KEY,
    mockBrokerToken: process.env.MOCK_BROKER_TOKEN,
  },
};
