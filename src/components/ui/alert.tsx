import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALERT_VARIANTS = {
  error: { box: 'bg-error-lighter', icon: 'text-error-base', text: 'text-error-base' },
  info: { box: 'bg-information-lighter', icon: 'text-information-base', text: 'text-information-base' },
} as const;

export function Alert({
  children,
  className,
  variant = 'error',
  icon: IconOverride,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof ALERT_VARIANTS;
  icon?: React.ElementType;
}) {
  const v = ALERT_VARIANTS[variant];
  const Icon = IconOverride ?? (variant === 'error' ? AlertCircle : Info);
  return (
    <div className={cn('flex items-start gap-2 rounded-xl px-3.5 py-3 text-left', v.box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', v.icon)} />
      <p className={cn('text-label-sm', v.text)}>{children}</p>
    </div>
  );
}
