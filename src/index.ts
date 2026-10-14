import { Hono, type Context } from 'hono';
import { brandOf, describe, getProduct, mainImage, marketOf, searchProducts } from './channel3';
import { askStore, extractProducts, productsFromUrl, shopContext, type DraftProduct } from './agent';
import { getAuth, paypalLoginEnabled, sessionUser, type SessionUser } from './auth';
import type { Env } from './env';
import { INSTRUCTIONS, registerTools } from './mcp';
import {
  catalogPage,
  checkoutResultPage,
  matchPage,
  errorPage,
  landingPage,
  loginPage,
  overviewPage,
  ordersPage,
  parseVariantText,
  productEditPage,
  productsPage,
  questionsPage,
  settingsPage,
  type AppChrome,
} from './pages';
import { toCents } from './paypal';
import { storefrontPage } from './storefront';
import { DEMO_SHOP, ensureShowcase, seedShop } from './seed';
import { fmt, Store, UserError, type Shop } from './store';

type Vars = { user: SessionUser; shop: Shop };
type C = Context<{ Bindings: Env; Variables: Vars }>;
const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/healthz', (c) => c.text('ok'));
app.on(['GET', 'POST'], '/api/auth/*', (c) => getAuth(c.env).handler(c.req.raw));

app.get('/', async (c) => ((await sessionUser(c.env, c.req.raw.headers)) ? c.redirect('/app') : c.html(landingPage(c.env.PUBLIC_URL))));
app.get('/login', (c) => {
  const next = c.req.query('next');
  return c.html(loginPage({ paypal: paypalLoginEnabled(c.env), error: c.req.query('error'), next: next?.startsWith('/') ? next : '/app' }));
});

/** Store-agent questions and AI imports cost model tokens, so each caller gets a budget. */
async function overLimit(c: C, what: string): Promise<boolean> {
  if (!c.env.ASK_LIMIT) return false;
  const key = `${what}:${c.req.header('cf-connecting-ip') ?? 'local'}`;
  return !(await c.env.ASK_LIMIT.limit({ key })).success;
}

// ---- MCP: the directory (/mcp) and one endpoint per store (/s/:slug/mcp). Public: paying needs the buyer's PayPal approval.

async function serveMcp(c: C, scope: Shop | null): Promise<Response> {
  // Loaded here, not at the top: bundled next to better-auth, the SDK's zod schemas evaluate before zod's classes exist.
  const [{ McpServer }, { WebStandardStreamableHTTPServerTransport }] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/mcp.js'),
    import('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'),
  ]);
  const server = new McpServer({ name: scope ? `openshelf-${scope.slug}` : 'openshelf', version: '0.1.0' }, { instructions: scope ? `${INSTRUCTIONS}\nThis endpoint is ${scope.name}'s store only.` : INSTRUCTIONS });
  registerTools(server, c.env, scope);
  // Stateless: a Worker request may land on any isolate, so no session ids.
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
}

app.all('/mcp', async (c) => {
  await ensureShowcase(c.env);
  return serveMcp(c, null);
});
app.all('/s/:slug/mcp', async (c) => {
  const shop = await new Store(c.env).shopBySlug(c.req.param('slug'));
  return shop ? serveMcp(c, shop) : c.json({ error: 'No such store' }, 404);
});

// ---- the public store page: the same catalog and the same store agent, for people ----------------

app.get('/s/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (slug === 'dewdrop') await ensureShowcase(c.env);
  const store = new Store(c.env);
  const shop = await store.shopBySlug(slug);
  if (!shop) return c.html(errorPage('There is no store at this address.'), 404);
  const [products, pp] = await Promise.all([store.products(shop.id), store.paypalFor(shop)]);
  return c.html(storefrontPage(shop, products, { publicUrl: c.env.PUBLIC_URL, canBuy: Boolean(pp), demo: shop.demo || shop.paypalEnv === 'sandbox', error: c.req.query('e') }));
});

