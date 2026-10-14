import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { askStore, shopContext } from './agent';
import type { Env } from './env';
import { fmt, rank, Store, UserError, type Order, type Product, type Shop } from './store';

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

function reply(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

async function guard(fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return reply(await fn());
  } catch (e) {
    // Only messages written for the caller go out; anything else is logged and stays here.
    const message = e instanceof UserError ? e.message : 'Something went wrong on the store’s side. Try again in a moment.';
    if (!(e instanceof UserError)) console.error('tool_failed', e instanceof Error ? e.message : String(e));
    return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true };
  }
}

export const INSTRUCTIONS = `Open Shelf lets you shop independent stores on a person's behalf.
1. Find products with search_products (or list_stores to browse).
2. Before recommending, ask the store's own agent with ask_store: it knows the catalog, the merchant's notes and past answers, and it says so when it does not know.
3. buy creates a PayPal order and returns approve_url. Give that link to the person; they log in to PayPal and approve, so nothing is charged without them.
4. After they approve, call order_status to confirm payment and later to get tracking. request_refund applies the store's refund policy.`;

/** scope = one shop (its own /s/:slug/mcp) or null for the directory of every listed shop. */
/** `limited(what)` = true when this caller is over its budget for a model call or an order. */
export function registerTools(server: McpServer, env: Env, scope: Shop | null, limited: (what: 'ask' | 'buy') => Promise<boolean> = async () => false): void {
  const store = new Store(env);
  const shops = async (): Promise<Shop[]> => (scope ? [scope] : store.listedShops());
  const shopFor = async (slug?: string): Promise<Shop> => {
    if (scope) return scope;
    const s = slug ? await store.shopBySlug(slug) : null;
    if (!s) throw new UserError(`No store "${slug ?? ''}". Use list_stores to see store ids.`);
    return s;
  };
  const productIn = async (id: string): Promise<{ shop: Shop; product: Product }> => {
    const product = await store.product(id);
    const shop = product && product.active ? await store.shopById(product.shopId) : null;
    if (!product || !shop || (scope && shop.id !== scope.id)) throw new UserError(`No product ${id}. Use search_products to find product ids.`);
    return { shop, product };
  };
  const orderFor = async (id: string): Promise<{ shop: Shop; order: Order }> => {
    const order = await store.orderById(id);
    const shop = order ? await store.shopById(order.shopId) : null;
    if (!order || !shop || (scope && shop.id !== scope.id)) throw new UserError(`No order ${id}.`);
    return { shop, order };
  };

  if (!scope) {
    server.registerTool(
      'list_stores',
      { description: 'List the independent stores you can shop here, with what each sells.', inputSchema: {} },
      () =>
        guard(async () => {
          const list = await shops();
          return Promise.all(list.map(async (s) => ({ store: s.slug, name: s.name, tagline: s.tagline, products: (await store.products(s.id)).length, url: `${env.PUBLIC_URL}/s/${s.slug}` })));
        }),
    );
  }

  server.registerTool(
    'search_products',
    {
      description: scope
        ? `Search ${scope.name}'s products by what the person needs (e.g. "moisturizer for oily skin"). Returns product ids, prices, options and stock.`
        : 'Search products across every store by what the person needs (e.g. "moisturizer for oily skin"). Returns product ids, prices, options and stock.',
      inputSchema: {
        query: z.string().describe('What the person is looking for, in plain words'),
        max_price: z.number().optional().describe('Upper price limit in the store currency'),
        ...(scope ? {} : { store: z.string().optional().describe('Limit to one store id from list_stores') }),
      },
    },
    (args) =>
      guard(async () => {
        const a = args as { query: string; max_price?: number; store?: string };
        const list = a.store ? [await shopFor(a.store)] : await shops();
        const pool: (Product & { shop: Shop; extra: string })[] = [];
        for (const s of list) for (const p of await store.products(s.id)) pool.push({ ...p, shop: s, extra: `${s.name} ${s.tagline} ${p.variants.map((v) => v.options.map((o) => o.label).join(' ')).join(' ')}` });
        const affordable = a.max_price ? pool.filter((p) => p.priceCents <= a.max_price! * 100) : pool;
        const hits = rank(affordable, a.query, 12);
        return {
          results: hits.map((p) => compactProduct(env, p.shop, p)),
          note: hits.length ? 'Ask the store with ask_store before recommending; it knows details the listing does not.' : 'No keyword matches. Try broader words, or ask_store, which reads the whole catalog.',
        };
      }),
  );

  server.registerTool(
    'get_product',
    { description: 'Full details of one product: description, every option with its price, stock, and the store it belongs to.', inputSchema: { product_id: z.string() } },
    (args) =>
      guard(async () => {
        const { shop, product } = await productIn(args.product_id);
        return { ...compactProduct(env, shop, product), description: product.description, store_name: shop.name, refund_days: shop.refundDays };
      }),
  );

  server.registerTool(
    'ask_store',
    {
      description:
        "Ask the store's own agent a question, like asking a shop assistant: suitability (\"does it work on oily skin?\"), ingredients, sizing, shipping, returns, comparisons between its products. It answers only from what the store has published and says when it does not know (that question goes to the merchant).",
      inputSchema: {
        ...(scope ? {} : { store: z.string().describe('Store id from list_stores or a search result') }),
        question: z.string(),
        product_id: z.string().optional().describe('The product the question is about, if any'),
      },
    },
    (args) =>
      guard(async () => {
        if (await limited('ask')) throw new UserError('Too many questions from you just now. Try again in a minute.');
        const a = args as { store?: string; question: string; product_id?: string };
        const shop = a.product_id && !a.store && !scope ? (await productIn(a.product_id)).shop : await shopFor(a.store);
        const [products, knowledge] = await Promise.all([store.products(shop.id), store.knowledge(shop.id)]);
        const product = a.product_id ? (products.find((p) => p.id === a.product_id) ?? null) : null;
        const out = await askStore(env, shopContext(shop, products, knowledge), a.question, product);
        await store.recordQuestion({ shopId: shop.id, productId: product?.id, question: a.question, answer: out.answer, answered: out.answered, asker: 'agent' });
        const recommended = products.filter((p) => out.product_ids.includes(p.id));
        return {
          store: shop.slug,
          answer: out.answer,
          answered: out.answered,
          recommended: recommended.map((p) => compactProduct(env, shop, p)),
          ...(out.answered ? {} : { note: 'The store did not have this information; the merchant has been asked.' }),
        };
      }),
  );

  server.registerTool(
    'buy',
    {
      description:
        'Buy products from one store. Creates a PayPal order and returns approve_url: give it to the person to approve in PayPal (they choose the shipping address there). Nothing is charged until they approve. Then call order_status.',
      inputSchema: {
        items: z
          .array(
            z.object({
              product_id: z.string(),
              options: z.record(z.string(), z.string()).optional().describe('Chosen option per variant, e.g. {"Size": "50 ml"}'),
              quantity: z.number().int().min(1).max(99).optional(),
            }),
          )
          .min(1),
      },
    },
    (args) =>
      guard(async () => {
        if (await limited('buy')) throw new UserError('Too many orders from you just now. Try again in a minute.');
        const first = await productIn(args.items[0].product_id);
        const order = await store.checkout(
          first.shop,
          args.items.map((i) => ({ productId: i.product_id, options: i.options, quantity: i.quantity })),
          'agent',
        );
        return {
          order_id: order.id,
          store: first.shop.name,
          total: fmt(order.totalCents, order.currency),
          items: order.items.map((i) => ({ name: i.name, option: i.variant || undefined, quantity: i.quantity, unit_price: fmt(i.unit_cents, order.currency) })),
          approve_url: order.approveUrl,
          next: 'Show approve_url to the person. When they say they have approved, call order_status with order_id.',
        };
      }),
  );

  server.registerTool(
    'order_status',
    { description: 'Where an order stands: waiting for approval, paid, shipped (with tracking), refunded.', inputSchema: { order_id: z.string() } },
    (args) =>
      guard(async () => {
        const found = await orderFor(args.order_id);
        const order = await store.sync(found.shop, found.order);
        return describeOrder(order);
      }),
  );

  server.registerTool(
    'request_refund',
    {
      description: "Ask for a refund on a paid order. Inside the store's refund window it is refunded to the person's PayPal at once; otherwise the request goes to the merchant.",
      inputSchema: { order_id: z.string(), reason: z.string() },
    },
    (args) =>
      guard(async () => {
        const { shop, order } = await orderFor(args.order_id);
        const decision = await store.refund(shop, await store.sync(shop, order), args.reason, 'shopper');
        if (!decision.allowed) {
          await store.recordQuestion({ shopId: shop.id, question: `Refund request for order ${order.id}: ${args.reason}`, answer: decision.reason, answered: false, asker: 'agent' });
        }
        return { refunded: decision.allowed, detail: decision.reason, order: describeOrder((await store.order(order.id)) as Order) };
      }),
  );
}

