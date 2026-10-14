import { AppShell } from '@/components/app/app-shell';
import { hueOf } from '@/server/catalog-view';
import { requireShop } from '@/server/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { store, shop, user } = await requireShop();
  const unanswered = (await store.questions(shop.id, 500)).filter((q) => !q.answered && !q.merchantAnswer).length;
  return (
    <AppShell shop={{ name: shop.name, slug: shop.slug, hue: hueOf(shop.name) }} unanswered={unanswered} demo={user.isAnonymous}>
      {children}
    </AppShell>
  );
}
