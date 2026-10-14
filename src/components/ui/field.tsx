'use client';

import type { ReactNode } from 'react';
import { useSurface } from '@/components/app/page-chrome';
import { cn } from '@/lib/utils';

/**
 * Label + hint + control, so every form row in the app has one spacing and
 * typography decision rather than each page making its own.
 *
 * On a settings page it becomes a settings row: label and hint on the left, the
 * control on the right, a hairline under it. `wide` keeps the control under the
 * label there too, for one that needs the full width, like a long textarea.
 */
export function Field({
  label,
  hint,
  htmlFor,
  wide,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  wide?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const surface = useSurface();
  const heading = (
    <>
      <label htmlFor={htmlFor} className="text-label-sm font-medium text-text-strong-950">
        {label}
      </label>
      {hint && <span className="text-paragraph-xs text-text-sub-600">{hint}</span>}
    </>
  );

  if (surface === 'page') {
    return (
      <div
        className={cn(
          'col-span-full grid gap-3 border-b border-stroke-soft-200 pb-5',
          !wide && 'sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8',
          className,
        )}
      >
        <div className="flex flex-col gap-1">{heading}</div>
        <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {heading}
      {children}
    </div>
  );
}
