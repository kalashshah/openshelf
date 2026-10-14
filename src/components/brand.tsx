import { cn } from '@/lib/utils';

/** The Open Shelf mark: two shelves on a plate. */
export function ShelfMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-lg bg-bg-strong-950 text-static-white', className ?? 'size-8')}>
      <svg viewBox="0 0 24 24" className="size-[60%]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
        <path d="M4 9h16M4 17h16" />
        <rect x="6.5" y="4" width="4" height="5" rx="1" fill="currentColor" stroke="none" />
        <rect x="12.5" y="12" width="5" height="5" rx="1" fill="#a897ff" stroke="none" />
      </svg>
    </span>
  );
}

export function Wordmark({ beta = true }: { beta?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <ShelfMark className="size-8 shadow-regular-sm" />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">openshelf</span>
      {beta && <span className="rounded-md bg-paper px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-line">beta</span>}
    </span>
  );
}

/** A shop's own mark: its initial on its accent colour. */
export function ShopMark({ name, hue, className }: { name: string; hue: number; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-static-white', className ?? 'size-8 text-sm')} style={{ background: `hsl(${hue} 45% 42%)` }}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** PayPal's mark for the buy buttons. */
export function PayPalMark({ className, white = false }: { className?: string; white?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-4', className)} aria-hidden>
      <path fill={white ? '#fff' : '#003087'} d="M7.3 21.2H3.9a.5.5 0 0 1-.5-.6L6.1 3.4A.8.8 0 0 1 6.9 2.7h6.3c3.3 0 5.4 1.7 4.8 5-.7 3.9-3.3 5.6-7 5.6H9.4a.8.8 0 0 0-.8.7z" />
      <path fill={white ? '#fff' : '#0070E0'} fillOpacity={white ? 0.7 : 1} d="M18.6 7.6c-.7 3.8-3.3 5.9-6.9 5.9h-1.2a.8.8 0 0 0-.8.7l-1 6.3-.3 1.7a.5.5 0 0 0 .5.6h3a.7.7 0 0 0 .7-.6l.7-4.5a.7.7 0 0 1 .7-.6h.6c3 0 5.2-1.6 5.8-4.8.4-2.1-.2-3.6-1.8-4.7z" />
    </svg>
  );
}
