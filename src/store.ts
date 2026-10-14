import { Sealer } from './crypto';
import type { Env } from './env';
import { PayPal, type OrderLine, type PayLink, orderTotalCents } from './paypal';

// ---- types -------------------------------------------------------------------------

export interface Variant {
  name: string;
  options: { label: string; price_cents?: number }[];
}

export interface Shop {
  id: string;
  ownerUserId: string;
  slug: string;
  name: string;
  tagline: string;
  about: string;
  currency: string;
  refundDays: number;
  listed: boolean;
  demo: boolean;
  paypalEnv: 'sandbox' | 'live';
  paypalClientId: string | null;
  paypalSecretCt: string | null;
  paypalSecretIv: string | null;
  paypalWebhookId: string | null;
  createdAt: number;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  variants: Variant[];
  stock: number | null;
  source: string;
  paypalLinkId: string | null;
  paypalLinkUrl: string | null;
  active: boolean;
  createdAt: number;
}

export interface Question {
  id: string;
  shopId: string;
  productId: string | null;
  question: string;
  answer: string;
  answered: boolean;
  asker: 'agent' | 'human';
  merchantAnswer: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

export interface OrderItem {
  product_id: string;
  name: string;
  variant: string;
  quantity: number;
  unit_cents: number;
}

export interface Order {
  id: string;
  shopId: string;
  paypalOrderId: string;
  items: OrderItem[];
  totalCents: number;
  currency: string;
  status: 'created' | 'paid' | 'shipped' | 'refunded' | 'cancelled';
  channel: 'agent' | 'web';
  approveUrl: string;
  captureId: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  shipTo: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  refundReason: string | null;
  createdAt: number;
  paidAt: number | null;
  shippedAt: number | null;
  refundedAt: number | null;
}

export function shortId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

async function all<T>(stmt: D1PreparedStatement): Promise<T[]> {
  return (await stmt.all<T>()).results ?? [];
}

// ---- row mapping -------------------------------------------------------------------

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? null : String(v));
const n = (v: unknown) => (v == null ? null : Number(v));

function shopFrom(r: Row): Shop {
  return {
    id: String(r.id),
    ownerUserId: String(r.owner_user_id),
    slug: String(r.slug),
    name: String(r.name),
    tagline: String(r.tagline ?? ''),
    about: String(r.about ?? ''),
    currency: String(r.currency),
    refundDays: Number(r.refund_days),
    listed: Boolean(r.listed),
    demo: Boolean(r.demo),
    paypalEnv: r.paypal_env === 'live' ? 'live' : 'sandbox',
    paypalClientId: s(r.paypal_client_id),
    paypalSecretCt: s(r.paypal_secret_ct),
    paypalSecretIv: s(r.paypal_secret_iv),
    paypalWebhookId: s(r.paypal_webhook_id),
    createdAt: Number(r.created_at),
  };
}

function productFrom(r: Row): Product {
  return {
    id: String(r.id),
    shopId: String(r.shop_id),
    name: String(r.name),
    description: String(r.description ?? ''),
    priceCents: Number(r.price_cents),
    imageUrl: s(r.image_url),
    variants: JSON.parse(String(r.variants_json || '[]')) as Variant[],
    stock: n(r.stock),
    source: String(r.source),
    paypalLinkId: s(r.paypal_link_id),
    paypalLinkUrl: s(r.paypal_link_url),
    active: Boolean(r.active),
    createdAt: Number(r.created_at),
  };
}

function questionFrom(r: Row): Question {
  return {
    id: String(r.id),
    shopId: String(r.shop_id),
    productId: s(r.product_id),
    question: String(r.question),
    answer: String(r.answer ?? ''),
    answered: Boolean(r.answered),
    asker: r.asker === 'human' ? 'human' : 'agent',
    merchantAnswer: s(r.merchant_answer),
    createdAt: Number(r.created_at),
    resolvedAt: n(r.resolved_at),
  };
}

