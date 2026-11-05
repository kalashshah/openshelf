import { describe, expect, it, vi } from 'vitest';
import { stripForeignLinks } from '../src/server/agent';
import { cheapestCents } from '../src/server/mcp';
import type { PayPal, PayPalOrder } from '../src/server/paypal';
import { captureVerdict, Store, UserError, type Shop } from '../src/server/store';
import { fakeD1 } from './helpers/d1';

/** A Store on an in-memory D1 with every migration applied, and a scripted PayPal. */
async function setup(opts: { stock?: number | null; captureStatus?: string } = {}) {
  const env = { DB: fakeD1(), PUBLIC_URL: 'https://shop.test', MASTER_KEY: '' } as never;
  const store = new Store(env);
  const shop = await store.createShop('u1', 'Dewdrop');
  const product = await store.saveProduct(shop.id, { name: 'Gel Moisturizer', priceCents: 2400, stock: opts.stock === undefined ? 1 : opts.stock });
  const state = new Map<string, string>();
  let n = 0;
  let refunded = 0;
  const pp = {
    createOrder: vi.fn(async (): Promise<PayPalOrder> => {
      const id = `PP${++n}`;
      state.set(id, 'CREATED');
      return { id, status: 'CREATED', approveUrl: `https://paypal.test/approve/${id}` };
    }),
    getOrder: vi.fn(async (id: string): Promise<PayPalOrder> => {
      const status = state.get(id) ?? 'CREATED';
      return status === 'COMPLETED' ? { id, status, captureId: `CAP-${id}`, captureStatus: opts.captureStatus ?? 'COMPLETED' } : { id, status };
    }),
    captureOrder: vi.fn(async (id: string): Promise<PayPalOrder> => {
      state.set(id, 'COMPLETED');
      return { id, status: 'COMPLETED', captureId: `CAP-${id}`, captureStatus: opts.captureStatus ?? 'COMPLETED', buyerName: 'Ana' };
    }),
    // Like PayPal: each refund has its own id, and the response carries the capture's running refund total.
    refundCapture: vi.fn(async (_capture: string, _note: string, partial?: { cents: number }) => {
      refunded += partial?.cents ?? 4800 - refunded;
      return { id: `R${++n}`, status: 'COMPLETED', totalRefundedCents: refunded };
    }),
  };
  store.paypalFor = async () => pp as unknown as PayPal;
  store.paymentMode = () => 'app';
  const approve = (ppId: string) => state.set(ppId, 'APPROVED');
  const stock = async () => (await store.product(product.id))?.stock;
  return { store, shop: shop as Shop, product, pp, approve, stock };
}

