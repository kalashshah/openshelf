'use client';

import { cn } from '@/lib/utils';

/**
 * AlignUI-flavoured switch. Rekka has no equivalent — it never needed a boolean
 * toggle — so this is built against the same semantic tokens the ported
 * components use rather than invented styling.
 *
 * A real `<button role="switch">` rather than a styled checkbox: it carries
 * `aria-checked` natively and is keyboard-operable without extra handlers.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-base focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-primary-base' : 'bg-bg-soft-200',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-bg-white-0 shadow-regular-xs transition-transform',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
