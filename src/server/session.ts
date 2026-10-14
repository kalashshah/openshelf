import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getAuth, sessionUser, type SessionUser } from './auth';
import { getEnv, type Env } from './env';
import { DEMO_SHOP, seedShop } from './seed';
import { Store, type Shop } from './store';

export async function currentUser(): Promise<SessionUser | null> {
  return sessionUser(getEnv(), await headers());
}

/**
 * The signed-in merchant and their shop, created on first visit: a seeded demo shop for "Try the demo"
 * (anonymous) accounts, an empty one otherwise. Logged in with PayPal and nothing connected yet:
 * payments go straight to that PayPal account (payee mode).
 */
export const requireShop = cache(async (): Promise<{ env: Env; store: Store; user: SessionUser; shop: Shop }> => {
  const env = getEnv();
  const user = await sessionUser(env, await headers());
  if (!user) redirect('/login');
  const store = new Store(env);
  let shop = await store.shopForUser(user.id);
  if (!shop) {
    try {
      if (user.isAnonymous) {
        shop = await store.createShop(user.id, DEMO_SHOP.name, { demo: true, tagline: DEMO_SHOP.tagline, about: DEMO_SHOP.about });
        await seedShop(store, shop);
        // Each demo is a fresh shop; clear out ones from earlier visits (older than 3 days).
        await store.cleanupDemoShops(3 * 86_400_000).catch((e) => console.error('demo_cleanup_failed', String(e)));
      } else {
        shop = await store.createShop(user.id, user.name?.trim() ? `${user.name.trim()}'s shop` : `${user.email.split('@')[0]}'s shop`);
      }
    } catch (e) {
      // A parallel request (another tab, a prefetch) created it first: one shop per user is a UNIQUE constraint.
      shop = await store.shopForUser(user.id);
      if (!shop) throw e;
    }
  }
  if (!store.paymentMode(shop) && !user.isAnonymous) {
    const viaPayPal = await env.DB.prepare("SELECT 1 FROM account WHERE userId = ? AND providerId = 'paypal'").bind(user.id).first();
    if (viaPayPal) {
      await store.setPayee(shop, user.email);
      shop = (await store.shopById(shop.id)) as Shop;
    }
  }
  return { env, store, user, shop };
});

export { getAuth };
