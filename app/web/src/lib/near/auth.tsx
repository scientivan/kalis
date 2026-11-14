"use client";
// NEAR sign-in for Kalis (testnet). Flow: the wallet selector connects a wallet, the backend issues a
// one-time NEP-413 challenge, the wallet signs it with a full access key, and the backend returns a
// session token. The token is kept in sessionStorage (cleared when the tab closes) and sent as a
// Bearer header through the same-origin proxy. Only the backend decides who owns what.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { WalletSelector } from "@near-wallet-selector/core";
import { Buffer } from "buffer";

export const SESSION_KEY = "kalis-session";
type Session = { token: string; account_id: string; expires_at: string };
type Auth = { session: Session | null; busy: boolean; error: string; signIn: () => Promise<void>; signOut: () => Promise<void>; clearError: () => void };
const Ctx = createContext<Auth | null>(null);

export function readSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null") as Session | null;
    return s && Date.parse(s.expires_at) > Date.now() ? s : null;
  } catch { return null; }
}
async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const r = await fetch("/api/backend/api/" + path, {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || "Sign in failed.");
  return j as T;
}

export function NearAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selector = useRef<Promise<WalletSelector> | null>(null);
  useEffect(() => { setSession(readSession()); }, []);

  const getSelector = useCallback(() => {
    selector.current ||= (async () => {
      const [{ setupWalletSelector }, { setupMyNearWallet }, { setupMeteorWallet }] = await Promise.all([
        import("@near-wallet-selector/core"), import("@near-wallet-selector/my-near-wallet"), import("@near-wallet-selector/meteor-wallet"),
      ]);
      return setupWalletSelector({ network: "testnet", modules: [setupMyNearWallet(), setupMeteorWallet()] });
    })();
    return selector.current;
  }, []);

  const signIn = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const sel = await getSelector();
      const { setupModal } = await import("@near-wallet-selector/modal-ui");
      if (!sel.isSignedIn()) {
        const modal = setupModal(sel, { contractId: "", theme: "light", description: "Sign in to Kalis on NEAR testnet." } as never);
        modal.show();
        await new Promise<void>((resolve, reject) => {
          const sub = sel.store.observable.subscribe((st) => { if (st.accounts.length) { sub.unsubscribe(); resolve(); } });
          modal.on("onHide", ({ hideReason }) => { if (hideReason === "user-triggered") { sub.unsubscribe(); reject(new Error("Sign in was cancelled.")); } });
        });
      }
      const wallet = await sel.wallet();
      const account = (await wallet.getAccounts())[0]?.accountId;
      if (!account) throw new Error("The wallet did not return an account.");
      const ch = await post<{ challenge_id: string; message: string; nonce: string; recipient: string }>("auth/challenge", { account_id: account });
      if (!("signMessage" in wallet) || typeof wallet.signMessage !== "function") throw new Error("This wallet cannot sign a sign-in message. Try MyNearWallet or Meteor.");
      const signed = await wallet.signMessage({ message: ch.message, recipient: ch.recipient, nonce: Buffer.from(ch.nonce, "base64") });
      if (!signed || !signed.signature) throw new Error("The wallet did not return a signature.");
      const v = await post<{ session_token: string; account_id: string; expires_at: string }>("auth/verify", {
        challenge_id: ch.challenge_id, account_id: account, public_key: signed.publicKey, signature: signed.signature,
      });
      const s = { token: v.session_token, account_id: v.account_id, expires_at: v.expires_at };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); setSession(s);
    } catch (e) { setError(e instanceof Error ? e.message : "Sign in failed."); }
    finally { setBusy(false); }
  }, [getSelector]);

  const signOut = useCallback(async () => {
    const s = readSession();
    sessionStorage.removeItem(SESSION_KEY); setSession(null);
    if (s) await post("auth/logout", {}, s.token).catch(() => undefined);
    try { const sel = await getSelector(); if (sel.isSignedIn()) await (await sel.wallet()).signOut(); } catch { /* wallet already gone */ }
  }, [getSelector]);

  return <Ctx.Provider value={{ session, busy, error, signIn, signOut, clearError: () => setError("") }}>{children}</Ctx.Provider>;
}
export function useNearAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNearAuth needs NearAuthProvider");
  return c;
}
