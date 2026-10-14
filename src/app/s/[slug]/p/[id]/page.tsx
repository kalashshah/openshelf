import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop/shop-page';
import { getEnv } from '@/server/env';
import { Store } from '@/server/store';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ e?: string }> };

async function load(slug: string, id: string) {
  const store = new Store(getEnv());
  const shop = await store.shopBySlug(slug);
  const products = shop ? await store.products(shop.id) : [];
  return { store, shop, products, focus: products.find((p) => p.id === id) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const { shop, focus } = await load(slug, id);
  return shop && focus ? { title: `${focus.name} · ${shop.name}`, description: focus.description.slice(0, 160) } : {};
}

export default async function ProductRoute({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { store, shop, products, focus } = await load(slug, id);
  if (!shop || !focus) notFound();
  const pp = await store.paypalFor(shop);
  const env = getEnv();
  return <ShopPage shop={shop} products={products} publicUrl={env.PUBLIC_URL} canBuy={Boolean(pp)} demo={shop.demo || shop.paypalEnv === 'sandbox'} error={(await searchParams).e} focus={focus} />;
}
