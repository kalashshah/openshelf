import type { ElementType, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const typographyVariants = cva('', {
  variants: {
    variant: {
      display:
        'text-[2.9rem] font-semibold leading-[1.06] tracking-[-0.035em] text-ink md:text-[76px] md:leading-[1.04]',
      h1: 'text-[2rem] font-semibold leading-[1.15] tracking-[-0.025em] text-ink md:text-[2.6rem]',
      h2: 'text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl',
      h3: 'text-base font-semibold tracking-[-0.01em] text-ink',
      lead: 'text-base leading-relaxed text-muted md:text-lg',
      body: 'text-sm leading-relaxed text-muted',
      small: 'text-[13px] leading-relaxed text-muted',
      eyebrow: 'text-xs font-semibold uppercase tracking-widest text-marker/80',
    },
  },
  defaultVariants: { variant: 'body' },
});

// Sensible default element per variant; override with `as`.
const DEFAULT_TAG: Record<NonNullable<VariantProps<typeof typographyVariants>['variant']>, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  lead: 'p',
  body: 'p',
  small: 'p',
  eyebrow: 'p',
};

type TypographyProps = VariantProps<typeof typographyVariants> & {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function Typography({ variant = 'body', as, className, children }: TypographyProps) {
  const Tag = as ?? DEFAULT_TAG[variant ?? 'body'];
  return <Tag className={cn(typographyVariants({ variant }), className)}>{children}</Tag>;
}
