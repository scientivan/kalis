// Who is calling. Two kinds:
// - near_account: a verified NEAR account, from a session created by signing a one-time challenge
//   (NEP-413, see auth.js). This is the only kind that proves ownership.
// - demo_workspace: the X-Kalis-Workspace header. Anyone can pick any value, so it is a demo label,
//   never proof of ownership, purchase, voting rights or a right to a bounty.
import * as db from "./db.js";

export class AuthError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

const WS = /^[A-Za-z0-9_-]{1,48}$/;

export function principal(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const s = db.get("sessions", auth.slice(7).trim());
    if (!s || s.revoked || Date.parse(s.expires_at) < Date.now()) throw new AuthError(401, "session_invalid", "The session is unknown or expired. Sign in again.");
    return { id: `near:${s.account_id}`, kind: "near_account", account_id: s.account_id, demo: false, session_id: s.id };
  }
  const ws = req.headers["x-kalis-workspace"];
  if (ws && WS.test(ws)) return { id: `demo:${ws}`, kind: "demo_workspace", account_id: null, demo: true };
  return { id: "demo:anonymous", kind: "demo_workspace", account_id: null, demo: true };
}

/** Require a verified NEAR account. */
export function requireAccount(req) {
  const p = principal(req);
  if (p.kind !== "near_account") throw new AuthError(401, "login_required", "Sign in with your NEAR account for this action. A demo workspace cannot do it.");
  return p;
}
