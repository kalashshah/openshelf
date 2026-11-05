'use client';

import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PayPalMark } from '@/components/brand';
import { FancyButton } from '@/components/ui/fancy-button';

export interface CartLine {
  productId: string;
  name: string;
  /** Chosen option per variant, as the buy route expects them. */
  options: Record<string, string>;
  quantity: number;
  /** Shown only; the server prices the order from the catalog again. */
  unitCents: number;
}

interface Cart {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (index: number, quantity: number) => void;
  remove: (index: number) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<Cart | null>(null);

const sameLine = (a: CartLine, b: CartLine) => a.productId === b.productId && JSON.stringify(a.options) === JSON.stringify(b.options);
const optionText = (o: Record<string, string>) => Object.values(o).filter(Boolean).join(', ');

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** A bag for people buying several things in one PayPal checkout. Kept in this browser only (per store). */
export function CartProvider({ slug, currency, canBuy, children }: { slug: string; currency: string; canBuy: boolean; children: React.ReactNode }) {
  const key = `openshelf:cart:${slug}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? '[]') as CartLine[];
      if (Array.isArray(saved)) setLines(saved.slice(0, 20));
    } catch {
      // Private mode or a corrupt value: start with an empty bag.
    }
  }, [key]);
  const save = useCallback(
    (next: CartLine[]) => {
      setLines(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage unavailable: the bag still works until the page reloads.
      }
    },
    [key],
  );
  const cart = useMemo<Cart>(
    () => ({
      lines,
      open,
      setOpen,
      add: (line) => {
        const i = lines.findIndex((l) => sameLine(l, line));
        if (i >= 0) save(lines.map((l, k) => (k === i ? { ...l, quantity: Math.min(99, l.quantity + line.quantity) } : l)));
        else save([...lines, line].slice(0, 20));
        setOpen(true);
      },
      setQty: (index, quantity) => save(lines.map((l, k) => (k === index ? { ...l, quantity: Math.max(1, Math.min(99, quantity)) } : l))),
      remove: (index) => save(lines.filter((_, k) => k !== index)),
    }),
    [lines, open, save],
  );
  return (
    <CartContext.Provider value={cart}>
      {children}
      <Bag slug={slug} currency={currency} canBuy={canBuy} />
    </CartContext.Provider>
  );
}

export function useCart(): Cart | null {
  return useContext(CartContext);
}

function Bag({ slug, currency, canBuy }: { slug: string; currency: string; canBuy: boolean }) {
  const cart = useCart();
  if (!cart || !cart.lines.length) return null;
  const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
  const total = cart.lines.reduce((n, l) => n + l.quantity * l.unitCents, 0);
  const payload = JSON.stringify(cart.lines.map((l) => ({ product_id: l.productId, options: l.options, quantity: l.quantity })));
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="w-full max-w-md overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
        {cart.open && (
          <ul className="max-h-[45vh] divide-y divide-line overflow-y-auto">
            {cart.lines.map((l, i) => (
              <li key={`${l.productId}${optionText(l.options)}`} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                  <p className="truncate text-xs text-muted">
                    {optionText(l.options) && `${optionText(l.options)} · `}
                    {money(l.unitCents, currency)}
                  </p>
                </div>
                <div className="flex h-8 shrink-0 items-center rounded-lg ring-1 ring-line">
                  <button type="button" aria-label="Fewer" onClick={() => (l.quantity > 1 ? cart.setQty(i, l.quantity - 1) : cart.remove(i))} className="flex size-8 items-center justify-center text-muted hover:text-ink">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm tabular-nums text-ink">{l.quantity}</span>
                  <button type="button" aria-label="More" onClick={() => cart.setQty(i, l.quantity + 1)} className="flex size-8 items-center justify-center text-muted hover:text-ink">
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button type="button" aria-label={`Remove ${l.name}`} onClick={() => cart.remove(i)} className="text-muted hover:text-ink">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form method="post" action={`/s/${slug}/buy`} className="flex items-center gap-2 border-t border-line bg-bg-weak-50 px-4 py-3 first:border-t-0">
          <input type="hidden" name="cart" value={payload} />
          <button type="button" onClick={() => cart.setOpen(!cart.open)} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={cart.open}>
            <ShoppingBag className="size-4 shrink-0 text-ink" />
            <span className="truncate text-sm text-ink">
              <span className="font-semibold">
                {count} {count === 1 ? 'item' : 'items'}
              </span>{' '}
              · {money(total, currency)}
            </span>
            <span className="text-xs text-muted underline underline-offset-2">{cart.open ? 'Hide' : 'View bag'}</span>
          </button>
          <FancyButton variant="primary" size="small" disabled={!canBuy}>
            <PayPalMark white className="size-4" />
            Check out
          </FancyButton>
        </form>
      </div>
    </div>
  );
}
