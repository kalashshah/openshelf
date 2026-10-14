import { getEnv } from '@/server/env';
import { serveMcp } from '@/server/http/mcp';
import { ensureShowcase } from '@/server/seed';

async function handler(request: Request) {
  const env = getEnv();
  await ensureShowcase(env);
  return serveMcp(env, request, null);
}
export { handler as GET, handler as POST, handler as DELETE };
