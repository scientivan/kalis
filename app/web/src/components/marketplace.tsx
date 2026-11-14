'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode, type FormEvent } from 'react';
import { useMock, newId } from '../lib/store';
import { AccessList } from './protections';
import {
  CATEGORIES,
  money,
  type Method,
  type Run,
  type Scenario,
  type RouteModel,
  type Bounty,
} from '../lib/domain';
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

const lines = (v = '') =>
  v
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
export function Marketplace({ parts }: { parts: string[] }) {
  const { state, command } = useMock();
  const router = useRouter();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('All methods');
  if (parts[0] === 'publish')
    return (
      <>
        <Heading
          title="Create method"
          description="Save a listing and its manifest together, then review and publish into the mock catalog."
        />
        <Panel>
          <Form
            label="Save method draft"
            onSave={(v) => {
              const id = newId('method');
              if (
                command({
                  type: 'SAVE_METHOD',
                  id,
                  name: v.name,
                  description: v.description,
                  input: v.input,
                  output: v.output,
                  limits: v.limits,
                  cover: v.cover,
                  category: v.category,
                  price: Math.round(Number(v.price) * 100),
                  share: Number(v.share),
                  models: v.models === 'private' ? ['private'] : ['private', 'proprietary'],
                  module: v.module,
                  steps: v.steps.split('\n').filter(Boolean),
                  checks: v.checks.split('\n').filter(Boolean),
                  manifest: {
                    connectors:
                      v.connector === 'Broker positions (read only)'
                        ? [
                            {
                              id: 'broker',
                              operations: ['Read positions'],
                              what: 'Read positions from a broker the buyer connects',
                            },
                          ]
                        : [],
                    documents: lines(v.documents),
                    outbound: lines(v.outbound).map((destination) => ({
                      destination,
                      what: 'Send a result the buyer approves',
                    })),
                    memory: {
                      read: v.memory !== 'No access',
                      write: v.memory === 'Read and propose new notes' ? 'proposals' : 'none',
                    },
                    browser: { domains: lines(v.domains), actions: lines(v.actions) },
                    secrets: lines(v.secrets),
                  },
                })
              )
                router.push('/marketplace/' + id);
            }}
          >
            <Field name="name" label="Method name" />
            <Field name="category" label="Category" options={CATEGORIES} />
            <Field name="description" label="Description" type="textarea" />
            <Field name="cover" label="Cover" options={['portfolio', 'tender', 'salary']} />
            <Field name="input" label="Required input" type="textarea" />
            <Field name="output" label="Expected output" type="textarea" />
            <Field name="limits" label="Limitations" type="textarea" />
            <Field name="price" label="Method price (mock USD)" type="number" value={1} />
            <Field name="share" label="Shared fund allocation (%)" type="number" value={10} />
            <Field
              name="models"
              label="Allowed model routes"
              options={['private', 'private and proprietary']}
            />
            <Field name="module" label="Module open for contribution" />
            <Field
              name="steps"
              label="Declared method steps, one per line"
              type="textarea"
              value={'Validate input\nCalculate plan\nReturn answer'}
            />
            <Field
              name="checks"
              label="Buyer-checkable rules, one per line"
              type="textarea"
              required={false}
            />
            <h3>What the method may access</h3>
            <p>Buyers see this list before they run your method. Kalis refuses anything outside it.</p>
            <Field name="connector" label="Connector" options={['None', 'Broker positions (read only)']} />
            <Field
              name="documents"
              label="Document types it reads, one per line"
              type="textarea"
              required={false}
            />
            <Field
              name="outbound"
              label="Allowed https destinations, one per line"
              type="textarea"
              required={false}
            >
              Each send still needs the buyer’s approval of the exact content.
            </Field>
            <Field
              name="memory"
              label="Memory"
              options={['No access', 'Read notes', 'Read and propose new notes']}
            />
            <Field
              name="domains"
              label="Browser agent sites, one per line"
              type="textarea"
              required={false}
            />
            <Field
              name="actions"
              label="Browser agent actions, one per line (open, download)"
              type="textarea"
              required={false}
            />
            <Field
              name="secrets"
              label="Secret parameter names, one per line"
              type="textarea"
              required={false}
            >
              Only names. Values are sealed to the TEE later and never shown to buyers.
            </Field>
            <Field name="code" label="WASM artifact metadata" type="file" required={false}>
              No contents are uploaded or executed. Registry hashes are mock references.
            </Field>
          </Form>
        </Panel>
      </>
    );
  if (parts[0] && parts[0] !== 'mine') {
    const m = state.methods.find((m) => m.id === parts[0]);
    if (!m) return <Empty>Method not found.</Empty>;
    const v = m.versions.at(-1)!;
    const section = parts[1] || 'overview';
    if (!['overview', 'reviews', 'versions', 'contributions', 'creator'].includes(section))
      return <Empty>Method page not found.</Empty>;
    return (
      <>
        <Link className="back-link" href="/marketplace">
          ← Marketplace
        </Link>
        <header className="method-profile">
          <Cover method={m} />
          <div>
            <span className="method-category">{m.category}</span>
            <h1>{m.name}</h1>
            <p>{m.description}</p>
            <div className="market-product-meta">
              <Link href={'/marketplace/' + m.id + '/creator'}>{m.creator}</Link>
              <span>{v.id}</span>
              <Link href={'/marketplace/' + m.id + '/reviews'}>
                <Rating method={m} />
              </Link>
            </div>
          </div>
        </header>
        <Tabs
          items={['Overview', 'Reviews', 'Versions', 'Contributions'].map((n) => [
            n,
            '/marketplace/' + m.id + (n === 'Overview' ? '' : '/' + n.toLowerCase()),
          ])}
        />
        <div className="detail-layout">
          <div className="aside-stack">
            {section === 'overview' && (
              <>
                <Panel title="What you get">
                  <p className="output-example">{m.output}</p>
                  <Facts
                    rows={[
                      ['Input', m.input],
                      ['Limitations', m.limits],
                      ['Open for contribution', v.modules.join(', ') || 'Nothing yet'],
                      ['Declared steps', v.steps.join('. ') || 'None declared'],
                      [
                        'Rules your device can check',
                        v.checks.join(', ') || 'None. Results cannot be checked on your device',
                      ],
                    ]}
                  />
                  <p>Your real result appears on your own work, with its report. It is never shown here.</p>
                </Panel>
                <Panel title="What this method can access">
                  <AccessList manifest={v.manifest} models={v.models} />
                </Panel>
                <Panel title={'Test results for ' + v.id}>
                  {v.evidence.length ? (
                    v.evidence.map((e) => <p key={e}>{e}</p>)
                  ) : (
                    <p>The seller has published no test results for this version.</p>
                  )}
                  <p className="fine-print">Test results are separate from user ratings.</p>
                </Panel>
                <ReviewList method={m} />
              </>
            )}
            {section === 'reviews' && <ReviewList method={m} />}{' '}
            {section === 'creator' && (
              <Panel title={m.creator}>
                <p>
                  Mock creator identity for testing the marketplace. No real expert credentials or
                  endorsements are claimed.
                </p>
                <h3>Published methods</h3>
                {state.methods
                  .filter((x) => x.creator === m.creator && x.status === 'published')
                  .map((x) => (
                    <p key={x.id}>
                      <Link href={'/marketplace/' + x.id}>{x.name}</Link>
                    </p>
                  ))}
              </Panel>
            )}
            {section === 'versions' && (
              <Panel title="Version history">
                {[...m.versions].reverse().map((version) => (
                  <section className="version-entry" key={version.id}>
                    <h3>{version.id}</h3>
                    <Facts
                      rows={[
                        ['Parent', version.parent || 'Initial version'],
                        ['Attribution', version.contributor || m.creator],
                        ['Registry reference', version.hash],
                        ['Method price', money(version.price)],
                      ]}
                    />
                    {state.bounties
                      .filter((b) => b.methodId === m.id && b.newVersion === version.id)
                      .map((b) => (
                        <Link key={b.id} href={'/community/bounties/' + b.id}>
                          View accepted change and mock payout
                        </Link>
                      ))}
                  </section>
                ))}
              </Panel>
            )}
            {section === 'contributions' && (
              <Panel title="Improve this method">
                <p>Only these modules are open: {v.modules.join(', ')}. The private core is not shared.</p>
                <Go to={'/community/issues?method=' + m.id}>Report a problem</Go>
                {state.bounties
                  .filter((b) => b.methodId === m.id)
                  .map((b) => (
                    <p key={b.id}>
                      <Link href={'/community/bounties/' + b.id}>
                        {b.module} / {b.state}
                      </Link>
                    </p>
                  ))}
              </Panel>
            )}
          </div>
          <aside>
            <Panel title={m.status === 'draft' ? 'Review your listing' : 'Use this method'}>
              <Facts
                rows={[
                  ['Method price', money(v.price)],
                  ['Infrastructure (mock)', money(v.infra)],
                  ['Total', money(v.price + v.infra)],
                  ['Status', m.status],
                ]}
              />
              {m.status === 'draft' ? (
                <button
                  className="button primary"
                  onClick={() => command({ type: 'PUBLISH_METHOD', id: m.id })}
                >
                  Publish to mock catalog
                </button>
              ) : m.status === 'published' ? (
                <button
                  className="button primary"
                  onClick={() => {
                    const id = newId('run');
                    if (command({ type: 'CREATE_RUN', id, methodId: m.id, name: m.name + ' work' }))
                      router.push('/workspace/run/' + id);
                  }}
                >
                  Use method
                </button>
              ) : (
                <button disabled className="button primary">
                  Concept only
                </button>
              )}
              <p className="fine-print">Mock prices and creator profiles. No real purchase or publication.</p>
            </Panel>
          </aside>
        </div>
      </>
    );
  }
  const mine = parts[0] === 'mine';
  const list = state.methods.filter(
    (m) =>
      (mine ? m.owned : m.status !== 'draft') &&
      (category === 'All methods' || m.category === category) &&
      (m.name + ' ' + m.description).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading
        title={mine ? 'My methods' : 'Marketplace'}
        description="Find a method for your next decision."
        action={
          <Go to="/marketplace/publish" secondary>
            Create method
          </Go>
        }
      />
      <Tabs
        items={[
          ['Discover', '/marketplace'],
          ['My methods', '/marketplace/mine'],
        ]}
      />
      <div className="view-toolbar">
        <label className="search-field">
          Search methods
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="search-field">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {['All methods', 'Finance', 'Business', 'Career'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <p>{list.length} methods</p>
      <div className="market-catalog">
        {list.map((m) => (
          <article className="market-card" key={m.id}>
            <Link className="method-card-link" href={'/marketplace/' + m.id}>
              <Cover method={m} />
              <div className="method-card-info">
                <span className="method-category">{m.category}</span>
                <h2>{m.name}</h2>
                <p className="method-card-description">{m.description}</p>
                <span className="creator-line">{m.creator}</span>
                <Rating method={m} />
                <div className="market-card-bottom">
                  <span>{m.status}</span>
                  <strong>
                    {m.status === 'concept' ? 'Unavailable' : money(m.versions.at(-1)!.price) + ' / mock run'}
                  </strong>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
      {!list.length && <Empty>No methods match. Change the filter or create a method draft.</Empty>}
    </>
  );
}
export function ReviewList({ method }: { method: Method }) {
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: method.reviews.filter((r) => r.rating === n).length,
  }));
  return (
    <Panel title="User reviews">
      <Rating method={method} />
      <p>All reviews in this demo come from completed mock runs. No real user testimonials.</p>
      <div className="reviews-distribution">
        {distribution.map((r) => (
          <div key={r.n}>
            <span>{r.n} stars</span>
            <progress
              value={r.count}
              max={Math.max(method.reviews.length, 1)}
              aria-label={r.n + ' star reviews'}
            />
            <span>{r.count}</span>
          </div>
        ))}
      </div>
      {method.reviews.map((r) => (
        <article className="review-entry" key={r.runId}>
          <strong>{r.rating} / 5</strong>
          <small>{r.version} / Mock buyer</small>
          <p>{r.comment}</p>
          <Link href={'/workspace/run/' + r.runId}>View associated mock work</Link>
        </article>
      ))}
      {!method.reviews.length && <Empty>No reviews yet. Complete a mock run to write one.</Empty>}
    </Panel>
  );
}
