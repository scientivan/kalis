"use client";
// Run a method privately: /runs/new?method=<id>&version=<n>, and an existing run at /runs/<run id>.
// Data is sealed in this browser (crypto.sealData) before anything is sent. The answer is opened here,
// the runner signature and chip attestation are compared, and the seller's checks run on this device.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { backend, type ApiConfig } from "../lib/backend/client";
import * as kc from "../lib/backend/crypto";
import { runChecks } from "../lib/backend/checks";
import { AppShell, icon } from "./shell";
import { PageInfo, Segmented, Dropdown } from "./controls";

type Field = { id: string; label: string; type?: string; unit?: string; required?: boolean; private?: boolean; help?: string; enum?: string[]; items?: { type?: string }; display?: string };
type Manifest = { inputs?: { fields?: Field[]; sample?: Record<string, unknown> }; outputs?: { fields?: Field[]; status_field?: string }; steps?: { id: string; what: string }[]; buyer_checks?: unknown[]; listing?: { outcome?: string } };
type Version = { number: number; code_hash: string; manifest_hash: string; runner_hash: string; runnable: boolean; price_near: string; price_amount?: { display?: string }; manifest: Manifest; method_kind?: { kind: string } };
type Detail = { method_id: string; title: string; owner: string; versions: Version[] };
type Execution = { output: Parameters<typeof kc.openAnswer>[1]; attestation: { executed_build_ok: boolean; input_hash_ok: boolean; output_hash_ok: boolean } | null };
type Sealed = ReturnType<typeof kc.sealData>;
type Verdict = { status: string; reasons: string[] };
type CheckResult = { results: { id: string; description: string; status: string; message: string }[] };

const STAGES = ["Your data", "Pay", "Run", "Result"];
const VERDICT_TEXT: Record<string, string> = { safe: "Safe to use", attention: "Needs your attention", do_not_use: "Do not use" };
// The sealing secret lives only in this tab's memory. It is never stored or sent.
const secrets = new Map<string, { sealed: Sealed; input: Record<string, unknown>; version: Version; manifest: Manifest; completionKey: string }>();

function initialValues(m: Manifest): Record<string, string> {
  const sample = m.inputs?.sample || {};
  const out: Record<string, string> = {};
  for (const f of m.inputs?.fields || []) {
    const v = sample[f.id];
    out[f.id] = v === undefined ? "" : Array.isArray(v) && v.every(x => typeof x !== "object") ? v.join(", ") : typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}
function parseValue(f: Field, raw: string): unknown {
  const t = raw.trim();
  if (!t) { if (f.required) throw new Error(`${f.label} is required.`); return undefined; }
  if (f.type === "array" || f.type === "object") { try { return JSON.parse(t.startsWith("[") || t.startsWith("{") ? t : `[${t}]`); } catch { throw new Error(`${f.label} must be a list of values separated by commas.`); } }
  if (["number", "integer", "money", "percent"].includes(f.type || "")) { const n = Number(t); if (!Number.isFinite(n)) throw new Error(`${f.label} must be a number.`); return f.type === "integer" ? Math.trunc(n) : n; }
  if (f.type === "boolean") return t === "true";
  return t;
}
const show = (v: unknown) => v === undefined || v === null ? "Not given" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);

