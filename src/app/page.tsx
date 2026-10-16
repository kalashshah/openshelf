import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Check,
  Globe,
  Link2,
  MessagesSquare,
  PackageCheck,
  ShoppingBag,
  Truck,
  Undo2,
} from 'lucide-react';
import { DemoButton } from '@/components/common/demo-button';
import { BrandIcon } from '@/components/ui/brand-icon';
import { FancyButton } from '@/components/ui/fancy-button';
import { Reveal } from '@/components/ui/reveal';
import { Typography } from '@/components/ui/typography';
import { SiteHeader } from '@/components/landing/site-header';
import { AgentDemo } from '@/components/landing/agent-demo';
import { CopyButton } from '@/components/common/copy-button';
import { currentUser } from '@/server/session';
import { getEnv } from '@/server/env';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STEPS = [
  { title: 'Bring your PayPal shop', body: 'Log in with PayPal, then import your payment links and invoices, a Shopify store, any product page or a price list you paste.' },
  { title: 'Your store agent answers', body: 'Shoppers’ AI agents ask about fit, ingredients and shipping. It answers from what you published, and asks you when it doesn’t know.' },
  { title: 'Sold through PayPal', body: 'The buyer approves every order in PayPal. Tracking goes back to PayPal, refunds follow your policy, and Channel3 lists you everywhere.' },
];

const CELLS = [
  { icon: Link2, title: 'Your PayPal, imported', body: 'Payment links and invoices become products in a click.' },
  { icon: Bot, title: 'A store agent', body: 'Answers like a shop assistant who read everything you wrote.' },
  { icon: Globe, title: 'Listed everywhere', body: 'Channel3 carries your catalog to ChatGPT, Google, Copilot and PayPal.' },
];

const TOOLS = [
  { n: '01', t: 'search_products', d: 'Every listed store’s catalog, by what the person needs.' },
  { n: '02', t: 'ask_store', d: 'The store’s own agent answers, and says when it doesn’t know.' },
  { n: '03', t: 'buy', d: 'A PayPal order the person approves. Nothing is charged without them.' },
  { n: '04', t: 'order_status · request_refund', d: 'Tracking from PayPal, and refunds inside the store’s policy.' },
];

const ICON_TILE = 'flex size-9 shrink-0 items-center justify-center rounded-10 bg-primary-alpha-10 text-marker ring-1 ring-inset ring-primary-alpha-16';

/** Left-aligned section head: uppercase eyebrow, title, optional lead. */
function Head({ eyebrow, title, sub, dark = false }: { eyebrow: string; title: React.ReactNode; sub?: React.ReactNode; dark?: boolean }) {
  return (
    <Reveal className="flex max-w-3xl flex-col gap-4">
      <span className={cn('text-xs font-medium uppercase tracking-[0.12em]', dark ? 'text-[#6cb4ff]' : 'text-marker')}>{eyebrow}</span>
      <Typography variant="h1" as="h2" className={cn(dark && 'text-white')}>
        {title}
      </Typography>
      {sub && (
        <Typography variant="lead" className={cn('max-w-2xl', dark && 'text-gray-400')}>
          {sub}
        </Typography>
      )}
    </Reveal>
  );
}

