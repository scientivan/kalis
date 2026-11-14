import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, type State, type Command, type Scenario } from '../src/lib/domain';

function buyer(scenario: Scenario = 'success') {
  let s = initialState();
  const send = (c: Command) => {
    s = transition(s, c);
  };
  send({ type: 'TOP_UP', id: 'topup', amount: 1000 });
  send({ type: 'CREATE_RUN', id: 'run', methodId: 'portfolio', name: 'Private portfolio' });
  send({
    type: 'CONFIGURE_RUN',
    id: 'run',
    input: 'Synthetic C03',
    files: ['sample.csv'],
    model: 'none',
    consent: false,
    redaction: '',
    permissions: true,
    maximum: 120,
    scenario,
  });
  send({ type: 'APPROVE_RUN', id: 'run' });
  send({ type: 'FUND_RUN', id: 'run' });
  return {
    get state() {
      return s;
    },
    send,
  };
}
function contribution(start: State = initialState()) {
  let s = start;
  const send = (c: Command) => {
    s = transition(s, c);
  };
  send({
    type: 'ISSUE',
    id: 'issue',
    methodId: 'portfolio',
    title: 'Fix allocation edge case',
    reproduction: 'Synthetic boundary input',
  });
  send({
    type: 'PROPOSE',
    id: 'proposal',
    issueId: 'issue',
    amount: 500,
    module: 'allocation',
    criteria: 'Cash and allocation constraints hold. Existing regressions pass.',
    deadline: '2099-11-14',
  });
  send({ type: 'VOTE', id: 'proposal', approve: true });
  send({ type: 'OPEN_BOUNTY', id: 'bounty', proposalId: 'proposal' });
  send({
    type: 'SUBMIT',
    id: 'bounty',
    patch: 'mock-patch-1',
    notes: 'Fix allocation boundary',
    tests: 'Synthetic regression',
  });
  return {
    get state() {
      return s;
    },
    send,
  };
}
test('purchase carries exact terms into result, escrow, rating and ledger', () => {
  const b = buyer();
  assert.equal(b.state.balance, 880);
  assert.equal(b.state.runs[0].escrow, 'held');
  b.send({ type: 'START_RUN', id: 'run' });
  b.send({ type: 'FINISH_RUN', id: 'run' });
  const r = b.state.runs[0];
  assert.equal(r.status, 'completed');
  assert.equal(r.version.id, 'v1');
  assert.deepEqual(r.split, { seller: 80, dao: 10, platform: 10 });
  assert.equal(b.state.fund, 5010);
  assert.equal(r.escrow, 'released');
  b.send({ type: 'REVIEW_METHOD', id: 'run', rating: 4, comment: 'Mock experience' });
  assert.equal(b.state.methods[0].reviews[0].version, 'v1');
  assert.equal(b.state.methods[0].reviews[0].runId, 'run');
  assert.throws(() => b.send({ type: 'FINISH_RUN', id: 'run' }));
  assert.throws(() => b.send({ type: 'REVIEW_METHOD', id: 'run', rating: 5, comment: 'Duplicate' }));
});
test('stage failure returns held funds exactly once', () => {
  const b = buyer('stage-failure');
  b.send({ type: 'START_RUN', id: 'run' });
  b.send({ type: 'FINISH_RUN', id: 'run' });
  assert.equal(b.state.balance, 1000);
  assert.equal(b.state.fund, 5000);
  assert.equal(b.state.runs[0].escrow, 'returned');
  assert.equal(b.state.runs[0].report!.steps[1].state, 'missing');
  assert.throws(() => b.send({ type: 'FINISH_RUN', id: 'run' }));
});
test('timeout reclaim is linked and cannot pay twice', () => {
  const b = buyer('timeout');
  b.send({ type: 'START_RUN', id: 'run' });
  assert.throws(() => b.send({ type: 'FINISH_RUN', id: 'run' }));
  b.send({ type: 'RECLAIM_RUN', id: 'run' });
  assert.equal(b.state.balance, 1000);
  assert.equal(b.state.runs[0].status, 'timed-out');
  assert.throws(() => b.send({ type: 'RECLAIM_RUN', id: 'run' }));
});
test('no solution and local check failure do not invent failed stage receipts', () => {
  for (const scenario of ['no-solution', 'local-failure', 'hash-mismatch'] as const) {
    const b = buyer(scenario);
    b.send({ type: 'START_RUN', id: 'run' });
    b.send({ type: 'FINISH_RUN', id: 'run' });
    assert.equal(b.state.runs[0].escrow, 'released');
    if (scenario === 'local-failure') assert.equal(b.state.runs[0].report!.checks, 'failed');
    if (scenario === 'hash-mismatch') {
      assert.equal(b.state.runs[0].report!.hashes, false);
      assert.throws(() =>
        b.send({ type: 'REVIEW_METHOD', id: 'run', rating: 5, comment: 'Do not publish this' }),
      );
    }
  }
});
test('saved terms cannot change after funds are held', () => {
  const b = buyer();
  const before = structuredClone(b.state);
  assert.throws(() =>
    b.send({
      type: 'CONFIGURE_RUN',
      id: 'run',
      input: 'Changed',
      files: [],
      model: 'none',
      consent: false,
      redaction: '',
      permissions: true,
      maximum: 999,
      scenario: 'success',
    }),
  );
  assert.deepEqual(b.state, before);
});
test('seller model limits and proprietary consent are enforced from run snapshot', () => {
  let s = initialState();
  s.methods[0].versions[0].models = ['private'];
  s = transition(s, { type: 'CREATE_RUN', id: 'a', methodId: 'portfolio', name: 'A' });
  assert.throws(() =>
    transition(s, {
      type: 'CONFIGURE_RUN',
      id: 'a',
      input: 'X',
      files: [],
      model: 'proprietary',
      consent: true,
      redaction: 'Redact',
      permissions: true,
      maximum: 120,
      scenario: 'success',
    }),
  );
  s = initialState();
  s.methods[1].versions[0].models = ['private', 'proprietary'];
  s = transition(s, { type: 'CREATE_RUN', id: 'a', methodId: 'tender', name: 'A' });
  s = transition(s, {
    type: 'CONFIGURE_RUN',
    id: 'a',
    input: 'X',
    files: [],
    model: 'proprietary',
    consent: false,
    redaction: '',
    permissions: true,
    maximum: 120,
    scenario: 'success',
  });
  assert.throws(() => transition(s, { type: 'APPROVE_RUN', id: 'a' }));
});
test('insufficient balance and payment cap cannot pass checkout', () => {
  let s = initialState();
  s = transition(s, { type: 'CREATE_RUN', id: 'a', methodId: 'portfolio', name: 'A' });
  s = transition(s, {
    type: 'CONFIGURE_RUN',
    id: 'a',
    input: 'X',
    files: [],
    model: 'none',
    consent: false,
    redaction: '',
    permissions: true,
    maximum: 1,
    scenario: 'success',
  });
  assert.throws(() => transition(s, { type: 'APPROVE_RUN', id: 'a' }));
  s = transition(s, {
    type: 'CONFIGURE_RUN',
    id: 'a',
    input: 'X',
    files: [],
    model: 'none',
    consent: false,
    redaction: '',
    permissions: true,
    maximum: 120,
    scenario: 'success',
  });
  s = transition(s, { type: 'APPROVE_RUN', id: 'a' });
  assert.throws(() => transition(s, { type: 'FUND_RUN', id: 'a' }));
});
test('contribution runs from issue to funded proposal to paid version exactly once', () => {
  const c = contribution();
  assert.equal(c.state.fund, 4500);
  c.send({ type: 'TEST', id: 'bounty', pass: true });
  c.send({ type: 'REVIEW', id: 'bounty', decision: 'accept', reason: 'All criteria passed in fixture' });
  c.send({ type: 'PAYOUT', id: 'bounty' });
  assert.equal(c.state.balance, 500);
  assert.equal(c.state.bounties[0].state, 'paid');
  assert.equal(c.state.methods[0].versions[1].parent, 'v1');
  assert.equal(c.state.methods[0].versions[1].contributor, 'Dien');
  assert.equal(c.state.bounties[0].newVersion, 'v2');
  assert.throws(() => c.send({ type: 'PAYOUT', id: 'bounty' }));
  assert.throws(() => c.send({ type: 'VOTE', id: 'proposal', approve: true }));
  assert.throws(() => c.send({ type: 'OPEN_BOUNTY', id: 'duplicate', proposalId: 'proposal' }));
});
test('failed candidate cannot be accepted, changes require a fresh test', () => {
  const c = contribution();
  c.send({ type: 'TEST', id: 'bounty', pass: false });
  assert.throws(() => c.send({ type: 'REVIEW', id: 'bounty', decision: 'accept', reason: 'Ignore test' }));
  c.send({ type: 'REVIEW', id: 'bounty', decision: 'changes', reason: 'Fix the failed case' });
  c.send({ type: 'SUBMIT', id: 'bounty', patch: 'patch2', notes: 'Corrected', tests: 'New regression' });
  assert.equal(c.state.bounties[0].test, undefined);
  assert.throws(() => c.send({ type: 'PAYOUT', id: 'bounty' }));
});
test('private test grant is candidate-bound, limited, and revocable', () => {
  const b = buyer();
  const c = contribution(b.state);
  c.send({
    type: 'GRANT',
    id: 'grant',
    runId: 'run',
    candidate: 'bounty',
    output: 'Pass/fail only',
    attempts: 1,
    expires: '2099-11-14',
  });
  c.send({ type: 'REVOKE', id: 'grant' });
  assert.throws(() => c.send({ type: 'TEST', id: 'bounty', pass: true, grantId: 'grant' }));
  c.send({
    type: 'GRANT',
    id: 'grant2',
    runId: 'run',
    candidate: 'bounty',
    output: 'Pass/fail only',
    attempts: 1,
    expires: '2099-11-14',
  });
  c.send({ type: 'TEST', id: 'bounty', pass: true, grantId: 'grant2' });
  assert.equal(c.state.grants[1].used, 1);
});
test('new method version cannot change an existing run snapshot', () => {
  const b = buyer();
  const c = contribution(b.state);
  c.send({ type: 'TEST', id: 'bounty', pass: true });
  c.send({ type: 'REVIEW', id: 'bounty', decision: 'accept', reason: 'Passed' });
  c.send({ type: 'PAYOUT', id: 'bounty' });
  assert.equal(c.state.methods[0].versions.at(-1)!.id, 'v2');
  assert.equal(c.state.runs[0].version.id, 'v1');
});
test('new listing retains policy through publication and work creation', () => {
  let s = initialState();
  s = transition(s, {
    type: 'SAVE_METHOD',
    category: 'Finance',
    id: 'new',
    name: 'New expertise',
    description: 'A specific result',
    input: 'Input',
    output: 'Output',
    limits: 'Limits',
    cover: 'tender',
    price: 200,
    share: 20,
    models: ['private'],
    module: 'cost',
    steps: ['Validate', 'Return'],
    checks: ['Margin'],
  });
  assert.throws(() => transition(s, { type: 'CREATE_RUN', id: 'a', methodId: 'new', name: 'A' }));
  s = transition(s, { type: 'PUBLISH_METHOD', id: 'new' });
  s = transition(s, { type: 'CREATE_RUN', id: 'a', methodId: 'new', name: 'A' });
  assert.equal(s.runs[0].version.price, 200);
  assert.equal(s.runs[0].version.share, 20);
  assert.deepEqual(s.runs[0].version.models, ['private']);
});
test('mock transactions reject nonfinite amounts and repeat top-up identity', () => {
  const s = initialState();
  assert.throws(() => transition(s, { type: 'TOP_UP', id: 't', amount: NaN }));
  const next = transition(s, { type: 'TOP_UP', id: 't', amount: 100 });
  assert.throws(() => transition(next, { type: 'TOP_UP', id: 't', amount: 100 }));
  assert.equal(s.balance, 0);
});

