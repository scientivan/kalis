"use client";
// Seller view: the signed-in account's listed methods and drafts, with the Marketplace card picture.
import { statusLabel } from "../lib/labels";
import { useEffect, useState } from "react";
import { useNearAuth } from "../lib/near/auth";
import { sessionHeader } from "../lib/backend/client";
import { Segmented } from "./controls";
import { Capability } from "./capability";
import { SellerEditor } from "./seller-editor";
import Link from "next/link";

type Mine = { account_id: string; listed: { method_id: string; title: string; version_count: number }[]; drafts: { id: string; method_id: string; title: string; state: string }[] };
type Row = { method_id: string; title: string; note: string; draft_id?: string };
const MAX_SIDE = 320;

/** Crop to a centred square, scale to 320px and encode as WebP (PNG fallback), so uploads stay small. */
async function toSquare(file: File): Promise<{ mime: string; base64: string }> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas"); c.width = c.height = Math.min(MAX_SIDE, side);
  c.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, c.width, c.height);
  let url = c.toDataURL("image/webp", 0.86);
  if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/png");
  const [head, base64] = url.split(",");
  return { mime: head.slice(5, head.indexOf(";")), base64 };
}

type MyMethodsProps = { section: "Drafts" | "Published"; covers: Record<string, string | null>; onChanged: () => void };
export function MyMethods(props: MyMethodsProps) { return <Capability id="seller_publication"><MyMethodsContent {...props} /></Capability>; }
function MyMethodsContent({ covers, onChanged, section }: MyMethodsProps) {
  const { session, busy, error, signIn } = useNearAuth();
  const [mine, setMine] = useState<Mine | null>(null);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState({ method_id: "", title: "", kind: "Program", category: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState(""); const [saving, setSaving] = useState(false);
  async function createDraft(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setFormMsg("");
    try {
      const r = await fetch("/api/backend/api/method-drafts", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...sessionHeader() }, body: JSON.stringify({ ...form, kind: form.kind === "Prompt" ? "prompt" : "wasm" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Could not create the draft.");
      setForm({ method_id: "", title: "", kind: "Program", category: "", description: "" }); setFormMsg("Draft created."); setEditing(j.id); setCreating(false); setReload(n => n + 1);
    } catch (err) { setFormMsg(err instanceof Error ? err.message : "Could not create the draft."); } finally { setSaving(false); }
  }
  useEffect(() => {
    if (!session) { setMine(null); return; }
    let active = true; setLoadError("");
    fetch("/api/backend/api/me/methods", { cache: "no-store", headers: sessionHeader() })
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Could not load your methods."); if (active) setMine(j); })
      .catch(e => { if (active) setLoadError(e.message); });
    return () => { active = false; };
  }, [session, reload]);

  async function newVersion(methodId: string) {
    setSaving(true); setLoadError("");
    try {
      const detailResponse = await fetch(`/api/backend/api/methods/${encodeURIComponent(methodId)}`, { cache: "no-store", headers: sessionHeader() });
      const detail = await detailResponse.json();
      if (!detailResponse.ok) throw new Error(detail.error?.message || "Could not load this method.");
      const version = detail.versions[detail.versions.length - 1];
      const manifest = version.manifest;
      const response = await fetch("/api/backend/api/method-drafts", { method: "POST", headers: { "Content-Type": "application/json", ...sessionHeader() }, body: JSON.stringify({ method_id: methodId, kind: version.method_kind?.kind || manifest.kind || "wasm", title: detail.title, description: manifest.listing?.outcome || "", category: manifest.listing?.category || "" }) });
      const draft = await response.json();
      if (!response.ok) throw new Error(draft.error?.message || "Could not create a version draft.");
      const updated = await fetch(`/api/backend/api/method-drafts/${encodeURIComponent(draft.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...sessionHeader() }, body: JSON.stringify({ expected_revision: draft.revision, manifest, parent: version.number, price_yocto: version.price, dao_share_pct: version.dao_share_pct }) });
      const saved = await updated.json();
      if (!updated.ok) throw new Error(saved.error?.message || "The version draft was created but its settings could not be copied. Open it from Drafts to continue.");
      setEditing(draft.id); setReload(n => n + 1);
    } catch (err) { setLoadError(err instanceof Error ? err.message : "Could not create a version draft."); }
    finally { setSaving(false); }
  }

  async function upload(id: string, file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setStatus(s => ({ ...s, [id]: "Use a PNG, JPEG or WebP picture." })); return; }
    setStatus(s => ({ ...s, [id]: "Uploading" }));
    try {
      const img = await toSquare(file);
      const r = await fetch(`/api/backend/api/methods/${encodeURIComponent(id)}/cover`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...sessionHeader() }, body: JSON.stringify(img) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Upload failed.");
      setStatus(s => ({ ...s, [id]: "Picture saved" })); onChanged();
    } catch (e) { setStatus(s => ({ ...s, [id]: e instanceof Error ? e.message : "Upload failed." })); }
  }

  if (!session) return <section className="card ph signin-card"><div><h1>{section}</h1><p>Sign in with your NEAR testnet wallet to manage your methods and their pictures.</p>{error && <p role="alert" className="form-error">{error}</p>}</div><button className="primary-btn" onClick={signIn} disabled={busy}>{busy ? "Waiting for wallet" : "Sign in with NEAR"}</button></section>;

  const rows: Row[] = !mine ? [] : section === "Published"
    ? mine.listed.map(m => ({ method_id: m.method_id, title: m.title, note: `Published, version ${m.version_count}` }))
    : mine.drafts.filter(d => d.state !== "published").map(d => ({ method_id: d.method_id, draft_id: d.id, title: d.title, note: statusLabel(d.state) }));
  return <>
    <section className="card ph"><div><h1>{section}</h1><div className="note-row">{section === "Drafts" ? "Prepare methods before publishing them. Drafts are not available to buyers." : "Manage methods already published on NEAR and their Marketplace pictures."}</div></div></section>
    <section className="card list-card"><div className="toolbar"><h2 className="list-title">{section}</h2>{section === "Drafts" && <button className="primary-btn" onClick={() => setCreating(true)}>Create method</button>}</div>
      {loadError && <p role="alert" className="form-error pad">{loadError}</p>}
      {!mine && !loadError && <p className="pad">Loading your methods</p>}
      {mine && !rows.length && <p className="pad">No methods in this section yet.</p>}
      <div className="mine-list">{rows.map(r => <div className="mine-row" key={r.draft_id || r.method_id}>
        {covers[r.method_id] ? <img className="mine-cover" src={covers[r.method_id]!} alt="" /> : <span className="mine-cover empty" aria-hidden="true">{r.title.slice(0, 1)}</span>}
        <span className="two">{section === "Published" ? <Link href={`/marketplace/${encodeURIComponent(r.method_id)}`}><b>{r.title}</b></Link> : <b>{r.title}</b>}<span>{r.note}</span></span>
        {r.draft_id && <button className="view" onClick={() => setEditing(r.draft_id!)}>Open draft</button>}
        {section === "Published" && <button className="view" disabled={saving} onClick={() => void newVersion(r.method_id)}>New version</button>}
        <span className="mine-status" role="status">{status[r.method_id] || ""}</span>
        <label className="view file-btn">Change picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => upload(r.method_id, e.target.files?.[0])} /></label>
      </div>)}</div>
    </section>
    {editing && <SellerEditor key={editing} id={editing} onClose={() => setEditing(null)} onChanged={() => { setReload(n => n + 1); onChanged(); }} />}
    {section === "Drafts" && creating && <section className="card list-card" id="new"><div className="toolbar"><h2 className="list-title">Create method</h2></div>
      <form className="nform" onSubmit={createDraft}>
        <label className="fx"><span className="fx-label">Method ID</span><input required pattern="[A-Za-z0-9_-]{3,48}" title="3 to 48 letters, digits, - or _" value={form.method_id} onChange={e => setForm({ ...form, method_id: e.target.value })} placeholder="cash-forecast" /></label>
        <label className="fx"><span className="fx-label">Title</span><input required maxLength={120} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Forecast your cash for the next 13 weeks" /></label>
        <div className="fx-seg"><Segmented label="Kind" options={["Program", "Prompt"]} value={form.kind} onChange={k => setForm({ ...form, kind: k })} /></div>
        <label className="fx"><span className="fx-label">Goal</span><input maxLength={60} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Business finance" /></label>
        <label className="fx tall full"><span className="fx-label">What the buyer gets</span><textarea maxLength={2000} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A week-by-week plan that shows when cash runs short" /></label>
        <div className="nf-foot full"><span className="note-row">{formMsg || "Create a draft, then open it to write the manifest, seal an artifact, validate and publish with your wallet."}</span><button className="primary-btn" disabled={saving}>{saving ? "Saving" : "Create draft"}</button></div>
      </form>
    </section>}
  </>;
}
