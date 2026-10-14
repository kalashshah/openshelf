/** Centered footer with the giant cropped wordmark (llamacalls Footer). */
export function Footer({ title, sub, links, word }: { title: string; sub: string; links: { href: string; label: string }[]; word: string }) {
  return (
    <footer className="overflow-hidden border-t border-line">
      <div className="flex flex-col items-center gap-5 px-6 pb-4 pt-14 text-center">
        <p className="text-lg font-semibold tracking-[-0.02em] text-ink">
          {title}
          <span className="block font-normal text-muted">{sub}</span>
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <span className="text-[13px] text-muted/80">© 2026 {word}. Built for the PayPal AI Hackathon.</span>
      </div>
      <div aria-hidden className="pointer-events-none -mb-[2.5vw] select-none text-center">
        <span data-text={word} className="wordmark-fancy text-[14vw] font-bold leading-[0.75] tracking-[-0.04em]">
          {word}
        </span>
      </div>
    </footer>
  );
}
