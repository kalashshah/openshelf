import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

/** Cookie-presence gate with no DB call; the /app pages validate the session for real. */
export function middleware(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/app', '/app/:path*'] };