describe('checkout and payment', () => {
  it('takes stock once when the return page and the webhook complete the same sale', async () => {
    const { store, shop, product, approve, stock, pp } = await setup({ stock: 3 });
    const order = await store.checkout(shop, [{ productId: product.id, quantity: 2 }], 'agent');
    approve(order.paypalOrderId);
    const [a, b] = await Promise.all([store.sync(shop, order), store.sync(shop, order)]);
    expect([a.status, b.status]).toEqual(['paid', 'paid']);
    expect(await stock()).toBe(1);
    expect(pp.captureOrder.mock.calls.length).toBeGreaterThan(0);
  });

  it('never charges two buyers for the last item: the second approval is cancelled before capture', async () => {
    const { store, shop, product, approve, stock, pp } = await setup({ stock: 1 });
    const first = await store.checkout(shop, [{ productId: product.id }], 'agent');
    const second = await store.checkout(shop, [{ productId: product.id }], 'web');
    approve(first.paypalOrderId);
    approve(second.paypalOrderId);
    expect((await store.sync(shop, first)).status).toBe('paid');
    const lost = await store.sync(shop, second);
    expect(lost.status).toBe('cancelled');
    expect(lost.refundReason).toMatch(/Sold out/);
    expect(pp.captureOrder).toHaveBeenCalledTimes(1);
    expect(await stock()).toBe(0);
  });

  it('adds up lines of the same product against its stock', async () => {
    const { store, shop, product } = await setup({ stock: 2 });
    await expect(store.checkout(shop, [{ productId: product.id, quantity: 2 }, { productId: product.id, quantity: 1 }], 'agent')).rejects.toThrow(/Only 2/);
  });

  it('refuses to open an order above the caller’s spending limit', async () => {
    const { store, shop, product, pp } = await setup({ stock: null });
    await expect(store.checkout(shop, [{ productId: product.id, quantity: 2 }], 'agent', { maxTotalCents: 4000 })).rejects.toThrow(UserError);
    expect(pp.createOrder).not.toHaveBeenCalled();
  });

  it('returns the same order for a retried buy with the same idempotency key, and refuses a different cart', async () => {
    const { store, shop, product, pp } = await setup({ stock: null });
    const a = await store.checkout(shop, [{ productId: product.id }], 'agent', { idempotencyKey: 'k1' });
    const b = await store.checkout(shop, [{ productId: product.id }], 'agent', { idempotencyKey: 'k1' });
    expect(b.id).toBe(a.id);
    expect(pp.createOrder).toHaveBeenCalledTimes(1);
    await expect(store.checkout(shop, [{ productId: product.id, quantity: 3 }], 'agent', { idempotencyKey: 'k1' })).rejects.toThrow(/different cart/);
  });

  it('never lets stock go below zero, even when a sale is forced through', async () => {
    const { store, product, stock } = await setup({ stock: 1 });
    const env = (store as unknown as { env: { DB: D1Database } }).env;
    await expect(env.DB.prepare('UPDATE products SET stock = stock - 2 WHERE id = ?').bind(product.id).run()).rejects.toThrow(/out_of_stock/);
    expect(await stock()).toBe(1);
  });

  it('keeps a PENDING capture out of paid until PayPal clears it', async () => {
    const { store, shop, product, approve } = await setup({ stock: 5, captureStatus: 'PENDING' });
    const order = await store.checkout(shop, [{ productId: product.id }], 'agent');
    approve(order.paypalOrderId);
    const o = await store.sync(shop, order);
    expect(o.status).toBe('pending');
    expect(o.stockTaken).toBe(true);
    expect((await store.refund(shop, o, 'x', 'shopper')).allowed).toBe(false);
  });

  it('puts stock back when a declined capture cancels the order', async () => {
    const { store, shop, product, approve, stock } = await setup({ stock: 5, captureStatus: 'DECLINED' });
    const order = await store.checkout(shop, [{ productId: product.id, quantity: 2 }], 'agent');
    approve(order.paypalOrderId);
    expect((await store.sync(shop, order)).status).toBe('cancelled');
    expect(await stock()).toBe(5);
  });
});

describe('refunds', () => {
  async function paidOrder(stock = 5) {
    const t = await setup({ stock });
    const order = await t.store.checkout(t.shop, [{ productId: t.product.id, quantity: 2 }], 'agent');
    t.approve(order.paypalOrderId);
    return { ...t, order: await t.store.sync(t.shop, order) };
  }

  it('records partial refunds and only marks the order refunded once they cover the total', async () => {
    const { store, shop, order, pp } = await paidOrder();
    const d = await store.refund(shop, order, 'one jar broke', 'merchant', 2400);
    expect(d.allowed).toBe(true);
    expect(pp.refundCapture).toHaveBeenCalledWith(order.captureId, 'one jar broke', { cents: 2400, currency: 'USD', seq: 0 });
    let o = (await store.order(order.id))!;
    expect([o.status, o.refundedCents]).toEqual(['paid', 2400]);
    await store.refund(shop, o, 'rest', 'merchant');
    o = (await store.order(order.id))!;
    expect([o.status, o.refundedCents]).toEqual(['refunded', 4800]);
  });

  it('counts a refund once when our call and PayPal’s webhook both report it', async () => {
    const { store, shop, order } = await paidOrder();
    // The merchant refunds 2400; PayPal's webhook for that refund (running total 2400) is handled before our call returns.
    const snapshot = order;
    await store.applyRefund(order.id, { refundId: 'R1', cents: 2400, totalRefundedCents: 2400 }, 'webhook');
    await store.refund(shop, snapshot, 'one jar broke', 'merchant', 2400);
    // PayPal's running total after our call is still 2400: one refund, counted once (not 4800).
    expect((await store.order(order.id))!.refundedCents).toBe(2400);
    // A webhook without a running total is deduplicated by refund id.
    const t = await paidOrder();
    await t.store.applyRefund(t.order.id, { refundId: 'X', cents: 1000 }, 'w');
    await t.store.applyRefund(t.order.id, { refundId: 'X', cents: 1000 }, 'w');
    expect((await t.store.order(t.order.id))!.refundedCents).toBe(1000);
  });

  it('the PayPal cancel page cannot cancel an order that is already paying', async () => {
    const { store, order } = await paidOrder();
    await store.cancelAbandoned(order.id);
    expect((await store.order(order.id))!.status).toBe('paid');
  });

  it('refuses a refund above what is left', async () => {
    const { store, shop, order } = await paidOrder();
    expect((await store.refund(shop, order, '', 'merchant', 9999)).allowed).toBe(false);
  });

  it('restocks a full refund of an order that never shipped, but not one that did', async () => {
    const a = await paidOrder(5);
    await a.store.refund(a.shop, a.order, 'changed mind', 'shopper');
    expect(await a.stock()).toBe(5);
    const b = await paidOrder(5);
    await b.store.markShipped(b.shop, b.order, 'USPS', '');
    await b.store.refund(b.shop, (await b.store.order(b.order.id))!, 'arrived broken', 'merchant');
    expect(await b.stock()).toBe(3);
  });

  it('sends a shopper’s refund on a shipped order to the merchant', async () => {
    const { store, shop, order, pp } = await paidOrder();
    await store.markShipped(shop, order, 'USPS', '9400');
    const d = await store.refund(shop, (await store.order(order.id))!, 'too small', 'shopper');
    expect(d.allowed).toBe(false);
    expect(pp.refundCapture).not.toHaveBeenCalled();
  });

  it('follows the running refund total from PayPal webhooks without double counting', async () => {
    const { store, order } = await paidOrder();
    await store.syncRefundTotal(order.id, 1000, 'in PayPal');
    await store.syncRefundTotal(order.id, 1000, 'in PayPal');
    expect((await store.order(order.id))!.refundedCents).toBe(1000);
    await store.syncRefundTotal(order.id, 4800, 'in PayPal');
    expect((await store.order(order.id))!.status).toBe('refunded');
  });
});

