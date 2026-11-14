/* Fictional work records for interface review. No production data or API contract. */
window.KalisPreview = {
  methods: [
    { id: 'portfolio', name: 'Portfolio rebalance', short: 'Portfolio rebalance', category: 'Finance', icon: 'portfolio', version: 'v1', description: 'Find a rebalancing plan within your allocation and cash limits.', input: 'Holdings, allocation limits and cash needs', output: 'A trade plan with its transaction cost', status: 'Sample available', proof: 'Synthetic C03 result from the historical sealed-probe test.', access: 'Portfolio input. No external trading in this preview.' },
    { id: 'tender', name: 'Tender bid', short: 'Tender bid', category: 'Business', icon: 'tender', version: 'v1', description: 'Build a bid around your costs, minimum margin and tender requirements.', input: 'Cost structure, minimum margin and tender documents', output: 'A proposed price, reasoning and required terms', status: 'Planned method', proof: 'Proposed product flow. No live execution in this preview.', access: 'Documents and optional procurement portal, memory and external actions.' },
    { id: 'salary', name: 'Salary negotiation', short: 'Salary negotiation', category: 'Career', icon: 'salary', version: 'Concept', description: 'Prepare a negotiation with your offers and walk-away number kept private.', input: 'Current salary, competing offers and minimum acceptable terms', output: 'A negotiation plan for your position', status: 'Illustration only', proof: 'Concept only. This method has not been implemented.', access: 'Personal information supplied for the negotiation.' }
  ],
  work: [
    { id: 'november-portfolio', name: 'November portfolio review', method: 'portfolio', status: 'Ready to review', date: '13 Nov', note: 'Your sample rebalancing plan is ready.', kind: 'result' },
    { id: 'supplier-tender', name: 'Supplier tender', method: 'tender', status: 'Needs approval', date: '13 Nov', note: 'Review a proposed memory update before continuing.', kind: 'approval' },
    { id: 'portfolio-draft', name: 'Personal allocation', method: 'portfolio', status: 'Draft', date: '12 Nov', note: 'Add your constraints to prepare this work.', kind: 'draft' }
  ],
  files: [
    { name: 'Portfolio holdings.csv', type: 'CSV', source: 'November portfolio review', status: 'Synthetic sample' },
    { name: 'Tender requirements.pdf', type: 'PDF', source: 'Supplier tender', status: 'Fictional document' },
    { name: 'Cost structure.csv', type: 'CSV', source: 'Supplier tender', status: 'Synthetic sample' }
  ],
  approvals: [
    { id: 'memory', title: 'Review a memory update', description: 'Supplier tender proposes saving a lesson for future bids.', scope: 'Memory', detail: 'Proposed note: include delivery terms in the bid checklist. Source: the fictional tender requirements. This note is not saved until you approve it.', state: 'Pending' },
    { id: 'outbound', title: 'Review an external action', description: 'Inspect the destination and content before sharing a bid.', scope: 'External action', detail: 'Proposed destination: the mock procurement portal. Proposed content: the bid summary and required terms. Internal cost details are excluded from this sample. No real upload will occur.', state: 'Pending' }
  ],
  contributions: [],
  methodDrafts: [],
  preferences: { reducedMotion: false, privateModel: true },
  memory: []
};

window.KalisPreview.methods.forEach(m => { m.rating = null; m.reviewCount = 0; m.limitations = m.id === 'portfolio' ? 'A sample trade plan, not an investment recommendation or a guarantee of returns. No trades are placed.' : m.id === 'tender' ? 'The listing previews a workflow. Its output has not been generated here.' : 'Concept only. No executable method or evaluated result is available.'; });

window.KalisPreview.methods.forEach(m => { m.cover = m.id + '.jpg'; m.creator = null; });
