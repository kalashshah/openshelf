import 'server-only';
import type { PayPal } from './paypal';
import { requireShop } from './session';
import type { Shop, Store } from './store';

/** What every dashboard page needs, plus the banners above it. */
export async function dashboard() {
  const ctx = await requireShop();
  const pp = await ctx.store.paypalFor(ctx.shop);
  await upgradeWebhooks(ctx.store, ctx.shop, ctx.env.PUBLIC_URL);
  return { ...ctx, canTakePayments: Boolean(pp), mode: ctx.store.paymentMode(ctx.shop) };
}

/**
 * Webhooks registered before Open Shelf listened for PENDING, DENIED and REVERSED captures are patched to the
 * current event list, once per shop (its own app) and once per deployment (the demo/platform app).
 */
async function upgradeWebhooks(store: Store, shop: Shop, publicUrl: string): Promise<void> {
  const jobs: [string, () => Promise<PayPal | null>, string][] = [
    [`wh-events:v2:${shop.id}`, () => store.ownPayPalFor(shop), `${publicUrl}/webhooks/paypal/app`],
    ['wh-events:v2:demo', async () => store.demoPayPal(), `${publicUrl}/webhooks/paypal/demo`],
  ];
  for (const [key, client, url] of jobs) {
    if (await store.kvGet(key)) continue;
    const pp = await client();
    if (!pp) continue;
    try {
      await pp.upgradeWebhook(url);
      await store.kvSet(key, String(Date.now()));
    } catch (e) {
      // Tried again on the next dashboard load.
      console.error('webhook_upgrade_failed', e instanceof Error ? e.message : String(e));
    }
  }
}
