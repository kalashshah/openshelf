import { afterEach, describe, expect, it, vi } from 'vitest';
import { pageDigest } from '../src/server/agent';
import { parseVariantText, variantText } from '../src/server/variants';
import { CaptureStatus, OrderStatus } from '@paypal/paypal-server-sdk';
import { fromSdkOrder, orderTotalCents, PayPal, PayPalError, toPayLink } from '../src/server/paypal';
import { priceFor, rank, refundPolicy, Store, UserError } from '../src/server/store';
import { checkProduct } from '../src/server/validate';
import { kindOf, productJsonLd } from '../src/server/catalog-view';
import { domainOf, mainImage, marketOf } from '../src/server/channel3';

const moisturizer = {
  name: 'Gel Moisturizer',
  priceCents: 2400,
  variants: [
    { name: 'Size', options: [{ label: '50 ml', price_cents: 2400 }, { label: '100 ml', price_cents: 3800 }] },
    { name: 'Scent', options: [{ label: 'None' }] },
  ],
};

describe('priceFor', () => {
  it('prices from the chosen option, case-insensitively, and fills single-choice variants', () => {
    expect(priceFor(moisturizer, { size: '100 ML' })).toEqual({ unitCents: 3800, label: 'Size: 100 ml, Scent: None' });
  });
  it('tells the agent which options exist when one is missing or wrong', () => {
    expect(() => priceFor(moisturizer, {})).toThrow(UserError);
    expect(() => priceFor(moisturizer, { Size: '75 ml' })).toThrow(/"50 ml", "100 ml"/);
  });
  it('uses the base price when there are no variants', () => {
    expect(priceFor({ name: 'Soap', priceCents: 800, variants: [] }, { anything: 'x' })).toEqual({ unitCents: 800, label: '' });
  });
});

describe('refundPolicy', () => {
  const day = 86_400_000;
  const now = 100 * day;
  it('refunds a shopper inside the window, refuses outside it, and always lets the merchant refund', () => {
    expect(refundPolicy({ status: 'paid', paidAt: now - 5 * day }, 30, 'shopper', now).allowed).toBe(true);
    expect(refundPolicy({ status: 'shipped', paidAt: now - 31 * day }, 30, 'shopper', now).allowed).toBe(false);
    expect(refundPolicy({ status: 'shipped', paidAt: now - 31 * day }, 30, 'merchant', now).allowed).toBe(true);
  });
  it('never refunds unpaid or already refunded orders', () => {
    expect(refundPolicy({ status: 'created', paidAt: null }, 30, 'merchant', now).allowed).toBe(false);
    expect(refundPolicy({ status: 'refunded', paidAt: now }, 30, 'merchant', now).allowed).toBe(false);
  });
});

describe('rank', () => {
  it('finds products by need, names weighted above descriptions', () => {
    const items = [
      { name: 'Barrier Repair Cream', description: 'for dry skin' },
      { name: 'Oil-Free Gel Moisturizer', description: 'for oily and combination skin' },
      { name: 'Rose Clay Mask', description: 'absorbs excess oil' },
    ];
    expect(rank(items, 'a good moisturizer for oily skin').map((i) => i.name)).toEqual(['Oil-Free Gel Moisturizer', 'Barrier Repair Cream']);
  });
});

describe('variant text', () => {
  it('round-trips the merchant edit format', () => {
    const vs = parseVariantText('Size: 50 ml=24.00 | 100 ml=$38\nScent: Unscented | Lavender\nnot a variant line');
    expect(vs).toEqual([
      { name: 'Size', options: [{ label: '50 ml', price_cents: 2400 }, { label: '100 ml', price_cents: 3800 }] },
      { name: 'Scent', options: [{ label: 'Unscented' }, { label: 'Lavender' }] },
    ]);
    expect(parseVariantText(variantText(vs))).toEqual(vs);
  });
});

