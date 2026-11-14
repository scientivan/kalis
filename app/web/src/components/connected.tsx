"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  backend,
  type ApiConfig,
  type ApiMethod,
  type ApiVersion,
  type Json,
} from "../lib/backend/client";
import * as crypto from "../lib/backend/crypto";
import sample from "../lib/backend/sample.json";
import { Heading, Panel, Facts, Tabs } from "./ui";
type Execution = {
  output: Parameters<typeof crypto.openAnswer>[1];
  completion: { signature_valid: boolean; key_matches_market: boolean };
  attestation: {
    executed_build_ok: boolean;
    input_hash_ok: boolean;
    output_hash_ok: boolean;
  };
  chain: {
    method_sha256: string;
    manifest_sha256: string;
    runner_hash: string;
  };
};
const secrets = new Map<
  string,
  ReturnType<typeof crypto.sealData> & {
    input: typeof sample;
    version: ApiMethod["latest"];
    completionKey: string;
    methodId: string;
  }
>();
function Data({ value }: { value: unknown }) {
  return <pre className="backend-data">{JSON.stringify(value, null, 2)}</pre>;
}
export function Connected({ section }: { section: string }) {
  const [config, setConfig] = useState<ApiConfig>(),
    [methods, setMethods] = useState<ApiMethod[]>([]),
    [selected, setSelected] = useState("portfolio-rebalance");
  const [version, setVersion] = useState<number>(),
    [versions, setVersions] = useState<ApiVersion[]>([]);
  const [input, setInput] = useState(JSON.stringify(sample, null, 2)),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [runId, setRunId] = useState(""),
    [run, setRun] = useState<Json>(),
    [opened, setOpened] = useState<unknown>(),
    [checks, setChecks] = useState<unknown>(),
    [verdict, setVerdict] = useState<{ status: string; reasons: string[] }>(),
    [execution, setExecution] = useState<Execution>(),
    [settled, setSettled] = useState<Json>();
  const [dao, setDao] = useState<Json>(),
    [consent, setConsent] = useState(false),
    [payAttempted, setPayAttempted] = useState(false);
  const [payment, setPayment] = useState("demo_topup");
  const active = useRef(true);
  async function task(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    active.current = true;
    void Promise.all([
      backend<ApiConfig>("config"),
      backend<ApiMethod[]>("methods"),
    ])
      .then(([c, m]) => {
        if (active.current) {
          setConfig(c);
          setMethods(m);
        }
      })
      .catch((e) => {
        if (active.current) setError(e.message);
      });
    const query = new URLSearchParams(window.location.search);
    if (query.get("method")) {
      setSelected(query.get("method")!);
      if (query.get("method") !== "portfolio-rebalance")
        setInput(
          JSON.stringify(
            {
              current_salary: 100000,
              offer: 110000,
              target: 120000,
              constraints: "Synthetic example only",
            },
            null,
            2,
          ),
        );
    }
    if (query.get("version")) setVersion(Number(query.get("version")));
    const previous =
      query.get("run") || sessionStorage.getItem("kalis-live-run");
    if (previous) setRunId(previous);
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setVersions([]);
    void backend<{ versions: ApiVersion[] }>(
      "methods/" + encodeURIComponent(selected),
    )
      .then((d) => {
        if (active) setVersions(d.versions);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  const baseMethod = methods.find((m) => m.method_id === selected);
  const chosen =
    version === undefined
      ? baseMethod?.latest
      : versions.find((v) => v.number === version);
  const method =
    baseMethod && chosen ? { ...baseMethod, latest: chosen } : undefined;
  async function pay() {
    if (!config || !method || !consent) return;
    const data = JSON.parse(input);
    if (
      method.method_id === "portfolio-rebalance" &&
      (!data ||
        !Array.isArray(data.holdings) ||
        data.holdings.length !== 3 ||
        ![
          "holdings",
          "prices",
          "fee_rates",
          "fixed_fees",
          "lower",
          "upper",
        ].every(
          (k) =>
            Array.isArray(data[k]) &&
            data[k].length === 3 &&
            data[k].every(
              (n: unknown) => typeof n === "number" && Number.isFinite(n),
            ),
        ))
    )
      throw new Error(
        "Use a valid three-asset synthetic portfolio with numeric input arrays.",
      );
    const sealed = crypto.sealData(config.runner.tee_pubkey, data);
    setMessage("Creating testnet escrow with a mock fiat top-up…");
    setPayAttempted(true);
    const created = await backend<{
      run_id: string;
      run?: Json;
      contract_call?: Json;
      pay_tx_url: string;
    }>("runs", {
      method_id: method.method_id,
      version: method.latest.number,
      data_ct_sha256: sealed.dataCtSha256,
      payment,
    });
    secrets.set(created.run_id, {
      ...sealed,
      input: data,
      version: structuredClone(method.latest),
      completionKey: config.runner.completion_pubkey,
      methodId: method.method_id,
    });
    setRunId(created.run_id);
    sessionStorage.setItem("kalis-live-run", created.run_id);
    setRun(
      created.run || {
        status: "Awaiting external wallet signing",
        contract_call: created.contract_call || null,
      },
    );
    setMessage(
      payment === "wallet"
        ? "Wallet call prepared. Wallet signing is not integrated. Sign externally, then refresh on-chain status. No payment has been made by this page."
        : "Escrow created. Continue with encrypted execution.",
    );
  }
  async function execute() {
    const seal = secrets.get(runId);
    if (!seal || !config)
      throw new Error(
        "The browser session key is unavailable. Do not pay again. Inspect the existing escrow and backend recovery options.",
      );
    setMessage(
      "OutLayer execution can take up to four minutes. Keep this page open.",
    );
    const ex = await backend<Execution>(
      "runs/" + encodeURIComponent(runId) + "/execute",
      { data: seal.sealed },
    );
    setExecution(ex);
    const result = crypto.openAnswer(seal.secret, ex.output);
    const proof = crypto.verifyCompletion(ex.output, seal.completionKey);
    const check =
      seal.methodId === "portfolio-rebalance"
        ? crypto.recheckPortfolio(seal.input, result.answer)
        : null;
    const summary = crypto.runVerdict({
      opened: result,
      recheck: check,
      checks: null,
      completion: {
        sigOk:
          proof.sigOk &&
          proof.keyOk &&
          proof.record.run_id === runId &&
          proof.record.data_ct_sha256 === seal.dataCtSha256 &&
          proof.record.method_sha256 === seal.version.code_hash &&
          proof.record.manifest_sha256 === seal.version.manifest_hash,
      },
      attestation: ex.attestation,
      chain: {
        method_sha256: seal.version.code_hash,
        manifest_sha256: seal.version.manifest_hash,
        runner_hash: seal.version.runner_hash,
      },
    });
    setOpened(result);
    setChecks(
      check || {
        unavailable:
          "No local buyer checker for this method. Inspect the manifest and result.",
      },
    );
    setVerdict(summary);
    setRun(await backend<Json>("runs/" + encodeURIComponent(runId)));
    setMessage("Answer opened on this device. Inspect checks before acting.");
  }
  return (
    <>
      <Heading
        title="Connected backend"
        description="NEAR testnet and OutLayer. Mock fiat top-up pays from the configured testnet demo account. No real fiat or trading."
      />
      <Tabs
        items={[
          ["Methods", "/connected/methods"],
          ["Work and escrow", "/connected/runs"],
          ["Protections", "/connected/protections"],
          ["Shared fund", "/connected/dao"],
        ]}
      />
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <p role="status">
        {busy ? "Request in progress. " : ""}
        {message}
      </p>
      {config && (
        <Facts
          rows={[
            ["Network", config.network],
            ["Market", config.market],
            ["DAO", config.dao],
          ]}
        />
      )}
      {(section === "methods" || section === "runs") && (
        <div className="detail-layout">
          <Panel title="Published backend methods">
            <label className="form-field">
              Method
              <select
                value={selected}
                disabled={busy || payAttempted}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setVersion(undefined);
                  setInput(
                    e.target.value === "portfolio-rebalance"
                      ? JSON.stringify(sample, null, 2)
                      : JSON.stringify(
                          {
                            current_salary: 100000,
                            offer: 110000,
                            target: 120000,
                            constraints: "Synthetic example only",
                          },
                          null,
                          2,
                        ),
                  );
                }}
              >
                {methods.map((m) => (
                  <option key={m.method_id} value={m.method_id}>
                    {m.title} / v{m.latest.number}
                  </option>
                ))}
              </select>
            </label>
            {versions.length > 0 && (
              <label className="form-field">
                Version
                <select
                  value={version || baseMethod?.latest.number}
                  disabled={busy || payAttempted}
                  onChange={(e) => setVersion(Number(e.target.value))}
                >
                  {versions.map((v) => (
                    <option value={v.number} key={v.number}>
                      v{v.number}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {method && (
              <>
                <p>
                  <strong>
                    {method.latest.method_kind?.label ||
                      "Method type not declared"}
                  </strong>
                </p>
                <p>{method.latest.method_kind?.buyer_note}</p>
                <Facts
                  rows={[
                    ["Creator", method.owner],
                    ["Version", String(method.latest.number)],
                    ["Price", method.latest.price_near + " NEAR"],
                    [
                      "Payout split",
                      JSON.stringify(method.latest.payout_split_pct),
                    ],
                    ["Runnable", String(method.latest.runnable)],
                  ]}
                />
                <details>
                  <summary>Published manifest</summary>
                  <Data value={method.latest.manifest} />
                </details>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    void task(async () => {
                      const detail = await backend<Json>(
                        "methods/" + encodeURIComponent(selected),
                      );
                      setOpened(detail);
                    })
                  }
                >
                  Load backend version history
                </button>
              </>
            )}
            <label className="form-field">
              Synthetic buyer input JSON
              <textarea
                rows={16}
                value={input}
                disabled={busy || payAttempted}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            <p>
              The portfolio is sealed in your browser. Only ciphertext and its
              hash are sent for execution. The session key stays in memory and
              is lost on refresh.
            </p>
            <label className="form-field">
              Payment route
              <select
                value={payment}
                disabled={busy || payAttempted}
                onChange={(e) => setPayment(e.target.value)}
              >
                <option value="demo_topup">
                  Mock fiat top-up / platform testnet account
                </option>
                <option value="wallet">
                  Prepare NEAR wallet contract call
                </option>
              </select>
            </label>
            <p>
              The backend reserves the method price plus a 0.01 NEAR storage
              deposit, with excess returned by the contract. Network gas also
              applies.
            </p>
            <label className="check-field">
              <input
                type="checkbox"
                checked={consent}
                disabled={busy || payAttempted}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I authorize this displayed testnet payment using the mock fiat
              top-up account.
            </label>
            <button
              className="button primary"
              disabled={
                busy ||
                (payment === "demo_topup" && !config?.demo_topup.enabled) ||
                !method?.latest.runnable ||
                !consent ||
                payAttempted
              }
              onClick={() => void task(pay)}
            >
              {payment === "wallet"
                ? "Prepare unsigned wallet request"
                : "Pay testnet escrow with mock fiat top-up"}
            </button>
            {payAttempted && (
              <p>
                A payment attempt was made. Inspect the existing run before
                starting another payment. This page never retries a payment
                automatically.
              </p>
            )}
          </Panel>
          <Panel title="Linked execution and escrow">
            <label className="form-field">
              Backend run reference
              <input
                value={runId}
                disabled={busy}
                onChange={(e) => {
                  setRunId(e.target.value);
                  setRun(undefined);
                  setOpened(undefined);
                  setExecution(undefined);
                  setVerdict(undefined);
                  setChecks(undefined);
                  setSettled(undefined);
                }}
              />
            </label>
            <div className="panel-actions">
              <button
                className="button secondary"
                disabled={busy || !runId}
                onClick={() =>
                  void task(async () =>
                    setRun(
                      await backend<Json>("runs/" + encodeURIComponent(runId)),
                    ),
                  )
                }
              >
                Refresh on-chain status
              </button>
              <button
                className="button primary"
                disabled={busy || !secrets.has(runId)}
                onClick={() => void task(execute)}
              >
                Execute encrypted method
              </button>
              <button
                className="button secondary"
                disabled={busy || !runId}
                onClick={() =>
                  void task(async () =>
                    setSettled(
                      await backend<Json>(
                        "runs/" + encodeURIComponent(runId) + "/settle",
                        {},
                      ),
                    ),
                  )
                }
              >
                Settle this testnet run
              </button>
            </div>
            {run && <Data value={run} />}{" "}
            {verdict && (
              <>
                <h3>Buyer verdict</h3>
                <p>{verdict.status}</p>
                {verdict.reasons.map((r) => (
                  <p key={r}>{r}</p>
                ))}
              </>
            )}
            {opened !== undefined && (
              <>
                <h3>Device-opened result / loaded history</h3>
                <Data value={opened} />
              </>
            )}
            {checks !== undefined && (
              <>
                <h3>Buyer-local checks</h3>
                <Data value={checks} />
              </>
            )}
            {execution && (
              <>
                <h3>Attestation comparisons</h3>
                <Data value={execution.attestation} />
              </>
            )}
            {settled && (
              <>
                <h3>Settlement receipt</h3>
                <Data value={settled} />
              </>
            )}
            <p>
              Hash comparison does not verify the Intel certificate chain. Local
              checks cover limits and cost, not optimality. Settlement follows
              signed completion, not buyer opinion of answer quality.
            </p>
          </Panel>
        </div>
      )}
      {section === "dao" && (
        <Panel title="Shared fund from backend">
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              void task(async () => setDao(await backend<Json>("dao")))
            }
          >
            Load DAO balance, proposals and bounties
          </button>
          {dao && <Data value={dao} />}
          <p>
            The backend currently exposes DAO reads. Proposal creation, voting
            and payout in the local demo remain mock until write APIs are
            available.
          </p>
        </Panel>
      )}
      {section === "protections" && <ProtectionConsole />}
      <p>
        <Link href="/workspace">Return to the separate mock demo</Link>
      </p>
    </>
  );
}
const operations: Record<
  string,
  { path: string; body: Record<string, unknown>; warning?: string }
> = {
  credentials: {
    path: "protections/credentials",
    body: {
      connector: "broker_mock",
      token: "",
      scopes: ["read"],
      ttl_minutes: 30,
    },
  },
  privateValues: {
    path: "protections/private-values",
    body: { label: "Synthetic costs", values: ["812000000"] },
  },
  outbound: {
    path: "protections/outbound",
    body: {
      method_id: "tender-bid",
      destination: "http://localhost:8787/mock/portal/submit",
      content: "Fictional bid summary",
      params: {},
    },
  },
  memory: {
    path: "protections/memory",
    body: {
      text: "Include delivery terms",
      source: { kind: "user", ref: "frontend-review" },
    },
  },
  documents: {
    path: "protections/documents",
    body: {
      method_id: "tender-bid",
      filename: "sample.txt",
      mime: "text/plain",
      base64: "U3ludGhldGljIHRlbmRlciBkb2N1bWVudA==",
    },
  },
  browser: {
    path: "protections/browser",
    body: {
      method_id: "tender-bid",
      action: "open",
      url: "http://localhost:8787/mock/portal/",
    },
  },
};
function ProtectionConsole() {
  const [kind, setKind] = useState("memory"),
    [body, setBody] = useState(JSON.stringify(operations.memory.body, null, 2)),
    [result, setResult] = useState<Json>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [record, setRecord] = useState(""),
    [hash, setHash] = useState("");
  async function send(path: string, value?: unknown) {
    setBusy(true);
    setError("");
    try {
      setResult(await backend<Json>(path, value));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Backend protection operations">
      <p>
        Advanced integration panel. Credentials, outbound, memory and browser
        operations are processed by the backend outside TEE. The operator can
        read their plaintext. Use synthetic values only. Workspace is a demo
        identity, not authentication.
      </p>
      <label className="form-field">
        Operation
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setBody(JSON.stringify(operations[e.target.value].body, null, 2));
            setResult(undefined);
          }}
        >
          {Object.keys(operations).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        API request JSON
        <textarea
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <button
        className="button primary"
        disabled={busy}
        onClick={() => {
          try {
            const parsed = JSON.parse(body);
            void send(operations[kind].path, parsed);
          } catch {
            setError("Enter valid JSON.");
          }
        }}
      >
        Submit synthetic operation
      </button>
      <div className="panel-actions">
        {["credentials", "outbound", "memory", "documents", "audit"].map(
          (k) => (
            <button
              className="button secondary"
              key={k}
              disabled={busy}
              onClick={() => void send("protections/" + k)}
            >
              Load {k}
            </button>
          ),
        )}
      </div>
      <label className="form-field">
        Selected record ID
        <input value={record} onChange={(e) => setRecord(e.target.value)} />
      </label>
      <label className="form-field">
        Exact outbound action hash from backend
        <input value={hash} onChange={(e) => setHash(e.target.value)} />
      </label>
      <div className="panel-actions">
        {(kind === "credentials"
          ? ["revoke", "use"]
          : kind === "memory"
            ? ["approve", "reject", "delete"]
            : kind === "outbound"
              ? ["approve", "reject", "execute"]
              : []
        ).map((action) => (
          <button
            key={action}
            className="button secondary"
            disabled={
              busy ||
              !record ||
              (kind === "outbound" && action === "approve" && !hash)
            }
            onClick={() =>
              void send(
                "protections/" +
                  kind +
                  "/" +
                  encodeURIComponent(record) +
                  "/" +
                  action,
                kind === "outbound" && action === "approve"
                  ? { action_hash: hash }
                  : kind === "credentials" && action === "use"
                    ? {
                        operation: "read_positions",
                        method_id: "portfolio-rebalance",
                      }
                    : {},
              )
            }
          >
            {action} selected record
          </button>
        ))}
      </div>
      {busy && <p role="status">Backend request in progress…</p>}
      {error && <p role="alert">{error}</p>}
      {result && <Data value={result} />}
    </Panel>
  );
}
