"use client";
import { useEffect, useState } from "react";
import { backend } from "./backend/client";

// Plain-language labels for backend states, so pages never show raw codes such as "awaiting_signature".
const STATUS: Record<string, string> = {
  released: "Paid to the expert", refunded: "Refunded", executed: "Answer ready", executing: "Running",
  execution_failed: "Run stopped, retry or reclaim", paid: "Paid into escrow", payment_failed: "Payment failed",
  settle_failed: "Payment release failed", reclaimed: "Reclaimed", created: "Waiting for payment",
  awaiting_signature: "Waiting for your signature", InProgress: "Voting open", Approved: "Approved",
  Rejected: "Rejected", Removed: "Removed", Expired: "Expired", Moved: "Moved",
  open: "Open", proposed: "Funding proposed", funded: "Funded", closed: "Closed", resolved: "Resolved",
  draft: "In progress", ready: "Ready to publish", publishing: "Waiting for your signature", published: "Published",
  active: "Active", revoked: "Revoked", expired: "Expired", pending: "Pending", approved: "Approved", rejected: "Rejected",
  passed: "Passed", failed: "Failed", running: "Running", queued: "Queued", succeeded: "Done",
};
export function statusLabel(s?: string | null): string {
  if (!s) return "";
  if (STATUS[s]) return STATUS[s];
  const t = s.replace(/[_-]+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

let titles: Promise<Record<string, string>> | null = null;
/** Marketplace titles by method id, loaded once per tab. Falls back to the id while loading or on error. */
export function useMethodTitles(): (id?: string | null) => string {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    titles ??= backend<{ method_id: string; latest?: { manifest?: { listing?: { title?: string } } }; title?: string }[]>("methods")
      .then((ms) => Object.fromEntries(ms.map((m) => [m.method_id, m.latest?.manifest?.listing?.title || m.title || m.method_id])))
      .catch(() => { titles = null; return {}; });
    titles.then((m) => { if (alive) setMap(m); });
    return () => { alive = false; };
  }, []);
  return (id) => (id ? map[id] || id : "");
}