export default async function Landing() {
  if (await currentUser()) redirect('/app');
  const publicUrl = getEnv().PUBLIC_URL;
  return (
    <div id="top" className="relative min-h-screen overflow-x-clip pb-12">
      <SiteHeader />

      <div className="mx-auto max-w-[1160px] px-4 md:px-5">
        {/* Hero: copy left, the conversation right */}
        <section className="grid items-center gap-12 pt-20 md:pt-28 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Reveal>
              <h1 className="text-[2.4rem] font-semibold leading-[1.04] tracking-[-0.035em] text-ink md:text-[52px] lg:text-[60px]">
                Your PayPal shop. <span className="text-marker">Ready for AI shoppers.</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <Typography variant="lead" className="max-w-[540px]">
                Open Shelf turns what you already sell on PayPal into a store AI agents can search, question and buy from. Your store gets its own agent that answers from
                what you published, and every sale is a PayPal order the buyer approves.
              </Typography>
            </Reveal>
            <Reveal delay={280} className="flex flex-wrap gap-3">
              <FancyButton asChild variant="primary" size="medium">
                <a href="/login">
                  Set up with PayPal <ArrowRight className="size-4" />
                </a>
              </FancyButton>
              <DemoButton>Try the demo store</DemoButton>
            </Reveal>
            <Reveal delay={360} className="flex flex-wrap items-center gap-x-3 gap-y-3 text-[13px] text-muted">
              <span>Checkout by</span>
              <BrandIcon name="paypal" />
              <span className="mx-1 h-4 w-px bg-stroke-soft-200" aria-hidden />
              <span>Shoppers bring</span>
              <BrandIcon name="openai" />
              <BrandIcon name="google" />
              <BrandIcon name="claude" />
              <span>or any MCP client</span>
            </Reveal>
          </div>
          <Reveal delay={200} className="min-w-0">
            <AgentDemo />
          </Reveal>
        </section>

        {/* What happened next */}
        <section className="flex flex-col gap-4 pt-24">
          <Head eyebrow="See it work" title="An agent asks. Your store answers." sub="A shopper’s assistant talked to your store agent, then bought. This is what you see." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShoppingBag, t: 'Order placed by an agent', d: 'Oil-Free Gel Moisturizer · 50 ml', v: '$24.00' },
              { icon: Check, t: 'Approved in PayPal', d: 'The buyer signed off; nothing moved before that', v: 'Paid' },
              { icon: Truck, t: 'Tracking sent to PayPal', d: 'USPS 9400 1118 9922 3817 4963', v: 'Shipped' },
              { icon: MessagesSquare, t: 'A question it couldn’t answer', d: '“Safe in pregnancy?” → your inbox; your answer teaches it', v: 'Asked you' },
            ].map((r, i) => (
              <Reveal key={r.t} delay={i * 110} className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-regular-xs ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-regular-md">
                <span className={ICON_TILE}>
                  <r.icon className="size-4" />
                </span>
                <p className="text-[15px] font-semibold text-ink">{r.t}</p>
                <p className="text-[13px] leading-relaxed text-muted">{r.d}</p>
                <span className="mt-auto text-xs font-medium text-marker">{r.v}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="flex scroll-mt-24 flex-col gap-4 pt-24">
          <Head eyebrow="How it works" title="From PayPal to AI shoppers" sub="Three steps, and nothing for you to host." />
          <div className="mt-4 grid gap-x-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120} className="flex flex-col gap-1.5 border-t border-line py-5">
                <span className="mb-2 font-mono text-sm font-medium text-marker">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{s.body}</p>
              </Reveal>
            ))}
          </div>
          <div className="grid gap-x-6 md:grid-cols-3">
            {CELLS.map((c, i) => (
              <Reveal key={c.title} delay={i * 120} className="flex flex-col gap-1.5 border-t border-line py-5">
                <span className={cn(ICON_TILE, 'mb-2')}>
                  <c.icon className="size-4" />
                </span>
                <h3 className="text-[15px] font-semibold text-ink">{c.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{c.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* After the sale */}
        <section className="grid items-center gap-10 pt-24 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Head eyebrow="After the sale" title="Paid, shipped, refunded" sub="Every order is a PayPal order in your account. The rest of the sale runs from the same place." />
            <Reveal>
              <ol className="mt-2 flex flex-col">
                {[
                  ['Tracking to PayPal', 'Add a tracking number and PayPal and the buyer get it. Agents read it back with order_status.'],
                  ['Refunds in policy', 'Inside your window, a shopper’s agent gets an instant PayPal refund. Outside it, you decide.'],
                  ['Questions inbox', 'What your store agent couldn’t answer waits for you. Answer once and it knows from then on.'],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4 border-t border-line py-4">
                    <span className="w-6 pt-px font-mono text-sm font-medium text-marker">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block text-[15px] font-semibold text-ink">{t}</span>
                      <span className="text-sm leading-relaxed text-muted">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">Orders</p>
                <span className="text-xs text-muted">Your store</span>
              </div>
              {[
                ['Oil-Free Gel Moisturizer', 'agent · Claude', '$24.00', 'Paid', 'bg-green-500/10 text-green-700'],
                ['Clarifying Gel Cleanser', 'agent · ChatGPT', '$18.00', 'Shipped', 'bg-blue-500/10 text-blue-700'],
                ['Rose Clay Mask', 'store page', '$22.00', 'Refunded', 'bg-gray-500/10 text-gray-700'],
              ].map(([n, w, p, s, c], i) => (
                <Reveal key={n} delay={200 + i * 150} className="flex items-center gap-3 border-b border-line px-5 py-4 last:border-b-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-paper ring-1 ring-line">
                    <PackageCheck className="size-4 text-ink" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{n}</p>
                    <p className="text-[13px] text-muted">{w}</p>
                  </div>
                  <span className="text-sm tabular-nums text-ink">{p}</span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', c)}>{s}</span>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* For agents */}
        <section id="agents" className="mt-24 scroll-mt-24 rounded-[28px] bg-gray-950 px-6 py-14 md:px-12 md:py-16">
          <Head dark eyebrow="For AI agents" title="Any agent can shop here" sub="Add the Open Shelf directory to Claude, ChatGPT or any MCP client. Each store also has its own endpoint." />
          <Reveal className="mt-8 flex max-w-xl items-center gap-3 rounded-xl bg-white/[0.06] p-3 pl-4 ring-1 ring-white/10">
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-[#9fd0ff]">{publicUrl}/mcp</code>
            <CopyButton text={`${publicUrl}/mcp`} />
          </Reveal>
          <div className="mt-10 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t, i) => (
              <Reveal key={t.n} delay={i * 110} className="border-t border-white/10 py-5">
                <span className="font-mono text-xs text-[#6cb4ff]">{t.n}</span>
                <p className="mt-3 font-mono text-[13px] text-white">{t.t}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-400">{t.d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 mt-24 flex flex-col items-center gap-3 rounded-[28px] bg-card px-8 py-16 text-center shadow-regular-md ring-1 ring-line">
          <Typography variant="h1" as="h2" className="max-w-2xl">
            Open your shelf in a minute
          </Typography>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <FancyButton asChild variant="primary">
              <a href="/login">
                Set up with PayPal <ArrowRight className="size-4" />
              </a>
            </FancyButton>
            <DemoButton>Try the demo store</DemoButton>
          </div>
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <Undo2 className="size-3.5" /> Free during the hackathon. Runs on the PayPal sandbox: nothing real is charged.
          </span>
        </section>

        <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line pt-6 text-[13px] text-muted">
          <span>Open Shelf · PayPal Server SDK · Claude · MCP · Channel3 · Cloudflare Workers</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: '/s/dewdrop', label: 'Demo store' },
              { href: '/mcp', label: 'MCP directory' },
              { href: '/sitemap.xml', label: 'Sitemap' },
              { href: '/login', label: 'Sign in' },
            ].map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
          </nav>
          <span className="w-full">Built for the PayPal AI Hackathon 2026</span>
        </footer>
      </div>
    </div>
  );
}
