'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Full-width dark strip above the nav (llamacalls AnnouncementBar). */
export function AnnouncementBar({ children }: { children: ReactNode }) {
  return <div className="relative z-50 bg-[#003087] px-4 py-2 text-center text-[13px] text-blue-100">{children}</div>;
}

/**
 * Nav that starts merged with the page top, a full-width bar under the announcement strip,
 * and condenses into a floating pill on scroll (llamacalls Nav).
 */
export function Nav({ brand, links, action }: { brand: ReactNode; links: { href: string; label: string }[]; action: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="sticky top-0 z-50 flex flex-col">
      <nav
        className={cn(
          'relative mx-auto flex h-14 items-center justify-between bg-card/90 py-2 backdrop-blur transition-all duration-300',
          scrolled ? 'mt-5 w-[min(60rem,calc(100%-1.5rem))] rounded-lg border border-line pl-2.5 pr-2 shadow-regular-md' : 'w-full border-b border-line px-4 md:px-8',
        )}
      >
        {brand}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>
        {action}
      </nav>
    </div>
  );
}
