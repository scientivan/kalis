"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  backend,
  type ApiMethod,
  type ApiVersion,
  type Json,
} from "../lib/backend/client";
import { Connected } from "./connected";
import {
  Heading,
  Panel,
  Facts,
  Form,
  Field,
  Check,
  Tabs,
  Go,
  Empty,
} from "./ui";

type Row = Record<string, Json>;
const display = (v: unknown) =>
  v == null ? "Not available" : typeof v === "string" ? v : JSON.stringify(v);
const pathId = (v: unknown) => encodeURIComponent(String(v));
function Details({
  value,
  label = "Response details",
}: {
  value: unknown;
  label?: string;
}) {
  return (
    <details>
      <summary>{label}</summary>
      <pre className="backend-data">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}
function useResource<T>(path: string) {
  const [data, setData] = useState<T>(),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    if (!path) {
      setLoading(false);
      return;
    }
    setData(undefined);
    setLoading(true);
    setError("");
    backend<T>(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return { data, error, loading, refresh: () => setRevision((n) => n + 1) };
}
function ResourceState({
  loading,
  error,
  refresh,
}: {
  loading: boolean;
  error: string;
  refresh: () => void;
}) {
  return (
    <>
      {loading && <p role="status">Loading from backend…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button className="button secondary" onClick={refresh}>
            Retry loading
          </button>
        </div>
      )}
    </>
  );
}
function useMutation(refresh: () => void) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<unknown>();
  async function send(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await backend<unknown>(path, body);
      setResult(response);
      refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, result, send };
}
function Notice() {
  return (
    <p className="fine-print">
      Backend workspace uses a demo identity, not login. Protection requests can
      contain plaintext readable by the backend operator. Use synthetic data
      only.
    </p>
  );
}
function MutationState({
  busy,
  error,
  result,
}: {
  busy: boolean;
  error: string;
  result: unknown;
}) {
  return (
    <>
      {busy && <p role="status">Saving to backend…</p>}
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {result !== undefined && (
        <Details value={result} label="Latest backend response" />
      )}
    </>
  );
}

