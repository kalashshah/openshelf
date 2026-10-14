import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

/**
 * PayPal webhooks: complete sales whose buyer never came back to the return page, record refunds.
 * /webhooks/paypal/demo = the demo app's webhook; /webhooks/paypal/app = every merchant app's.
 */
export async function POST(request: Request, { params }: { params: Promise<{ hook: string }> }) {
  const env = getEnv();
  const raw = await request.text();
  const event = JSON.parse(raw) as { event_type?: string; resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } } };
  const orderId = event.event_type === 'CHECKOUT.ORDER.APPROVED' ? event.resource?.id : event.resource?.supplementary_data?.related_ids?.order_id;
  const store = new Store(env);
  const order = orderId ? await store.order(orderId) : null;
  const shop = order ? await store.shopById(order.shopId) : null;
  // Not ours (Penny or another app on the same PayPal app): acknowledge so PayPal stops retrying.
  if (!order || !shop) return Response.json({ ok: true, ignored: true });
  // Verify with the webhook id of the URL PayPal called: an app connected to both carries two webhooks.
  const pp = (await params).hook === 'demo' ? store.demoPayPal() : await store.paypalFor(shop);
  if (env.WEBHOOK_VERIFY !== 'off' && !(pp && (await pp.verifyWebhook(request.headers, raw)))) return Response.json({ error: 'bad signature' }, { status: 401 });
  if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') await store.markRefunded(order.id, null);
  else await store.sync(shop, order);
  return Response.json({ ok: true });
}
