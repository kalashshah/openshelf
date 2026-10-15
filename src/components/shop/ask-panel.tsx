'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ShopMark } from '@/components/brand';
import { FancyButton } from '@/components/ui/fancy-button';
import { cn } from '@/lib/utils';

type Msg = { me: boolean; text: string; recs?: { product_id: string; name: string; price: string }[]; forwarded?: boolean; typing?: boolean };

/** Ask the shop: the same store agent shoppers' AI agents talk to (POST /s/:slug/ask). */
export function AskPanel({ slug, name, hue, suggestions }: { slug: string; name: string; hue: number; suggestions: string[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ me: false, text: `Hi! I know everything ${name} has published: products, options, policies. What are you looking for?` }]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<{ id: string; name: string } | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  // "Ask about this" on a product card points the next question at that product.
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; name: string }>).detail;
      setFocus(d);
      document.getElementById('ask')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => input.current?.focus(), 350);
    };
    window.addEventListener('ask-about', on);
    return () => window.removeEventListener('ask-about', on);
  }, []);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setQ('');
    setBusy(true);
    setMsgs((m) => [...m, { me: true, text }, { me: false, text: '', typing: true }]);
    try {
      const res = await fetch(`/s/${slug}/ask`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: text, product_id: focus?.id ?? null }) });
      const j = (await res.json()) as { answer?: string; error?: string; answered?: boolean; recommended?: Msg['recs'] };
      setMsgs((m) => [...m.slice(0, -1), res.ok ? { me: false, text: j.answer ?? '', recs: j.recommended, forwarded: j.answered === false } : { me: false, text: j.error ?? 'Something went wrong' }]);
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { me: false, text: 'Could not reach the shop. Try again.' }]);
    }
    setBusy(false);
  }

  return (
    <div id="ask" className="mx-auto w-full max-w-2xl scroll-mt-24 overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <ShopMark name={name} hue={hue} className="size-9 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">Ask {name}</p>
          <p className="truncate text-xs text-muted">Answers from what the shop has published. AI agents get the same answers.</p>
        </div>
        <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">Online</span>
      </div>
      <div ref={list} className="flex max-h-[360px] min-h-[200px] flex-col gap-3 overflow-y-auto px-5 py-5">
        {msgs.map((m, i) => (
          <div key={i} className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed', m.me ? 'self-end rounded-br-md bg-primary-base text-static-white' : 'self-start rounded-bl-md bg-paper text-ink ring-1 ring-line')}>
            {m.typing ? (
              <span className="flex gap-1 py-1 text-muted" aria-label="Typing">
                <span className="os-dot" />
                <span className="os-dot" />
                <span className="os-dot" />
              </span>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.recs && m.recs.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.recs.map((r) => (
                      <a key={r.product_id} href={`#${r.product_id}`} className="rounded-full bg-card px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-line hover:bg-bg-weak-50">
                        {r.name} · {r.price}
                      </a>
                    ))}
                  </div>
                )}
                {m.forwarded && <p className="mt-1.5 text-xs text-muted">I’ve passed this to the shop owner.</p>}
              </>
            )}
          </div>
        ))}
      </div>
      {msgs.length === 1 && (
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-muted shadow-regular-xs ring-1 ring-line transition hover:bg-bg-weak-50 hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="flex items-center gap-2 border-t border-line bg-bg-weak-50 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
      >
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={focus ? `Ask about ${focus.name}…` : 'Ask about a product, sizing, shipping…'}
          aria-label="Your question"
          className="h-10 min-w-0 flex-1 rounded-10 bg-bg-white-0 px-3 text-label-sm text-text-strong-950 outline-none ring-1 ring-inset ring-stroke-soft-200 transition placeholder:text-text-sub-600/60 focus:ring-2 focus:ring-primary-base"
        />
        <FancyButton variant="primary" size="medium" disabled={busy || !q.trim()} aria-label="Ask">
          <ArrowUp className="size-4" />
          Ask
        </FancyButton>
      </form>
    </div>
  );
}