app.post('/s/:slug/buy', async (c) => {
  const store = new Store(c.env);
  const shop = await store.shopBySlug(c.req.param('slug'));
  if (!shop) return c.html(errorPage('There is no store at this address.'), 404);
  const form = await c.req.parseBody();
  const options = Object.fromEntries(Object.entries(form).filter(([k]) => k.startsWith('opt:')).map(([k, v]) => [k.slice(4), String(v)]));
  try {
    const order = await store.checkout(shop, [{ productId: String(form.product_id ?? ''), options, quantity: Number(form.quantity ?? 1) }], 'web');
    return c.redirect(order.approveUrl, 303);
  } catch (e) {
    if (e instanceof UserError) return c.redirect(`/s/${shop.slug}?e=${encodeURIComponent(e.message)}`, 303);
    throw e;
  }
});

app.post('/s/:slug/ask', async (c) => {
  const store = new Store(c.env);
  const shop = await store.shopBySlug(c.req.param('slug'));
  if (!shop) return c.json({ error: 'No such store' }, 404);
  if (await overLimit(c, 'ask')) return c.json({ error: 'Too many questions at once; try again in a minute.' }, 429);
  const body = (await c.req.json().catch(() => ({}))) as { question?: string; product_id?: string | null };
  const question = String(body.question ?? '').trim().slice(0, 1000);
  if (!question) return c.json({ error: 'Ask a question' }, 400);
  const [products, knowledge] = await Promise.all([store.products(shop.id), store.knowledge(shop.id)]);
  const product = body.product_id ? (products.find((p) => p.id === body.product_id) ?? null) : null;
  const out = await askStore(c.env, shopContext(shop, products, knowledge), question, product);
  await store.recordQuestion({ shopId: shop.id, productId: product?.id, question, answer: out.answer, answered: out.answered, asker: 'human' });
  return c.json({
    answer: out.answer,
    answered: out.answered,
    recommended: products.filter((p) => out.product_ids.includes(p.id)).map((p) => ({ product_id: p.id, name: p.name, price: fmt(p.priceCents, shop.currency) })),
  });
});

/** The catalog for crawlers and agents that read rather than call tools. */
app.get('/s/:slug/llms.txt', async (c) => {
  const store = new Store(c.env);
  const shop = await store.shopBySlug(c.req.param('slug'));
  if (!shop) return c.text('No such store', 404);
  const [products, knowledge] = await Promise.all([store.products(shop.id), store.knowledge(shop.id)]);
  return c.text(
    `# ${shop.name}\n\n> ${shop.tagline}\n\nAI agents: connect the MCP server at ${c.env.PUBLIC_URL}/s/${shop.slug}/mcp to ask this store questions (ask_store) and buy (buy → PayPal approval link).\n\n${shopContext(shop, products, knowledge)}\n`,
  );
});

// ---- returning from PayPal ------------------------------------------------------------------------

app.get('/checkout/return', async (c) => {
  const store = new Store(c.env);
  const found = await store.order(c.req.query('o') ?? c.req.query('token') ?? '');
  const shop = found ? await store.shopById(found.shopId) : null;
  if (!found || !shop) return c.html(checkoutResultPage(null, null, 'pending'));
  const order = await store.sync(shop, found);
  return c.html(checkoutResultPage(shop, order, order.status === 'created' ? 'pending' : 'paid'));
});

app.get('/checkout/cancel', async (c) => {
  const store = new Store(c.env);
  const order = await store.order(c.req.query('o') ?? '');
  if (order) await store.markCancelled(order.id);
  return c.html(checkoutResultPage(order ? await store.shopById(order.shopId) : null, order, 'cancelled'));
});

// ---- PayPal webhooks: completes sales whose buyer never came back to the return page ------------------

