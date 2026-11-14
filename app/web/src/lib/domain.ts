import { buildReport, tenderArtifacts } from './fixtures';
export type MethodId = string;
export type Service = 'broker' | 'portal';
export const CATEGORIES = ['Finance', 'Business', 'Career'];
export type Outbound = {
  id: string;
  runId: string;
  destination: string;
  content: string;
  decision: 'approved' | 'declined' | 'blocked';
  /** Why Kalis held the action. Present for blocked items. */
  reason?: string;
};
/** none = deterministic code with no AI model. */
export type RouteModel = 'none' | 'private' | 'proprietary';
export type Verdict = 'safe' | 'attention' | 'do-not-use';
/** What a method version may touch. Mirrors app/methods/<id>/manifest.json. */
export type Manifest = {
  connectors: { id: Service; operations: string[]; what: string }[];
  documents: string[];
  outbound: { destination: string; what: string }[];
  memory: { read: boolean; write: 'none' | 'proposals' };
  browser: { domains: string[]; actions: string[] };
  secrets: string[];
};
export const EMPTY_MANIFEST: Manifest = {
  connectors: [],
  documents: [],
  outbound: [],
  memory: { read: false, write: 'none' },
  browser: { domains: [], actions: [] },
  secrets: [],
};
export type RunReport = {
  runner: { name: string; ok: boolean; detail: string }[];
  steps: { name: string; state: 'passed' | 'failed' | 'missing' | 'undeclared' | 'out-of-order' }[];
  checkList: { name: string; ok: boolean; message: string }[];
  checks: 'passed' | 'failed' | 'unavailable';
  attestation: { wasm: boolean; input: boolean; output: boolean };
  hashes: boolean;
  verdict: Verdict;
  reasons: string[];
  answer: string;
};
export type Scenario =
  | 'success'
  | 'stage-failure'
  | 'hash-mismatch'
  | 'no-solution'
  | 'local-failure'
  | 'timeout';
