import { productArt } from '@/server/catalog-view';
import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

/** Products without a photo still need an image URL for crawlers: their illustrated packshot. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const store = new Store(getEnv());
  const shop = await store.shopBySlug(slug);
  const p = shop ? await store.product(id) : null;
  if (!shop || !p || p.shopId !== shop.id) return new Response('Not found', { status: 404 });
  const svg = productArt(p, shop.name.trim().charAt(0).toUpperCase()).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" ');
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' } });
}