function compactProduct(env: Env, shop: Shop, p: Product) {
  return {
    product_id: p.id,
    name: p.name,
    store: shop.slug,
    price: fmt(p.priceCents, shop.currency),
    options: p.variants.length
      ? Object.fromEntries(p.variants.map((v) => [v.name, v.options.map((o) => (o.price_cents !== undefined ? `${o.label} (${fmt(o.price_cents, shop.currency)})` : o.label))]))
      : undefined,
    stock: p.stock === null ? undefined : p.stock,
    elsewhere: p.market ? `${fmt(p.market.minCents, shop.currency)}${p.market.maxCents !== p.market.minCents ? `–${fmt(p.market.maxCents, shop.currency)}` : ''} at ${p.market.retailers} other stores (Channel3)` : undefined,
    summary: p.description.slice(0, 220) || undefined,
    image: p.imageUrl ?? undefined,
    page: `${env.PUBLIC_URL}/s/${shop.slug}#${p.id}`,
  };
}

export function describeOrder(o: Order) {
  const status =
    o.status === 'created'
      ? 'waiting for the person to approve in PayPal'
      : o.status === 'paid'
        ? 'paid; the store is preparing it'
        : o.status === 'shipped'
          ? 'shipped'
          : o.status;
  return {
    order_id: o.id,
    status,
    total: fmt(o.totalCents, o.currency),
    items: o.items.map((i) => `${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`),
    ...(o.status === 'created' ? { approve_url: o.approveUrl } : {}),
    // Country only: the order id is all a caller needs, so the street address stays with the merchant.
    ...(o.shipTo ? { ships_to: o.shipTo.split(',').pop()?.trim() } : {}),
    ...(o.trackingNumber ? { tracking: `${o.carrier ?? ''} ${o.trackingNumber}`.trim() } : {}),
    ...(o.refundReason ? { refund_reason: o.refundReason } : {}),
  };
}