export type Version = {
  id: string;
  parent?: string;
  contributor?: string;
  price: number;
  infra: number;
  share: number;
  models: RouteModel[];
  modules: string[];
  steps: string[];
  checks: string[];
  hash: string;
  manifest: Manifest;
  /** Published test results bound to this version. Separate from user ratings. */
  evidence: string[];
};
export type Method = {
  id: MethodId;
  name: string;
  category: string;
  description: string;
  input: string;
  output: string;
  limits: string;
  cover: string;
  creator: string;
  status: 'published' | 'draft' | 'concept';
  /** True for listings created by the current mock account. */
  owned?: boolean;
  versions: Version[];
  reviews: { runId: string; version: string; rating: number; comment: string }[];
};
export type Run = {
  id: string;
  methodId: string;
  version: Version;
  name: string;
  input: string;
  files: string[];
  model: RouteModel;
  consent: boolean;
  redaction: string;
  permissions: boolean;
  maximum: number;
  status: 'draft' | 'approved' | 'funded' | 'running' | 'completed' | 'failed' | 'timed-out';
  escrow: 'none' | 'held' | 'released' | 'returned';
  scenario: Scenario;
  /** Values the buyer marked private. Outbound content containing them is held. */
  privateValues: string[];
  report?: RunReport;
  agentLog?: { action: string; url: string; result: string }[];
  documents?: { file: string; processedBy: string; pii: string; instructionLike: boolean; note: string }[];
  receipt?: string;
  split?: { seller: number; dao: number; platform: number };
  deadline: number;
};
export type Issue = { id: string; methodId: string; version: string; title: string; reproduction: string };
export type Proposal = {
  id: string;
  issueId: string;
  amount: number;
  criteria: string;
  module: string;
  deadline: string;
  state: 'proposed' | 'approved' | 'rejected';
  vote?: string;
};
export type Bounty = {
  id: string;
  proposalId: string;
  methodId: string;
  base: string;
  amount: number;
  criteria: string;
  module: string;
  state: 'open' | 'submitted' | 'tested' | 'changes-requested' | 'rejected' | 'accepted' | 'paid';
  candidate?: { patch: string; notes: string; tests: string; author: string };
  test?: { passed: boolean; baseline: string; candidate: string; privateGrant?: string };
  review?: { decision: string; reason: string; reviewer: string };
  payment?: string;
  newVersion?: string;
};
export type Grant = {
  id: string;
  runId: string;
  candidate: string;
  output: string;
  attempts: number;
  used: number;
  expires: string;
  revoked: boolean;
};
export type State = {
  schema: 3;
  onboarded: boolean;
  name: string;
  balance: number;
  fund: number;
  earnings: number;
  clock: number;
  methods: Method[];
  runs: Run[];
  issues: Issue[];
  proposals: Proposal[];
  bounties: Bounty[];
  grants: Grant[];
  memory: { id: string; text: string; source: string }[];
  /** Memory changes proposed from outside content. They wait for the user. */
  memoryProposals: { id: string; runId?: string; text: string; source: string; instructionLike: boolean }[];
  connections: { broker: boolean; portal: boolean };
  /** Read-only scope and expiry the user approved per mock connection. */
  connectionScopes: Record<Service, { scope: string; expires: string }>;
  /** Outbound actions reviewed by the user. Approval binds the exact destination and content. */
  outbound: Outbound[];
  activities: { id: string; text: string; href: string }[];
  transactions: { id: string; kind: string; amount: number; runId?: string }[];
};
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function initialState(): State {
  // Manifests follow app/methods/portfolio-rebalance/manifest-v3.json and app/methods/tender-bid/manifest.json.
  const portfolio: Partial<Version> = {
    models: ['none'],
    modules: ['allocation'],
    steps: [
      'Read the portfolio and the limits',
      'Check that the inputs are consistent',
      'Try every allowed trade combination',
      'Keep the cheapest combination that meets every limit',
      'Re-check the chosen trades against every limit',
    ],
    checks: ['Cash reserve', 'Asset allocation', 'Sector limit', 'Buy/sell restrictions', 'Transaction cost'],
    manifest: {
      ...EMPTY_MANIFEST,
      connectors: [
        {
          id: 'broker',
          operations: ['Read positions'],
          what: 'Read your positions from a broker you connect. Labelled mock.',
        },
      ],
      documents: ['JSON'],
    },
    evidence: ['12 of 12 synthetic cases match an exhaustive search (validation/portfolio-method-02).'],
  };
  const tender: Partial<Version> = {
    models: ['private'],
    modules: ['bid-calculation'],
    steps: [],
    checks: ['Minimum margin'],
    manifest: {
      connectors: [],
      documents: ['JSON', 'PDF', 'Image or scan'],
      outbound: [
        {
          destination: 'https://portal.example.invalid/submit',
          what: 'Submit the bid summary to the mock procurement portal',
        },
      ],
      memory: { read: true, write: 'proposals' },
      browser: { domains: ['portal.example.invalid'], actions: ['open', 'download'] },
      secrets: ['Pricing rules'],
    },
    evidence: [],
  };
  const version = (id: string): Version => ({
    id: 'v1',
    price: 100,
    infra: 20,
    share: 10,
    models: ['private'],
    modules: [],
    steps: [],
    checks: [],
    manifest: EMPTY_MANIFEST,
    evidence: [],
    hash: 'mock-' + id + '-v1',
    ...(id === 'portfolio' ? portfolio : id === 'tender' ? tender : {}),
  });
  return {
    schema: 3,
    onboarded: false,
    name: 'Dien',
    balance: 0,
    fund: 5000,
    earnings: 0,
    clock: 0,
    methods: [
      {
        id: 'portfolio',
        name: 'Rebalance a portfolio at the lowest cost',
        category: 'Finance',
        description: 'Build a trade plan within your allocation and cash limits.',
        input: 'Holdings, allocation, sector and cash limits',
        output: 'Trade plan and transaction cost',
        limits: 'Synthetic data only. No trades or investment returns are promised.',
        cover: 'portfolio',
        creator: 'Kalis demo creator',
        status: 'published',
        versions: [version('portfolio')],
        reviews: [],
      },
      {
        id: 'tender',
        name: 'Price a tender bid above your minimum margin',
        category: 'Business',
        description: 'Prepare a bid around your costs, minimum margin and requirements.',
        input: 'Costs, minimum margin and tender documents',
        output: 'Proposed price, reasoning and required terms',
        limits: 'Mock documents and portal. No bid is sent.',
        cover: 'tender',
        creator: 'Kalis demo creator',
        status: 'published',
        versions: [version('tender')],
        reviews: [],
      },
      {
        id: 'salary',
        name: 'Plan a salary negotiation',
        category: 'Career',
        description: 'Prepare a negotiation with your offers and minimum terms kept private.',
        input: 'Offers, salary and minimum terms',
        output: 'Negotiation plan',
        limits: 'Concept listing. No executable method.',
        cover: 'salary',
        creator: 'Not assigned',
        status: 'concept',
        versions: [version('salary')],
        reviews: [],
      },
    ],
    runs: [],
    issues: [],
    proposals: [],
    bounties: [],
    grants: [],
    memory: [],
    memoryProposals: [],
    connections: { broker: false, portal: false },
    connectionScopes: {
      broker: { scope: 'Read holdings only. No trading or withdrawals.', expires: '' },
      portal: { scope: 'Read tender documents only. No submission.', expires: '' },
    },
    outbound: [],
    activities: [],
    transactions: [],
  };
}
export type Command =
  | { type: 'TOP_UP'; amount: number; id: string }
  | { type: 'CREATE_RUN'; id: string; methodId: string; name: string }
  | {
      type: 'CONFIGURE_RUN';
      id: string;
      input: string;
      files: string[];
      model: RouteModel;
      consent: boolean;
      redaction: string;
      permissions: boolean;
      maximum: number;
      scenario: Scenario;
    }
  | { type: 'APPROVE_RUN' | 'FUND_RUN' | 'START_RUN' | 'FINISH_RUN' | 'RECLAIM_RUN'; id: string }
  | { type: 'REVIEW_METHOD'; id: string; rating: number; comment: string }
  | {
      type: 'SAVE_METHOD';
      id: string;
      name: string;
      description: string;
      input: string;
      output: string;
      limits: string;
      cover: string;
      category: string;
      price: number;
      share: number;
      models: RouteModel[];
      module: string;
      steps: string[];
      checks: string[];
      manifest?: Manifest;
    }
  | { type: 'PUBLISH_METHOD'; id: string }
  | { type: 'ISSUE'; id: string; methodId: string; title: string; reproduction: string }
  | {
      type: 'PROPOSE';
      id: string;
      issueId: string;
      amount: number;
      criteria: string;
      module: string;
      deadline: string;
    }
  | { type: 'VOTE'; id: string; approve: boolean }
  | { type: 'OPEN_BOUNTY'; id: string; proposalId: string }
  | { type: 'SUBMIT'; id: string; patch: string; notes: string; tests: string }
  | { type: 'TEST'; id: string; pass: boolean; grantId?: string }
  | { type: 'REVIEW'; id: string; decision: 'accept' | 'changes' | 'reject'; reason: string }
  | { type: 'PAYOUT'; id: string }
  | {
      type: 'GRANT';
      id: string;
      runId: string;
      candidate: string;
      output: string;
      attempts: number;
      expires: string;
    }
  | { type: 'REVOKE'; id: string }
  | { type: 'MEMORY'; id: string; text: string; source: string }
  | { type: 'DELETE_MEMORY'; id: string }
  | { type: 'CONNECT'; service: Service; connected: boolean; scope?: string; expires?: string }
  | {
      type: 'OUTBOUND';
      id: string;
      runId: string;
      destination: string;
      content: string;
      decision: 'approved' | 'declined';
    }
  | { type: 'PROFILE'; name: string }
  | { type: 'ONBOARD'; name: string }
  | { type: 'PRIVATE_VALUES'; id: string; values: string[] }
  | { type: 'IMPORT_HOLDINGS'; id: string }
  | { type: 'MEMORY_DECIDE'; id: string; approve: boolean };
