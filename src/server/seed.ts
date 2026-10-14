import type { Env } from './env';
import { Store, type Shop, type Variant } from './store';

/**
 * The demo merchant: a small skincare brand. Some facts are deliberately left out (shelf life, pregnancy safety,
 * SPF reapplication) so the "store agent doesn't know → merchant inbox" loop shows up in a demo.
 */
export const DEMO_SHOP = {
  name: 'Dewdrop Skincare',
  tagline: 'Small-batch skincare for oily and combination skin, made in Austin.',
  about: `We are a two-person skincare studio in Austin, Texas. Everything is made in batches of 200.
Skin types: our Gel line is formulated for oily and combination skin; the Barrier line is for dry and sensitive skin.
Everything is vegan and cruelty-free, and nothing contains added fragrance except the Rose Clay Mask, which uses rose essential oil.
Non-comedogenic: the Oil-Free Gel Moisturizer and the Clarifying Gel Cleanser were tested non-comedogenic by an independent lab.
Shipping: US only for now. Orders ship within 2 business days by USPS Ground Advantage (3–5 days). Free shipping is included in every price.
Returns: unopened or opened, within 30 days, refunded to your PayPal.`,
};

const P = (name: string, price: number, description: string, stock: number | null, variants: Variant[] = []) => ({ name, priceCents: Math.round(price * 100), description, stock, variants });

export const DEMO_PRODUCTS = [
  P(
    'Oil-Free Gel Moisturizer',
    24,
    'Lightweight water-gel moisturizer for oily and combination skin. Niacinamide 4% to help balance oil and refine the look of pores, hyaluronic acid for hydration, green tea extract. Absorbs in under a minute with a matte finish. Non-comedogenic.',
    42,
    [{ name: 'Size', options: [{ label: '50 ml', price_cents: 2400 }, { label: '100 ml', price_cents: 3800 }] }],
  ),
  P('Clarifying Gel Cleanser', 18, 'Daily gel cleanser with 0.5% salicylic acid (BHA) and zinc PCA. Removes oil and sunscreen without stripping. pH 5.2. For oily, combination and acne-prone skin.', 60, [
    { name: 'Size', options: [{ label: '150 ml' }] },
  ]),
  P('Daily Mineral Sunscreen SPF 40', 29, 'Zinc oxide 18% mineral sunscreen with a sheer tint that blends into light and medium skin tones. Leaves a soft matte finish. Water-resistant for 40 minutes.', 7),
  P('Rose Clay Mask', 22, 'Kaolin and French pink clay mask with rose essential oil. Use once or twice a week for 10 minutes to absorb excess oil. Not recommended for very dry skin.', 25),
  P('Barrier Repair Cream', 32, 'Rich cream with ceramides, cholesterol and squalane for dry and sensitive skin. Fragrance-free. Too heavy for most oily skin types.', 30, [
    { name: 'Size', options: [{ label: '50 ml' }] },
  ]),
  P('Oily Skin Starter Set', 58, 'The Clarifying Gel Cleanser (150 ml), the Oil-Free Gel Moisturizer (50 ml) and the Daily Mineral Sunscreen SPF 40, in a recycled-paper box. Saves $13 against buying them separately.', 12),
];

export async function seedShop(store: Store, shop: Shop): Promise<void> {
  for (const p of DEMO_PRODUCTS) await store.saveProduct(shop.id, { ...p, source: 'demo' });
}

/** The listed showcase store every agent can find through the directory. Created on first need; checks out through the demo PayPal app. */
export async function ensureShowcase(env: Env): Promise<Shop> {
  const store = new Store(env);
  const found = await store.shopBySlug('dewdrop');
  if (found) return found;
  const shop = await store.createShop('system:showcase', 'Dewdrop', { demo: true, listed: true, tagline: DEMO_SHOP.tagline, about: DEMO_SHOP.about });
  await store.updateShop(shop, { name: DEMO_SHOP.name });
  await seedShop(store, shop);
  return (await store.shopById(shop.id)) as Shop;
}
