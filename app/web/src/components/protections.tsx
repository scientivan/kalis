'use client';
// UI for the method manifest, execution report and the five protections (RANCANGAN_PRODUK.md 3, 49, 52, 55, 56).
// All data here comes from the mock store. Backend equivalents are listed in app/backend/API.md.
import Link from 'next/link';
import { useState } from 'react';
import { useMock } from '../lib/store';
import type { Manifest, Run, RouteModel, Verdict } from '../lib/domain';
import { Facts, Panel, Form, Field, Check, Go } from './ui';

export const modelLabel = (m: RouteModel) =>
  m === 'none'
    ? 'No AI model. The method is code only'
    : m === 'private'
      ? 'Private model with attestation (NEAR AI Cloud)'
      : 'Proprietary model. Filtered data leaves the TEE';

const list = (items: string[], empty: string) => (items.length ? items.join(', ') : empty);

/** What a method version may touch. Shown before a buyer commits and on the run itself. */
export function AccessList({ manifest, models }: { manifest: Manifest; models: RouteModel[] }) {
  return (
    <Facts
      rows={[
        ['AI models', models.map(modelLabel).join('. ')],
        [
          'Connectors',
          list(
            manifest.connectors.map((c) => c.what + ' (' + c.operations.join(', ') + ')'),
            'None. You provide the input yourself',
          ),
        ],
        ['Documents it reads', list(manifest.documents, 'None')],
        [
          'Can send outside Kalis',
          list(
            manifest.outbound.map((o) => o.what + ' to ' + o.destination + ', only after you approve'),
            'Nothing',
          ),
        ],
        [
          'Memory',
          manifest.memory.read
            ? 'Reads your saved notes. ' +
              (manifest.memory.write === 'proposals' ? 'New notes wait for your approval.' : 'Cannot write.')
            : 'No access',
        ],
        [
          'Browser agent',
          manifest.browser.domains.length
            ? manifest.browser.actions.join(' and ') + ' on ' + manifest.browser.domains.join(', ')
            : 'Not used',
        ],
        ['Seller secrets kept sealed', list(manifest.secrets, 'None declared')],
      ]}
    />
  );
}

const VERDICT_TEXT: Record<Verdict, string> = {
  safe: 'Safe to use',
  attention: 'Needs your attention',
  'do-not-use': 'Do not use this result',
};