describe('PayPal shapes', () => {
  it('reads a payment link with a primary priced dimension', () => {
    const link = toPayLink({
      id: 'PLB-1',
      status: 'ACTIVE',
      payment_link: 'https://www.sandbox.paypal.com/ncp/payment/PLB-1',
      line_items: [
        {
          name: 'Tote',
          unit_amount: { currency_code: 'USD', value: '30.00' },
          variants: { dimensions: [{ name: 'Color', primary: true, options: [{ label: 'Black', unit_amount: { currency_code: 'USD', value: '32.50' } }, { label: 'Natural' }] }] },
        },
      ],
    });
    expect(link).toMatchObject({ name: 'Tote', priceCents: 3000, url: 'https://www.sandbox.paypal.com/ncp/payment/PLB-1', variants: [{ name: 'Color', options: [{ label: 'Black', price_cents: 3250 }, { label: 'Natural' }] }] });
  });
  it('prices a link with only option-level prices from its cheapest option', () => {
    const link = toPayLink({
      id: 'PLB-2',
      line_items: [{ name: 'Notebook', unit_amount: { currency_code: 'USD', value: '0.00' }, variants: { dimensions: [{ name: 'Cover', primary: true, options: [{ label: 'Canvas', unit_amount: { currency_code: 'USD', value: '32.00' } }, { label: 'Linen', unit_amount: { currency_code: 'USD', value: '28.00' } }] }] } }],
    });
    expect(link?.priceCents).toBe(2800);
  });
  it('reads a captured order and totals lines', () => {
    const o = fromSdkOrder({
      id: 'O1',
      status: OrderStatus.Completed,
      payer: { name: { givenName: 'Ana', surname: 'Diaz' }, emailAddress: 'ana@example.com' },
      purchaseUnits: [{ shipping: { address: { addressLine1: '1 Main St', adminArea2: 'Austin', adminArea1: 'TX', postalCode: '78701', countryCode: 'US' } }, payments: { captures: [{ id: 'C1', status: CaptureStatus.Completed }] } }],
    });
    expect(o).toMatchObject({ captureId: 'C1', buyerName: 'Ana Diaz', shipTo: '1 Main St, Austin, TX, 78701, US' });
    expect(orderTotalCents([{ name: 'a', sku: 'a', quantity: 2, unitCents: 2400 }, { name: 'b', sku: 'b', quantity: 1, unitCents: 1800 }])).toBe(6600);
  });
});

it('pageDigest keeps structured data and absolute image URLs, drops scripts', () => {
  const d = pageDigest('<script type="application/ld+json">{"@type":"Product","name":"Soap"}</script><script>evil()</script><img src="/a.jpg" alt="Soap bar"><p>Soap $8</p>', 'https://shop.example/');
  expect(d).toContain('"@type":"Product"');
  expect(d).toContain('https://shop.example/a.jpg Soap bar');
  expect(d).not.toContain('evil');
});

it('kindOf picks a packshot that fits the product', () => {
  const k = (name: string, needsShipping = true) => kindOf({ name, description: '', needsShipping });
  expect([k('Oily Skin Starter Set'), k('Barrier Repair Cream'), k('Daily Mineral Sunscreen SPF 40'), k('Clarifying Gel Cleanser'), k('Founder Notebook (A5, dotted)')]).toEqual(['box', 'jar', 'tube', 'bottle', 'book']);
  expect([k('1-hour product design review'), k('Website maintenance', false)]).toEqual(['ticket', 'ticket']);
});

describe('Channel3 helpers', () => {
  const p = {
    id: 'c1',
    title: 'Oil-Free Gel Moisturizer',
    description: 'Lightweight gel.',
    brands: [{ name: 'Clinique' }],
    images: [{ url: 'https://x/a.jpg', cleaned_url: null, is_main_image: false }, { url: 'https://x/b.jpg', cleaned_url: 'https://x/b-clean.png', is_main_image: true }],
    key_features: ['Oil-free', 'Non-acnegenic'],
    offers: [
      { url: 'u1', domain: 'sephora.com', price: { price: 42, currency: 'USD' }, availability: 'InStock' },
      { url: 'u2', domain: 'kohls.com', price: { price: 39.5, currency: 'USD' }, availability: 'InStock' },
      { url: 'u3', domain: 'gone.com', price: { price: 10, currency: 'USD' }, availability: 'OutOfStock' },
      { url: 'u4', domain: 'uk.com', price: { price: 30, currency: 'GBP' }, availability: 'InStock' },
    ],
  };
  it('prices the market from in-stock offers in the shop currency, and picks the clean main image', () => {
    expect(marketOf(p)).toEqual({ minCents: 3950, maxCents: 4200, retailers: 2 });
    expect(mainImage(p)).toBe('https://x/b-clean.png');
  });
});

