'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Search, User } from 'lucide-react';
import { BrandMarkSvg } from '@/components/ui/brand-icon';
import { PayPalMark, ShopMark } from '@/components/brand';
import { cn } from '@/lib/utils';

/**
 * The hero demo: a person types to Claude, Claude calls Open Shelf's tools and
 * asks your store agent, the store agent answers, the person buys in PayPal.
 * A scripted loop, not a live call.
 */

type Lane = 'you' | 'claude' | 'store' | 'paypal';
type Step =
  | { kind: 'compose'; text: string }
  | { kind: 'you'; text: string }
  | { kind: 'claude'; text: string }
  | { kind: 'tool'; tool: string; args: string; result: string }
  | { kind: 'ask'; text: string }
  | { kind: 'store'; text: string }
  | { kind: 'paypal' };

const Q1 = 'Find me a moisturizer for oily skin under $30. Will it clog pores?';
const Q2 = 'Buy the 50 ml.';
const REPLY = 'Yes: the Oil-Free Gel Moisturizer was lab-tested non-comedogenic and has no added fragrance. Niacinamide 4% helps balance oil. $24 for 50 ml.';

const SCRIPT: Step[] = [
  { kind: 'compose', text: Q1 },
  { kind: 'you', text: Q1 },
  { kind: 'tool', tool: 'search_products', args: '"moisturizer oily skin", max_price: 30', result: '3 matches · your store' },
  { kind: 'ask', text: 'Will the Oil-Free Gel Moisturizer clog pores? Any fragrance?' },
  { kind: 'store', text: REPLY },
  { kind: 'claude', text: 'Found it: the Oil-Free Gel Moisturizer. Non-comedogenic, fragrance-free, $24. Want it?' },
  { kind: 'compose', text: Q2 },
  { kind: 'you', text: Q2 },
  { kind: 'paypal' },
];

const TYPE_MS = 38;
const WORD_MS = 70;

function duration(s: Step): number {
  switch (s.kind) {
    case 'compose': return s.text.length * TYPE_MS + 500;
    case 'you': return 700;
    case 'tool': return 1900;
    case 'ask': return 1700;
    case 'store': return 1000 + s.text.split(' ').length * WORD_MS + 1100;
    case 'claude': return 2200;
    case 'paypal': return 5200;
  }
}

function lane(s: Step): Lane {
  if (s.kind === 'compose' || s.kind === 'you') return 'you';
  if (s.kind === 'ask' || s.kind === 'store') return 'store';
  if (s.kind === 'paypal') return 'paypal';
  return 'claude';
}

const LANES: { id: Lane; label: string; icon: React.ReactNode }[] = [
  { id: 'you', label: 'You', icon: <User className="size-4 text-ink" /> },
  { id: 'claude', label: 'Claude', icon: <BrandMarkSvg name="claude" className="size-4 text-[#D97757]" /> },
  { id: 'store', label: 'Your store agent', icon: <ShopMark name="Your store" hue={172} className="size-5 rounded-md text-[10px]" /> },
  { id: 'paypal', label: 'PayPal', icon: <PayPalMark className="size-4" /> },
];

/** Reveals `text` a character (or word) at a time once mounted. */
function useTyped(text: string, live: boolean, unit: 'char' | 'word', delay = 0) {
  const parts = unit === 'char' ? [...text] : text.split(/(?<= )/);
  const [n, setN] = useState(live ? 0 : parts.length);
  useEffect(() => {
    if (!live) return;
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < parts.length) id = setTimeout(tick, unit === 'char' ? TYPE_MS : WORD_MS);
    };
    id = setTimeout(tick, delay);
    return () => clearTimeout(id);
  }, [live, parts.length, unit, delay]);
  return { shown: parts.slice(0, n).join(''), done: n >= parts.length };
}

const appear = { initial: { opacity: 0, y: 10, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] } } as const;

function Who({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted">
      {icon}
      {children}
    </span>
  );
}

