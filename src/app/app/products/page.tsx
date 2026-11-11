import { Fragment } from 'react';
import { FileText, Globe, Link2, Package, Plus, Receipt, Upload } from 'lucide-react';
import { EmptyPanel, PageBody, PageHeader, TABLE_CARD } from '@/components/app/chrome';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { BrandIcon } from '@/components/ui/brand-icon';
import { FancyButton } from '@/components/ui/fancy-button';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import * as Table from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { productArt } from '@/server/catalog-view';
import { dashboard } from '@/server/page-context';
import { fmt } from '@/server/store';
import { variantText } from '@/server/variants';
import { importInvoicesAction, importPayLinksAction, importTextAction, importUrlAction, publishLinksAction } from '../actions';

/** A plain icon on the same tile as a brand logo. */
function Tile({ icon }: { icon: React.ReactNode }) {
  return <span className="flex size-7 items-center justify-center rounded-lg bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 [&>svg]:size-3.5">{icon}</span>;
}

/** One way to bring products in: who's involved, what it does, and its form pinned to the bottom. */
function ImportCard({ marks, title, description, children }: { marks: React.ReactNode[]; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-20 bg-bg-white-0 p-4 shadow-fancy-buttons-stroke transition-shadow hover:shadow-regular-md">
      <span className="flex items-center gap-1.5">{marks}</span>
      <div>
        <h3 className="text-label-sm text-text-strong-950">{title}</h3>
        <p className="mt-1 text-paragraph-xs leading-relaxed text-text-sub-600">{description}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </section>
  );
}

