import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Check,
  FileText,
  Globe,
  Link2,
  MessagesSquare,
  PackageCheck,
  Plug,
  Receipt,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Undo2,
} from 'lucide-react';
import { DemoButton } from '@/components/common/demo-button';
import { Wordmark } from '@/components/brand';
import { EyebrowPill, Frame, SectionHeader } from '@/components/landing/canvas';
import { Footer } from '@/components/landing/footer';
import { AnnouncementBar, Nav } from '@/components/landing/nav';
import { BrandIcon } from '@/components/ui/brand-icon';
import { FancyButton } from '@/components/ui/fancy-button';
import { Reveal } from '@/components/ui/reveal';
import { Typography } from '@/components/ui/typography';
import { CopyButton } from '@/components/common/copy-button';
import { currentUser } from '@/server/session';
import { getEnv } from '@/server/env';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#agents', label: 'For agents' },
  { href: '/s/dewdrop', label: 'Demo store' },
];

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

function Line({ who, children, tone = 'muted' }: { who: string; children: React.ReactNode; tone?: 'muted' | 'marker' }) {
  return (
    <div className="flex gap-3 text-[13px] leading-relaxed">
      <span className="w-32 shrink-0 pt-px font-mono text-xs text-muted">{who}</span>
      <span className={cn('min-w-0 break-words text-ink', tone === 'marker' && 'text-marker')}>{children}</span>
    </div>
  );
}

