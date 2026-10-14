import { X } from 'lucide-react';
import { Centered } from '@/components/common/centered';
import { FancyButton } from '@/components/ui/fancy-button';
import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

export const dynamic = 'force-dynamic';

export default async function CheckoutCancel({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const store = new Store(getEnv());
  const order = await store.order((await searchParams).o ?? '');
  if (order) await store.markCancelled(order.id);
  const shop = order ? await store.shopById(order.shopId) : null;
  return (
    <Centered
      icon={<X className="size-5 text-text-sub-600" />}
      title="Checkout cancelled"
      actions={
        shop && (
          <FancyButton asChild variant="basic">
            <a href={`/s/${shop.slug}`}>Back to {shop.name}</a>
          </FancyButton>
        )
      }
    >
      Nothing was charged. You can close this tab.
    </Centered>
  );
}