describe('Channel3 listing', () => {
  it('reads a merchant domain from whatever they type', () => {
    expect([domainOf('https://www.DewDrop.com/shop'), domainOf('dewdrop.com'), domainOf('not a url')]).toEqual(['dewdrop.com', 'dewdrop.com', null]);
  });
  it('describes a product as schema.org Product with a PayPal-checkout offer page', () => {
    const shop = { slug: 'dew', name: 'Dewdrop', currency: 'USD', refundDays: 30 } as Parameters<typeof productJsonLd>[1];
    const p = { id: 'p1', name: 'Gel', description: 'd', priceCents: 2400, imageUrl: null, stock: 3, variants: [{ name: 'Size', options: [{ label: '50 ml', price_cents: 2400 }, { label: '100 ml', price_cents: 3800 }] }] } as unknown as Parameters<typeof productJsonLd>[2];
    const ld = productJsonLd('https://x.dev', shop, p) as { offers: Record<string, unknown>; image: string[]; hasMerchantReturnPolicy: { merchantReturnDays: number } };
    expect(ld.offers).toMatchObject({ '@type': 'AggregateOffer', lowPrice: '24.00', highPrice: '38.00', url: 'https://x.dev/s/dew/p/p1', availability: 'https://schema.org/InStock' });
    expect(ld.image).toEqual(['https://x.dev/s/dew/p/p1/image.svg']);
    expect(ld.hasMerchantReturnPolicy.merchantReturnDays).toBe(30);
  });
});

describe('whose PayPal a shop may read and write', () => {
  const env = { DEMO_PAYPAL_CLIENT_ID: 'platform-id', DEMO_PAYPAL_CLIENT_SECRET: 'platform-secret', MASTER_KEY: '' } as unknown as ConstructorParameters<typeof Store>[0];
  const base = { paypalClientId: null, paypalSecretCt: null, paypalSecretIv: null, paypalPayeeEmail: null, demo: false } as unknown as Parameters<Store['paymentMode']>[0];
  it('never hands the shared platform app to a demo or email-payout shop for imports or publishing', async () => {
    const store = new Store(env);
    const demo = { ...base, demo: true };
    const payee = { ...base, paypalPayeeEmail: 'me@shop.com' };
    expect([store.paymentMode(demo), store.paymentMode(payee)]).toEqual(['demo', 'payee']);
    expect(await store.ownPayPalFor(demo)).toBeNull();
    expect(await store.ownPayPalFor(payee)).toBeNull();
    // ...while both can still take orders through it.
    expect(await store.paypalFor(demo)).not.toBeNull();
    expect(await store.paypalFor(payee)).not.toBeNull();
  });
});

describe('product form', () => {
  const ok = { name: 'Soap', price: '8.50', imageUrl: '', stock: '' };
  it('accepts a normal product and parses it', () => {
    expect(checkProduct({ ...ok, stock: '12', imageUrl: 'https://x.dev/a.png' })).toEqual({ value: { name: 'Soap', priceCents: 850, imageUrl: 'https://x.dev/a.png', stock: 12 } });
  });
  it('rejects what used to save silently: a word for a price, zero, negative stock, a non-web image', () => {
    for (const bad of [{ price: 'abc' }, { price: '0' }, { stock: '-5' }, { stock: '2.5' }, { imageUrl: 'javascript:alert(1)' }, { name: '  ' }]) {
      expect(checkProduct({ ...ok, ...bad })).toHaveProperty('error');
    }
  });
});

