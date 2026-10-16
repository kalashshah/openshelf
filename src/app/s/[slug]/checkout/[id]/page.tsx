import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShieldCheck, Undo2 } from 'lucide-react';
import { PayPalMark, ShopMark } from '@/components/brand';
import { FancyButton } from '@/components/ui/fancy-button';
import { hueOf, productArt } from '@/server/catalog-view';
import { getEnv } from '@/server/env';
import { fmt, priceFor, Store } from '@/server/store';

export const dynamic = 'force-dynamic';
// A link an assistant hands to a person: never indexed, and opening it creates nothing.
export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The confirm step behind a checkout link: what you're buying, then Continue to PayPal (posts to /s/:slug/buy). */
export default async function Checkout({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const query = await searchParams;
  const store = new Store(getEnv());
  const shop = await store.shopBySlug(slug);
  const p = shop ? await store.product(id) : null;
  if (!shop || !p || p.shopId !== shop.id || !p.active) notFound();
  const canBuy = Boolean(await store.paypalFor(shop));

  const one = (k: string) => {
    const v = query[k];
    return Array.isArray(v) ? v[0] : v;
  };
  // Options given in the link (matched case-insensitively); anything missing or unknown is picked on the page.
  const given = Object.fromEntries(
    p.variants.flatMap((v) => {
      const want = Object.entries(query).find(([k]) => k.toLowerCase() === v.name.toLowerCase())?.[1];
      const opt = v.options.find((o) => o.label.toLowerCase() === String(Array.isArray(want) ? want[0] : (want ?? '')).toLowerCase());
      return opt ? [[v.name, opt.label]] : [];
    }),
  );
  const open = p.variants.filter((v) => !given[v.name] && v.options.length > 1);
  const qty = Math.min(99, Math.max(1, Math.floor(Number(one('qty') ?? 1)) || 1));
  const unit = open.length ? null : priceFor(p, given).unitCents;
  const soldOut = p.stock === 0;

  return (
    <div className="min-h-screen bg-paper px-4 py-10 md:py-16">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <a href={`/s/${shop.slug}`} className="flex items-center gap-2.5 self-start">
          <ShopMark name={shop.name} hue={hueOf(shop.name)} className="size-8 text-sm" />
          <span className="text-[15px] font-semibold text-ink">{shop.name}</span>
        </a>
        <form method="post" action={`/s/${shop.slug}/buy`} className="overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
          <input type="hidden" name="product_id" value={p.id} />
          {Object.entries(given).map(([k, v]) => (
            <input key={k} type="hidden" name={`opt:${k}`} value={v} />
          ))}
          <div className="relative aspect-[16/9] bg-paper">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="absolute inset-0 size-full bg-white object-contain p-4" />
            ) : (
              <div className="absolute inset-0 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: productArt(p, shop.name.trim().charAt(0).toUpperCase()) }} />
            )}
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">{p.name}</h1>
              {p.description && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</p>}
            </div>
            {Object.keys(given).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(given).map(([k, v]) => (
                  <span key={k} className="rounded-lg bg-paper px-2.5 py-1 text-xs text-ink ring-1 ring-line">
                    <span className="text-muted">{k}:</span> {v}
                  </span>
                ))}
              </div>
            )}
            {open.map((v) => (
              <label key={v.name} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">{v.name}</span>
                <select name={`opt:${v.name}`} className="h-10 rounded-10 bg-card px-3 text-sm text-ink ring-1 ring-line">
                  {v.options.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                      {o.price_cents !== undefined ? ` · ${fmt(o.price_cents, shop.currency)}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <label className="flex items-center gap-2 text-sm text-muted">
                Qty
                <select name="quantity" defaultValue={qty} className="h-9 rounded-lg bg-card px-2 text-sm text-ink ring-1 ring-line">
                  {Array.from({ length: Math.max(10, qty) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-right">
                <span className="block text-xl font-semibold tabular-nums text-ink">{unit === null ? `from ${fmt(p.priceCents, shop.currency)}` : fmt(unit, shop.currency)}</span>
                <span className="text-xs text-muted">{p.needsShipping ? 'each, shipping included' : 'each, nothing is shipped'}</span>
              </span>
            </div>
            <FancyButton variant="primary" size="medium" className="w-full" disabled={soldOut || !canBuy}>
              <PayPalMark white className="size-4" />
              {soldOut ? 'Sold out' : canBuy ? 'Continue to PayPal' : 'This store isn’t taking payments yet'}
            </FancyButton>
            <div className="flex flex-col gap-1.5 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> You approve the payment in PayPal. Nothing is charged until you do.
              </span>
              {shop.refundDays > 0 && (
                <span className="flex items-center gap-1.5">
                  <Undo2 className="size-3.5" /> Refunds within {shop.refundDays} days of payment.
                </span>
              )}
            </div>
          </div>
        </form>
        <a href={`/s/${shop.slug}/p/${p.id}`} className="self-center text-xs text-muted underline underline-offset-2">
          See the full product page
        </a>
      </div>
    </div>
  );
}
