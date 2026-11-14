"use client";
import { useMethodTitles } from "../lib/labels";
import { useEffect, useState } from "react";
import { backend, request } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { ActionFeedback } from "./data-tools";
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
  const labels: Record<string, string> = {
    escrow_hold: "Payment held in escrow",
    release: "Payment released",
    stage_refund: "Payment refunded",
    timeout_reclaim: "Payment reclaimed",
  };
  return (
    <>
      <ActionFeedback error={error} />
      {!loaded && busy && <div className="note-row">Loading payments</div>}
      {loaded && !items.length && (
        <div className="note-row">No payments yet.</div>
      )}
      <div className="rows">
        {items.map((item, index) => (
          <div className="row" key={index}>
            <span className="two">
              <b>{labels[item.type] || item.type}</b>
              <span>
                {title(item.method_id)}
                {item.occurred_at
                  ? ", " + new Date(item.occurred_at).toLocaleString()
                  : ""}
              </span>
            </span>
            <span className="num">{item.amount?.display}</span>
            {item.tx_url && (
              <a
                className="view"
                href={item.tx_url}
                target="_blank"
                rel="noreferrer"
              >
                On NEAR
              </a>
            )}
          </div>
        ))}
      </div>
      {cursor && (
        <button
          className="view"
          disabled={busy}
          onClick={() => void load(cursor)}
        >
          {busy ? "Loading" : "Load more payments"}
        </button>
      )}
      {error && (
        <button
          className="view"
          disabled={busy}
          onClick={() => void load(cursor || undefined)}
        >
          Retry
        </button>
      )}
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
    <section className="card list-card">
      <div className="toolbar">
        <h2 className="list-title">Profile and preferences</h2>
      </div>
      <div className="dpane">
        <form
          className="nform"
          onSubmit={(e) => {
            e.preventDefault();
            void save("profile");
          }}
        >
          <label className="fx">
            <span className="fx-label">Display name</span>
            <input
              value={profile.display_name || ""}
              maxLength={120}
              onChange={(e) =>
                setProfile({ ...profile, display_name: e.target.value })
              }
            />
          </label>
          <label className="fx tall full">
            <span className="fx-label">About you</span>
            <textarea
              value={profile.bio || ""}
              maxLength={2000}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </label>
          <div className="nf-foot full">
            <button className="primary-btn" disabled={busy}>
              Save profile
            </button>
          </div>
        </form>
        {prefs && (
          <form
            className="nform"
            onSubmit={(e) => {
              e.preventDefault();
              void save("preferences");
            }}
          >
            <label className="fx tall full">
              <span className="fx-label">
                Preferred private models, one ID per line
              </span>
              <textarea
                value={models}
                onChange={(e) => setModels(e.target.value)}
              />
            </label>
            <div className="note-row full">
              Leave models empty to use each method’s allowed models.
              Preferences can narrow that list and do not give consent for a
              job.
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={prefs.reduced_motion}
                onChange={(e) =>
                  setPrefs({ ...prefs, reduced_motion: e.target.checked })
                }
              />
              <span>Prefer reduced motion</span>
            </label>
            <div className="nf-foot full">
              <button className="primary-btn" disabled={busy}>
                Save preferences
              </button>
            </div>
          </form>
        )}
        <ActionFeedback error={error} message={message} />
      </div>
    </section>
  );
}
