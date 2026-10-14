import { getEnv } from '@/server/env';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /api/\nSitemap: ${getEnv().PUBLIC_URL}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain' } });
}

export const dynamic = 'force-dynamic';
