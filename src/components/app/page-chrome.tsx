'use client';

import { createContext, useContext, type ElementType, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The header every app page wears.
 *
 * Title, one-line description and the page's actions on a single row, the same
 * height as the sidebar's brand row so their hairlines meet as one line across
 * the screen. No generic icon: a glyph in a circle said nothing the title didn't,
 * so the leading slot is only for a real identity (an agent's face, a service's
 * logo).
 *
 * `sticky` because the actions in here are the page's primary ones (Save, New
 * agent) and a form long enough to scroll must not scroll its own Save away.
 */
export function PageHeader({
  leading,
  title,
  description,
  actions,
  className,
}: {
  leading?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-[72px] shrink-0 items-center gap-3 border-b border-stroke-soft-200',
        'bg-paper/90 px-4 backdrop-blur-md lg:px-8',
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-label-lg text-text-strong-950">{title}</h1>
        {description && (
          <p className="truncate text-paragraph-sm text-text-sub-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * The ringed tile an icon sits in.
 *
 * One shape, used for page headers, card headers and empty states, so an icon
 * always means the same thing wherever it appears. `tone` tints it when the
 * section is about a risk rather than a setting.
 */
export function Medallion({
  icon: Icon,
  tone = 'neutral',
  size = 'md',
  className,
}: {
  icon: ElementType;
  tone?: 'neutral' | 'primary' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
        size === 'sm' ? 'size-8' : 'size-10',
        tone === 'neutral' && 'bg-bg-white-0 text-text-sub-600 shadow-regular-xs ring-stroke-soft-200',
        tone === 'primary' && 'bg-primary-alpha-10 text-primary-base ring-primary-alpha-16',
        tone === 'error' && 'bg-error-lighter text-error-base ring-error-base/20',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden />
    </span>
  );
}

/**
 * The content band under a {@link PageHeader}.
 *
 * Full width on purpose. These pages used to sit in a 768px column inside a
 * layout that already gives up 256px to the sidebar, which left most of the
 * screen empty — the opposite of how AlignUI lays a dashboard out. The cap only
 * exists so a line of body text on an ultrawide display stays readable.
 */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 py-5 lg:px-8', className)}>{children}</div>
  );
}

/**
 * Whether a {@link SectionCard} draws as a card, or as the whole page it sits on.
 * A context rather than a prop so a section component shared with the setup
 * wizard (cards) can render as a full page on the agent settings screen.
 */
const SurfaceContext = createContext<'card' | 'page'>('card');

/** Which surface the nearest {@link SectionCard} draws as. */
export function useSurface(): 'card' | 'page' {
  return useContext(SurfaceContext);
}

/** Renders every {@link SectionCard} and {@link Rows} inside it as page content. */
export function PageSurface({ children }: { children: ReactNode }) {
  return <SurfaceContext.Provider value="page">{children}</SurfaceContext.Provider>;
}

/**
 * A titled surface: medallion, title, description, optional right-hand action,
 * then content, then an optional footer strip.
 *
 * Every settings surface in the app goes through this. Assembling the same header
 * by hand on each page is how a set of screens ends up looking like a pile of
 * components — one composition means one set of decisions about where the icon
 * sits, how far the description runs and what the footer is for.
 */
export function SectionCard({
  icon,
  leading,
  tone,
  title,
  description,
  action,
  footer,
  children,
  className,
  bodyClassName,
}: {
  icon?: ElementType;
  /** Replaces the medallion — for a section that belongs to a service with a logo. */
  leading?: ReactNode;
  tone?: 'neutral' | 'primary' | 'error';
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const surface = useContext(SurfaceContext);
  if (surface === 'page') {
    return (
      <section className={cn('flex min-w-0 flex-col gap-6', className)}>
        <div className="flex items-start gap-4 border-b border-stroke-soft-200 pb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-label-lg text-text-strong-950">{title}</h2>
            {description && (
              <p className="mt-1 max-w-[60ch] text-paragraph-sm text-text-sub-600">{description}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
        {children}
        {footer && <div className="-mt-2">{footer}</div>}
      </section>
    );
  }
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-20 bg-bg-white-0 shadow-fancy-buttons-stroke',
        className,
      )}
    >
      <div className="flex items-start gap-3 px-4 pb-3.5 pt-4">
        {leading ?? (icon ? <Medallion icon={icon} tone={tone} size="sm" /> : null)}
        <div className="min-w-0 flex-1">
          <h2 className="text-label-sm text-text-strong-950">{title}</h2>
          {description && (
            <p className="mt-0.5 text-paragraph-xs leading-relaxed text-text-sub-600">{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children && <div className={cn('px-4 pb-4', bodyClassName)}>{children}</div>}
      {footer && (
        <div className="mt-auto flex items-center gap-2 border-t border-stroke-soft-200 bg-bg-weak-50 px-4 py-3">
          {footer}
        </div>
      )}
    </section>
  );
}

/**
 * A hairline-divided list, edge to edge inside its parent.
 *
 * The negative margin is what makes a list inside a {@link SectionCard} reach the
 * card's own edges: rows that stop short of the border read as a floating group,
 * rows that touch it read as the card's contents.
 */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  const surface = useContext(SurfaceContext);
  return (
    <div
      className={cn(
        'divide-y divide-stroke-soft-200',
        // On a page there are no card edges to reach, so the list closes itself.
        surface === 'page'
          ? 'overflow-hidden rounded-xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200'
          : '-mx-4 border-y border-stroke-soft-200',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One row of a {@link Rows} list. */
export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-3 px-4 py-3', className)}>{children}</div>;
}

/**
 * A labelled group inside a page, for splitting one long form into readable
 * parts without a card's worth of chrome around each.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-subheading-xs uppercase text-text-soft-400', className)}>{children}</p>
  );
}

/** A live/idle status pill: a dot and a word, the way AlignUI states things. */
export function StatusDot({
  tone,
  children,
  className,
}: {
  tone: 'success' | 'warning' | 'error' | 'idle';
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-bg-white-0 px-2 py-0.5',
        'text-paragraph-xs ring-1 ring-inset ring-stroke-soft-200',
        tone === 'idle' ? 'text-text-sub-600' : 'text-text-strong-950',
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'success' && 'bg-success-base',
          tone === 'warning' && 'bg-warning-base',
          tone === 'error' && 'bg-error-base',
          tone === 'idle' && 'bg-bg-soft-200',
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}

/** "Nothing here yet" inside a page: a quiet dashed panel rather than a bare sentence. */
export function EmptyPanel({
  icon,
  title,
  description,
  action,
}: {
  icon: ElementType;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stroke-sub-300 bg-bg-weak-50/50 px-6 py-12 text-center">
      <Medallion icon={icon} size="sm" />
      <p className="mt-1 text-label-sm text-text-strong-950">{title}</p>
      {description && <p className="max-w-[40ch] text-paragraph-xs text-text-sub-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** A page's heading while it loads: the same shape {@link SectionCard} draws on a page. */
function HeadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 border-b border-stroke-soft-200 pb-5">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-3.5 w-72 max-w-full" />
    </div>
  );
}

/** A settings page loading: heading, then label-left, control-right rows. */
export function SettingsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Loading">
      <HeadingSkeleton />
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid gap-3 border-b border-stroke-soft-200 pb-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-44 max-w-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-10" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder rows for a {@link Rows} list: medallion, then a title and a subtitle line. */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Rows>
      {Array.from({ length: rows }, (_, i) => (
        <Row key={i} className="py-3.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className={cn('h-3.5', ['w-40', 'w-32', 'w-48'][i % 3])} />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-10" />
        </Row>
      ))}
    </Rows>
  );
}

/** A list page loading: heading, then {@link RowsSkeleton}. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Loading">
      <HeadingSkeleton />
      <RowsSkeleton rows={rows} />
    </div>
  );
}

/**
 * The white card an AlignUI table sits on. On the gray page its header strip
 * and row hover are the page's own color and vanish without it.
 */
export const TABLE_CARD =
  'rounded-[20px] bg-bg-white-0 p-2 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 sm:p-4';