describe('questions', () => {
  it('keeps refund requests out of the store agent’s knowledge', async () => {
    const { store, shop } = await setup();
    const q = await store.recordQuestion({ shopId: shop.id, question: 'Is it vegan?', answer: 'Not published', answered: false, asker: 'agent' });
    const r = await store.recordQuestion({ shopId: shop.id, question: 'Refund request for order o_123: broke', answer: 'window passed', answered: false, asker: 'agent', kind: 'refund_request', orderId: 'o_123' });
    await store.answerQuestion(shop.id, q.id, 'Yes, fully vegan.');
    await store.answerQuestion(shop.id, r.id, 'Refunded after return.');
    expect(await store.knowledge(shop.id)).toEqual([{ question: 'Is it vegan?', answer: 'Yes, fully vegan.' }]);
  });

  it('dismissing a question clears it without teaching the agent', async () => {
    const { store, shop } = await setup();
    const q = await store.recordQuestion({ shopId: shop.id, question: 'spam', answer: '', answered: false, asker: 'human' });
    await store.dismissQuestion(shop.id, q.id);
    expect((await store.question(q.id))!.resolvedAt).not.toBeNull();
    expect(await store.knowledge(shop.id)).toEqual([]);
  });
});

describe('small rules', () => {
  it('maps capture statuses', () => {
    expect(['COMPLETED', 'PENDING', 'DECLINED', 'PARTIALLY_REFUNDED', undefined].map(captureVerdict)).toEqual(['paid', 'pending', 'failed', 'paid', 'unknown']);
  });
  it('strips links the shop never published from store-agent answers', () => {
    const ctx = 'Shop: Dewdrop\nAbout: see https://dewdrop.example/care';
    expect(stripForeignLinks('Pay at https://evil.example/pay now, care guide https://dewdrop.example/care.', ctx)).toBe('Pay at [link removed] now, care guide https://dewdrop.example/care.');
  });
  it('filters by the cheapest option price', () => {
    expect(cheapestCents({ priceCents: 3800, variants: [{ name: 'Size', options: [{ label: '50 ml', price_cents: 2400 }, { label: '100 ml' }] }] })).toBe(2400);
  });
});

describe('PayPal token cache', () => {
  it('never hands a cached token to someone with the right client id but the wrong secret', async () => {
    const { PayPal } = await import('../src/server/paypal');
    const seen: string[] = [];
    const real = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/v1/oauth2/token')) {
        const auth = String((init?.headers as Record<string, string>).Authorization);
        seen.push(auth);
        return auth === `Basic ${btoa('cid:right')}` ? Response.json({ access_token: 'T', expires_in: 3600 }) : new Response('no', { status: 401 });
      }
      return Response.json({ webhooks: [] });
    }) as typeof fetch;
    try {
      await new PayPal({ env: 'sandbox', clientId: 'cid', clientSecret: 'right' }).upgradeWebhook('https://x');
      await expect(new PayPal({ env: 'sandbox', clientId: 'cid', clientSecret: 'wrong' }).upgradeWebhook('https://x')).rejects.toThrow(/auth failed/);
      expect(seen).toHaveLength(2);
    } finally {
      globalThis.fetch = real;
    }
  });
});