test('outbound review records exact revision and rejects non-https destinations', () => {
  let s = initialState();
  s = transition(s, { type: 'CREATE_RUN', id: 'r1', methodId: 'tender', name: 'Bid' });
  assert.throws(() =>
    transition(s, {
      type: 'OUTBOUND',
      id: 'o1',
      runId: 'r1',
      destination: 'http://x',
      content: 'a',
      decision: 'approved',
    }),
  );
  s = transition(s, {
    type: 'OUTBOUND',
    id: 'o1',
    runId: 'r1',
    destination: 'https://portal.example.invalid/submit',
    content: 'a',
    decision: 'approved',
  });
  assert.equal(s.outbound[0].decision, 'approved');
  assert.throws(() =>
    transition(s, {
      type: 'OUTBOUND',
      id: 'o1',
      runId: 'r1',
      destination: 'https://x.invalid',
      content: 'b',
      decision: 'declined',
    }),
  );
});

test('connection needs scope and future expiry, revoke keeps scope record', () => {
  let s = initialState();
  assert.throws(() =>
    transition(s, {
      type: 'CONNECT',
      service: 'broker',
      connected: true,
      scope: 'Read',
      expires: '2000-01-01',
    }),
  );
  s = transition(s, {
    type: 'CONNECT',
    service: 'broker',
    connected: true,
    scope: 'Read holdings',
    expires: '2999-01-01',
  });
  assert.equal(s.connections.broker, true);
  s = transition(s, { type: 'CONNECT', service: 'broker', connected: false });
  assert.equal(s.connections.broker, false);
  assert.equal(s.connectionScopes.broker.scope, 'Read holdings');
});

