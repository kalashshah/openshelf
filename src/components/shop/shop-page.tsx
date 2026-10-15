import { Bot, ChevronLeft, MessagesSquare, Plug, ShieldCheck, ShoppingBag, Store, Truck, Undo2, Zap } from 'lucide-react';
import { ShopMark } from '@/components/brand';
import { CopyButton } from '@/components/common/copy-button';
import { EyebrowPill, SectionHeader } from '@/components/landing/canvas';
import { Footer } from '@/components/landing/footer';
import { AnnouncementBar, Nav } from '@/components/landing/nav';
import { Alert } from '@/components/ui/alert';
import { FancyButton } from '@/components/ui/fancy-button';
import { Typography } from '@/components/ui/typography';
import { hueOf, productArt, productJsonLd, productUrl } from '@/server/catalog-view';
import type { Product, Shop } from '@/server/store';
import { AskPanel } from './ask-panel';
import { ProductCard, type CardProduct } from './product-card';

function toCard(shop: Shop, p: Product): CardProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    art: productArt(p, shop.name.trim().charAt(0).toUpperCase()),
    stock: p.stock,
    needsShipping: p.needsShipping,
    variants: p.variants,
    marketMinCents: p.market?.minCents ?? null,
  };
}

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

/** A store's public page; with `focus`, that product's own page (it leads, the rest follow). */
export function ShopPage({ shop, products, publicUrl, canBuy, demo, error, focus }: { shop: Shop; products: Product[]; publicUrl: string; canBuy: boolean; demo: boolean; error?: string; focus?: Product }) {
  const hue = hueOf(shop.name);
  const mcp = `${publicUrl}/s/${shop.slug}/mcp`;
  const others = products.filter((p) => p.id !== focus?.id);
  const allServices = products.length > 0 && products.every((p) => !p.needsShipping);
  const trust = [
    { icon: Undo2, text: `${shop.refundDays}-day refunds` },
    { icon: ShieldCheck, text: 'PayPal checkout' },
    allServices ? { icon: Zap, text: 'Booked online' } : { icon: Truck, text: 'Ships to your PayPal address' },
    { icon: Bot, text: 'Agent-ready' },
  ];
  const suggestions = [
    'What would you recommend for me?',
    products[0] && `Tell me about the ${products[0].name}`,
    'How do refunds work?',
    products[1] && products[0] && `${products[1].name} or ${products[0].name}?`,
  ].filter(Boolean) as string[];
  const word = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '');

  return (
    <div className="min-h-screen">
      <JsonLd
        data={
          focus
            ? productJsonLd(publicUrl, shop, focus)
            : { '@context': 'https://schema.org', '@type': 'ItemList', name: shop.name, itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: productUrl(publicUrl, shop, p), name: p.name })) }
        }
      />
      <AnnouncementBar>
        {demo ? (
          <>
            <span className="font-semibold text-white">Sandbox store:</span> nothing real is charged. Pay with test card 4005 5192 0000 0004, any future date, CVV 123.
          </>
        ) : (
          <>
            <span className="font-semibold text-white">{shop.name}</span> is open to AI agents.{' '}
            <a href="#agents" className="font-medium text-white underline underline-offset-2">
              Shop with yours
            </a>
          </>
        )}
      </AnnouncementBar>
      <div className="mx-auto max-w-[1240px] border-line bg-card xl:border-x">
        <Nav
          brand={
            <a href={`/s/${shop.slug}`} className="flex items-center gap-2.5">
              <ShopMark name={shop.name} hue={hue} className="size-8 text-sm shadow-regular-sm" />
              <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{shop.name}</span>
            </a>
          }
          links={[
            { href: `/s/${shop.slug}#shop`, label: 'Shop' },
            { href: `/s/${shop.slug}#ask`, label: 'Ask the shop' },
            { href: `/s/${shop.slug}#agents`, label: 'Shop with AI' },
          ]}
          action={
            <FancyButton asChild variant="primary" size="small">
              <a href="#ask">
                <MessagesSquare className="size-4" />
                Ask the shop
              </a>
            </FancyButton>
          }
        />

        {error && (
          <div className="mx-auto max-w-2xl px-6 pt-6">
            <Alert>{error}</Alert>
          </div>
        )}

        {focus ? (
          <section className="px-6 pt-8 md:px-10">
            <a href={`/s/${shop.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              <ChevronLeft className="size-4" /> All of {shop.name}
            </a>
            <div className="mx-auto mt-5 max-w-5xl">
              <ProductCard p={toCard(shop, focus)} slug={shop.slug} currency={shop.currency} canBuy={canBuy} wide />
            </div>
          </section>
        ) : (
          <div className="px-6 pb-10 pt-20 text-center md:pt-28">
            <EyebrowPill icon={Store}>
              Independent shop · {products.length} {products.length === 1 ? 'item' : 'items'}
            </EyebrowPill>
            <Typography variant="display" as="h1" className="mx-auto mt-6 max-w-3xl">
              {shop.name}
            </Typography>
            <Typography variant="lead" className="mx-auto mt-5 max-w-xl">
              {shop.tagline || 'Welcome to our shop.'}
            </Typography>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <FancyButton asChild variant="primary" className="w-48">
                <a href="#shop">Shop the collection</a>
              </FancyButton>
              <FancyButton asChild variant="basic" className="w-44">
                <a href="#ask">Ask a question</a>
              </FancyButton>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
              {trust.map((t) => (
                <span key={t.text} className="inline-flex items-center gap-1.5">
                  <t.icon className="size-3.5" /> {t.text}
                </span>
              ))}
            </div>
          </div>
        )}

        <section className="px-6 py-12 md:px-10">
          <AskPanel slug={shop.slug} name={shop.name} hue={hue} suggestions={suggestions.slice(0, 4)} />
        </section>

        <section id="shop" className="scroll-mt-20 border-t border-line px-6 py-16 md:px-10 md:py-20">
          <SectionHeader icon={ShoppingBag} eyebrow={focus ? 'More from the shop' : 'The collection'} title={focus ? `More from ${shop.name}` : 'Everything on the shelf'} sub="Ask the shop anything before you buy. Checkout is PayPal." />
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p) => (
              <ProductCard key={p.id} p={toCard(shop, p)} slug={shop.slug} currency={shop.currency} canBuy={canBuy} />
            ))}
            {!others.length && <p className="col-span-full text-center text-sm text-muted">Nothing else on the shelf yet.</p>}
          </div>
        </section>

        <section id="agents" className="scroll-mt-20 px-4 pb-16 md:px-8 md:pb-20">
          <div className="rounded-[28px] bg-[#003087] px-6 py-16 md:px-12">
            <SectionHeader dark icon={Plug} eyebrow="Shop with your AI agent" title="Let your assistant do the shopping" sub={`${shop.name} is open to AI agents. Add the shop to Claude, ChatGPT or any MCP client.`} />
            <div className="mx-auto mt-10 flex max-w-xl items-center gap-3 rounded-xl bg-white/[0.06] p-3 pl-4 ring-1 ring-white/10">
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-[#9fd0ff]">{mcp}</code>
              <CopyButton text={mcp} />
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-4">
              {[
                ['01', 'Connect', 'In Claude: Settings → Connectors → Add custom connector.'],
                ['02', 'Ask', 'It asks the shop for you and gets the same answers you get here.'],
                ['03', 'Buy', 'It places the order; you approve the PayPal link. Nothing is charged without you.'],
                ['04', 'After', `Tracking, and refunds within ${shop.refundDays} days, through your assistant.`],
              ].map(([n, t, d]) => (
                <div key={n} className="bg-[#003087] p-6">
                  <span className="font-mono text-xs text-[#6cb4ff]">{n}</span>
                  <p className="mt-3 text-[15px] font-semibold text-white">{t}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-blue-100/75">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer
          title={shop.name}
          sub={shop.tagline || 'Independent shop'}
          word={word.length > 2 ? word : 'openshelf'}
          owner={shop.name}
          links={[
            { href: `/s/${shop.slug}#shop`, label: 'Shop' },
            { href: `/s/${shop.slug}#ask`, label: 'Ask the shop' },
            { href: `/s/${shop.slug}/llms.txt`, label: 'llms.txt' },
            { href: '/', label: 'Powered by Open Shelf' },
          ]}
        />
      </div>
    </div>
  );
}
