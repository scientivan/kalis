"use client";
import { useEffect, useState, type ReactNode } from "react";
import { backend } from "../lib/backend/client";
import { Dropdown } from "./controls";
type RecordData = Record<string, unknown>;
export function ActionFeedback({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <>
      {error && (
        <div className="note-row form-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="note-row" role="status">
          {message}
        </div>
      )}
    </>
  );
}
function Tool({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card list-card se">
      <header className="se-head"><div><h2>{title}</h2></div></header>
      <div className="dpane">{children}</div>
    </section>
  );
}
const options = [
  { value: "broker_mock", label: "Broker (mock)" },
  { value: "sheets_mock", label: "Spreadsheet (mock)" },
  { value: "docs_mock", label: "Documents (mock)" },
  { value: "wallet_mock", label: "Wallet (mock)" },
];
export function ConnectionCreate({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false),
    [connector, setConnector] = useState("broker_mock"),
    [token, setToken] = useState(""),
    [ttl, setTtl] = useState("60"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const minutes = Number(ttl);
      if (!Number.isFinite(minutes) || minutes <= 0)
        throw new Error("Choose a positive expiry in minutes.");
      await backend("protections/credentials", {
        connector,
        token,
        scopes: ["read"],
        ttl_minutes: minutes,
      });
      setToken("");
      setOpen(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Tool title="Add a Connection">
      <div className="note-row">
        <div>
          <p>
            Allow a labelled mock app to share read-only data. Credentials are
            held by the Kalis backend, outside the TEE.
          </p>
          {!open && (
            <button className="view" onClick={() => setOpen(true)}>
              Add connection
            </button>
          )}
        </div>
      </div>
      {open && (
        <form className="se-form" onSubmit={save}>
          <div className="se-fx"><span className="se-fx-l">App</span><Dropdown
            label="App"
            value={connector}
            options={options}
            onChange={setConnector}
          /><span className="se-fx-h">Mock apps only. All data is synthetic.</span></div>
          <button
            type="button"
            className="view"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await fetch(
                  "/api/backend/mock/demo-token?connector=" +
                    encodeURIComponent(connector),
                  { cache: "no-store" },
                );
                const data = await r.json();
                if (!r.ok || typeof data.token !== "string")
                  throw new Error(
                    data.error?.message || "Demo token unavailable.",
                  );
                setToken(data.token);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Demo token unavailable.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Use demo token
          </button>
          <label className="se-fx">
            <span className="se-fx-l">Access Token</span>
            <input
              type="password"
              autoComplete="off"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <span className="se-fx-h">Held by the Kalis backend, never by a method.</span>
          </label>
          <label className="se-fx">
            <span className="se-fx-l">Expires In</span>
            <input
              type="number"
              min="1"
              required
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
            />
            <span className="se-fx-h">Minutes until the connection stops working.</span>
          </label>
          <div className="se-note rp-wide">
            <span><b>Read only.</b> Trading, transfers and edits are not permitted.</span>
          </div>
          <div className="se-nav rp-wide">
            <button
              type="button"
              className="view"
              onClick={() => {
                setOpen(false);
                setToken("");
              }}
            >
              Cancel
            </button>
            <span />
            <button className="primary-btn" disabled={busy}>
              {busy ? "Connecting" : "Connect"}
            </button>
          </div>
        </form>
      )}
      <ActionFeedback error={error} />
    </Tool>
  );
}
export function DocumentUpload({ onChanged }: { onChanged: () => void }) {
  const [methods, setMethods] = useState<
      { method_id: string; title: string }[]
    >([]),
    [method, setMethod] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [result, setResult] = useState<RecordData | null>(null),
    [reviewed, setReviewed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    backend<typeof methods>("methods")
      .then(setMethods)
      .catch((e) => setError(e.message));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    setReviewed(false);
    try {
      if (file.size > 4 * 1024 * 1024)
        throw new Error("Choose a file smaller than 4 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let str = "";
      for (const b of bytes) str += String.fromCharCode(b);
      const r = await backend<RecordData>("protections/documents", {
        method_id: method,
        filename: file.name,
        mime: file.type,
        base64: btoa(str),
      });
      setResult(r);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document processing failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Tool title="Read a Document">
      <form className="se-form" onSubmit={submit}>
        <div className="se-note rp-wide">
          The Kalis backend sees this document on its way to private AI. Do not
          upload private documents. Extracted text is returned once and kept
          only in this page.
        </div>
        <div className="se-fx"><span className="se-fx-l">Method</span><Dropdown
          label="Method"
          value={method}
          options={[
            { value: "", label: "Choose a method" },
            ...methods.map((m) => ({ value: m.method_id, label: m.title })),
          ]}
          onChange={setMethod}
        /><span className="se-fx-h">The method whose inputs the document fills.</span></div>
        <label className="se-fx">
          <span className="se-fx-l">Public Document</span>
          <input
            type="file"
            required
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
          />
          <span className="se-fx-h">PDF, PNG, JPEG or WebP. Public documents only.</span>
        </label>
        <div className="se-nav rp-wide"><span />
          <button className="primary-btn" disabled={busy || !method || !file}>
            {busy ? "Reading document" : "Read document"}
          </button>
        </div>
      </form>
      <ActionFeedback error={error} />
      {result && (
        <div className="dblock">
          <h3>Extraction Review</h3>
          <div className="note-row">
            {String(
              result.operator_visibility ||
                result.note ||
                "Check the extracted content before using it.",
            )}
          </div>
          <pre className="backend-data">
            {typeof result.text === "string"
              ? result.text
              : "No text returned."}
          </pre>
          <label className="consent">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            <span>
              I checked the extracted text. It is not automatically treated as
              fact.
            </span>
          </label>
          <details>
            <summary>Extraction evidence and warnings</summary>
            <pre className="backend-data">
              {JSON.stringify({ ...result, text: undefined }, null, 2)}
            </pre>
          </details>
          {reviewed && (
            <div className="note-row">
              Review complete. To use this text in a job, keep this page open
              and copy the reviewed text into its input form.
            </div>
          )}
        </div>
      )}
    </Tool>
  );
}
export function DocumentDetails({ id }: { id: string }) {
  const [data, setData] = useState<RecordData | null>(null),
    [error, setError] = useState("");
  return (
    <details
      onToggle={(e) => {
        if (e.currentTarget.open && !data)
          backend<RecordData>(`protections/documents/${encodeURIComponent(id)}`)
            .then(setData)
            .catch((e) => setError(e.message));
      }}
    >
      <summary>Details and proof</summary>
      <ActionFeedback error={error} />
      {data && (
        <pre className="backend-data">{JSON.stringify(data, null, 2)}</pre>
      )}
    </details>
  );
}
export function NoteCreate({ onChanged }: { onChanged: () => void }) {
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Tool title="Add a Note">
      <form
        className="se-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await backend("protections/memory", {
              text,
              source: { kind: "user", ref: "Notes" },
            });
            setText("");
            onChanged();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save note.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="se-fx rp-wide">
          <span className="se-fx-l">Note</span>
          <textarea
            required
            rows={3}
            maxLength={10000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="se-fx-h">Notes are kept on the Kalis backend. Methods may read only the notes their policy permits.</span>
        </label>
        <div className="se-nav rp-wide"><span />
          <button className="primary-btn" disabled={busy || !text.trim()}>
            {busy ? "Saving" : "Add note"}
          </button>
        </div>
      </form>
      <ActionFeedback error={error} />
    </Tool>
  );
}
export function NoteEdit({
  id,
  text,
  onChanged,
}: {
  id: string;
  text: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false),
    [value, setValue] = useState(text),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div>
      {!open ? (
        <button className="view" onClick={() => setOpen(true)}>
          Edit
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await backend(
                `protections/memory/${encodeURIComponent(id)}/edit`,
                { text: value },
              );
              setOpen(false);
              onChanged();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not edit note.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="fx tall">
            <span className="fx-label">Note</span>
            <textarea
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <button className="view" disabled={busy}>
            Save changes
          </button>
          <button className="view" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </form>
      )}
      <ActionFeedback error={error} />
    </div>
  );
}

