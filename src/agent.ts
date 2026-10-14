import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { Env } from './env';
import { toCents } from './paypal';
import { cleanVariants, fmt, type Product, type Shop, type Variant } from './store';

const MODEL = 'claude-opus-5-5';
// Opus 5.5 can decline in a few safety categories; "default" re-runs a declined request on the right fallback model.
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const };

function client(env: Env): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set on this deployment');
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

// ---- the store agent ---------------------------------------------------------------------

const STORE_AGENT = `You are the store agent for one independent shop. Shoppers reach you in two ways: their own AI agents (Claude, ChatGPT and others shopping on a person's behalf) and people typing on the shop's web page. Answer like a knowledgeable, honest shop assistant.

Ground every answer in the shop context below: the catalog, the shop's own notes, and answers the merchant has given before. Those are the only facts you have.
- If the context answers the question, answer it directly in at most four short sentences, and set answered to true. Lead with the direct answer to what was asked.
- If the context does not contain the fact asked for (an ingredient, a measurement, a delivery date, a claim about results), say plainly that the shop has not published that, that the question has been passed to the merchant, and offer what the context does say. Set answered to false. Never fill the gap with general knowledge about similar products; a shopper's agent may act on what you say.
- Recommend products by listing their ids in product_ids, best match first. Use only ids that appear in the catalog. Leave it empty if nothing fits.
- Quote prices and options exactly as the catalog lists them. Mention stock only when it is low or zero.
- Only when the shopper asks how to buy, say they can use the buy tool with the product id and options (or the Buy button on the shop page), and that the person approves the payment in PayPal.
- Plain text only: no markdown headings, no bullet lists.`;

const Answer = z.object({
  answer: z.string(),
  product_ids: z.array(z.string()),
  answered: z.boolean(),
});
export type StoreAnswer = z.infer<typeof Answer>;

/** The shop as the agent sees it. Stable order, so repeated questions reuse the prompt cache. */
export function shopContext(shop: Shop, products: Product[], knowledge: { question: string; answer: string }[]): string {
  const lines = [`Shop: ${shop.name}`, shop.tagline && `Tagline: ${shop.tagline}`, `Refunds: within ${shop.refundDays} days of payment, through PayPal.`, `Currency: ${shop.currency}`];
  if (shop.about.trim()) lines.push('', 'About the shop (written by the merchant):', shop.about.trim());
  lines.push('', 'Catalog:');
  for (const p of [...products].sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(
      `- id ${p.id}: ${p.name}, ${fmt(p.priceCents, shop.currency)}` +
        (p.stock === null ? '' : p.stock === 0 ? ' (sold out)' : ` (${p.stock} in stock)`) +
        variantText(p.variants, shop.currency),
    );
    if (p.description.trim()) lines.push(`  ${p.description.trim().replace(/\s+/g, ' ')}`);
  }
  if (!products.length) lines.push('(no products yet)');
  if (knowledge.length) {
    lines.push('', 'Answers the merchant has given to earlier questions:');
    for (const k of knowledge) lines.push(`Q: ${k.question}`, `A: ${k.answer}`);
  }
  return lines.filter((l) => l !== '').join('\n');
}

function variantText(vs: Variant[], currency: string): string {
  if (!vs.length) return '';
  return `; options: ${vs.map((v) => `${v.name} = ${v.options.map((o) => (o.price_cents !== undefined ? `${o.label} (${fmt(o.price_cents, currency)})` : o.label)).join(' | ')}`).join('; ')}`;
}

export async function askStore(env: Env, context: string, question: string, product?: Product | null): Promise<StoreAnswer> {
  const res = await client(env).beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    ...FALLBACK,
    output_config: { effort: 'low', format: betaZodOutputFormat(Answer) },
    system: [
      { type: 'text', text: STORE_AGENT },
      { type: 'text', text: context, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: product ? `(About product ${product.id}, ${product.name})\n${question}` : question }],
  });
  if (res.stop_reason === 'refusal' || !res.parsed_output) {
    return { answer: "I can't help with that question here. It has been passed to the merchant.", product_ids: [], answered: false };
  }
  return res.parsed_output;
}

// ---- turning someone's existing shop into products --------------------------------------------

const Extracted = z.object({
  products: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      price: z.number().describe('Unit price as a number in the shop currency, e.g. 24.5'),
      image_url: z.string().nullable(),
      variants: z.array(z.object({ name: z.string(), options: z.array(z.object({ label: z.string(), price: z.number().nullable() })) })),
    }),
  ),
});

export interface DraftProduct {
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  variants: Variant[];
}

