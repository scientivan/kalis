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
  let workspace = "kalis-web-demo";
  if (typeof window !== "undefined") {
    workspace =
      sessionStorage.getItem("kalis-backend-workspace") ||
      "web-" + crypto.randomUUID();
    sessionStorage.setItem("kalis-backend-workspace", workspace);
  }
  const r = await fetch("/api/backend/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kalis-Workspace": workspace,
      ...sessionHeader(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = await r.json();
  if (!r.ok)
    throw new Error(json.error?.message || "Backend operation failed.");
  return json as T;
}

/** Bearer header for a signed-in NEAR account (see lib/near/auth.tsx), or nothing. */
export function sessionHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const s = JSON.parse(sessionStorage.getItem("kalis-session") || "null");
    return s && Date.parse(s.expires_at) > Date.now() ? { Authorization: `Bearer ${s.token}` } : {};
  } catch { return {}; }
}
