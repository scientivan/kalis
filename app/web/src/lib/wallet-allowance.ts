/**
 * Wallet allowance: the policy an AI agent spends under. The real hard limit is the sandbox sub-account
 * balance (funded with exactly the cap). A function-call access key allowance only pays gas and cannot
 * move NEAR, so it is never used as the spending limit. The policy becomes the `allowance` input of the
 * wallet-allowance-guard method, which returns ALLOW, WARN or BLOCK per proposed action.
 */
export type AllowancePeriod = "day" | "week" | "month";
export type AllowancePolicy = {
  owner: string;
  name: string;
  cap_near: number;
  period: AllowancePeriod;
  per_action_max_near: number;
  allowed_recipients: string[];
  allowed_contracts: string[];
  allowed_methods: string[];
  expires_at: string;
};
export const GUARD_METHOD_ID = "wallet-allowance-guard";
export const STORAGE_RESERVE_NEAR = 0.002; // an account with one key locks about 0.00182 NEAR for storage

export const defaultPolicy = (owner = ""): AllowancePolicy => ({
  owner, name: "allowance", cap_near: 0.15, period: "week", per_action_max_near: 0.05,
  allowed_recipients: [], allowed_contracts: [], allowed_methods: [],
  expires_at: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) + "T00:00:00Z",
});

export const sandboxAccount = (p: AllowancePolicy) => `${p.name}.${p.owner}`;
const ACCOUNT = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
export const splitList = (s: string) => s.split(/[\s,]+/).map(x => x.trim().toLowerCase()).filter(Boolean);

export function policyErrors(p: AllowancePolicy): string[] {
  const e: string[] = [];
  if (!ACCOUNT.test(p.owner)) e.push("Sign in with the wallet that will own the sandbox.");
  if (!/^[a-z\d-]{2,32}$/.test(p.name)) e.push("The sandbox name uses 2 to 32 lowercase letters, digits or dashes.");
  if (!(p.cap_near > 0)) e.push("The cap must be above 0 NEAR.");
  if (!(p.per_action_max_near > 0) || p.per_action_max_near > p.cap_near) e.push("The per-action max must be above 0 and not above the cap.");
  if (!p.allowed_recipients.length && !p.allowed_contracts.length) e.push("Allow at least one recipient or contract.");
  for (const a of [...p.allowed_recipients, ...p.allowed_contracts]) if (!ACCOUNT.test(a)) e.push(`${a} is not a NEAR account name.`);
  if (p.allowed_contracts.length && !p.allowed_methods.length) e.push("Name the contract methods the agent may call.");
  if (!(Date.parse(p.expires_at) > Date.now())) e.push("The expiry must be in the future.");
  return e;
}

/** The `allowance` object the guard method reads. Balance and spend come from the chain at run time. */
export const guardInput = (p: AllowancePolicy, balance_near: number, spent_in_period_near = 0) => ({
  sandbox_account: sandboxAccount(p), cap_near: p.cap_near, period: p.period, spent_in_period_near, balance_near,
  per_action_max_near: p.per_action_max_near, allowed_recipients: p.allowed_recipients,
  allowed_contracts: p.allowed_contracts, allowed_methods: p.allowed_methods,
  expires_at: p.expires_at, now: new Date().toISOString().slice(0, 19) + "Z",
});

/** near-cli-rs commands the owner runs. The owner's main key never reaches the agent. */
export const setupCommands = (p: AllowancePolicy) => {
  const s = sandboxAccount(p);
  return {
    create: `near account create-account fund-myself ${s} '${p.cap_near} NEAR' autogenerate-new-keypair save-to-legacy-keychain sign-as ${p.owner} network-config testnet sign-with-legacy-keychain send`,
    topUp: `near tokens ${p.owner} send-near ${s} '<amount> NEAR' network-config testnet sign-with-legacy-keychain send`,
    revoke: `near account delete-account ${s} beneficiary ${p.owner} network-config testnet sign-with-legacy-keychain send`,
  };
};