// /webhooks/paypal/demo = the demo app's webhook; /webhooks/paypal/app = every merchant app's webhook.
app.post('/webhooks/paypal/:hook', async (c) => {
  const raw = await c.req.text();
  const event = JSON.parse(raw) as { event_type?: string; resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } } };
  const orderId = event.event_type === 'CHECKOUT.ORDER.APPROVED' ? event.resource?.id : event.resource?.supplementary_data?.related_ids?.order_id;
  const store = new Store(c.env);
  const order = orderId ? await store.order(orderId) : null;
  const shop = order ? await store.shopById(order.shopId) : null;
  // Not ours (Penny or another app on the same PayPal app): acknowledge so PayPal stops retrying.
  if (!order || !shop) return c.json({ ok: true, ignored: true });
  // Verify with the webhook id of the URL PayPal called: an app connected to both carries two webhooks.
  const pp = c.req.param('hook') === 'demo' ? store.demoPayPal() : await store.paypalFor(shop);
  if (c.env.WEBHOOK_VERIFY !== 'off' && !(pp && (await pp.verifyWebhook(c.req.raw.headers, raw)))) return c.json({ error: 'bad signature' }, 401);
  if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') await store.markRefunded(order.id, null);
  else await store.sync(shop, order);
  return c.json({ ok: true });
});

// ---- the merchant app ------------------------------------------------------------------------------

const requireShop = async (c: C, next: () => Promise<void>) => {
  const user = await sessionUser(c.env, c.req.raw.headers);
  if (!user) return c.redirect(`/login?next=${encodeURIComponent(c.req.path)}`);
  const store = new Store(c.env);
  let shop = await store.shopForUser(user.id);
  if (!shop) {
    if (user.isAnonymous) {
      shop = await store.createShop(user.id, DEMO_SHOP.name, { demo: true, tagline: DEMO_SHOP.tagline, about: DEMO_SHOP.about });
      await seedShop(store, shop);
    } else {
      shop = await store.createShop(user.id, user.name?.trim() ? `${user.name.trim()}'s shop` : `${user.email.split('@')[0]}'s shop`);
    }
  }
  // Logged in with PayPal and nothing connected yet: sell straight into that PayPal account.
  if (!store.paymentMode(shop) && !user.isAnonymous) {
    const viaPayPal = await c.env.DB.prepare("SELECT 1 FROM account WHERE userId = ? AND providerId = 'paypal'").bind(user.id).first();
    if (viaPayPal) {
      await store.setPayee(shop, user.email);
      shop = (await store.shopById(shop.id)) as Shop;
    }
  }
  c.set('user', user);
  c.set('shop', shop);
  return next();
};

const NEEDS_APP = 'Importing reads your own PayPal data, which needs your PayPal app connected (Settings → Connect a PayPal app). Payments already go to your PayPal without it.';
app.use('/app', requireShop);
app.use('/app/*', requireShop);

async function chrome(c: C, active: AppChrome['active']): Promise<AppChrome> {
  const shop = c.get('shop');
  const store = new Store(c.env);
  const [qs, pp] = await Promise.all([store.questions(shop.id, 500), store.paypalFor(shop)]);
  return {
    shop,
    active,
    unanswered: qs.filter((q) => !q.answered && !q.merchantAnswer).length,
    canTakePayments: Boolean(pp),
    isDemoUser: c.get('user').isAnonymous,
    note: c.req.query('n'),
    error: c.req.query('e'),
  };
}

const back = (c: C, path: string, note?: string, error?: string) =>
  c.redirect(`${path}${note ? `?n=${encodeURIComponent(note)}` : error ? `?e=${encodeURIComponent(error)}` : ''}`, 303);

