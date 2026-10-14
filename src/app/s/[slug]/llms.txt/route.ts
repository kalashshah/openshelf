import { shopContext } from '@/server/agent';
import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

/** The catalog for crawlers and agents that read rather than call tools. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const env = getEnv();
  const store = new Store(env);
  const shop = await store.shopBySlug((await params).slug);
  if (!shop) return new Response('No such store', { status: 404 });
  const [products, knowledge] = await Promise.all([store.products(shop.id), store.knowledge(shop.id)]);
  return new Response(
    `# ${shop.name}\n\n> ${shop.tagline}\n\nAI agents: connect the MCP server at ${env.PUBLIC_URL}/s/${shop.slug}/mcp to ask this store questions (ask_store) and buy (buy → PayPal approval link).\n\n${shopContext(shop, products, knowledge)}\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}