export default async function Landing() {
  if (await currentUser()) redirect('/app');
  const publicUrl = getEnv().PUBLIC_URL;
  return (
    <div id="top" className="min-h-screen">
      <AnnouncementBar>
        <span className="font-semibold text-white">Open Shelf:</span> your PayPal shop, ready for AI shoppers.{' '}
        <a href="/s/dewdrop" className="font-medium text-white underline underline-offset-2">
          See a demo store
        </a>
      </AnnouncementBar>
      <div className="mx-auto max-w-[1240px] border-line bg-card xl:border-x">
        <Nav
          brand={
            <a href="/#top">
              <Wordmark />
            </a>
          }
          links={NAV}
          action={
            <FancyButton asChild variant="primary" size="small">
              <a href="/login">Set up with PayPal</a>
            </FancyButton>
          }
        />

        {/* Hero */}
        <div className="px-6 pb-14 pt-28 text-center md:pb-16 md:pt-36">
          <Reveal>
            <Typography variant="display" as="h1" className="mx-auto max-w-4xl">
              Your PayPal shop.
              <br className="hidden md:block" /> Ready for AI shoppers.
            </Typography>
          </Reveal>
          <Reveal delay={140}>
            <Typography variant="lead" className="mx-auto mt-6 max-w-2xl">
              Open Shelf turns what you already sell on PayPal into a store AI agents can search, question and buy from. Your store gets its own agent that answers from
              what you published, and every sale is a PayPal order the buyer approves.
            </Typography>
          </Reveal>
          <Reveal delay={280} className="mt-9 flex flex-wrap justify-center gap-3">
            <FancyButton asChild variant="primary" size="medium" className="w-56">
              <a href="/login">Set up with PayPal</a>
            </FancyButton>
            <DemoButton className="w-48">Try the demo store</DemoButton>
          </Reveal>
          <Reveal delay={360} className="mt-8 flex flex-col items-center gap-3 text-[13px] text-muted">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
              <span>Checkout by</span>
              <BrandIcon name="paypal" />
              <span className="mx-1 h-4 w-px bg-stroke-soft-200" aria-hidden />
              <span>Shoppers bring</span>
              <BrandIcon name="openai" />
              <BrandIcon name="google" />
              <span>Claude and any MCP client</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
              <span>Import from</span>
              <BrandIcon name="paypal" />
              <span>payment links and invoices, Shopify, any page</span>
              <span className="mx-1 h-4 w-px bg-stroke-soft-200" aria-hidden />
              <span>Listed on Channel3</span>
            </div>
          </Reveal>
        </div>

        {/* See it work */}
        <section className="px-6 pb-16 md:px-10 md:pb-24">
          <SectionHeader icon={Sparkles} eyebrow="See it work" title="An agent asks. Your store answers." sub="A shopper’s assistant talking to Dewdrop Skincare’s store agent, then buying." />
          <Reveal className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0 overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">Shopping Dewdrop Skincare</p>
                  <p className="text-xs text-muted">via Claude · today, 10:24</p>
                </div>
                <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">Store agent online</span>
              </div>
              <div className="flex flex-col gap-3 px-5 py-5">
                <Line who="Shopper">Find a moisturizer for oily skin under $30. Will it clog pores?</Line>
                <Line who="Shopper's agent">search_products · ask_store(&ldquo;oily skin, comedogenic, fragrance?&rdquo;)</Line>
                <Line who="Your Store Agent" tone="marker">
                  The Oil-Free Gel Moisturizer is lab-tested non-comedogenic, with no added fragrance. Niacinamide 4% helps balance oil. $24 for 50 ml.
                </Line>
                <Line who="Shopper">Buy the 50 ml.</Line>
                <Line who="PayPal">Approved by the shopper · $24.00 · paid to Dewdrop</Line>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              {[
                { icon: ShoppingBag, t: 'Order placed by an agent', d: 'Oil-Free Gel Moisturizer · 50 ml', v: '$24.00' },
                { icon: Check, t: 'Approved in PayPal', d: 'The buyer signed off; nothing moved before that', v: 'Paid' },
                { icon: Truck, t: 'Tracking sent to PayPal', d: 'USPS 9400 1118 9922 3817 4963', v: 'Shipped' },
                { icon: MessagesSquare, t: 'A question it couldn’t answer', d: '“Safe in pregnancy?” → your inbox; your answer teaches it', v: 'Asked you' },
              ].map((r) => (
                <div key={r.t} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-regular-xs ring-1 ring-line">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-paper text-ink ring-1 ring-line">
                    <r.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{r.t}</p>
                    <p className="truncate text-[13px] text-muted">{r.d}</p>
                  </div>
                  <span className="text-xs font-medium text-muted">{r.v}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Three cells */}
        <Reveal className="px-6 pb-16 md:px-10 md:pb-24">
          <Frame className="mx-auto grid max-w-5xl grid-cols-1 bg-card md:grid-cols-3">
            {CELLS.map((c, i) => (
              <div key={c.title} className={cn('flex flex-col items-center gap-2 px-6 py-8 text-center', i > 0 && 'border-t border-line md:border-l md:border-t-0')}>
                <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-card text-marker shadow-regular-xs ring-1 ring-line">
                  <c.icon className="size-5" />
                </span>
                <h3 className="text-[15px] font-semibold text-ink">{c.title}</h3>
                <p className="text-sm text-muted">{c.body}</p>
              </div>
            ))}
          </Frame>
        </Reveal>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-line px-6 py-16 md:px-10 md:py-24">
          <SectionHeader icon={Store} eyebrow="How it works" title="From PayPal to AI shoppers" sub="Three steps, and nothing for you to host." />
          <Reveal className="mt-12">
            <Frame className="mx-auto grid max-w-5xl grid-cols-1 bg-card md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className={cn('flex flex-col gap-3 p-8', i > 0 && 'border-t border-line md:border-l md:border-t-0')}>
                  <span className="font-mono text-sm font-medium text-marker">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              ))}
            </Frame>
          </Reveal>
        </section>

        {/* After the sale */}
        <section className="grid items-center gap-10 border-t border-line px-6 py-16 md:grid-cols-2 md:px-10 md:py-24">
          <Reveal className="flex flex-col items-start gap-5">
            <EyebrowPill icon={Receipt}>After the sale</EyebrowPill>
            <Typography variant="h1" as="h2">
              Paid, shipped, refunded
            </Typography>
            <Typography variant="lead" className="max-w-lg">
              Every order is a PayPal order in your account. The rest of the sale runs from the same place.
            </Typography>
            <ol className="mt-2 flex flex-col gap-4">
              {[
                ['Tracking to PayPal', 'Add a tracking number and PayPal and the buyer get it. Agents read it back with order_status.'],
                ['Refunds in policy', 'Inside your window, a shopper’s agent gets an instant PayPal refund. Outside it, you decide.'],
                ['Questions inbox', 'What your store agent couldn’t answer waits for you. Answer once and it knows from then on.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="w-6 pt-px font-mono text-sm font-medium text-marker">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{t}</span>
                    <span className="text-sm leading-relaxed text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-20 bg-card shadow-card ring-1 ring-line">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">Orders</p>
                <span className="text-xs text-muted">Dewdrop Skincare</span>
              </div>
              {[
                ['Oil-Free Gel Moisturizer', 'agent · Claude', '$24.00', 'Paid', 'bg-green-500/10 text-green-700'],
                ['Clarifying Gel Cleanser', 'agent · ChatGPT', '$18.00', 'Shipped', 'bg-blue-500/10 text-blue-700'],
                ['Rose Clay Mask', 'store page', '$22.00', 'Refunded', 'bg-gray-500/10 text-gray-700'],
              ].map(([n, w, p, s, c]) => (
                <div key={n} className="flex items-center gap-3 border-b border-line px-5 py-4 last:border-b-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-paper ring-1 ring-line">
                    <PackageCheck className="size-4 text-ink" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{n}</p>
                    <p className="text-[13px] text-muted">{w}</p>
                  </div>
                  <span className="text-sm tabular-nums text-ink">{p}</span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', c)}>{s}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* For agents */}
        <section id="agents" className="scroll-mt-20 px-4 pb-16 md:px-8 md:pb-24">
          <div className="rounded-[28px] bg-[#003087] px-6 py-16 md:px-12 md:py-20">
            <SectionHeader dark icon={Plug} eyebrow="For AI agents" title="Any agent can shop here" sub="Add the Open Shelf directory to Claude, ChatGPT or any MCP client. Each store also has its own endpoint." />
            <Reveal className="mx-auto mt-10 flex max-w-xl items-center gap-3 rounded-xl bg-white/[0.06] p-3 pl-4 ring-1 ring-white/10">
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-[#9fd0ff]">{publicUrl}/mcp</code>
              <CopyButton text={`${publicUrl}/mcp`} />
            </Reveal>
            <Reveal className="mx-auto mt-10 grid max-w-5xl gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-4">
              {TOOLS.map((t) => (
                <div key={t.n} className="bg-[#003087] p-6">
                  <span className="font-mono text-xs text-[#6cb4ff]">{t.n}</span>
                  <p className="mt-3 font-mono text-[13px] text-white">{t.t}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-blue-100/75">{t.d}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center gap-6 border-t border-line px-6 py-20 text-center">
          <EyebrowPill icon={FileText}>Free during the hackathon</EyebrowPill>
          <Typography variant="h1" as="h2" className="max-w-2xl">
            Open your shelf in a minute
          </Typography>
          <div className="flex flex-wrap justify-center gap-3">
            <FancyButton asChild variant="primary" className="w-56">
              <a href="/login">
                Set up with PayPal <ArrowRight className="size-4" />
              </a>
            </FancyButton>
            <DemoButton className="w-48">Try the demo store</DemoButton>
          </div>
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <Undo2 className="size-3.5" /> Runs on the PayPal sandbox: nothing real is charged.
          </span>
        </section>

        <Footer
          title="Your PayPal shop, ready for AI shoppers."
          sub="Ask it anything. Buy through PayPal."
          word="openshelf"
          links={[
            { href: '#how', label: 'How it works' },
            { href: '/s/dewdrop', label: 'Demo store' },
            { href: '/mcp', label: 'MCP directory' },
            { href: '/sitemap.xml', label: 'Sitemap' },
            { href: '/login', label: 'Sign in' },
          ]}
        />
      </div>
    </div>
  );
}
