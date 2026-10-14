import { betterAuth } from 'better-auth';
import { anonymous, emailOTP, genericOAuth } from 'better-auth/plugins';
import type { Env } from './env';

type Auth = ReturnType<typeof betterAuth>;

// One instance per isolate: building better-auth is CPU-heavy. Keyed by the D1 binding.
const instances = new WeakMap<object, Auth>();

export function getAuth(env: Env): Auth {
  const cached = instances.get(env.DB);
  if (cached) return cached;
  const socialProviders = {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } : {}),
  };
  // Cast once: better-auth's plugin generics make the configured type incompatible with the plain one.
  const auth = betterAuth({
    database: env.DB as unknown as never,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.PUBLIC_URL,
    trustedOrigins: [env.PUBLIC_URL],
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    socialProviders,
    // Same email through a code, Google or PayPal = same account and shop.
    account: { accountLinking: { enabled: true, trustedProviders: ['google', 'paypal'] } },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        async sendVerificationOTP({ email, otp }) {
          await sendEmail(env, { to: email, subject: 'Your Open Shelf login code', text: `Your Open Shelf login code is ${otp}. It expires in 10 minutes.`, html: otpHtml(otp) });
        },
      }),
      // "Try the demo": a judge gets a throwaway account and a seeded shop without an email round-trip.
      anonymous({ emailDomainName: 'demo.openshelf.local' }),
      ...(paypalLoginEnabled(env) ? [paypalLogin(env)] : []),
    ],
  }) as unknown as Auth;
  instances.set(env.DB, auth);
  return auth;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  isAnonymous: boolean;
}

export async function sessionUser(env: Env, headers: Headers): Promise<SessionUser | null> {
  try {
    const s = await getAuth(env).api.getSession({ headers });
    if (!s?.user) return null;
    const u = s.user as typeof s.user & { isAnonymous?: boolean | null };
    return { id: u.id, email: u.email, name: u.name, isAnonymous: Boolean(u.isAnonymous) };
  } catch (e) {
    console.error('session_failed', String(e));
    return null;
  }
}

export function googleEnabled(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

/**
 * Log in with PayPal. Generic OAuth rather than better-auth's built-in provider, which sends no scope
 * (PayPal then returns no email). The PayPal app needs "Log in with PayPal" on, the email and name
 * attributes ticked, and <PUBLIC_URL>/api/auth/callback/paypal as a return URL.
 */
function paypalLogin(env: Env) {
  const live = env.PAYPAL_LOGIN_ENV === 'live';
  const web = live ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';
  const api = live ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  return genericOAuth({
    config: [
      {
        providerId: 'paypal',
        name: 'PayPal',
        clientId: env.PAYPAL_LOGIN_CLIENT_ID as string,
        clientSecret: env.PAYPAL_LOGIN_CLIENT_SECRET as string,
        authorizationUrl: `${web}/signin/authorize`,
        tokenUrl: `${api}/v1/oauth2/token`,
        scopes: ['openid', 'email', 'profile'],
        authentication: 'basic',
        pkce: false,
        async getUserInfo(tokens) {
          const res = await fetch(`${api}/v1/identity/oauth2/userinfo?schema=openid`, { headers: { Authorization: `Bearer ${tokens.accessToken}`, Accept: 'application/json' } });
          if (!res.ok) return null;
          const u = (await res.json()) as { sub?: string; user_id?: string; name?: string; email?: string; email_verified?: boolean };
          const id = u.sub ?? u.user_id;
          return id && u.email ? { id, email: u.email, name: u.name ?? u.email.split('@')[0], emailVerified: u.email_verified ?? true } : null;
        },
      },
    ],
  });
}

export function paypalLoginEnabled(env: Env): boolean {
  return Boolean(env.PAYPAL_LOGIN_CLIENT_ID && env.PAYPAL_LOGIN_CLIENT_SECRET);
}

/** Login codes go out through Cloudflare Email Sending; with no binding they are logged, so local login still works. */
async function sendEmail(env: Env, m: { to: string; subject: string; text: string; html: string }): Promise<void> {
  if (!env.EMAIL) {
    console.log(`[email:dev] to=${m.to} subject="${m.subject}"\n${m.text}`);
    return;
  }
  await env.EMAIL.send({ ...m, from: env.EMAIL_FROM || 'shelf@mail.llamacalls.com' });
}

function otpHtml(otp: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#15171c;padding:32px"><div style="max-width:480px;margin:0 auto;text-align:center"><div style="font-weight:700;font-size:20px">Open Shelf</div><p style="margin:24px 0 16px">Here is your login code.</p><div style="display:inline-block;background:#eef2fb;border-radius:12px;padding:20px 28px;font:700 34px/1 Menlo,monospace;letter-spacing:8px">${otp}</div><p style="color:#68707f;font-size:14px;margin-top:24px">It expires in 10 minutes. If you didn't ask for it, ignore this email.</p></div></body></html>`;
}
