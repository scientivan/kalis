'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode, type FormEvent } from 'react';
import { useMock, newId } from '../lib/store';
import {
  AccessList,
  AgentPanel,
  BrokerImport,
  MemoryProposals,
  PrivateValues,
  RunReport,
  modelLabel,
} from './protections';
import { money, type Method, type Run, type Scenario, type RouteModel, type Bounty } from '../lib/domain';
import {
  Form,
  Field,
  Check,
  Facts,
  Panel,
  Heading,
  Go,
  Empty,
  Status,
  Cover,
  Rating,
  Tabs,
  workspaceTabs,
  communityTabs,
  FormValues,
} from './ui';

export function Workspace({ section }: { section?: string }) {
  const { state, command } = useMock();
  const router = useRouter();
  if (section === 'new')
    return (
      <>
        <Heading
          title="New work"
          description="Choose a published method. Its version, price and allowed access will stay attached to your work."
        />
        <Panel>
          <Form
            label="Create draft"
            onSave={(v) => {
              const id = newId('run');
              if (command({ type: 'CREATE_RUN', id, methodId: v.method, name: v.name }))
                router.push('/workspace/run/' + id);
            }}
          >
            <Field name="name" label="Work name" />
            <div className="form-field">
              <label htmlFor="method">Method</label>
              <select name="method" id="method">
                {state.methods
                  .filter((m) => m.status === 'published')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} / {m.versions.at(-1)!.id}
                    </option>
                  ))}
              </select>
            </div>
          </Form>
        </Panel>
      </>
    );
  if (section === 'files')
    return (
      <>
        <Heading
          title="Files"
          description="Only filenames are stored. No file content is read or uploaded."
        />
        <Tabs items={workspaceTabs} />
        {state.runs
          .flatMap((r) => r.files.map((f) => ({ file: f, run: r })))
          .map((f, i) => (
            <Panel key={f.run.id + i}>
              <Link href={'/workspace/run/' + f.run.id}>{f.file}</Link>
              <p>{f.run.name}</p>
            </Panel>
          ))}
        {!state.runs.some((r) => r.files.length) && <Empty>Add document metadata to a work draft.</Empty>}
        <Go to="/workspace/new">New work</Go>
      </>
    );
  if (section === 'memory')
    return (
      <>
        <Heading
          title="Memory"
          description="Each note keeps a source. Saving here is an explicit mock approval."
        />
        <Tabs items={workspaceTabs} />
        <MemoryProposals />
        {state.memory.map((m) => (
          <Panel key={m.id}>
            <Form onSave={(v) => command({ type: 'MEMORY', id: m.id, text: v.text, source: v.source })}>
              <Field name="text" label="Memory" type="textarea" value={m.text} />
              <Field name="source" label="Source" value={m.source} />
            </Form>
            <button className="button secondary" onClick={() => command({ type: 'DELETE_MEMORY', id: m.id })}>
              Delete note
            </button>
          </Panel>
        ))}
        <Panel title="Review and save a note">
          <Form
            label="Approve note"
            onSave={(v) => command({ type: 'MEMORY', id: newId('note'), text: v.text, source: v.source })}
          >
            <Field name="text" label="Proposed memory" type="textarea" />
            <Field name="source" label="Source document or run" />
          </Form>
        </Panel>
      </>
    );
  if (section === 'permissions')
    return (
      <>
        <Heading
          title="Private test cases"
          description="Permission for testing is separate from ordinary use and never grants model-training permission."
        />
        <Tabs items={workspaceTabs} />
        {state.grants.map((g) => (
          <Panel key={g.id}>
            <Facts
              rows={[
                ['Case', <Link href={'/workspace/run/' + g.runId}>{g.runId}</Link>],
                ['Candidate', <Link href={'/community/bounties/' + g.candidate}>{g.candidate}</Link>],
                ['Report fields', g.output],
                ['Attempts', g.used + ' / ' + g.attempts],
                ['Expires', g.expires],
                ['State', g.revoked ? 'Revoked' : 'Granted in mock'],
              ]}
            />
            {!g.revoked && (
              <button className="button secondary" onClick={() => command({ type: 'REVOKE', id: g.id })}>
                Revoke mock permission
              </button>
            )}
          </Panel>
        ))}
        {!state.grants.length && <Empty>Grant a test case from a bounty’s testing panel.</Empty>}
      </>
    );
  return (
    <>
      <Heading
        title={section === 'all' ? 'All work' : 'Workspace'}
        description="Your methods, inputs and results in one place."
        action={<Go to="/workspace/new">New work</Go>}
      />
      <Tabs items={workspaceTabs} />
      {!state.runs.length ? (
        <Empty>Start with a method to create your first work draft.</Empty>
      ) : (
        <div className="data-list">
          {state.runs.map((r) => (
            <Link className="data-row" href={'/workspace/run/' + r.id} key={r.id}>
              <span>
                <strong>{r.name}</strong>
                <small>
                  {state.methods.find((m) => m.id === r.methodId)?.name} / {r.version.id}
                </small>
              </span>
              <Status>{r.status}</Status>
              <span>Open →</span>
            </Link>
          ))}
        </div>
      )}
      <Panel title="Continue a complete mock journey">
        <p>
          Select a method, add synthetic input, approve the model and cost, fund escrow, run a scenario and
          inspect the linked result.
        </p>
        <Go to="/marketplace" secondary>
          Browse methods
        </Go>
      </Panel>
    </>
  );
}

