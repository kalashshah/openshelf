import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full font-medium', {
  variants: {
    variant: {
      // frosted chip that reads over drawn media or paper
      default: 'bg-card/90 text-ink shadow-sm ring-1 ring-line backdrop-blur',
      solid: 'bg-ink text-white',
      muted: 'bg-paper text-muted ring-1 ring-line',
    },
    size: {
      sm: 'px-2.5 py-1 text-[11px]',
      md: 'px-3 py-1.5 text-xs',
    },
  },
  defaultVariants: { variant: 'default', size: 'sm' },
});

type BadgeProps = VariantProps<typeof badgeVariants> & {
  className?: string;
  children: ReactNode;
};

export function Badge({ variant, size, className, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}
