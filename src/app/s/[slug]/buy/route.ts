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
  const options = Object.fromEntries([...form.entries()].filter(([k]) => k.startsWith('opt:')).map(([k, v]) => [k.slice(4), String(v)]));
  try {
    const order = await store.checkout(shop, [{ productId: String(form.get('product_id') ?? ''), options, quantity: Number(form.get('quantity') ?? 1) }], 'web');
    return Response.redirect(order.approveUrl, 303);
  } catch (e) {
    if (e instanceof UserError) return Response.redirect(new URL(`/s/${shop.slug}?e=${encodeURIComponent(e.message)}`, env.PUBLIC_URL), 303);
    throw e;
  }
}