test('new listing keeps chosen category and ownership; unknown category rejected', () => {
  const base = {
    type: 'SAVE_METHOD' as const,
    name: 'M',
    description: 'd',
    input: 'i',
    output: 'o',
    limits: 'l',
    cover: 'tender',
    price: 100,
    share: 10,
    models: ['private' as const],
    module: 'm',
    steps: ['a'],
    checks: [],
  };
  const s = transition(initialState(), { ...base, id: 'm1', category: 'Career' });
  const m = s.methods.find((x) => x.id === 'm1')!;
  assert.equal(m.category, 'Career');
  assert.equal(m.owned, true);
  assert.throws(() => transition(initialState(), { ...base, id: 'm2', category: 'Gambling' }));
});

test('outbound approval is held for private values and undeclared destinations', () => {
  let s = initialState();
  s = transition(s, { type: 'CREATE_RUN', id: 'r', methodId: 'tender', name: 'Bid' });
  s = transition(s, { type: 'PRIVATE_VALUES', id: 'r', values: ['812,000,000'] });
  const send = (id: string, destination: string, content: string) =>
    (s = transition(s, { type: 'OUTBOUND', id, runId: 'r', destination, content, decision: 'approved' }));
  send('a', 'https://portal.example.invalid/submit', 'Our cost is 812.000.000');
  assert.equal(s.outbound[0].decision, 'blocked');
  send('b', 'https://elsewhere.example.invalid', 'Bid summary');
  assert.equal(s.outbound[0].decision, 'blocked');
  send('c', 'https://portal.example.invalid/submit', 'Bid summary');
  assert.equal(s.outbound[0].decision, 'approved');
});

