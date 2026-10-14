'use client';

import { useState } from 'react';
import { FancyButton } from '@/components/ui/fancy-button';

/** "Try the demo": an anonymous account with its own seeded shop, no sign-up. */
export function DemoButton({ className, variant = 'basic', size = 'medium', children = 'Try the demo store' }: { className?: string; variant?: 'basic' | 'neutral' | 'primary'; size?: 'medium' | 'small'; children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <span className="inline-flex flex-col items-center">
      <FancyButton
        variant={variant}
        size={size}
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          const res = await fetch('/api/auth/sign-in/anonymous', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
          if (res.ok) location.href = '/app';
          else {
            setBusy(false);
            setError('Could not start the demo. Try again.');
          }
        }}
      >
        {busy ? 'Setting up your store…' : children}
      </FancyButton>
      {error && <span className="mt-2 text-paragraph-xs text-error-base">{error}</span>}
    </span>
  );
}