export function RunReport({ run }: { run: Run }) {
  const r = run.report!;
  return (
    <Panel title="Execution report">
      <div className={'verdict verdict-' + r.verdict} role="status">
        <strong>{VERDICT_TEXT[r.verdict]}</strong>
        {r.reasons.length > 0 && (
          <ul>
            {r.reasons.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
      </div>
      <p className="fine-print">
        Mock report generated from the saved scenario. It is not a live TEE report. No refund or dispute is
        promised from this status.
      </p>
      <h3>Your answer</h3>
      <p className="output-example">{r.answer}</p>
      <h3>Runner stages</h3>
      <Facts rows={r.runner.map((s) => [s.name, (s.ok ? 'Passed. ' : 'Failed. ') + s.detail])} />
      <h3>Method steps declared by the seller</h3>
      {r.steps.length ? (
        <Facts rows={r.steps.map((s) => [s.name, s.state])} />
      ) : (
        <p>The seller declared no steps for this version. Kalis can only confirm the runner stages.</p>
      )}
      <h3>Checks on your device</h3>
      {r.checkList.length ? (
        <Facts rows={r.checkList.map((c) => [c.name, (c.ok ? 'Passed. ' : 'Failed. ') + c.message])} />
      ) : (
        <p>The seller declared no rules your device can check. This result cannot be checked here.</p>
      )}
      <p className="fine-print">
        These checks cover your limits and cost. They cannot prove the answer is the cheapest.
      </p>
      <h3>Chip proof</h3>
      <Facts
        rows={[
          ['Code that ran matches the registry', r.attestation.wasm ? 'Match' : 'Mismatch'],
          ['Data the chip received matches what you sent', r.attestation.input ? 'Match' : 'Mismatch'],
          ['Answer you received matches what the chip signed', r.attestation.output ? 'Match' : 'Mismatch'],
          ['Completion receipt', run.receipt || 'None'],
        ]}
      />
      <p className="fine-print">
        Compares hashes only. The Intel certificate chain is not verified in this demo.
      </p>
    </Panel>
  );
}

/** Browser agent and document results for methods that declare them (tender). */
export function AgentPanel({ run }: { run: Run }) {
  if (!run.agentLog && !run.documents) return null;
  return (
    <Panel title="Browser agent and documents">
      <p>The agent may only use the sites and actions this method declares.</p>
      {run.agentLog && (
        <Facts rows={run.agentLog.map((a) => [a.action + ' ' + a.url, a.result] as [string, string])} />
      )}
      {run.documents?.map((d) => (
        <section key={d.file}>
          <h3>{d.file}</h3>
          <Facts
            rows={[
              ['Read by', d.processedBy],
              ['Personal data', d.pii],
              ['Instruction-like text', d.instructionLike ? 'Found. Not followed' : 'None found'],
            ]}
          />
          <p>{d.note}</p>
        </section>
      ))}
      <p className="fine-print">
        The browser agent runs on the Kalis backend, not in a TEE, and works at HTTP level. The portal is a
        mock.
      </p>
    </Panel>
  );
}

/** Buyer marks values that must never leave Kalis. Outbound content containing them is held. */
export function PrivateValues({ run }: { run: Run }) {
  const { command } = useMock();
  const editable = ['draft', 'approved'].includes(run.status);
  if (!editable)
    return <Facts rows={[['Values you marked private', run.privateValues.join(', ') || 'None']]} />;
  return (
    <Form
      label="Save private values"
      onSave={(v) => command({ type: 'PRIVATE_VALUES', id: run.id, values: v.values.split('\n') })}
    >
      <Field
        name="values"
        label="Values that must never leave Kalis, one per line"
        type="textarea"
        value={run.privateValues.join('\n') || '812,000,000\n9%'}
        required={false}
      >
        For example your cost price and minimum margin. Any outbound text that contains them is held.
      </Field>
    </Form>
  );
}

export function BrokerImport({ run }: { run: Run }) {
  const { state, command } = useMock();
  if (!run.version.manifest.connectors.some((c) => c.id === 'broker')) return null;
  if (!['draft', 'approved'].includes(run.status)) return null;
  return (
    <div className="panel-actions">
      {state.connections.broker ? (
        <button className="button secondary" onClick={() => command({ type: 'IMPORT_HOLDINGS', id: run.id })}>
          Read positions from the mock broker
        </button>
      ) : (
        <Go to="/connectors" secondary>
          Connect the mock broker to import positions
        </Go>
      )}
    </div>
  );
}

export function MemoryProposals() {
  const { state, command } = useMock();
  if (!state.memoryProposals.length) return null;
  return (
    <Panel title="Waiting for your review">
      <p>These notes came from outside content. Nothing is saved until you approve it.</p>
      {state.memoryProposals.map((p) => (
        <section className="settings-row" key={p.id}>
          <div>
            <h3>{p.text}</h3>
            <p>Source {p.source}</p>
            {p.instructionLike && (
              <p role="alert">
                This reads like an instruction, not a fact. Kalis will not save it as written.
              </p>
            )}
            {p.runId && <Link href={'/workspace/run/' + p.runId}>View the work it came from</Link>}
          </div>
          <div className="panel-actions">
            {!p.instructionLike && (
              <button
                className="button primary"
                onClick={() => command({ type: 'MEMORY_DECIDE', id: p.id, approve: true })}
              >
                Approve
              </button>
            )}
            <button
              className="button secondary"
              onClick={() => command({ type: 'MEMORY_DECIDE', id: p.id, approve: false })}
            >
              Reject
            </button>
          </div>
        </section>
      ))}
    </Panel>
  );
}

export function Onboarding() {
  const { command } = useMock();
  const [name, setName] = useState('');
  return (
    <main className="onboarding" id="main">
      <h1>Welcome to Kalis</h1>
      <p>
        Use other people’s methods on your private data, sell your own, and fund improvements together. This
        demo uses fictional data and mock money only.
      </p>
      <Form
        label="Start"
        onSave={(v) => command({ type: 'ONBOARD', name: v.name })}
        onChange={(e) => setName(String(new FormData(e.currentTarget).get('name') ?? ''))}
      >
        <Field name="name" label="Display name" value={name} />
        <Check name="mock" required>
          I understand prices, payments, ratings and results here are simulated.
        </Check>
        <p className="fine-print">
          No password or wallet is requested. Sign-in will be added with the backend.
        </p>
      </Form>
    </main>
  );
}