test('tender run shows agent log, document check, held outbound and pending memory', () => {
  let s = initialState();
  const send = (c: Command) => (s = transition(s, c));
  send({ type: 'TOP_UP', id: 't', amount: 1000 });
  send({ type: 'CREATE_RUN', id: 'r', methodId: 'tender', name: 'Bid' });
  send({
    type: 'CONFIGURE_RUN',
    id: 'r',
    input: 'Fictional costs',
    files: [],
    model: 'private',
    consent: false,
    redaction: '',
    permissions: true,
    maximum: 120,
    scenario: 'success',
  });
  send({ type: 'APPROVE_RUN', id: 'r' });
  send({ type: 'FUND_RUN', id: 'r' });
  send({ type: 'START_RUN', id: 'r' });
  send({ type: 'FINISH_RUN', id: 'r' });
  const r = s.runs[0];
  assert.equal(r.report!.verdict, 'attention');
  assert.ok(r.agentLog!.some((a) => a.action === 'login' && a.result.startsWith('Refused')));
  assert.equal(s.outbound[0].decision, 'blocked');
  assert.equal(s.memoryProposals.length, 2);
  const injected = s.memoryProposals.find((m) => m.instructionLike)!;
  assert.throws(() => send({ type: 'MEMORY_DECIDE', id: injected.id, approve: true }));
  send({ type: 'MEMORY_DECIDE', id: injected.id, approve: false });
  const fact = s.memoryProposals[0];
  send({ type: 'MEMORY_DECIDE', id: fact.id, approve: true });
  assert.equal(s.memory.length, 1);
  assert.equal(s.memoryProposals.length, 0);
});

test('report verdict follows stages, attestation and buyer checks', () => {
  const verdict = (scenario: Scenario) => {
    const b = buyer(scenario);
    b.send({ type: 'START_RUN', id: 'run' });
    b.send({ type: 'FINISH_RUN', id: 'run' });
    return b.state.runs[0].report!;
  };
  assert.equal(verdict('success').verdict, 'safe');
  assert.equal(verdict('success').runner.length, 7);
  assert.equal(verdict('stage-failure').verdict, 'do-not-use');
  assert.equal(verdict('hash-mismatch').verdict, 'do-not-use');
  assert.equal(verdict('local-failure').verdict, 'do-not-use');
  assert.equal(verdict('no-solution').verdict, 'attention');
});

test('broker import needs a declared connector and an active connection', () => {
  let s = initialState();
  s = transition(s, { type: 'CREATE_RUN', id: 'p', methodId: 'portfolio', name: 'P' });
  assert.throws(() => transition(s, { type: 'IMPORT_HOLDINGS', id: 'p' }));
  s = transition(s, { type: 'CONNECT', service: 'broker', connected: true, expires: '2999-01-01' });
  s = transition(s, { type: 'IMPORT_HOLDINGS', id: 'p' });
  assert.match(s.runs[0].input, /mock broker/);
  s = transition(s, { type: 'CREATE_RUN', id: 't', methodId: 'tender', name: 'T' });
  assert.throws(() => transition(s, { type: 'IMPORT_HOLDINGS', id: 't' }));
});