function orderFrom(r: Row): Order {
  return {
    id: String(r.id),
    shopId: String(r.shop_id),
    paypalOrderId: String(r.paypal_order_id),
    items: JSON.parse(String(r.items_json)) as OrderItem[],
    totalCents: Number(r.total_cents),
    currency: String(r.currency),
    status: r.status as Order['status'],
    channel: r.channel === 'web' ? 'web' : 'agent',
    approveUrl: String(r.approve_url),
    captureId: s(r.capture_id),
    buyerName: s(r.buyer_name),
    buyerEmail: s(r.buyer_email),
    shipTo: s(r.ship_to),
    carrier: s(r.carrier),
    trackingNumber: s(r.tracking_number),
    refundReason: s(r.refund_reason),
    createdAt: Number(r.created_at),
    paidAt: n(r.paid_at),
    shippedAt: n(r.shipped_at),
    refundedAt: n(r.refunded_at),
  };
}

// ---- shops ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'shop'
  );
}

export class Store {
  constructor(private readonly env: Env) {}
  private get db(): D1Database {
    return this.env.DB;
  }

  async shopForUser(userId: string): Promise<Shop | null> {
    const r = await this.db.prepare('SELECT * FROM shops WHERE owner_user_id = ?').bind(userId).first<Row>();
    return r ? shopFrom(r) : null;
  }

  async shopBySlug(slug: string): Promise<Shop | null> {
    const r = await this.db.prepare('SELECT * FROM shops WHERE slug = ?').bind(slug).first<Row>();
    return r ? shopFrom(r) : null;
  }

  async shopById(id: string): Promise<Shop | null> {
    const r = await this.db.prepare('SELECT * FROM shops WHERE id = ?').bind(id).first<Row>();
    return r ? shopFrom(r) : null;
  }

  async listedShops(): Promise<Shop[]> {
    return (await all<Row>(this.db.prepare('SELECT * FROM shops WHERE listed = 1 ORDER BY created_at'))).map(shopFrom);
  }