function requireThat(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const amount = (value: number) => Number.isSafeInteger(value) && value >= 0;
const text = (s: string) => s.trim().length > 0;
const normalize = (v: string) => v.toLowerCase().replace(/[\s.,_-]/g, '');
export function transition(current: State, c: Command): State {
  const s = structuredClone(current);
  const getRun = (id: string) => {
    const r = s.runs.find((r) => r.id === id);
    requireThat(r, 'Run not found.');
    return r;
  };
  const getMethod = (id: string) => {
    const m = s.methods.find((m) => m.id === id);
    requireThat(m, 'Method not found.');
    return m;
  };
  const getBounty = (id: string) => {
    const b = s.bounties.find((b) => b.id === id);
    requireThat(b, 'Bounty not found.');
    return b;
  };
  const event = (message: string, href: string) =>
    s.activities.unshift({ id: 'event-' + s.activities.length, text: message, href });
  const tx = (id: string, kind: string, value: number, runId?: string) =>
    s.transactions.unshift({ id, kind, amount: value, runId });
  if (c.type === 'TOP_UP') {
    requireThat(amount(c.amount) && c.amount > 0, 'Enter a positive mock amount.');
    requireThat(!s.transactions.some((t) => t.id === c.id), 'Top-up already recorded.');
    s.balance += c.amount;
    tx(c.id, 'Mock top-up', c.amount);
  }
  if (c.type === 'CREATE_RUN') {
    requireThat(!s.runs.some((r) => r.id === c.id), 'Run already exists.');
    const m = getMethod(c.methodId);
    requireThat(m.status === 'published', 'This method is not published.');
    requireThat(text(c.name), 'Name your work.');
    const v = structuredClone(m.versions.at(-1)!);
    s.runs.unshift({
      id: c.id,
      methodId: m.id,
      version: v,
      name: c.name,
      input: '',
      files: [],
      model: v.models[0],
      consent: false,
      redaction: '',
      permissions: false,
      maximum: v.price + v.infra,
      status: 'draft',
      escrow: 'none',
      scenario: 'success',
      deadline: 0,
      privateValues: [],
    });
    event('Work created', '/workspace/run/' + c.id);
  }
  if (c.type === 'CONFIGURE_RUN') {
    const r = getRun(c.id);
    requireThat(['draft', 'approved'].includes(r.status), 'Funded work cannot change its approved terms.');
    requireThat(r.version.models.includes(c.model), 'The seller does not allow this model route.');
    requireThat(amount(c.maximum), 'Payment limit is invalid.');
    Object.assign(r, {
      input: c.input,
      files: c.files,
      model: c.model,
      consent: c.consent,
      redaction: c.redaction,
      permissions: c.permissions,
      maximum: c.maximum,
      scenario: c.scenario,
      status: 'draft',
    });
  }
  if (c.type === 'APPROVE_RUN') {
    const r = getRun(c.id);
    requireThat(r.status === 'draft', 'This work is not a draft.');
    requireThat(text(r.input) || r.files.length, 'Add synthetic input or a sample document.');
    requireThat(r.permissions, 'Confirm the required permissions.');
    requireThat(r.maximum >= r.version.price + r.version.infra, 'Maximum payment is below the total.');
    requireThat(r.version.models.includes(r.model), 'Model is outside the seller policy.');
    if (r.model === 'proprietary')
      requireThat(
        r.consent && text(r.redaction),
        'Proprietary use needs a redaction plan and explicit consent.',
      );
    r.status = 'approved';
    event('Input, model and cost approved', '/workspace/run/' + r.id);
  }
  if (c.type === 'FUND_RUN') {
    const r = getRun(c.id);
    requireThat(r.status === 'approved', 'Approve the exact run terms first.');
    const total = r.version.price + r.version.infra;
    requireThat(s.balance >= total, 'Add mock funds to cover this run.');
    s.balance -= total;
    r.status = 'funded';
    r.escrow = 'held';
    r.deadline = s.clock + 60;
    tx('fund-' + r.id, 'Mock escrow deposit', -total, r.id);
    event('Mock funds held in escrow', '/balance/escrow/' + r.id);
  }
  if (c.type === 'START_RUN') {
    const r = getRun(c.id);
    requireThat(r.status === 'funded', 'Fund this approved run first.');
    r.status = 'running';
    event('Mock execution started', '/workspace/run/' + r.id);
  }
  if (c.type === 'FINISH_RUN') {
    const r = getRun(c.id);
    requireThat(r.status === 'running', 'Run must be running.');
    requireThat(
      r.scenario !== 'timeout',
      'No completion in the timeout fixture. Advance the mock deadline and reclaim.',
    );
    const failed = r.scenario === 'stage-failure';
    r.report = buildReport(r);
    if (!failed && r.version.manifest.browser.domains.length) {
      const t = tenderArtifacts(r, r.version.manifest);
      r.agentLog = t.agentLog;
      r.documents = t.documents;
      t.memory.forEach((m, i) =>
        s.memoryProposals.unshift({ id: 'proposal-' + r.id + '-' + i, runId: r.id, ...m }),
      );
      s.outbound.unshift({ id: 'blocked-' + r.id, runId: r.id, ...t.blocked, decision: 'blocked' });
      event('Held an outbound attempt from a tender document. Nothing was sent.', '/workspace/run/' + r.id);
      event('2 memory changes from a document wait for your review', '/workspace/memory');
    }
    // Completion failure controls escrow. Hash/local-check warnings do not forge a failed signed completion.
    r.status = failed ? 'failed' : 'completed';
    r.receipt = 'mock-completion-' + r.id;
    if (failed) {
      r.escrow = 'returned';
      s.balance += r.version.price + r.version.infra;
      tx('refund-' + r.id, 'Mock stage-failure return', r.version.price + r.version.infra, r.id);
    } else {
      r.escrow = 'released';
      const dao = Math.round((r.version.price * r.version.share) / 100),
        platform = Math.round(r.version.price * 0.1),
        seller = r.version.price - dao - platform;
      r.split = { seller, dao, platform };
      s.fund += dao;
      s.earnings += seller;
      tx('release-' + r.id, 'Mock release', r.version.price + r.version.infra, r.id);
    }
    event(
      failed ? 'Mock run failed. Funds returned.' : 'Mock run completed. Inspect report and checks.',
      '/workspace/run/' + r.id,
    );
  }
  if (c.type === 'RECLAIM_RUN') {
    const r = getRun(c.id);
    requireThat(
      ['funded', 'running'].includes(r.status) && r.escrow === 'held',
      'No held escrow to reclaim.',
    );
    requireThat(r.scenario === 'timeout', 'Use the timeout fixture to advance the demo clock.');
    s.clock = Math.max(s.clock, r.deadline + 1);
    r.status = 'timed-out';
    r.escrow = 'returned';
    s.balance += r.version.price + r.version.infra;
    tx('timeout-' + r.id, 'Mock timeout reclaim', r.version.price + r.version.infra, r.id);
    event('Mock timeout reclaimed', '/balance/escrow/' + r.id);
  }
  if (c.type === 'REVIEW_METHOD') {
    const r = getRun(c.id),
      m = getMethod(r.methodId);
    requireThat(
      r.status === 'completed' && r.report?.hashes,
      'Review requires a completed mock run with matching hashes.',
    );
    requireThat(Number.isInteger(c.rating) && c.rating >= 1 && c.rating <= 5, 'Choose 1–5 stars.');
    requireThat(text(c.comment), 'Describe your experience without private data.');
    requireThat(!m.reviews.some((v) => v.runId === r.id), 'This run already has a review.');
    m.reviews.push({ runId: r.id, version: r.version.id, rating: c.rating, comment: c.comment });
    event('Mock review added', '/marketplace/' + m.id + '/reviews');
  }
  if (c.type === 'SAVE_METHOD') {
    requireThat(!s.methods.some((m) => m.id === c.id), 'Method already exists.');
    requireThat(
      text(c.name) &&
        text(c.description) &&
        text(c.input) &&
        text(c.output) &&
        text(c.module) &&
        c.steps.length,
      'Complete the listing and manifest.',
    );
    requireThat(
      amount(c.price) && c.share >= 10 && c.share <= 90 && c.models.length && CATEGORIES.includes(c.category),
      'Invalid price, allocation or model policy.',
    );
    s.methods.push({
      id: c.id,
      name: c.name,
      description: c.description,
      input: c.input,
      output: c.output,
      limits: c.limits,
      cover: c.cover,
      category: c.category,
      owned: true,
      creator: s.name + ' (mock seller)',
      status: 'draft',
      reviews: [],
      versions: [
        {
          id: 'v1',
          price: c.price,
          infra: 20,
          share: c.share,
          models: c.models,
          modules: [c.module],
          steps: c.steps,
          checks: c.checks,
          manifest: c.manifest ?? EMPTY_MANIFEST,
          evidence: [],
          hash: 'mock-' + c.id + '-v1',
        },
      ],
    });
  }
  if (c.type === 'PUBLISH_METHOD') {
    const m = getMethod(c.id);
    requireThat(m.status === 'draft', 'Only a draft can be published.');
    m.status = 'published';
    event('Method published in mock catalog', '/marketplace/' + m.id);
  }
  if (c.type === 'ISSUE') {
    const m = getMethod(c.methodId);
    requireThat(text(c.title) && text(c.reproduction), 'Add a problem and synthetic reproduction.');
    s.issues.push({
      id: c.id,
      methodId: m.id,
      version: m.versions.at(-1)!.id,
      title: c.title,
      reproduction: c.reproduction,
    });
    event('Method problem recorded', '/community/issues/' + c.id);
  }
  if (c.type === 'PROPOSE') {
    const issue = s.issues.find((i) => i.id === c.issueId);
    requireThat(issue, 'Issue not found.');
    const m = getMethod(issue.methodId);
    requireThat(
      m.versions.find((v) => v.id === issue.version)?.modules.includes(c.module),
      'Module is not open for contribution.',
    );
    requireThat(
      amount(c.amount) && c.amount > 0 && text(c.criteria) && text(c.deadline),
      'Complete the funded scope and acceptance criteria.',
    );
    s.proposals.push({
      id: c.id,
      issueId: issue.id,
      amount: c.amount,
      criteria: c.criteria,
      module: c.module,
      deadline: c.deadline,
      state: 'proposed',
    });
    event('Mock budget proposed', '/community/proposals/' + c.id);
  }
  if (c.type === 'VOTE') {
    const p = s.proposals.find((p) => p.id === c.id);
    requireThat(p?.state === 'proposed', 'Proposal is not open.');
    if (c.approve) {
      requireThat(s.fund >= p.amount, 'Shared mock fund is too low.');
      s.fund -= p.amount;
    }
    p.state = c.approve ? 'approved' : 'rejected';
    p.vote = 'Mock authorized DAO member';
    event('Mock proposal ' + p.state, '/community/proposals/' + p.id);
  }
  if (c.type === 'OPEN_BOUNTY') {
    const p = s.proposals.find((p) => p.id === c.proposalId);
    requireThat(p?.state === 'approved', 'Approve a funded proposal first.');
    requireThat(!s.bounties.some((b) => b.proposalId === p.id), 'This proposal already has a bounty.');
    const issue = s.issues.find((i) => i.id === p.issueId)!;
    s.bounties.push({
      id: c.id,
      proposalId: p.id,
      methodId: issue.methodId,
      base: issue.version,
      amount: p.amount,
      criteria: p.criteria,
      module: p.module,
      state: 'open',
    });
    event('Bounty opened in mock fund', '/community/bounties/' + c.id);
  }
  if (c.type === 'SUBMIT') {
    const b = getBounty(c.id);
    requireThat(['open', 'changes-requested'].includes(b.state), 'Bounty is not accepting a candidate.');
    requireThat(
      text(c.patch) && text(c.notes) && text(c.tests),
      'Provide the patch, impact and regression cases.',
    );
    b.candidate = { patch: c.patch, notes: c.notes, tests: c.tests, author: s.name };
    b.state = 'submitted';
    delete b.test;
    delete b.review;
    event('Mock candidate submitted', '/community/bounties/' + b.id);
  }
  if (c.type === 'TEST') {
    const b = getBounty(c.id);
    requireThat(b.state === 'submitted' && b.candidate, 'Submit a candidate before testing.');
    let g: Grant | undefined;
    if (c.grantId) {
      g = s.grants.find((g) => g.id === c.grantId);
      requireThat(
        g && !g.revoked && g.used < g.attempts && g.expires >= new Date().toISOString().slice(0, 10),
        'Private test permission is missing, expired, revoked or exhausted.',
      );
      requireThat(g.candidate === b.id, 'Permission is not for this candidate.');
      const run = getRun(g.runId);
      requireThat(run.methodId === b.methodId, 'Private case belongs to another method.');
      g.used++;
    }
    b.test = { passed: c.pass, baseline: b.base, candidate: 'candidate-' + b.id, privateGrant: g?.id };
    b.state = 'tested';
    event('Independent mock test ' + (c.pass ? 'passed' : 'failed'), '/community/bounties/' + b.id);
  }
  if (c.type === 'REVIEW') {
    const b = getBounty(c.id);
    requireThat(b.state === 'tested' && b.test, 'Independent testing must finish first.');
    requireThat(text(c.reason), 'Give a reason for this review.');
    if (c.decision === 'accept') requireThat(b.test.passed, 'A failing candidate cannot be accepted.');
    b.review = { decision: c.decision, reason: c.reason, reviewer: 'Independent mock reviewer' };
    b.state =
      c.decision === 'accept' ? 'accepted' : c.decision === 'changes' ? 'changes-requested' : 'rejected';
    event('Mock review ' + b.state, '/community/bounties/' + b.id);
  }
  if (c.type === 'PAYOUT') {
    const b = getBounty(c.id);
    requireThat(
      b.state === 'accepted' && b.review?.decision === 'accept' && b.test?.passed && !b.payment,
      'Only an accepted unpaid candidate can be paid.',
    );
    const m = getMethod(b.methodId);
    const base = m.versions.find((v) => v.id === b.base)!;
    const id = 'v' + (m.versions.length + 1);
    m.versions.push({
      ...structuredClone(base),
      id,
      parent: b.base,
      contributor: b.candidate!.author,
      hash: 'mock-' + m.id + '-' + id,
    });
    b.newVersion = id;
    b.payment = 'mock-payout-' + b.id;
    b.state = 'paid';
    s.balance += b.amount;
    tx(b.payment, 'Mock bounty income', b.amount);
    event('Mock bounty paid and ' + id + ' published', '/marketplace/' + m.id + '/versions');
  }
  if (c.type === 'GRANT') {
    const r = getRun(c.runId);
    const b = getBounty(c.candidate);
    requireThat(r.methodId === b.methodId, 'Choose a case from the same method.');
    requireThat(
      c.expires >= new Date().toISOString().slice(0, 10) &&
        Number.isInteger(c.attempts) &&
        c.attempts > 0 &&
        text(c.output),
      'Set future expiry, attempt limit and allowed report fields.',
    );
    s.grants.push({
      id: c.id,
      runId: r.id,
      candidate: b.id,
      output: c.output,
      attempts: c.attempts,
      used: 0,
      expires: c.expires,
      revoked: false,
    });
  }
  if (c.type === 'REVOKE') {
    const g = s.grants.find((g) => g.id === c.id);
    requireThat(g, 'Permission not found.');
    g.revoked = true;
  }
  if (c.type === 'MEMORY') {
    requireThat(text(c.text) && text(c.source), 'Memory needs content and a source.');
    const item = s.memory.find((m) => m.id === c.id);
    if (item) Object.assign(item, { text: c.text, source: c.source });
    else s.memory.push({ id: c.id, text: c.text, source: c.source });
  }
  if (c.type === 'DELETE_MEMORY') s.memory = s.memory.filter((m) => m.id !== c.id);
  if (c.type === 'CONNECT') {
    if (c.connected) {
      const scope = c.scope ?? s.connectionScopes[c.service].scope;
      const expires = c.expires ?? s.connectionScopes[c.service].expires;
      requireThat(text(scope), 'Describe what this connector may read.');
      requireThat(
        expires >= new Date().toISOString().slice(0, 10),
        'Set an expiry date that is not in the past.',
      );
      s.connectionScopes[c.service] = { scope, expires };
    }
    s.connections[c.service] = c.connected;
    event(
      (c.connected ? 'Mock connector granted: ' : 'Mock connector revoked: ') + c.service,
      '/connectors',
    );
  }
  if (c.type === 'OUTBOUND') {
    const r = getRun(c.runId);
    requireThat(!s.outbound.some((o) => o.id === c.id), 'This revision is already recorded.');
    requireThat(text(c.content), 'Add the exact content to share.');
    requireThat(/^https:\/\/[^\s]+$/.test(c.destination), 'Destination must be an https address.');
    const found = r.privateValues.filter((v) => normalize(c.content).includes(normalize(v)));
    const declared = r.version.manifest.outbound.some((o) => o.destination === c.destination);
    const reason =
      c.decision !== 'approved'
        ? undefined
        : found.length
          ? 'The content includes a value you marked private (' + found.join(', ') + '). Remove it first.'
          : !declared
            ? 'This destination is not declared in the method manifest.'
            : undefined;
    s.outbound.unshift({
      id: c.id,
      runId: r.id,
      destination: c.destination,
      content: c.content,
      decision: reason ? 'blocked' : c.decision,
      reason,
    });
    event('Outbound action ' + (reason ? 'held' : c.decision) + ' in mock. Nothing was sent.', '/activity');
  }
  if (c.type === 'ONBOARD') {
    requireThat(text(c.name), 'Enter a display name.');
    s.name = c.name.trim();
    s.onboarded = true;
  }
  if (c.type === 'PRIVATE_VALUES') {
    const r = getRun(c.id);
    requireThat(['draft', 'approved'].includes(r.status), 'Private values are fixed once funds are held.');
    r.privateValues = c.values.map((v) => v.trim()).filter(Boolean);
  }
  if (c.type === 'IMPORT_HOLDINGS') {
    const r = getRun(c.id);
    requireThat(['draft', 'approved'].includes(r.status), 'Funded work cannot change its input.');
    requireThat(
      r.version.manifest.connectors.some((x) => x.id === 'broker'),
      'This method does not use a broker connector.',
    );
    requireThat(s.connections.broker, 'Connect the mock broker first.');
    r.input = 'Synthetic holdings from the mock broker: A 7, B 1, C 1. Cash 0. Limits as saved.';
    r.status = 'draft';
    event('Read positions from the mock broker. The token stayed in Kalis.', '/workspace/run/' + r.id);
  }
  if (c.type === 'MEMORY_DECIDE') {
    const p = s.memoryProposals.find((m) => m.id === c.id);
    requireThat(p, 'Memory proposal not found.');
    if (c.approve) {
      requireThat(
        !p.instructionLike,
        'This text reads like an instruction. Reject it or rewrite it as a plain fact.',
      );
      s.memory.push({ id: p.id, text: p.text, source: p.source });
    }
    s.memoryProposals = s.memoryProposals.filter((m) => m.id !== c.id);
    event('Memory proposal ' + (c.approve ? 'approved' : 'rejected'), '/workspace/memory');
  }
  if (c.type === 'PROFILE') {
    requireThat(text(c.name), 'Enter a display name.');
    s.name = c.name.trim();
  }
  return s;
}
