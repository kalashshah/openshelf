import type { ReactNode } from 'react';
import { Wordmark } from '@/components/brand';
import { Nav } from '@/components/landing/nav';

/** A short message page on the canvas: confirmation, cancellation, not found. */
export function Centered({ icon, title, children, actions }: { icon: ReactNode; title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col border-line bg-card xl:border-x">
        <Nav brand={<a href="/"><Wordmark /></a>} links={[]} action={null} />
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-20 bg-bg-white-0 p-8 text-center shadow-card ring-1 ring-line">
            <span className="flex size-12 items-center justify-center rounded-full bg-paper ring-1 ring-line">{icon}</span>
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl">{title}</h1>
            <div className="text-sm leading-relaxed text-muted">{children}</div>
            {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
