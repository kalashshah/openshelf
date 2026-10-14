import { CSS } from './css';
import { fmt, type Order, type Product, type Question, type Shop, type Variant } from './store';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** Safe for a <script> block: JSON that cannot close the tag. */
function js(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c');
}

export function layout(title: string, body: string, opts: { script?: string; description?: string } = {}): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
${opts.description ? `<meta name="description" content="${esc(opts.description)}">` : ''}<link rel="preconnect" href="https://api.fontshare.com"><link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" rel="stylesheet"><style>${CSS}</style></head><body><div class="wrap">${body}</div>${opts.script ? `<script>${opts.script}</script>` : ''}</body></html>`;
}

const LOGO = `<a class="logo" href="/"><span class="mk">◫</span>Open Shelf</a>`;

const POST_JS = `function post(p,b){return fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})}`;

function when(ms: number | null | undefined): string {
  return ms ? new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC' : '';
}

function chip(s: string): string {
  const cls = /^(paid|shipped|answered|active|connected|receiving payments|via your PayPal app)$/.test(s) ? 'ok' : /^(refunded|cancelled|sold out|inactive)$/.test(s) ? 'bad' : /^(created|waiting|needs answer|not connected)$/.test(s) ? 'warn' : '';
  return `<span class="chip ${cls}">${esc(s)}</span>`;
}

function flash(note?: string, error?: string): string {
  return `${note ? `<div class="note rise">${esc(note)}</div>` : ''}${error ? `<div class="note err rise">${esc(error)}</div>` : ''}`;
}

function thumb(p: Pick<Product, 'name' | 'imageUrl'>): string {
  return p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy">` : esc(p.name.trim().charAt(0).toUpperCase());
}

