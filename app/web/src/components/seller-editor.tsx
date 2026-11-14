"use client";
import { useEffect, useRef, useState } from "react";
import { sessionHeader } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { sealMethod, sha256Hex } from "../lib/backend/crypto";
import { icon } from "./shell";

type ContractCall = { receiver_id: string; method_name: string; args: Record<string, unknown>; deposit_yocto: string; gas_tgas: number; signer_must_be?: string };
type Draft = { id: string; method_id: string; kind: "wasm" | "prompt"; title: string; revision: number; state: string; manifest: Record<string, unknown> | null; price_yocto: string | null; dao_share_pct: number; parent: number | null; artifact: { code_hash: string; size: number; sealed: boolean } | null; seller_prompt_warning_accepted?: { version: string | number }; publication?: Publication | null };
type Config = { runner: { tee_pubkey: string }; method_kinds?: { seller_prompt_warning?: string; seller_prompt_warning_version?: string | number } };
type Validation = { ok: boolean; revision: number; errors: { path: string; message: string }[]; warnings?: unknown[]; manifest_hash?: string };
type Publication = { publication_id: string; status: string; signer: string; expected_version: number; calls: ContractCall[]; manifest_hash: string; code_hash: string; runner_hash: string };
async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/backend/api/${path}`, { method, cache: "no-store", headers: { "Content-Type": "application/json", ...sessionHeader() }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || "The request could not be completed.");
  return json as T;
}
function nearToYocto(value: string) {
  if (!/^\d+(\.\d{1,24})?$/.test(value)) throw new Error("Enter a positive NEAR price with at most 24 decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 10n ** 24n + BigInt(fraction.padEnd(24, "0"));
  if (amount <= 0n) throw new Error("The price must be greater than zero.");
  return amount.toString();
}
function nearFromYocto(value: string | null) {
  if (!value) return "";
  const padded = value.padStart(25, "0");
  return `${padded.slice(0, -24)}.${padded.slice(-24)}`.replace(/\.?0+$/, "");
}

export function SellerEditor({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const auth = useNearAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [manifest, setManifest] = useState("");
  const [price, setPrice] = useState("");
  const [share, setShare] = useState("10");
  const [parent, setParent] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState("");
  const running = useRef(false);
  const [signatureRequested, setSignatureRequested] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const path = `method-drafts/${encodeURIComponent(id)}`;
  async function reload() {
    const value = await request<Draft>(path);
    setDraft(value);
    if (value.state === "pending_signature" && value.publication) setPublication(value.publication);
    return value;
  }
  useEffect(() => {
    let active = true;
    Promise.all([request<Draft>(`method-drafts/${encodeURIComponent(id)}`), request<Config>("config")]).then(([d, c]) => {
      if (!active) return;
      setDraft(d); setConfig(c);
      setManifest(d.manifest ? JSON.stringify(d.manifest, null, 2) : "");
      setPrice(nearFromYocto(d.price_yocto)); setShare(String(d.dao_share_pct)); setParent(d.parent === null ? "" : String(d.parent));
      setAccepted(d.seller_prompt_warning_accepted?.version === c.method_kinds?.seller_prompt_warning_version && !!d.seller_prompt_warning_accepted);
      if (d.state === "pending_signature" && d.publication) setPublication(d.publication);
      setRecoveryKey(`publish-${id}`);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);
  async function act(label: string, operation: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(label); setError(""); setNotice("");
    try { await operation(); } catch (e) { setError(e instanceof Error ? e.message : "The request failed."); }
    finally { running.current = false; setBusy(""); }
  }
  async function save() {
    if (!draft) throw new Error("Load the draft first.");
    let parsed: unknown;
    try { parsed = JSON.parse(manifest); } catch { throw new Error("The manifest must be valid JSON."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("The manifest must be a JSON object.");
    const pct = Number(share);
    if (!Number.isInteger(pct) || pct < 10 || pct > 90) throw new Error("Community share must be an integer from 10 to 90.");
    const version = parent === "" ? null : Number(parent);
    if (version !== null && (!Number.isInteger(version) || version < 1)) throw new Error("Parent version must be a positive whole number.");
    const warningVersion = config?.method_kinds?.seller_prompt_warning_version;
    if (draft.kind === "prompt" && (!accepted || warningVersion === undefined)) throw new Error("Read and accept the current prompt warning first.");
    const value = await request<Draft>(path, "PATCH", { expected_revision: draft.revision, manifest: parsed, price_yocto: nearToYocto(price), dao_share_pct: pct, parent: version, ...(draft.kind === "prompt" ? { seller_prompt_warning_accepted: { version: warningVersion } } : {}) });
    setDraft(value); setValidation(null); setPublication(null); onChanged();
    return value;
  }
  async function upload(file: File | undefined) {
    if (!file || !draft || !config) return;
    await act("Sealing artifact", async () => {
      if (file.size > 2_000_000) throw new Error("Choose an artifact smaller than 2 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!bytes.length) throw new Error("The artifact is empty.");
      if (draft.kind === "wasm" && !(bytes[0] === 0 && bytes[1] === 97 && bytes[2] === 115 && bytes[3] === 109)) throw new Error("Choose a valid WASM program.");
      const sealed = sealMethod(config.runner.tee_pubkey, bytes);
      await request(`${path}/artifact`, "POST", { sealed, code_hash: sha256Hex(bytes), kind: draft.kind, size: bytes.length });
      await reload(); setValidation(null); setPublication(null); onChanged();
      setNotice("Artifact sealed on this device and uploaded. The server received ciphertext only.");
    });
  }
  if (!draft) return <section className="card list-card"><div className="dpane"><p role={error ? "alert" : "status"}>{error || "Loading draft"}</p><button className="view" onClick={onClose}>Back to methods</button></div></section>;
  const locked = draft.state !== "draft";
  return <section className="card list-card"><div className="toolbar"><h2 className="list-title">{draft.title}</h2><div className="acts"><button className="view" disabled={!!busy} onClick={() => void act("Refreshing draft", async () => { await reload(); setNotice("Draft state refreshed. Unsaved form values are retained."); })}>Refresh status</button><button className="view" onClick={onClose}>Back to methods</button></div></div><div className="dpane">
    <div className="note-row">{icon("info")}<span>Revision {draft.revision}. {locked ? "This draft is locked. Check publication status or create a new version." : "Prepare a manifest and seal your program or prompt here. Publication asks your NEAR wallet to sign the exact contract calls."}</span></div>
    <div className="rform">
      <label className="fx"><span className="fx-label">Price per run in NEAR</span><input value={price} disabled={locked || !!busy} onChange={e => { setPrice(e.target.value); setValidation(null); setPublication(null); }} inputMode="decimal" /></label>
      <label className="fx"><span className="fx-label">Community share %</span><input type="number" min="10" max="90" value={share} disabled={locked || !!busy} onChange={e => { setShare(e.target.value); setValidation(null); setPublication(null); }} /></label>
      <label className="fx"><span className="fx-label">Parent version, optional</span><input type="number" min="1" value={parent} disabled={locked || !!busy} onChange={e => { setParent(e.target.value); setValidation(null); setPublication(null); }} /></label>
      <label className="fx tall full"><span className="fx-label">Import a manifest from this device</span><input type="file" accept=".json,application/json" disabled={locked || !!busy} onChange={e => { const file = e.target.files?.[0]; if (file) void act("Reading manifest", async () => { if (file.size > 500_000) throw new Error("Choose a manifest smaller than 500 KB."); const raw = await file.text(); const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Choose a JSON manifest object."); setManifest(raw); setValidation(null); setPublication(null); }); e.target.value = ""; }} /></label>
      <label className="fx tall full"><span className="fx-label">Manifest v5 JSON</span><textarea rows={16} spellCheck={false} value={manifest} disabled={locked || !!busy} onChange={e => { setManifest(e.target.value); setValidation(null); setPublication(null); }} /></label>
    </div>
    {draft.kind === "prompt" && <div className="dblock"><div className="note-row">{icon("info")}<span>{config?.method_kinds?.seller_prompt_warning || "Prompt publishing warning is unavailable. Publication remains blocked."}</span></div><label className="consent"><input type="checkbox" checked={accepted} disabled={locked || !!busy || !config?.method_kinds?.seller_prompt_warning} onChange={e => { setAccepted(e.target.checked); setValidation(null); }} /><span>I understand and accept this prompt leak warning.</span></label></div>}
    {!locked && <div className="nf-foot"><span className="note-row">The manifest is public. Never put your private source, prompt, credentials or personal data in it.</span><button className="view" disabled={!!busy} onClick={() => void act("Saving draft", async () => { await save(); setNotice("Draft saved."); })}>Save draft</button></div>}
    <div className="dblock"><h3 className="h3">Sealed artifact</h3>{draft.artifact && <div className="note-row"><span>{draft.artifact.size} bytes sealed. Code hash <code className="hash">{draft.artifact.code_hash}</code></span></div>}{!locked && <label className="fx tall"><span className="fx-label">{draft.kind === "wasm" ? "WASM file" : "Prompt text file"}</span><input type="file" accept={draft.kind === "wasm" ? ".wasm" : ".txt,.md,text/plain"} disabled={!!busy || !config} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>}</div>
    {!locked && <div className="nf-foot"><span className="note-row">Validation checks the public manifest and sealed artifact before any wallet request.</span><button className="view" disabled={!!busy} onClick={() => void act("Validating draft", async () => { await save(); const result = await request<Validation>(`${path}/validate`, "POST", {}); setValidation(result); setNotice(result.ok ? "Validation passed." : "Fix the errors below before publishing."); })}>Validate draft</button></div>}
    {validation && <div className="dblock"><h3 className="h3">Validation</h3>{validation.errors.map((e, i) => <div className="note-row" key={i}><span><b>{e.path}</b> {e.message}</span></div>)}{validation.warnings?.map((w, i) => <div className="note-row" key={`w${i}`}><span>{typeof w === "string" ? w : JSON.stringify(w)}</span></div>)}</div>}
    {!locked && <div className="nf-foot"><span className="note-row">Publishing uses NEAR testnet. Review storage deposits and gas in the wallet before signing.</span><button className="primary-btn" disabled={!!busy || !validation?.ok || validation.revision !== draft.revision} onClick={() => void act("Preparing publication", async () => { const p = await request<Publication>(`${path}/publish`, "POST", { expected_revision: draft.revision, idempotency_key: recoveryKey }); setPublication(p); await reload(); setNotice("Contract calls prepared. Review them below before opening the wallet."); })}>Prepare publication</button></div>}
    {publication && <div className="dblock"><h3 className="h3">Review publication</h3><div className="note-row"><span>Version {publication.expected_version}. Signer {publication.signer}. Manifest hash <code className="hash">{publication.manifest_hash}</code></span></div>{publication.calls.map((call, i) => <div className="row" key={i}><span className="two"><b>{call.method_name}</b><span>{call.receiver_id}</span><span>Storage deposit {call.deposit_yocto} yoctoNEAR, gas {call.gas_tgas} Tgas</span></span></div>)}<div className="nf-foot"><span className="note-row">Signing does not itself mark the method published. Confirm its state on NEAR afterwards.</span><button className="primary-btn" disabled={!!busy || signatureRequested} onClick={() => void act("Waiting for wallet", async () => { setSignatureRequested(true); await auth.signCalls(publication.calls.map(call => ({ ...call, signer_must_be: publication.signer }))); setNotice("Wallet request finished. Confirm publication from the chain before making another wallet request."); })}>Sign publication</button></div></div>}
    <div className="dblock"><label className="fx"><span className="fx-label">Transaction hash, optional</span><input value={txHash} onChange={e => setTxHash(e.target.value)} /></label><div className="nf-foot"><span className="note-row">If the wallet redirected, was cancelled or this draft was reopened, check the expected version on NEAR first. Refresh this page only if you need to make another explicit wallet request.</span><button className="view" disabled={!!busy} onClick={() => void act("Checking publication", async () => { const result = await request<{ published?: boolean; already_published?: boolean; version?: number; publication?: { version?: number } }>(`${path}/confirm`, "POST", { tx_hash: txHash || undefined }); await reload(); onChanged(); setNotice(result.published || result.already_published ? `Version ${result.version || result.publication?.version || ""} is published on NEAR.` : "Publication has not been confirmed."); })}>Confirm publication</button></div></div>
    {busy && <p role="status">{busy}</p>}{error && <p className="form-error" role="alert">{error}</p>}{notice && <div className="note-row" role="status">{notice}</div>}
  </div></section>;
}
