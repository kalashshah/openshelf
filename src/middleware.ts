import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Pages move to the canonical origin (sign-in cookies and PayPal return URLs are issued for it);
 * API calls such as webhooks and MCP are still served wherever they arrive.
 * Then a cookie-presence gate for /app with no DB call; the /app pages validate the session for real.
 */
export function middleware(request: NextRequest) {
  const canonical = process.env.PUBLIC_URL;
  if (canonical && request.method === 'GET' && request.nextUrl.host !== new URL(canonical).host && request.headers.get('accept')?.includes('text/html')) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, canonical), 301);
  }
  if (request.nextUrl.pathname.startsWith('/app') && !getSessionCookie(request)) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/|api/|webhooks/|.*\\.(?:svg|png|ico|txt|xml)$).*)'] };
