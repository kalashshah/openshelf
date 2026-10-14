/**
 * Server-safe copies of llamacalls' page chrome (components/app/page-chrome.tsx): same classes, but icons are
 * passed as elements, so server components can render them without crossing the client boundary.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions, leading }: { title: string; description?: ReactNode; actions?: ReactNode; leading?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center gap-3 border-b border-stroke-soft-200 bg-paper/90 px-4 backdrop-blur-md lg:px-8">
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-label-lg text-text-strong-950">{title}</h1>
        {description && <p className="truncate text-paragraph-sm text-text-sub-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-8', className)}>{children}</div>;
}

export function Medallion({ icon, tone = 'neutral', size = 'sm' }: { icon: ReactNode; tone?: 'neutral' | 'primary' | 'error'; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset [&>svg]:size-4',
        size === 'sm' ? 'size-8' : 'size-10 [&>svg]:size-5',
        tone === 'neutral' && 'bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-stroke-soft-200',
        tone === 'primary' && 'bg-primary-alpha-10 text-primary-base ring-primary-alpha-16',
        tone === 'error' && 'bg-error-lighter text-error-base ring-error-base/20',
      )}
    >
      {icon}
    </span>
  );
}

export function SectionCard({
  icon,
  tone,
  title,
  description,
  action,
  footer,
  children,
  className,
  bodyClassName,
}: {
  icon?: ReactNode;
  tone?: 'neutral' | 'primary' | 'error';
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col overflow-hidden rounded-20 bg-bg-white-0 shadow-fancy-buttons-stroke', className)}>
      <div className="flex items-start gap-3 px-4 pb-3.5 pt-4">
        {icon && <Medallion icon={icon} tone={tone} />}
        <div className="min-w-0 flex-1">
          <h2 className="text-label-sm text-text-strong-950">{title}</h2>
          {description && <p className="mt-0.5 text-paragraph-xs leading-relaxed text-text-sub-600">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children && <div className={cn('px-4 pb-4', bodyClassName)}>{children}</div>}
      {footer && <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-stroke-soft-200 bg-bg-weak-50 px-4 py-3">{footer}</div>}
    </section>
  );
}

/** A hairline-divided list reaching the card's edges. */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('-mx-4 divide-y divide-stroke-soft-200 border-y border-stroke-soft-200', className)}>{children}</div>;
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-3 px-4 py-3', className)}>{children}</div>;
}

export function StatusDot({ tone, children }: { tone: 'success' | 'warning' | 'error' | 'idle'; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-bg-white-0 px-2 py-0.5 text-paragraph-xs ring-1 ring-inset ring-stroke-soft-200', tone === 'idle' ? 'text-text-sub-600' : 'text-text-strong-950')}>
      <span className={cn('size-1.5 rounded-full', tone === 'success' && 'bg-success-base', tone === 'warning' && 'bg-warning-base', tone === 'error' && 'bg-error-base', tone === 'idle' && 'bg-bg-soft-200')} aria-hidden />
      {children}
    </span>
  );
}

export function EmptyPanel({ icon, title, description, action }: { icon: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stroke-sub-300 bg-bg-weak-50/50 px-6 py-12 text-center">
      <Medallion icon={icon} />
      <p className="mt-1 text-label-sm text-text-strong-950">{title}</p>
      {description && <p className="max-w-[40ch] text-paragraph-xs text-text-sub-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export const TABLE_CARD = 'rounded-[20px] bg-bg-white-0 p-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 sm:p-4';

/** A settings row: label and hint on the left, the control on the right, a hairline under it (llamacalls Field on a page). */
export function FieldRow({ label, hint, htmlFor, wide, children }: { label: ReactNode; hint?: ReactNode; htmlFor?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn('col-span-full grid gap-3 border-b border-stroke-soft-200 pb-5 last:border-b-0 last:pb-0', !wide && 'sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8')}>
      <div className="flex flex-col gap-1">
        <label htmlFor={htmlFor} className="text-label-sm font-medium text-text-strong-950">
          {label}
        </label>
        {hint && <span className="text-paragraph-xs text-text-sub-600">{hint}</span>}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
    </div>
  );
}

/** Label above control, for forms inside cards. */
export function Field({ label, hint, htmlFor, children }: { label: ReactNode; hint?: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-label-sm font-medium text-text-strong-950">
        {label}
      </label>
      {hint && <span className="-mt-1 text-paragraph-xs text-text-sub-600">{hint}</span>}
      {children}
    </div>
  );
}

/** Native select in AlignUI's input styling (works inside plain server-rendered forms). */
export function NativeSelect({ name, id, defaultValue, options, disabled }: { name: string; id?: string; defaultValue?: string; options: [string, string][]; disabled?: boolean }) {
  return (
    <div className="relative">
      <select
        name={name}
        id={id}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-10 bg-bg-white-0 px-3 pr-9 text-label-sm text-text-strong-950 outline-none ring-1 ring-inset ring-stroke-soft-200 transition focus:ring-2 focus:ring-primary-base disabled:bg-bg-weak-50"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-sub-600" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
