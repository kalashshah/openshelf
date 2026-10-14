import { getEnv } from '@/server/env';

/** Channel3's hosted connect page sends the merchant back here (the redirect URI on Open Shelf's partner allowlist). */
export function GET() {
  return Response.redirect(new URL(`/app?n=${encodeURIComponent('Back from Channel3. Connection status below is read live from Channel3.')}`, getEnv().PUBLIC_URL), 303);
}

export const dynamic = 'force-dynamic';
