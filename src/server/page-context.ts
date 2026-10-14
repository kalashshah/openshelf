import 'server-only';
import { requireShop } from './session';

/** What every dashboard page needs, plus the banners above it. */
export async function dashboard() {
  const ctx = await requireShop();
  const pp = await ctx.store.paypalFor(ctx.shop);
  return { ...ctx, canTakePayments: Boolean(pp), mode: ctx.store.paymentMode(ctx.shop) };
}
