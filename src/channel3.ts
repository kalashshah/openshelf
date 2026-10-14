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

// ---- Partner Program: putting merchants' catalogs INTO Channel3 ------------------------------------
// Open Shelf provisions each merchant (by storefront domain); Channel3 crawls the storefront, normalizes the catalog,
// and distributes it to the AI shopping surfaces it powers, plus Google, OpenAI, Microsoft, Perplexity and PayPal
// once the merchant connects them on Channel3's hosted page.

const PARTNER = 'https://partners.trychannel3.com/v0/partner';

export interface C3Connection {
  platform: string;
  category: 'distribution' | 'ingestion';
  status: 'not_connected' | 'action_required' | 'active';
  display_name: string;
  sync?: { state: 'pending' | 'syncing' | 'live'; last_synced_at?: string | null; total_products?: number | null; synced_products?: number | null } | null;
}

/** Where a merchant can switch distribution on from Channel3's hosted page. */
export const DISTRIBUTION = ['openai', 'google', 'microsoft', 'perplexity', 'paypal'] as const;

function partnerKey(env: Env): string {
  const key = env.CHANNEL3_PARTNER_KEY;
  if (!key) throw new Error('Channel3 partner access is not set up on this deployment yet (CHANNEL3_PARTNER_KEY).');
  return key;
}

async function partner<T>(env: Env, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${PARTNER}${path}`, {
    method,
    headers: { 'x-api-key': partnerKey(env), 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Channel3 ${method} ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  return JSON.parse(text) as T;
}

/** Idempotent on domain. A new merchant already has an active web_crawl connection: Channel3 starts crawling at once. */
export function createMerchant(env: Env, domain: string, name: string): Promise<{ customer_id: string; created: boolean }> {
  return partner(env, 'POST', '/merchants', { domain, name });
}

export async function connections(env: Env, customerId: string): Promise<C3Connection[]> {
  return (await partner<{ connections: C3Connection[] }>(env, 'GET', `/merchants/${encodeURIComponent(customerId)}/connections`)).connections;
}

/** A single-use, 30-minute link to Channel3's hosted page where the merchant connects a platform. */
export function connectSession(env: Env, customerId: string, redirectUri: string, platform?: string): Promise<{ url: string; expires_at: string }> {
  return partner(env, 'POST', `/merchants/${encodeURIComponent(customerId)}/connections/sessions`, { redirect_uri: redirectUri, ...(platform ? { platform } : {}) });
}

/** "https://www.Shop.com/path" → "shop.com". */
export function domainOf(url: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase() || null;
  } catch {
    return null;
  }
}
