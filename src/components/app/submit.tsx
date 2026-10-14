'use client';

import { useFormStatus } from 'react-dom';
import { FancyButton } from '@/components/ui/fancy-button';

/** A form's submit button that shows it is working (server actions can take a while: imports, PayPal calls). */
export function Submit({ children, pending = 'Working…', variant = 'neutral', size = 'small', className }: { children: React.ReactNode; pending?: string; variant?: 'neutral' | 'primary' | 'basic' | 'destructive'; size?: 'medium' | 'small' | 'xsmall'; className?: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <FancyButton type="submit" variant={variant} size={size} disabled={busy} className={className}>
      {busy ? pending : children}
    </FancyButton>
  );
}