/** Products from whatever the merchant has: a shop page, an Instagram bio, a pasted price list or CSV. */
export async function extractProducts(env: Env, source: string): Promise<DraftProduct[]> {
  const res = await client(env).beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: 'low', format: betaZodOutputFormat(Extracted) },
    system:
      'You turn a small business\'s existing material (a web page, a social profile, a price list, a CSV) into a product catalog. Include only things a customer can buy at a stated price. Keep each description factual and taken from the material: what it is, size, materials or ingredients, who it suits; do not invent claims. Use absolute image URLs that appear in the material, or null. Variants are choices the buyer makes (size, colour, scent); give an option a price only when it differs from the base price. Return at most 40 products.',
    messages: [{ role: 'user', content: source.slice(0, 120_000) }],
  });
  if (res.stop_reason === 'refusal' || !res.parsed_output) return [];
  return res.parsed_output.products
    .filter((p) => p.name.trim() && p.price > 0)
    .map((p) => ({
      name: p.name.trim(),
      description: p.description.trim(),
      priceCents: toCents(p.price),
      imageUrl: p.image_url && /^https?:\/\//.test(p.image_url) ? p.image_url : null,
      variants: cleanVariants(p.variants.map((v) => ({ name: v.name, options: v.options.map((o) => ({ label: o.label, ...(o.price != null ? { price_cents: toCents(o.price) } : {}) })) }))),
    }));
}

/**
 * A URL → products. Shopify stores expose their whole catalog at /products.json, so those convert exactly with no model call;
 * any other page is reduced to its text, structured data and images and read by Claude.
 */
export async function productsFromUrl(env: Env, url: string): Promise<{ products: DraftProduct[]; via: 'shopify' | 'ai' }> {
  const u = new URL(url);
  if (!/^https?:$/.test(u.protocol)) throw new Error('Use an http(s) link');
  const shopify = await fetch(`${u.origin}/products.json?limit=250`, { headers: { accept: 'application/json', 'user-agent': UA } }).catch(() => null);
  if (shopify?.ok && shopify.headers.get('content-type')?.includes('json')) {
    const j = (await shopify.json().catch(() => null)) as { products?: ShopifyProduct[] } | null;
    if (j?.products?.length) return { products: j.products.slice(0, 100).map(fromShopify).filter((p) => p.priceCents > 0), via: 'shopify' };
  }
  const page = await fetch(u.toString(), { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow' });
  if (!page.ok) throw new Error(`That page answered ${page.status}`);
  const html = (await page.text()).slice(0, 1_500_000);
  return { products: await extractProducts(env, pageDigest(html, page.url)), via: 'ai' };
}

const UA = 'Mozilla/5.0 (compatible; OpenShelfImporter/1.0; +https://github.com/kalashshah)';

interface ShopifyProduct {
  title: string;
  body_html?: string;
  images?: { src: string }[];
  options?: { name: string; values: string[] }[];
  variants?: { price: string; option1?: string | null; available?: boolean }[];
}

function fromShopify(p: ShopifyProduct): DraftProduct {
  const base = toCents(p.variants?.[0]?.price);
  const opts = (p.options ?? []).filter((o) => !(o.values.length === 1 && o.values[0] === 'Default Title'));
  const variants: Variant[] = opts.map((o, i) => ({
    name: o.name,
    // Shopify prices variants, not options; carry the price on the first option dimension when it differs.
    options: o.values.map((label) => {
      const priced = i === 0 ? p.variants?.find((v) => v.option1 === label) : undefined;
      const cents = priced ? toCents(priced.price) : undefined;
      return cents !== undefined && cents !== base ? { label, price_cents: cents } : { label };
    }),
  }));
  return { name: p.title, description: stripHtml(p.body_html ?? '').slice(0, 1500), priceCents: base, imageUrl: p.images?.[0]?.src ?? null, variants: cleanVariants(variants) };
}

/** What Claude reads of a page: JSON-LD (most stores publish Product data), image URLs with alt text, then visible text. */
export function pageDigest(html: string, baseUrl: string): string {
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).join('\n').slice(0, 40_000);
  const imgs = [...html.matchAll(/<img[^>]*>/gi)]
    .map((m) => {
      const src = m[0].match(/\s(?:data-src|src)=["']([^"']+)["']/i)?.[1];
      const alt = m[0].match(/\salt=["']([^"']*)["']/i)?.[1] ?? '';
      if (!src || src.startsWith('data:')) return null;
      try {
        return `${new URL(src, baseUrl).toString()} ${alt}`.trim();
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 80)
    .join('\n');
  const text = stripHtml(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')).slice(0, 60_000);
  return `Page: ${baseUrl}\n\nStructured data:\n${ld || '(none)'}\n\nImages:\n${imgs || '(none)'}\n\nText:\n${text}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}
