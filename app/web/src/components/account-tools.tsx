"use client";
import { useMethodTitles } from "../lib/labels";
import { Fx } from "./form-kit";
import { icon } from "./shell";
import { useEffect, useState } from "react";
import { backend, request } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { ActionFeedback } from "./data-tools";
import { DayCards, ErrorPanel, SkeletonTiles, StatePanel, Summary, TileGrid } from "./tiles";
type Profile = { display_name?: string; bio?: string };
type Preferences = {
  default_models: string[] | null;
  reduced_motion: boolean;
  revision: number;
  note?: string;
};
type Payment = {
  type: string;
  run_id: string;
  method_id: string;
  amount?: { display?: string };
  tx_url?: string;
  occurred_at?: string;
};
export function PaymentHistory() {
  const [items, setItems] = useState<Payment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  async function load(next?: string) {
    setBusy(true);
    setError("");
    try {
      const data = await backend<{
        items: Payment[];
        next_cursor: string | null;
      }>(
        "me/transactions?limit=20" +
          (next ? "&cursor=" + encodeURIComponent(next) : ""),
      );
      setItems((old) => (next ? [...old, ...data.items] : data.items));
      setCursor(data.next_cursor);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payments.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const title = useMethodTitles();
  const labels: Record<string, [string, string]> = {
    escrow_hold: ["Paid into escrow", "lock"],
    release: ["Released to the expert", "check"],
    stage_refund: ["Refunded to you", "coins"],
    timeout_reclaim: ["Taken back after timeout", "coins"],
  };
  const sum = (types: string[]) => {
    let total = 0;
    for (const i of items) if (types.includes(i.type)) total += Number((i.amount?.display || "").replace(/[^0-9.]/g, "")) || 0;
    return `${Number(total.toFixed(4))} NEAR`;
  };
  return (
    <>
      {error && <ErrorPanel message={error} onRetry={() => void load(cursor || undefined)} title="We could not load your payments" />}
      {!loaded && busy && <TileGrid label="Loading payments"><SkeletonTiles count={3} /></TileGrid>}
      {loaded && !items.length && <TileGrid label="Payments"><StatePanel title="No payments yet" text="Each payment into escrow, release and refund appears here, grouped by day." /></TileGrid>}
      {!!items.length && <Summary cells={[["Paid into escrow", sum(["escrow_hold"])], ["Released to experts", sum(["release"])], ["Came back to you", sum(["stage_refund", "timeout_reclaim"])], ["Records shown", items.length]]} />}
      {!!items.length && <DayCards label="Payments by day" unit={["payment", "payments"]} lines={items.map((item, index) => ({
        id: `${item.run_id}-${item.type}-${index}`, at: item.occurred_at, icon: (labels[item.type] || ["", "coins"])[1],
        text: item.tx_url ? <a href={item.tx_url} target="_blank" rel="noreferrer">{(labels[item.type] || [item.type])[0]}, {title(item.method_id)}</a> : <>{(labels[item.type] || [item.type])[0]}, {title(item.method_id)}</>,
        aside: item.amount?.display,
      }))} />}
      {cursor && <div className="pager"><span>Showing {items.length} payment records</span><button className="view" disabled={busy} onClick={() => void load(cursor)}>{busy ? "Loading" : "Show older payments"}</button></div>}
    </>
  );
}
export function AccountEditors() {
  const auth = useNearAuth();
  const [profile, setProfile] = useState<Profile>({}),
    [prefs, setPrefs] = useState<Preferences | null>(null),
    [models, setModels] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!auth.session) return;
    Promise.all([
      backend<Profile>("me"),
      backend<Preferences>("me/preferences"),
    ])
      .then(([p, f]) => {
        setProfile(p);
        setPrefs(f);
        setModels(f.default_models?.join("\n") || "");
      })
      .catch((e) => setError(e.message));
  }, [auth.session]);
  async function save(kind: "profile" | "preferences") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (kind === "profile") {
        setProfile(
          await request<Profile>("me", "PATCH", {
            display_name: profile.display_name || "",
            bio: profile.bio || "",
          }),
        );
      } else if (prefs) {
        const r = await request<Preferences>("me/preferences", "PATCH", {
          default_models: models.trim()
            ? models
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : null,
          reduced_motion: prefs.reduced_motion,
          expected_revision: prefs.revision,
        });
        setPrefs(r);
      }
      setMessage("Changes saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }
  if (!auth.session) return null;
  return (
    <section className="card list-card se">
      <header className="se-head"><div><h2>Profile and Preferences</h2><span>What other people see about you, and how Kalis runs jobs for you.</span></div></header>
      <div className="se-panel">
        <div className="se-io">
        <form className="se-box" onSubmit={(e) => { e.preventDefault(); void save("profile"); }}>
          <header><b>{icon("m-person")}Public Profile</b><span>Shown next to your methods, reviews and proposals.</span></header>
          <Fx label="Display Name" hint="Up to 120 characters."><input value={profile.display_name || ""} maxLength={120} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></Fx>
          <Fx label="About You" hint="A short line about your expertise. Leave out private data."><textarea rows={3} value={profile.bio || ""} maxLength={2000} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></Fx>
          <div className="se-actions"><button className="primary-btn" disabled={busy}>Save profile</button></div>
        </form>
        {prefs && (
          <form className="se-box" onSubmit={(e) => { e.preventDefault(); void save("preferences"); }}>
            <header><b>{icon("lock")}Run Preferences</b><span>Preferences narrow what a method may use. They never give consent for a job.</span></header>
            <Fx label="Preferred Private Models" hint="One model ID per line. Leave empty to use each method's allowed models."><textarea rows={3} value={models} onChange={(e) => setModels(e.target.value)} /></Fx>
            <label className="consent"><input type="checkbox" checked={prefs.reduced_motion} onChange={(e) => setPrefs({ ...prefs, reduced_motion: e.target.checked })} /><span>Prefer reduced motion</span></label>
            <div className="se-actions"><button className="primary-btn" disabled={busy}>Save preferences</button></div>
          </form>
        )}
        </div>
        <ActionFeedback error={error} message={message} />
      </div>
    </section>
  );
}
