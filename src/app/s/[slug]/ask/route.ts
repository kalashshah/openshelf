import { askStore, shopContext } from '@/server/agent';
import { getEnv } from '@/server/env';
import { overLimit } from '@/server/http/mcp';
import { fmt, Store } from '@/server/store';

/** The store page's "Ask the shop" chat: the same store agent shoppers' AI agents talk to. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const env = getEnv();
  const store = new Store(env);
  const shop = await store.shopBySlug((await params).slug);
  if (!shop) return Response.json({ error: 'No such store' }, { status: 404 });
  if (await overLimit(env, request, 'ask')) return Response.json({ error: 'Too many questions at once; try again in a minute.' }, { status: 429 });
  const body = (await request.json().catch(() => ({}))) as { question?: string; product_id?: string | null };
  const question = String(body.question ?? '').trim().slice(0, 1000);
  if (!question) return Response.json({ error: 'Ask a question' }, { status: 400 });
  const [products, knowledge] = await Promise.all([store.products(shop.id), store.knowledge(shop.id)]);
  const product = body.product_id ? (products.find((p) => p.id === body.product_id) ?? null) : null;
  const out = await askStore(env, shopContext(shop, products, knowledge), question, product);
  await store.recordQuestion({ shopId: shop.id, productId: product?.id, question, answer: out.answer, answered: out.answered, asker: 'human' });
  return Response.json({
    answer: out.answer,
    answered: out.answered,
    recommended: products.filter((p) => out.product_ids.includes(p.id)).map((p) => ({ product_id: p.id, name: p.name, price: fmt(p.priceCents, shop.currency) })),
  });
}