type SourceRef = {
  kind: string;
  ref?: string;
  sha256?: string;
  revision?: number;
  reviewed_by_buyer?: boolean;
};
type PreparationField = {
  id: string;
  label: string;
  source?: string;
  private?: boolean;
  type?: string;
};
export function PreparationSources({
  methodId,
  runId,
  fields,
  onValue,
}: {
  methodId: string;
  runId?: string;
  fields: PreparationField[];
  onValue: (id: string, value: unknown, source: SourceRef) => void;
}) {
  const [fieldId, setFieldId] = useState(""),
    [credentials, setCredentials] = useState<
      { id: string; connector: string; effective_state?: string }[]
    >([]),
    [credential, setCredential] = useState(""),
    [params, setParams] = useState("{}"),
    [url, setUrl] = useState(""),
    [browserAction, setBrowserAction] = useState("open"),
    [warnings, setWarnings] = useState<RecordData | null>(null),
    [preview, setPreview] = useState<unknown>(null),
    [editable, setEditable] = useState(""),
    [source, setSource] = useState<SourceRef | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reviewed, setReviewed] = useState(false);
  const available = fields.filter((f) => f.source && f.source !== "typed");
  const field = available.find((f) => f.id === fieldId);
  const kind = field?.source || "";
  useEffect(() => {
    backend<typeof credentials>("protections/credentials")
      .then(setCredentials)
      .catch((e) => setError(e.message));
  }, []);
  const reset = () => {
    setPreview(null);
    setSource(null);
    setReviewed(false);
    setEditable("");
    setError("");
    setWarnings(null);
  };
  const acceptPreview = (value: unknown, ref: SourceRef) => {
    setPreview(value);
    setEditable(
      typeof value === "string" ? value : JSON.stringify(value, null, 2),
    );
    setSource(ref);
    setReviewed(false);
  };
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this source.");
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    await act(async () => {
      if (kind.startsWith("connector:")) {
        const [connector, operation] = kind.slice(10).split(".");
        const c = credentials.find(
          (x) => x.id === credential && x.connector === connector,
        );
        if (!c) throw new Error("Choose an active connection for this source.");
        const data = await backend<unknown>(
          `protections/credentials/${encodeURIComponent(c.id)}/use`,
          {
            method_id: methodId,
            run_id: runId,
            operation,
            params: JSON.parse(params),
          },
        );
        acceptPreview(data, { kind: "connector", ref: c.id });
      } else if (kind === "memory") {
        const data = await backend<unknown>(
          `protections/memory/recall?method_id=${encodeURIComponent(methodId)}${runId ? `&run_id=${encodeURIComponent(runId)}` : ""}`,
        );
        acceptPreview(data, { kind: "memory", ref: methodId });
      } else if (kind === "browser") {
        const data = await backend<unknown>("protections/browser", {
          method_id: methodId,
          run_id: runId,
          action: browserAction,
          url,
        });
        acceptPreview(data, { kind: "browser", ref: url });
      }
    });
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    await act(async () => {
      if (kind.startsWith("file_import:")) {
        const { parseOfficeFile } = await import("../lib/backend/file-import");
        const bytes = await file.arrayBuffer();
        const data = await parseOfficeFile(file.name, bytes);
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
          (x) => x.toString(16).padStart(2, "0"),
        ).join("");
        acceptPreview(data, {
          kind: "file_import",
          ref: file.name,
          sha256: hash,
        });
      } else {
        if (file.size > 4 * 1024 * 1024)
          throw new Error("Choose a document smaller than 4 MB.");
        const bytes = new Uint8Array(await file.arrayBuffer());
        let text = "";
        for (const b of bytes) text += String.fromCharCode(b);
        const data = await backend<RecordData>("protections/documents", {
          method_id: methodId,
          run_id: runId,
          filename: file.name,
          mime: file.type,
          base64: btoa(text),
        });
        setWarnings({ ...data, text: undefined });
        acceptPreview(data.text ?? "", {
          kind: "document",
          ref: String(data.id || file.name),
          sha256:
            typeof data.text_sha256 === "string" ? data.text_sha256 : undefined,
        });
      }
    });
  }
  if (!available.length) return null;
  return (
    <div className="dblock">
      <h2 className="h3">Choose an Input Source</h2>
      <div className="note-row">
        Load a declared source, review its content and choose the value for an
        input. Local Office files stay on this device. Uploaded documents and
        connected apps pass through the Kalis backend.
      </div>
      <div className="nform">
        <Dropdown
          label="Input"
          value={fieldId}
          options={[
            { value: "", label: "Choose an input" },
            ...available.map((f) => ({ value: f.id, label: f.label })),
          ]}
          onChange={(id) => {
            setFieldId(id);
            reset();
          }}
        />
        {kind.startsWith("connector:") && (
          <>
            <Dropdown
              label="Connection"
              value={credential}
              options={[
                { value: "", label: "Choose a connection" },
                ...credentials
                  .filter(
                    (c) =>
                      c.connector === kind.slice(10).split(".")[0] &&
                      (!c.effective_state || c.effective_state === "active"),
                  )
                  .map((c) => ({
                    value: c.id,
                    label: `${c.connector} ${c.id}`,
                  })),
              ]}
              onChange={setCredential}
            />
            <label className="fx tall full">
              <span className="fx-label">Source parameters as JSON</span>
              <textarea
                value={params}
                onChange={(e) => setParams(e.target.value)}
              />
            </label>
          </>
        )}
        {kind === "browser" && (
          <Dropdown
            label="Page action"
            value={browserAction}
            options={[
              { value: "open", label: "Read page" },
              { value: "download", label: "Read document" },
            ]}
            onChange={setBrowserAction}
          />
        )}
        {kind === "browser" && (
          <label className="fx full">
            <span className="fx-label">Declared page URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
        )}
        {kind === "document" || kind.startsWith("file_import:") ? (
          <label className="fx full">
            <span className="fx-label">
              {kind === "document"
                ? "Public document, read by backend"
                : "Office file, stays on this device"}
            </span>
            <input
              type="file"
              accept={
                kind === "file_import:xlsx"
                  ? ".xlsx"
                  : kind === "file_import:docx"
                    ? ".docx"
                    : "application/pdf,image/*"
              }
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
          </label>
        ) : (
          field && (
            <button
              type="button"
              className="view"
              disabled={busy}
              onClick={() => void load()}
            >
              {busy ? "Loading" : "Load source"}
            </button>
          )
        )}
      </div>
      <ActionFeedback error={error} />
      {preview !== null && field && source && (
        <div className="dblock">
          {warnings && (
            <details>
              <summary>Document warnings and evidence</summary>
              <pre className="backend-data">
                {JSON.stringify(warnings, null, 2)}
              </pre>
            </details>
          )}
          <details>
            <summary>Original source</summary>
            <pre className="backend-data">
              {typeof preview === "string"
                ? preview
                : JSON.stringify(preview, null, 2)}
            </pre>
          </details>
          <label className="fx tall full">
            <span className="fx-label">Reviewed value for {field.label}</span>
            <textarea
              rows={4}
              value={editable}
              onChange={(e) => {
                setEditable(e.target.value);
                setReviewed(false);
              }}
            />
          </label>
          <label className="consent">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            <span>
              I reviewed this value and want to use it for this input.
            </span>
          </label>
          <button
            type="button"
            className="view"
            disabled={!reviewed}
            onClick={() => {
              try {
                const value =
                  field.type === "array" || field.type === "object"
                    ? JSON.parse(editable)
                    : ["number", "integer", "money", "percent"].includes(
                          field.type || "",
                        )
                      ? Number(editable)
                      : field.type === "boolean"
                        ? editable === "true"
                        : editable;
                if (typeof value === "number" && !Number.isFinite(value))
                  throw new Error("Enter a valid number.");
                onValue(field.id, value, {
                  ...source,
                  reviewed_by_buyer: true,
                });
                reset();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Check the value.");
              }
            }}
          >
            Use reviewed value
          </button>
        </div>
      )}
    </div>
  );
}
