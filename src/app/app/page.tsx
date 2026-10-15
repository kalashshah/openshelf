import { Bot, ExternalLink, Globe, MessageCircle, Plug, Plus, Receipt } from 'lucide-react';
import { EmptyPanel, PageBody, PageHeader, Row, Rows, SectionCard, StatusDot } from '@/components/app/chrome';
import { Notices } from '@/components/app/notices';
import { Submit } from '@/components/app/submit';
import { CopyButton } from '@/components/common/copy-button';
import { FancyButton } from '@/components/ui/fancy-button';
import { Input } from '@/components/ui/input';
import * as StatusBadge from '@/components/ui/status-badge';
import { connections, DISTRIBUTION, type C3Connection } from '@/server/channel3';
import { dashboard } from '@/server/page-context';
import { fmt } from '@/server/store';
import { connectChannel3Action, listOnChannel3Action, unlistAction } from './actions';

const PLATFORM: Record<string, string> = { openai: 'ChatGPT (OpenAI)', google: 'Google', microsoft: 'Microsoft Copilot', perplexity: 'Perplexity', paypal: 'PayPal', channel3: 'Channel3 network', web_crawl: 'Web crawl' };

function when(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' | 'warning' }) {
  return (
    <div className="rounded-20 bg-bg-white-0 p-4 shadow-fancy-buttons-stroke">
      <p className="text-paragraph-xs text-text-sub-600">{label}</p>
      <p className={`mt-1.5 text-title-h5 tabular-nums ${tone === 'success' ? 'text-success-base' : tone === 'warning' ? 'text-warning-base' : 'text-text-strong-950'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-paragraph-xs text-text-sub-600">{sub}</p>}
    </div>
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

  let c3: C3Connection[] = [];
  let c3Error = '';
  if (shop.channel3CustomerId && env.CHANNEL3_PARTNER_KEY) {
    c3 = await connections(env, shop.channel3CustomerId).catch((err) => {
      c3Error = err instanceof Error ? err.message : String(err);
      return [];
    });
  }
  const ownSite = Boolean(shop.website && shop.channel3CustomerId);

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
          <Stat label="Products on the shelf" value={String(products.length)} />
          <Stat label="Questions from shoppers" value={String(questions.length)} />
          <Stat label="Waiting for your answer" value={String(unanswered)} tone={unanswered ? 'warning' : undefined} />
          <Stat label="Paid sales" value={fmt(paid.reduce((s, o) => s + o.totalCents, 0), shop.currency)} sub={`${paid.filter((o) => o.channel === 'agent').length} by AI agents`} tone="success" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            icon={<Plug />}
            tone="primary"
            title="Your store’s agent endpoint"
            description="Any MCP client can ask your store questions and buy from it. In Claude: Settings → Connectors → Add custom connector."
            footer={<p className="text-paragraph-xs text-text-sub-600">Then try: “Find me something from {shop.name} under $30, check it suits me, and buy it.”</p>}
          >
            <div className="flex items-center gap-2 rounded-10 bg-bg-weak-50 p-2 pl-3 ring-1 ring-inset ring-stroke-soft-200">
              <code className="min-w-0 flex-1 truncate font-mono text-paragraph-sm text-text-strong-950">{mcp}</code>
              <CopyButton text={mcp} />
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
                : 'List your products in Channel3’s product graph. It powers AI shopping apps and syncs to ChatGPT, Google, Copilot, Perplexity and PayPal. Every listing links back to your store, where checkout is PayPal.'
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
              <form action={listOnChannel3Action} className="flex flex-col gap-2 sm:flex-row">
                <Input name="website" placeholder="Your own website, if you have one (optional)" />
                <Submit size="medium" pending="Listing…" className="shrink-0">
                  List on Channel3
                </Submit>
              </form>
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
                    <MessageCircle className="mt-0.5 size-4 shrink-0 text-text-sub-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-label-sm text-text-strong-950">{f.q.question}</p>
                      <p className="line-clamp-2 text-paragraph-xs text-text-sub-600">{f.q.merchantAnswer ?? f.q.answer}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge.Root status={f.q.answered || f.q.merchantAnswer ? 'completed' : 'pending'} variant="light">
                        <StatusBadge.Dot />
                        {f.q.answered || f.q.merchantAnswer ? f.q.asker : 'Needs answer'}
                      </StatusBadge.Root>
                      <span className="text-paragraph-xs text-text-soft-400">{when(f.q.createdAt)}</span>
                    </div>
                  </Row>
                ) : 'o' in f && f.o ? (
                  <Row key={f.o.id} className="items-start">
                    <Receipt className="mt-0.5 size-4 shrink-0 text-text-sub-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-label-sm text-text-strong-950">
                        Order {f.o.id} · {fmt(f.o.totalCents, f.o.currency)}
                      </p>
                      <p className="truncate text-paragraph-xs text-text-sub-600">{f.o.items.map((i) => `${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', ')}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge.Root status={f.o.status === 'refunded' || f.o.status === 'cancelled' ? 'failed' : f.o.status === 'created' ? 'pending' : 'completed'} variant="light">
                        <StatusBadge.Dot />
                        {f.o.status === 'created' ? 'Waiting' : f.o.status} · {f.o.channel}
                      </StatusBadge.Root>
                      <span className="text-paragraph-xs text-text-soft-400">{when(f.o.createdAt)}</span>
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
