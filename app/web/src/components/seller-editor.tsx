"use client";
// Method editor (new method or new version), organised as five steps that follow how a seller thinks:
// what buyers see, what goes in and comes out, what it costs and who earns, the sealed method itself,
// then a review and the wallet. One step is open at a time, so the page never becomes a long scroll.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { sessionHeader } from "../lib/backend/client";
import { useNearAuth } from "../lib/near/auth";
import { sealMethod, sha256Hex } from "../lib/backend/crypto";
import { icon } from "./shell";
import { Fx } from "./form-kit";

type ContractCall = { receiver_id: string; method_name: string; args: Record<string, unknown>; deposit_yocto: string; gas_tgas: number; signer_must_be?: string };
type Draft = { id: string; method_id: string; kind: "wasm" | "prompt"; title: string; revision: number; state: string; new_method?: boolean; manifest: Record<string, unknown> | null; price_yocto: string | null; dao_share_pct: number; parent: number | null; artifact: { code_hash: string; size: number; sealed: boolean } | null; seller_prompt_warning_accepted?: { version: string | number }; publication?: Publication | null };
type Config = { platform_share_pct?: number; min_dao_share_pct?: number; runner: { tee_pubkey: string }; method_kinds?: { seller_prompt_warning?: string; seller_prompt_warning_version?: string | number } };
type Validation = { ok: boolean; revision: number; errors: { path: string; message: string }[]; warnings?: unknown[]; manifest_hash?: string };
type Publication = { publication_id: string; status: string; signer: string; expected_version: number; calls: ContractCall[]; manifest_hash: string; code_hash: string; runner_hash: string };
type Obj = Record<string, unknown>;
type Field = { id: string; label?: string; type?: string; help?: string; unit?: string; private?: boolean; required?: boolean };
type Check = { id: string; description?: string };

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/backend/api/${path}`, { method, cache: "no-store", headers: { "Content-Type": "application/json", ...sessionHeader() }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || "The request could not be completed.");
  return json as T;
}
function nearToYocto(value: string) {
  if (!/^\d+(\.\d{1,24})?$/.test(value)) throw new Error("Enter the price as a number of NEAR, for example 0.05.");
  const [whole, fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 10n ** 24n + BigInt(fraction.padEnd(24, "0"));
  if (amount <= 0n) throw new Error("The price must be more than zero.");
  return amount.toString();
}
function nearFromYocto(value: string | null) {
  if (!value) return "";
  const padded = value.padStart(25, "0");
  return `${padded.slice(0, -24)}.${padded.slice(-24)}`.replace(/\.?0+$/, "");
}
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "0");
const TYPE_LABEL: Record<string, string> = { string: "Text", text: "Long text", number: "Number", integer: "Whole number", money: "Amount", percent: "Percent", boolean: "Yes or no", enum: "Choice", date: "Date", array: "List", object: "Group" };

type StepId = "listing" | "io" | "price" | "sealed" | "publish";
const STEPS: { id: StepId; title: string; hint: string; icon: string }[] = [
  { id: "listing", title: "Listing", hint: "What buyers see in the Marketplace", icon: "store" },
  { id: "io", title: "Inputs and Answer", hint: "What buyers give and what they get back", icon: "file" },
  { id: "price", title: "Price and Earnings", hint: "Price per run and how it is split", icon: "coins" },
  { id: "sealed", title: "Sealed Method", hint: "Your program or prompt, locked on this device", icon: "lock" },
  { id: "publish", title: "Review and Publish", hint: "Final check, then sign with your wallet", icon: "check" },
];
// Map a validation error path to the step that can fix it.
function stepOf(path: string): StepId {
  if (/price|dao_share|parent/.test(path)) return "price";
  if (/artifact|code_hash|seller_prompt_warning/.test(path)) return "sealed";
  if (/inputs|outputs|buyer_checks|steps|ai/.test(path)) return "io";
  return "listing";
}

export function SellerEditor({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const auth = useNearAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [m, setM] = useState<Obj>({});
  const [raw, setRaw] = useState("");
  const [rawOpen, setRawOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [share, setShare] = useState(10);
  const [accepted, setAccepted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [step, setStep] = useState<StepId>("listing");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState("");
  const running = useRef(false);
  const [signatureRequested, setSignatureRequested] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const path = `method-drafts/${encodeURIComponent(id)}`;

  function loadInto(d: Draft) {
    const man = isObj(d.manifest) ? d.manifest : {};
    setM(man); setRaw(JSON.stringify(man, null, 2));
    setPrice(nearFromYocto(d.price_yocto)); setShare(d.dao_share_pct || 10);
    if (d.state === "pending_signature" && d.publication) { setPublication(d.publication); setStep("publish"); }
  }
  async function reload() { const value = await request<Draft>(path); setDraft(value); if (value.state === "pending_signature" && value.publication) setPublication(value.publication); return value; }
  useEffect(() => {
    let active = true;
    Promise.all([request<Draft>(path), request<Config>("config")]).then(([d, c]) => {
      if (!active) return;
      setDraft(d); setConfig(c); loadInto(d);
      setAccepted(!!d.seller_prompt_warning_accepted && d.seller_prompt_warning_accepted.version === c.method_kinds?.seller_prompt_warning_version);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(label: string, operation: () => Promise<void>) {
    if (running.current) return;
    running.current = true; setBusy(label); setError(""); setNotice("");
    try { await operation(); } catch (e) { setError(e instanceof Error ? e.message : "The request failed."); }
    finally { running.current = false; setBusy(""); }
  }
  const touch = () => { setDirty(true); setValidation(null); setPublication(null); };
  const setListing = (key: string, value: unknown) => { setM(prev => { const next = { ...prev, listing: { ...(isObj(prev.listing) ? prev.listing : {}), [key]: value } }; setRaw(JSON.stringify(next, null, 2)); return next; }); touch(); };
  const setFieldProp = (group: "inputs" | "outputs", index: number, key: keyof Field, value: unknown) => {
    setM(prev => {
      const g = isObj(prev[group]) ? prev[group] as Obj : {};
      const fields = Array.isArray(g.fields) ? [...g.fields as Field[]] : [];
      fields[index] = { ...fields[index], [key]: value };
      const next = { ...prev, [group]: { ...g, fields } };
      setRaw(JSON.stringify(next, null, 2)); return next;
    }); touch();
  };

  async function save() {
    if (!draft) throw new Error("Load the draft first.");
    let manifest = m;
    if (rawOpen) {
      try { const parsed = JSON.parse(raw); if (!isObj(parsed)) throw new Error(); manifest = parsed; setM(parsed); }
      catch { throw new Error("The manifest text is not valid JSON. Fix it or close the manifest text to keep the form values."); }
    }
    const warningVersion = config?.method_kinds?.seller_prompt_warning_version;
    if (draft.kind === "prompt" && (!accepted || warningVersion === undefined)) throw new Error("Accept the prompt warning in the Sealed Method step first.");
    const value = await request<Draft>(path, "PATCH", { expected_revision: draft.revision, manifest: { ...manifest, dao_share_percent: share }, price_yocto: nearToYocto(price), dao_share_pct: share, parent: draft.parent, ...(draft.kind === "prompt" ? { seller_prompt_warning_accepted: { version: warningVersion } } : {}) });
    setDraft(value); setDirty(false); setValidation(null); setPublication(null); onChanged();
    return value;
  }
  async function upload(file: File | undefined) {
    if (!file || !draft || !config) return;
    await act("Sealing on this device", async () => {
      if (file.size > 2_000_000) throw new Error("Choose a file smaller than 2 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!bytes.length) throw new Error("The file is empty.");
      if (draft.kind === "wasm" && !(bytes[0] === 0 && bytes[1] === 97 && bytes[2] === 115 && bytes[3] === 109)) throw new Error("This is not a WASM program. Choose the compiled .wasm file.");
      const sealed = sealMethod(config.runner.tee_pubkey, bytes);
      await request(`${path}/artifact`, "POST", { sealed, code_hash: sha256Hex(bytes), kind: draft.kind, size: bytes.length });
      await reload(); setValidation(null); setPublication(null); onChanged();
      setNotice("Sealed on this device and uploaded. Kalis received only the locked copy.");
    });
  }
  const validate = () => act("Checking everything", async () => {
    await save();
    const result = await request<Validation>(`${path}/validate`, "POST", {});
    setValidation(result);
    setNotice(result.ok ? "Everything checks out. You can prepare the wallet request." : "Some items need a fix. Each one links to its step.");
  });
  const prepare = () => act("Preparing the wallet request", async () => {
    if (!draft) return;
    const p = await request<Publication>(`${path}/publish`, "POST", { expected_revision: draft.revision, idempotency_key: `publish-${id}` });
    setPublication(p); await reload();
  });
  const confirm = (silent = false) => act("Checking NEAR", async () => {
    const result = await request<{ published?: boolean; already_published?: boolean; version?: number; publication?: { version?: number } }>(`${path}/confirm`, "POST", { tx_hash: txHash || undefined });
    await reload(); onChanged();
    if (result.published || result.already_published) setNotice(`Version ${result.version || result.publication?.version || publication?.expected_version || ""} is live in the Marketplace.`);
    else if (!silent) setNotice("NEAR does not show this version yet. Wait a few seconds and check again.");
  });
  const sign = () => act("Waiting for your wallet", async () => {
    if (!publication) return;
    setSignatureRequested(true);
    try { await auth.signCalls(publication.calls.map(call => ({ ...call, signer_must_be: publication.signer }))); }
    catch (e) { setSignatureRequested(false); const msg = e instanceof Error ? e.message : ""; throw new Error(/closed|cancel|reject/i.test(msg) ? "You closed the wallet before signing, so nothing was sent. Sign again when ready." : msg || "The wallet did not finish."); }
    running.current = false; await confirm(true);
  });

  const listing = isObj(m.listing) ? m.listing as Obj : {};
  const inputs = (isObj(m.inputs) && Array.isArray((m.inputs as Obj).fields) ? (m.inputs as Obj).fields : []) as Field[];
  const outputs = (isObj(m.outputs) && Array.isArray((m.outputs as Obj).fields) ? (m.outputs as Obj).fields : []) as Field[];
  const checks = (Array.isArray(m.buyer_checks) ? m.buyer_checks : []) as Check[];
  const limits = Array.isArray(listing.limits) ? listing.limits as string[] : [];
  const platformPct = config?.platform_share_pct ?? 10;
  const minShare = config?.min_dao_share_pct ?? 10;
  const priceNum = Number(price) || 0;
  const sellerPct = Math.max(0, 100 - platformPct - share);

  const status = useMemo(() => {
    const errs = validation?.errors || [];
    const has = (s: StepId) => errs.some(e => stepOf(e.path) === s);
    const done: Record<StepId, boolean> = {
      listing: !!str(listing.title) && !!str(listing.outcome) && !has("listing"),
      io: inputs.length > 0 && outputs.length > 0 && !has("io"),
      price: priceNum > 0 && !has("price"),
      sealed: !!draft?.artifact && (draft?.kind !== "prompt" || accepted) && !has("sealed"),
      publish: draft?.state === "published",
    };
    return { done, has };
  }, [validation, listing, inputs.length, outputs.length, priceNum, draft, accepted]);

  if (!draft) return <section className="card list-card"><div className="dpane"><p role={error ? "alert" : "status"}>{error || "Loading the draft"}</p><button className="view" onClick={onClose}>Back to methods</button></div></section>;
  const locked = draft.state !== "draft";
  const versionLabel = draft.new_method === false || draft.parent ? `Version ${(draft.parent || 0) + 1}, building on version ${draft.parent}` : "First version";
  const stateChip = draft.state === "published" ? "Published" : draft.state === "pending_signature" ? "Waiting for your signature" : dirty ? "Unsaved changes" : "Draft saved";
  const idx = STEPS.findIndex(s => s.id === step);
  const go = (s: StepId) => { setStep(s); setError(""); };

  const panel: Record<StepId, ReactNode> = {
    listing: <div className="se-split">
      <div className="se-fields">
        <Fx label="Title" hint="Say the result the buyer gets, in their words."><input value={str(listing.title)} disabled={locked} maxLength={90} onChange={e => setListing("title", e.target.value)} /></Fx>
        <Fx label="What the Buyer Gets" hint="One or two sentences shown on the card."><textarea rows={3} value={str(listing.outcome)} disabled={locked} onChange={e => setListing("outcome", e.target.value)} /></Fx>
        <div className="se-row2">
          <Fx label="Goal" hint="Groups the method in the Goal filter."><input value={str(listing.category)} disabled={locked} onChange={e => setListing("category", e.target.value)} /></Fx>
          <Fx label="Why It Is Urgent" hint="The moment a buyer needs this."><input value={str(listing.urgency)} disabled={locked} onChange={e => setListing("urgency", e.target.value)} /></Fx>
        </div>
        <Fx label="Honest Limits" hint="Things the method does not do. Press Enter to add one.">
          <div className="se-chips">{limits.map((l, i) => <span className="se-chip" key={i}>{l}{!locked && <button type="button" aria-label={`Remove ${l}`} onClick={() => setListing("limits", limits.filter((_, j) => j !== i))}><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>}</span>)}
            {!locked && <input className="se-chip-input" placeholder="Add a limit" onKeyDown={e => { const v = (e.target as HTMLInputElement).value.trim(); if (e.key === "Enter" && v) { e.preventDefault(); setListing("limits", [...limits, v]); (e.target as HTMLInputElement).value = ""; } }} />}</div>
        </Fx>
      </div>
      <aside className="se-preview" aria-label="Card preview">
        <span className="se-preview-cap">{icon("store")}Marketplace Card Preview</span>
        <article className="mcard se-mini"><div className="mcard-top"><span className="mcard-icon" style={{ background: "var(--blue)" }}>{icon("m-person")}</span><span className="kchip">{draft.kind === "prompt" ? "Prompt" : "Program"}</span></div>
          <h3>{str(listing.title) || "Your method title"}</h3><p className="mcard-desc">{str(listing.outcome) || "What the buyer gets appears here."}</p>
          <div className="mcard-meta"><span>{checks.length} checks</span><span>{Array.isArray(m.steps) ? (m.steps as unknown[]).length : 0} steps</span></div>
          <div className="mcard-foot"><span className="mcard-price">From <b>{price || "0"} NEAR</b></span><span className="view">View</span></div></article>
      </aside>
    </div>,
    io: <div className="se-io">
      <FieldList title="The Buyer Provides" note="Private values stay sealed, even from you." fields={inputs} locked={locked} withPrivacy onChange={(i, k, v) => setFieldProp("inputs", i, k, v)} />
      <FieldList title="The Buyer Gets Back" note="Opened only on the buyer's device." fields={outputs} locked={locked} onChange={(i, k, v) => setFieldProp("outputs", i, k, v)} />
      <section className="se-box se-span se-checkbox">
        <header><b>{icon("shield")}Checks on the Buyer's Device</b><span>{checks.length ? `${checks.length} rules run after the answer opens, so the buyer can trust it without trusting you.` : "No checks yet. Buyers trust methods with checks more."}</span></header>
        {!!checks.length && <div className="se-checks">{checks.map(c => <span key={c.id}>{icon("check")}{c.description || c.id}</span>)}</div>}
      </section>
    </div>,
    price: <div className="se-split">
      <div className="se-fields">
        <Fx label="Price per Run" hint="What a buyer pays each time they run this version."><div className="se-affix"><input inputMode="decimal" value={price} disabled={locked} onChange={e => { setPrice(e.target.value); touch(); }} /><span>NEAR</span></div></Fx>
        <Fx label={`Community Fund Share, ${share}%`} hint={`Goes to the shared fund that pays for improvements. At least ${minShare}%.`}>
          <input type="range" min={minShare} max={100 - platformPct} step={1} value={share} disabled={locked} onChange={e => { setShare(Number(e.target.value)); touch(); }} className="se-range" />
        </Fx>
        <div className="se-note">{icon("info")}<span><b>{versionLabel}.</b> Buyers who ran an older version keep their results. New runs use this version once it is published.</span></div>
      </div>
      <aside className="se-split-card" aria-label="Earnings per run">
        <b className="se-cap">Each Run of {price || "0"} NEAR Is Split</b>
        <div className="se-bar" role="img" aria-label={`You ${sellerPct}%, community ${share}%, platform ${platformPct}%`}><i style={{ flex: sellerPct }} className="b1" /><i style={{ flex: share }} className="b2" /><i style={{ flex: platformPct }} className="b3" /></div>
        <dl>
          <div><dt><i className="b1" />You</dt><dd>{fmt(priceNum * sellerPct / 100)} NEAR<small>{sellerPct}%</small></dd></div>
          <div><dt><i className="b2" />Community fund</dt><dd>{fmt(priceNum * share / 100)} NEAR<small>{share}%</small></dd></div>
          <div><dt><i className="b3" />Kalis platform</dt><dd>{fmt(priceNum * platformPct / 100)} NEAR<small>{platformPct}%</small></dd></div>
        </dl>
        <span className="se-foot-note">Paid only when every step of the run succeeds. A failed run is refunded to the buyer.</span>
      </aside>
    </div>,
    sealed: <div className="se-split">
      <div className="se-fields">
        <label className={`se-drop ${locked ? "is-off" : ""}`}>
          <span className="se-drop-ico">{icon(draft.artifact ? "lock" : "plus")}</span>
          <b>{draft.artifact ? "Replace the sealed file" : draft.kind === "wasm" ? "Choose your compiled .wasm program" : "Choose your prompt as a text file"}</b>
          <span>It is locked on this device with the runner's key before upload. Kalis and buyers never see the plain text.</span>
          <input type="file" accept={draft.kind === "wasm" ? ".wasm" : ".txt,.md,text/plain"} disabled={locked || !!busy || !config} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {draft.kind === "prompt" && <div className="se-warn">
          <p>{config?.method_kinds?.seller_prompt_warning || "The prompt warning could not be loaded, so publishing stays blocked."}</p>
          <label className="consent"><input type="checkbox" checked={accepted} disabled={locked || !config?.method_kinds?.seller_prompt_warning} onChange={e => { setAccepted(e.target.checked); touch(); }} /><span>I understand this risk for prompt methods.</span></label>
        </div>}
      </div>
      <aside className="se-split-card" aria-label="Sealed file status">
        <b className="se-cap">Status</b>
        {draft.artifact ? <dl>
          <div><dt>{icon("check")}Sealed</dt><dd>{(draft.artifact.size / 1024).toFixed(1)} KB</dd></div>
          <div><dt>Fingerprint</dt><dd><code className="hash" title={draft.artifact.code_hash}>{draft.artifact.code_hash.slice(0, 10)}…{draft.artifact.code_hash.slice(-6)}</code></dd></div>
        </dl> : <p className="se-empty">Nothing sealed yet for this version.</p>}
        <span className="se-foot-note">The fingerprint is recorded on NEAR, so buyers can prove which version ran.</span>
      </aside>
    </div>,
    publish: <div className="se-split">
      <div className="se-fields">
        <ul className="se-review">{STEPS.slice(0, 4).map(s => {
          const errs = (validation?.errors || []).filter(e => stepOf(e.path) === s.id);
          return <li key={s.id} className={errs.length ? "bad" : status.done[s.id] ? "ok" : ""}>
            <span className="se-dot">{icon(errs.length ? "info" : status.done[s.id] ? "check" : s.icon)}</span>
            <div><b>{s.title}</b>{errs.length ? errs.map((e, i) => <span key={i}>{e.message}</span>) : <span>{status.done[s.id] ? "Ready" : "Not finished"}</span>}</div>
            {!locked && <button type="button" className="view" onClick={() => go(s.id)}>{errs.length ? "Fix" : "Edit"}</button>}
          </li>;
        })}</ul>
        {!locked && !publication && <div className="se-actions"><button className="view" disabled={!!busy} onClick={() => void validate()}>Check everything</button><button className="primary-btn" disabled={!!busy || !validation?.ok || validation.revision !== draft.revision || dirty} onClick={() => void prepare()}>Prepare wallet request</button></div>}
      </div>
      <aside className="se-split-card" aria-label="Wallet request">
        <b className="se-cap">What Your Wallet Will Sign</b>
        {publication ? <>
          {publication.calls.map((call, i) => <div className="se-call" key={i}><b>{call.method_name === "register_method" ? "Register the method" : call.method_name === "publish_version" ? `Publish version ${publication.expected_version}` : call.method_name}</b><span>On {call.receiver_id}</span><span>Deposit {nearFromYocto(call.deposit_yocto)} NEAR, unused part refunded</span></div>)}
          <span className="se-foot-note">Signed by {publication.signer}. Read the amount and contract in the wallet before you approve.</span>
          {draft.state !== "published" && <button className="primary-btn se-wide" disabled={!!busy || signatureRequested} onClick={() => void sign()}>{icon("wallet")}Review and sign</button>}
          {draft.state !== "published" && <details className="se-more"><summary>The wallet closed or did not come back</summary><Fx label="Transaction Hash"><input value={txHash} onChange={e => setTxHash(e.target.value)} /></Fx><button className="view" disabled={!!busy} onClick={() => { setSignatureRequested(false); void confirm(); }}>Check NEAR again</button></details>}
        </> : <p className="se-empty">Run Check everything first. The exact contract calls appear here before any wallet opens.</p>}
      </aside>
    </div>,
  };

  return <section className="card list-card se">
    <header className="se-head">
      <div><h2>{str(listing.title) || draft.title}</h2><span>{versionLabel}</span></div>
      <div className="se-head-acts"><span className={`kchip ${draft.state === "published" ? "" : "se-chip-wait"}`}>{stateChip}</span><button className="view" onClick={onClose}>Back to methods</button></div>
    </header>
    <div className="se-body">
      <nav className="se-steps" aria-label="Editor steps">{STEPS.map((s, i) => {
        const bad = status.has(s.id);
        return <button key={s.id} type="button" aria-current={step === s.id ? "step" : undefined} className={`se-step ${step === s.id ? "on" : ""} ${bad ? "bad" : status.done[s.id] ? "ok" : ""}`} onClick={() => go(s.id)}>
          <span className="se-dot">{status.done[s.id] && !bad ? icon("check") : i + 1}</span><span className="se-step-t"><b>{s.title}</b><span>{bad ? "Needs a fix" : s.hint}</span></span>
        </button>;
      })}
        <button type="button" className="se-raw-toggle" onClick={() => setRawOpen(v => !v)}>{icon("code")}{rawOpen ? "Hide manifest text" : "Edit manifest as text"}</button>
      </nav>
      <div className="se-panel">
        <div className="se-panel-head"><h3>{STEPS[idx].title}</h3><p>{STEPS[idx].hint}.</p></div>
        {rawOpen ? <Fx label="Manifest Text, Advanced" hint="Public. Never put your private prompt, source or credentials here."><textarea className="se-raw" rows={18} spellCheck={false} value={raw} disabled={locked} onChange={e => { setRaw(e.target.value); touch(); }} /></Fx> : panel[step]}
        {(busy || error || notice) && <div className={`se-msg ${error ? "bad" : ""}`} role={error ? "alert" : "status"}>{icon(error ? "info" : "check")}<span>{error || busy || notice}</span></div>}
        <footer className="se-nav">
          <button className="view" disabled={idx === 0} onClick={() => go(STEPS[Math.max(0, idx - 1)].id)}>Back</button>
          <span>{dirty ? "You have unsaved changes" : "All changes saved"}</span>
          {!locked && dirty && <button className="view" disabled={!!busy} onClick={() => void act("Saving", async () => { await save(); setNotice("Saved."); })}>Save</button>}
          {idx < STEPS.length - 1 && <button className="primary-btn" disabled={!!busy} onClick={() => void act("Saving", async () => { if (!locked && dirty) await save(); go(STEPS[idx + 1].id); })}>Continue</button>}
        </footer>
      </div>
    </div>
  </section>;
}

function FieldList({ title, note, fields, locked, withPrivacy, onChange }: { title: string; note: string; fields: Field[]; locked: boolean; withPrivacy?: boolean; onChange: (i: number, k: keyof Field, v: unknown) => void }) {
  return <section className="se-box">
    <header><b>{title}</b><span>{note}</span></header>
    {!fields.length ? <p className="se-empty">No fields yet. Add them with Edit manifest as text.</p> :
      <ol className="se-flist">{fields.map((f, i) => <li key={f.id}>
        <input aria-label={`Label for ${f.id}`} value={f.label || ""} disabled={locked} onChange={e => onChange(i, "label", e.target.value)} />
        <span className="se-type">{TYPE_LABEL[f.type || "string"] || f.type}{f.unit ? `, ${f.unit}` : ""}</span>
        {withPrivacy && <button type="button" className={`se-priv ${f.private ? "on" : ""}`} disabled={locked} aria-pressed={!!f.private} title={f.private ? "Private, sealed on the buyer's device" : "Not private"} onClick={() => onChange(i, "private", !f.private)}>{icon("lock")}{f.private ? "Private" : "Plain"}</button>}
      </li>)}</ol>}
  </section>;
}
