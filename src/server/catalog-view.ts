/** Pure helpers for showing a product: packshot art for products without a photo, URLs, and schema.org data. */
import { fmt, priceFor, type Product, type Shop } from './store';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** A stable hue per name, so every shop and product gets its own colour without anyone picking one. */
export function hueOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

type Kind = 'ticket' | 'box' | 'jar' | 'tube' | 'bottle' | 'book' | 'stickers' | 'bar' | 'bag' | 'mug';

/** What kind of packshot suits a product with no photo, judged from its words. Order matters: "Oily Skin Starter Set" is a set. */
export function kindOf(p: Pick<Product, 'name' | 'description' | 'needsShipping'>): Kind {
  if (!p.needsShipping) return 'ticket';
  const t = p.name.toLowerCase();
  const rules: [RegExp, Kind][] = [
    [/\b(call|session|consultation|coaching|lesson|class|appointment|booking|hour)\b/, 'ticket'],
    [/\b(set|kit|bundle|gift|box)\b/, 'box'],
    [/\b(notebook|journal|book|planner|sketchbook)\b/, 'book'],
    [/\b(stickers?|pins?|badges?|patch)\b/, 'stickers'],
    [/\b(sunscreen|spf|tube|lotion|toothpaste)\b/, 'tube'],
    [/\b(cream|balm|mask|butter|scrub|jar|salve|wax)\b/, 'jar'],
    [/\b(soap|bar)\b/, 'bar'],
    [/\b(tote|bag|pouch)\b/, 'bag'],
    [/\b(mug|cup|tumbler)\b/, 'mug'],
    [/\b(cleanser|serum|oil|toner|shampoo|wash|bottle|gel|spray|moisturi[sz]er|perfume|essence)\b/, 'bottle'],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? 'box';
}

/** A flat illustrated packshot in the product's own colour, for products without a photo. */
export function productArt(p: Pick<Product, 'name' | 'description' | 'needsShipping'>, monogram: string): string {
  const h = hueOf(p.name);
  const main = `hsl(${h} 42% 68%)`;
  const dark = `hsl(${h} 38% 44%)`;
  const light = `hsl(${h} 50% 80%)`;
  const label = `<text x="200" y="__Y__" text-anchor="middle" font-family="General Sans,Inter,system-ui,sans-serif" font-weight="600" font-size="20" fill="${dark}">${esc(monogram)}</text>`;
  const lab = (x: number, y: number, w: number, hgt: number, rx = 8) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${rx}" fill="#fff" fill-opacity=".86"/>${label.replace('__Y__', String(y + hgt / 2 + 7))}`;
  const shine = (x: number, y: number, hgt: number) => `<rect x="${x}" y="${y}" width="9" height="${hgt}" rx="4.5" fill="#fff" fill-opacity=".38"/>`;
  const shapes: Record<Kind, string> = {
    jar: `<rect x="148" y="108" width="104" height="30" rx="8" fill="${dark}"/><rect x="138" y="134" width="124" height="112" rx="24" fill="${main}"/>${shine(152, 148, 82)}${lab(160, 166, 80, 46)}`,
    bottle: `<rect x="178" y="62" width="58" height="13" rx="6.5" fill="${dark}"/><rect x="189" y="72" width="22" height="30" rx="4" fill="${dark}"/><rect x="156" y="98" width="88" height="150" rx="28" fill="${main}"/>${shine(168, 114, 110)}${lab(170, 148, 60, 62)}`,
    tube: `<rect x="158" y="66" width="84" height="16" rx="3" fill="${dark}"/><path d="M160 82 H240 L229 222 Q200 236 171 222 Z" fill="${main}"/>${shine(170, 96, 100)}<rect x="181" y="222" width="38" height="28" rx="7" fill="${dark}"/>${lab(178, 118, 44, 72, 6)}`,
    box: `<path d="M132 122 L162 96 H298 L268 122 Z" fill="${light}"/><path d="M268 122 L298 96 V218 L268 244 Z" fill="${dark}"/><rect x="132" y="122" width="136" height="122" rx="6" fill="${main}"/><rect x="192" y="122" width="16" height="122" fill="#fff" fill-opacity=".55"/>${lab(150, 160, 56, 40, 6).replace(/x="200"/, 'x="178"')}`,
    book: `<rect x="138" y="66" width="128" height="176" rx="10" fill="${main}"/><rect x="138" y="66" width="18" height="176" rx="6" fill="${dark}"/><rect x="236" y="66" width="7" height="176" fill="${dark}"/>${lab(170, 108, 58, 32, 5).replace(/x="200"/, 'x="199"')}`,
    stickers: `<circle cx="168" cy="150" r="56" fill="${main}"/><rect x="198" y="118" width="92" height="92" rx="22" fill="${dark}" transform="rotate(-12 244 164)"/><circle cx="214" cy="206" r="30" fill="#fff" stroke="${main}" stroke-width="8"/><path d="M168 120 l9 18 20 3 -14 14 3 20 -18 -9 -18 9 3 -20 -14 -14 20 -3 Z" fill="#fff" fill-opacity=".9"/>`,
    bar: `<rect x="126" y="140" width="148" height="86" rx="30" fill="${main}"/><rect x="146" y="150" width="108" height="20" rx="10" fill="#fff" fill-opacity=".35"/>${label.replace('__Y__', '206')}`,
    bag: `<path d="M172 122 V104 a28 28 0 0 1 56 0 V122" fill="none" stroke="${dark}" stroke-width="9" stroke-linecap="round"/><rect x="138" y="116" width="124" height="132" rx="10" fill="${main}"/>${lab(166, 162, 68, 44)}`,
    mug: `<path d="M240 140 h12 a26 26 0 0 1 0 52 h-12" fill="none" stroke="${dark}" stroke-width="11"/><rect x="146" y="118" width="98" height="120" rx="16" fill="${main}"/>${shine(158, 132, 88)}<path d="M178 104 q-8 -12 0 -24 M198 104 q-8 -12 0 -24 M218 104 q-8 -12 0 -24" fill="none" stroke="${dark}" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>${lab(170, 160, 58, 40)}`,
    ticket: `<path d="M118 92 h164 a14 14 0 0 1 14 14 v30 a16 16 0 0 0 0 32 v30 a14 14 0 0 1 -14 14 h-164 a14 14 0 0 1 -14 -14 v-30 a16 16 0 0 0 0 -32 v-30 a14 14 0 0 1 14 -14 Z" fill="${main}"/><line x1="236" y1="100" x2="236" y2="204" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-dasharray="7 7"/><rect x="128" y="118" width="84" height="12" rx="6" fill="#fff" fill-opacity=".85"/><rect x="128" y="140" width="62" height="10" rx="5" fill="#fff" fill-opacity=".55"/><rect x="128" y="160" width="74" height="10" rx="5" fill="#fff" fill-opacity=".55"/><path d="M266 132 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 Z" fill="#fff"/>`,
  };
  return `<svg viewBox="0 0 400 300" role="img" aria-label="${esc(p.name)}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 62% 95%)"/><stop offset="1" stop-color="hsl(${(h + 28) % 360} 55% 87%)"/></linearGradient></defs><rect width="400" height="300" fill="url(#g${h})"/><ellipse cx="200" cy="256" rx="96" ry="10" fill="${dark}" fill-opacity=".14"/>${shapes[kindOf(p)]}</svg>`;
}

export function productUrl(publicUrl: string, shop: Shop, p: Product): string {
  return `${publicUrl}/s/${shop.slug}/p/${p.id}`;
}

/**
 * Ready-made checkout links, one per option combination: an assistant that can only read pages (plain ChatGPT
 * or Claude, no MCP) hands the person one of these. Opening it only shows a confirm page; the PayPal order is
 * created when the person clicks Continue. ponytail: capped at 12 combinations; past that, the link without
 * options lets the person pick on the page.
 */
export function checkoutLinks(publicUrl: string, shop: Pick<Shop, 'slug' | 'currency'>, p: Pick<Product, 'id' | 'name' | 'priceCents' | 'variants'>): { label: string; price: string; url: string }[] {
  const base = `${publicUrl}/s/${shop.slug}/checkout/${p.id}`;
  let combos: Record<string, string>[] = [{}];
  for (const v of p.variants) combos = combos.flatMap((c) => v.options.map((o) => ({ ...c, [v.name]: o.label })));
  if (combos.length > 12) return [{ label: 'pick options on the page', price: `from ${fmt(p.priceCents, shop.currency)}`, url: base }];
  return combos.map((c) => {
    const q = new URLSearchParams(c).toString();
    return { label: Object.values(c).join(', '), price: fmt(priceFor(p, c).unitCents, shop.currency), url: q ? `${base}?${q}` : base };
  });
}

export function productImageUrl(publicUrl: string, shop: Shop, p: Product): string {
  return p.imageUrl ?? `${productUrl(publicUrl, shop, p)}/image.svg`;
}

/**
 * schema.org Product + Offer: what Channel3's crawler (and Google's, OpenAI's…) reads to list the product.
 * The offer URL is the product page, where checkout is PayPal.
 */
export function productJsonLd(publicUrl: string, shop: Shop, p: Product): Record<string, unknown> {
  const prices = [p.priceCents, ...p.variants.flatMap((v) => v.options.flatMap((o) => (o.price_cents !== undefined ? [o.price_cents] : [])))];
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const url = productUrl(publicUrl, shop, p);
  const availability = `https://schema.org/${p.stock === 0 ? 'OutOfStock' : 'InStock'}`;
  const seller = { '@type': 'Organization', name: shop.name, url: `${publicUrl}/s/${shop.slug}` };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: p.name,
    description: p.description,
    sku: p.id,
    url,
    image: [productImageUrl(publicUrl, shop, p)],
    brand: { '@type': 'Brand', name: shop.name },
    ...(p.variants.length ? { additionalProperty: p.variants.map((v) => ({ '@type': 'PropertyValue', name: v.name, value: v.options.map((o) => o.label).join(', ') })) } : {}),
    offers:
      lo === hi
        ? { '@type': 'Offer', url, price: (lo / 100).toFixed(2), priceCurrency: shop.currency, availability, seller, itemCondition: 'https://schema.org/NewCondition' }
        : { '@type': 'AggregateOffer', url, lowPrice: (lo / 100).toFixed(2), highPrice: (hi / 100).toFixed(2), priceCurrency: shop.currency, offerCount: prices.length - 1, availability, seller },
    ...(shop.refundDays > 0
      ? { hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: shop.refundDays } }
      : {}),
  };
}

