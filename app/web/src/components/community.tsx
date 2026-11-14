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
import { ReviewList } from './marketplace';

export function Community({ parts }: { parts: string[] }) {
  const { state, command } = useMock();
  const router = useRouter();
  const section = parts[0] || 'overview';
  const id = parts[1];
  if (section === 'bounties' && id) return <BountyPage id={id} />;
  const issue = id ? state.issues.find((i) => i.id === id) : undefined;
  const proposal = id ? state.proposals.find((p) => p.id === id) : undefined;
  return (
    <>
      <Heading
        title={
          section === 'overview'
            ? 'Community'
            : section === 'fund'
              ? 'Shared fund'
              : section.charAt(0).toUpperCase() + section.slice(1)
        }
        description="Follow a problem through funding, testing, review and a new method version."
      />
      <Tabs items={communityTabs} />
      {section === 'overview' && (
        <div className="detail-layout">
          <Panel title="One connected improvement">
            <p>
              Report a problem, propose a budget, approve mock funding, open a bounty, submit a patch, test
              independently and review it. An accepted change can be paid once and becomes a new method
              version.
            </p>
            <Go to="/community/issues">Start with a problem</Go>
          </Panel>
          <Panel title="Shared mock fund">
            <h2>{money(state.fund)}</h2>
            <p>
              Initial fixture funding plus DAO allocations from completed mock runs, minus approved budgets.
            </p>
            <Go to="/community/fund" secondary>
              View fund
            </Go>
          </Panel>
        </div>
      )}
      {section === 'issues' && (
        <>
          {issue ? (
            <Panel title={issue.title}>
              <Facts
                rows={[
                  ['Method', state.methods.find((m) => m.id === issue.methodId)?.name],
                  ['Version', issue.version],
                  ['Synthetic reproduction', issue.reproduction],
                ]}
              />
              <ProposalForm issueId={issue.id} />
              {state.proposals
                .filter((p) => p.issueId === issue.id)
                .map((p) => (
                  <p key={p.id}>
                    <Link href={'/community/proposals/' + p.id}>
                      {p.id} / {p.state}
                    </Link>
                  </p>
                ))}
            </Panel>
          ) : (
            <>
              <Panel title="Report a problem">
                <Form
                  label="Save problem"
                  onSave={(v) => {
                    const id = newId('issue');
                    if (
                      command({
                        type: 'ISSUE',
                        id,
                        methodId: v.method,
                        title: v.title,
                        reproduction: v.reproduction,
                      })
                    )
                      router.push('/community/issues/' + id);
                  }}
                >
                  <MethodSelect />
                  <Field name="title" label="Problem" />
                  <Field
                    name="reproduction"
                    label="Synthetic reproduction and expected behavior"
                    type="textarea"
                  />
                  <Check name="consent" required>
                    Private input and output are excluded.
                  </Check>
                </Form>
              </Panel>
              {state.issues.map((i) => (
                <p key={i.id}>
                  <Link href={'/community/issues/' + i.id}>{i.title}</Link>
                </p>
              ))}
            </>
          )}
        </>
      )}
      {section === 'proposals' && (
        <>
          {proposal ? (
            <Panel title="Budget proposal">
              <Facts
                rows={[
                  [
                    'Problem',
                    <Link href={'/community/issues/' + proposal.issueId}>
                      {state.issues.find((i) => i.id === proposal.issueId)?.title}
                    </Link>,
                  ],
                  ['Amount', money(proposal.amount)],
                  ['Module', proposal.module],
                  ['Criteria', proposal.criteria],
                  ['Deadline', proposal.deadline],
                  ['State', proposal.state],
                  ['Authority', proposal.vote || 'Awaiting mock member decision'],
                ]}
              />
              {proposal.state === 'proposed' && (
                <div className="panel-actions">
                  <button
                    className="button primary"
                    onClick={() => command({ type: 'VOTE', id: proposal.id, approve: true })}
                  >
                    Approve as mock DAO member
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => command({ type: 'VOTE', id: proposal.id, approve: false })}
                  >
                    Reject proposal
                  </button>
                </div>
              )}
              {proposal.state === 'approved' && !state.bounties.some((b) => b.proposalId === proposal.id) && (
                <button
                  className="button primary"
                  onClick={() => {
                    const id = newId('bounty');
                    if (command({ type: 'OPEN_BOUNTY', id, proposalId: proposal.id }))
                      router.push('/community/bounties/' + id);
                  }}
                >
                  Open funded mock bounty
                </button>
              )}
              {state.bounties
                .filter((b) => b.proposalId === proposal.id)
                .map((b) => (
                  <Go key={b.id} to={'/community/bounties/' + b.id}>
                    View linked bounty
                  </Go>
                ))}
            </Panel>
          ) : (
            <>
              {state.proposals.map((p) => (
                <Panel key={p.id}>
                  <Link href={'/community/proposals/' + p.id}>
                    {state.issues.find((i) => i.id === p.issueId)?.title}
                  </Link>
                  <p>
                    {money(p.amount)} / {p.state}
                  </p>
                </Panel>
              ))}
              {!state.proposals.length && <Empty>Propose a budget from a recorded problem.</Empty>}
              <Go to="/community/issues">View problems</Go>
            </>
          )}
        </>
      )}
      {['bounties', 'contributions'].includes(section) && (
        <>
          {state.bounties
            .filter((b) => section === 'bounties' || b.candidate)
            .map((b) => (
              <Panel key={b.id}>
                <Link href={'/community/bounties/' + b.id}>
                  {state.methods.find((m) => m.id === b.methodId)?.name} / {b.module}
                </Link>
                <p>
                  {money(b.amount)} / {b.state}
                </p>
              </Panel>
            ))}
          {!state.bounties.length && <Empty>Approve a proposal to open a funded bounty.</Empty>}
          <Go to="/community/proposals" secondary>
            View proposals
          </Go>
        </>
      )}
      {section === 'fund' && (
        <>
          <Panel title="Mock treasury">
            <Facts
              rows={[
                ['Available', money(state.fund)],
                [
                  'Reserved budgets',
                  money(
                    state.proposals.filter((p) => p.state === 'approved').reduce((a, p) => a + p.amount, 0) -
                      state.bounties.filter((b) => b.state === 'paid').reduce((a, b) => a + b.amount, 0),
                  ),
                ],
                [
                  'Paid bounties',
                  money(state.bounties.filter((b) => b.state === 'paid').reduce((a, b) => a + b.amount, 0)),
                ],
                ['Authority', 'Mock member and independent reviewer fixtures, not live DAO permissions'],
              ]}
            />
            <p>
              Proposal approval reserves funds once. Accepted bounty payout cannot repeat. These are local
              simulations, not Sputnik DAO operations.
            </p>
          </Panel>
          {state.proposals.map((p) => (
            <p key={p.id}>
              <Link href={'/community/proposals/' + p.id}>
                {p.id} / {p.state}
              </Link>
            </p>
          ))}
        </>
      )}
    </>
  );
}
export function MethodSelect() {
  const { state } = useMock();
  return (
    <div className="form-field">
      <label htmlFor="method">Method</label>
      <select id="method" name="method">
        {state.methods
          .filter((m) => m.status === 'published')
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </select>
    </div>
  );
}
export function ProposalForm({ issueId }: { issueId: string }) {
  const { state, command } = useMock();
  const router = useRouter();
  const issue = state.issues.find((i) => i.id === issueId)!;
  const m = state.methods.find((m) => m.id === issue.methodId)!;
  return (
    <Form
      label="Propose mock budget"
      onSave={(v) => {
        const id = newId('proposal');
        if (
          command({
            type: 'PROPOSE',
            id,
            issueId,
            amount: Math.round(Number(v.amount) * 100),
            criteria: v.criteria,
            module: v.module,
            deadline: v.deadline,
          })
        )
          router.push('/community/proposals/' + id);
      }}
    >
      <h3>Fund an improvement</h3>
      <Field name="amount" label="Budget (mock USD)" type="number" value={5} />
      <Field
        name="module"
        label="Open module"
        options={m.versions.find((v) => v.id === issue.version)!.modules}
      />
      <Field name="criteria" label="Acceptance criteria fixed before candidate work" type="textarea" />
      <Field name="deadline" label="Deadline" type="date" />
    </Form>
  );
}

export function BountyPage({ id }: { id: string }) {
  const { state, command } = useMock();
  const b = state.bounties.find((b) => b.id === id);
  if (!b) return <Empty>Bounty not found.</Empty>;
  const method = state.methods.find((m) => m.id === b.methodId)!;
  const proposal = state.proposals.find((p) => p.id === b.proposalId)!;
  const issue = state.issues.find((i) => i.id === proposal.issueId)!;
  return (
    <>
      <Link className="back-link" href="/community/bounties">
        ← Bounties
      </Link>
      <Heading
        title={issue.title}
        description={method.name + ' / ' + b.module}
        action={<Status>{b.state}</Status>}
      />
      <div className="detail-layout">
        <div className="aside-stack">
          <Panel title="Scope and acceptance">
            <Facts
              rows={[
                ['Problem', <Link href={'/community/issues/' + issue.id}>{issue.title}</Link>],
                ['Budget approval', <Link href={'/community/proposals/' + proposal.id}>{proposal.id}</Link>],
                ['Base version', b.base],
                ['Editable module', b.module],
                ['Criteria', b.criteria],
                ['Deadline', proposal.deadline],
                ['Evaluator', 'Independent mock evaluator, fixed before the candidate'],
              ]}
            />
            <p>
              The candidate cannot modify its evaluator. Synthetic cases are available to contributors.
              Private cases require the owner’s separate permission.
            </p>
          </Panel>
          {['open', 'changes-requested'].includes(b.state) && (
            <Panel title="Submit a candidate">
              <Form
                label="Submit mock patch"
                onSave={(v) =>
                  command({ type: 'SUBMIT', id, patch: v.patch, notes: v.notes, tests: v.tests })
                }
              >
                <Field name="patch" label="Patch artifact reference" value={b.candidate?.patch || ''} />
                <Field
                  name="notes"
                  label="Changes and impact"
                  type="textarea"
                  value={b.candidate?.notes || ''}
                />
                <Field
                  name="tests"
                  label="Synthetic regression cases"
                  type="textarea"
                  value={b.candidate?.tests || ''}
                />
              </Form>
            </Panel>
          )}
          {b.candidate && (
            <Panel title="Candidate">
              <Facts
                rows={[
                  ['Author', b.candidate.author],
                  ['Artifact', b.candidate.patch],
                  ['Changes', b.candidate.notes],
                  ['Regression cases', b.candidate.tests],
                ]}
              />
            </Panel>
          )}
          {['submitted', 'tested'].includes(b.state) && (
            <>
              <Panel title="Private test permission">
                <GrantForm bounty={b} />
              </Panel>
              {b.state === 'submitted' && (
                <Panel title="Independent mock testing">
                  <Form
                    label="Run mock checks"
                    onSave={(v) =>
                      command({ type: 'TEST', id, pass: v.result === 'Pass', grantId: v.grant || undefined })
                    }
                  >
                    <Field name="result" label="Evaluator fixture" options={['Pass', 'Fail']} />
                    <div className="form-field">
                      <label htmlFor="grant">Private permission (optional)</label>
                      <select name="grant" id="grant">
                        <option value="">Synthetic regression only</option>
                        {state.grants
                          .filter((g) => g.candidate === id && !g.revoked)
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.id} / {g.used} of {g.attempts} used
                            </option>
                          ))}
                      </select>
                    </div>
                    <p>This fixture does not read private data or execute submitted code.</p>
                  </Form>
                </Panel>
              )}
            </>
          )}
          {b.test && (
            <Panel title="Test report">
              <Facts
                rows={[
                  ['Baseline', b.test.baseline],
                  ['Candidate', b.test.candidate],
                  ['Regression / criteria', b.test.passed ? 'Passed in fixture' : 'Failed in fixture'],
                  [
                    'Before / after',
                    b.test.passed
                      ? 'Baseline reproduces issue. Candidate resolves it in mock fixtures.'
                      : 'Candidate still fails the fixed acceptance criteria.',
                  ],
                  ['Private case', b.test.privateGrant || 'No private case used'],
                ]}
              />
              <p>Limited report only. A passing fixture is not general proof of method quality.</p>
            </Panel>
          )}
          {b.state === 'tested' && (
            <Panel title="Independent review">
              <Form
                label="Record mock reviewer decision"
                onSave={(v) =>
                  command({
                    type: 'REVIEW',
                    id,
                    decision: v.decision as 'accept' | 'changes' | 'reject',
                    reason: v.reason,
                  })
                }
              >
                <Field
                  name="decision"
                  label="Decision by independent mock reviewer"
                  options={['changes', 'reject', 'accept']}
                />
                <Field name="reason" label="Reasons" type="textarea" />
                <p>
                  Mock reviewer identity is separate from the contributor. No real authority or DAO signature
                  is claimed.
                </p>
              </Form>
            </Panel>
          )}
          {b.review && (
            <Panel title="Review decision">
              <Facts
                rows={[
                  ['Reviewer', b.review.reviewer],
                  ['Decision', b.review.decision],
                  ['Reason', b.review.reason],
                ]}
              />
            </Panel>
          )}
        </div>
        <aside>
          <Panel title="Bounty payment">
            <h2>{money(b.amount)}</h2>
            <p>
              Mock budget was reserved when the proposal was approved. One accepted change can be paid once.
            </p>
            {b.state === 'accepted' && (
              <button className="button primary" onClick={() => command({ type: 'PAYOUT', id })}>
                Pay mock bounty and publish version
              </button>
            )}
            {b.payment && (
              <>
                <Facts
                  rows={[
                    ['Payment', b.payment],
                    ['New version', b.newVersion],
                  ]}
                />
                <Go to={'/marketplace/' + method.id + '/versions'}>View version lineage</Go>
              </>
            )}
            {!['accepted', 'paid'].includes(b.state) && (
              <p>Payment stays unavailable until independent tests pass and the reviewer accepts.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
export function GrantForm({ bounty }: { bounty: Bounty }) {
  const { state, command } = useMock();
  const runs = state.runs.filter((r) => r.methodId === bounty.methodId);
  return !runs.length ? (
    <>
      <p>Create work for this method before granting a case.</p>
      <Go to={'/marketplace/' + bounty.methodId} secondary>
        View method
      </Go>
    </>
  ) : (
    <Form
      label="Grant mock test permission"
      onSave={(v) =>
        command({
          type: 'GRANT',
          id: newId('grant'),
          runId: v.run,
          candidate: bounty.id,
          output: v.output,
          attempts: Number(v.attempts),
          expires: v.expires,
        })
      }
    >
      <div className="form-field">
        <label htmlFor="run">Your case</label>
        <select name="run" id="run">
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <Field name="output" label="Allowed report fields" value="Pass/fail and constraint names only" />
      <Field name="attempts" label="Maximum attempts" type="number" value={1} />
      <Field name="expires" label="Expiry" type="date" />
      <Check name="grantConsent" required>
        I authorize this case only for this candidate’s private testing. This does not permit training.
      </Check>
      <Go to="/workspace/permissions" secondary>
        Inspect and revoke grants
      </Go>
    </Form>
  );
}