export default async function Products({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const { store, shop, user, canTakePayments, mode } = await dashboard();
  const { n, e } = await searchParams;
  const products = await store.products(shop.id, { includeInactive: true });
  const initial = shop.name.trim().charAt(0).toUpperCase();
  return (
    <>
      <PageHeader
        title="Products"
        description="Everything your store agent knows and sells. Bring in what you already have, then tidy it up."
        actions={
          <>
            {mode === 'app' && products.some((p) => !p.paypalLinkId) && (
              <form action={publishLinksAction} className="hidden sm:block">
                <Submit variant="basic" pending="Creating links…">
                  <Link2 className="size-4" /> Create PayPal links
                </Submit>
              </form>
            )}
            <FancyButton asChild variant="primary" size="small">
              <a href="/app/products/new">
                <Plus className="size-4" /> Add product
              </a>
            </FancyButton>
          </>
        }
      />
      <PageBody>
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-label-md text-text-strong-950">Bring in your products</h2>
            <p className="text-paragraph-xs text-text-sub-600">Use any of these, as often as you like. Imports add to what’s already here.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ImportCard marks={[<BrandIcon key="p" name="paypal" size="sm" />]} title="PayPal payment links" description="Every payment link becomes a product, with its price and options.">
              <form action={importPayLinksAction}>
                <Submit variant="basic" pending="Importing…" className="w-full">
                  <Upload className="size-4" /> Import links
                </Submit>
              </form>
            </ImportCard>
            <ImportCard marks={[<BrandIcon key="p" name="paypal" size="sm" />, <BrandIcon key="c" name="openai" size="sm" />]} title="PayPal invoices" description="Sell services? AI turns what you’ve invoiced into offerings agents can book.">
              <form action={importInvoicesAction}>
                <Submit variant="basic" pending="Reading invoices…" className="w-full">
                  <Receipt className="size-4" /> Import invoices
                </Submit>
              </form>
            </ImportCard>
            <ImportCard marks={[<BrandIcon key="s" name="shopify" size="sm" />, <Tile key="g" icon={<Globe />} />]} title="Shopify or any shop page" description="Shopify stores convert exactly. AI reads any other page.">
              <form action={importUrlAction} className="flex flex-col gap-2">
                <Input name="url" type="url" required placeholder="https://yourshop.com" />
                <Submit variant="basic" pending="Importing…" className="w-full">
                  <Globe className="size-4" /> Import from URL
                </Submit>
              </form>
            </ImportCard>
            <ImportCard marks={[<Tile key="f" icon={<FileText />} />, <BrandIcon key="c" name="openai" size="sm" />]} title="A price list or CSV" description="Paste anything with names and prices. AI sorts it out.">
              <form action={importTextAction} className="flex flex-col gap-2">
                <Textarea name="text" required rows={2} placeholder={'Lavender soap bar, $8, 100 g\nGift box of 3 soaps, $21'} />
                <Submit variant="basic" pending="Reading…" className="w-full">
                  <FileText className="size-4" /> Read it with AI
                </Submit>
              </form>
            </ImportCard>
          </div>
        </div>

        <div className={TABLE_CARD}>
          {products.length ? (
            <Table.Root>
              <Table.Header>
                <tr>
                  <Table.Head>Product</Table.Head>
                  <Table.Head className="text-right">Price</Table.Head>
                  <Table.Head className="text-right">Elsewhere</Table.Head>
                  <Table.Head>Options</Table.Head>
                  <Table.Head className="text-right">Stock</Table.Head>
                  <Table.Head>Source</Table.Head>
                </tr>
              </Table.Header>
              <Table.Body>
                {products.map((p, i) => (
                  <Fragment key={p.id}>
                    {i > 0 && <Table.RowDivider />}
                    <Table.Row>
                      <Table.Cell>
                        <a href={`/app/products/${p.id}`} className="flex min-w-[240px] items-center gap-3">
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt="" className="size-full bg-white object-contain p-0.5" />
                            ) : (
                              <span className="absolute inset-0 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: productArt(p, initial) }} />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-label-sm text-text-strong-950">{p.name}</span>
                            <span className="block max-w-[360px] truncate text-paragraph-xs text-text-sub-600">{p.description}</span>
                          </span>
                        </a>
                      </Table.Cell>
                      <Table.Cell className="text-right tabular-nums">{fmt(p.priceCents, shop.currency)}</Table.Cell>
                      <Table.Cell className="text-right">
                        {p.market ? (
                          <span className="text-paragraph-xs tabular-nums text-text-sub-600">
                            {fmt(p.market.minCents, shop.currency)}
                            {p.market.maxCents !== p.market.minCents ? `–${fmt(p.market.maxCents, shop.currency)}` : ''}
                          </span>
                        ) : (
                          <a href={`/app/products/${p.id}/match`} className="text-paragraph-xs text-text-sub-600 underline underline-offset-2">
                            Check
                          </a>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-paragraph-xs text-text-sub-600">{variantText(p.variants, shop.currency).replace(/\n/g, '; ') || '—'}</Table.Cell>
                      <Table.Cell className="text-right tabular-nums">
                        {p.stock === null ? (
                          <span className="text-text-soft-400">∞</span>
                        ) : p.stock === 0 ? (
                          <StatusBadge.Root status="failed" variant="light">
                            Sold out
                          </StatusBadge.Root>
                        ) : (
                          p.stock
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {!p.active && (
                            <StatusBadge.Root status="disabled" variant="light">
                              Hidden
                            </StatusBadge.Root>
                          )}
                          <StatusBadge.Root status="disabled" variant="stroke">
                            {p.source.replace('_', ' ')}
                          </StatusBadge.Root>
                          {!p.needsShipping && (
                            <StatusBadge.Root status="pending" variant="light">
                              Service
                            </StatusBadge.Root>
                          )}
                          {p.paypalLinkUrl && (
                            <a href={p.paypalLinkUrl} target="_blank" rel="noreferrer" className="text-paragraph-xs text-text-sub-600 underline underline-offset-2">
                              PayPal link
                            </a>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  </Fragment>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <EmptyPanel icon={<Package />} title="No products yet" description="Import them from PayPal, a website or a pasted list above, or add one by hand." />
          )}
        </div>
      </PageBody>
    </>
  );
}
