import { Receipt, RefreshCw, Truck, Undo2 } from 'lucide-react';
import { Fragment } from 'react';
import { EmptyPanel, PageBody, PageHeader, TABLE_CARD } from '@/components/app/chrome';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import * as Table from '@/components/ui/table';
import { dashboard } from '@/server/page-context';
import { fmt, type Order } from '@/server/store';
import { refundOrderAction, shipOrderAction, syncOrderAction } from '../actions';

function when(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

const STATUS: Record<Order['status'], ['completed' | 'pending' | 'failed' | 'disabled', string]> = {
  created: ['pending', 'Waiting for PayPal'],
  pending: ['pending', 'Payment clearing'],
  paid: ['completed', 'Paid'],
  shipped: ['completed', 'Shipped'],
  refunded: ['failed', 'Refunded'],
  cancelled: ['disabled', 'Cancelled'],
};

export default async function Orders({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const { store, shop, user, canTakePayments } = await dashboard();
  const { n, e } = await searchParams;
  // Checkouts nobody approved are cancelled after a few hours, so the list shows real orders.
  await store.expireStaleOrders(shop.id);
  const orders = await store.orders(shop.id, 300);
  return (
    <>
      <PageHeader title="Orders" description="Every order is a PayPal order in your account. Tracking numbers you add go to PayPal and the buyer." />
      <PageBody>
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <div className={TABLE_CARD}>
          {orders.length ? (
            <Table.Root>
              <Table.Header>
                <tr>
                  <Table.Head>Order</Table.Head>
                  <Table.Head>Items</Table.Head>
                  <Table.Head className="text-right">Total</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Buyer</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </tr>
              </Table.Header>
              <Table.Body>
                {orders.map((o, i) => (
                  <Fragment key={o.id}>
                    {i > 0 && <Table.RowDivider />}
                    <Table.Row>
                      <Table.Cell>
                        <span className="block text-label-sm text-text-strong-950">{o.id}</span>
                        <span className="block text-paragraph-xs text-text-sub-600">
                          {when(o.createdAt)} · {o.channel === 'agent' ? 'AI agent' : 'store page'}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-paragraph-xs text-text-sub-600">
                        {o.items.map((it) => (
                          <span key={it.product_id + it.variant} className="block">
                            {it.quantity} × {it.name}
                            {it.variant ? ` (${it.variant})` : ''}
                          </span>
                        ))}
                      </Table.Cell>
                      <Table.Cell className="text-right tabular-nums">{fmt(o.totalCents, o.currency)}</Table.Cell>
                      <Table.Cell>
                        <StatusBadge.Root status={STATUS[o.status][0]} variant="light">
                          <StatusBadge.Dot />
                          {STATUS[o.status][1]}
                        </StatusBadge.Root>
                      </Table.Cell>
                      <Table.Cell className="text-paragraph-xs text-text-sub-600">
                        {o.buyerName && <span className="block text-text-strong-950">{o.buyerName}</span>}
                        {o.buyerEmail && <span className="block">{o.buyerEmail}</span>}
                        {o.shipTo && <span className="block max-w-[220px] truncate">{o.shipTo}</span>}
                        {o.trackingNumber && (
                          <span className="block">
                            {o.carrier} {o.trackingNumber}
                          </span>
                        )}
                        {o.refundedCents > 0 && o.status !== 'refunded' && (
                          <span className="block">
                            Refunded {fmt(o.refundedCents, o.currency)} of {fmt(o.totalCents, o.currency)}
                          </span>
                        )}
                        {o.refundReason && (
                          <span className="block">
                            {o.status === 'cancelled' ? '' : 'Refund: '}
                            {o.refundReason}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex min-w-[260px] flex-col gap-2">
                          {o.status === 'paid' && (
                            <form action={shipOrderAction.bind(null, o.id)} className="flex gap-1.5">
                              <Input name="carrier" placeholder="Carrier" className="h-8 w-20" />
                              <Input name="tracking" placeholder="Tracking no." className="h-8" />
                              <Submit size="xsmall" pending="…">
                                <Truck className="size-4" />
                              </Submit>
                            </form>
                          )}
                          {(o.status === 'paid' || o.status === 'shipped') && (
                            <form action={refundOrderAction.bind(null, o.id)} className="flex gap-1.5">
                              <Input
                                name="amount"
                                inputMode="decimal"
                                placeholder={`All ${fmt(o.totalCents - o.refundedCents, o.currency)}`}
                                aria-label="Refund amount (leave empty to refund everything left)"
                                className="h-8 w-32"
                              />
                              <Submit variant="basic" size="xsmall" pending="Refunding…">
                                <Undo2 className="size-4" /> Refund
                              </Submit>
                            </form>
                          )}
                          {(o.status === 'created' || o.status === 'pending') && (
                            <form action={syncOrderAction.bind(null, o.id)}>
                              <Submit variant="basic" size="xsmall" pending="Checking…">
                                <RefreshCw className="size-4" /> Check PayPal
                              </Submit>
                            </form>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  </Fragment>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <EmptyPanel icon={<Receipt />} title="No orders yet" description="Orders from your store page and from shoppers’ AI agents land here, and in your PayPal." />
          )}
        </div>
      </PageBody>
    </>
  );
}
