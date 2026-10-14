import { Check, Clock } from 'lucide-react';
import { Centered } from '@/components/common/centered';
import { FancyButton } from '@/components/ui/fancy-button';
import { getEnv } from '@/server/env';
import { fmt, Store } from '@/server/store';

export const dynamic = 'force-dynamic';

/** Back from PayPal: capture the approved order (webhooks and order_status do the same, whichever comes first). */
export default async function CheckoutReturn({ searchParams }: { searchParams: Promise<{ o?: string; token?: string }> }) {
  const { o, token } = await searchParams;
  const store = new Store(getEnv());
  const found = await store.order(o ?? token ?? '');
  const shop = found ? await store.shopById(found.shopId) : null;
  const order = found && shop ? await store.sync(shop, found) : null;
  const paid = order && order.status !== 'created';
  const back = shop && (
    <FancyButton asChild variant="basic">
      <a href={`/s/${shop.slug}`}>Back to {shop.name}</a>
    </FancyButton>
  );
  return paid && order ? (
    <Centered icon={<Check className="size-5 text-success-base" />} title="You’re all set" actions={back}>
      {shop?.name ?? 'The store'} has your order <span className="font-medium text-ink">{order.id}</span> for <span className="font-medium text-ink">{fmt(order.totalCents, order.currency)}</span>, paid with PayPal. If an AI agent placed it, go back to it now: it can check the order and tracking for you.
    </Centered>
  ) : (
    <Centered icon={<Clock className="size-5 text-warning-base" />} title="Almost there" actions={back}>
      PayPal hasn’t confirmed the payment yet. Give it a minute, or ask your agent to check order {order?.id ?? ''}.
    </Centered>
  );
}
