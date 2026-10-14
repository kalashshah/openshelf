/**
 * Channel3: a product graph of 100M+ products across retailers (titles, brands, clean images, features, live offers).
 * Open Shelf uses it to fill a merchant's catalog (photos, details) and to show what the same product costs elsewhere.
 * With CHANNEL3_API_KEY it calls the REST API; without one it uses Channel3's free MCP tier, so a fresh deployment still works.
 */
import type { Env } from './env';
import { toCents } from './paypal';

export interface C3Product {
  id: string;
  title: string;
  description?: string | null;
  brands?: { id?: string; name: string }[];
  images?: { url: string; cleaned_url?: string | null; is_main_image?: boolean }[];
  key_features?: string[] | null;
  materials?: string[] | null;
  offers?: { url: string; domain: string; price: { price: number; compare_at_price?: number | null; currency?: string }; availability?: string }[];
}

export interface Market {
  minCents: number;
  maxCents: number;
  retailers: number;
}

const API = 'https://api.trychannel3.com/v1';
const MCP = 'https://mcp.trychannel3.com/';

export async function searchProducts(env: Env, query: string, limit = 8): Promise<C3Product[]> {
  if (env.CHANNEL3_API_KEY) {
    const res = await fetch(`${API}/search`, {
      method: 'POST',
      headers: { 'x-api-key': env.CHANNEL3_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) throw new Error(`Channel3 search failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    return ((await res.json()) as { products?: C3Product[] }).products ?? [];
  }
  const out = await mcpCall('search_products', { query });
  return ((out as { products?: C3Product[] } | null)?.products ?? []).slice(0, limit);
}

export async function getProduct(env: Env, id: string): Promise<C3Product | null> {
  if (env.CHANNEL3_API_KEY) {
    const res = await fetch(`${API}/products/${encodeURIComponent(id)}`, { headers: { 'x-api-key': env.CHANNEL3_API_KEY } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Channel3 product failed (${res.status})`);
    return (await res.json()) as C3Product;
  }
  const out = (await mcpCall('get_products', { product_ids: [id] })) as { products?: C3Product[] } | C3Product | null;
  if (!out) return null;
  return 'products' in out && Array.isArray(out.products) ? (out.products[0] ?? null) : (out as C3Product);
}

/** One stateless MCP exchange: initialize, then the call. ponytail: a session per call; fine for merchant-side, low-volume use. */
async function mcpCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const rpc = async (body: unknown, sid?: string | null) => {
    const res = await fetch(MCP, { method: 'POST', headers: { ...headers, ...(sid ? { 'mcp-session-id': sid } : {}) }, body: JSON.stringify(body) });
    const text = await res.text();
    const line = text.split('\n').find((l) => l.startsWith('data: ')) ?? text;
    return { sid: res.headers.get('mcp-session-id'), body: line.trim() ? (JSON.parse(line.replace(/^data: /, '')) as { result?: { structuredContent?: unknown; isError?: boolean }; error?: { message: string } }) : null };
  };
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'openshelf', version: '0.1.0' } } });
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, init.sid);
  const out = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } }, init.sid);
  if (out.body?.error) throw new Error(`Channel3: ${out.body.error.message}`);
  return out.body?.result?.structuredContent ?? null;
}

// ---- pure helpers (tested) ------------------------------------------------------------

export function mainImage(p: C3Product): string | null {
  const img = p.images?.find((i) => i.is_main_image) ?? p.images?.[0];
  return img ? (img.cleaned_url ?? img.url) : null;
}

export function brandOf(p: C3Product): string {
  return p.brands?.map((b) => b.name).join(', ') ?? '';
}

/** What the same product sells for at other retailers (in-stock offers in the shop's currency). */
export function marketOf(p: C3Product, currency = 'USD'): Market | null {
  const live = (p.offers ?? []).filter((o) => (o.price.currency ?? 'USD') === currency && o.availability !== 'OutOfStock' && o.price.price > 0);
  if (!live.length) return null;
  const prices = live.map((o) => toCents(o.price.price));
  return { minCents: Math.min(...prices), maxCents: Math.max(...prices), retailers: new Set(live.map((o) => o.domain)).size };
}

/** A product description in the merchant's voice, built only from Channel3's facts. */
export function describe(p: C3Product): string {
  const parts = [p.description?.trim()];
  if (p.key_features?.length) parts.push(`Key features: ${p.key_features.join('; ')}.`);
  if (p.materials?.length) parts.push(`Materials: ${p.materials.join(', ')}.`);
  const brand = brandOf(p);
  if (brand && !(p.description ?? '').includes(brand)) parts.push(`Brand: ${brand}.`);
  return parts.filter(Boolean).join('\n\n').slice(0, 3000);
}
