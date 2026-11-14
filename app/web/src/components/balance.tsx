'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode, type FormEvent } from 'react';
import { useMock, newId } from '../lib/store';
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

export function Balance({ parts }: { parts: string[] }) {
  const { state, command } = useMock();
  const [failed, setFailed] = useState(false);
  const [paymentRoute, setPaymentRoute] = useState('fiat');
  if (parts[0] === 'escrow' && parts[1]) {
    const r = state.runs.find((r) => r.id === parts[1]);
    return r ? (
      <>
        <Heading
          title="Escrow details"
          description="Mock settlement is linked to this work’s immutable terms."
        />
        <Panel>
          <Facts
            rows={[
              ['Work', <Link href={'/workspace/run/' + r.id}>{r.name}</Link>],
              ['Run reference', r.id],
              ['Held amount', money(r.version.price + r.version.infra)],
              ['State', r.escrow],
              ['Run status', r.status],
              ['Mock deadline', String(r.deadline)],
              ['Mock clock', String(state.clock)],
              ['Completion', r.receipt || 'Not received'],
              ['Seller', r.split ? money(r.split.seller) : 'Not paid'],
              ['DAO', r.split ? money(r.split.dao) : 'Not paid'],
              ['Platform', r.split ? money(r.split.platform) : 'Not paid'],
              ['Returned', r.escrow === 'returned' ? money(r.version.price + r.version.infra) : money(0)],
            ]}
          />
          <p>
            Failed stages return mock funds. Matching signed stage completion releases them, including a valid
            no-solution answer. Local checks and hash warnings are separate from the completion status.
          </p>
          {['funded', 'running'].includes(r.status) && r.scenario === 'timeout' && (
            <button className="button primary" onClick={() => command({ type: 'RECLAIM_RUN', id: r.id })}>
              Advance mock deadline and reclaim
            </button>
          )}
          <Go to={'/workspace/run/' + r.id} secondary>
            View work and report
          </Go>
        </Panel>
      </>
    ) : (
      <Empty>Escrow record not found.</Empty>
    );
  }
  const section = parts[0];
  return (
    <>
      <Heading
        title={section === 'earnings' ? 'Earnings' : section === 'transactions' ? 'Transactions' : 'Balance'}
        description="Personal funds, method earnings and the shared fund remain separate."
      />
      <Tabs
        items={[
          ['Overview', '/balance'],
          ['Transactions', '/balance/transactions'],
          ['Earnings', '/balance/earnings'],
        ]}
      />
      {!section && (
        <div className="detail-layout">
          <Panel title="Available mock balance">
            <h2 className="balance-number">{money(state.balance)}</h2>
            <p>Mock money has no real value. No bank or wallet is accessed.</p>
            <label className="form-field">
              Payment route
              <select value={paymentRoute} onChange={(e) => setPaymentRoute(e.target.value)}>
                <option value="fiat">Fiat top-up mock</option>
                <option value="crypto">Crypto payment mock</option>
              </select>
            </label>
            <Form
              label={failed ? 'Retry mock top-up' : 'Add mock funds'}
              onSave={(v) => {
                if (v.failure === 'on' && !failed) {
                  setFailed(true);
                  return;
                }
                if (
                  command({ type: 'TOP_UP', id: newId('topup'), amount: Math.round(Number(v.amount) * 100) })
                )
                  setFailed(false);
              }}
            >
              <Field name="amount" label="Amount (mock USD)" type="number" value={10} />
              <Check name="failure">Simulate one unsuccessful top-up</Check>
              {failed && (
                <p role="alert">Simulated payment failure. Balance is unchanged. Retry to complete.</p>
              )}
            </Form>
            <p>
              {paymentRoute === 'crypto'
                ? 'Crypto selection is a simulated funding path. No signing occurs.'
                : 'Fiat uses a labelled mock, as agreed for the MVP.'}
            </p>
          </Panel>
          <Panel title="Escrow records">
            {state.runs
              .filter((r) => r.escrow !== 'none')
              .map((r) => (
                <p key={r.id}>
                  <Link href={'/balance/escrow/' + r.id}>
                    {r.name} / {r.escrow}
                  </Link>
                </p>
              ))}
            {!state.runs.some((r) => r.escrow !== 'none') && (
              <Empty>Fund an approved work draft to create a linked escrow.</Empty>
            )}
            <Go to="/workspace" secondary>
              View work
            </Go>
          </Panel>
        </div>
      )}
      {section === 'transactions' && (
        <Panel title="Transaction history">
          {state.transactions.map((t) => (
            <div className="data-row" key={t.id}>
              <span>
                <strong>{t.kind}</strong>
                <small>{t.id}</small>
              </span>
              <span>{money(t.amount)}</span>
              {t.runId && <Link href={'/balance/escrow/' + t.runId}>View run escrow</Link>}
            </div>
          ))}
          {!state.transactions.length && <Empty>No mock transactions yet.</Empty>}
        </Panel>
      )}
      {section === 'earnings' && (
        <Panel title="Method revenue">
          <h2>{money(state.earnings)}</h2>
          <p>Seller allocations from completed mock methods, separate from bounty income.</p>
          {state.runs
            .filter((r) => r.split)
            .map((r) => (
              <p key={r.id}>
                <Link href={'/balance/escrow/' + r.id}>{r.name}</Link> {money(r.split!.seller)}
              </p>
            ))}
          <h3>Bounty income</h3>
          {state.bounties
            .filter((b) => b.payment)
            .map((b) => (
              <p key={b.id}>
                <Link href={'/community/bounties/' + b.id}>{b.id}</Link> {money(b.amount)}
              </p>
            ))}
        </Panel>
      )}
    </>
  );
}
export function Activity() {
  const { state } = useMock();
  return (
    <>
      <Heading
        title="Activity"
        description="Each event links to the work, escrow, contribution or version that produced it."
      />
      {state.activities.map((a) => (
        <Link className="data-row" key={a.id} href={a.href}>
          {a.text}
          <span>View →</span>
        </Link>
      ))}
      {!state.activities.length && <Empty>Your mock activity will appear as you work.</Empty>}
      {(state.memoryProposals.length > 0 || state.outbound.some((o) => o.decision === 'blocked')) && (
        <Panel title="Needs your decision">
          {state.memoryProposals.length > 0 && (
            <Link className="data-row" href="/workspace/memory">
              {state.memoryProposals.length} memory change(s) from outside content wait for review
              <span>Review</span>
            </Link>
          )}
          {state.outbound
            .filter((o) => o.decision === 'blocked')
            .map((o) => (
              <Link className="data-row" key={o.id + '-held'} href={'/workspace/run/' + o.runId}>
                <span>
                  <strong>Held. Nothing was sent</strong>
                  <small>{o.reason}</small>
                </span>
                <span>View work</span>
              </Link>
            ))}
        </Panel>
      )}
      {state.outbound.length > 0 && (
        <Panel title="Outbound reviews">
          <p>Each decision is tied to one destination and one exact content revision. Nothing was sent.</p>
          {state.outbound.map((o) => (
            <Link className="data-row" key={o.id} href={'/workspace/run/' + o.runId}>
              <span>
                <strong>
                  {o.decision === 'approved'
                    ? 'Approved'
                    : o.decision === 'blocked'
                      ? 'Held by Kalis'
                      : 'Declined'}
                </strong>
                <small>{o.destination}</small>
              </span>
              <span>{o.reason ?? o.content.slice(0, 80)}</span>
            </Link>
          ))}
        </Panel>
      )}
    </>
  );
}
