'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { PayPalMark } from '@/components/brand';
import { DemoButton } from '@/components/common/demo-button';
import { Alert } from '@/components/ui/alert';
import * as Divider from '@/components/ui/divider';
import { FancyButton } from '@/components/ui/fancy-button';

const POINTS = ['Payments go straight into your PayPal account', 'Import your payment links, invoices or a Shopify store', 'A store agent that answers shoppers’ AI agents'];

export function LoginForm({ paypalEnabled, error, next }: { paypalEnabled: boolean; error?: string; next: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(error ? `PayPal sign-in didn’t complete (${error.replace(/_/g, ' ')}). Try again.` : '');
  return (
    <div className="w-full max-w-md">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-marker">Sign in</span>
      <h1 className="mt-3 text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink md:text-[40px]">
        Open your shelf <span className="text-marker">with PayPal.</span>
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">Use the PayPal account you sell with. No API keys, nothing to host.</p>
      <ul className="mt-6 flex flex-col gap-2.5">
        {POINTS.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm text-ink">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-alpha-10 text-marker ring-1 ring-inset ring-primary-alpha-16">
              <Check className="size-3" />
            </span>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-20 bg-card p-6 shadow-card ring-1 ring-line">
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
        <p className="mt-3 text-center text-paragraph-xs text-text-sub-600">Sandbox demo: use a sandbox account from developer.paypal.com → Testing Tools.</p>
        <Divider.Root variant="line-text" className="my-5">
          OR
        </Divider.Root>
        <DemoButton full className="w-full">Try a demo store, no account</DemoButton>
      </div>
      <p className="mt-5 text-paragraph-xs text-text-sub-600">Free during the PayPal AI Hackathon. Nothing real is charged in the sandbox.</p>
    </div>
  );
}
