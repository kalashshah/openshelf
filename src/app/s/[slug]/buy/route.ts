import { getEnv } from '@/server/env';
import { overLimit } from '@/server/http/mcp';
import { Store, UserError } from '@/server/store';

/** The Buy with PayPal form on store and product pages: create the PayPal order, send the buyer to approve it. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const env = getEnv();
  const store = new Store(env);
  const shop = await store.shopBySlug((await params).slug);
  if (!shop) return new Response('No such store', { status: 404 });
  // Every POST opens a real PayPal order, so the store page gets the same budget as the agent's buy tool.
  if (await overLimit(env, request, 'buy')) return Response.redirect(new URL(`/s/${shop.slug}?e=${encodeURIComponent('Too many orders at once; try again in a minute.')}`, env.PUBLIC_URL), 303);
  const form = await request.formData();
  try {
    const order = await store.checkout(shop, cartFrom(form), 'web');
    return Response.redirect(order.approveUrl, 303);
  } catch (e) {
    // A PayPal outage or a misconfigured app should not show the buyer a bare 500.
    if (!(e instanceof UserError)) console.error('web_checkout_failed', e instanceof Error ? e.message : String(e));
    const message = e instanceof UserError ? e.message : 'PayPal could not start the checkout just now. Nothing was charged; try again in a moment.';
    return Response.redirect(new URL(`/s/${shop.slug}?e=${encodeURIComponent(message)}`, env.PUBLIC_URL), 303);
  }
}

/** One product (its card's Buy button) or the bag (`cart`: JSON lines). Prices are never read from the form. */
function cartFrom(form: FormData): { productId: string; options?: Record<string, string>; quantity?: number }[] {
  const raw = form.get('cart');
  if (typeof raw === 'string' && raw) {
    let lines: unknown;
    try {
      lines = JSON.parse(raw.slice(0, 20_000));
    } catch {
      throw new UserError('Your bag could not be read. Add the items again.');
    }
    if (!Array.isArray(lines) || !lines.length) throw new UserError('Your bag is empty.');
    return lines.slice(0, 20).map((l: { product_id?: unknown; options?: unknown; quantity?: unknown }) => ({
      productId: String(l?.product_id ?? ''),
      options: l?.options && typeof l.options === 'object' ? Object.fromEntries(Object.entries(l.options as Record<string, unknown>).map(([k, v]) => [k, String(v)])) : {},
      quantity: Number(l?.quantity ?? 1),
    }));
  }
  const options = Object.fromEntries([...form.entries()].filter(([k]) => k.startsWith('opt:')).map(([k, v]) => [k.slice(4), String(v)]));
  return [{ productId: String(form.get('product_id') ?? ''), options, quantity: Number(form.get('quantity') ?? 1) }];
}
