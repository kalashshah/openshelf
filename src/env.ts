export interface Env {
  DB: D1Database;
  /** Caps store-agent questions and AI imports per caller (they cost model tokens). Absent locally. */
  ASK_LIMIT?: RateLimit;

  /** Where this worker is reachable, no trailing slash. Cookies, PayPal return URLs and webhooks are issued for it. */
  PUBLIC_URL: string;
  BETTER_AUTH_SECRET: string;
  /** Base64 32-byte AES key; seals every shop's PayPal secret at rest. */
  MASTER_KEY: string;
  /** Log in with PayPal (a PayPal app with that feature on). Absent: the button is hidden. */
  PAYPAL_LOGIN_CLIENT_ID?: string;
  PAYPAL_LOGIN_CLIENT_SECRET?: string;
  /** "live" or "sandbox" (default). */
  PAYPAL_LOGIN_ENV?: string;

  /** Backs the store agent and the AI product import. */
  ANTHROPIC_API_KEY: string;

  /** The sandbox PayPal app demo shops ("Try the demo") check out through. */
  DEMO_PAYPAL_CLIENT_ID?: string;
  DEMO_PAYPAL_CLIENT_SECRET?: string;
  DEMO_PAYPAL_WEBHOOK_ID?: string;

  /** "off" skips PayPal webhook signature checks. Local demos only. */
  WEBHOOK_VERIFY?: string;
}
