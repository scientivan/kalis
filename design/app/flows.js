/* Frontend workflow coverage. Session records only. Never sends data or signs. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const records = [];
  let serial = 0;
  let selectedMethod = 'Portfolio rebalance';
  let reportScenario = 'complete';
  let escrowScenario = 'held';
  const latest = (route, method=selectedMethod) => [...records].reverse().find(r=>r.route===route&&(!r.values.method||r.values.method===method));
  const sellerRoutes = () => latest('marketplace/configure')?.values.models === 'Private and proprietary' ? 'Private and proprietary' : 'Private only';
  const field = (name, label, type='text', options='', required=true) => ({name,label,type,options,required});
  const method = field('method','Method','select','Portfolio rebalance|Tender bid|Salary negotiation');
  const schemas = {
    'account/start': ['Access your account','Account access is a frontend preview. No authentication service is connected.', [field('identity','Email or NEAR account'),field('route','Sign-in method','select','Email|NEAR wallet')]],
    'marketplace/creator': ['Creator profile','Review the identity, expertise and published methods of a seller.',[field('creator','Creator display name'),field('bio','Expertise and background','textarea'),field('website','Public profile URL','url','',false)]],
    'marketplace/configure': ['Method configuration','Record the version, price, access and contribution boundaries before publication.',[method,field('version','Version'),field('price','Method price (USD)','number'),field('manifest','Manifest hash'),field('code','Method code hash'),field('artifact','WASM artifact metadata','file','',false),field('runner','Runner hash'),field('parent','Parent version','text','',false),field('contributors','Contributors and attribution','textarea','',false),field('models','Seller-allowed model routes','select','Private only|Private and proprietary'),field('inputs','Input formats and limits','textarea'),field('connectors','Connectors and permissions','textarea'),field('destinations','Allowed outbound destinations','textarea'),field('memory','Memory read/write policy','textarea'),field('browser','Browser domains and allowed actions','textarea'),field('modules','Open modules, interfaces and private core','textarea'),field('steps','Declared execution steps','textarea'),field('checks','Rules the buyer can check locally','textarea'),field('private','Private parameters (names only, no secret values)','textarea','',false)]],
    'marketplace/review': ['Write a review','Draft a user rating for the version used. This does not submit a public review.',[method,field('version','Version used'),field('rating','Rating','select','5|4|3|2|1'),field('experience','Your experience','textarea'),field('run','Run reference'),field('consent','I have removed private input and output from this review','checkbox')]],
    'workspace/input': ['Prepare input','Select local file metadata or describe synthetic input. File contents are not read or uploaded.',[method,field('attachment','Document, image, CSV or JSON','file','',false),field('input','Synthetic input or dataset reference','textarea'),field('formats','Document processing','select','Structured data|PDF text|Scanned document / OCR|Image or table|Non-English document'),field('source','Source and provenance'),field('limits','Allocation, cash, sector, buy/sell or margin limits','textarea')]],
    'workspace/model': ['Model and permissions','A buyer can narrow the seller’s allowed routes. A proprietary route sends filtered data outside the TEE.',[method,field('allowed','Seller-allowed routes','select','Private only|Private and proprietary'),field('model','Requested route','select','Private attested model|Proprietary model'),field('filter','Data to redact before a proprietary call','textarea','',false),field('consent','I explicitly allow the filtered data to reach a proprietary provider','checkbox','',false),field('permissions','Confirmed connectors, memory and browser access','textarea')]],
    'workspace/checkout': ['Review payment','Upfront payment goes into per-run escrow. No payment occurs in this preview.',[method,field('version','Method version'),field('run','Unique run reference'),field('price','Method price (USD)','number'),field('infra','Infrastructure estimate (USD)','number'),field('maximum','Maximum approved total (USD)','number'),field('payment','Payment route','select','Fiat-funded balance (mock)|Crypto on NEAR testnet (not connected)'),field('share','Shared fund allocation (%)','number'),field('basis','Allocation base','select','Unresolved — must be specified before live payment'),field('approval','I reviewed the total, version and required permissions','checkbox')]],
    'workspace/run': ['Run status and verification','Inspect the execution stages and buyer checks. No new run is started by this screen.',[]],
    'workspace/test-consent': ['Private test permission','Separate permission for testing a candidate. Ordinary use never grants training permission.',[method,field('case','Private case reference'),field('candidate','Candidate version or allowed scope'),field('criteria','Allowed checks and acceptance criteria','textarea'),field('output','Allowed report fields and output limits','textarea'),field('attempts','Maximum test attempts','number'),field('expiry','Permission expiry','date'),field('consent','I permit only the described private testing, not model training','checkbox')]],
    'workspace/memory-edit': ['Memory with sources','Prepare a correction with its provenance. Changes remain a session draft.',[field('note','Memory content','textarea'),field('source','Source document or run'),field('reason','Reason for correction','textarea')]],
    'workspace/action-review': ['Review an external action','Consent applies only to this destination, content and action revision. Changed parameters require a new review.',[field('run','Run reference'),field('revision','Action revision'),field('destination','Destination URL','url'),field('action','Requested operation'),field('content','Exact content to send','textarea'),field('excluded','Private fields excluded from the content','textarea'),field('decision','Decision','select','Decline|Approve this revision only')]],
    'connections/scope': ['Connection permissions','Configure a mock broker or browser session. Never enter credentials into this preview.',[field('service','Service','select','Mock portfolio broker|Mock procurement portal'),field('scope','Allowed operations','select','Read only|Read and prepare draft actions'),field('domains','Allowed domains','textarea'),field('actions','Allowed browser actions','textarea'),field('expiry','Access expiry','date')]],
    'community/issues': ['Report a method problem','Describe the problem using synthetic or approved information.',[method,field('version','Affected version'),field('problem','Problem and expected behavior','textarea'),field('example','Synthetic reproduction','textarea'),field('scope','Module affected'),field('consent','I have excluded private input and output','checkbox')]],
    'community/proposals': ['Propose a shared budget','Proposal and vote rules must come from the configured DAO. This creates a draft only.',[method,field('title','Proposal title'),field('problem','Problem to fund','textarea'),field('amount','Proposed testnet budget','number'),field('criteria','Acceptance criteria','textarea'),field('reviewer','Authorized reviewer'),field('deadline','Deadline','date')]],
    'community/bounty/new': ['Define a bounty','Funding and acceptance rules must be agreed before a bounty opens.',[method,field('title','Bounty title'),field('version','Base version'),field('module','Editable module and scope','textarea'),field('criteria','Independent acceptance criteria','textarea'),field('evaluator','Evaluator reference'),field('reviewer','Authorized reviewer'),field('deadline','Deadline','date'),field('amount','Bounty amount (testnet units)','number'),field('budget','Approved budget reference'),field('competition','Competing claims and one-payment rule','textarea')]],
    'community/submit': ['Submit a contribution','A candidate cannot replace the evaluator or change the private cases that determine payment.',[method,field('bounty','Bounty reference'),field('version','Base version'),field('patch','Patch or candidate artifact reference'),field('changes','Changes and impact','textarea'),field('tests','Synthetic regression cases','textarea'),field('attribution','Contributor attribution'),field('consent','The candidate preserves the independent evaluator','checkbox')]],
    'community/testing': ['Candidate test request','Request independent regression and permitted private-case testing. No evaluator runs in this preview.',[field('candidate','Candidate reference'),field('baseline','Baseline version'),field('evaluator','Independent evaluator reference'),field('consent','Private case permission reference'),field('limits','Report and attempt limits','textarea')]],
    'community/review': ['Contribution review','Record a draft reviewer decision with reasons. A real acceptance requires authorized review and valid evidence.',[field('candidate','Candidate reference'),field('tests','Independent test report reference'),field('regression','Before/after comparison and regression results','textarea'),field('decision','Proposed decision','select','Request changes|Reject|Accept pending authorization'),field('reason','Review reasons','textarea'),field('authority','Reviewer authority reference')]],
    'community/vote': ['Proposal decision','Preview a decision. No wallet signature, DAO vote or quorum calculation occurs.',[field('proposal','Proposal reference'),field('decision','Decision','select','Approve|Reject|Abstain'),field('reason','Reason','textarea'),field('authority','Membership / voting authority reference')]],
    'community/payout': ['Bounty payment','Payment requires accepted work, valid authority and an unpaid acceptance reference.',[field('acceptance','Acceptance reference'),field('recipient','Contributor testnet account'),field('amount','Amount (testnet units)','number'),field('proposal','Approved payment proposal reference')]],
    'balance/escrow': ['Escrow and settlement','Funds release on verified stage completion, not on the quality or profitability of an answer.',[]],
    'balance/crypto': ['Crypto payment','Prepare a testnet payment request. No wallet connects or signs here.',[field('account','Buyer testnet account'),field('run','Unique run reference'),field('amount','Amount (testnet units)','number'),field('asset','Asset / contract reference'),field('recipient','Escrow contract reference')]],
    'preferences/data': ['Data permissions','Review stored session grants. Production retention and deletion policy remain undecided.',[]]
  };
  const groups = {
    workspace:['workspace/input','workspace/model','workspace/checkout','workspace/run','workspace/test-consent','workspace/memory-edit','workspace/action-review'],
    marketplace:['marketplace/creator','marketplace/configure','marketplace/review'],
    community:['community/issues','community/proposals','community/vote','community/bounty/new','community/submit','community/testing','community/review','community/payout'],
    balance:['balance/crypto','balance/escrow'],account:['account/start'],connections:['connections/scope'],preferences:['preferences/data'],activity:[]
  };
  const link = route => `<a href="#${route}">${esc(schemas[route][0])}</a>`;
  const facts = rows => `<dl class="fact-list">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  function control(f) {
    const id='flow-'+f.name, required=f.required?' required':'';
    if(f.type==='checkbox')return `<label class="flow-check"><input id="${id}" name="${f.name}" type="checkbox"${required}> ${esc(f.label)}</label>`;
    const common=`id="${id}" name="${f.name}"${required}`;
    if(f.name==='allowed')return `<div class="form-field"><label for="${id}">${esc(f.label)}</label><input ${common} value="${sellerRoutes()}" readonly><small>Derived from the selected method’s session configuration. Defaults to private only.</small></div>`;
    const config=latest('marketplace/configure')?.values;
    if(config&&['version','price','manifest','code','runner'].includes(f.name))return `<div class="form-field"><label for="${id}">${esc(f.label)}</label><input ${common} value="${esc(config[f.name])}" ${f.type==='number'?'type="number" min="0" step="any"':''}><small>Prefilled from the selected session configuration.</small></div>`;
    const input=f.type==='textarea'?`<textarea ${common} maxlength="2500"></textarea>`:f.type==='select'?`<select ${common}>${f.options.split('|').map(v=>`<option ${f.name==='method'&&v===selectedMethod?'selected':''}>${esc(v)}</option>`).join('')}</select>`:`<input ${common} type="${f.type}" ${f.type==='number'?'min="0" step="any"':''} ${f.type==='file'?'accept=".pdf,.csv,.json,.txt,.png,.jpg,.jpeg"':''} ${f.type==='text'?'maxlength="200"':''}>`;
    return `<div class="form-field"><label for="${id}">${esc(f.label)}</label>${input}</div>`;
  }
  function navigation(path) {
    const base=path.split('/')[0];
    const routes=groups[base];
    if(!routes)return '';
    const history=records.filter(r=>r.route.split('/')[0]===base||base==='activity');
    return `<section class="flow-navigation"><h2>Related workflows</h2><nav aria-label="Related workflows">${routes.map(link).join('')}</nav><p>Workflow preview. Records stay in this session.</p>${history.length?`<h2>Session workflow drafts</h2>${history.map(r=>`<p><a href="#records/${r.id}">${esc(r.title)} ${r.id}</a> ${esc(r.state)}</p>`).join('')}`:''}</section>`;
  }
  function page(path) {
    if(path.startsWith('records/')) {
      const record=records.find(r=>String(r.id)===path.split('/')[1]);if(!record)return null;
      const next={'workspace/input':'workspace/model','workspace/model':'workspace/checkout','workspace/checkout':'workspace/run','community/issues':'community/proposals','community/proposals':'community/vote','community/vote':'community/bounty/new','community/bounty/new':'community/submit','community/submit':'community/testing','community/testing':'community/review','community/review':'community/payout','community/payout':'marketplace/configure','marketplace/configure':'marketplace'}[record.route];
      return `<h1>${esc(record.title)}</h1><p>Session draft. No external action has occurred.</p><section class="panel">${facts(Object.entries(record.values))}${record.links?.length?`<h2>Linked records</h2>${record.links.map(id=>`<p><a href="#records/${id}">Session record ${id}</a></p>`).join('')}`:''}<p role="status">${esc(record.state)}</p>${record.route==='workspace/test-consent'&&record.state!=='Revoked'?`<button type="button" class="button secondary" data-flow-revoke="${record.id}">Revoke permission draft</button>`:''}<a class="button secondary" href="#${record.route}">Back to workflow</a>${next?`<a class="button primary" href="#${next}">Continue preview</a>`:''}</section>`;
    }
    const schema=schemas[path];if(!schema)return null;
    let body='';
    if(path==='workspace/run')body=reportView();
    else if(path==='balance/escrow')body=escrowView();
    else if(path==='preferences/data')body=`<section class="panel"><h2>Private test permissions</h2>${records.filter(r=>r.route==='workspace/test-consent').map(r=>`<p><a href="#records/${r.id}">${esc(r.values.case)}</a> ${esc(r.state)}</p>`).join('')||'<p>No session permissions recorded.</p>'}<h2>Retention and deletion</h2><p>Production policy is not yet agreed. Session records reset on reload. No server deletion is claimed.</p>${link('workspace/test-consent')}</section>`;
    else body=`<form id="coverage-form" data-route="${path}" class="form-panel">${schema[2].map(control).join('')}<p id="flow-error" role="alert"></p><div class="form-actions"><button type="submit" class="button primary">Save session draft</button><a class="button secondary" href="#${path.split('/')[0]}">Cancel</a></div></form>`;
    const history=records.filter(r=>r.route===path);
    const context=records.filter(r=>r.values.method===selectedMethod||r.route.startsWith('community/')).slice(-8);
    return `<div class="form-layout"><a class="back-link" href="#${path.split('/')[0]}">Back</a><h1>${esc(schema[0])}</h1><p>${esc(schema[1])}</p>${context.length?`<details><summary>Linked session context</summary>${context.map(r=>`<p><a href="#records/${r.id}">${esc(r.title)} ${r.id}</a></p>`).join('')}</details>`:''}${body}${history.length?`<section class="panel"><h2>Session records</h2>${history.map(r=>`<p><a href="#records/${r.id}">Draft ${r.id}</a> ${esc(r.state)}</p>`).join('')}</section>`:''}</div>`;
  }
  function options(action, options, selected) {return `<div class="panel-actions" role="group" aria-label="Synthetic scenarios">${options.map(([id,label])=>`<button type="button" class="button secondary" data-flow-scenario="${action}" data-value="${id}" aria-pressed="${selected===id}">${label}</button>`).join('')}</div>`;}
  function reportView() {
    const failed=reportScenario==='failed'||reportScenario==='order',hash=reportScenario==='hash',unchecked=reportScenario==='unchecked',localFail=reportScenario==='local';
    return `<section class="panel"><h2>Synthetic report viewer</h2><p>No verification is performed. Choose a fixture to inspect the required frontend states.</p>${options('report',[['complete','All stages complete'],['failed','Missing method step'],['order','Out-of-order step'],['hash','Hash mismatch'],['local','Buyer check failed'],['unchecked','No local checks']],reportScenario)}${facts(['Open method','Open input','Validate imports','Execute seller steps','Read output','Pad instruction work','Seal output'].map((s,i)=>[s,failed&&i===3?'Failed in fixture':'Completed in fixture']))}<h2>Seller step comparison</h2>${facts([['Declared','Validate input → calculate plan → return answer'],['Reported',reportScenario==='order'?'Return answer → validate input → calculate plan. Steps are out of order.':failed?'Validate input → return answer. Missing calculate plan.':'All declared steps present in order (fixture).']])}<h2>Buyer checks</h2>${facts([['Scope',unchecked?'Result cannot be checked on this device.':'Portfolio cash, allocation, sectors, buy/sell limits and costs.'],['Results',unchecked?'No declared buyer-checkable rules.':localFail?'Cash minimum is violated in the fixture. Do not act on this plan.':'Synthetic checks pass. This does not prove the minimum possible cost.'],['Tender','Only declared rules can be checked, so coverage may be partial.']])}<h2>Attestation comparison</h2>${facts([['Input / output hashes',hash?'Mismatch in synthetic fixture':'Match in synthetic fixture'],['Runner / manifest / version','Fixture references only, not registry verification'],['Fresh nonce and signature','Not verified by this preview'],['Result',failed||hash||localFail?'Do not use this fixture result. Investigate the reported failure.':'Not verified. Fixture completion is not a safe-to-use certification.']])}<p>Local checks do not determine escrow release. A no-solution answer can complete all stages and still be payable.</p><a class="button secondary" href="#balance/escrow">View escrow scenarios</a></section>`;
  }
  function escrowView() {
    const expired=escrowScenario==='expired',returned=escrowScenario==='returned',released=escrowScenario==='released';
    return `<section class="panel"><h2>Synthetic escrow record</h2><p>No escrow loaded from NEAR. Amounts below are fixture units, not a quote or transaction.</p>${options('escrow',[['held','Held'],['released','Released'],['returned','Stage failed'],['expired','Timed out']],escrowScenario)}${facts([['Run','fixture-run-001'],['Amount held','100 fixture units'],['Deadline',expired?'Elapsed in fixture':'Not elapsed in fixture'],['Signed completion',released?'Fixture signature reference only':returned?'Fixture reports a missing method step':'Not received'],['State',escrowScenario],['Distribution',released?'Seller 80, DAO 10, platform 10 fixture units. Illustrative base only.':'No distribution'],['Returned amount',returned?'100 fixture units':'0 fixture units'],['Reason',returned?'A required stage failed.':expired?'Completion did not arrive before the fixture deadline.':'Await or inspect stage completion.']])}${expired?'<button type="button" class="button primary" data-flow-scenario="escrow" data-value="returned">Simulate timeout reclaim</button>':'<button type="button" class="button secondary" disabled>Reclaim unavailable in this fixture state</button>'}<p>Release follows contract verification of the TEE-signed stages, not answer quality or buyer-local checks. Completion status is public, while input and answer remain sealed.</p></section>`;
  }
  document.addEventListener('submit', event => {
    const form=event.target;if(form.id!=='coverage-form')return;
    event.preventDefault();if(!form.reportValidity())return;
    const route=form.dataset.route, schema=schemas[route];if(!schema)return;
    const values={};schema[2].forEach(f=>{const el=form.elements[f.name];values[f.name]=f.type==='checkbox'?el.checked:f.type==='file'?(el.files?.[0]?.name||'No file selected'):el.value.trim()});
    if(values.method)selectedMethod=values.method;
    if(route==='workspace/model')values.allowed=sellerRoutes();
    let error='';
    if(route==='workspace/model'&&values.model==='Proprietary model') {
      if(values.allowed==='Private only')error='The buyer cannot expand the seller’s allowed model routes.';
      else if(!values.consent||!values.filter)error='A proprietary route requires explicit consent and a redaction plan.';
    }
    if(route==='workspace/checkout') {
      if(Number(values.maximum)<Number(values.price)+Number(values.infra))error='Maximum payment must cover the displayed method and infrastructure estimate.';
      if(Number(values.share)<10||Number(values.share)>90)error='Shared fund allocation must be between 10% and 90%.';
    }
    if(route==='workspace/test-consent'&&(!Number.isInteger(Number(values.attempts))||Number(values.attempts)<1))error='Test attempts must be a positive whole number.';
    if(route==='workspace/test-consent'&&values.expiry<new Date().toISOString().slice(0,10))error='Permission expiry must not be in the past.';
    if(error){document.getElementById('flow-error').textContent=error;return;}
    const record={id:++serial,route,title:schema[0],values,state:route==='workspace/test-consent'?'Permission draft only':'Draft only',links:records.filter(r=>r.values.method===selectedMethod||r.route.startsWith('community/')).map(r=>r.id)};records.push(record);
    location.hash='records/'+record.id;
  });
  document.addEventListener('click',event=>{
    const scenario=event.target.closest('[data-flow-scenario]');
    if(scenario){if(scenario.dataset.flowScenario==='report')reportScenario=scenario.dataset.value;else escrowScenario=scenario.dataset.value;document.getElementById('main').innerHTML=page(scenario.dataset.flowScenario==='report'?'workspace/run':'balance/escrow');document.getElementById('main').focus();return;}
    const button=event.target.closest('[data-flow-revoke]');if(!button)return;
    const record=records.find(r=>String(r.id)===button.dataset.flowRevoke);if(!record)return;
    record.state='Revoked';document.getElementById('main').innerHTML=page('records/'+record.id);document.getElementById('main').focus();
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='flow-method') {
      selectedMethod=event.target.value;
      const allowed=document.getElementById('flow-allowed');if(allowed)allowed.value=sellerRoutes();
    }
  });
  window.KalisFlows={page,navigation,routes:Object.keys(schemas),records};
})();
