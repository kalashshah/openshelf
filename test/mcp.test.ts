import { describe, expect, it } from 'vitest';
import { registerTools } from '../src/server/mcp';
import { Store } from '../src/server/store';
import { fakeD1 } from './helpers/d1';

type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;

/** The tools exactly as an MCP client reaches them, without the transport. */
function tools(env: never, scope: Parameters<typeof registerTools>[2]) {
  const handlers = new Map<string, Handler>();
  registerTools({ registerTool: (name: string, _cfg: unknown, h: Handler) => handlers.set(name, h) } as never, env, scope);
  return async (name: string, args: Record<string, unknown> = {}) => {
    const h = handlers.get(name);
    if (!h) throw new Error(`no tool ${name}`);
    const r = await h(args);
    return { ...JSON.parse(r.content[0].text), isError: r.isError };
  };
}

async function world() {
  const env = { DB: fakeD1(), PUBLIC_URL: 'https://shop.test', MASTER_KEY: '' } as never;
  const store = new Store(env);
  const a = await store.createShop('u1', 'Dewdrop', { listed: true });
  const b = await store.createShop('u2', 'Other', { listed: true });
  const pa = await store.saveProduct(a.id, { name: 'Gel Moisturizer', priceCents: 2400, stock: 0 });
  const pa2 = await store.saveProduct(a.id, { name: 'Clay Mask', priceCents: 3000, variants: [{ name: 'Size', options: [{ label: 'Mini', price_cents: 1500 }] }] });
  const pb = await store.saveProduct(b.id, { name: 'Wool Socks', priceCents: 1800 });
  return { env, store, a, b, pa, pa2, pb };
}

describe('MCP tools', () => {
  it('a store’s own endpoint cannot see another store’s products', async () => {
    const w = await world();
    const call = tools(w.env, w.a);
    expect((await call('get_product', { product_id: w.pb.id })).isError).toBe(true);
    expect((await call('get_product', { product_id: w.pa2.id })).name).toBe('Clay Mask');
  });

  it('search leaves out sold-out products and filters by the cheapest option', async () => {
    const w = await world();
    const call = tools(w.env, null);
    const names = (r: { results: { name: string }[] }) => r.results.map((x) => x.name);
    expect(names(await call('search_products', { query: 'moisturizer mask' }))).toEqual(['Clay Mask']);
    expect(names(await call('search_products', { query: 'moisturizer mask', in_stock_only: false })).sort()).toEqual(['Clay Mask', 'Gel Moisturizer']);
    expect(names(await call('search_products', { query: 'mask', max_price: 20 }))).toEqual(['Clay Mask']);
  });

  it('check_question returns the merchant’s answer, only on the right endpoint', async () => {
    const w = await world();
    const q = await w.store.recordQuestion({ shopId: w.a.id, question: 'Vegan?', answer: 'Not published', answered: false, asker: 'agent' });
    expect((await tools(w.env, w.a)('check_question', { question_id: q.id })).answered).toBe(false);
    await w.store.answerQuestion(w.a.id, q.id, 'Yes');
    expect((await tools(w.env, null)('check_question', { question_id: q.id })).answer).toBe('Yes');
    expect((await tools(w.env, w.b)('check_question', { question_id: q.id })).isError).toBe(true);
  });

  it('refuses to buy from a shop that has no PayPal yet, with a message the agent can relay', async () => {
    const w = await world();
    const r = await tools(w.env, null)('buy', { items: [{ product_id: w.pb.id }] });
    expect(r.isError).toBe(true);
    expect(r.error).toMatch(/has not connected PayPal/);
  });
});