  async createShop(ownerUserId: string, name: string, opts: { demo?: boolean; tagline?: string; about?: string; listed?: boolean } = {}): Promise<Shop> {
    const id = shortId('s');
    let slug = slugify(name);
    if (await this.shopBySlug(slug)) slug = `${slug}-${id.slice(-5)}`;
    await this.db
      .prepare('INSERT INTO shops (id, owner_user_id, slug, name, tagline, about, listed, demo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, ownerUserId, slug, name, opts.tagline ?? '', opts.about ?? '', opts.listed ? 1 : 0, opts.demo ? 1 : 0, Date.now())
      .run();
    return (await this.shopById(id)) as Shop;
  }

  async updateShop(shop: Shop, patch: { name?: string; slug?: string; tagline?: string; about?: string; refundDays?: number; currency?: string; listed?: boolean }): Promise<string | null> {
    if (patch.slug !== undefined) {
      const slug = slugify(patch.slug);
      const taken = await this.shopBySlug(slug);
      if (taken && taken.id !== shop.id) return `The address /s/${slug} is taken.`;
      patch.slug = slug;
    }
    await this.db
      .prepare('UPDATE shops SET name = ?, slug = ?, tagline = ?, about = ?, refund_days = ?, currency = ?, listed = ? WHERE id = ?')
      .bind(
        patch.name?.trim() || shop.name,
        patch.slug ?? shop.slug,
        patch.tagline ?? shop.tagline,
        patch.about ?? shop.about,
        Math.max(0, Math.min(365, patch.refundDays ?? shop.refundDays)),
        (patch.currency ?? shop.currency).toUpperCase().slice(0, 3),
        (patch.listed ?? shop.listed) ? 1 : 0,
        shop.id,
      )
      .run();
    return null;
  }

  /** Checks the credentials work, then registers the order webhooks on that PayPal app. */
  async connectPayPal(shop: Shop, input: { env: 'sandbox' | 'live'; clientId: string; clientSecret: string }): Promise<string[]> {
    const notes: string[] = [];
    const pp = new PayPal({ env: input.env, clientId: input.clientId, clientSecret: input.clientSecret });
    let webhookId: string | null = null;
    try {
      webhookId = await pp.registerWebhook(`${this.env.PUBLIC_URL}/webhooks/paypal/${shop.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/auth failed/.test(msg)) throw e;
      // Local URLs cannot take webhooks; orders still complete through the return page and order_status.
      notes.push(`Webhooks not registered (${msg.slice(0, 160)}). Orders still complete when the buyer returns from PayPal.`);
    }
    const sealed = await new Sealer(this.env.MASTER_KEY).seal(input.clientSecret);
    await this.db
      .prepare('UPDATE shops SET paypal_env = ?, paypal_client_id = ?, paypal_secret_ct = ?, paypal_secret_iv = ?, paypal_webhook_id = ? WHERE id = ?')
      .bind(input.env, input.clientId, sealed.ct, sealed.iv, webhookId, shop.id)
      .run();
    return notes;
  }

  /** The shop's own PayPal app, or the shared demo app for demo shops. Null = cannot take payments yet. */
  async paypalFor(shop: Shop): Promise<PayPal | null> {
    if (shop.paypalClientId && shop.paypalSecretCt && shop.paypalSecretIv) {
      const secret = await new Sealer(this.env.MASTER_KEY).open(shop.paypalSecretCt, shop.paypalSecretIv);
      return new PayPal({ env: shop.paypalEnv, clientId: shop.paypalClientId, clientSecret: secret, webhookId: shop.paypalWebhookId ?? undefined });
    }
    if (shop.demo && this.env.DEMO_PAYPAL_CLIENT_ID && this.env.DEMO_PAYPAL_CLIENT_SECRET)
      return new PayPal({ env: 'sandbox', clientId: this.env.DEMO_PAYPAL_CLIENT_ID, clientSecret: this.env.DEMO_PAYPAL_CLIENT_SECRET, webhookId: this.env.DEMO_PAYPAL_WEBHOOK_ID });
    return null;
  }

  // ---- products ----------------------------------------------------------------------

  async products(shopId: string, opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
    const sql = `SELECT * FROM products WHERE shop_id = ? ${opts.includeInactive ? '' : 'AND active = 1'} ORDER BY created_at DESC`;
    return (await all<Row>(this.db.prepare(sql).bind(shopId))).map(productFrom);
  }

  async product(id: string): Promise<Product | null> {
    const r = await this.db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Row>();
    return r ? productFrom(r) : null;
  }

  async saveProduct(shopId: string, p: Partial<Product> & { name: string; priceCents: number }): Promise<Product> {
    const id = p.id ?? shortId('p');
    await this.db
      .prepare(
        `INSERT INTO products (id, shop_id, name, description, price_cents, image_url, variants_json, stock, source, paypal_link_id, paypal_link_url, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, price_cents = excluded.price_cents,
           image_url = excluded.image_url, variants_json = excluded.variants_json, stock = excluded.stock, active = excluded.active,
           paypal_link_id = excluded.paypal_link_id, paypal_link_url = excluded.paypal_link_url`,
      )
      .bind(
        id,
        shopId,
        p.name.trim().slice(0, 127),
        (p.description ?? '').trim(),
        Math.max(0, Math.round(p.priceCents)),
        p.imageUrl || null,
        JSON.stringify(cleanVariants(p.variants ?? [])),
        p.stock ?? null,
        p.source ?? 'manual',
        p.paypalLinkId ?? null,
        p.paypalLinkUrl ?? null,
        p.active === false ? 0 : 1,
        p.createdAt ?? Date.now(),
      )
      .run();
    return (await this.product(id)) as Product;
  }

  async deleteProduct(shopId: string, id: string): Promise<void> {
    await this.db.prepare('DELETE FROM products WHERE id = ? AND shop_id = ?').bind(id, shopId).run();
  }

  /** Payment Links → products. Re-importing updates name/price/variants but keeps the merchant's image, stock and edits to the description. */
  async importPayLinks(shop: Shop, links: PayLink[]): Promise<{ added: number; updated: number }> {
    const existing = new Map((await this.products(shop.id, { includeInactive: true })).filter((p) => p.paypalLinkId).map((p) => [p.paypalLinkId as string, p]));
    let added = 0;
    let updated = 0;
    for (const l of links) {
      const prev = existing.get(l.id);
      await this.saveProduct(shop.id, {
        ...(prev ?? {}),
        id: prev?.id,
        name: l.name,
        description: prev?.description || l.description,
        priceCents: l.priceCents,
        variants: l.variants,
        source: 'paypal_link',
        paypalLinkId: l.id,
        paypalLinkUrl: l.url,
        active: l.active,
      });
      prev ? updated++ : added++;
    }
    return { added, updated };
  }

  // ---- questions ---------------------------------------------------------------------

  async recordQuestion(q: { shopId: string; productId?: string | null; question: string; answer: string; answered: boolean; asker: 'agent' | 'human' }): Promise<Question> {
    const id = shortId('q');
    await this.db
      .prepare('INSERT INTO questions (id, shop_id, product_id, question, answer, answered, asker, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, q.shopId, q.productId ?? null, q.question.slice(0, 1000), q.answer, q.answered ? 1 : 0, q.asker, Date.now())
      .run();
    return { id, shopId: q.shopId, productId: q.productId ?? null, question: q.question, answer: q.answer, answered: q.answered, asker: q.asker, merchantAnswer: null, createdAt: Date.now(), resolvedAt: null };
  }

  async questions(shopId: string, limit = 100): Promise<Question[]> {
    return (await all<Row>(this.db.prepare('SELECT * FROM questions WHERE shop_id = ? ORDER BY created_at DESC LIMIT ?').bind(shopId, limit))).map(questionFrom);
  }

  /** The merchant's answer becomes knowledge the store agent uses for every later shopper. */
  async answerQuestion(shopId: string, id: string, answer: string): Promise<void> {
    await this.db.prepare('UPDATE questions SET merchant_answer = ?, resolved_at = ? WHERE id = ? AND shop_id = ?').bind(answer.trim(), Date.now(), id, shopId).run();
  }

  async knowledge(shopId: string): Promise<{ question: string; answer: string }[]> {
    const rs = await all<Row>(
      this.db.prepare('SELECT question, merchant_answer FROM questions WHERE shop_id = ? AND merchant_answer IS NOT NULL AND merchant_answer != "" ORDER BY resolved_at').bind(shopId),
    );
    return rs.map((r) => ({ question: String(r.question), answer: String(r.merchant_answer) }));
  }

  // ---- orders ------------------------------------------------------------------------

  async order(id: string): Promise<Order | null> {
    const r = await this.db.prepare('SELECT * FROM orders WHERE id = ? OR paypal_order_id = ?').bind(id, id).first<Row>();
    return r ? orderFrom(r) : null;
  }

  async orders(shopId: string, limit = 100): Promise<Order[]> {
    return (await all<Row>(this.db.prepare('SELECT * FROM orders WHERE shop_id = ? ORDER BY created_at DESC LIMIT ?').bind(shopId, limit))).map(orderFrom);
  }

  /** Prices the cart from the catalog (never from the caller) and opens a PayPal order the buyer approves. */
  async checkout(shop: Shop, cart: { productId: string; options?: Record<string, string>; quantity?: number }[], channel: 'agent' | 'web'): Promise<Order> {
    const pp = await this.paypalFor(shop);
    if (!pp) throw new UserError(`${shop.name} has not connected PayPal yet, so it cannot take orders.`);
    if (!cart.length) throw new UserError('The cart is empty.');
    const items: OrderItem[] = [];
    for (const line of cart.slice(0, 20)) {
      const p = await this.product(line.productId);
      if (!p || p.shopId !== shop.id || !p.active) throw new UserError(`Product ${line.productId} is not sold by ${shop.name}.`);
      const qty = Math.max(1, Math.min(99, Math.floor(line.quantity ?? 1)));
      if (p.stock !== null && p.stock < qty) throw new UserError(p.stock === 0 ? `${p.name} is sold out.` : `Only ${p.stock} of ${p.name} left.`);
      const priced = priceFor(p, line.options ?? {});
      items.push({ product_id: p.id, name: p.name, variant: priced.label, quantity: qty, unit_cents: priced.unitCents });
    }
    const id = shortId('o');
    const lines: OrderLine[] = items.map((i) => ({ name: i.variant ? `${i.name} (${i.variant})` : i.name, sku: i.product_id, quantity: i.quantity, unitCents: i.unit_cents }));
    const total = orderTotalCents(lines);
    if (total <= 0) throw new UserError('The order total must be above zero.');
    const pporder = await pp.createOrder({
      lines,
      currency: shop.currency,
      brandName: shop.name,
      referenceId: id,
      returnUrl: `${this.env.PUBLIC_URL}/checkout/return?o=${id}`,
      cancelUrl: `${this.env.PUBLIC_URL}/checkout/cancel?o=${id}`,
    });
    if (!pporder.approveUrl) throw new Error('PayPal did not return an approval link');
    await this.db
      .prepare('INSERT INTO orders (id, shop_id, paypal_order_id, items_json, total_cents, currency, channel, approve_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, shop.id, pporder.id, JSON.stringify(items), total, shop.currency, channel, pporder.approveUrl, Date.now())
      .run();
    return (await this.order(id)) as Order;
  }

  /**
   * Brings an unpaid order up to date with PayPal: captures it once the buyer has approved.
   * Called from the return page, the webhook and order_status, so whichever comes first completes the sale.
   */
  async sync(shop: Shop, order: Order): Promise<Order> {
    if (order.status !== 'created') return order;
    const pp = await this.paypalFor(shop);
    if (!pp) return order;
    let o = await pp.getOrder(order.paypalOrderId);
    if (o.status === 'APPROVED') o = await pp.captureOrder(order.paypalOrderId);
    if (o.status === 'COMPLETED' && o.captureId && o.captureStatus !== 'DECLINED') return this.markPaid(order, o);
    return order;
  }

  private async markPaid(order: Order, o: { captureId?: string; buyerName?: string; buyerEmail?: string; shipTo?: string }): Promise<Order> {
    const res = await this.db
      .prepare("UPDATE orders SET status = 'paid', capture_id = ?, buyer_name = ?, buyer_email = ?, ship_to = ?, paid_at = ? WHERE id = ? AND status = 'created'")
      .bind(o.captureId ?? null, o.buyerName ?? null, o.buyerEmail ?? null, o.shipTo ?? null, Date.now(), order.id)
      .run();
    // Only the call that flipped the row takes stock, so a webhook racing the return page cannot count a sale twice.
    if (res.meta.changes) {
      await this.db.batch(
        order.items.map((i) => this.db.prepare('UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ? AND stock IS NOT NULL').bind(i.quantity, i.product_id)),
      );
    }
    return (await this.order(order.id)) as Order;
  }

  async markShipped(shop: Shop, order: Order, carrier: string, trackingNumber: string): Promise<string | null> {
    if (order.status !== 'paid') return 'Only paid orders can be marked shipped.';
    let note: string | null = null;
    const pp = await this.paypalFor(shop);
    if (pp && order.captureId && trackingNumber) {
      try {
        await pp.addTracking(order.paypalOrderId, order.captureId, trackingNumber, carrier);
      } catch (e) {
        note = `Saved here, but PayPal did not take the tracking number: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    await this.db
      .prepare("UPDATE orders SET status = 'shipped', carrier = ?, tracking_number = ?, shipped_at = ? WHERE id = ?")
      .bind(carrier || null, trackingNumber || null, Date.now(), order.id)
      .run();
    return note;
  }

  /** by = 'merchant' always refunds; a shopper's request is held to the shop's refund window. */
  async refund(shop: Shop, order: Order, reason: string, by: 'merchant' | 'shopper'): Promise<RefundDecision> {
    const decision = refundPolicy(order, shop.refundDays, by, Date.now());
    if (!decision.allowed) return decision;
    const pp = await this.paypalFor(shop);
    if (!pp || !order.captureId) return { allowed: false, reason: 'This order has no PayPal capture to refund.' };
    await pp.refundCapture(order.captureId, reason || `Refund from ${shop.name}`);
    await this.markRefunded(order.id, reason || null);
    return decision;
  }

  async markRefunded(orderId: string, reason: string | null): Promise<void> {
    await this.db.prepare("UPDATE orders SET status = 'refunded', refund_reason = COALESCE(?, refund_reason), refunded_at = ? WHERE id = ? AND status != 'refunded'").bind(reason, Date.now(), orderId).run();
  }

  async markCancelled(orderId: string): Promise<void> {
    await this.db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'created'").bind(orderId).run();
  }
}

/** A mistake the caller (agent, shopper, merchant) can fix; shown to them verbatim. */
export class UserError extends Error {}

// ---- pure rules (tested) -------------------------------------------------------------------

export type RefundDecision = { allowed: true; reason: string } | { allowed: false; reason: string };

export function refundPolicy(order: Pick<Order, 'status' | 'paidAt'>, refundDays: number, by: 'merchant' | 'shopper', now: number): RefundDecision {
  if (order.status === 'refunded') return { allowed: false, reason: 'This order is already refunded.' };
  if (order.status !== 'paid' && order.status !== 'shipped') return { allowed: false, reason: 'This order was never paid, so there is nothing to refund.' };
  if (by === 'merchant') return { allowed: true, reason: 'Refunded by the merchant.' };
  const days = (now - (order.paidAt ?? now)) / 86_400_000;
  if (days <= refundDays) return { allowed: true, reason: `Within the ${refundDays}-day refund window.` };
  return { allowed: false, reason: `The ${refundDays}-day refund window has passed (paid ${Math.floor(days)} days ago). The request was passed to the merchant.` };
}

/** Matches the requested options against the product's variants (case-insensitive) and returns the unit price. */
export function priceFor(p: Pick<Product, 'name' | 'priceCents' | 'variants'>, options: Record<string, string>): { unitCents: number; label: string } {
  let unitCents = p.priceCents;
  const picked: string[] = [];
  const given = new Map(Object.entries(options).map(([k, v]) => [k.trim().toLowerCase(), String(v).trim().toLowerCase()]));
  for (const v of p.variants) {
    const want = given.get(v.name.toLowerCase());
    const opt = want === undefined && v.options.length === 1 ? v.options[0] : v.options.find((o) => o.label.toLowerCase() === want);
    if (!opt) {
      throw new UserError(`${p.name} needs a ${v.name}: one of ${v.options.map((o) => `"${o.label}"`).join(', ')}. Pass it as options: {"${v.name}": "${v.options[0]?.label}"}.`);
    }
    if (opt.price_cents !== undefined) unitCents = opt.price_cents;
    picked.push(`${v.name}: ${opt.label}`);
  }
  return { unitCents, label: picked.join(', ') };
}

export function cleanVariants(vs: Variant[]): Variant[] {
  return vs
    .map((v) => ({
      name: String(v.name ?? '').trim().slice(0, 64),
      options: (v.options ?? [])
        .map((o) => ({ label: String(o.label ?? '').trim().slice(0, 200), ...(o.price_cents != null && o.price_cents >= 0 ? { price_cents: Math.round(o.price_cents) } : {}) }))
        .filter((o) => o.label)
        .slice(0, 10),
    }))
    .filter((v) => v.name && v.options.length)
    .slice(0, 5);
}

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'what', 'which', 'good', 'best', 'want', 'need', 'looking', 'something', 'some', 'any', 'buy', 'get', 'can', 'you', 'are', 'from']);

/**
 * Keyword relevance across products. ponytail: in-memory scan, fine to a few thousand listed products;
 * swap for D1 FTS5 or Vectorize when the directory outgrows that.
 */
export function rank<T extends { name: string; description: string; extra?: string }>(items: T[], query: string, limit = 12): T[] {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(es|s)$/, '') : w));
  if (!words.length) return items.slice(0, limit);
  const scored = items.map((it) => {
    const name = it.name.toLowerCase();
    const desc = `${it.description} ${it.extra ?? ''}`.toLowerCase();
    const score = words.reduce((sum, w) => sum + (name.includes(w) ? 3 : 0) + (desc.includes(w) ? 1 : 0), 0);
    return { it, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}

export function fmt(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
