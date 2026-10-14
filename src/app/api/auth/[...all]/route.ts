import { getAuth } from '@/server/auth';
import { getEnv } from '@/server/env';

import { overLimit } from '@/server/http/mcp';

async function handler(request: Request) {
  const env = getEnv();
  // Each "Try the demo" creates an account and a seeded shop; better-auth's own limiter is per isolate on Workers.
  if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/sign-in/anonymous') && (await overLimit(env, request, 'demo'))) {
    return Response.json({ message: 'Too many demo stores from here just now. Try again in a minute.' }, { status: 429 });
  }
  return getAuth(env).handler(request);
}
export { handler as GET, handler as POST };