app.get('/app', async (c) => {
  const shop = c.get('shop');
  const store = new Store(c.env);
  const [products, questions, orders, ch] = await Promise.all([store.products(shop.id), store.questions(shop.id, 500), store.orders(shop.id, 500), chrome(c, 'overview')]);
  const paid = orders.filter((o) => o.status === 'paid' || o.status === 'shipped');
  const feed = [...questions.slice(0, 15).map((q) => ({ kind: 'question' as const, q, at: q.createdAt })), ...orders.slice(0, 15).map((o) => ({ kind: 'order' as const, o, at: o.createdAt }))]
    .sort((a, b) => b.at - a.at)
    .slice(0, 15);
  return c.html(
    overviewPage(ch, {
      products: products.length,
      questionsAsked: questions.length,
      agentOrders: paid.filter((o) => o.channel === 'agent').length,
      revenueCents: paid.reduce((s, o) => s + o.totalCents, 0),
      feed,
      publicUrl: c.env.PUBLIC_URL,
    }),
  );
});

app.get('/app/products', async (c) => c.html(productsPage(await chrome(c, 'products'), await new Store(c.env).products(c.get('shop').id, { includeInactive: true }))));

app.get('/app/products/:id', async (c) => {
  const id = c.req.param('id');
  const p = id === 'new' ? null : await new Store(c.env).product(id);
  if (id !== 'new' && (!p || p.shopId !== c.get('shop').id)) return back(c, '/app/products', undefined, 'No such product');
  return c.html(productEditPage(await chrome(c, 'products'), p));
});

app.post('/app/products/:id', async (c) => {
  const shop = c.get('shop');
  const store = new Store(c.env);
  const id = c.req.param('id');
  const prev = id === 'new' ? null : await store.product(id);
  if (id !== 'new' && (!prev || prev.shopId !== shop.id)) return back(c, '/app/products', undefined, 'No such product');
  const f = await c.req.parseBody();
  const stockText = String(f.stock ?? '').trim();
  const saved = await store.saveProduct(shop.id, {
    ...(prev ?? {}),
    id: prev?.id,
    name: String(f.name ?? ''),
    priceCents: toCents(String(f.price ?? '0')),
    description: String(f.description ?? ''),
    imageUrl: String(f.image_url ?? '').trim() || null,
    stock: stockText === '' ? null : Math.max(0, Number.parseInt(stockText, 10) || 0),
    variants: parseVariantText(String(f.variants ?? '')),
    active: f.active === 'on',
    needsShipping: f.ships === 'on',
  });
  return back(c, '/app/products', `Saved ${saved.name}.`);
});

app.post('/app/products/:id/delete', async (c) => {
  await new Store(c.env).deleteProduct(c.get('shop').id, c.req.param('id'));
  return back(c, '/app/products', 'Deleted.');
});

app.post('/app/import/paypal', async (c) => {
  const shop = c.get('shop');
  const store = new Store(c.env);
  const pp = await store.ownPayPalFor(shop);
  if (!pp) return back(c, '/app/products', undefined, store.paymentMode(shop) === 'payee' ? NEEDS_APP : 'Connect PayPal in Settings first.');
  try {
    const links = await pp.listPayLinks();
    if (!links.length) return back(c, '/app/products', 'No payment links in this PayPal account yet. Create one in PayPal, or import from a website or text.');
    const r = await store.importPayLinks(shop, links);
    return back(c, '/app/products', `Imported ${r.added} new and updated ${r.updated} products from your PayPal payment links.`);
  } catch (e) {
    return back(c, '/app/products', undefined, e instanceof Error ? e.message : String(e));
  }
});

async function saveDrafts(store: Store, shopId: string, drafts: DraftProduct[], source: string): Promise<number> {
  for (const d of drafts) await store.saveProduct(shopId, { ...d, source });
  return drafts.length;
}

app.post('/app/import/url', async (c) => {
  if (await overLimit(c, 'import')) return back(c, '/app/products', undefined, 'Too many imports at once; try again in a minute.');
  const f = await c.req.parseBody();
  try {
    const { products, via } = await productsFromUrl(c.env, String(f.url ?? ''));
    if (!products.length) return back(c, '/app/products', undefined, 'No products with prices found on that page. Try a product or collection page, or paste the list as text.');
    const n = await saveDrafts(new Store(c.env), c.get('shop').id, products, via === 'shopify' ? 'shopify' : 'import');
    return back(c, '/app/products', via === 'shopify' ? `Converted ${n} products from the Shopify store.` : `Claude read the page and added ${n} products. Check prices and descriptions below.`);
  } catch (e) {
    return back(c, '/app/products', undefined, `Could not import that page: ${e instanceof Error ? e.message : String(e)}`);
  }
});

