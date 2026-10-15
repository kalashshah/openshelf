'use client';

import { Minus, MessageCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import { PayPalMark } from '@/components/brand';
import { FancyButton } from '@/components/ui/fancy-button';
import { cn } from '@/lib/utils';

export interface CardProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  art: string;
  stock: number | null;
  needsShipping: boolean;
  variants: { name: string; options: { label: string; price_cents?: number }[] }[];
  marketMinCents: number | null;
}

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** A product with its options, quantity and Buy with PayPal (posts to /s/:slug/buy). `wide` = the product page layout. */
export function ProductCard({ p, slug, currency, canBuy, wide = false }: { p: CardProduct; slug: string; currency: string; canBuy: boolean; wide?: boolean }) {
  const [picked, setPicked] = useState<Record<string, string>>(() => Object.fromEntries(p.variants.map((v) => [v.name, v.options[0]?.label ?? ''])));
  const [qty, setQty] = useState(1);
  const unit = p.variants.reduce((c, v) => v.options.find((o) => o.label === picked[v.name])?.price_cents ?? c, p.priceCents);
  const soldOut = p.stock === 0;
  const flag = soldOut ? ['Sold out', 'text-error-base'] : p.stock !== null && p.stock <= 10 ? [`Only ${p.stock} left`, 'text-warning-base'] : !p.needsShipping ? ['Service', 'text-muted'] : null;

  return (
    <article id={p.id} className={cn('group flex scroll-mt-24 flex-col overflow-hidden rounded-20 bg-card shadow-regular-xs ring-1 ring-line transition hover:shadow-card target:ring-2 target:ring-marker', wide && 'md:grid md:grid-cols-[1.1fr_1fr]')}>
      <div className={cn('relative overflow-hidden bg-paper', wide ? 'aspect-[4/3] md:aspect-auto md:min-h-[420px]' : 'aspect-[4/3]')}>
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.name} loading="lazy" className="absolute inset-0 size-full bg-white object-contain p-4 transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.03] [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: p.art }} />
        )}
        {flag && <span className={cn('absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium shadow-sm ring-1 ring-line backdrop-blur', flag[1])}>{flag[0]}</span>}
      </div>
      <form method="post" action={`/s/${slug}/buy`} className="flex flex-1 flex-col">
        <input type="hidden" name="product_id" value={p.id} />
        <input type="hidden" name="quantity" value={qty} />
        {Object.entries(picked).map(([k, v]) => (
          <input key={k} type="hidden" name={`opt:${k}`} value={v} />
        ))}
        <div className={cn('flex flex-1 flex-col gap-3', wide ? 'p-6 md:p-8' : 'p-4')}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {wide ? (
                <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.025em] text-ink">{p.name}</h1>
              ) : (
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                  <a href={`/s/${slug}/p/${p.id}`} className="hover:underline">
                    {p.name}
                  </a>
                </h3>
              )}
              <p className={cn('mt-1 font-semibold tabular-nums text-ink', wide ? 'text-xl' : 'text-[15px]')}>{money(unit, currency)}</p>
            </div>
            <div className="flex h-8 shrink-0 items-center rounded-lg bg-card ring-1 ring-line">
              <button type="button" aria-label="Fewer" onClick={() => setQty((n) => Math.max(1, n - 1))} className="flex size-8 items-center justify-center text-muted hover:text-ink">
                <Minus className="size-3.5" />
              </button>
              <span className="w-5 text-center text-sm tabular-nums text-ink">{qty}</span>
              <button type="button" aria-label="More" onClick={() => setQty((n) => Math.min(99, n + 1))} className="flex size-8 items-center justify-center text-muted hover:text-ink">
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
          {p.marketMinCents !== null && p.marketMinCents > unit && (
            <span className="self-start rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">Below retail · {money(p.marketMinCents, currency)}+ elsewhere</span>
          )}
          <p className={cn('text-sm leading-relaxed text-muted', wide ? 'whitespace-pre-line' : 'line-clamp-3')}>{p.description}</p>
          {p.variants.map((v) => (
            <div key={v.name} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">{v.name}</span>
              <div className="flex flex-wrap gap-1.5">
                {v.options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setPicked((s) => ({ ...s, [v.name]: o.label }))}
                    className={cn('rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition', picked[v.name] === o.label ? 'bg-primary-base text-static-white ring-transparent' : 'bg-card text-muted ring-line hover:text-ink')}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={cn('mt-auto flex items-center gap-2 border-t border-line bg-bg-weak-50', wide ? 'px-6 py-4 md:px-8' : 'px-4 py-3')}>
          <FancyButton variant="primary" size="small" className="flex-1" disabled={soldOut || !canBuy}>
            <PayPalMark white className="size-4" />
            {soldOut ? 'Sold out' : 'Buy with PayPal'}
          </FancyButton>
          <FancyButton type="button" variant="basic" size="small" onClick={() => window.dispatchEvent(new CustomEvent('ask-about', { detail: { id: p.id, name: p.name } }))}>
            <MessageCircle className="size-4" />
            Ask
          </FancyButton>
        </div>
      </form>
    </article>
  );
}
