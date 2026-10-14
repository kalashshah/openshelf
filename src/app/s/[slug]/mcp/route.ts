import { getEnv } from '@/server/env';
import { serveMcp } from '@/server/http/mcp';
import { Store } from '@/server/store';

async function handler(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const env = getEnv();
  const shop = await new Store(env).shopBySlug((await params).slug);
  return shop ? serveMcp(env, request, shop) : Response.json({ error: 'No such store' }, { status: 404 });
}
export { handler as GET, handler as POST, handler as DELETE };
