import { esc, js, layout } from './pages';
import { fmt, type Product, type Shop } from './store';

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

const PP = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#003087" d="M7.3 21.2H3.9a.5.5 0 0 1-.5-.6L6.1 3.4A.8.8 0 0 1 6.9 2.7h6.3c3.3 0 5.4 1.7 4.8 5-.7 3.9-3.3 5.6-7 5.6H9.4a.8.8 0 0 0-.8.7z"/><path fill="#0070E0" d="M18.6 7.6c-.7 3.8-3.3 5.9-6.9 5.9h-1.2a.8.8 0 0 0-.8.7l-1 6.3-.3 1.7a.5.5 0 0 0 .5.6h3a.7.7 0 0 0 .7-.6l.7-4.5a.7.7 0 0 1 .7-.6h.6c3 0 5.2-1.6 5.8-4.8.4-2.1-.2-3.6-1.8-4.7z"/></svg>`;

const CSS = `
body{background:var(--sf-bg)}
.sf{--sf-bg:#FBFAF8;--ink:#1C1C1C;--ink2:#4A4845;--muted:#85827E;--line:#E9E5E0;--gold:#FFC439;--gold2:#F2B51C}
.sf a{color:inherit}
.sf-in{max-width:1180px;margin:0 auto;padding:0 24px}
.sf-top{position:sticky;top:0;z-index:10;background:color-mix(in oklab,var(--sf-bg) 82%,transparent);backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.sf-top .sf-in{display:flex;align-items:center;gap:14px;height:62px}
.monog{width:34px;height:34px;border-radius:11px;background:var(--accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:16px;letter-spacing:-.02em;flex:none}
.sf-top .nm{font-weight:600;font-size:17px;letter-spacing:-.02em}
.sf-top nav{margin-left:auto;display:flex;gap:6px;align-items:center}
.sf-top nav a{font-size:14px;text-decoration:none;padding:8px 12px;border-radius:999px;color:var(--ink2);transition:background .15s}
.sf-top nav a:hover{background:var(--accent-soft);color:var(--ink)}
.sf-hero{background:radial-gradient(1200px 420px at 15% -10%,var(--accent-soft),transparent 70%),radial-gradient(900px 380px at 100% 0%,var(--accent-soft2),transparent 65%);padding:44px 0 36px}
.sf-hero .sf-in{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:start}
@media(max-width:920px){.sf-hero .sf-in{grid-template-columns:1fr;gap:26px}}
.eyebrow{font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-ink);font-weight:500}
.sf-hero h1{font-size:clamp(40px,6vw,72px);letter-spacing:-.045em;line-height:.98;margin:12px 0 14px;font-weight:600}
.sf-hero .tag{font-size:clamp(17px,1.6vw,20px);color:var(--ink2);max-width:520px;margin:0;line-height:1.45}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 26px}
.badge{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:13.5px;color:var(--ink2)}
.badge i{font-style:normal;width:18px;height:18px;border-radius:50%;background:var(--accent-soft);color:var(--accent-ink);display:inline-flex;align-items:center;justify-content:center;font-size:11px}
.cta{display:flex;gap:10px;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:999px;font-weight:500;font-size:15px;text-decoration:none;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;transition:transform .35s cubic-bezier(.34,3.85,.64,1),box-shadow .25s,background .15s}
.pill:hover{transform:translateY(-1px);box-shadow:0 10px 24px -16px rgba(0,0,0,.45);transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s}
.pill.ink{background:var(--ink);color:#fff;border-color:var(--ink)}
/* concierge */
.concierge{background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 30px 60px -40px rgba(30,20,10,.35);overflow:hidden;display:flex;flex-direction:column}
.concierge .hd{display:flex;gap:12px;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line)}
.concierge .hd b{display:block;font-weight:600;letter-spacing:-.01em}.concierge .hd div span{font-size:12.5px;color:var(--muted)}
.concierge .live{margin-left:auto;font-size:12px;color:var(--accent-ink);display:inline-flex;align-items:center;gap:6px}.concierge .live::before{content:"";width:7px;height:7px;border-radius:50%;background:#2FA84F;box-shadow:0 0 0 3px #2fa84f22}
.msgs{padding:16px 18px;display:flex;flex-direction:column;gap:10px;min-height:190px;max-height:340px;overflow:auto;scroll-behavior:smooth}
.b{padding:10px 14px;border-radius:16px;max-width:88%;font-size:14.5px;line-height:1.45;white-space:pre-wrap;animation:pop .35s cubic-bezier(.22,1,.36,1) both}
.b.me{align-self:flex-end;background:var(--ink);color:#fff;border-bottom-right-radius:5px}
.b.them{align-self:flex-start;background:var(--accent-soft);color:var(--ink);border-bottom-left-radius:5px}
.b .recs{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.b .recs a{background:#fff;border-radius:999px;padding:4px 10px;font-size:12.5px;text-decoration:none;border:1px solid var(--line)}
.b .fwd{display:block;margin-top:7px;font-size:12px;color:var(--muted)}
.typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent-ink);opacity:.35;margin-right:4px;animation:blink 1s infinite}.typing span:nth-child(2){animation-delay:.15s}.typing span:nth-child(3){animation-delay:.3s}
@keyframes blink{50%{opacity:1}}@keyframes pop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
.sugg{display:flex;gap:6px;flex-wrap:wrap;padding:0 18px 12px}
.sugg button{border:1px solid var(--line);background:var(--sf-bg);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;color:var(--ink2);cursor:pointer;transition:background .15s,border-color .15s}
.sugg button:hover{background:var(--accent-soft);border-color:transparent;color:var(--ink)}
.ask{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line);background:var(--sf-bg)}
.ask input{flex:1;min-width:0;border:1px solid var(--line);border-radius:999px;padding:11px 16px;font:inherit;font-size:15px;background:#fff;outline:none}
.ask input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.ask button{border:0;background:var(--accent);color:#fff;border-radius:999px;padding:0 18px;font:inherit;font-weight:500;cursor:pointer}
.ask button:disabled{opacity:.5}
/* collection */
.sec{padding:34px 0 10px}.sec-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:18px}
.sec-h h2{font-size:28px;letter-spacing:-.03em;font-weight:600}.sec-h span{color:var(--muted);font-size:14px}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(262px,1fr));gap:18px}
.pc{background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;scroll-margin-top:84px;transition:box-shadow .3s,transform .3s cubic-bezier(.22,1,.36,1)}
.pc:hover{box-shadow:0 24px 48px -32px rgba(30,20,10,.45);transform:translateY(-2px)}
.pc:target{box-shadow:0 0 0 3px var(--accent)}
.media{position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--accent-soft)}
.media svg,.media img{width:100%;height:100%;display:block;object-fit:cover;}
/* Photos are product shots, often on white: show the whole product. */
.media img{object-fit:contain;background:#fff;padding:14px;transition:transform .6s cubic-bezier(.22,1,.36,1)}
.pc:hover .media svg,.pc:hover .media img{transform:scale(1.035)}
.flag{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-radius:999px;padding:4px 10px;font-size:12px;font-weight:500}
.flag.low{color:#9A5B00}.flag.out{color:#B3261E}
.body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.body h3{font-size:17.5px;letter-spacing:-.02em;font-weight:600;margin:0;line-height:1.25}
.price{font-size:20px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.deal{align-self:flex-start;white-space:nowrap;font-size:12.5px;font-weight:500;color:#1E6B3A;background:#E7F5EC;border-radius:999px;padding:3px 10px}
.pdp{margin-top:14px}.pdp .pc{display:grid;grid-template-columns:1.1fr 1fr}.pdp .media{aspect-ratio:auto;min-height:360px}.pdp .body{padding:28px}.pdp h3{font-size:30px;letter-spacing:-.03em}.pdp .price{font-size:26px}
@media(max-width:760px){.pdp .pc{grid-template-columns:1fr}.pdp .media{min-height:0;aspect-ratio:4/3}.pdp .body{padding:18px}.pdp h3{font-size:24px}}
.desc.full{display:block;-webkit-line-clamp:unset;white-space:pre-line}
.desc{font-size:14px;color:var(--ink2);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.opts{display:flex;flex-direction:column;gap:6px}.opts .on{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips input{position:absolute;opacity:0;pointer-events:none}
.chips label{border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:13.5px;cursor:pointer;transition:all .15s;background:#fff}
.chips input:checked+label{border-color:var(--ink);background:var(--ink);color:#fff}
.chips input:focus-visible+label{box-shadow:0 0 0 3px var(--accent-soft)}
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
.buy{margin-top:auto;padding-top:4px}
.qty{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;height:34px;flex:none}
.qty button{border:0;background:none;width:30px;height:100%;font-size:18px;cursor:pointer;color:var(--ink2)}
.qty input{width:28px;border:0;text-align:center;font:inherit;font-size:15px;background:none;-moz-appearance:textfield}
.qty input::-webkit-outer-spin-button,.qty input::-webkit-inner-spin-button{-webkit-appearance:none}
.ppbtn{width:100%;height:46px;white-space:nowrap;border:0;border-radius:999px;background:var(--gold);color:#111;font:inherit;font-weight:600;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:background .15s,transform .2s}
.ppbtn:hover{background:var(--gold2)}.ppbtn:active{transform:scale(.98)}.ppbtn:disabled{background:#eee;color:#999;cursor:default}
.askthis{background:none;border:0;padding:0;font:inherit;font-size:13.5px;color:var(--accent-ink);cursor:pointer;text-align:left}
.askthis:hover{text-decoration:underline}
/* agents */
.agents{margin:40px 0 0;background:#141414;color:#fff;border-radius:26px;padding:34px;display:grid;grid-template-columns:1.1fr .9fr;gap:30px;position:relative;overflow:hidden}
.agents::after{content:"";position:absolute;right:-120px;top:-120px;width:360px;height:360px;border-radius:50%;background:radial-gradient(var(--accent),transparent 65%);opacity:.35}
@media(max-width:860px){.agents{grid-template-columns:1fr;padding:24px}}
.agents h2{font-size:28px;letter-spacing:-.03em;font-weight:600;margin:8px 0 10px}.agents p{color:#c9c6c2;margin:0 0 16px}
.agents ol{margin:0;padding:0;list-style:none;display:grid;gap:10px;color:#e6e3df;font-size:14.5px}
.agents ol li{display:flex;gap:10px}.agents ol b{width:22px;height:22px;border-radius:50%;background:#2a2a2a;display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex:none}
.endpoint{position:relative;z-index:1;background:#1f1f1f;border:1px solid #2e2e2e;border-radius:18px;padding:18px;align-self:center}
.endpoint .l{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#9a9692}
.endpoint code{display:block;background:none;padding:0;margin:10px 0 14px;color:var(--lime,#CDF034);font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
.endpoint button{border:0;border-radius:999px;padding:9px 16px;background:#fff;font:inherit;font-weight:500;cursor:pointer}
.endpoint .try{margin-top:14px;font-size:13px;color:#a9a5a0}
.sandbox{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 16px;font-size:13.5px;color:var(--ink2);margin-top:18px}
.alert{background:#FDECEA;color:#8C1D18;border-radius:14px;padding:12px 16px;margin:16px 0 0}
.sf-foot{padding:34px 0 44px;color:var(--muted);font-size:13.5px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:640px){.sf-in{padding:0 16px}.sf-hero{padding:28px 0 24px}.sf-top nav a.hide-sm{display:none}.agents h2,.sec-h h2{font-size:23px}}
@media(prefers-reduced-motion:reduce){.b,.pc,.media svg,.media img{animation:none;transition:none}}
`;