export function RunPage({ id }: { id: string }) {
  const { state, command, execute } = useMock();
  const run = state.runs.find((r) => r.id === id);
  const router = useRouter();
  if (!run)
    return (
      <Empty>
        Work not found. <Link href="/workspace">Back to workspace</Link>
      </Empty>
    );
  const m = state.methods.find((m) => m.id === run.methodId)!;
  const editable = ['draft', 'approved'].includes(run.status);
  const total = run.version.price + run.version.infra;
  return (
    <>
      <Link className="back-link" href="/workspace">
        ← Workspace
      </Link>
      <Heading
        title={run.name}
        description={m.name + ' / ' + run.version.id}
        action={<Status>{run.status}</Status>}
      />
      <div className="detail-layout">
        <div className="aside-stack">
          <Panel title="Input and permissions">
            <BrokerImport run={run} />
            {editable ? (
              <Form
                key={run.input}
                label="Save input and permissions"
                onSave={(v) =>
                  command({
                    type: 'CONFIGURE_RUN',
                    id,
                    input: v.input,
                    files: v.document ? [v.document] : run.files,
                    model: v.model as RouteModel,
                    consent: v.consent === 'on',
                    redaction: v.redaction,
                    permissions: v.permissions === 'on',
                    maximum: Math.round(Number(v.maximum) * 100),
                    scenario: v.scenario as Scenario,
                  })
                }
              >
                <Field
                  name="input"
                  label="Synthetic input and constraints"
                  type="textarea"
                  value={
                    run.input ||
                    (m.id === 'portfolio'
                      ? 'Synthetic C03 portfolio. Minimum cash 0. Asset and sector limits apply.'
                      : 'Fictional tender costs and minimum margin 9%.')
                  }
                />
                <Field
                  name="document"
                  label="Document metadata (PDF, scan, image, CSV or JSON)"
                  type="file"
                  required={false}
                >
                  Only the filename is stored. OCR is not performed.
                </Field>
                <div className="form-field">
                  <label htmlFor="model">Allowed AI model route</label>
                  <select name="model" id="model" defaultValue={run.model}>
                    {run.version.models.map((model) => (
                      <option key={model} value={model}>
                        {modelLabel(model)}
                      </option>
                    ))}
                  </select>
                  <small>Seller policy is frozen in this run. A buyer can narrow it, not expand it.</small>
                </div>
                {run.version.models.includes('proprietary') && (
                  <>
                    <p role="note">
                      A proprietary model is not attested. Data leaves the TEE after a privacy filter removes
                      what it can find.
                    </p>
                    <Field
                      name="redaction"
                      label="Redaction plan for a proprietary route"
                      type="textarea"
                      value={run.redaction}
                      required={false}
                    />
                    <Check name="consent" checked={run.consent}>
                      I allow filtered data to leave the TEE for a proprietary provider.
                    </Check>
                  </>
                )}
                <Check name="permissions" checked={run.permissions}>
                  I approve the listed input and model access. External actions need separate review.
                </Check>
                <Field
                  name="maximum"
                  label="Maximum mock payment (USD)"
                  type="number"
                  value={run.maximum / 100}
                />
                <Field
                  name="scenario"
                  label="Mock execution scenario"
                  value={run.scenario}
                  options={[
                    'success',
                    'stage-failure',
                    'hash-mismatch',
                    'no-solution',
                    'local-failure',
                    'timeout',
                  ]}
                />
              </Form>
            ) : (
              <Facts
                rows={[
                  ['Input', run.input],
                  ['Documents', run.files.join(', ') || 'No documents'],
                  ['Model route', modelLabel(run.model)],
                  ['External provider consent', run.consent ? 'Yes' : 'No'],
                  ['Approved limit', money(run.maximum)],
                ]}
              />
            )}
          </Panel>
          <Panel title="What this run may access">
            <AccessList manifest={run.version.manifest} models={run.version.models} />
            <p className="fine-print">
              Frozen from {run.version.id} when this work was created. Anything else is refused.
            </p>
          </Panel>
          {run.version.manifest.outbound.length > 0 && (
            <Panel title="Private values">
              <PrivateValues run={run} />
            </Panel>
          )}
          {run.report && <RunReport run={run} />}
          <AgentPanel run={run} />
          <Panel title="Memory and external actions">
            <p>
              Notes preserve their source. Outbound approval is tied to the exact destination and content,
              independent of payment.
            </p>
            <Go to="/workspace/memory" secondary>
              Review memory
            </Go>{' '}
            {run.version.manifest.outbound.length ? (
              <ExternalReview run={run} />
            ) : (
              <p>This method has no outbound actions. Nothing leaves Kalis.</p>
            )}
          </Panel>
          {run.status === 'completed' && !run.report?.hashes && (
            <Panel title="Review this method">
              <p>Reviews need a completed run with matching references. This run had a mismatch.</p>
            </Panel>
          )}
          {run.status === 'completed' && run.report?.hashes && (
            <Panel title="Review this method">
              <Form
                label="Publish mock review"
                onSave={(v) => {
                  if (command({ type: 'REVIEW_METHOD', id, rating: Number(v.rating), comment: v.comment }))
                    router.push('/marketplace/' + m.id + '/reviews');
                }}
              >
                <Field name="rating" label="Rating" options={['5', '4', '3', '2', '1']} />
                <Field name="comment" label="Experience without private input or output" type="textarea" />
                <Check name="reviewConsent" required>
                  I have removed private information.
                </Check>
              </Form>
            </Panel>
          )}
        </div>
        <aside className="aside-stack">
          <Panel title="Payment and version">
            <Facts
              rows={[
                ['Method', money(run.version.price)],
                ['Infrastructure', money(run.version.infra)],
                ['Total', money(total)],
                ['Version', run.version.id],
                ['Version reference', run.version.hash],
                ['DAO allocation', run.version.share + '% of mock method price'],
                ['Platform', '10% of mock method price'],
                ['Seller', 90 - run.version.share + '% of mock method price'],
                ['Escrow', run.escrow],
              ]}
            />
            <p className="fine-print">
              Allocation base here is a labelled mock convention, pending the final backend contract.
              Infrastructure is separate.
            </p>
            {run.status === 'draft' && (
              <button className="button primary" onClick={() => command({ type: 'APPROVE_RUN', id })}>
                Approve saved terms
              </button>
            )}
            {run.status === 'approved' && (
              <button className="button primary" onClick={() => command({ type: 'FUND_RUN', id })}>
                Fund mock escrow {money(total)}
              </button>
            )}
            {run.status === 'funded' && (
              <button className="button primary" onClick={() => void execute(id)}>
                Run mock method
              </button>
            )}
            {run.status === 'running' && run.scenario !== 'timeout' && (
              <>
                <p role="status">Mock execution in progress…</p>
                <button className="button secondary" onClick={() => command({ type: 'FINISH_RUN', id })}>
                  Resume completion after reload
                </button>
              </>
            )}
            {['funded', 'running'].includes(run.status) && run.scenario === 'timeout' && (
              <button className="button secondary" onClick={() => command({ type: 'RECLAIM_RUN', id })}>
                Advance mock deadline and reclaim
              </button>
            )}
            <div className="panel-actions">
              <Go to="/balance" secondary>
                Add mock funds
              </Go>
              <Go to={'/balance/escrow/' + id} secondary>
                Escrow details
              </Go>
            </div>
          </Panel>
          <Go to={'/marketplace/' + m.id} secondary>
            View method
          </Go>
        </aside>
      </div>
    </>
  );
}
export function ExternalReview({ run }: { run: Run }) {
  const { state, command } = useMock();
  const [decision, setDecision] = useState('');
  const [revision, setRevision] = useState('');
  const [draft, setDraft] = useState({
    destination: run.version.manifest.outbound[0]?.destination ?? '',
    content: 'Public bid summary for ' + run.name,
  });
  const history = state.outbound.filter((o) => o.runId === run.id);
  const record = (d: 'approved' | 'declined', v: { destination: string; content: string }) => {
    if (command({ type: 'OUTBOUND', id: newId('outbound'), runId: run.id, ...v, decision: d })) {
      setRevision(d === 'approved' ? JSON.stringify(v) : '');
      setDecision(
        d === 'approved' ? 'Approved in mock. Nothing was sent.' : 'Declined in mock. Nothing was sent.',
      );
    }
  };
  return (
    <details>
      <summary>Review a mock outbound action</summary>
      <Form
        label="Approve this exact revision"
        onChange={(e) => {
          const f = new FormData(e.currentTarget);
          setDraft({
            destination: String(f.get('destination') ?? ''),
            content: String(f.get('content') ?? ''),
          });
          setDecision('');
          setRevision('');
        }}
        onSave={(v) => record('approved', { destination: v.destination, content: v.content })}
      >
        <Field
          name="destination"
          label="Destination"
          type="url"
          value={run.version.manifest.outbound[0]?.destination ?? ''}
        />
        <Field
          name="content"
          label="Exact content to share"
          type="textarea"
          value={'Public bid summary for ' + run.name}
        />
        <p>Costs and margin are excluded. Editing either field invalidates the displayed approval.</p>
        <Check name="consent" required>
          Approve this destination and content only.
        </Check>
      </Form>
      <button className="button secondary" onClick={() => record('declined', draft)}>
        Decline
      </button>
      <p role="status">{decision}</p>
      {revision && (
        <p>Approval belongs to the saved content snapshot. Submit a new revision after changes.</p>
      )}
      {history.length > 0 && (
        <Facts rows={history.map((o) => [o.decision, o.destination + ' / ' + o.content.slice(0, 60)])} />
      )}
    </details>
  );
}