export function RunPage({ runId: initialRun }: { runId?: string }) {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [d, setD] = useState<Detail | null>(null);
  const [versionN, setVersionN] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [runId, setRunId] = useState(initialRun || "");
  const [chain, setChain] = useState<{ status?: string; amount_near?: string; method_id?: string; reason?: string } | null>(null);
  const [answer, setAnswer] = useState<Record<string, unknown> | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [proof, setProof] = useState<{ label: string; ok: boolean }[]>([]);
  const [settled, setSettled] = useState<{ status?: string; settle_tx_url?: string; payouts?: Record<string, string> } | null>(null);
  const [payTx, setPayTx] = useState("");
  const [busy, setBusy] = useState(""); const [error, setError] = useState("");
  const [rating, setRating] = useState(0); const [comment, setComment] = useState(""); const [rated, setRated] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const method = q.get("method");
    backend<ApiConfig>("config").then(setConfig).catch(e => setError(e.message));
    if (initialRun) {
      backend<typeof chain & { method_id: string }>(`runs/${encodeURIComponent(initialRun)}`).then(r => { setChain(r); if (r?.method_id) load(r.method_id); }).catch(e => setError(e.message));
    } else if (method) load(method, Number(q.get("version")) || null);
    else setError("Choose a method in the Marketplace first.");
    function load(id: string, n: number | null = null) {
      backend<Detail>(`methods/${encodeURIComponent(id)}`).then(x => { setD(x); const v = x.versions.find(v => v.number === n) || x.versions[x.versions.length - 1]; setVersionN(v.number); setValues(initialValues(v.manifest)); }).catch(e => setError(e.message));
    }
  }, [initialRun]);

  const v = d?.versions.find(x => x.number === versionN) || null;
  const m: Manifest = v?.manifest || {};
  const stage = answer ? 3 : runId && secrets.has(runId) ? 2 : runId ? 3 : 0;
  const [view, setView] = useState<string | null>(null);
  const current = view || STAGES[Math.min(stage, 3)];
  useEffect(() => { setView(null); }, [stage]);

  async function act(label: string, fn: () => Promise<void>) {
    setBusy(label); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(""); }
  }
  const input = useMemo(() => {
    try { const o: Record<string, unknown> = {}; for (const f of m.inputs?.fields || []) { const x = parseValue(f, values[f.id] || ""); if (x !== undefined) o[f.id] = x; } return { ok: true as const, o }; }
    catch (e) { return { ok: false as const, message: e instanceof Error ? e.message : "Check your data." }; }
  }, [values, m]);

  const pay = () => act("Sealing and paying", async () => {
    if (!config || !v || !d) throw new Error("The method is still loading.");
    if (!input.ok) throw new Error(input.message);
    const sealed = kc.sealData(config.runner.tee_pubkey, input.o);
    const created = await backend<{ run_id: string; run?: typeof chain; pay_tx_url?: string }>("runs", { method_id: d.method_id, version: v.number, data_ct_sha256: sealed.dataCtSha256, payment: "demo_topup" });
    secrets.set(created.run_id, { sealed, input: input.o, version: v, manifest: m, completionKey: config.runner.completion_pubkey });
    setRunId(created.run_id); setChain(created.run || null); setPayTx(created.pay_tx_url || "");
    window.history.replaceState(null, "", `/runs/${encodeURIComponent(created.run_id)}`);
  });

  const execute = () => act("Running in the locked chip", async () => {
    const s = secrets.get(runId);
    if (!s) throw new Error("This tab no longer holds the key for this run. Do not pay again. The escrow refunds after its timeout.");
    const ex = await backend<Execution>(`runs/${encodeURIComponent(runId)}/execute`, { data: s.sealed.sealed });
    const opened = kc.openAnswer(s.sealed.secret, ex.output);
    const sig = kc.verifyCompletion(ex.output, s.completionKey);
    const sigOk = sig.sigOk && sig.keyOk && sig.record.run_id === runId && sig.record.data_ct_sha256 === s.sealed.dataCtSha256 && sig.record.method_sha256 === s.version.code_hash && sig.record.manifest_sha256 === s.version.manifest_hash;
    const ck = (s.manifest.buyer_checks || []).length ? runChecks(s.manifest, s.input, opened.answer) : null;
    const vd = kc.runVerdict({ opened, recheck: null, checks: ck, completion: { sigOk }, attestation: ex.attestation, chain: { method_sha256: s.version.code_hash, manifest_sha256: s.version.manifest_hash, runner_hash: s.version.runner_hash } });
    setAnswer(opened.answer); setChecks(ck); setVerdict(vd);
    setProof([
      { label: "Signed by the Kalis runner", ok: sigOk },
      { label: "The version you paid for ran", ok: opened.method_sha256 === s.version.code_hash && opened.manifest_sha256 === s.version.manifest_hash },
      { label: "Chip runs the published runner build", ok: !!ex.attestation?.executed_build_ok },
      { label: "Chip received and returned exactly this data", ok: !!ex.attestation?.input_hash_ok && !!ex.attestation?.output_hash_ok },
      { label: "Every stage succeeded", ok: !!opened.report?.all_ok },
    ]);
    setChain(await backend(`runs/${encodeURIComponent(runId)}`));
  });

  const settle = () => act("Releasing payment", async () => {
    const r = await backend<{ status?: string; settle_tx_url?: string; payouts?: Record<string, string>; run?: typeof chain }>(`runs/${encodeURIComponent(runId)}/settle`, {});
    setSettled(r); if (r.run) setChain(r.run);
  });

  const rate = () => act("Saving rating", async () => {
    if (!d) return;
    await backend(`methods/${encodeURIComponent(d.method_id)}/reviews`, { run_id: runId, rating, comment: comment || undefined, privacy_acknowledged: true });
    setRated("Thanks. Your rating is saved.");
  });

  const status = settled?.status || chain?.status;
  return <AppShell active="Runs">
    <section className="card ph">
      <div className="ph-title">
        <Link className="ghost-ic" href={d ? `/marketplace/${encodeURIComponent(d.method_id)}` : "/marketplace"} aria-label="Back" title="Back"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        <h1>{d ? d.title : "Run privately"}</h1>
      </div>
      <div className="ph-actions"><PageInfo title="What happens in a private run" points={[{ icon: icon("lock"), text: "Your data is sealed in this browser. Only ciphertext leaves." }, { icon: icon("coins"), text: "Your payment waits in escrow until every step works." }, { icon: icon("check"), text: "The answer opens here, and your device checks it." }]} /></div>
    </section>
    {error && <section className="card ph" role="alert"><p className="form-error">{error}</p></section>}
    {d && v && <div className="detail">
      <section className="card list-card">
        <div className="toolbar"><Segmented label="Run stage" options={STAGES} value={current} onChange={s => (STAGES.indexOf(s) <= stage || (s === "Pay" && consent)) && setView(s)} /></div>
        <div className="dpane" key={current}>
          {current === "Your data" && <>
            <div className="dblock">
              <div className="note-row">{icon("lock")}<span>The example values are synthetic. Replace them with your own. They are sealed here and never shown to the expert.</span></div>
              <div className="rform">{(m.inputs?.fields || []).map(f => {
                const set = (x: string) => setValues({ ...values, [f.id]: x });
                const label = `${f.label}${f.unit ? ` (${f.unit})` : ""}${f.required ? "" : ", optional"}`;
                if (f.type === "boolean" || f.enum) return <div className="fx-dd" key={f.id} title={f.help}><Dropdown label={label} value={values[f.id] || (f.enum ? f.enum[0] : "false")} onChange={set} options={f.enum ? f.enum.map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) })) : [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} /></div>;
                return <label className={`fx ${f.type === "text" ? "tall full" : ""}`} key={f.id} title={f.help}>
                  <span className="fx-label">{label}</span>
                  {f.type === "text" ? <textarea rows={3} value={values[f.id] || ""} onChange={e => set(e.target.value)} /> : <input inputMode={f.type === "array" || f.type === "string" ? "text" : "decimal"} value={values[f.id] || ""} onChange={e => set(e.target.value)} placeholder={f.type === "array" ? "Separate with commas" : ""} />}
                </label>;
              })}</div>
              {!input.ok && <p className="form-error">{input.message}</p>}
            </div>
            <div className="nf-foot"><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I checked my data and agree to pay {v.price_amount?.display || `${v.price_near} NEAR`} into escrow.</span></label><button className="primary-btn" disabled={!consent || !input.ok} onClick={() => setView("Pay")}>Continue</button></div>
          </>}
          {current === "Pay" && <div className="dblock"><h2 className="h3">Pay into escrow</h2>
            <div className="rows">
              <div className="row"><span className="two"><b>Test top-up (no real money)</b><span>Paid from the Kalis demo account on NEAR testnet.</span></span><span className="tag req">Selected</span></div>
              <div className="row"><span className="two"><b>{v.price_amount?.display || `${v.price_near} NEAR`} held by the escrow contract</b><span>Released to the expert, the community fund and Kalis only if every step works. Otherwise you can reclaim it after the timeout.</span></span></div>
            </div>
            <div className="nf-foot"><span className="note-row">{icon("info")}<span>Paying from your own wallet is not in this app yet.</span></span><button className="primary-btn" disabled={!!busy || !consent || !!runId} onClick={pay}>{icon("lock")}{busy || "Seal and pay"}</button></div>
          </div>}
          {current === "Run" && <div className="dblock"><h2 className="h3">{busy ? "Running in the locked chip. This can take up to four minutes." : "Ready to run"}</h2>
            <ol className={`steps ${busy ? "live" : ""}`}>{(m.steps || []).map((s, i) => <li key={s.id} style={{ "--i": i } as React.CSSProperties}><span className="sn">{i + 1}</span><span>{s.what}</span></li>)}</ol>
            <div className="nf-foot"><span className="note-row">{icon("info")}<span>Keep this tab open. The key that opens your answer lives only here.</span></span><button className="primary-btn" disabled={!!busy || !secrets.has(runId) || !!answer} onClick={execute}>{icon("play")}{busy || "Run privately"}</button></div>
          </div>}
          {current === "Result" && <>
            {!answer && <div className="note-row">{icon("info")}<span>{runId && !secrets.has(runId) ? "This tab did not seal this run, so it cannot open the answer. The escrow status is on the right." : "The answer appears here after the run."}</span></div>}
            {verdict && <div className={`verdict v-${verdict.status}`}><b>{VERDICT_TEXT[verdict.status] || verdict.status}</b>{verdict.reasons.map(r => <span key={r}>{r}</span>)}</div>}
            {answer && <div className="dblock"><h2 className="h3">Your answer</h2><div className="rows">{(m.outputs?.fields || []).map(f => <div className="row" key={f.id}><span className="two"><span>{f.label}</span><b>{show(answer[f.id])}{f.unit && answer[f.id] !== undefined ? ` ${f.unit}` : ""}</b></span></div>)}</div></div>}
            {checks && <div className="dblock"><h2 className="h3">Your checks</h2><div className="rows">{checks.results.map(c => <div className="row" key={c.id}><span className={`okdot s-${c.status}`} aria-hidden="true">{icon(c.status === "pass" ? "check" : "info")}</span><span className="two"><b>{c.description}</b><span>{c.status === "pass" ? "Passed" : c.status === "not_applicable" ? "Does not apply to this answer" : c.message}</span></span></div>)}</div></div>}
            {proof.length > 0 && <div className="dblock"><h2 className="h3">Proof</h2><div className="uses">{proof.map(p => <span className={`use ${p.ok ? "" : "bad"}`} key={p.label}>{icon(p.ok ? "check" : "info")}{p.label}</span>)}</div></div>}
            {answer && !settled && <div className="nf-foot"><span className="note-row">{icon("coins")}<span>Release the escrow when you are done. A failed run refunds instead.</span></span><button className="primary-btn" disabled={!!busy} onClick={settle}>{busy || "Settle payment"}</button></div>}
            {settled && !rated && <div className="dblock"><h2 className="h3">Rate this method</h2><div className="rate">{[1, 2, 3, 4, 5].map(n => <button key={n} className={n <= rating ? "on" : ""} aria-label={`${n} out of 5`} onClick={() => setRating(n)}>★</button>)}</div>
              <label className="fx tall full"><span className="fx-label">Comment, optional. Leave out your private data.</span><textarea rows={2} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} /></label>
              <div className="nf-foot"><span /><button className="primary-btn" disabled={!rating || !!busy} onClick={rate}>Save rating</button></div></div>}
            {rated && <div className="note-row">{icon("check")}<span>{rated}</span></div>}
          </>}
        </div>
      </section>
      <aside className="card dside" aria-label="Run summary">
        <div className="dprice"><small>Price per run</small><b>{v.price_amount?.display || `${v.price_near} NEAR`}</b></div>
        <div className="rows">
          <div className="row"><span className="two"><span>Escrow</span><b>{status ? ({ Paid: "Held in escrow", Released: "Released to the expert", Refunded: "Refunded to you" } as Record<string, string>)[status] || status : "Not paid yet"}</b></span></div>
          {runId && <div className="row"><span className="two"><span>Run</span><b className="hash">{runId}</b></span></div>}
          <div className="row"><span className="two"><span>Version</span><b>v{v.number}</b></span></div>
        </div>
        {(payTx || settled?.settle_tx_url) && <div className="uses">{payTx && <a className="use" href={payTx} target="_blank" rel="noreferrer">{icon("link")}Payment on NEAR</a>}{settled?.settle_tx_url && <a className="use" href={settled.settle_tx_url} target="_blank" rel="noreferrer">{icon("link")}Settlement on NEAR</a>}</div>}
        <div className="dside-foot"><span className="hint2">Your data and answer never leave this browser unsealed.</span></div>
      </aside>
    </div>}
  </AppShell>;
}
