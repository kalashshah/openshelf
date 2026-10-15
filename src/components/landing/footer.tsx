/** Centered footer with the giant cropped wordmark (llamacalls Footer). */
export function Footer({ title, sub, links, word, owner }: { title: string; sub: string; links: { href: string; label: string }[]; word: string; owner?: string }) {
  return (
    <footer className="overflow-hidden border-t border-line">
      <div className="flex flex-col items-center gap-5 px-6 pb-4 pt-14 text-center">
        <p className="text-lg font-semibold tracking-[-0.02em] text-primary-darker">
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
        <span className="text-[13px] text-muted/80">© 2026 {owner ?? word}. Built for the PayPal AI Hackathon.</span>
      </div>
      {/* Whole word, with room for ascenders: the sheen layer (::after) only covers the line box, so a line height
          under 1 sliced the top off tall letters like the f. */}
      <div aria-hidden className="pointer-events-none select-none px-4 pb-[3vw] pt-2 text-center">
        <span data-text={word} className="wordmark-fancy font-bold leading-[1.1] tracking-[-0.04em]" style={{ fontSize: `min(13vw, ${Math.floor(150 / Math.max(word.length, 1))}vw)` }}>
          {word}
        </span>
      </div>
    </footer>
  );
}