export interface StorefrontView {
  publicUrl: string;
  canBuy: boolean;
  demo: boolean;
  error?: string;
  /** Set on a product's own page (/s/:slug/p/:id): shown large first, with its own title and schema.org data. */
  focus?: Product;
}

export function productUrl(publicUrl: string, shop: Shop, p: Product): string {
  return `${publicUrl}/s/${shop.slug}/p/${p.id}`;
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

function ldScript(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function storefrontPage(shop: Shop, products: Product[], v: StorefrontView): string {
  const h = hueOf(shop.name);
  const initial = shop.name.trim().charAt(0).toUpperCase();
  const mcp = `${v.publicUrl}/s/${shop.slug}/mcp`;
  const allServices = products.length > 0 && products.every((p) => !p.needsShipping);
  const badges = [
    ['↺', `${shop.refundDays}-day refunds`],
    ['✓', 'Secure PayPal checkout'],
    allServices ? ['✦', 'Services, booked online'] : ['→', 'Ships to your PayPal address'],
    ['◎', 'Agent-ready'],
  ];
  const suggestions = [
    products[0] && `What would you recommend for me?`,
    products[0] && `Tell me about the ${products[0].name}`,
    'How do refunds work?',
    products[1] && `${products[1].name} or ${products[0].name}?`,
  ].filter(Boolean) as string[];

  const card = (p: Product) => {
    const soldOut = p.stock === 0;
    const opts = p.variants
      .map(
        (vr, vi) =>
          `<div class="opts"><span class="on">${esc(vr.name)}</span><div class="chips">${vr.options
            .map((o, oi) => {
              const id = `${p.id}-${vi}-${oi}`;
              return `<input type="radio" id="${esc(id)}" name="opt:${esc(vr.name)}" value="${esc(o.label)}" ${oi === 0 ? 'checked' : ''} ${o.price_cents !== undefined ? `data-price="${o.price_cents}"` : ''}><label for="${esc(id)}">${esc(o.label)}</label>`;
            })
            .join('')}</div></div>`,
      )
      .join('');
    const first = p.variants.flatMap((vr) => vr.options.slice(0, 1)).find((o) => o.price_cents !== undefined);
    const shown = first?.price_cents ?? p.priceCents;
    const flag = soldOut
      ? '<span class="flag out">Sold out</span>'
      : p.stock !== null && p.stock <= 10
        ? `<span class="flag low">Only ${p.stock} left</span>`
        : !p.needsShipping
          ? '<span class="flag">Service</span>'
          : '';
    return `<article class="pc" id="${esc(p.id)}"><div class="media">${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy">` : productArt(p, initial)}${flag}</div>
<form class="body" method="post" action="/s/${esc(shop.slug)}/buy" data-base="${p.priceCents}"><input type="hidden" name="product_id" value="${esc(p.id)}">
<div><h3><a href="/s/${esc(shop.slug)}/p/${esc(p.id)}" style="text-decoration:none">${esc(p.name)}</a></h3><div class="top"><div class="price" data-price-out>${esc(fmt(shown, shop.currency))}</div><span class="qty"><button type="button" aria-label="Fewer" onclick="step(this,-1)">−</button><input name="quantity" type="number" min="1" max="99" value="1" aria-label="Quantity"><button type="button" aria-label="More" onclick="step(this,1)">+</button></span></div></div>
${p.market && p.market.minCents > shown ? `<span class="deal">Below retail · ${esc(fmt(p.market.minCents, shop.currency))}+ elsewhere</span>` : ''}<p class="desc">${esc(p.description)}</p>${opts}
<div class="buy"><button class="ppbtn" ${soldOut || !v.canBuy ? 'disabled' : ''}>${soldOut ? 'Sold out' : `${PP} Buy with PayPal`}</button></div>
<button type="button" class="askthis" onclick="askAbout(${esc(js(p.id))},${esc(js(p.name))})">Ask the shop about this →</button></form></article>`;
  };

  const focus = v.focus;
  const ld = focus
    ? ldScript(productJsonLd(v.publicUrl, shop, focus))
    : ldScript({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: shop.name,
        itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: productUrl(v.publicUrl, shop, p), name: p.name })),
      });
  const focusSection = focus
    ? `<section class="sec"><a class="small" href="/s/${esc(shop.slug)}" style="color:var(--muted)">← All of ${esc(shop.name)}</a><div class="pdp">${card(focus).replace('class="desc"', 'class="desc full"')}</div></section>`
    : '';
  const body = `${ld}<div class="sf" style="--accent:hsl(${h} 45% 40%);--accent-ink:hsl(${h} 50% 26%);--accent-soft:hsl(${h} 60% 94%);--accent-soft2:hsl(${(h + 35) % 360} 60% 93%)">
<header class="sf-top"><div class="sf-in"><span class="monog">${esc(initial)}</span><span class="nm">${esc(shop.name)}</span><nav><a href="#shop" class="hide-sm">Shop</a><a href="#ask">Ask the shop</a><a href="#agents" class="hide-sm">Shop with AI</a></nav></div></header>
${focus ? `<div class="sf-in">${focusSection}</div>` : ''}<section class="sf-hero"><div class="sf-in">
<div><div class="eyebrow">Independent shop · ${products.length} ${products.length === 1 ? 'item' : 'items'}</div><h1>${esc(shop.name)}</h1><p class="tag">${esc(shop.tagline || 'Welcome to our shop.')}</p>
<div class="badges">${badges.map(([i, t]) => `<span class="badge"><i>${i}</i>${esc(t)}</span>`).join('')}</div>
<div class="cta"><a class="pill ink" href="#shop">Shop the collection</a><a class="pill" href="#ask" onclick="document.getElementById('q').focus()">Ask a question</a></div>
${v.error ? `<div class="alert">${esc(v.error)}</div>` : ''}
${v.demo ? `<div class="sandbox">Sandbox demo, nothing real is charged. At PayPal choose <b>Pay with Credit or Debit Card</b> and use test card <b>4005 5192 0000 0004</b> (any future date, CVV 123), or a <a href="https://developer.paypal.com/dashboard/accounts" target="_blank" rel="noopener">sandbox account</a>.</div>` : ''}</div>
<div class="concierge" id="ask"><div class="hd"><span class="monog">${esc(initial)}</span><div><b>Ask ${esc(shop.name)}</b><span>Answers from what the shop has published</span></div><span class="live">online</span></div>
<div class="msgs" id="chat"><div class="b them">Hi! I know everything ${esc(shop.name)} has published: products, options, policies. What are you looking for?</div></div>
<div class="sugg" id="sugg">${suggestions.map((s) => `<button type="button" onclick="send(${esc(js(s))})">${esc(s)}</button>`).join('')}</div>
<form class="ask" onsubmit="ask(event)"><input id="q" placeholder="Ask about a product, sizing, shipping…" autocomplete="off" aria-label="Your question"><button id="askBtn">Ask</button></form></div>
</div></section>
<main class="sf-in"><section class="sec" id="shop"><div class="sec-h"><h2>${focus ? `More from ${esc(shop.name)}` : 'The collection'}</h2><span>Paid securely with PayPal</span></div><div class="pgrid">${products.filter((p) => p.id !== focus?.id).map(card).join('') || '<p class="muted">No products yet.</p>'}</div></section>
<section class="agents" id="agents"><div style="position:relative;z-index:1"><div class="eyebrow" style="color:#b9b6b2">Shop with your AI agent</div><h2>Let your assistant do the shopping.</h2><p>${esc(shop.name)} is open to AI agents. Yours can ask the shop questions, compare options and place the order. You approve every payment in PayPal.</p>
<ol><li><b>1</b>Add the shop to Claude, ChatGPT or any MCP client.</li><li><b>2</b>Ask it to find what you need here.</li><li><b>3</b>Approve the PayPal link it gives you. Done.</li></ol></div>
<div class="endpoint"><div class="l">This shop's agent endpoint</div><code id="mcp">${esc(mcp)}</code><button type="button" onclick="navigator.clipboard.writeText(document.getElementById('mcp').textContent);this.textContent='Copied ✓'">Copy link</button><div class="try">In Claude: Settings → Connectors → Add custom connector.</div></div></section>
<footer class="sf-foot"><span>© ${esc(shop.name)}</span><span>Payments by PayPal · Powered by <a href="/">Open Shelf</a></span></footer></main></div>`;

  const script = `var SLUG=${js(shop.slug)},CUR=${js(shop.currency)},FOCUS=null;
function post(p,b){return fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})}
function e(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(c){try{return new Intl.NumberFormat('en-US',{style:'currency',currency:CUR}).format(c/100)}catch(x){return (c/100).toFixed(2)+' '+CUR}}
function step(b,d){var i=b.parentNode.querySelector('input');i.value=Math.max(1,Math.min(99,(+i.value||1)+d))}
document.querySelectorAll('form.body').forEach(function(f){f.addEventListener('change',function(){var c=+f.dataset.base;f.querySelectorAll('input[type=radio]:checked').forEach(function(r){if(r.dataset.price)c=+r.dataset.price});f.querySelector('[data-price-out]').textContent=money(c)})});
function bubble(cls,html){var c=document.getElementById('chat');var d=document.createElement('div');d.className='b '+cls;d.innerHTML=html;c.appendChild(d);c.scrollTop=c.scrollHeight;return d}
function askAbout(id,name){FOCUS=id;var q=document.getElementById('q');q.placeholder='Ask about '+name+'…';document.getElementById('ask').scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){q.focus()},300)}
function ask(ev){ev.preventDefault();var q=document.getElementById('q');var t=q.value.trim();if(t){q.value='';send(t)}}
function send(text){document.getElementById('sugg').style.display='none';bubble('me',e(text));var w=bubble('them','<span class="typing"><span></span><span></span><span></span></span>');var b=document.getElementById('askBtn');b.disabled=true;
post('/s/'+SLUG+'/ask',{question:text,product_id:FOCUS}).then(function(r){b.disabled=false;if(!r.ok){w.textContent=r.j.error||'Something went wrong';return}
var h=e(r.j.answer);if(r.j.recommended&&r.j.recommended.length){h+='<div class="recs">'+r.j.recommended.map(function(p){return '<a href="#'+e(p.product_id)+'">'+e(p.name)+' · '+e(p.price)+'</a>'}).join('')+'</div>'}
if(!r.j.answered)h+='<span class="fwd">I’ve passed this to the shop owner.</span>';w.innerHTML=h;document.getElementById('chat').scrollTop=1e6}).catch(function(){b.disabled=false;w.textContent='Could not reach the shop'})}`;

  return layout(focus ? `${focus.name} · ${shop.name}` : shop.name, body, { script, description: focus ? focus.description.slice(0, 160) : shop.tagline, bare: true, css: CSS });
}
