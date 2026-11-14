// What NEAR technology each page actually uses. Every line is checked against app/backend/src and app/web/src.
import type { NearItem } from "../components/controls";

const MARKET: NearItem = { name: "Method registry and escrow contract", detail: "market.scientivan.testnet on NEAR testnet keeps every method version, its code fingerprint and the payments." };
const TEE: NearItem = { name: "NEAR OutLayer TEE (Intel TDX)", detail: "Sealed methods run inside the scientivan.testnet/kalis-runner project. Your browser checks the attestation against the pinned build." };
const PRIVATE_TEE: NearItem = { name: "NEAR OutLayer TEE (Intel TDX)", detail: "The scientivan.testnet/kalis-private runner is the only place a method can use this data. Its attestation is checked against the pinned build." };
const AI: NearItem = { name: "NEAR AI Cloud private inference", detail: "Methods with AI call TEE-attested models, so prompts and answers stay sealed." };
const WALLET: NearItem = { name: "NEAR wallet", detail: "You sign in and approve every payment or vote yourself through NEAR Wallet Selector." };
const DAO: NearItem = { name: "Sputnik DAO", detail: "kalis-fund.sputnik-v2.testnet holds the community fund. Proposals, bounties and votes are on chain." };
const DEVICE: NearItem = { name: "Encrypted on this device", detail: "Your own copy is kept encrypted in this browser. This part is not a NEAR technology." };

export type NearPage = { label: string; items: NearItem[] };
export const NEAR_TECH = {
  marketplace: { label: "NEAR registry and OutLayer TEE", items: [MARKET, TEE, AI] },
  method: { label: "NEAR registry and OutLayer TEE", items: [MARKET, TEE, AI] },
  runs: { label: "NEAR escrow and OutLayer TEE", items: [{ ...MARKET, name: "Escrow contract", detail: "market.scientivan.testnet holds your payment and releases or refunds it when the run ends." }, TEE, WALLET] },
  connectors: { label: "NEAR OutLayer TEE", items: [PRIVATE_TEE, DEVICE] },
  documents: { label: "NEAR OutLayer TEE and NEAR AI", items: [PRIVATE_TEE, { name: "NEAR AI Cloud private inference", detail: "Scans and images are read by a TEE-attested vision model with a signed response." }, DEVICE] },
  notes: { label: "NEAR OutLayer TEE", items: [{ ...PRIVATE_TEE, detail: "Methods recall your notes only inside the scientivan.testnet/kalis-private runner. Its attestation is checked against the pinned build." }, DEVICE] },
  community: { label: "Sputnik DAO on NEAR", items: [DAO, WALLET] },
  activity: { label: "NEAR testnet payments", items: [{ name: "Escrow contract", detail: "Run payments and settlements shown here are transactions on market.scientivan.testnet." }] },
  account: { label: "NEAR wallet and escrow", items: [WALLET, { name: "Escrow contract", detail: "Your payment history is read from market.scientivan.testnet. Kalis keeps no balance for you." }, DAO] },
  author: { label: "NEAR registry and OutLayer TEE", items: [{ ...MARKET, detail: "Publishing signs a transaction to market.scientivan.testnet that records the version and its code fingerprint." }, { ...TEE, detail: "Your code is sealed in this browser and only opens inside the scientivan.testnet/kalis-runner TEE." }, WALLET] },
} satisfies Record<string, NearPage>;
