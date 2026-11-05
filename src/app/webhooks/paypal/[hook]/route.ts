import { getEnv } from '@/server/env';
import { toCents } from '@/server/paypal';
import { Store, type Order } from '@/server/store';

interface Money {
  value?: string;
  currency_code?: string;
}
interface WebhookEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    amount?: Money;
    note_to_payer?: string;
    links?: { rel: string; href: string }[];
    supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
    seller_payable_breakdown?: { total_refunded_amount?: Money };
  };
}

/**
 * PayPal webhooks: complete sales whose buyer never came back to the return page, follow captures that clear
 * late or are denied, record refunds made in PayPal (partial ones too) and reversals.
 * /webhooks/paypal/demo = the demo app's webhook; /webhooks/paypal/app = every merchant app's.
 */
export async function POST(request: Request, { params }: { params: Promise<{ hook: string }> }) {
  const env = getEnv();
  const raw = await request.text();
  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
  }
  const type = event.event_type ?? '';
  const r = event.resource ?? {};
  const store = new Store(env);
  const order = await findOrder(store, type, r);
  const shop = order ? await store.shopById(order.shopId) : null;
  // Not ours (Penny or another app on the same PayPal app): acknowledge so PayPal stops retrying.
  if (!order || !shop) return Response.json({ ok: true, ignored: true });
  // Verify with the webhook id of the URL PayPal called first: one PayPal app can carry both webhooks
  // (the demo/platform app is also a merchant's), so an event may arrive at either URL.
  const hook = (await params).hook;
  const candidates = hook === 'demo' ? [store.demoPayPal(), await store.paypalFor(shop)] : [await store.paypalFor(shop), store.demoPayPal()];
  let verified = env.WEBHOOK_VERIFY === 'off';
  for (const pp of candidates) if (!verified && pp) verified = await pp.verifyWebhook(request.headers, raw);
  if (!verified) return Response.json({ error: 'bad signature' }, { status: 401 });
  // PayPal retries until it gets a 2xx. Claim the delivery first so two at once are handled once; give the claim
  // back if handling fails, so PayPal's retry gets another go.
  const seen = event.id ? `wh:${event.id}` : null;
  if (seen && !(await store.claimKey(seen))) return Response.json({ ok: true, duplicate: true });
  try {
    if (type === 'PAYMENT.CAPTURE.REFUNDED') {
      // Refund resources carry the running total on the capture, which makes this idempotent with our own refund call.
      const total = r.seller_payable_breakdown?.total_refunded_amount?.value;
      await store.applyRefund(order.id, { refundId: r.id, cents: toCents(r.amount?.value), totalRefundedCents: total === undefined ? undefined : toCents(total) }, r.note_to_payer ?? 'Refunded in PayPal');
    } else if (type === 'PAYMENT.CAPTURE.REVERSED') {
      await store.markRefunded(order.id, 'Reversed by PayPal (a chargeback or payment reversal)');
    } else {
      await store.sync(shop, order);
    }
  } catch (e) {
    if (seen) await store.releaseKey(seen);
    throw e;
  }
  return Response.json({ ok: true });
}

/** Order events name the PayPal order; capture events name it in related_ids; refunds link "up" to their capture. */
async function findOrder(store: Store, type: string, r: NonNullable<WebhookEvent['resource']>): Promise<Order | null> {
  if (type.startsWith('CHECKOUT.ORDER.')) return r.id ? store.order(r.id) : null;
  const orderId = r.supplementary_data?.related_ids?.order_id;
  if (orderId) {
    const o = await store.order(orderId);
    if (o) return o;
  }
  const captureId =
    r.supplementary_data?.related_ids?.capture_id ??
    r.links?.find((l) => l.rel === 'up' && /\/captures\//.test(l.href))?.href.split('/captures/')[1]?.split(/[/?]/)[0] ??
    (type === 'PAYMENT.CAPTURE.REFUNDED' ? undefined : r.id);
  return captureId ? store.orderByCapture(captureId) : null;
}