/** No photo yet: a soft tint picked from the name, so a grid of placeholders still tells products apart. */
function tint(p: Pick<Product, 'name' | 'imageUrl'>): string {
  if (p.imageUrl) return '';
  let h = 0;
  for (const ch of p.name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return ` style="background:linear-gradient(160deg,hsl(${h} 55% 92%),hsl(${(h + 40) % 360} 45% 84%));color:hsl(${h} 30% 32%)"`;
}

export function errorPage(message: string): string {
  return layout('Something went wrong · Open Shelf', `<nav class="app">${LOGO}</nav><div class="card"><h2>Something went wrong</h2><p class="muted">${esc(message)}</p><a class="btn" href="/">Back</a></div>`);
}

// ---- landing + login -------------------------------------------------------------------

export function landingPage(publicUrl: string): string {
  return layout(
    'Open Shelf',
    `<nav class="app">${LOGO}<div class="right"><a class="btn sm" href="/s/dewdrop">Demo store</a><a class="btn sm dark" href="/login">Sign in</a></div></nav>
<section class="hero"><p class="mono rise">For PayPal merchants</p><h1 class="rise" style="--d:.05s">Your PayPal business, ready for AI shoppers.</h1>
<p class="sub rise" style="--d:.1s">Open Shelf turns the payment links and products you already sell into a store that AI agents can search, question and buy from. It also gives you a web shop for people. Your store gets its own agent that answers shoppers' agents from what you've published. When it doesn't know something, it says so and asks you. Every sale is paid through PayPal, and the buyer approves it.</p>
<div class="row rise" style="--d:.15s;margin-top:22px"><button class="btn dark lg" onclick="demo(this)">Try it with a demo store</button><a class="btn lg" href="/login">${PAYPAL_MARK}Set up my store with PayPal</a></div>
<p id="err" class="small" style="color:var(--red);display:none"></p></section>

<pre class="convo rise" style="--d:.2s"><i>Person → their agent</i>   Find me a moisturizer for oily skin, under $30.
<i>Agent → Open Shelf</i>     search_products("moisturizer oily skin", max_price 30)
<i>Agent → Dewdrop's agent</i> ask_store("Will the gel moisturizer clog pores? Any fragrance?")
<b>Dewdrop's agent</b>         It's tested non-comedogenic by an independent lab and has no added fragrance.
                         Niacinamide 4% helps balance oil. $24 for 50 ml, $38 for 100 ml.
<i>Agent → Open Shelf</i>     buy(Oil-Free Gel Moisturizer, Size 50 ml)  →  PayPal approval link
<i>Person</i>                 approves in PayPal  →  <b>paid, and it shows up in Dewdrop's PayPal and dashboard</b></pre>

<div class="steps">
<div class="step rise" style="--d:.25s"><div class="k">01 · bring your shop</div><h3 style="margin:6px 0">Import what you already sell</h3><p class="small muted" style="margin:0">Your PayPal payment links, a Shopify store, any product page, or a price list you paste. Claude turns it into a clean catalog in a minute.</p></div>
<div class="step rise" style="--d:.3s"><div class="k">02 · your store agent</div><h3 style="margin:6px 0">It answers from your own words</h3><p class="small muted" style="margin:0">Shoppers' agents ask about skin types, sizes and shipping. Questions it can't answer go to your inbox, and your answer teaches it for next time.</p></div>
<div class="step rise" style="--d:.35s"><div class="k">03 · get paid</div><h3 style="margin:6px 0">PayPal checkout, refunds, tracking</h3><p class="small muted" style="margin:0">Orders are created in your PayPal account. The buyer approves in PayPal, tracking goes back to PayPal, and refunds follow your policy.</p></div></div>

<div class="agentbox rise" style="--d:.4s"><div class="mono">For agents</div><p style="margin:6px 0 10px">Add the Open Shelf directory to Claude, ChatGPT or any MCP client to shop every listed store:</p><code>${esc(publicUrl)}/mcp</code><p class="small" style="margin:12px 0 0;color:#b9b6b2">Tools: list_stores, search_products, get_product, ask_store, buy, order_status, request_refund. Each store also has its own endpoint at <code>/s/&lt;store&gt;/mcp</code>.</p></div>
<p class="small muted">Built for the PayPal AI Hackathon. Payments run on PayPal Orders v2 (sandbox in the demo). The store agent and importer run on Claude.</p>`,
    {
      description: 'Turn your PayPal business into a store AI agents can ask questions of and buy from.',
      script: `${POST_JS}
function demo(b){b.disabled=true;b.textContent='Setting up your demo store…';post('/api/auth/sign-in/anonymous',{}).then(function(r){if(!r.ok){b.disabled=false;b.textContent='Try it with a demo store';var e=document.getElementById('err');e.textContent=r.j.message||'Could not start the demo';e.style.display='block';return}location.href='/app'})}`,
    },
  );
}

const PAYPAL_MARK = `<svg class="gmark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#003087" d="M7.3 21.2H3.9a.5.5 0 0 1-.5-.6L6.1 3.4A.8.8 0 0 1 6.9 2.7h6.3c3.3 0 5.4 1.7 4.8 5-.7 3.9-3.3 5.6-7 5.6H9.4a.8.8 0 0 0-.8.7z"/><path fill="#0070E0" d="M18.6 7.6c-.7 3.8-3.3 5.9-6.9 5.9h-1.2a.8.8 0 0 0-.8.7l-1 6.3-.3 1.7a.5.5 0 0 0 .5.6h3a.7.7 0 0 0 .7-.6l.7-4.5a.7.7 0 0 1 .7-.6h.6c3 0 5.2-1.6 5.8-4.8.4-2.1-.2-3.6-1.8-4.7z"/></svg>`;

export function loginPage(opts: { paypal: boolean; error?: string; next?: string }): string {
  return layout(
    'Sign in · Open Shelf',
    `<div class="auth"><div class="rise">${LOGO}</div><h1 class="rise" style="--d:.05s">Open your shelf.</h1><p class="sub rise" style="--d:.1s">Sign in with the PayPal account you sell with. Payments from shoppers and their agents go straight into it.</p>
<div class="card rise" style="--d:.15s;margin:0">${
      opts.paypal
        ? `<button class="btn dark block lg" onclick="social(this)">${PAYPAL_MARK}Log in with PayPal</button><p class="small muted" style="text-align:center;margin:12px 0 0">This demo runs on the PayPal sandbox: use a sandbox account from developer.paypal.com → Testing Tools → Sandbox accounts.</p>`
        : '<p class="empty">PayPal sign-in is not configured on this deployment.</p>'
    }
<p id="err" class="small" style="color:var(--red);display:${opts.error ? 'block' : 'none'};margin:12px 0 0">${opts.error ? `PayPal sign-in didn't complete (${esc(opts.error.replace(/_/g, ' '))}). Try again.` : ''}</p></div>
<p class="small muted" style="text-align:center;margin-top:18px">Just looking? <a href="/">Try the demo store</a> without an account.</p></div>`,
    {
      script: `var NEXT=${js(opts.next ?? '/app')};${POST_JS}
function err(m){var e=document.getElementById('err');e.textContent=m;e.style.display=m?'block':'none'}
function social(b){b.disabled=true;post('/api/auth/sign-in/social',{provider:'paypal',callbackURL:NEXT,errorCallbackURL:'/login'}).then(function(r){if(r.j.url)location.href=r.j.url;else{b.disabled=false;err((r.j&&r.j.message)||'PayPal sign-in is not available')}})}`,
    },
  );
}

// ---- merchant app -----------------------------------------------------------------------

export interface AppChrome {
  shop: Shop;
  active: 'overview' | 'products' | 'questions' | 'orders' | 'settings';
  unanswered: number;
  canTakePayments: boolean;
  isDemoUser: boolean;
  note?: string;
  error?: string;
}

function appNav(c: AppChrome): string {
  const link = (k: AppChrome['active'], href: string, label: string) => `<a href="${href}" style="${c.active === k ? 'color:var(--ink)' : ''}">${label}</a>`;
  return `<nav class="app">${LOGO}<div class="links">${link('overview', '/app', 'Overview')}${link('products', '/app/products', 'Products')}${link('questions', '/app/questions', `Questions${c.unanswered ? ` <span class="chip warn">${c.unanswered}</span>` : ''}`)}${link('orders', '/app/orders', 'Orders')}${link('settings', '/app/settings', 'Settings')}</div>
<div class="right"><a class="btn sm" href="/s/${esc(c.shop.slug)}" target="_blank">View store ↗</a><a class="btn sm" href="#" onclick="fetch('/api/auth/sign-out',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(function(){location.href='/'});return false">Sign out</a></div></nav>
${c.isDemoUser ? `<div class="note small">This is a demo store with its own sandbox PayPal. Buy anything with a PayPal sandbox buyer account; the store page shows test login details.</div>` : ''}
${!c.canTakePayments ? `<div class="note err small">Open Shelf doesn't know where to send your money yet, so agents can't buy. <a href="/app/settings">Add your PayPal</a></div>` : ''}${flash(c.note, c.error)}`;
}

function appPage(title: string, c: AppChrome, body: string, script = ''): string {
  return layout(`${title} · ${c.shop.name}`, `${appNav(c)}${body}`, { script: `${POST_JS}${script}` });
}

export interface OverviewData {
  products: number;
  questionsAsked: number;
  agentOrders: number;
  revenueCents: number;
  feed: ({ kind: 'question'; q: Question } | { kind: 'order'; o: Order })[];
  publicUrl: string;
}

export function overviewPage(c: AppChrome, d: OverviewData): string {
  const s = c.shop;
  const mcp = `${d.publicUrl}/s/${s.slug}/mcp`;
  const feed = d.feed.length
    ? `<ul class="feed">${d.feed
        .map((f) =>
          f.kind === 'question'
            ? `<li><span class="who">${chip(f.q.asker)}</span><div style="flex:1"><b>${esc(f.q.question)}</b><div class="small muted">${esc(f.q.answer.slice(0, 240))}</div></div><div class="r small muted" style="white-space:nowrap">${f.q.answered || f.q.merchantAnswer ? '' : `<a href="/app/questions">${chip('needs answer')}</a> `}${esc(when(f.q.createdAt))}</div></li>`
            : `<li><span class="who">${chip(f.o.channel)}</span><div style="flex:1"><b>Order ${esc(f.o.id)} · ${esc(fmt(f.o.totalCents, f.o.currency))}</b><div class="small muted">${esc(f.o.items.map((i) => `${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', '))}</div></div><div class="r small muted" style="white-space:nowrap">${chip(f.o.status === 'created' ? 'waiting' : f.o.status)} ${esc(when(f.o.createdAt))}</div></li>`,
        )
        .join('')}</ul>`
    : `<p class="empty">Nothing yet. Connect an agent (above) and ask it to shop at ${esc(s.name)}, or open your store page and ask a question.</p>`;
  return appPage(
    'Overview',
    c,
    `<div class="head rise"><div><h1>${esc(s.name)}</h1><p class="sub">${esc(s.tagline || 'Add a tagline in Settings so agents know what you sell.')}</p></div></div>
<div class="kpis"><div class="kpi"><div class="l">Products on the shelf</div><div class="n">${d.products}</div></div><div class="kpi"><div class="l">Questions from shoppers</div><div class="n">${d.questionsAsked}</div></div><div class="kpi ${c.unanswered ? 'warn' : ''}"><div class="l">Waiting for your answer</div><div class="n">${c.unanswered}</div></div><div class="kpi ok"><div class="l">Paid sales</div><div class="n">${esc(fmt(d.revenueCents, s.currency))}</div><div class="s">${d.agentOrders} by AI agents</div></div></div>
<div class="agentbox"><div class="mono">Your store's agent endpoint</div><p style="margin:6px 0 10px">Any MCP client can now ask your store questions and buy from it. Paste this into Claude (Settings → Connectors → Add custom connector) or ChatGPT (developer mode → Add app):</p>
<div class="row"><code id="mcpUrl">${esc(mcp)}</code><button class="btn sm" onclick="navigator.clipboard.writeText(document.getElementById('mcpUrl').textContent);this.textContent='Copied'">Copy</button></div>
<p class="small" style="margin:12px 0 0;color:#b9b6b2">Then try: "Find me something from ${esc(s.name)} for oily skin under $30, check it won't clog pores, and buy it." People can shop the same catalog at <a href="/s/${esc(s.slug)}" target="_blank">${esc(d.publicUrl.replace(/^https?:\/\//, ''))}/s/${esc(s.slug)}</a>${s.listed ? ', and it is listed in the public directory.' : '.'}</p></div>
<div class="card"><div class="cardhead"><h2>What shoppers and agents did</h2><a class="small" href="/app/questions">All questions →</a></div>${feed}</div>`,
  );
}

export function productsPage(c: AppChrome, products: Product[]): string {
  const rows = products.length
    ? products
        .map(
          (p) => `<tr><td style="width:56px"><div class="prod" style="width:48px;border-radius:10px"><div class="img"${tint(p).replace('style="', 'style="font-size:18px;')}>${thumb(p)}</div></div></td>
<td><a href="/app/products/${esc(p.id)}"><b>${esc(p.name)}</b></a><div class="small muted">${esc(p.description.slice(0, 110))}${p.description.length > 110 ? '…' : ''}</div></td>
<td class="r num">${esc(fmt(p.priceCents, c.shop.currency))}</td><td class="small">${esc(variantText(p.variants, c.shop.currency).replace(/\n/g, '; ')) || '<span class="muted">none</span>'}</td>
<td class="r num">${p.stock === null ? '<span class="muted">∞</span>' : p.stock === 0 ? chip('sold out') : p.stock}</td>
<td>${p.active ? '' : chip('inactive')} ${chip(p.source.replace('_', ' '))} ${p.needsShipping ? '' : chip('service')} ${p.paypalLinkUrl ? `<a class="small" href="${esc(p.paypalLinkUrl)}" target="_blank">PayPal link ↗</a>` : ''}</td></tr>`,
        )
        .join('')
    : `<tr><td colspan="6"><p class="empty">No products yet. Import them above or add one.</p></td></tr>`;
  return appPage(
    'Products',
    c,
    `<div class="head rise"><div><h1>Products</h1><p class="sub">Everything here is what your store agent knows and sells. Bring in what you already have, then tidy it up.</p></div><a class="btn dark" href="/app/products/new">Add a product</a></div>
<div class="steps four" style="margin-top:0">
<form class="step" method="post" action="/app/import/paypal" onsubmit="busy(this)"><div class="k">from PayPal</div><h3 style="margin:6px 0">Your payment links</h3><p class="small muted">Every PayPal payment link (Pay Links &amp; Buttons) becomes a product, with its price and options.</p><button class="btn dark sm">Import payment links</button></form>
<form class="step" method="post" action="/app/import/invoices" onsubmit="busy(this)"><div class="k">from PayPal</div><h3 style="margin:6px 0">Your invoices</h3><p class="small muted">Sell services? Claude turns what you've invoiced into offerings agents can book and pay for.</p><button class="btn dark sm">Import from invoices</button></form>
<form class="step" method="post" action="/app/import/url" onsubmit="busy(this)"><div class="k">from a website</div><h3 style="margin:6px 0">Shopify or any shop page</h3><input class="f sm" name="url" type="url" required placeholder="https://yourshop.com"><button class="btn dark sm" style="margin-top:8px">Import</button></form>
<form class="step" method="post" action="/app/import/text" onsubmit="busy(this)"><div class="k">from text</div><h3 style="margin:6px 0">Paste a price list or CSV</h3><textarea class="f" name="text" required placeholder="Lavender soap bar, $8, 100 g&#10;Gift box of 3 soaps, $21" style="min-height:64px;font-size:14px"></textarea><button class="btn dark sm" style="margin-top:8px">Read it with AI</button></form></div>
<div class="card"><div class="cardhead"><h2>On the shelf (${products.length})</h2>${products.some((p) => !p.paypalLinkId) ? `<form method="post" action="/app/publish" onsubmit="busy(this)"><button class="btn sm" title="Creates a PayPal payment link for each product that doesn't have one, so you can also share them anywhere">Create PayPal links for the rest</button></form>` : ''}</div>
<div style="overflow-x:auto"><table><thead><tr><th></th><th>Product</th><th class="r">Price</th><th>Options</th><th class="r">Stock</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div></div>`,
    `function busy(f){var b=f.querySelector('button');b.disabled=true;b.textContent='Working…'}`,
  );
}

export function productEditPage(c: AppChrome, p: Product | null): string {
  const v = (k: keyof Product) => esc(p ? (p[k] as unknown) : '');
  return appPage(
    p ? p.name : 'New product',
    c,
    `<div class="head rise"><div><a class="small muted" href="/app/products">← Products</a><h1>${p ? esc(p.name) : 'New product'}</h1></div></div>
<form class="card" method="post" action="/app/products/${p ? esc(p.id) : 'new'}">
<div class="grid2"><div class="fld"><label class="f">Name</label><input class="f" name="name" required value="${v('name')}"></div><div class="fld"><label class="f">Price (${esc(c.shop.currency)})</label><input class="f" name="price" required inputmode="decimal" value="${p ? (p.priceCents / 100).toFixed(2) : ''}"></div></div>
<div class="fld"><label class="f">Description: the store agent quotes this, so say who it suits, sizes, materials or ingredients</label><textarea class="f" name="description" style="min-height:120px">${v('description')}</textarea></div>
<div class="grid2"><div class="fld"><label class="f">Image URL</label><input class="f" name="image_url" type="url" value="${v('imageUrl')}"></div><div class="fld"><label class="f">Stock (blank = not tracked)</label><input class="f" name="stock" inputmode="numeric" value="${p?.stock ?? ''}"></div></div>
<div class="fld"><label class="f">Options, one per line: Name: choice | choice=price</label><textarea class="f" name="variants" placeholder="Size: 50 ml=24.00 | 100 ml=38.00&#10;Scent: Unscented | Lavender" style="min-height:70px;font-family:ui-monospace,Menlo,monospace;font-size:13.5px">${esc(p ? variantText(p.variants) : '')}</textarea></div>
<div class="fld"><label class="row small"><input type="checkbox" name="active" ${!p || p.active ? 'checked' : ''}> On the shelf (agents and shoppers can see and buy it)</label></div>
<div class="fld" style="margin-top:8px"><label class="row small"><input type="checkbox" name="ships" ${!p || p.needsShipping ? 'checked' : ''}> Ships to the buyer (untick for services and digital products: no address is asked)</label></div>
<div class="row" style="margin-top:18px"><button class="btn dark">Save</button>${p ? `<button class="btn danger" formaction="/app/products/${esc(p.id)}/delete" onclick="return confirm('Delete ${esc(p.name).replace(/'/g, '')}?')">Delete</button>` : ''}${p?.paypalLinkUrl ? `<a class="small right" href="${esc(p.paypalLinkUrl)}" target="_blank">PayPal payment link ↗</a>` : ''}</div></form>`,
  );
}

export function questionsPage(c: AppChrome, qs: Question[]): string {
  const open = qs.filter((q) => !q.answered && !q.merchantAnswer);
  const rest = qs.filter((q) => q.answered || q.merchantAnswer);
  const item = (q: Question, form: boolean) => `<li><span class="who">${chip(q.asker)}</span><div style="flex:1;min-width:0"><b>${esc(q.question)}</b>
<div class="small muted" style="margin-top:2px">Store agent: ${esc(q.answer)}</div>
${q.merchantAnswer ? `<div class="msg"><b>Your answer · the agent uses this now</b>${esc(q.merchantAnswer)}</div>` : ''}
${form ? `<form method="post" action="/app/questions/${esc(q.id)}" class="row" style="margin-top:8px"><input class="f sm" name="answer" required placeholder="Answer once; every future shopper's agent gets it" style="flex:1;min-width:220px"><button class="btn dark sm">Teach the agent</button></form>` : ''}</div><div class="small muted" style="white-space:nowrap">${esc(when(q.createdAt))}</div></li>`;
  return appPage(
    'Questions',
    c,
    `<div class="head rise"><div><h1>Questions</h1><p class="sub">What shoppers' agents and people asked your store. When the agent didn't know, the question waits here. Answer it once and the agent knows it from then on.</p></div></div>
<div class="card"><h2>Waiting for you (${open.length})</h2>${open.length ? `<ul class="feed">${open.map((q) => item(q, true)).join('')}</ul>` : '<p class="empty">All caught up.</p>'}</div>
<div class="card"><h2>Answered (${rest.length})</h2>${rest.length ? `<ul class="feed">${rest.map((q) => item(q, false)).join('')}</ul>` : '<p class="empty">No questions yet.</p>'}</div>`,
  );
}

export function ordersPage(c: AppChrome, orders: Order[]): string {
  const rows = orders.length
    ? orders
        .map(
          (o) => `<tr><td><b>${esc(o.id)}</b><div class="small muted">PayPal ${esc(o.paypalOrderId)}</div><div class="small muted">${esc(when(o.createdAt))}</div></td>
<td class="small">${o.items.map((i) => `${i.quantity} × ${esc(i.name)}${i.variant ? ` <span class="muted">(${esc(i.variant)})</span>` : ''}`).join('<br>')}</td>
<td class="r num">${esc(fmt(o.totalCents, o.currency))}</td><td>${chip(o.channel)}</td><td>${chip(o.status === 'created' ? 'waiting' : o.status)}</td>
<td class="small">${esc(o.buyerName ?? '')}${o.buyerEmail ? `<div class="muted">${esc(o.buyerEmail)}</div>` : ''}${o.shipTo ? `<div class="muted">${esc(o.shipTo)}</div>` : ''}${o.trackingNumber ? `<div>${esc(o.carrier ?? '')} ${esc(o.trackingNumber)}</div>` : ''}${o.refundReason ? `<div class="muted">Refund: ${esc(o.refundReason)}</div>` : ''}</td>
<td>${
            o.status === 'paid'
              ? `<form method="post" action="/app/orders/${esc(o.id)}/ship" class="row" style="gap:6px"><input class="f sm" name="carrier" placeholder="Carrier (USPS)" style="width:110px"><input class="f sm" name="tracking" placeholder="Tracking no." style="width:140px"><button class="btn sm dark">Shipped</button></form>`
              : ''
          }${
            o.status === 'paid' || o.status === 'shipped'
              ? `<form method="post" action="/app/orders/${esc(o.id)}/refund" style="margin-top:6px" onsubmit="return confirm('Refund ${esc(fmt(o.totalCents, o.currency))} to the buyer\\'s PayPal?')"><button class="btn sm danger">Refund</button></form>`
              : o.status === 'created'
                ? `<form method="post" action="/app/orders/${esc(o.id)}/sync"><button class="btn sm">Check PayPal</button></form>`
                : ''
          }</td></tr>`,
        )
        .join('')
    : `<tr><td colspan="7"><p class="empty">No orders yet.</p></td></tr>`;
  return appPage(
    'Orders',
    c,
    `<div class="head rise"><div><h1>Orders</h1><p class="sub">Every order is a PayPal order in your account. Tracking numbers you add here go to PayPal and the buyer.</p></div></div>
<div class="card" style="overflow-x:auto"><table><thead><tr><th>Order</th><th>Items</th><th class="r">Total</th><th>From</th><th>Status</th><th>Buyer</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`,
  );
}

export function settingsPage(c: AppChrome, v: { publicUrl: string; webhook: boolean; mode: 'app' | 'payee' | 'demo' | null }): string {
  const s = c.shop;
  const connected = Boolean(s.paypalClientId);
  return appPage(
    'Settings',
    c,
    `<div class="head rise"><div><h1>Settings</h1></div></div>
<form class="card" method="post" action="/app/settings"><h2>Your store</h2>
<div class="grid2"><div class="fld"><label class="f">Store name</label><input class="f" name="name" required value="${esc(s.name)}"></div><div class="fld"><label class="f">Address: ${esc(v.publicUrl)}/s/…</label><input class="f" name="slug" required value="${esc(s.slug)}"></div></div>
<div class="fld"><label class="f">Tagline: what you sell, in one line</label><input class="f" name="tagline" value="${esc(s.tagline)}"></div>
<div class="fld"><label class="f">About your store: policies, shipping, materials, who your products suit. The agent quotes this; anything you leave out it says it doesn't know.</label><textarea class="f" name="about" style="min-height:160px">${esc(s.about)}</textarea></div>
<div class="grid2"><div class="fld"><label class="f">Refund window (days, automatic for shoppers' agents)</label><input class="f" name="refund_days" inputmode="numeric" value="${s.refundDays}"></div><div class="fld"><label class="f">Currency</label><input class="f" name="currency" maxlength="3" value="${esc(s.currency)}"></div></div>
<div class="fld"><label class="row small"><input type="checkbox" name="listed" ${s.listed ? 'checked' : ''}> List my store in the public Open Shelf directory (${esc(v.publicUrl)}/mcp)</label></div>
<button class="btn dark" style="margin-top:16px">Save</button></form>
<form class="card" method="post" action="/app/payee"><div class="cardhead"><h2>Get paid</h2>${v.mode === 'payee' ? chip('receiving payments') : v.mode === 'app' ? chip('via your PayPal app') : s.demo ? chip('demo sandbox') : chip('not connected')}</div>
<p class="small muted" style="margin-top:0">${
    v.mode === 'app'
      ? 'Orders are taken by your connected PayPal app below, so refunds and tracking also run through Open Shelf.'
      : `Payments from shoppers and their agents go straight into this PayPal account${s.paypalPayeeEmail ? '' : ' (logging in with PayPal fills this in)'}. Refunds and tracking are then done in your own PayPal. Connect a PayPal app below for imports, automatic refunds and tracking.`
  }</p>
<div class="row"><input class="f" name="email" type="email" placeholder="you@yourpaypal.com" value="${esc(s.paypalPayeeEmail ?? '')}" style="flex:1;min-width:220px" ${v.mode === 'app' ? 'disabled' : ''}><button class="btn dark" ${v.mode === 'app' ? 'disabled' : ''}>Save</button></div></form>
<form class="card" method="post" action="/app/paypal"><div class="cardhead"><h2>Connect a PayPal app <span class="small muted">(optional, for power features)</span></h2>${connected ? chip('connected') : chip('not connected')}</div>
<p class="small muted" style="margin-top:0">With your own PayPal app connected, Open Shelf can import your payment links and invoices, refund automatically within your policy, and send tracking numbers to PayPal. Create an app at developer.paypal.com → Apps &amp; Credentials and paste its client id and secret. To import payment links, tick "Payment Links and Buttons" under the app's Features.${connected ? ` Connected app: <code>${esc(s.paypalClientId?.slice(0, 10))}…</code> (${esc(s.paypalEnv)}), webhooks ${v.webhook ? 'on' : 'off: orders complete when the buyer returns from PayPal'}.` : ''}</p>
<div class="grid2"><div class="fld"><label class="f">Environment</label><select class="f" name="env"><option value="sandbox" ${s.paypalEnv === 'sandbox' ? 'selected' : ''}>Sandbox</option><option value="live" ${s.paypalEnv === 'live' ? 'selected' : ''}>Live</option></select></div><div class="fld"><label class="f">Client id</label><input class="f" name="client_id" required autocomplete="off" value="${esc(s.paypalClientId ?? '')}"></div></div>
<div class="fld"><label class="f">Secret</label><input class="f" name="client_secret" type="password" required autocomplete="off" placeholder="${connected ? '•••••••• (paste again to change)' : ''}"></div>
<button class="btn dark" style="margin-top:16px">${connected ? 'Update PayPal' : 'Connect PayPal'}</button></form>`,
  );
}

/** "Size: 50 ml=24.00 | 100 ml" lines ↔ variants. */
export function variantText(vs: Variant[], currency?: string): string {
  return vs
    .map(
      (v) =>
        `${v.name}: ${v.options.map((o) => (o.price_cents !== undefined ? `${o.label}=${currency ? fmt(o.price_cents, currency) : (o.price_cents / 100).toFixed(2)}` : o.label)).join(' | ')}`,
    )
    .join('\n');
}

export function parseVariantText(text: string): Variant[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const i = line.indexOf(':');
      return {
        name: line.slice(0, i).trim(),
        options: line
          .slice(i + 1)
          .split('|')
          .map((o) => o.trim())
          .filter(Boolean)
          .map((o) => {
            const [label, price] = o.split('=').map((x) => x.trim());
            const cents = price ? Math.round(Number.parseFloat(price.replace(/[^0-9.]/g, '')) * 100) : Number.NaN;
            return Number.isFinite(cents) ? { label, price_cents: cents } : { label };
          }),
      };
    });
}

