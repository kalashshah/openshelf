import { Wordmark } from '@/components/brand';
import { FancyButton } from '@/components/ui/fancy-button';

const NAV = [
  { href: '/#how', label: 'How it works' },
  { href: '/#agents', label: 'For agents' },
  { href: '/s/dewdrop', label: 'Demo store' },
];

/** The floating header shared by the landing and sign-in pages. */
export function SiteHeader({ action = { href: '/login', label: 'Set up with PayPal' } }: { action?: { href: string; label: string } }) {
  return (
    <header className="sticky top-3 z-50 mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[1120px] items-center justify-between gap-3 rounded-2xl bg-card/75 py-2 pl-4 pr-2 shadow-regular-md ring-1 ring-line backdrop-blur-xl">
      <a href="/#top">
        <Wordmark />
      </a>
      <nav className="hidden items-center gap-1 md:flex">
        {NAV.map((l) => (
          <a key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-bg-weak-50 hover:text-ink">
            {l.label}
          </a>
        ))}
      </nav>
      <FancyButton asChild variant="primary" size="small">
        <a href={action.href}>{action.label}</a>
      </FancyButton>
    </header>
  );
}
