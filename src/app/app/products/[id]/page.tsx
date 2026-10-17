import { ChevronLeft, Package, Radar, Trash2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { FieldRow, PageBody, PageHeader, SectionCard } from '@/components/app/chrome';
import { FormSwitch } from '@/components/app/form-switch';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { FancyButton } from '@/components/ui/fancy-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/server/page-context';
import { fmt } from '@/server/store';
import { variantText } from '@/server/variants';
import { deleteProductAction, saveProductAction } from '../../actions';

export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ n?: string; e?: string }> }) {
  const { id } = await params;
  const { n, e } = await searchParams;
  const { store, shop, user, canTakePayments } = await dashboard();
  const p = id === 'new' ? null : await store.product(id);
  if (id !== 'new' && (!p || p.shopId !== shop.id)) notFound();
  const save = saveProductAction.bind(null, id);
  return (
    <>
      <PageHeader
        title={p ? p.name : 'New product'}
        description={p ? `${fmt(p.priceCents, shop.currency)} · ${p.active ? 'on the shelf' : 'hidden'}` : 'What your store agent knows and shoppers can buy.'}
        leading={
          <FancyButton asChild variant="basic" size="xsmall">
            <a href="/app/products" aria-label="Back to products">
              <ChevronLeft className="size-4" />
            </a>
          </FancyButton>
        }
        actions={
          p?.paypalLinkUrl && (
            <FancyButton asChild variant="basic" size="small">
              <a href={p.paypalLinkUrl} target="_blank" rel="noreferrer">
                PayPal link
              </a>
            </FancyButton>
          )
        }
      />
      <PageBody>
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <form action={save}>
          <SectionCard icon={<Package />} title="Product" description="The store agent quotes the description, so say who it suits, sizes, materials or ingredients." footer={<Submit pending="Saving…">Save product</Submit>}>
            <div className="grid gap-5 pt-2">
              <FieldRow label="Name" htmlFor="name">
                <Input id="name" name="name" required maxLength={127} defaultValue={p?.name} />
              </FieldRow>
              <FieldRow label={`Price (${shop.currency})`} htmlFor="price" hint="Options with their own price override it.">
                <Input id="price" name="price" required inputMode="decimal" pattern="\$?[0-9]+([.][0-9]{1,2})?" title="A number like 24 or 24.50" defaultValue={p ? (p.priceCents / 100).toFixed(2) : ''} />
              </FieldRow>
              <FieldRow label="Description" htmlFor="description" wide>
                <Textarea id="description" name="description" rows={5} defaultValue={p?.description} />
              </FieldRow>
              <FieldRow label="Image URL" htmlFor="image_url" hint="Blank shows an illustrated packshot.">
                <Input id="image_url" name="image_url" type="url" defaultValue={p?.imageUrl ?? ''} />
              </FieldRow>
              <FieldRow label="Stock" htmlFor="stock" hint="Blank means not tracked.">
                <Input id="stock" name="stock" type="number" min={0} step={1} defaultValue={p?.stock ?? ''} />
              </FieldRow>
              <FieldRow label="Options" htmlFor="variants" hint={'One per line: “Name: choice | choice=price”.'}>
                <Textarea id="variants" name="variants" rows={3} className="font-mono text-paragraph-sm" placeholder={'Size: 50 ml=24.00 | 100 ml=38.00\nScent: Unscented | Lavender'} defaultValue={p ? variantText(p.variants) : ''} />
              </FieldRow>
              <FieldRow label="On the shelf" hint="Agents and shoppers can see and buy it.">
                <FormSwitch name="active" defaultChecked={!p || p.active} />
              </FieldRow>
              <FieldRow label="Ships to the buyer" hint="Turn off for services and digital products: no address is asked.">
                <FormSwitch name="ships" defaultChecked={!p || p.needsShipping} />
              </FieldRow>
            </div>
          </SectionCard>
        </form>
        {p && (
          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard
              icon={<Radar />}
              title="Price check"
              description={p.channel3Id ? (p.market ? `Other stores charge ${fmt(p.market.minCents, shop.currency)}${p.market.maxCents !== p.market.minCents ? `–${fmt(p.market.maxCents, shop.currency)}` : ''} at ${p.market.retailers} ${p.market.retailers === 1 ? 'store' : 'stores'} (Channel3).` : 'Matched on Channel3; no live prices elsewhere right now.') : 'Selling a brand-name product? Match it in Channel3’s product graph to see what other stores charge.'}
              footer={
                <FancyButton asChild variant="basic" size="xsmall">
                  <a href={`/app/products/${p.id}/match`}>{p.channel3Id ? 'Change match' : 'Find on Channel3'}</a>
                </FancyButton>
              }
            />
            <SectionCard
              icon={<Trash2 />}
              tone="error"
              title="Delete product"
              description="Removes it from your shelf, your store agent and agents’ searches. Orders already placed stay."
              footer={
                <form action={deleteProductAction.bind(null, p.id)}>
                  <Submit variant="destructive" size="xsmall" pending="Deleting…">
                    Delete
                  </Submit>
                </form>
              }
            />
          </div>
        )}
      </PageBody>
    </>
  );
}