// ---- the public store page ----------------------------------------------------------------

export function storefrontPage(shop: Shop, products: Product[], v: { publicUrl: string; canBuy: boolean; demo: boolean; error?: string }): string {
  const cards = products
    .map((p) => {
      const opts = p.variants
        .map(
          (vr) =>
            `<select class="f sm" name="opt:${esc(vr.name)}" aria-label="${esc(vr.name)}">${vr.options.map((o) => `<option value="${esc(o.label)}">${esc(vr.name)}: ${esc(o.label)}${o.price_cents !== undefined ? ` · ${esc(fmt(o.price_cents, shop.currency))}` : ''}</option>`).join('')}</select>`,
        )
        .join('');
      const soldOut = p.stock === 0;
      return `<article class="prod" id="${esc(p.id)}"><div class="img"${tint(p)}>${thumb(p)}</div><div class="body"><div class="row" style="justify-content:space-between;align-items:baseline"><h3>${esc(p.name)}</h3><span class="price">${esc(fmt(p.priceCents, shop.currency))}</span></div>
<p class="desc">${esc(p.description)}</p>${p.stock !== null && p.stock > 0 && p.stock <= 10 ? `<span class="small" style="color:var(--amber)">Only ${p.stock} left</span>` : ''}
<form method="post" action="/s/${esc(shop.slug)}/buy"><input type="hidden" name="product_id" value="${esc(p.id)}">${opts}
<div class="row" style="gap:6px"><input class="f sm" name="quantity" type="number" min="1" max="99" value="1" style="width:70px" aria-label="Quantity"><button class="btn dark sm" style="flex:1" ${soldOut || !v.canBuy ? 'disabled' : ''}>${soldOut ? 'Sold out' : 'Buy with PayPal'}</button></div>
<button type="button" class="btn sm" onclick="askAbout(${esc(js(p.id))},${esc(js(p.name))})">Ask about this</button></form></div></article>`;
    })
    .join('');
  return layout(
    `${shop.name}`,
    `<nav class="app"><span class="logo"><span class="mk">${esc(shop.name.charAt(0))}</span>${esc(shop.name)}</span><div class="right"><span class="small muted">on <a href="/">Open Shelf</a></span></div></nav>
${flash(undefined, v.error)}
<div class="head rise"><div><h1>${esc(shop.name)}</h1><p class="sub">${esc(shop.tagline)}</p></div></div>
${v.demo ? `<div class="note small">Demo store on the PayPal sandbox: nothing real is charged. At checkout, use a <a href="https://developer.paypal.com/dashboard/accounts" target="_blank">sandbox personal account</a>, or choose "Pay with debit or credit card" and use a <a href="https://developer.paypal.com/tools/sandbox/card-testing/" target="_blank">test card</a>.</div>` : ''}
<div class="card"><div class="cardhead"><h2>Ask the store</h2><span class="small muted">Answers come from what ${esc(shop.name)} has published. AI agents get the same answers.</span></div>
<div class="chat" id="chat"></div><form class="row" onsubmit="ask(event)"><input class="f" id="q" placeholder="e.g. Which moisturizer is best for oily skin? Does it have fragrance?" style="flex:1;min-width:220px" autocomplete="off"><button class="btn dark" id="askBtn">Ask</button></form></div>
<div class="grid">${cards || '<p class="empty">No products yet.</p>'}</div>
<div class="agentbox"><div class="mono">Shopping with an AI agent?</div><p style="margin:6px 0 10px">Add this store to Claude, ChatGPT or any MCP client. Your agent can ask the store questions and buy for you, and you approve every payment in PayPal.</p><code>${esc(v.publicUrl)}/s/${esc(shop.slug)}/mcp</code></div>`,
    {
      description: shop.tagline,
      script: `var SLUG=${js(shop.slug)},FOCUS=null;${POST_JS}
function bubble(cls,html){var c=document.getElementById('chat');var d=document.createElement('div');d.className='bubble '+cls;d.innerHTML=html;c.appendChild(d);c.scrollTop=c.scrollHeight;return d}
function e(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function askAbout(id,name){FOCUS=id;var q=document.getElementById('q');q.placeholder='Ask about '+name+'…';q.focus();window.scrollTo({top:0,behavior:'smooth'})}
function ask(ev){ev.preventDefault();var q=document.getElementById('q');var text=q.value.trim();if(!text)return;q.value='';bubble('me',e(text));var wait=bubble('them','…');var b=document.getElementById('askBtn');b.disabled=true;
post('/s/'+SLUG+'/ask',{question:text,product_id:FOCUS}).then(function(r){b.disabled=false;if(!r.ok){wait.textContent=r.j.error||'Something went wrong';return}
var h=e(r.j.answer);if(r.j.recommended&&r.j.recommended.length){h+='<div class="recs">'+r.j.recommended.map(function(p){return '<a class="chip" href="#'+e(p.product_id)+'">'+e(p.name)+' · '+e(p.price)+'</a>'}).join('')+'</div>'}
if(!r.j.answered)h+='<div class="small muted" style="margin-top:6px">Passed to the shop owner.</div>';wait.innerHTML=h}).catch(function(){b.disabled=false;wait.textContent='Could not reach the store'})}`,
    },
  );
}

