import { ChevronLeft, Search } from 'lucide-react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { EmptyPanel, PageBody, PageHeader } from '@/components/app/chrome';
import { Submit } from '@/components/app/submit';
import { Alert } from '@/components/ui/alert';
import { FancyButton } from '@/components/ui/fancy-button';
import { Input } from '@/components/ui/input';
import { brandOf, mainImage, marketOf, searchProducts, type C3Product } from '@/server/channel3';
import { overLimit } from '@/server/http/mcp';
import { dashboard } from '@/server/page-context';
import { fmt } from '@/server/store';
import { matchProductAction } from '../../../actions';

export default async function Match({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }> }) {
  const { id } = await params;
  const { env, store, shop } = await dashboard();
  const p = await store.product(id);
  if (!p || p.shopId !== shop.id) notFound();
  const q = (await searchParams).q?.trim() || p.name;
  let results: C3Product[] = [];
  let error = '';
  if (await overLimit(env, await headers(), 'channel3')) error = 'Too many searches at once; try again in a minute.';
  else
    try {
      results = await searchProducts(env, q, 8);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  const pick = matchProductAction.bind(null, p.id);
  return (
    <>
      <PageHeader
        title="Price check"
        description={`Pick the same item as ${p.name} in Channel3’s product graph. Only its price elsewhere is kept.`}
        leading={
          <FancyButton asChild variant="basic" size="xsmall">
            <a href={`/app/products/${p.id}`} aria-label="Back">
              <ChevronLeft className="size-4" />
            </a>
          </FancyButton>
        }
      />
      <PageBody>
        <form className="flex max-w-xl gap-2">
          <Input name="q" defaultValue={q} />
          <FancyButton variant="basic" size="medium" className="shrink-0">
            <Search className="size-4" /> Search
          </FancyButton>
        </form>
        {error && <Alert>{error}</Alert>}
        {!results.length && !error ? (
          <EmptyPanel icon={<Search />} title="No close matches" description="Handmade or own-brand products won’t be in the catalog, which is fine." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((r) => {
              const img = mainImage(r);
              const m = marketOf(r, shop.currency);
              return (
                <form key={r.id} action={pick} className="flex flex-col overflow-hidden rounded-20 bg-bg-white-0 shadow-fancy-buttons-stroke">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="aspect-square bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img && <img src={img} alt={r.title} className="size-full object-contain" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 border-t border-stroke-soft-200 p-4">
                    <span className="text-paragraph-xs text-text-sub-600">{brandOf(r)}</span>
                    <span className="text-label-sm text-text-strong-950">{r.title}</span>
                    <span className="text-paragraph-xs text-text-sub-600">{m ? `${fmt(m.minCents, shop.currency)}${m.maxCents !== m.minCents ? `–${fmt(m.maxCents, shop.currency)}` : ''} at ${m.retailers} ${m.retailers === 1 ? 'store' : 'stores'}` : 'No live offers'}</span>
                  </div>
                  <div className="border-t border-stroke-soft-200 bg-bg-weak-50 px-4 py-3">
                    <Submit size="xsmall">Same product</Submit>
                  </div>
                </form>
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}