/** Service businesses rarely have payment links, but their PayPal invoices list what they sell. */
app.post('/app/import/invoices', async (c) => {
  if (await overLimit(c, 'import')) return back(c, '/app/products', undefined, 'Too many imports at once; try again in a minute.');
  const shop = c.get('shop');
  const store = new Store(c.env);
  const pp = await store.ownPayPalFor(shop);
  if (!pp) return back(c, '/app/products', undefined, store.paymentMode(shop) === 'payee' ? NEEDS_APP : 'Connect PayPal in Settings first.');
  try {
    const lines = await pp.invoiceLines();
    if (!lines.length) return back(c, '/app/products', 'No invoices in this PayPal account yet.');
    const drafts = await extractProducts(c.env, `PayPal invoices of ${shop.name}, newest first:\n${lines.join('\n')}`);
    if (!drafts.length) return back(c, '/app/products', undefined, 'Claude found nothing sellable in those invoices.');
    const n = await saveDrafts(store, shop.id, drafts, 'invoices');
    return back(c, '/app/products', `Claude read ${lines.length} invoice lines and made ${n} offerings. Check prices and descriptions below.`);
  } catch (e) {
    return back(c, '/app/products', undefined, e instanceof Error ? e.message : String(e));
  }
});

app.post('/app/import/text', async (c) => {
  if (await overLimit(c, 'import')) return back(c, '/app/products', undefined, 'Too many imports at once; try again in a minute.');
  const f = await c.req.parseBody();
  const drafts = await extractProducts(c.env, String(f.text ?? ''));
  if (!drafts.length) return back(c, '/app/products', undefined, 'No products with prices found in that text.');
  const n = await saveDrafts(new Store(c.env), c.get('shop').id, drafts, 'import');
  return back(c, '/app/products', `Claude added ${n} products. Check them below.`);
});

/** The other direction: products made here become PayPal payment links the merchant can share anywhere. */
app.post('/app/publish', async (c) => {
  const shop = c.get('shop');
  const store = new Store(c.env);
  const pp = await store.ownPayPalFor(shop);
  if (!pp) return back(c, '/app/products', undefined, store.paymentMode(shop) === 'payee' ? NEEDS_APP : 'Connect PayPal in Settings first.');
  const todo = (await store.products(shop.id)).filter((p) => !p.paypalLinkId).slice(0, 20);
  let made = 0;
  try {
    for (const p of todo) {
      const link = await pp.createPayLink({ name: p.name, description: p.description, priceCents: p.priceCents, currency: shop.currency, returnUrl: `${c.env.PUBLIC_URL}/s/${shop.slug}`, ships: p.needsShipping });
      await store.saveProduct(shop.id, { ...p, paypalLinkId: link.id, paypalLinkUrl: link.url });
      made++;
    }
  } catch (e) {
    return back(c, '/app/products', undefined, `${made ? `Created ${made} links, then: ` : ''}${e instanceof Error ? e.message : String(e)}`);
  }
  return back(c, '/app/products', `Created ${made} PayPal payment links.`);
});

// ---- Channel3: fill the catalog from the product graph, and price-check against other retailers ----------

app.get('/app/catalog', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (!q) return c.html(catalogPage(await chrome(c, 'products'), '', []));
  if (await overLimit(c, 'channel3')) return c.html(catalogPage(await chrome(c, 'products'), q, [], 'Too many searches at once; try again in a minute.'));
  try {
    return c.html(catalogPage(await chrome(c, 'products'), q, await searchProducts(c.env, q, 12)));
  } catch (e) {
    return c.html(catalogPage(await chrome(c, 'products'), q, [], e instanceof Error ? e.message : String(e)));
  }
});

