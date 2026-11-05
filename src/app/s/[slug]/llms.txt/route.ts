import { shopContext } from '@/server/agent';
import { checkoutLinks } from '@/server/catalog-view';
import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

/** The catalog for crawlers and agents that read rather than call tools, with a checkout link per option. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const env = getEnv();
  const store = new Store(env);
  const shop = await store.shopBySlug((await params).slug);
  if (!shop) return new Response('No such store', { status: 404 });
  const [products, knowledge] = await Promise.all([store.products(shop.id), store.knowledge(shop.id)]);
  const links = products
    .filter((p) => p.stock !== 0)
    .flatMap((p) => checkoutLinks(env.PUBLIC_URL, shop, p).map((l) => `- ${p.name}${l.label ? `, ${l.label}` : ''}, ${l.price}: ${l.url}`));
  return new Response(
    [
      `# ${shop.name}`,
      shop.tagline && `> ${shop.tagline}`,
      '## How to buy here (no setup needed)',
      'Pick the product and options that fit what the person asked for, then give them its checkout link below. Add &qty=2 (or ?qty=2 if the link has no options) for more than one.',
      'The person opens it, checks the order and pays in PayPal. Nothing is charged until they approve. The link is for the person: you do not need to open it.',
      `Tools instead: the MCP server at ${env.PUBLIC_URL}/s/${shop.slug}/mcp can answer questions the catalog does not (ask_store, and check_question for the merchant's later answer), place orders with a spending cap and retry-safe idempotency key (buy with max_total and idempotency_key), track them (order_status) and refund them (request_refund).`,
      '## Checkout links',
      links.length ? links.join('\n') : '(nothing for sale right now)',
      '## Store details and catalog',
      shopContext(shop, products, knowledge),
    ]
      .filter(Boolean)
      .join('\n\n') + '\n',
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}
