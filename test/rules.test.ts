import { describe, expect, it } from 'vitest';
import { pageDigest } from '../src/agent';
import { parseVariantText, variantText } from '../src/pages';
import { orderTotalCents, toOrder, toPayLink } from '../src/paypal';
import { priceFor, rank, refundPolicy, UserError } from '../src/store';
import { kindOf } from '../src/storefront';

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
    const o = toOrder({
      id: 'O1',
      status: 'COMPLETED',
      payer: { name: { given_name: 'Ana', surname: 'Diaz' }, email_address: 'ana@example.com' },
      purchase_units: [{ shipping: { address: { address_line_1: '1 Main St', admin_area_2: 'Austin', admin_area_1: 'TX', postal_code: '78701', country_code: 'US' } }, payments: { captures: [{ id: 'C1', status: 'COMPLETED' }] } }],
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
