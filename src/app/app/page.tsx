import { ArrowRight, Bot, Check, CircleDollarSign, ExternalLink, Globe, Inbox, MessageCircle, Package, Plug, Plus, Receipt } from 'lucide-react';
import { EmptyPanel, PageBody, PageHeader, Row, Rows, SectionCard, StatusDot } from '@/components/app/chrome';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { CopyButton } from '@/components/common/copy-button';
import { BrandIcon } from '@/components/ui/brand-icon';
import { FancyButton } from '@/components/ui/fancy-button';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import { connections, DISTRIBUTION, type C3Connection } from '@/server/channel3';
import { dashboard } from '@/server/page-context';
import { fmt } from '@/server/store';
import { cn } from '@/lib/utils';
import { connectChannel3Action, listOnChannel3Action, unlistAction } from './actions';

const PLATFORM: Record<string, string> = { openai: 'ChatGPT (OpenAI)', google: 'Google', microsoft: 'Microsoft Copilot', perplexity: 'Perplexity', paypal: 'PayPal', channel3: 'Channel3 network', web_crawl: 'Web crawl' };

function when(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

function Stat({ icon, label, value, sub, tone, href }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'success' | 'warning'; href: string }) {
  return (
    <a href={href} className="group flex items-center gap-3.5 rounded-20 bg-bg-white-0 p-4 shadow-fancy-buttons-stroke transition-shadow hover:shadow-regular-md">
      <span
        className={cn(
          'hidden size-10 shrink-0 items-center justify-center rounded-full ring-1 sm:flex ring-inset [&>svg]:size-[18px]',
          tone === 'success' ? 'bg-success-lighter text-success-base ring-success-base/20' : tone === 'warning' ? 'bg-warning-lighter text-warning-base ring-warning-base/20' : 'bg-primary-alpha-10 text-primary-base ring-primary-alpha-16',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-paragraph-xs text-text-sub-600">{label}</p>
        <p className="text-title-h5 tabular-nums text-text-strong-950">{value}</p>
        {sub && <p className="text-paragraph-xs text-text-sub-600">{sub}</p>}
      </div>
      <ArrowRight className="size-4 shrink-0 text-text-soft-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </a>
  );
}

/** The three things that make a store shoppable, ticked off as they happen. */
function Setup({ steps }: { steps: { title: string; body: string; done: boolean; href: string; cta: string }[] }) {
  const done = steps.filter((x) => x.done).length;
  return (
    <section className="rounded-20 bg-bg-white-0 p-4 shadow-fancy-buttons-stroke">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-label-md text-text-strong-950">Get your store ready for AI shoppers</h2>
          <p className="text-paragraph-xs text-text-sub-600">{done} of {steps.length} done</p>
        </div>
        <div className="h-1.5 w-20 shrink-0 overflow-hidden sm:w-28 rounded-full bg-bg-soft-200">
          <div className="h-full rounded-full bg-primary-base transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((x, i) => (
          <li key={x.title} className={cn('flex flex-col gap-2 rounded-2xl p-3.5 ring-1 ring-inset', x.done ? 'bg-bg-weak-50 ring-stroke-soft-200' : 'bg-bg-white-0 ring-primary-alpha-24')}>
            <span className="flex items-center gap-2">
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', x.done ? 'bg-success-base text-static-white' : 'bg-primary-alpha-10 text-primary-base')}>
                {x.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn('text-label-sm', x.done ? 'text-text-sub-600 line-through decoration-text-soft-400' : 'text-text-strong-950')}>{x.title}</span>
            </span>
            <p className="text-paragraph-xs leading-relaxed text-text-sub-600">{x.body}</p>
            {!x.done && (
              <a href={x.href} className="mt-auto inline-flex items-center gap-1 text-label-xs text-primary-base hover:underline">
                {x.cta} <ArrowRight className="size-3.5" />
              </a>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function Overview({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const { env, store, shop, user, canTakePayments } = await dashboard();
  const { n, e } = await searchParams;
  const [products, questions, orders] = await Promise.all([store.products(shop.id), store.questions(shop.id, 500), store.orders(shop.id, 500)]);
  const paid = orders.filter((o) => o.status === 'paid' || o.status === 'shipped');
  const unanswered = questions.filter((q) => !q.answered && !q.merchantAnswer).length;
  const feed = [...questions.slice(0, 12).map((q) => ({ at: q.createdAt, q })), ...orders.slice(0, 12).map((o) => ({ at: o.createdAt, o }))].sort((a, b) => b.at - a.at).slice(0, 12);
  const mcp = `${env.PUBLIC_URL}/s/${shop.slug}/mcp`;
  const directory = `${env.PUBLIC_URL}/mcp`;

  let c3: C3Connection[] = [];
  let c3Error = '';
  if (shop.channel3CustomerId && env.CHANNEL3_PARTNER_KEY) {
    c3 = await connections(env, shop.channel3CustomerId).catch((err) => {
      c3Error = err instanceof Error ? err.message : String(err);
      return [];
    });
  }
  const ownSite = Boolean(shop.website && shop.channel3CustomerId);
  const tryPrompt = `Find me something from ${shop.name} under $30, check it suits me, and buy it.`;
  const steps = [
    { title: 'Add your products', body: 'Import PayPal payment links, a Shopify store or a price list.', done: products.length > 0, href: '/app/products', cta: 'Bring in products' },
    { title: 'Talk to your store agent', body: 'Add your endpoint to Claude and ask it to shop here, or ask on your store page.', done: questions.length > 0 || orders.length > 0, href: '#endpoint', cta: 'Copy the endpoint' },
    { title: 'Get listed everywhere', body: 'Channel3 puts your catalog in ChatGPT, Google, Perplexity and PayPal.', done: shop.listed, href: '#listing', cta: 'List on Channel3' },
  ];

  return (
    <>
      <PageHeader
        title={shop.name}
        description={shop.tagline || 'Add a tagline in Settings so agents know what you sell.'}
        actions={
          <>
            <FancyButton asChild variant="basic" size="small">
              <a href={`/s/${shop.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> View store
              </a>
            </FancyButton>
            <FancyButton asChild variant="primary" size="small">
              <a href="/app/products/new">
                <Plus className="size-4" /> Add product
              </a>
            </FancyButton>
          </>
        }
      />
      <PageBody>
        <Notices demo={user.isAnonymous} canTakePayments={canTakePayments} n={n} e={e} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Package />} href="/app/products" label="Products on the shelf" value={String(products.length)} />
          <Stat icon={<MessageCircle />} href="/app/questions" label="Questions from shoppers" value={String(questions.length)} sub={`${questions.filter((q) => q.asker === 'agent').length} from AI agents`} />
          <Stat icon={<Inbox />} href="/app/questions" label="Waiting for your answer" value={String(unanswered)} tone={unanswered ? 'warning' : undefined} sub={unanswered ? 'Answer once, it learns' : 'All caught up'} />
          <Stat icon={<CircleDollarSign />} href="/app/orders" label="Paid sales" value={fmt(paid.reduce((s, o) => s + o.totalCents, 0), shop.currency)} sub={`${paid.filter((o) => o.channel === 'agent').length} by AI agents`} tone={paid.length ? 'success' : undefined} />
        </div>

        {steps.some((x) => !x.done) && <Setup steps={steps} />}

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            className="scroll-mt-24"
            icon={<Plug />}
            tone="primary"
            title="Agent endpoint"
            description={shop.listed ? 'You’re in the Open Shelf directory: one endpoint for every listed store.' : 'Any MCP client can ask your store questions and buy from it.'}
            action={
              <span className="flex items-center gap-1">
                <BrandIcon name="claude" size="sm" />
                <BrandIcon name="openai" size="sm" />
              </span>
            }
            footer={
              <>
                <p className="min-w-0 flex-1 text-paragraph-xs text-text-sub-600">
                  Then ask: <span className="text-text-strong-950">“{tryPrompt}”</span>
                </p>
                <CopyButton text={tryPrompt} />
              </>
            }
          >
            <div id="endpoint" className="flex flex-col gap-3">
              {(shop.listed ? [['Open Shelf directory · every listed store', directory], ['Just your store · to share', mcp]] : [['Your store', mcp]]).map(([label, url]) => (
                <div key={url} className="flex flex-col gap-1.5">
                  <span className="text-paragraph-xs text-text-sub-600">{label}</span>
                  <div className="flex items-center gap-2 rounded-10 bg-bg-weak-50 p-2 pl-3 ring-1 ring-inset ring-stroke-soft-200">
                    <code className="min-w-0 flex-1 truncate font-mono text-paragraph-sm text-text-strong-950">{url}</code>
                    <CopyButton text={url} />
                  </div>
                </div>
              ))}
              <p className="text-paragraph-xs text-text-sub-600">
                In Claude: <span className="text-text-strong-950">Settings → Connectors → Add custom connector</span>, then paste it.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Globe />}
            title="Get found by every AI shopping app"
            description={
              shop.listed
                ? ownSite
                  ? `Channel3 crawls ${shop.website} and distributes your catalog. Switch on each AI surface below.`
                  : 'Listed through the Open Shelf marketplace: Channel3 reads your products from the Open Shelf sitemap.'
                : 'Channel3 syncs your catalog to AI shopping apps. Every listing links back to your store, where checkout is PayPal.'
            }
            action={
              <StatusBadge.Root status={shop.listed ? 'completed' : 'disabled'} variant="light">
                <StatusBadge.Dot />
                {shop.listed ? 'Listed' : 'Not listed'}
              </StatusBadge.Root>
            }
            footer={
              shop.listed ? (
                <>
                  {ownSite && (
                    <form action={connectChannel3Action}>
                      <Submit size="xsmall">Connect a platform</Submit>
                    </form>
                  )}
                  <a href="/sitemap.xml" target="_blank" className="text-paragraph-xs text-text-sub-600 underline underline-offset-2">
                    sitemap.xml
                  </a>
                  <form action={unlistAction} className="ml-auto">
                    <Submit variant="basic" size="xsmall">
                      Unlist
                    </Submit>
                  </form>
                </>
              ) : undefined
            }
          >
            {!shop.listed ? (
              <div id="listing" className="flex scroll-mt-24 flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    ['openai', 'ChatGPT'],
                    ['google', 'Google'],
                    ['perplexity', 'Perplexity'],
                    ['paypal', 'PayPal'],
                  ].map(([k, label]) => (
                    <span key={k} className="flex items-center gap-1.5 rounded-full bg-bg-weak-50 py-1 pl-1 pr-2.5 text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                      <BrandIcon name={k} size="sm" className="size-5 rounded-full" />
                      {label}
                    </span>
                  ))}
                  <span className="text-paragraph-xs text-text-soft-400">+ Copilot</span>
                </div>
              <form action={listOnChannel3Action} className="flex flex-col gap-2 sm:flex-row">
                <Input name="website" placeholder="Your own website, if you have one (optional)" />
                <Submit size="medium" pending="Listing…" className="shrink-0">
                  List on Channel3
                </Submit>
              </form>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!env.CHANNEL3_PARTNER_KEY && <p className="text-paragraph-xs text-text-sub-600">Channel3 partner access is not configured on this deployment yet, so this shows your Open Shelf listing only.</p>}
                {c3Error && <p className="text-paragraph-xs text-error-base">{c3Error}</p>}
                {c3.length > 0 && (
                  <Rows>
                    {c3
                      .filter((c) => c.category === 'distribution' || c.platform === 'web_crawl')
                      .map((c) => (
                        <Row key={c.platform}>
                          <span className="min-w-0 flex-1 text-label-sm text-text-strong-950">{PLATFORM[c.platform] ?? c.display_name}</span>
                          {c.sync && <span className="text-paragraph-xs text-text-sub-600">{c.sync.state}{c.sync.total_products != null ? ` · ${c.sync.synced_products ?? 0}/${c.sync.total_products}` : ''}</span>}
                          <StatusDot tone={c.status === 'active' ? 'success' : c.status === 'action_required' ? 'warning' : 'idle'}>{c.status === 'active' ? 'Connected' : c.status === 'action_required' ? 'Waiting' : 'Not connected'}</StatusDot>
                          {ownSite && c.status !== 'active' && (DISTRIBUTION as readonly string[]).includes(c.platform) && (
                            <form action={connectChannel3Action}>
                              <input type="hidden" name="platform" value={c.platform} />
                              <Submit variant="basic" size="xsmall">
                                Connect
                              </Submit>
                            </form>
                          )}
                        </Row>
                      ))}
                  </Rows>
                )}
                {!ownSite && (
                  <form action={listOnChannel3Action} className="flex flex-col gap-2 sm:flex-row">
                    <Input name="website" placeholder="yourshop.com: manage ChatGPT, Google and PayPal yourself" />
                    <Submit variant="basic" size="medium" className="shrink-0">
                      Use my website
                    </Submit>
                  </form>
                )}
              </div>
            )}
            {user.isAnonymous && !shop.listed && <p className="mt-2 text-paragraph-xs text-text-sub-600">Demo stores stay private. Log in with PayPal to list a real store.</p>}
          </SectionCard>
        </div>

        <SectionCard
          icon={<Bot />}
          title="What shoppers and agents did"
          description="Questions to your store agent and orders, newest first."
          className="[&_h2]:text-label-md"
          action={
            <FancyButton asChild variant="basic" size="xsmall">
              <a href="/app/questions">All questions</a>
            </FancyButton>
          }
        >
          {feed.length ? (
            <Rows>
              {feed.map((f) =>
                'q' in f && f.q ? (
                  <Row key={f.q.id} className="items-start">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                      {f.q.asker === 'agent' ? <Bot className="size-4" /> : <MessageCircle className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-sm text-text-strong-950">{f.q.question}</p>
                      <p className="line-clamp-2 text-paragraph-xs text-text-sub-600">{f.q.merchantAnswer ?? f.q.answer}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge.Root status={f.q.answered || f.q.merchantAnswer ? 'completed' : 'pending'} variant="light">
                        <StatusBadge.Dot />
                        {f.q.merchantAnswer ? 'You answered' : f.q.answered ? 'Answered' : 'Needs answer'}
                      </StatusBadge.Root>
                      <span className="text-paragraph-xs text-text-soft-400">
                        {f.q.asker === 'agent' ? 'AI agent' : 'Store page'} · {when(f.q.createdAt)}
                      </span>
                    </div>
                  </Row>
                ) : 'o' in f && f.o ? (
                  <Row key={f.o.id} className="items-start">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-lighter text-success-base ring-1 ring-inset ring-success-base/20">
                      <Receipt className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-sm text-text-strong-950">
                        Order {f.o.id} · {fmt(f.o.totalCents, f.o.currency)}
                      </p>
                      <p className="truncate text-paragraph-xs text-text-sub-600">{f.o.items.map((i) => `${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', ')}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge.Root status={f.o.status === 'refunded' || f.o.status === 'cancelled' ? 'failed' : f.o.status === 'created' ? 'pending' : 'completed'} variant="light">
                        <StatusBadge.Dot />
                        {f.o.status === 'created' ? 'Awaiting payment' : f.o.status.charAt(0).toUpperCase() + f.o.status.slice(1)}
                      </StatusBadge.Root>
                      <span className="text-paragraph-xs text-text-soft-400">
                        {f.o.channel === 'agent' ? 'AI agent' : 'Store page'} · {when(f.o.createdAt)}
                      </span>
                    </div>
                  </Row>
                ) : null,
              )}
            </Rows>
          ) : (
            <EmptyPanel icon={<Bot />} title="Nothing yet" description={`Connect an agent to the endpoint above and ask it to shop at ${shop.name}, or ask a question on your store page.`} />
          )}
        </SectionCard>
      </PageBody>
    </>
  );
}