export function BackendPages({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  const base = parts[0] || "workspace",
    section = parts[1];
  if (base === "connections") return <BackendConnections />;
  if (base === "marketplace")
    return <BackendMarketplace parts={parts.slice(1)} />;
  if (base === "workspace" && section === "memory") return <BackendMemory />;
  if (base === "workspace" && section === "files") return <BackendDocuments />;
  if (base === "workspace" && section === "browser") return <BackendBrowser />;
  if (base === "workspace" && section === "permissions")
    return (
      <Unavailable
        title="Private test permissions"
        text="The backend has no private-case grant API. Local demo grants do not authorize backend testing."
      />
    );
  if (base === "workspace") return <Connected section="runs" />;
  if (base === "activity") return <BackendActivity />;
  if (base === "community") return <BackendCommunity section={section} />;
  if (base === "balance") return <BackendBalance />;
  if (base === "account")
    return (
      <Unavailable
        title="Account"
        text="This backend has demo workspace identities only. It does not expose authenticated profile management."
      />
    );
  if (base === "preferences")
    return (
      <>
        <Heading title="Permissions & preferences" />
        <Notice />
        <Panel title="Workspace identity">
          <p>
            This browser tab keeps one backend workspace identity across
            requests. It does not grant chain or DAO authority.
          </p>
          <Go to="/connections" secondary>
            Manage backend connections
          </Go>{" "}
          <Go to="/workspace/memory" secondary>
            Review backend memory
          </Go>
        </Panel>
        <Unavailable
          title="Not yet exposed"
          text="Retention, deletion of the whole workspace, model preferences and private-case grants have no backend API. No local toggle is presented as a server permission."
        />
      </>
    );
  return (
    <Unavailable
      title="Page unavailable"
      text="This route has no connected backend surface."
    />
  );
}
function Unavailable({ title, text }: { title: string; text: string }) {
  return (
    <Panel title={title}>
      <p>{text}</p>
    </Panel>
  );
}

export function BackendConnections() {
  const resource = useResource<Row[]>("protections/credentials");
  const mutation = useMutation(resource.refresh);
  const [positions, setPositions] = useState<unknown>();
  const [connecting, setConnecting] = useState(false),
    [connectError, setConnectError] = useState("");
  return (
    <>
      <Heading
        title="Connections"
        description="Scope, expiry, revocation and broker use are handled by the backend."
      />
      <Notice />
      <ResourceState {...resource} />
      <MutationState {...mutation} />
      <Panel title="Connect a broker">
        <button
          className="button primary"
          disabled={connecting || mutation.busy}
          onClick={async () => {
            setConnecting(true);
            setConnectError("");
            try {
              const response = await fetch(
                "/api/backend/mock/broker/demo-token",
              );
              if (!response.ok)
                throw new Error("Demo broker token could not be loaded.");
              const demo = await response.json();
              await mutation.send("protections/credentials", {
                connector: "broker_mock",
                token: demo.token,
                scopes: ["read"],
                ttl_minutes: 30,
              });
            } catch (e) {
              setConnectError(
                e instanceof Error ? e.message : "Connection failed",
              );
            } finally {
              setConnecting(false);
            }
          }}
        >
          Connect labelled demo broker (30 minutes)
        </button>
        {connectError && <p role="alert">{connectError}</p>}
        <fieldset disabled={mutation.busy}>
          <Form
            label="Connect synthetic broker"
            onSave={(v) =>
              void mutation.send("protections/credentials", {
                connector: "broker_mock",
                token: v.token,
                scopes: ["read"],
                ttl_minutes: Number(v.ttl),
              })
            }
          >
            <Field name="token" label="Mock broker token" type="password">
              Use the labelled demo broker token. Do not enter credentials for a
              real account.
            </Field>
            <Field
              name="ttl"
              label="Access duration (minutes)"
              type="number"
              value={30}
            />
            <p>
              Read positions only. Trading, transfers and withdrawals are not
              permitted.
            </p>
          </Form>
        </fieldset>
      </Panel>
      {resource.data?.map((row) => (
        <Panel title={display(row.connector)} key={display(row.id)}>
          <Facts
            rows={[
              ["Scope", display(row.scopes)],
              ["Expires", display(row.expires_at)],
              ["Revoked", display(row.revoked_at)],
              ["Last used", display(row.last_used_at)],
            ]}
          />
          <div className="panel-actions">
            <button
              className="button secondary"
              disabled={mutation.busy || !!row.revoked_at}
              onClick={() =>
                void mutation.send(
                  "protections/credentials/" + pathId(row.id) + "/revoke",
                  {},
                )
              }
            >
              Revoke access
            </button>
            <button
              className="button secondary"
              disabled={mutation.busy || !!row.revoked_at}
              onClick={async () => {
                try {
                  setPositions(
                    await backend(
                      "protections/credentials/" + pathId(row.id) + "/use",
                      {
                        operation: "read_positions",
                        method_id: "portfolio-rebalance",
                      },
                    ),
                  );
                  resource.refresh();
                } catch (e) {
                  setPositions({
                    error: e instanceof Error ? e.message : "Request failed",
                  });
                }
              }}
            >
              Read positions through backend
            </button>
          </div>
        </Panel>
      ))}
      {positions !== undefined && (
        <Panel title="Broker response">
          <Details value={positions} />
          <p>
            These values came from the labelled mock broker. The API returns
            data to the device, never the token.
          </p>
        </Panel>
      )}
    </>
  );
}
export function BackendMemory() {
  const resource = useResource<Row[]>("protections/memory");
  const mutation = useMutation(resource.refresh);
  const [recall, setRecall] = useState<unknown>();
  return (
    <>
      <Heading
        title="Memory"
        description="Sources, proposals and review decisions are stored by the backend."
      />
      <Notice />
      <ResourceState {...resource} />
      <MutationState {...mutation} />
      <Panel title="Propose a note">
        <fieldset disabled={mutation.busy}>
          <Form
            label="Send note to backend"
            onSave={(v) =>
              void mutation.send("protections/memory", {
                text: v.text,
                source: { kind: v.kind, ref: v.ref },
              })
            }
          >
            <Field name="text" label="Note" type="textarea" />
            <Field
              name="kind"
              label="Source kind"
              options={["user", "document", "web", "method"]}
            />
            <Field name="ref" label="Source reference" />
            <p>
              User-written notes may be saved directly. External text waits for
              review.
            </p>
          </Form>
        </fieldset>
      </Panel>
      {resource.data?.map((row) => (
        <MemoryRow key={display(row.id)} row={row} mutation={mutation} />
      ))}
      <Panel title="Recall for a method">
        <button
          className="button secondary"
          onClick={async () => {
            try {
              setRecall(
                await backend("protections/memory/recall?method_id=tender-bid"),
              );
            } catch (e) {
              setRecall({
                error: e instanceof Error ? e.message : "Request failed",
              });
            }
          }}
        >
          Recall approved notes for tender
        </button>
        {recall !== undefined && <Details value={recall} />}
      </Panel>
    </>
  );
}
function MemoryRow({
  row,
  mutation,
}: {
  row: Row;
  mutation: ReturnType<typeof useMutation>;
}) {
  const [consent, setConsent] = useState(false);
  return (
    <Panel title={display(row.status)}>
      <p>{display(row.text)}</p>
      <Facts
        rows={[
          ["Source", display(row.source)],
          ["Instruction-like", display(row.instruction_like)],
          ["Backend explanation", display(row.note)],
        ]}
      />
      {row.instruction_like && (
        <label className="check-field">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          This text is instruction-like. I reviewed it as data, not
          instructions.
        </label>
      )}
      {row.status !== "deleted" && (
        <>
          <div className="panel-actions">
            {["approve", "reject", "delete"].map((action) => (
              <button
                key={action}
                className="button secondary"
                disabled={
                  mutation.busy ||
                  (action === "approve" && !!row.instruction_like && !consent)
                }
                onClick={() =>
                  void mutation.send(
                    "protections/memory/" + pathId(row.id) + "/" + action,
                    {},
                  )
                }
              >
                {action}
              </button>
            ))}
          </div>
          <details>
            <summary>Edit note</summary>
            <fieldset disabled={mutation.busy}>
              <Form
                label="Save edit to backend"
                onSave={(v) =>
                  void mutation.send(
                    "protections/memory/" + pathId(row.id) + "/edit",
                    { text: v["edit-" + String(row.id)] },
                  )
                }
              >
                <Field
                  name={"edit-" + String(row.id)}
                  label="Corrected note"
                  type="textarea"
                  value={display(row.text)}
                />
              </Form>
            </fieldset>
          </details>
        </>
      )}
    </Panel>
  );
}

export function BackendDocuments() {
  const resource = useResource<Row[]>("protections/documents");
  const mutation = useMutation(resource.refresh);
  const [file, setFile] = useState<File>(),
    [method, setMethod] = useState("tender-bid"),
    [detail, setDetail] = useState<unknown>(),
    [error, setError] = useState("");
  async function upload() {
    if (!file) return;
    setError("");
    if (
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      ) ||
      file.size < 1 ||
      file.size > 4000000
    ) {
      setError("Choose a PDF or image between 1 byte and 4 MB.");
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.slice(i, i + 8192));
      await mutation.send("protections/documents", {
        method_id: method,
        filename: file.name,
        mime: file.type,
        base64: btoa(binary),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read file.");
    }
  }
  return (
    <>
      <Heading
        title="Files"
        description="Backend document ingestion and extraction proof."
      />
      <Notice />
      <ResourceState {...resource} />
      <MutationState {...mutation} />
      <Panel title="Process a synthetic document">
        <label className="form-field">
          Method
          <input value={method} onChange={(e) => setMethod(e.target.value)} />
        </label>
        <label className="form-field">
          PDF or image
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            disabled={mutation.busy}
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </label>
        <p>
          The document passes through the backend in plaintext before
          extraction. This is not encrypted upload. Images can consume
          configured NEAR AI credits when you submit.
        </p>
        <button
          className="button primary"
          disabled={!file || mutation.busy}
          onClick={() => void upload()}
        >
          Submit document to backend
        </button>
        {error && <p role="alert">{error}</p>}
      </Panel>
      {resource.data?.map((row) => (
        <Panel key={display(row.id)} title={display(row.filename)}>
          <Facts
            rows={[
              ["Processed by", display(row.processed_by)],
              ["Instruction-like", display(row.instruction_like)],
              ["PII spans", display(row.pii_spans)],
            ]}
          />
          <button
            className="button secondary"
            disabled={mutation.busy}
            onClick={async () => {
              try {
                setDetail(
                  await backend("protections/documents/" + pathId(row.id)),
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Open extraction and proof
          </button>
        </Panel>
      ))}
      {detail !== undefined && (
        <Panel title="Extracted content">
          <Details value={detail} />
        </Panel>
      )}
    </>
  );
}
function BackendBrowser() {
  const mutation = useMutation(() => {});
  return (
    <>
      <Heading
        title="Browser agent"
        description="The backend enforces declared sites and actions."
      />
      <Notice />
      <Panel title="Request an action">
        <fieldset disabled={mutation.busy}>
          <Form
            label="Send browser request"
            onSave={(v) =>
              void mutation.send("protections/browser", {
                method_id: v.method,
                action: v.action,
                url: v.url,
                content: v.content,
              })
            }
          >
            <Field name="method" label="Method" value="tender-bid" />
            <Field
              name="action"
              label="Action"
              options={["open", "download", "submit"]}
            />
            <Field
              name="url"
              label="URL"
              type="url"
              value="http://localhost:8787/mock/portal/"
            />
            <Field
              name="content"
              label="Content for submission"
              type="textarea"
              required={false}
            />
            <p>
              Submissions are held for outbound approval. Login and undeclared
              sites are refused. This is an HTTP agent, not a full browser.
            </p>
          </Form>
        </fieldset>
        <MutationState {...mutation} />
        <Go to="/activity" secondary>
          Review held actions
        </Go>
      </Panel>
    </>
  );
}

export function BackendActivity() {
  const actions = useResource<Row[]>("protections/outbound");
  const audit = useResource<Row[]>("protections/audit");
  const mutation = useMutation(() => {
    actions.refresh();
    audit.refresh();
  });
  return (
    <>
      <Heading
        title="Activity"
        description="Review backend outbound actions and protection events."
      />
      <Notice />
      <MutationState {...mutation} />
      <ResourceState {...actions} />
      <Panel title="Mark synthetic private values">
        <fieldset disabled={mutation.busy}>
          <Form
            label="Register private values"
            onSave={(v) =>
              void mutation.send("protections/private-values", {
                label: v.label,
                values: v.values.split("\n").filter(Boolean),
              })
            }
          >
            <Field name="label" label="Label" />
            <Field name="values" label="Values, one per line" type="textarea" />
          </Form>
        </fieldset>
      </Panel>
      <Panel title="Propose an outbound action">
        <fieldset disabled={mutation.busy}>
          <Form
            label="Request backend review"
            onSave={(v) =>
              void mutation.send("protections/outbound", {
                method_id: v.method,
                destination: v.destination,
                content: v.content,
                params: {},
              })
            }
          >
            <Field name="method" label="Method" value="tender-bid" />
            <Field
              name="destination"
              label="Destination"
              type="url"
              value="http://localhost:8787/mock/portal/submit"
            />
            <Field name="content" label="Exact content" type="textarea" />
          </Form>
        </fieldset>
      </Panel>
      {actions.data?.map((row) => (
        <Panel key={display(row.id)} title={display(row.status)}>
          <Facts
            rows={[
              ["Destination", display(row.destination)],
              ["Exact content", display(row.content)],
              ["Parameters", display(row.params)],
              ["Private values found", display(row.private_values_found)],
              ["Reason", display(row.reason)],
              ["Action hash", display(row.action_hash)],
            ]}
          />
          <div className="panel-actions">
            {row.status === "held_for_approval" && (
              <>
                <button
                  className="button primary"
                  disabled={mutation.busy}
                  onClick={() =>
                    void mutation.send(
                      "protections/outbound/" + pathId(row.id) + "/approve",
                      { action_hash: row.action_hash },
                    )
                  }
                >
                  Approve this exact action
                </button>
                <button
                  className="button secondary"
                  disabled={mutation.busy}
                  onClick={() =>
                    void mutation.send(
                      "protections/outbound/" + pathId(row.id) + "/reject",
                      {},
                    )
                  }
                >
                  Reject
                </button>
              </>
            )}
            {row.status === "approved" && (
              <button
                className="button primary"
                disabled={mutation.busy}
                onClick={() =>
                  void mutation.send(
                    "protections/outbound/" + pathId(row.id) + "/execute",
                    {},
                  )
                }
              >
                Send approved action to mock portal
              </button>
            )}
          </div>
          {row.receipt && <Details value={row.receipt} />}
        </Panel>
      ))}
      <Panel title="Backend audit">
        <ResourceState {...audit} />
        {audit.data?.map((row, i) => (
          <Details key={i} value={row} label={display(row.event)} />
        ))}
      </Panel>
    </>
  );
}

function BackendCommunity({ section }: { section?: string }) {
  const resource = useResource<{
    dao: string;
    balance_near: string;
    available_near: string;
    council: string[];
    bounties: Row[];
    proposals: Row[];
  }>("dao");
  return (
    <>
      <Heading
        title="Community"
        description="Current testnet DAO data from the backend."
      />
      <Tabs
        items={[
          ["Overview", "/community"],
          ["Shared fund", "/community/fund"],
          ["Proposals", "/community/proposals"],
          ["Bounties", "/community/bounties"],
        ]}
      />
      <ResourceState {...resource} />
      {resource.data && (
        <>
          <Panel title="Shared fund">
            <Facts
              rows={[
                ["DAO", resource.data.dao],
                ["Balance", resource.data.balance_near + " NEAR"],
                ["Available", resource.data.available_near + " NEAR"],
                ["Council", resource.data.council.join(", ")],
              ]}
            />
            <button className="button secondary" onClick={resource.refresh}>
              Refresh DAO
            </button>
          </Panel>
          {(!section || section === "proposals") && (
            <Panel title="Proposals">
              {resource.data.proposals.map((p) => (
                <Details
                  key={display(p.id)}
                  value={p}
                  label={display(p.description) + " / " + display(p.status)}
                />
              ))}
              {!resource.data.proposals.length && (
                <Empty>No backend proposals.</Empty>
              )}
            </Panel>
          )}
          {(!section || section === "bounties") && (
            <Panel title="Bounties">
              {resource.data.bounties.map((b, i) => (
                <Details key={i} value={b} label={display(b.description)} />
              ))}
              {!resource.data.bounties.length && (
                <Empty>No backend bounties.</Empty>
              )}
            </Panel>
          )}
        </>
      )}
      <Unavailable
        title="Write operations unavailable"
        text="The current backend exposes DAO reads only. Proposal creation, voting, contribution submission, tests, review, payout and registry publication have no write endpoints. They are not simulated in backend mode."
      />
    </>
  );
}

function BackendBalance() {
  const [id, setId] = useState("");
  return (
    <>
      <Heading
        title="Balance and settlement"
        description="Backend payments use NEAR testnet. No USD demo balance is presented as real funds."
      />
      <Panel title="Inspect a run">
        <label className="form-field">
          Run reference
          <input value={id} onChange={(e) => setId(e.target.value)} />
        </label>
        {id && (
          <Go to={"/connected/runs?run=" + encodeURIComponent(id)}>
            Open run status and settlement
          </Go>
        )}
        <p>
          There is no wallet balance, top-up ledger or seller earnings endpoint.
          Review each run’s on-chain amount and settlement receipt in the buyer
          flow.
        </p>
      </Panel>
      <Connected section="runs" />
    </>
  );
}

export function BackendMarketplace({ parts }: { parts: string[] }) {
  const listing = useResource<ApiMethod[]>("methods");
  const [search, setSearch] = useState("");
  const id = parts[0];
  const detail = useResource<{
    method_id: string;
    owner: string;
    title: string;
    versions: ApiVersion[];
  }>(
    id && !["publish", "mine"].includes(id)
      ? "methods/" + encodeURIComponent(id)
      : "",
  );
  if (id === "publish" || id === "mine")
    return (
      <>
        <Heading title={id === "publish" ? "Create method" : "My methods"} />
        <Unavailable
          title="No seller-write API yet"
          text="Backend registry methods can be viewed, but this API does not expose seller draft saving, publication or authenticated ownership. Mock listings are not mixed with registered methods."
        />
        <Go to="/marketplace">View backend catalog</Go>
      </>
    );
  if (id) {
    const m = detail.data;
    return (
      <>
        <Go to="/marketplace" secondary>
          Back to catalog
        </Go>
        <ResourceState {...detail} />
        {m && (
          <>
            <Heading title={m.title} description={m.owner} />
            <Tabs
              items={[
                ["Overview", "/marketplace/" + id],
                ["Versions", "/marketplace/" + id + "/versions"],
                ["Reviews", "/marketplace/" + id + "/reviews"],
                ["Contributions", "/marketplace/" + id + "/contributions"],
              ]}
            />
            {parts[1] === "reviews" ? (
              <Unavailable
                title="User reviews"
                text="The backend has no ratings or reviews API. No mock score is displayed as a real user rating."
              />
            ) : parts[1] === "contributions" ? (
              <Unavailable
                title="Contributions"
                text="DAO proposals and bounties can be read in Community. Submission, review and contribution-write APIs are not exposed."
              />
            ) : (
              <>
                {[...m.versions].reverse().map((v) => (
                  <Panel key={v.number} title={"Version " + v.number}>
                    <p>
                      <strong>{v.method_kind?.label}</strong>
                    </p>
                    <p>{v.method_kind?.buyer_note}</p>
                    <Facts
                      rows={[
                        ["Price", v.price_near + " NEAR"],
                        ["Runnable", String(v.runnable)],
                        ["Code hash", v.code_hash],
                        ["Manifest hash", v.manifest_hash],
                        ["Parent", display(v.parent)],
                        ["Contributors", display(v.contributors)],
                        ["Allocation", JSON.stringify(v.payout_split_pct)],
                      ]}
                    />
                    <Details
                      value={v.manifest}
                      label="Declared access and steps"
                    />
                    {v.runnable && (
                      <Go
                        to={
                          "/connected/runs?method=" +
                          encodeURIComponent(id) +
                          "&version=" +
                          v.number
                        }
                      >
                        Use registered method
                      </Go>
                    )}
                  </Panel>
                ))}
              </>
            )}
          </>
        )}
      </>
    );
  }
  return (
    <>
      <Heading
        title="Marketplace"
        description="Registered methods and versions loaded directly from NEAR through the backend."
      />
      <ResourceState {...listing} />
      <label className="search-field">
        Search methods
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <div className="market-catalog">
        {listing.data
          ?.filter((m) =>
            (m.title + " " + m.method_id)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((m) => (
            <article className="market-card" key={m.method_id}>
              <Link
                href={"/marketplace/" + m.method_id}
                className="method-card-link"
              >
                <Image
                  src={
                    "/covers/" +
                    (m.method_id.includes("tender") ? "tender" : "portfolio") +
                    ".jpg"
                  }
                  unoptimized
                  alt=""
                  width={144}
                  height={160}
                  className="method-cover"
                />
                <div className="method-card-info">
                  <h2>{m.title}</h2>
                  <p>{m.owner}</p>
                  <span>v{m.latest?.number || "—"}</span>
                  <span>Ratings API unavailable</span>
                  <strong>{m.latest?.price_near || "—"} NEAR</strong>
                  <span>{m.latest?.runnable ? "Runnable" : "Unavailable"}</span>
                </div>
              </Link>
            </article>
          ))}
      </div>
    </>
  );
}