export function checkoutResultPage(shop: Shop | null, o: Order | null, kind: 'paid' | 'pending' | 'cancelled'): string {
  const title = kind === 'paid' ? 'Thank you, you are all set.' : kind === 'pending' ? 'Almost there.' : 'Checkout cancelled.';
  const body =
    kind === 'paid' && o
      ? `<p class="sub" style="margin:0 auto">${esc(shop?.name ?? 'The store')} has your order <b>${esc(o.id)}</b> for <b>${esc(fmt(o.totalCents, o.currency))}</b>, paid with PayPal. If an AI agent placed it, you can go back to it now; it can check the order and tracking for you.</p>`
      : kind === 'pending'
        ? `<p class="sub" style="margin:0 auto">PayPal hasn't confirmed the payment yet. Give it a minute, or ask your agent to check order <b>${esc(o?.id ?? '')}</b>.</p>`
        : `<p class="sub" style="margin:0 auto">Nothing was charged. You can close this tab.</p>`;
  return layout(
    title,
    `<div class="auth" style="max-width:560px;text-align:center"><div class="rise" style="font-size:44px">${kind === 'paid' ? '✓' : kind === 'pending' ? '…' : '×'}</div><h1 class="rise" style="text-align:center">${title}</h1><div class="rise" style="--d:.1s;margin-top:12px">${body}</div>
${shop ? `<p style="margin-top:22px"><a class="btn" href="/s/${esc(shop.slug)}">Back to ${esc(shop.name)}</a></p>` : ''}</div>`,
  );
}
