(() => {
  'use strict';
  const data = window.KalisPreview;
  const main = document.getElementById('main');
  const overlay = document.getElementById('overlay');
  const accountTrigger = document.getElementById('account-trigger');
  const accountMenu = document.getElementById('account-menu');
  let dialogOpener = null;
  let toastTimer;
  let wizard = { step: 1, method: 'portfolio', name: '', margin: '9', cash: '0' };
  let workFilter = 'all';
  let activityFilter = 'all';
  let categoryFilter = 'All methods';
  let sampleBalance = null;
  const topups = [];
  let dialogGeneration = 0;
  let methodSearch = '';
  let name = 'Dien';
  let simulatedFailure = false;
  let sampleConnected = false;
  const icons = {
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    portfolio: '<path d="M4 20h16M5 16V9h4v7m6 0V4h4v12M5 5l4-2m5 17v-7h-4v7"/>',
    tender: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h4"/>',
    salary: '<path d="M4 4h16v12H10l-5 4v-4H4zM8 8h8M8 12h5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    memory: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9h6v6H9zM9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3M19 9h3m-3 6h3"/>',
    external: '<path d="M14 3h7v7m0-7L11 13M10 5H4v15h15v-6"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    wallet: '<path d="M4 7V4h14v3M3 7h18v13H3zM16 11h5v5h-5z"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10M18 9v2c0 4-12 0-12 4"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>',
    inbox: '<path d="m5 4-3 11v5h20v-5L19 4zM2 15h6l2 3h4l2-3h6"/>',
    link: '<path d="m10 7 3-3a5 5 0 0 1 7 7l-3 3m-3 3-3 3a5 5 0 0 1-7-7l3-3m1 6 8-8"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<path d="m12 3 10 18H2zM12 9v5M12 17h.01"/>'
  };
  const icon = key => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key] || icons.file}</svg>`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const method = id => data.methods.find(item => item.id === id);
  const pending = () => data.approvals.filter(item => item.state === 'Pending');
  const methodSymbol = id => `<span class="method-symbol">${icon(method(id)?.icon || 'file')}</span>`;
  const button = (label, href, style = 'primary', glyph = '') => `<a class="button ${style}" href="#${href}">${glyph ? icon(glyph) : ''}${label}</a>`;
  const actionButton = (label, action, style = 'secondary', attrs = '') => `<button type="button" class="button ${style}" data-action="${action}" ${attrs}>${label}</button>`;
  const badge = (label, type = '') => `<span class="badge ${type}">${type === 'ready' ? icon('check') : ''}${escape(label)}</span>`;
  const previewLabel = `<span class="preview-label">${icon('eye')}Sample workspace</span>`;
  function heading(title, subtitle, action = '') {
    return `<div class="page-heading"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div><div class="heading-actions">${previewLabel}${action}</div></div>`;
  }
  function tabs(items, active) {
    return `<nav class="tabs" aria-label="Page sections">${items.map(([title, path]) => `<a href="#${path}" ${active === path ? 'aria-current="page"' : ''}>${title}</a>`).join('')}</nav>`;
  }
  const workspaceTabs = active => tabs([['Overview','workspace'],['All work','workspace/all'],['Files','workspace/files'],['Memory','workspace/memory']],active);
  const marketplaceTabs = active => tabs([['Discover','marketplace'],['My methods','marketplace/mine']],active);
  const communityTabs = active => tabs([['Overview','community'],['Bounties','community/bounties'],['Contributions','community/contributions'],['Shared fund','community/fund']],active);
  const balanceTabs = active => tabs([['Overview','balance'],['Transactions','balance/transactions'],['Earnings','balance/earnings']],active);
  const back = (path, title) => `<a class="back-link" href="#${path}">${icon('back')}${title}</a>`;
  const notice = (text, tone = '') => `<div class="notice ${tone}">${icon(tone === 'error' ? 'alert' : 'info')}<p>${text}</p></div>`;
  function empty(title, message, cta = '', glyph = 'inbox') {
    return `<div class="empty-state">${icon(glyph)}<h2>${title}</h2><p>${message}</p>${cta}</div>`;
  }
  function table(rows) {
    if (!rows.length) return empty('No work in this view', 'Try another status, or start a new piece of work.', button('New work', 'workspace/new', 'primary', 'plus'));
    return `<div class="data-panel"><table class="work-table"><thead><tr><th scope="col">Work</th><th scope="col">Method</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span class="sr-only">Open</span></th></tr></thead><tbody>${rows.map(w => `<tr><td><div class="work-title">${methodSymbol(w.method)}<div><a href="#workspace/work/${w.id}"><b>${escape(w.name)}</b></a><small>Only in your workspace</small></div></div></td><td>${method(w.method).short}</td><td>${badge(w.status,w.kind === 'result' ? 'ready' : w.kind === 'approval' ? 'waiting' : 'draft')}</td><td>${w.date}</td><td><a class="row-arrow" href="#workspace/work/${w.id}" aria-label="Open ${escape(w.name)}">${icon('arrow')}</a></td></tr>`).join('')}</tbody></table></div>`;
  }
  function workspace() {
    const reviews = pending();
    return heading('Workspace', 'A little space for your next decision.',button('New work','workspace/new','primary','plus')) +
      `<div class="view-toolbar">${workspaceTabs('workspace')}<span class="toolbar-note">${icon('lock')}Your work stays in your space</span></div>
      <div class="overview-top"><section class="resume-work" aria-labelledby="resume-title"><div class="resume-top"><div>${badge('Ready to review','dark')}<h2 id="resume-title">November portfolio review</h2><p>A rebalancing plan built around your allocation and cash limits.</p></div>${methodSymbol('portfolio')}</div><div class="resume-bottom"><span>Portfolio rebalancing / v1</span>${button('Open result','workspace/work/november-portfolio','light','arrow')}</div></section>
      <section class="review-panel" aria-labelledby="review-title"><div class="panel-heading"><h2 id="review-title">Needs your review</h2><span class="count-label">${reviews.length} pending</span></div>${reviews.length ? reviews.map(a => `<a class="review-item" href="#activity/${a.id}"><span class="review-icon">${icon(a.id === 'memory' ? 'memory' : 'external')}</span><div><p>${a.title}</p><small>Supplier tender</small></div>${icon('chevron')}</a>`).join('') : `<p class="description">You’re all caught up. New requests will appear here.</p>`}</section></div>
      <section aria-labelledby="recent-title"><div class="section-header"><h2 id="recent-title">Recent work</h2><a class="text-link" href="#workspace/all">View all work ${icon('arrow')}</a></div>${table(data.work.slice(0,3))}</section>
      <div class="lower-row"><div><h3>Find a method for the work ahead.</h3><p>Explore expertise you can bring into your workspace.</p></div><div class="method-shortcuts"><a href="#marketplace/portfolio">${icon('portfolio')}Portfolio</a><a href="#marketplace/tender">${icon('tender')}Tender bid</a><a href="#marketplace">All methods ${icon('arrow')}</a></div></div>`;
  }
  function allWork() {
    const rows = data.work.filter(w => workFilter === 'all' || w.kind === workFilter);
    return heading('All work','Pick up where you left off.',button('New work','workspace/new','primary','plus')) + `<div class="view-toolbar">${workspaceTabs('workspace/all')}<label class="filter-label">Status <select id="work-filter"><option value="all" ${workFilter==='all'?'selected':''}>All statuses</option><option value="result" ${workFilter==='result'?'selected':''}>Ready to review</option><option value="approval" ${workFilter==='approval'?'selected':''}>Needs approval</option><option value="draft" ${workFilter==='draft'?'selected':''}>Draft</option></select></label></div>${table(rows)}`;
  }
  function files() {
    return heading('Private files','Documents used in your work.') + `<div class="view-toolbar">${workspaceTabs('workspace/files')}<span class="toolbar-note">Fictional files for this preview</span></div><div class="activity-list">${data.files.map((f,i)=>`<div class="activity-row">${icon('file')}<div><h2>${f.name}</h2><p>${f.source}</p><small>${f.type} / ${f.status}</small></div>${actionButton('View details','file','secondary small',`data-index="${i}"`)}</div>`).join('')}</div>`;
  }
  function memory() {
    return heading('Memory','Keep useful lessons with their sources.')+`<div class="view-toolbar">${workspaceTabs('workspace/memory')}</div>`+(data.memory.length ? `<div class="activity-list">${data.memory.map((m,i)=>`<div class="activity-row">${icon('memory')}<div><h2>${escape(m)}</h2><p>Source / fictional tender requirements</p><small>Approved in this preview</small></div>${actionButton('Remove','remove-memory','secondary small',`data-index="${i}"`)}</div>`).join('')}</div>` : empty('Your memory starts with your approval','Review a proposed lesson from Supplier tender before it becomes part of this workspace.',button('Review proposed update','activity/memory','primary'),'memory'));
  }
  const marketHeading = (title, description, action='') => `<header class="market-heading"><div><h1>${title}</h1><p>${description}</p></div>${action}</header>`;
  const rating = m => `<span class="market-rating">${icon('star')}<span>${m.rating == null ? 'No ratings yet' : escape(m.rating)+' / 5'} <small>(${m.reviewCount || 0} reviews)</small></span></span>`;
  const cover = m => `<img class="method-cover" src="assets/${m.cover || m.id+'.jpg'}" alt="" width="320" height="240" loading="lazy">`;
  const creator = m => `<span class="creator-line">${icon('people')}<span>${escape(m.creator || 'Creator not listed')}</span></span>`;
  function reviewSummary(m) {
    return `<div class="reviews-summary"><div class="reviews-score"><strong>${m.rating == null ? '—' : escape(m.rating)}</strong>${rating(m)}<p>User ratings will appear here.</p></div><div class="reviews-distribution" aria-label="No rating distribution available">${[5,4,3,2,1].map(n=>`<div><span>${n} stars</span><span class="rating-track"></span><span>0</span></div>`).join('')}</div></div><div class="reviews-empty"><h3>No reviews yet</h3><p>When user reviews are available, you’ll find their rating, method version and comments here.</p></div>`;
  }
  function methodCard(m) {
    return `<article class="market-card"><a class="method-card-link" href="#marketplace/${m.id}" aria-labelledby="method-title-${m.id}" aria-describedby="method-rating-${m.id} method-availability-${m.id}">${cover(m)}<div class="method-card-info"><span class="method-category">${m.category}</span><h2 id="method-title-${m.id}">${m.name}</h2><p class="method-card-description">${m.description}</p>${creator(m)}<div class="method-card-rating" id="method-rating-${m.id}">${rating(m)}</div><div class="market-card-bottom"><span id="method-availability-${m.id}">${m.status}</span><span class="method-price">Price not listed ${icon('arrow')}</span></div></div></a></article>`;
  }
  function catalogResults() {
    const list=data.methods.filter(m=>(categoryFilter==='All methods'||categoryFilter===m.category)&&`${m.name} ${m.description}`.toLowerCase().includes(methodSearch.toLowerCase()));
    return list.length ? `<p class="market-count">${list.length} methods</p><div class="market-catalog">${list.map(methodCard).join('')}</div>` : empty('No matching methods','Try another name or category.',actionButton('Clear filters','clear-search','primary'),'search');
  }
  function marketplace() {
    return `<div class="marketplace-view">${marketHeading('Marketplace','Find a method for your next decision.',button('Create method','marketplace/publish','secondary','plus'))}<div class="view-toolbar">${marketplaceTabs('marketplace')}<label class="search-field">${icon('search')}<input id="method-search" aria-label="Search methods" placeholder="Search methods" value="${escape(methodSearch)}"></label></div><div class="category-filter" role="group" aria-label="Method category">${['All methods','Finance','Business','Career'].map(c=>`<button data-action="category" data-category="${c}" aria-pressed="${categoryFilter===c}">${c}</button>`).join('')}</div><div id="catalog-results">${catalogResults()}</div></div>`;
  }
  function methodDetail(id) {
    const m=method(id);if(!m)return notFound();
    return `<div class="marketplace-view">${back('marketplace','Marketplace')}<header class="method-profile">${cover(m)}<div class="method-profile-info"><span class="method-category">${m.category}</span><h1>${m.name}</h1><p>${m.description}</p><div class="market-product-meta">${creator(m)}<span>${m.version}</span><a href="#marketplace/${id}/reviews">${rating(m)}</a></div></div></header><div class="market-detail"><div class="market-content"><section class="market-example"><div class="market-section-heading"><h2>What you get</h2><span>${id==='portfolio'?'Historical sample':'Planned output'}</span></div>${id==='portfolio'?`<div class="sample-trades"><div><span>Sell</span><strong>3 units of A</strong></div><div><span>Buy</span><strong>2 units of C</strong></div><div><span>Trading cost</span><strong>0.18 sample units</strong></div></div><p>Synthetic C03 example. A new run may produce a different plan.</p>`:`<div class="market-output">${icon(m.icon)}<p>${m.output}</p></div><p>No generated result is available for this listing.</p>`}</section><nav class="market-sections" aria-label="Method information"><a href="#marketplace/${id}" aria-current="page">Overview</a><a href="#marketplace/${id}/reviews">Reviews</a><a href="#marketplace/${id}/versions">Versions</a><a href="#marketplace/${id}/contributions">Contributions</a></nav><section class="market-section"><h2>What you need</h2><dl class="market-facts"><div><dt>Input</dt><dd>${m.input}</dd></div><div><dt>Access</dt><dd>${m.access}</dd></div><div><dt>AI model</dt><dd>Not listed in this preview</dd></div></dl></section><section class="market-section"><h2>Tests and limitations</h2><p>${m.proof}</p><p>${m.limitations}</p>${id==='portfolio'?'<a class="text-link" target="_blank" rel="noopener noreferrer" href="https://explorer.testnet.near.org/transactions/2m9XzLb8SD3MkChhZzfUpT5Ms2anVpYFPxDKfwjY8uHs">View historical testnet evidence</a>':''}</section><section class="market-section"><div class="market-section-heading"><h2>User reviews</h2><a href="#marketplace/${id}/reviews">View reviews ${icon('arrow')}</a></div>${reviewSummary(m)}</section></div><aside class="market-order"><h2>Use this method</h2><dl class="market-facts"><div><dt>Method price</dt><dd>Not listed</dd></div><div><dt>Run cost</dt><dd>Quoted before a live run</dd></div></dl><p class="market-availability">${m.status}</p>${id==='salary'?'<button class="button primary" disabled>Unavailable</button>':`<button type="button" class="button primary" data-action="use-method" data-id="${id}">Create sample work ${icon('arrow')}</button>`}<p class="market-action-note">${id==='salary'?'Concept listing. No method is available.':'Creates a draft with fictional data. No charge or live execution.'}</p><div class="market-order-detail"><h3>Data and access</h3><p>Review the required access before a live run. This preview does not protect real input.</p></div><a class="text-link" href="#marketplace/${id}/contributions">Improve this method ${icon('arrow')}</a></aside></div></div>`;
  }
  function methodSection(id, section) {
    const m=method(id);if(!m)return notFound();
    const titles={reviews:'Reviews',versions:'Versions',contributions:'Contributions'};
    if(!titles[section])return notFound();
    let content=section==='reviews'?`${reviewSummary(m)}<p class="review-evidence-note">User ratings reflect experience with a method. Test results are listed separately in the overview.</p>`:section==='versions'?`<dl class="market-facts"><div><dt>Listed version</dt><dd>${m.version}</dd></div><div><dt>Evidence</dt><dd>${m.proof}</dd></div></dl><p>Release history and contributor records have not been connected to this listing.</p>`:`<h2>Improve ${m.name.toLowerCase()}</h2><p>Contribute to modules the creator opens for review. Private test cases require their owner's permission.</p><dl class="market-facts"><div><dt>Open bounties</dt><dd>Not connected</dd></div><div><dt>Modules</dt><dd>Not listed</dd></div><div><dt>Review</dt><dd>Changes must pass testing and review before acceptance.</dd></div></dl>`;
    return `<div class="marketplace-view">${back('marketplace/'+id,m.name)}<header class="method-section-profile">${cover(m)}<div><p>${m.name}</p><h1>${titles[section]}</h1></div></header><nav class="market-sections" aria-label="Method information">${[['Overview',''],['Reviews','/reviews'],['Versions','/versions'],['Contributions','/contributions']].map(([label,suffix])=>`<a href="#marketplace/${id}${suffix}" ${titles[section]===label?'aria-current="page"':''}>${label}</a>`).join('')}</nav><section class="market-section market-reading">${content}</section></div>`;
  }
  function mine() {
    return `<div class="marketplace-view">${marketHeading('My methods','Create and manage your method listings.',button('Create method','marketplace/publish','primary','plus'))}<div class="view-toolbar">${marketplaceTabs('marketplace/mine')}</div>`+(data.methodDrafts.length?`<div class="market-drafts">${data.methodDrafts.map((m,i)=>`<article><img class="draft-cover" src="assets/${['portfolio.jpg','tender.jpg','salary.jpg'].includes(m.cover)?m.cover:'portfolio.jpg'}" alt="" width="80" height="80"><div><h2>${escape(m.name)}</h2><p>${escape(m.description)}</p><span>Draft</span></div>${actionButton('View draft','view-method-draft','secondary',`data-index="${i}"`)}</article>`).join('')}</div>`:empty('No methods yet','Create your first listing. Drafts stay private until publication.','','file'))+'</div>';
  }
  function publish() {
    return `<div class="marketplace-view">${back('marketplace/mine','My methods')}${marketHeading('Create method','Describe the result, the required input and how people can use your method.')}<div class="market-editor"><form id="publish-form" class="form-panel"><fieldset><legend>Listing</legend><div class="form-field"><label for="method-name">Method name</label><input id="method-name" name="name" required maxlength="90" placeholder="Portfolio rebalance"></div><div class="form-field"><label for="method-description">Description</label><textarea id="method-description" name="description" required maxlength="600" placeholder="What does your method help someone do?"></textarea></div></fieldset><div class="form-field"><label for="method-cover">Cover image</label><img id="draft-cover-preview" class="draft-dialog-cover" src="assets/portfolio.jpg" alt="Selected cover preview" width="320" height="160"><select id="method-cover" name="cover"><option value="portfolio.jpg">City architecture</option><option value="tender.jpg">Office corridor</option><option value="salary.jpg">Meeting room</option></select><small>Choose a cover for your draft listing.</small></div><fieldset><legend>Input and result</legend><div class="form-field"><label for="method-input">Required input</label><textarea id="method-input" name="input" maxlength="600"></textarea></div><div class="form-field"><label for="method-output">Expected result</label><textarea id="method-output" name="output" maxlength="600"></textarea></div><div class="form-field"><label for="method-limits">Limitations</label><textarea id="method-limits" name="limitations" maxlength="600"></textarea></div></fieldset><fieldset><legend>Access and contributions</legend><div class="form-field"><label for="method-access">Required access</label><textarea id="method-access" name="access" maxlength="600" placeholder="Documents, services or actions the method requires"></textarea></div><div class="form-grid"><div class="form-field"><label for="dao-share">Shared fund (%)</label><input id="dao-share" name="share" type="number" min="10" max="90" value="10" required><small>Minimum 10%. Platform receives 10%. Seller receives the remainder.</small></div><div class="form-field"><label for="module-access">Contribution access</label><select id="module-access" name="modules"><option value="undecided">Decide before publication</option><option value="open">Selected modules</option></select></div></div></fieldset><div class="market-save-note"><h2>Save a private draft</h2><p>This preview saves for this session only. Code, price, version evidence and publication must be connected before a listing can go live.</p></div><div class="form-actions">${button('Cancel','marketplace/mine','secondary')}<button class="button primary" type="submit">Save draft ${icon('check')}</button></div></form></div></div>`;
  }
  function newWork() {
    const m=method(wizard.method);
    const steps=`<div class="step-heading" aria-label="Work setup steps"><span ${wizard.step===1?'aria-current="step"':''}>1 Choose method</span>${icon('chevron')}<span ${wizard.step===2?'aria-current="step"':''}>2 Add input</span>${icon('chevron')}<span ${wizard.step===3?'aria-current="step"':''}>3 Review</span></div>`;
    let body='';
    if(wizard.step===1)body=`<h2>What are you working on?</h2><div class="select-methods">${data.methods.filter(m=>m.id!=='salary').map(m=>`<label class="select-method"><input type="radio" name="method" value="${m.id}" ${m.id===wizard.method?'checked':''}><span><b>${m.name}</b><small>${m.description}</small></span>${methodSymbol(m.id)}</label>`).join('')}</div>`;
    if(wizard.step===2)body=`<h2>Give this work a little context</h2><div class="form-field"><label for="work-name">Work name</label><input id="work-name" name="workName" required maxlength="90" value="${escape(wizard.name)}" placeholder="${m.id==='portfolio'?'My portfolio review':'My tender bid'}"></div><div class="form-field"><label for="sample-data">Input</label><select id="sample-data" name="sample"><option>${m.id==='portfolio'?'Synthetic portfolio / Case C03':'Fictional tender / CV Maju'}</option></select><small>Use sample data here. Real private data should wait for the protected runtime.</small></div><div class="form-field"><label for="work-constraint">${m.id==='portfolio'?'Minimum cash reserve':'Minimum margin (%)'}</label><input id="work-constraint" name="constraint" type="number" min="0" ${m.id==='tender'?'max="100"':''} value="${m.id==='portfolio'?wizard.cash:wizard.margin}" required><small>Stored in your preview draft. It does not recalculate the historical sample result.</small></div>`;
    if(wizard.step===3)body=`<h2>Review your preview work</h2><dl class="fact-list"><div><dt>Work</dt><dd>${escape(wizard.name)}</dd></div><div><dt>Method</dt><dd>${m.name} / ${m.version}</dd></div><div><dt>Input</dt><dd>${m.id==='portfolio'?'Synthetic portfolio C03':'Fictional tender documents'}</dd></div><div><dt>Access</dt><dd>${m.access}</dd></div><div><dt>${m.id==='portfolio'?'Minimum cash reserve':'Minimum margin'}</dt><dd>${escape(m.id==='portfolio'?wizard.cash:wizard.margin)}${m.id==='tender'?'%':''}</dd></div><div><dt>Payment</dt><dd>No payment in this preview</dd></div></dl>${notice('Creating this work saves a draft for this session. A live run will require a version check, confirmed permissions and a cost estimate.')}`;
    return back('workspace','Workspace')+heading('New work','Choose expertise, then bring your own context.')+`<div class="form-layout">${steps}<form id="work-form" class="form-panel">${body}<div class="form-actions">${wizard.step>1?actionButton('Back','wizard-back','secondary'):button('Cancel','workspace','secondary')}<button class="button primary" type="submit">${wizard.step===3?'Create preview work':'Continue'} ${icon('arrow')}</button></div></form></div>`;
  }
  function workDetail(id) {
    const w=data.work.find(w=>w.id===id);if(!w)return notFound();const m=method(w.method);
    let content;
    if(w.kind==='result')content=`<section class="panel"><div class="section-header"><h2>Your rebalancing plan</h2>${badge('Sample result','ready')}</div><p class="description">Historical synthetic case C03. These are the recorded sample outputs, not a new calculation.</p><div class="result-summary"><div class="result-value"><span>Asset A</span><b>Sell 3 units</b><small>Reduce the existing position</small></div><div class="result-value"><span>Asset C</span><b>Buy 2 units</b><small>Bring the allocation within limits</small></div></div><div class="result-row"><span>Transaction cost</span><b>0.18 sample units</b></div><div class="result-row"><span>Allocation and cash constraints</span>${badge('Met','ready')}</div><details><summary>View the evidence behind this sample</summary><p>The historical sealed-probe test returned this result with encrypted input and output. The preview itself makes no private computation or trade.</p><a href="https://explorer.testnet.near.org/transactions/2m9XzLb8SD3MkChhZzfUpT5Ms2anVpYFPxDKfwjY8uHs" target="_blank" rel="noopener noreferrer">View testnet transaction</a></details></section>`;
    else if(w.kind==='approval'||w.kind==='reviewed')content=`<section class="panel"><h2>${w.kind==='reviewed'?'Your decisions are recorded':'Review before continuing'}</h2><p class="description">${w.kind==='reviewed'?'All sample requests have been reviewed. No external action or live execution was performed.':'The tender workflow has proposed actions that need your attention.'}</p>${data.approvals.map(a=>`<a class="review-item" href="#activity/${a.id}"><span class="review-icon">${icon(a.id==='memory'?'memory':'external')}</span><div><p>${a.title}</p><small>${a.state}</small></div>${icon('chevron')}</a>`).join('')}</section>`;
    else content=`<section class="panel"><h2>Your draft is ready</h2><p class="description">This work was saved in the preview. Review its method and input before connecting a live run.</p><dl class="fact-list"><div><dt>Input</dt><dd>${w.method==='portfolio'?'Synthetic portfolio C03':'Fictional tender documents'}</dd></div>${w.constraint!==undefined?`<div><dt>${w.method==='portfolio'?'Minimum cash reserve':'Minimum margin'}</dt><dd>${escape(w.constraint)}${w.method==='tender'?'%':''}</dd></div>`:''}<div><dt>Runtime</dt><dd>Not connected in this preview</dd></div><div><dt>Cost</dt><dd>Needs a live estimate before payment</dd></div></dl><div class="panel-actions">${w.method==='portfolio'?button('Open historical sample','workspace/work/november-portfolio','primary'):button('View sample approvals','workspace/work/supplier-tender','primary')}</div></section>`;
    return back('workspace/all','All work')+heading(escape(w.name),`${m.short} / ${m.version}`)+`<div class="detail-layout">${content}<aside class="aside-stack"><section class="panel"><h2>Work details</h2><dl class="fact-list"><div><dt>Status</dt><dd>${escape(w.status)}</dd></div><div><dt>Visibility</dt><dd>Your workspace</dd></div><div><dt>Data</dt><dd>Synthetic sample</dd></div></dl><a class="text-link" href="#marketplace/${m.id}">View method ${icon('arrow')}</a></section><section class="panel"><h2>Improve the next version</h2><p>Report a problem without automatically sharing your private inputs.</p>${button('Explore improvements','community/bounties','secondary')}</section></aside></div>`;
  }
  function community(path) {
    const title=path==='community'?'Community':path.endsWith('bounties')?'Bounties':path.endsWith('contributions')?'Contributions':'Shared fund';
    let body='';
    if(path==='community')body=`<div class="community-layout"><section class="fund-intro"><h2>Better methods start with shared work.</h2><p>Fund useful improvements. Review the change. Give the next version a clear history.</p><div class="fund-rule"><div><b>10% minimum</b><small>Shared fund allocation in the demo</small></div></div><a class="text-link" href="#community/fund">Explore the shared fund ${icon('arrow')}</a></section><section class="panel"><h2>From an idea to an improvement</h2><div class="steps-list"><div><span>01</span><div><b>Define the change</b><p>Agree on the module, scope and acceptance criteria.</p></div></div><div><span>02</span><div><b>Test and review</b><p>Check the contribution against independent criteria.</p></div></div><div><span>03</span><div><b>Reward the contribution</b><p>Pay the accepted bounty and record the new version.</p></div></div></div></section></div><p class="support-note">The community workflow is a design proposal. No live proposals, votes or bounty payments are loaded.</p>`;
    else if(path.endsWith('bounties'))body=empty('No bounties loaded yet','When improvements are funded, their scope, open modules and acceptance criteria will appear here.',button('View shared fund','community/fund','primary'),'branch');
    else if(path.endsWith('contributions'))body=empty('A place for your contributions','Your submitted changes and review results will appear here when the contribution workflow is connected.',button('Explore bounties','community/bounties','primary'),'branch');
    else body=`<div class="detail-layout"><section class="panel"><div class="section-header"><h2>Method improvement fund</h2>${badge('Testnet plan')}</div><p class="description">Shared funds support accepted improvements through Sputnik DAO. Fund balances and proposals are not connected to this preview.</p><dl class="fact-list"><div><dt>Shared fund</dt><dd>At least 10%, selected by the seller</dd></div><div><dt>Platform</dt><dd>10% for the testnet demo</dd></div><div><dt>Seller</dt><dd>The remaining allocation, up to 80%</dd></div></dl>${notice('Infrastructure is shown separately before a live run. This preview does not calculate a payment split.')}</section><aside>${empty('No proposals loaded','Approved budgets, voting and payout records will appear here once connected.','','people')}</aside></div>`;
    return heading(title,'Expertise grows through thoughtful contributions.')+`<div class="view-toolbar">${communityTabs(path)}</div>`+body;
  }
  function activity(path) {
    if(path!=='activity')return approvalDetail(path.split('/')[1]);
    const rows=data.approvals.filter(a=>activityFilter==='all'||a.state==='Pending');
    return heading('Activity','The things that need your attention, together.')+`<div class="view-toolbar"><div class="tabs" role="group" aria-label="Activity filter"><button data-action="activity-filter" data-filter="all" aria-pressed="${activityFilter==='all'}">All activity</button><button data-action="activity-filter" data-filter="pending" aria-pressed="${activityFilter==='pending'}">Needs attention</button></div><span class="toolbar-note">Sample activity</span></div>`+(rows.length?`<div class="activity-list">${rows.map(a=>`<div class="activity-row">${icon(a.id==='memory'?'memory':'external')}<div><h2>${a.title}</h2><p>${a.description}</p><small>Supplier tender / ${a.state}</small></div>${button(a.state==='Pending'?'Review':'View decision',`activity/${a.id}`,'secondary small')}</div>`).join('')}</div>`:empty('You’re all caught up','Requests that need a decision will appear here.',button('Back to workspace','workspace','primary'),'check'));
  }
  function approvalDetail(id) {
    const a=data.approvals.find(a=>a.id===id);if(!a)return notFound();
    return back('activity','Activity')+heading(a.title,'Supplier tender / Sample request')+`<div class="form-layout"><section class="panel"><div class="section-header"><h2>${a.scope}</h2>${badge(a.state,a.state==='Pending'?'waiting':a.state==='Approved'?'ready':'draft')}</div><p class="description">${a.detail}</p><dl class="fact-list"><div><dt>Scope</dt><dd>${a.id==='memory'?'Save this one lesson with its source':'Share this one sample bid summary'}</dd></div><div><dt>Private information</dt><dd>Not shared with the method seller</dd></div><div><dt>Preview behavior</dt><dd>${a.id==='memory'?'Updates only the session memory list':'Records only a sample decision. Sends nothing.'}</dd></div></dl>${a.state==='Pending'?`<div class="panel-actions">${actionButton('Decline','decision','secondary',`data-id="${a.id}" data-decision="Declined"`)}${actionButton('Approve in preview','decision','primary',`data-id="${a.id}" data-decision="Approved"`)}</div>`:notice(`You ${a.state.toLowerCase()} this request in the preview.`)}</section></div>`;
  }
  function balance(path) {
    let body;
    if(path==='balance')body=`<div class="balance-layout"><section class="balance-summary"><p>Preview balance</p><h2>${sampleBalance===null?'Not connected':`$${sampleBalance.toFixed(2)}`}</h2><small>${sampleBalance===null?'Connect payment data to see your available funds.':'Mock funds added in this session. They have no real value.'}</small>${actionButton('Try mock top-up','top-up','light')}</section><section class="panel"><h2>Choose how to fund your work</h2><p class="description">Review the method price and infrastructure estimate before any live payment.</p><div class="payment-options"><div><b>Fiat top-up</b><p>Mock only in the MVP preview.</p></div><div><b>Crypto</b><p>Testnet settlement planned. Not connected here.</p></div></div><a class="text-link" href="#balance/transactions">View transactions ${icon('arrow')}</a></section></div>`;
    else if(path.endsWith('transactions')&&sampleBalance!==null)body=`<div class="activity-list">${topups.map((entry,i)=>`<div class="activity-row">${icon('wallet')}<div><h2>Mock top-up ${i+1}</h2><p>Added only to the preview balance.</p><small>No bank, wallet or blockchain transaction</small></div><b>$${entry.amount.toFixed(2)}</b></div>`).join('')}</div>`;
    else body=empty(path.endsWith('earnings')?'Your earnings will appear here':'No transactions loaded',path.endsWith('earnings')?'Method revenue and accepted bounty payments will be shown separately.':'Payments and their cost breakdown will appear here when connected.',button('Balance overview','balance','primary'),'wallet');
    return heading(path.endsWith('earnings')?'Earnings':path.endsWith('transactions')?'Transactions':'Balance','A clear view of what comes in and goes out.')+`<div class="view-toolbar">${balanceTabs(path)}</div>`+body;
  }
  function account() {
    return heading('Account','Your personal space in Kalis.')+`<form id="account-form" class="panel settings-panel"><h2>Profile</h2><div class="profile-intro"><span class="avatar large">${escape(name.charAt(0).toUpperCase())}</span><div><h3>${escape(name)}</h3><p>Preview account</p></div></div><div class="form-field"><label for="display-name">Display name</label><input id="display-name" name="name" value="${escape(name)}" maxlength="60" required></div><div class="form-actions"><span class="fine-print">Saved for this session only.</span><button class="button primary" type="submit">Save changes</button></div></form>`;
  }
  function connections() {
    return heading('Connections','Control what your methods can access.')+`<section class="panel settings-panel"><h2>Connected services</h2><div class="settings-row"><div><p>Portfolio broker</p><small>Mock connector. Reads synthetic holdings only.</small></div>${actionButton(sampleConnected?'Disconnect':'Connect mock','toggle-connection','secondary small')}</div><div class="settings-row"><div><p>Procurement portal</p><small>Planned mock browser session for the tender method.</small></div>${badge('Not connected')}</div>${notice('These are design examples. No credentials are collected, and no external service is accessed.')}</section>`;
  }
  function preferences() {
    return heading('Permissions & preferences','Decide how your workspace behaves.')+`<section class="panel settings-panel"><h2>Privacy</h2><div class="settings-row"><div><p>Private model route</p><small>The planned default. Proprietary models require filtering, a warning and explicit consent for the run.</small></div>${badge('Default')}</div><div class="settings-row"><div><p>External actions</p><small>Review the destination and content before approving an action.</small></div>${button('Review requests','activity','secondary small')}</div><div class="settings-row"><div><p>Private test cases</p><small>Using data for your work does not grant permission to use it for shared testing.</small></div>${badge('Separate consent')}</div><div class="settings-row"><div><p>Memory updates</p><small>Review proposed lessons and keep their sources visible.</small></div>${button('View memory','workspace/memory','secondary small')}</div><h2 class="settings-section-title">Display</h2><label class="settings-row" for="reduce-motion"><div><p>Reduce motion</p><small>The system preference is always respected. You can also turn it on here.</small></div><input type="checkbox" id="reduce-motion" ${data.preferences.reducedMotion?'checked':''}></label></section>`;
  }
  function notFound() {return heading('Page not found','This page is not part of the preview.')+empty('Let’s get you back to work','Choose a main navigation item to continue.',button('Open workspace','workspace','primary'));}
  function render(focus = false) {
    const path=decodeURIComponent(location.hash.slice(1)||'workspace');
    const base=path.split('/')[0];
    document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===base)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
    closeAccount(false);
    const count=document.getElementById('activity-count');count.textContent=pending().length;count.hidden=!pending().length;
    let html;
    const extra=window.KalisFlows?.page(path);
    if(extra)html=extra;
    else if(path==='workspace')html=workspace();
    else if(path==='workspace/all')html=allWork();
    else if(path==='workspace/files')html=files();
    else if(path==='workspace/memory')html=memory();
    else if(path==='workspace/new')html=newWork();
    else if(path.startsWith('workspace/work/'))html=workDetail(path.split('/')[2]);
    else if(path==='marketplace')html=marketplace();
    else if(path==='marketplace/mine')html=mine();
    else if(path==='marketplace/publish')html=publish();
    else if(path.startsWith('marketplace/')){const parts=path.split('/');html=parts[2]?methodSection(parts[1],parts[2]):methodDetail(parts[1]);}
    else if(['community','community/bounties','community/contributions','community/fund'].includes(path))html=community(path);
    else if(base==='activity')html=activity(path);
    else if(['balance','balance/transactions','balance/earnings'].includes(path))html=balance(path);
    else if(path==='account')html=account();
    else if(path==='connections')html=connections();
    else if(path==='preferences')html=preferences();
    else html=notFound();
    main.innerHTML=html+(window.KalisFlows?.navigation(path)||'');
    document.title=`Kalis — ${main.querySelector('h1')?.textContent || 'Workspace'}`;
    if(focus){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})}
  }
  function toast(message){const el=document.getElementById('toast');clearTimeout(toastTimer);el.textContent=message;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,4200)}
  function openDialog(title, content){dialogGeneration++;dialogOpener=document.activeElement;document.getElementById('dialog-content').innerHTML=`<div class="dialog-inner"><div class="dialog-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div>${content}</div>`;overlay.showModal()}
  function closeDialog(){dialogGeneration++;overlay.close();dialogOpener?.focus()}
  function closeAccount(restore){accountMenu.hidden=true;accountTrigger.setAttribute('aria-expanded','false');if(restore)accountTrigger.focus()}
  function searchResults(query=''){const entries=[...data.work.map(w=>({title:w.name,kind:'Work',href:`workspace/work/${w.id}`})),...data.methods.map(m=>({title:m.name,kind:'Method',href:`marketplace/${m.id}`}))];const matches=entries.filter(e=>e.title.toLowerCase().includes(query.toLowerCase()));document.getElementById('global-results').innerHTML=matches.length?matches.map(e=>`<a href="#${e.href}" data-search-result><span>${escape(e.title)}</span><small>${e.kind}</small></a>`).join(''):'<p>No matching work or methods. Try another search.</p>'}
  accountTrigger.addEventListener('click',()=>{const open=accountMenu.hidden;accountMenu.hidden=!open;accountTrigger.setAttribute('aria-expanded',String(open))});
  document.addEventListener('click',event=>{
    if(event.target.closest('.skip-link')){event.preventDefault();main.focus();main.scrollIntoView({block:'start'});return}
    if(!event.target.closest('.account-wrap'))closeAccount(false);
    if(event.target.closest('[data-search-result]'))closeDialog();
    const target=event.target.closest('[data-action]');if(!target)return;
    const action=target.dataset.action;
    if(action==='close-dialog')closeDialog();
    if(action==='search'){openDialog('Search Kalis',`<label class="search-field">${icon('search')}<input id="global-search" aria-label="Search work and methods" placeholder="Find work or a method" autofocus></label><div id="global-results" class="search-results"></div>`);searchResults();document.getElementById('global-search').focus()}
    if(action==='help')openDialog('A first look at your Kalis app',`<p>This is an interactive frontend draft with fictional work and sample data. Explore the five main areas, try a work draft, or review a sample permission request.</p>${notice('No live run, payment, encryption or external action happens here. Changes reset when the page reloads.')}<div class="panel-actions">${actionButton('Start exploring','close-dialog','primary')}</div>`);
    if(action==='file'){const f=data.files[Number(target.dataset.index)];openDialog(f.name,`<p>${f.status}, attached to ${f.source}. This preview contains a file record only, not the source document.</p><div class="panel-actions">${actionButton('Close','close-dialog','primary')}</div>`)}
    if(action==='remove-memory'){data.memory.splice(Number(target.dataset.index),1);render(true);toast('Sample memory removed.')}
    if(action==='category'){categoryFilter=target.dataset.category;document.querySelectorAll('[data-action="category"]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));document.getElementById('catalog-results').innerHTML=catalogResults()}
    if(action==='clear-search'){methodSearch='';categoryFilter='All methods';render();document.getElementById('method-search').focus()}
    if(action==='use-method'){wizard={step:2,method:target.dataset.id,name:'',margin:'9',cash:'0'};location.hash='workspace/new'}
    if(action==='wizard-back'){const form=document.getElementById('work-form');if(wizard.step===2){wizard.name=form.elements.workName.value;const value=form.elements.constraint.value;if(wizard.method==='portfolio')wizard.cash=value;else wizard.margin=value}wizard.step=Math.max(1,wizard.step-1);render(true)}
    if(action==='decision'){const a=data.approvals.find(a=>a.id===target.dataset.id);if(a.state!=='Pending')return;a.state=target.dataset.decision;if(a.id==='memory'&&a.state==='Approved')data.memory.push('Include delivery terms in the bid checklist.');const tender=data.work.find(w=>w.id==='supplier-tender');if(!pending().length){tender.status=data.approvals.some(a=>a.state==='Declined')?'Changes requested':'Review complete';tender.kind='reviewed'}render(true);toast(`${a.state} in preview. No external action was sent.`)}
    if(action==='activity-filter'){activityFilter=target.dataset.filter;render();document.querySelector(`[data-action="activity-filter"][data-filter="${activityFilter}"]`)?.focus()}
    if(action==='toggle-connection'){sampleConnected=!sampleConnected;render();document.querySelector('[data-action="toggle-connection"]')?.focus();toast(sampleConnected?'Mock connection added. No real credentials used.':'Mock connection removed.')}
    if(action==='top-up'){simulatedFailure=false;openDialog('Try a mock top-up',`<p>Add example funds to the preview balance. No card or bank details are needed.</p><form id="topup-form"><div class="form-field topup-field"><label for="topup-amount">Example amount (USD)</label><input id="topup-amount" name="amount" type="number" min="0.01" step="0.01" value="10" required><small>Mock funds have no monetary value.</small></div><label class="test-failure"><input type="checkbox" id="test-failure"> Test an unsuccessful top-up</label><p id="topup-error" class="form-error" role="alert" hidden></p><div class="form-actions">${actionButton('Cancel','close-dialog','secondary')}<button class="button primary" type="submit">Add mock funds</button></div></form>`)}
    if(action==='view-method-draft'){const m=data.methodDrafts[Number(target.dataset.index)];openDialog(escape(m.name),`<img class="draft-dialog-cover" src="assets/${['portfolio.jpg','tender.jpg','salary.jpg'].includes(m.cover)?m.cover:'portfolio.jpg'}" alt="" width="320" height="160"><p>${escape(m.description)}</p><dl class="fact-list"><div><dt>Required input</dt><dd>${escape(m.input||'Not specified')}</dd></div><div><dt>Result</dt><dd>${escape(m.output||'Not specified')}</dd></div><div><dt>Access</dt><dd>${escape(m.access||'Not specified')}</dd></div><div><dt>Limitations</dt><dd>${escape(m.limitations||'Not specified')}</dd></div><div><dt>Shared fund</dt><dd>${m.share}%</dd></div><div><dt>Platform</dt><dd>10%</dd></div><div><dt>Seller</dt><dd>${90-m.share}%</dd></div><div><dt>State</dt><dd>Session draft, not published</dd></div></dl>`)}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!accountMenu.hidden){closeAccount(true)}if((event.metaKey||event.ctrlKey)&&event.key==='k'){event.preventDefault();document.querySelector('[data-action="search"]').click()}});
  overlay.addEventListener('click',event=>{if(event.target===overlay){const rect=overlay.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog()}});
  overlay.addEventListener('cancel',()=>{dialogGeneration++;dialogOpener?.focus()});
  document.addEventListener('input',event=>{if(event.target.id==='method-search'){methodSearch=event.target.value;document.getElementById('catalog-results').innerHTML=catalogResults()}if(event.target.id==='global-search')searchResults(event.target.value)});
  document.addEventListener('change',event=>{if(event.target.id==='method-cover'){document.getElementById('draft-cover-preview').src='assets/'+event.target.value;}if(event.target.id==='work-filter'){workFilter=event.target.value;render();document.getElementById('work-filter').focus()}if(event.target.id==='reduce-motion'){data.preferences.reducedMotion=event.target.checked;document.body.classList.toggle('reduce-motion',event.target.checked);toast('Display preference updated for this session.')}});
  document.addEventListener('submit',event=>{
    const form=event.target;event.preventDefault();if(!form.reportValidity())return;
    if(form.id==='work-form'){
      if(wizard.step===1){wizard.method=form.elements.method.value;wizard.step=2;render(true)}
      else if(wizard.step===2){wizard.name=form.elements.workName.value.trim();if(!wizard.name){form.elements.workName.setCustomValidity('Give this work a name.');form.elements.workName.reportValidity();form.elements.workName.addEventListener('input',()=>form.elements.workName.setCustomValidity(''),{once:true});return}if(wizard.method==='portfolio')wizard.cash=form.elements.constraint.value;else wizard.margin=form.elements.constraint.value;wizard.step=3;render(true)}
      else {const id=`draft-${Date.now()}`;data.work.unshift({id,name:wizard.name,method:wizard.method,status:'Draft',date:'Just now',kind:'draft',constraint:wizard.method==='portfolio'?wizard.cash:wizard.margin,note:'Session preview draft'});wizard={step:1,method:'portfolio',name:'',margin:'9',cash:'0'};location.hash=`workspace/work/${id}`;toast('Preview work created. No method was executed.')}
    }
    if(form.id==='publish-form'){const title=form.elements.name.value.trim(),description=form.elements.description.value.trim();if(!title||!description){toast('Add a method name and a short description.');return}data.methodDrafts.push({name:title,description,share:Number(form.elements.share.value),modules:form.elements.modules.value,input:form.elements.input?.value||'',output:form.elements.output?.value||'',access:form.elements.access?.value||'',limitations:form.elements.limitations?.value||'',cover:form.elements.cover?.value||'portfolio.jpg'});location.hash='marketplace/mine';toast('Method draft saved in this session.')}
    if(form.id==='account-form'){const value=form.elements.name.value.trim();if(!value){toast('Enter a display name.');return}name=value;accountTrigger.querySelector('.avatar').textContent=name[0].toUpperCase();accountTrigger.children[1].textContent=name;render();document.getElementById('display-name').focus();toast('Profile updated for this preview.')}
    if(form.id==='topup-form'){
      const amount=Number(form.elements.amount.value);if(!Number.isFinite(amount)||amount<=0)return;
      const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Adding mock funds…';form.setAttribute('aria-busy','true');
      const fail=document.getElementById('test-failure').checked&&!simulatedFailure;
      const generation=dialogGeneration;
      setTimeout(()=>{if(!form.isConnected||!overlay.open||generation!==dialogGeneration)return;form.removeAttribute('aria-busy');submit.disabled=false;
        if(fail){simulatedFailure=true;const error=document.getElementById('topup-error');error.textContent='The simulated top-up failed. Your balance has not changed. Try again to complete the preview.';error.hidden=false;submit.textContent='Try mock top-up again';return}
        sampleBalance=(sampleBalance||0)+amount;topups.push({amount});closeDialog();location.hash='balance';render();toast('Mock funds added. No real payment was made.');
      },650);
    }
  });
  window.addEventListener('hashchange',()=>{if(overlay.open)closeDialog();render(true)});
  render();
})();
