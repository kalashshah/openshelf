'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { extractProducts, productsFromUrl, type DraftProduct } from '@/server/agent';
import { connectSession, createMerchant, DISTRIBUTION, domainOf, getProduct, marketOf } from '@/server/channel3';
import type { Env } from '@/server/env';
import { overLimit } from '@/server/http/mcp';
import { toCents } from '@/server/paypal';
import { requireShop } from '@/server/session';
import type { Store } from '@/server/store';
import { parseVariantText } from '@/server/variants';

/** Back to a page with a note or an error for its flash banner. */
function back(path: string, note?: string, error?: string): never {
  const q = note ? `n=${encodeURIComponent(note)}` : error ? `e=${encodeURIComponent(error)}` : '';
  redirect(q ? `${path}${path.includes('?') ? '&' : '?'}${q}` : path);
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const NEEDS_APP = 'Importing reads your own PayPal data, which needs your PayPal app connected (Settings → Connect a PayPal app). Payments already go to your PayPal without it.';

// ---- products --------------------------------------------------------------------------

export async function saveProductAction(id: string, f: FormData) {
  const { store, shop } = await requireShop();
  const prev = id === 'new' ? null : await store.product(id);
  if (id !== 'new' && (!prev || prev.shopId !== shop.id)) back('/app/products', undefined, 'No such product');
  const stockText = String(f.get('stock') ?? '').trim();
  const saved = await store.saveProduct(shop.id, {
    ...(prev ?? {}),
    id: prev?.id,
    name: String(f.get('name') ?? ''),
    priceCents: toCents(String(f.get('price') ?? '0')),
    description: String(f.get('description') ?? ''),
    imageUrl: String(f.get('image_url') ?? '').trim() || null,
    stock: stockText === '' ? null : Math.max(0, Number.parseInt(stockText, 10) || 0),
    variants: parseVariantText(String(f.get('variants') ?? '')),
    active: f.get('active') === 'on',
    needsShipping: f.get('ships') === 'on',
  });
  back('/app/products', `Saved ${saved.name}.`);
}

export async function deleteProductAction(id: string) {
  const { store, shop } = await requireShop();
  await store.deleteProduct(shop.id, id);
  back('/app/products', 'Deleted.');
}

export async function importPayLinksAction() {
  const { store, shop } = await requireShop();
  const pp = await store.ownPayPalFor(shop);
  if (!pp) back('/app/products', undefined, store.paymentMode(shop) === 'payee' ? NEEDS_APP : 'Connect PayPal in Settings first.');
  let note = '';
  let error = '';
  try {
    const links = await pp.listPayLinks();
    if (!links.length) note = 'No payment links in this PayPal account yet. Create one in PayPal, or import from a website or text.';
    else {
      const r = await store.importPayLinks(shop, links);
      note = `Imported ${r.added} new and updated ${r.updated} products from your PayPal payment links.`;
    }
  } catch (e) {
    error = msg(e);
  }
  back('/app/products', note || undefined, error || undefined);
}

async function saveDrafts(store: Store, shopId: string, drafts: DraftProduct[], source: string): Promise<number> {
  for (const d of drafts) await store.saveProduct(shopId, { ...d, source });
  return drafts.length;
}

async function limited(env: Env): Promise<boolean> {
  return overLimit(env, await headers(), 'import');
}

export async function importUrlAction(f: FormData) {
  const { env, store, shop } = await requireShop();
  if (await limited(env)) back('/app/products', undefined, 'Too many imports at once; try again in a minute.');
  let note = '';
  let error = '';
  try {
    const { products, via } = await productsFromUrl(env, String(f.get('url') ?? ''));
    if (!products.length) error = 'No products with prices found on that page. Try a product or collection page, or paste the list as text.';
    else {
      const n = await saveDrafts(store, shop.id, products, via === 'shopify' ? 'shopify' : 'import');
      note = via === 'shopify' ? `Converted ${n} products from the Shopify store.` : `Claude read the page and added ${n} products. Check prices and descriptions below.`;
    }
  } catch (e) {
    error = `Could not import that page: ${msg(e)}`;
  }
  back('/app/products', note || undefined, error || undefined);
}

/** Service businesses rarely have payment links, but their PayPal invoices list what they sell. */
export async function importInvoicesAction() {
  const { env, store, shop } = await requireShop();
  if (await limited(env)) back('/app/products', undefined, 'Too many imports at once; try again in a minute.');
  const pp = await store.ownPayPalFor(shop);
  if (!pp) back('/app/products', undefined, store.paymentMode(shop) === 'payee' ? NEEDS_APP : 'Connect PayPal in Settings first.');
  let note = '';
  let error = '';
  try {
    const lines = await pp.invoiceLines();
    if (!lines.length) note = 'No invoices in this PayPal account yet.';
    else {
      const drafts = await extractProducts(env, `PayPal invoices of ${shop.name}, newest first:\n${lines.join('\n')}`);
      if (!drafts.length) error = 'Claude found nothing sellable in those invoices.';
      else note = `Claude read ${lines.length} invoice lines and made ${await saveDrafts(store, shop.id, drafts, 'invoices')} offerings. Check prices and descriptions below.`;
    }
  } catch (e) {
    error = msg(e);
  }
  back('/app/products', note || undefined, error || undefined);
}

export async function importTextAction(f: FormData) {
  const { env, store, shop } = await requireShop();
  if (await limited(env)) back('/app/products', undefined, 'Too many imports at once; try again in a minute.');
  const drafts = await extractProducts(env, String(f.get('text') ?? ''));
  if (!drafts.length) back('/app/products', undefined, 'No products with prices found in that text.');
  back('/app/products', `Claude added ${await saveDrafts(store, shop.id, drafts, 'import')} products. Check them below.`);
}

/** The other direction: products made here become PayPal payment links the merchant can share anywhere. */
export async function publishLinksAction() {
  const { env, store, shop } = await requireShop();
  const pp = await store.ownPayPalFor(shop);
  if (!pp) back('/app/products', undefined, store.paymentMode(shop) === 'payee' ? NEEDS_APP : 'Connect PayPal in Settings first.');
  const todo = (await store.products(shop.id)).filter((p) => !p.paypalLinkId).slice(0, 20);
  let made = 0;
  let error = '';
  try {
    for (const p of todo) {
      const link = await pp.createPayLink({ name: p.name, description: p.description, priceCents: p.priceCents, currency: shop.currency, returnUrl: `${env.PUBLIC_URL}/s/${shop.slug}`, ships: p.needsShipping });
      await store.saveProduct(shop.id, { ...p, paypalLinkId: link.id, paypalLinkUrl: link.url });
      made++;
    }
  } catch (e) {
    error = `${made ? `Created ${made} links, then: ` : ''}${msg(e)}`;
  }
  back('/app/products', error ? undefined : `Created ${made} PayPal payment links.`, error || undefined);
}

/** Channel3 price check: what the same product sells for at other retailers (nothing of theirs is copied). */
export async function matchProductAction(productId: string, f: FormData) {
  const { env, store, shop } = await requireShop();
  const p = await store.product(productId);
  if (!p || p.shopId !== shop.id) back('/app/products', undefined, 'No such product');
  const found = await getProduct(env, String(f.get('id') ?? ''));
  if (!found) back(`/app/products/${p.id}`, undefined, 'That product is no longer in the catalog.');
  await store.saveProduct(shop.id, { ...p, channel3Id: found.id, market: marketOf(found, shop.currency) });
  back(`/app/products/${p.id}`, 'Price check on: you will see what other stores charge for it.');
}

// ---- questions and orders ----------------------------------------------------------------------

export async function answerQuestionAction(id: string, f: FormData) {
  const { store, shop } = await requireShop();
  const answer = String(f.get('answer') ?? '').trim();
  if (answer) await store.answerQuestion(shop.id, id, answer);
  back('/app/questions', 'Saved. Your store agent will use this answer from now on.');
}

async function ownOrder(id: string) {
  const ctx = await requireShop();
  const order = await ctx.store.order(id);
  if (!order || order.shopId !== ctx.shop.id) back('/app/orders', undefined, 'No such order');
  return { ...ctx, order };
}

export async function shipOrderAction(id: string, f: FormData) {
  const { store, shop, order } = await ownOrder(id);
  const problem = await store.markShipped(shop, order, String(f.get('carrier') ?? '').trim(), String(f.get('tracking') ?? '').trim());
  if (problem) back('/app/orders', undefined, problem);
  back('/app/orders', 'Marked shipped; the tracking number was sent to PayPal.');
}

export async function refundOrderAction(id: string) {
  const { store, shop, order } = await ownOrder(id);
  const d = await store.refund(shop, order, 'Refunded by the store', 'merchant');
  if (!d.allowed) back('/app/orders', undefined, d.reason);
  back('/app/orders', 'Refunded to the buyer’s PayPal.');
}

export async function syncOrderAction(id: string) {
  const { store, shop, order } = await ownOrder(id);
  const o = await store.sync(shop, order);
  back('/app/orders', o.status === 'created' ? 'Still waiting for the buyer to approve in PayPal.' : `Order is ${o.status}.`);
}

// ---- settings ---------------------------------------------------------------------------------

export async function saveSettingsAction(f: FormData) {
  const { store, shop, user } = await requireShop();
  const problem = await store.updateShop(shop, {
    name: String(f.get('name') ?? ''),
    slug: String(f.get('slug') ?? ''),
    tagline: String(f.get('tagline') ?? '').trim(),
    about: String(f.get('about') ?? '').trim(),
    refundDays: Number.parseInt(String(f.get('refund_days') ?? '30'), 10) || 0,
    currency: String(f.get('currency') ?? 'USD'),
    // The public directory is for real merchants; demo shops stay unlisted.
    listed: f.get('listed') === 'on' && !user.isAnonymous,
  });
  back('/app/settings', problem ? undefined : 'Saved.', problem ?? undefined);
}

export async function savePayeeAction(f: FormData) {
  const { store, shop } = await requireShop();
  const email = String(f.get('email') ?? '').trim().toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back('/app/settings', undefined, 'That is not an email address.');
  await store.setPayee(shop, email || null);
  back('/app/settings', email ? `Payments now go to the PayPal account ${email}.` : 'Stopped receiving payments by email.');
}

export async function connectPayPalAction(f: FormData) {
  const { store, shop } = await requireShop();
  const clientId = String(f.get('client_id') ?? '').trim();
  const clientSecret = String(f.get('client_secret') ?? '').trim();
  if (!clientId || !clientSecret) back('/app/settings', undefined, 'Paste both the client id and the secret.');
  let notes: string[] = [];
  let error = '';
  try {
    notes = await store.connectPayPal(shop, { env: f.get('env') === 'live' ? 'live' : 'sandbox', clientId, clientSecret });
  } catch (e) {
    error = msg(e);
  }
  back('/app/settings', error ? undefined : ['PayPal connected. Agents can buy from your store now.', ...notes].join(' '), error || undefined);
}

// ---- Channel3 Partner Program: list the catalog IN Channel3, then out to every AI shopping surface ----

/** Open Shelf itself as one Channel3 merchant: the marketplace whose sitemap lists every hosted store. */
async function platformCustomer(env: Env, store: Store): Promise<string> {
  const known = await store.kvGet('channel3_platform_customer');
  if (known) return known;
  const { customer_id } = await createMerchant(env, new URL(env.PUBLIC_URL).hostname, 'Open Shelf');
  await store.kvSet('channel3_platform_customer', customer_id);
  return customer_id;
}

export async function listOnChannel3Action(f: FormData) {
  const { env, store, shop, user } = await requireShop();
  if (user.isAnonymous) back('/app', undefined, 'Demo stores are not listed publicly. Log in with PayPal to list your own store on Channel3.');
  const raw = String(f.get('website') ?? '').trim();
  const domain = raw ? domainOf(raw) : null;
  if (raw && !domain) back('/app', undefined, 'That website address does not look right.');
  // Listing in Open Shelf's directory and sitemap happens either way; Channel3 needs the partner key.
  await store.setChannel3(shop, { listed: true, website: domain ?? shop.website });
  let note = '';
  let error = '';
  try {
    const customerId = domain ? (await createMerchant(env, domain, shop.name)).customer_id : await platformCustomer(env, store);
    await store.setChannel3({ ...shop, listed: true, website: domain ?? shop.website }, { customerId });
    note = domain ? `Listed on Channel3. It is crawling ${domain} now; connect ChatGPT, Google and more below.` : 'Listed on Channel3 through the Open Shelf marketplace. Its crawler picks up your products from the Open Shelf sitemap.';
  } catch (e) {
    error = `Listed in the Open Shelf directory, but Channel3 said: ${msg(e)}`;
  }
  back('/app', note || undefined, error || undefined);
}

export async function unlistAction() {
  const { store, shop } = await requireShop();
  await store.setChannel3(shop, { listed: false });
  back('/app', 'Unlisted: your store is out of the directory and the sitemap.');
}

export async function connectChannel3Action(f: FormData) {
  const { env, shop } = await requireShop();
  if (!shop.channel3CustomerId || !shop.website) back('/app', undefined, 'Add your own website to Channel3 first.');
  const platform = String(f.get('platform') ?? '');
  let url = '';
  let error = '';
  try {
    url = (await connectSession(env, shop.channel3CustomerId, `${env.PUBLIC_URL}/app/channel3/return`, (DISTRIBUTION as readonly string[]).includes(platform) ? platform : undefined)).url;
  } catch (e) {
    error = msg(e);
  }
  if (error) back('/app', undefined, error);
  redirect(url);
}