function StoreReply({ text, live }: { text: string; live: boolean }) {
  const { shown, done } = useTyped(text, live, 'word', 1000);
  return (
    <motion.div {...appear} className="ml-5 flex max-w-[85%] flex-col items-start">
      <Who icon={<ShopMark name="Your store" hue={172} className="size-4 rounded text-[9px]" />}>Your store agent · from your catalog</Who>
      <div className="rounded-2xl rounded-tl-md bg-primary-alpha-10 px-3.5 py-2.5 text-[13px] leading-relaxed text-marker ring-1 ring-inset ring-primary-alpha-16">
        {shown ? shown : (
          <span className="flex gap-1 py-1"><span className="os-dot" /><span className="os-dot" /><span className="os-dot" /></span>
        )}
        {shown && !done && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-current align-middle" />}
      </div>
    </motion.div>
  );
}

function PayPalCard({ live }: { live: boolean }) {
  const [approved, setApproved] = useState(!live);
  useEffect(() => {
    if (!live) return;
    const id = setTimeout(() => setApproved(true), 1800);
    return () => clearTimeout(id);
  }, [live]);
  return (
    <motion.div {...appear} className="flex flex-col items-start">
      <Who icon={<BrandMarkSvg name="claude" className="size-3.5 text-[#D97757]" />}>Claude · buy(Oil-Free Gel Moisturizer, 50 ml)</Who>
      <div className="w-full max-w-[300px] overflow-hidden rounded-xl bg-card ring-1 ring-line shadow-regular-xs">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#003087]">
            <PayPalMark className="size-4" /> PayPal
          </span>
          <span className="text-[11px] text-muted">Your store</span>
        </div>
        <div className="flex flex-col gap-2.5 px-3.5 py-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Oil-Free Gel Moisturizer · 50 ml</span>
            <span className="font-semibold tabular-nums text-ink">$24.00</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {approved ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 py-2 text-[13px] font-medium text-green-700">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}>
                  <Check className="size-4" />
                </motion.span>
                Approved · paid to your PayPal
              </motion.div>
            ) : (
              <motion.div key="btn" exit={{ opacity: 0 }} className="flex items-center justify-center rounded-lg bg-[#ffc439] py-2 text-[13px] font-semibold text-[#003087]">
                Approve $24.00
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Message({ step, live }: { step: Step; live: boolean }) {
  switch (step.kind) {
    case 'compose':
      return null;
    case 'you':
      return (
        <motion.div {...appear} className="flex max-w-[80%] flex-col items-end self-end">
          <Who icon={<User className="size-3.5" />}>You</Who>
          <div className="rounded-2xl rounded-tr-md bg-primary-base px-3.5 py-2.5 text-[13px] leading-relaxed text-static-white shadow-regular-xs">{step.text}</div>
        </motion.div>
      );
    case 'claude':
      return (
        <motion.div {...appear} className="flex max-w-[88%] flex-col items-start">
          <Who icon={<BrandMarkSvg name="claude" className="size-3.5 text-[#D97757]" />}>Claude</Who>
          <div className="rounded-2xl rounded-tl-md bg-paper px-3.5 py-2.5 text-[13px] leading-relaxed text-ink ring-1 ring-inset ring-line">{step.text}</div>
        </motion.div>
      );
    case 'tool':
      return <ToolCall step={step} live={live} />;
    case 'ask':
      return (
        <motion.div {...appear} className="flex max-w-[88%] flex-col items-start">
          <Who icon={<BrandMarkSvg name="claude" className="size-3.5 text-[#D97757]" />}>
            Claude <ArrowRight className="size-3" /> <ShopMark name="Your store" hue={172} className="size-4 rounded text-[9px]" /> ask_store
          </Who>
          <div className="rounded-2xl rounded-tl-md bg-paper px-3.5 py-2.5 font-mono text-[12px] leading-relaxed text-ink ring-1 ring-inset ring-line">“{step.text}”</div>
        </motion.div>
      );
    case 'store':
      return <StoreReply text={step.text} live={live} />;
    case 'paypal':
      return <PayPalCard live={live} />;
  }
}

function ToolCall({ step, live }: { step: Extract<Step, { kind: 'tool' }>; live: boolean }) {
  const [done, setDone] = useState(!live);
  useEffect(() => {
    if (!live) return;
    const id = setTimeout(() => setDone(true), 1000);
    return () => clearTimeout(id);
  }, [live]);
  return (
    <motion.div {...appear} className="flex flex-col items-start">
      <Who icon={<BrandMarkSvg name="claude" className="size-3.5 text-[#D97757]" />}>Claude · Open Shelf MCP</Who>
      <div className="flex max-w-full items-center gap-2 rounded-lg bg-paper px-3 py-2 font-mono text-[12px] text-ink ring-1 ring-inset ring-line">
        <Search className={cn('size-3.5 shrink-0 text-marker', !done && 'animate-pulse')} />
        <span className="truncate">
          {step.tool}(<span className="text-muted">{step.args}</span>)
        </span>
      </div>
      {done && (
        <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="mt-1 flex items-center gap-1 pl-1 text-[11px] text-green-700">
          <Check className="size-3" /> {step.result}
        </motion.span>
      )}
    </motion.div>
  );
}

function Composer({ text, live }: { text: string; live: boolean }) {
  const { shown } = useTyped(text, live, 'char');
  return <>{shown}</>;
}

export function AgentDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [i, setI] = useState(-1);
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    if (reduced) {
      setI(SCRIPT.length - 1);
      return;
    }
    if (!inView) return;
    if (i === -1) {
      const id = setTimeout(() => setI(0), 400);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      if (i < SCRIPT.length - 1) setI(i + 1);
      else {
        setLoop((l) => l + 1);
        setI(-1);
      }
    }, duration(SCRIPT[i]));
    return () => clearTimeout(id);
  }, [i, inView, reduced]);

  const step = SCRIPT[i];
  const active = step ? lane(step) : 'you';
  const activeIdx = LANES.findIndex((l) => l.id === active);
  const composing = step?.kind === 'compose' ? step : null;

  return (
    <div ref={ref} className="min-w-0 overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
      {/* Who is talking right now */}
      <div className="flex items-center border-b border-line px-4 py-3.5 sm:px-5">
        {LANES.map((l, k) => (
          <Fragment key={l.id}>
            {k > 0 && (
              <div className="relative mx-1.5 h-px flex-1 bg-line sm:mx-2">
                <motion.div className="absolute inset-y-0 left-0 bg-marker" animate={{ width: activeIdx >= k ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
              </div>
            )}
            <div className="flex flex-col items-center gap-1">
              <motion.span
                className={cn('relative flex size-8 items-center justify-center rounded-full bg-paper ring-1 ring-line transition-shadow', active === l.id && 'ring-2 ring-marker')}
                animate={active === l.id ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: active === l.id ? Infinity : 0 }}
              >
                {l.icon}
              </motion.span>
              <span className={cn('whitespace-nowrap text-[10px] font-medium sm:text-[11px]', active === l.id ? 'text-ink' : 'text-muted')}>{l.label}</span>
            </div>
          </Fragment>
        ))}
      </div>

      {/* The conversation; old messages scroll off the top */}
      <div className="relative h-[380px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_48px)]">
        <AnimatePresence mode="wait">
          <motion.div key={loop} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-x-0 bottom-0 flex flex-col gap-3.5 px-4 py-4 sm:px-5">
            {SCRIPT.slice(0, i + 1).map((s, k) => (
              <Message key={k} step={s} live={!reduced} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* A person typing */}
      <div className="border-t border-line px-4 py-3 sm:px-5">
        <div className={cn('flex min-h-10 items-center gap-2 rounded-xl bg-paper px-3 py-2 text-[13px] ring-1 ring-line transition-shadow', composing && 'ring-2 ring-marker/40')}>
          <span className="min-w-0 flex-1 text-ink">
            {composing ? (
              <>
                <Composer key={`${loop}-${i}`} text={composing.text} live={!reduced} />
                <span className="ml-px inline-block h-4 w-px animate-pulse bg-ink align-middle" />
              </>
            ) : (
              <span className="text-muted">Ask Claude to shop for you…</span>
            )}
          </span>
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors', composing ? 'bg-[#D97757] text-white' : 'bg-bg-soft-200 text-muted')}>
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