describe('orders through the PayPal Server SDK', () => {
  afterEach(() => vi.unstubAllGlobals());
  // The SDK's transport is axios on its fetch adapter (Workers have no Node http), so stubbing fetch sees the wire.
  function wire(reply: (url: string) => { status: number; body: unknown }) {
    const calls: { url: string; headers: Headers; body: string }[] = [];
    vi.stubGlobal('fetch', async (input: Request | string | URL, init?: RequestInit) => {
      const req = new Request(input, init);
      calls.push({ url: req.url, headers: req.headers, body: await req.text() });
      if (req.url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'T', token_type: 'Bearer', expires_in: 3600 });
      const r = reply(req.url);
      return Response.json(r.body, { status: r.status });
    });
    return calls;
  }
  const lines = [{ name: 'Gel', sku: 'p1', quantity: 2, unitCents: 2400 }, { name: 'Review', sku: 'p2', ships: false, quantity: 1, unitCents: 9000 }];

  it('creates the order PayPal expects: snake_case wire, idempotency key, payee for email-payout shops', async () => {
    const calls = wire(() => ({ status: 201, body: { id: 'O9', status: 'PAYER_ACTION_REQUIRED', links: [{ rel: 'payer-action', href: 'https://pp/approve' }] } }));
    const pp = new PayPal({ clientId: 'sdk-test-1', clientSecret: 's', env: 'sandbox', payeeEmail: 'me@shop.com' });
    const o = await pp.createOrder({ lines, currency: 'USD', brandName: 'Dew', referenceId: 'ord_1', returnUrl: 'https://x/r', cancelUrl: 'https://x/c' });
    expect(o).toMatchObject({ id: 'O9', approveUrl: 'https://pp/approve' });
    const create = calls.find((c) => c.url === 'https://api-m.sandbox.paypal.com/v2/checkout/orders')!;
    expect(create.headers.get('paypal-request-id')).toBe('ord_1');
    expect(create.headers.get('authorization')).toBe('Bearer T');
    const body = JSON.parse(create.body);
    expect(body.purchase_units[0]).toMatchObject({ payee: { email_address: 'me@shop.com' }, amount: { value: '138.00', breakdown: { item_total: { value: '138.00' } } } });
    expect(body.purchase_units[0].items.map((i: { category: string }) => i.category)).toEqual(['PHYSICAL_GOODS', 'DIGITAL_GOODS']);
    expect(body.payment_source.paypal.experience_context).toMatchObject({ shipping_preference: 'GET_FROM_FILE', user_action: 'PAY_NOW', return_url: 'https://x/r' });
  });

  it('turns an SDK error into a readable PayPalError, and a double capture into the existing capture', async () => {
    wire((url) =>
      url.endsWith('/capture')
        ? { status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_ALREADY_CAPTURED', description: 'Order already captured.' }] } }
        : { status: 200, body: { id: 'O9', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'C9', status: 'COMPLETED' }] } }] } },
    );
    const pp = new PayPal({ clientId: 'sdk-test-2', clientSecret: 's', env: 'sandbox' });
    expect(await pp.captureOrder('O9')).toMatchObject({ status: 'COMPLETED', captureId: 'C9' });

    wire(() => ({ status: 422, body: { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'CAPTURE_FULLY_REFUNDED', description: 'The capture has already been fully refunded.' }] } }));
    const err = await pp.refundCapture('C9', 'x').catch((e) => e);
    expect(err).toBeInstanceOf(PayPalError);
    expect(err.message).toMatch(/refund the payment \(422\).*already been fully refunded/);
  });

  it('sends a known carrier as-is and anything else as OTHER with its name', async () => {
    const calls = wire(() => ({ status: 201, body: { id: 'O9', status: 'COMPLETED' } }));
    const pp = new PayPal({ clientId: 'sdk-test-3', clientSecret: 's', env: 'sandbox' });
    await pp.addTracking('O9', 'C9', '1Z999', 'usps');
    await pp.addTracking('O9', 'C9', 'AB1', 'Bob Local Couriers');
    const sent = calls.filter((c) => c.url.endsWith('/track')).map((c) => JSON.parse(c.body));
    expect(sent[0]).toMatchObject({ carrier: 'USPS', capture_id: 'C9', tracking_number: '1Z999', notify_payer: true });
    expect(sent[1]).toMatchObject({ carrier: 'OTHER', carrier_name_other: 'Bob Local Couriers' });
  });
});