app.post('/app/catalog/add', async (c) => {
  const shop = c.get('shop');
  const f = await c.req.parseBody();
  const found = await getProduct(c.env, String(f.id ?? ''));
  if (!found) return back(c, '/app/catalog', undefined, 'That product is no longer in the catalog.');
  const market = marketOf(found, shop.currency);
  const brand = brandOf(found);
  const saved = await new Store(c.env).saveProduct(shop.id, {
    // "Clinique Oil-Free Gel Moisturizer", not just "Oil-Free Gel Moisturizer": shoppers' agents search by brand.
    name: brand && !found.title.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${found.title}` : found.title,
    description: describe(found),
    // Starts at the lowest price elsewhere; the merchant sets their own on the next screen.
    priceCents: market?.minCents ?? 0,
    imageUrl: mainImage(found),
    source: 'channel3',
    channel3Id: found.id,
    market,
    active: Boolean(market),
  });
  return back(c, `/app/products/${saved.id}`, market ? `Added. It sells for ${market.minCents === market.maxCents ? fmt(market.minCents, shop.currency) : `${fmt(market.minCents, shop.currency)}–${fmt(market.maxCents, shop.currency)}`} elsewhere; set your price and stock, then save.` : 'Added but hidden: no live price elsewhere, so set your price and tick "On the shelf".');
});

app.get('/app/products/:id/match', async (c) => {
  const p = await new Store(c.env).product(c.req.param('id'));
  if (!p || p.shopId !== c.get('shop').id) return back(c, '/app/products', undefined, 'No such product');
  if (await overLimit(c, 'channel3')) return c.html(matchPage(await chrome(c, 'products'), p, [], 'Too many searches at once; try again in a minute.'));
  try {
    return c.html(matchPage(await chrome(c, 'products'), p, await searchProducts(c.env, c.req.query('q')?.trim() || p.name, 8)));
  } catch (e) {
    return c.html(matchPage(await chrome(c, 'products'), p, [], e instanceof Error ? e.message : String(e)));
  }
});

app.post('/app/products/:id/match', async (c) => {
  const shop = c.get('shop');
  const store = new Store(c.env);
  const p = await store.product(c.req.param('id'));
  if (!p || p.shopId !== shop.id) return back(c, '/app/products', undefined, 'No such product');
  const f = await c.req.parseBody();
  const found = await getProduct(c.env, String(f.id ?? ''));
  if (!found) return back(c, `/app/products/${p.id}`, undefined, 'That product is no longer in the catalog.');
  // The merchant's own words win: details only fill a thin description, the photo only a missing one.
  await store.saveProduct(shop.id, {
    ...p,
    imageUrl: p.imageUrl || mainImage(found),
    description: p.description.length >= 160 ? p.description : [p.description, describe(found)].filter(Boolean).join('\n\n'),
    channel3Id: found.id,
    market: marketOf(found, shop.currency),
  });
  return back(c, `/app/products/${p.id}`, 'Matched on Channel3: photo and details filled in, market price tracked.');
});

app.get('/app/questions', async (c) => c.html(questionsPage(await chrome(c, 'questions'), await new Store(c.env).questions(c.get('shop').id, 300))));

app.post('/app/questions/:id', async (c) => {
  const f = await c.req.parseBody();
  const answer = String(f.answer ?? '').trim();
  if (answer) await new Store(c.env).answerQuestion(c.get('shop').id, c.req.param('id'), answer);
  return back(c, '/app/questions', 'Saved. Your store agent will use this answer from now on.');
});

app.get('/app/orders', async (c) => c.html(ordersPage(await chrome(c, 'orders'), await new Store(c.env).orders(c.get('shop').id, 300))));

async function ownOrder(c: C) {
  const store = new Store(c.env);
  const order = await store.order(c.req.param('id') ?? '');
  return order && order.shopId === c.get('shop').id ? { store, order } : null;
}

app.post('/app/orders/:id/ship', async (c) => {
  const found = await ownOrder(c);
  if (!found) return back(c, '/app/orders', undefined, 'No such order');
  const f = await c.req.parseBody();
  const problem = await found.store.markShipped(c.get('shop'), found.order, String(f.carrier ?? '').trim(), String(f.tracking ?? '').trim());
  return problem ? back(c, '/app/orders', undefined, problem) : back(c, '/app/orders', 'Marked shipped; the tracking number was sent to PayPal.');
});

app.post('/app/orders/:id/refund', async (c) => {
  const found = await ownOrder(c);
  if (!found) return back(c, '/app/orders', undefined, 'No such order');
  const d = await found.store.refund(c.get('shop'), found.order, 'Refunded by the store', 'merchant');
  return d.allowed ? back(c, '/app/orders', 'Refunded to the buyer’s PayPal.') : back(c, '/app/orders', undefined, d.reason);
});

app.post('/app/orders/:id/sync', async (c) => {
  const found = await ownOrder(c);
  if (!found) return back(c, '/app/orders', undefined, 'No such order');
  const o = await found.store.sync(c.get('shop'), found.order);
  return back(c, '/app/orders', o.status === 'created' ? 'Still waiting for the buyer to approve in PayPal.' : `Order is ${o.status}.`);
});

app.get('/app/settings', async (c) =>
  c.html(settingsPage(await chrome(c, 'settings'), { publicUrl: c.env.PUBLIC_URL, webhook: Boolean(c.get('shop').paypalWebhookId), mode: new Store(c.env).paymentMode(c.get('shop')) })),
);

app.post('/app/payee', async (c) => {
  const f = await c.req.parseBody();
  const email = String(f.email ?? '').trim().toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return back(c, '/app/settings', undefined, 'That is not an email address.');
  await new Store(c.env).setPayee(c.get('shop'), email || null);
  return back(c, '/app/settings', email ? `Payments now go to the PayPal account ${email}.` : 'Stopped receiving payments by email.');
});

app.post('/app/settings', async (c) => {
  const f = await c.req.parseBody();
  const problem = await new Store(c.env).updateShop(c.get('shop'), {
    name: String(f.name ?? ''),
    slug: String(f.slug ?? ''),
    tagline: String(f.tagline ?? '').trim(),
    about: String(f.about ?? '').trim(),
    refundDays: Number.parseInt(String(f.refund_days ?? '30'), 10) || 0,
    currency: String(f.currency ?? 'USD'),
    // The public directory is for real merchants; demo shops stay unlisted.
    listed: f.listed === 'on' && !c.get('user').isAnonymous,
  });
  return problem ? back(c, '/app/settings', undefined, problem) : back(c, '/app/settings', 'Saved.');
});

app.post('/app/paypal', async (c) => {
  const f = await c.req.parseBody();
  const clientId = String(f.client_id ?? '').trim();
  const clientSecret = String(f.client_secret ?? '').trim();
  if (!clientId || !clientSecret) return back(c, '/app/settings', undefined, 'Paste both the client id and the secret.');
  try {
    const notes = await new Store(c.env).connectPayPal(c.get('shop'), { env: f.env === 'live' ? 'live' : 'sandbox', clientId, clientSecret });
    return back(c, '/app/settings', ['PayPal connected. Agents can buy from your store now.', ...notes].join(' '));
  } catch (e) {
    return back(c, '/app/settings', undefined, e instanceof Error ? e.message : String(e));
  }
});

app.onError((err, c) => {
  console.error('request_failed', { path: c.req.path, error: err.message });
  const wantsJson = c.req.path.endsWith('/ask') || c.req.path.endsWith('/mcp') || c.req.path.startsWith('/webhooks/');
  const status = err instanceof UserError ? 400 : 500;
  return wantsJson ? c.json({ error: err.message }, status) : c.html(errorPage(err.message), status);
});

export default app;
