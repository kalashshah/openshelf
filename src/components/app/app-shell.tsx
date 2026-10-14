'use client';

import { ExternalLink, House, LogOut, Menu, MessageCircle, Package, Receipt, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ShopMark, Wordmark } from '@/components/brand';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/app', label: 'Overview', icon: House, exact: true },
  { href: '/app/products', label: 'Products', icon: Package },
  { href: '/app/questions', label: 'Questions', icon: MessageCircle, badge: 'questions' as const },
  { href: '/app/orders', label: 'Orders', icon: Receipt },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

/**
 * The dashboard frame (llamacalls AppShell): a paper sidebar with the brand row, the pages and the shop card,
 * a drawer on phones; the page scrolls beside it.
 */
export function AppShell({ shop, unanswered, demo, children }: { shop: { name: string; slug: string; hue: number }; unanswered: number; demo: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="flex h-dvh min-h-0 bg-paper">
      <div className={cn('fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 md:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setOpen(false)} aria-hidden />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-stroke-soft-200 bg-paper',
          'transition-[transform,visibility,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          open ? 'visible translate-x-0 shadow-2xl' : 'invisible -translate-x-full',
          'md:visible md:static md:w-64 md:max-w-none md:translate-x-0 md:shadow-none md:transition-none',
        )}
      >
        <a href="/app" className="flex h-[72px] shrink-0 items-center border-b border-stroke-soft-200 px-4">
          <Wordmark />
        </a>
        <div className="p-3">
          <a href={`/s/${shop.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl bg-bg-white-0 p-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50">
            <ShopMark name={shop.name} hue={shop.hue} className="size-8 text-sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-label-sm text-text-strong-950">{shop.name}</span>
              <span className="block truncate text-paragraph-xs text-text-sub-600">{demo ? 'Demo store · sandbox' : `/s/${shop.slug}`}</span>
            </span>
            <ExternalLink className="size-3.5 shrink-0 text-text-sub-600" />
          </a>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon, exact, badge }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-label-sm transition-colors',
                active(href, exact) ? 'bg-bg-weak-50 text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200' : 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950',
              )}
            >
              <Icon className="size-4" />
              {label}
              {badge && unanswered > 0 && <span className="ml-auto rounded-full bg-warning-lighter px-2 py-0.5 text-label-xs tabular-nums text-warning-base">{unanswered}</span>}
            </a>
          ))}
        </nav>
        <div className="border-t border-stroke-soft-200 p-2">
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
              location.href = '/';
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-label-sm text-text-sub-600 transition hover:bg-bg-weak-50 hover:text-text-strong-950"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 border-b border-stroke-soft-200 px-4 py-2.5 text-left text-label-sm text-text-sub-600 md:hidden">
          <Menu className="size-4" />
          Menu
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">{children}</div>
      </div>
    </div>
  );
}
