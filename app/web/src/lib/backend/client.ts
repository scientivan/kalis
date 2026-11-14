import { privateRequest } from "./private-client";
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };
export type ApiVersion = {
  method_kind?: {
    kind: string;
    label: string;
    uses_ai: boolean;
    buyer_note: string;
  };
  number: number;
  price_near: string;
  manifest_hash: string;
  code_hash: string;
  runner_hash: string;
  runnable: boolean;
  payout_split_pct: { seller: number; dao: number; platform: number };
  manifest: { steps: { id: string }[]; [key: string]: Json | { id: string }[] };
  parent?: number;
  contributors?: string[];
};
export type ApiMethod = {
  method_id: string;
  title: string;
  owner: string;
  latest: ApiVersion;
  versions?: ApiVersion[];
};
export type ApiConfig = {
  network: string;
  market: string;
  dao: string;
  runner: { tee_pubkey: string; completion_pubkey: string };
  demo_topup: { enabled: boolean; label: string; buyer_account: string };
};
export async function backend<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, body === undefined ? "GET" : "POST", body);
}
export async function request<T>(path: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  if (path.startsWith("protections/")) return privateRequest<T>(path, method, body as Record<string, any> | undefined);
  let workspace = "kalis-web-demo";
  if (typeof window !== "undefined") {
    workspace =
      sessionStorage.getItem("kalis-backend-workspace") ||
      "web-" + crypto.randomUUID();
    sessionStorage.setItem("kalis-backend-workspace", workspace);
  }
  const r = await fetch("/api/backend/api/" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Kalis-Workspace": workspace,
      ...sessionHeader(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  let json: { error?: { message?: string } } | null = null;
  try { json = await r.json(); } catch { json = null; }
  if (!r.ok || json === null)
    throw new Error(plainError(json?.error?.message, r.status));
  return json as T;
}

/**
 * Turns raw third-party or transport errors (RPC rate limits, provider hostnames, stack text)
 * into one plain sentence. Messages the Kalis backend wrote for people pass through unchanged.
 */
export function plainError(message?: string | null, status?: number): string {
  const m = (message || "").trim();
  if (!m) return status && status >= 500 ? "The Kalis service did not answer. Wait a moment, then try again." : "Something went wrong. Try again.";
  if (/rate.?limit|too many requests|429/i.test(m) || status === 429) return "The NEAR network service is busy right now. Wait a moment, then try again.";
  if (/fastnear|rpc\b|https?:\/\/|ECONN|ETIMEDOUT|fetch failed|socket|timeout/i.test(m)) return "We could not reach the NEAR network. Wait a moment, then try again.";
  return m;
}

/** Bearer header for a signed-in NEAR account (see lib/near/auth.tsx), or nothing. */
export function sessionHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const s = JSON.parse(sessionStorage.getItem("kalis-session") || "null");
    return s && Date.parse(s.expires_at) > Date.now() ? { Authorization: `Bearer ${s.token}` } : {};
  } catch { return {}; }
}
