import type { ReactNode } from 'react';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

// Shared "nothing to show" layout — used for genuine empty states (no data
// yet, no search matches) and, via ErrorState, for failed-to-load states too.
export function EmptyState({
  title,
  description,
  action,
  variant = 'page',
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'page' | 'card';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        variant === 'page' ? 'h-full px-6' : 'rounded-2xl border border-line bg-card px-6 py-16',
        className,
      )}
    >
      <Typography variant="h2" as="h2">
        {title}
      </Typography>
      {description && (
        <Typography variant="body" className="max-w-sm">
          {description}
        </Typography>
      )}
      {action}
    </div>
  );
}
