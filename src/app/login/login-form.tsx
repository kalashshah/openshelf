'use client';

import { useState } from 'react';
import { PayPalMark } from '@/components/brand';
import { DemoButton } from '@/components/common/demo-button';
import { Alert } from '@/components/ui/alert';
import * as Divider from '@/components/ui/divider';
import { FancyButton } from '@/components/ui/fancy-button';
import { Typography } from '@/components/ui/typography';

export function LoginForm({ paypalEnabled, error, next }: { paypalEnabled: boolean; error?: string; next: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(error ? `PayPal sign-in didn’t complete (${error.replace(/_/g, ' ')}). Try again.` : '');
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
        <Typography variant="h2" as="h1">
          Sign in to Open Shelf
        </Typography>
        <Typography variant="body">Use the PayPal account you sell with. Payments from shoppers and their agents go straight into it.</Typography>
      </div>
      <div className="rounded-2xl bg-bg-white-0 p-6 ring-1 ring-inset ring-stroke-soft-200">
        {err && (
          <div className="mb-4">
            <Alert>{err}</Alert>
          </div>
        )}
        {paypalEnabled ? (
          <FancyButton
            variant="primary"
            size="medium"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setErr('');
              const res = await fetch('/api/auth/sign-in/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'paypal', callbackURL: next, errorCallbackURL: '/login' }) });
              const j = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
              if (j.url) location.href = j.url;
              else {
                setBusy(false);
                setErr(j.message ?? 'PayPal sign-in is not available.');
              }
            }}
          >
            <PayPalMark white className="size-4" />
            {busy ? 'Opening PayPal…' : 'Log in with PayPal'}
          </FancyButton>
        ) : (
          <Alert variant="info">PayPal sign-in is not configured on this deployment.</Alert>
        )}
        <p className="mt-3 text-center text-paragraph-xs text-text-sub-600">This demo runs on the PayPal sandbox: use a sandbox account from developer.paypal.com → Testing Tools.</p>
        <Divider.Root variant="line-text" className="my-5">
          OR
        </Divider.Root>
        <DemoButton className="w-full">Try a demo store, no account</DemoButton>
      </div>
      <p className="mt-6 text-center text-paragraph-xs text-text-sub-600">Free during the PayPal AI Hackathon. Nothing real is charged in the sandbox.</p>
    </div>
  );
}
