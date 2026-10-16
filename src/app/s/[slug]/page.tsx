import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop/shop-page';
import { getEnv } from '@/server/env';
import { ensureShowcase } from '@/server/seed';
import { Store } from '@/server/store';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ e?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await new Store(getEnv()).shopBySlug((await params).slug);
  return shop ? { title: shop.name, description: shop.tagline, alternates: { types: { 'text/plain': `/s/${shop.slug}/llms.txt` } } } : {};
}

export default async function ShopRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const env = getEnv();
  if (slug === 'dewdrop') await ensureShowcase(env);
  const store = new Store(env);
  const shop = await store.shopBySlug(slug);
  if (!shop) notFound();
  const [products, pp] = await Promise.all([store.products(shop.id), store.paypalFor(shop)]);
  return <ShopPage shop={shop} products={products} publicUrl={env.PUBLIC_URL} canBuy={Boolean(pp)} demo={shop.demo || shop.paypalEnv === 'sandbox'} error={(await searchParams).e} />;
}
