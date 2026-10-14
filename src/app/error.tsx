'use client';

import { CircleAlert } from 'lucide-react';
import { FancyButton } from '@/components/ui/fancy-button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-20 bg-bg-white-0 p-8 text-center shadow-card ring-1 ring-line">
        <span className="flex size-12 items-center justify-center rounded-full bg-error-lighter">
          <CircleAlert className="size-5 text-error-base" />
        </span>
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">Something went wrong</h1>
        <p className="text-sm text-muted">{error.message}</p>
        <FancyButton variant="basic" onClick={reset}>
          Try again
        </FancyButton>
      </div>
    </div>
  );
}
