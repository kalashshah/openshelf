import { productUrl } from '@/server/catalog-view';
import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

/** Every listed store and product, for Channel3's crawler and every other one. */
export async function GET() {
  const env = getEnv();
  const store = new Store(env);
  const urls = [`${env.PUBLIC_URL}/`];
  for (const shop of await store.listedShops()) {
    urls.push(`${env.PUBLIC_URL}/s/${shop.slug}`);
    for (const p of await store.products(shop.id)) urls.push(productUrl(env.PUBLIC_URL, shop, p));
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`, {
    headers: { 'content-type': 'application/xml' },
  });
}

export const dynamic = 'force-dynamic';
