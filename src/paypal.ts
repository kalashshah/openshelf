/** The slice of PayPal REST that Open Shelf needs: Orders v2, captures/refunds, tracking, Payment Links, webhooks. */

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  env: 'sandbox' | 'live';
  webhookId?: string;
}

const HOSTS = { sandbox: 'https://api-m.sandbox.paypal.com', live: 'https://api-m.paypal.com' } as const;

export const WEBHOOK_EVENTS = ['CHECKOUT.ORDER.APPROVED', 'PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.REFUNDED'];

// Access tokens per PayPal app, per isolate.
const tokens = new Map<string, { token: string; exp: number }>();

export interface OrderLine {
  name: string;
  /** Becomes the PayPal item SKU, so the merchant's PayPal activity names the product. */
  sku: string;
  /** false = service or digital: no shipping address needed. */
  ships?: boolean;
  quantity: number;
  unitCents: number;
}

export interface PayPalOrder {
  id: string;
  status: string;
  approveUrl?: string;
  captureId?: string;
  captureStatus?: string;
  buyerName?: string;
  buyerEmail?: string;
  shipTo?: string;
}

/** A merchant's Payment Link, reduced to what becomes a product. */
export interface PayLink {
  id: string;
  url: string;
  active: boolean;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  variants: { name: string; options: { label: string; price_cents?: number }[] }[];
  needsShipping: boolean;
}

export class PayPal {
  constructor(private readonly cfg: PayPalConfig) {}

  private get host(): string {
    return HOSTS[this.cfg.env];
  }

  private get tokenKey(): string {
    return `${this.cfg.env}:${this.cfg.clientId}`;
  }

  private async token(): Promise<string> {
    const cached = tokens.get(this.tokenKey);
    if (cached && cached.exp > Date.now() + 60_000) return cached.token;
    const res = await fetch(`${this.host}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${this.cfg.clientId}:${this.cfg.clientSecret}`)}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal auth failed (${res.status}); check the client id and secret of the PayPal app`);
    const j = (await res.json()) as { access_token: string; expires_in: number };
    tokens.set(this.tokenKey, { token: j.access_token, exp: Date.now() + j.expires_in * 1000 });
    return j.access_token;
  }

  private async api<T>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
    const send = async () =>
      fetch(`${this.host}${path}`, {
        method,
        headers: { Authorization: `Bearer ${await this.token()}`, 'content-type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    let res = await send();
    // A cached token keeps the scopes it was minted with; one minted after a feature is switched on has them.
    if (res.status === 401 || res.status === 403) {
      tokens.delete(this.tokenKey);
      res = await send();
    }
    const text = await res.text();
    if (res.status === 403) throw new PayPalError(403, `PayPal refused ${method} ${path}: this PayPal app lacks the permission. ${featureHint(path)}`, text);
    if (!res.ok) throw new PayPalError(res.status, `PayPal ${method} ${path} failed (${res.status}): ${describeError(text)}`, text);
    return (text ? JSON.parse(text) : {}) as T;
  }

  // ---- orders ----------------------------------------------------------------

  async createOrder(o: { lines: OrderLine[]; currency: string; brandName: string; referenceId: string; returnUrl: string; cancelUrl: string }): Promise<PayPalOrder> {
    const total = orderTotalCents(o.lines);
    const raw = await this.api<RawOrder>(
      'POST',
      '/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: o.referenceId,
            custom_id: o.referenceId,
            amount: { currency_code: o.currency, value: money(total), breakdown: { item_total: { currency_code: o.currency, value: money(total) } } },
            items: o.lines.map((l) => ({
              name: l.name.slice(0, 127),
              sku: l.sku.slice(0, 127),
              quantity: String(l.quantity),
              unit_amount: { currency_code: o.currency, value: money(l.unitCents) },
              category: l.ships === false ? 'DIGITAL_GOODS' : 'PHYSICAL_GOODS',
            })),
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: o.brandName.slice(0, 127),
              // PayPal collects an address only when something in the cart ships.
              shipping_preference: o.lines.some((l) => l.ships !== false) ? 'GET_FROM_FILE' : 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: o.returnUrl,
              cancel_url: o.cancelUrl,
            },
          },
        },
      },
      { 'PayPal-Request-Id': o.referenceId },
    );
    return toOrder(raw);
  }

  async getOrder(id: string): Promise<PayPalOrder> {
    return toOrder(await this.api<RawOrder>('GET', `/v2/checkout/orders/${encodeURIComponent(id)}`));
  }

  /** Captures an approved order. Capturing twice (return page and webhook racing) yields the existing capture. */
  async captureOrder(id: string): Promise<PayPalOrder> {
    try {
      return toOrder(await this.api<RawOrder>('POST', `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {}, { 'PayPal-Request-Id': `cap-${id}`, Prefer: 'return=representation' }));
    } catch (e) {
      if (e instanceof PayPalError && /ORDER_ALREADY_CAPTURED/.test(e.body)) return this.getOrder(id);
      throw e;
    }
  }

  async refundCapture(captureId: string, note: string): Promise<{ id: string; status: string }> {
    return this.api('POST', `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, { note_to_payer: note.slice(0, 255) }, { 'PayPal-Request-Id': `ref-${captureId}`, Prefer: 'return=representation' });
  }

  async addTracking(orderId: string, captureId: string, trackingNumber: string, carrier: string): Promise<void> {
    await this.api('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/track`, {
      capture_id: captureId,
      tracking_number: trackingNumber,
      carrier: carrier.toUpperCase().replace(/[^A-Z0-9_]/g, '_') || 'OTHER',
      notify_payer: true,
    });
  }

  // ---- invoices: what a service business has actually sold -----------------------------

  /** Line items of the merchant's recent invoices, newest first, as plain lines for the importer. */
  async invoiceLines(max = 40): Promise<string[]> {
    const found = await this.api<{ items?: { id: string }[] }>('POST', `/v2/invoicing/search-invoices?page=1&page_size=${max}&total_required=false`, {});
    // ponytail: one GET per invoice (search omits line items); capped at 40 for the Workers subrequest budget.
    const full = await Promise.all(
      (found.items ?? []).slice(0, max).map((i) =>
        this.api<{ detail?: { invoice_date?: string; currency_code?: string }; status?: string; items?: { name: string; description?: string; quantity?: string; unit_amount?: RawMoney }[] }>(
          'GET',
          `/v2/invoicing/invoices/${encodeURIComponent(i.id)}`,
        ),
      ),
    );
    return full.flatMap((inv) =>
      (inv.items ?? []).map(
        (it) => `${inv.detail?.invoice_date ?? ''} invoice (${inv.status ?? ''}): ${it.name}${it.description ? ` (${it.description})` : ''}, qty ${it.quantity ?? 1}, ${it.unit_amount?.value ?? '?'} ${it.unit_amount?.currency_code ?? inv.detail?.currency_code ?? ''}`,
      ),
    );
  }

  // ---- payment links (the "store" small merchants already have) ----------------

  async listPayLinks(max = 100): Promise<PayLink[]> {
    const out: PayLink[] = [];
    let path: string | null = '/v1/checkout/payment-resources?page_size=50&total_required=false';
    while (path && out.length < max) {
      const page: { resources?: RawPayLink[]; links?: { rel: string; href: string }[] } = await this.api('GET', path);
      const items = page.resources ?? [];
      // ponytail: list items usually carry line_items; when one does not, it costs a GET each (Workers subrequest cap ~50).
      const full = await Promise.all(items.map((r) => (r.line_items?.length ? r : this.api<RawPayLink>('GET', `/v1/checkout/payment-resources/${encodeURIComponent(r.id)}`))));
      for (const r of full) {
        const link = toPayLink(r);
        if (link) out.push(link);
      }
      const next = page.links?.find((l) => l.rel === 'next')?.href;
      path = next && items.length ? new URL(next).pathname + new URL(next).search : null;
    }
    return out.slice(0, max);
  }

  async createPayLink(p: { name: string; description: string; priceCents: number; currency: string; returnUrl: string; ships: boolean }): Promise<{ id: string; url: string }> {
    const r = await this.api<RawPayLink>('POST', '/v1/checkout/payment-resources', {
      integration_mode: 'LINK',
      type: 'BUY_NOW',
      reusable: 'MULTIPLE',
      return_url: p.returnUrl,
      line_items: [
        {
          name: p.name.slice(0, 127),
          ...(p.description ? { description: p.description.slice(0, 2048) } : {}),
          unit_amount: { currency_code: p.currency, value: money(p.priceCents) },
          collect_shipping_address: p.ships,
        },
      ],
    });
    return { id: r.id, url: payLinkUrl(r) ?? '' };
  }

  // ---- webhooks -----------------------------------------------------------------

  async verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    if (!this.cfg.webhookId) return false;
    const h = (name: string) => JSON.stringify(headers.get(name) ?? '');
    // Built by hand so `webhook_event` is the exact bytes PayPal signed; re-serialising would fail verification.
    const body =
      `{"auth_algo":${h('paypal-auth-algo')},"cert_url":${h('paypal-cert-url')},` +
      `"transmission_id":${h('paypal-transmission-id')},"transmission_sig":${h('paypal-transmission-sig')},` +
      `"transmission_time":${h('paypal-transmission-time')},"webhook_id":${JSON.stringify(this.cfg.webhookId)},` +
      `"webhook_event":${rawBody}}`;
    const res = await fetch(`${this.host}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await this.token()}`, 'content-type': 'application/json' },
      body,
    });
    if (!res.ok) return false;
    return ((await res.json()) as { verification_status?: string }).verification_status === 'SUCCESS';
  }

  async registerWebhook(url: string): Promise<string> {
    const existing = await this.api<{ webhooks?: { id: string; url: string }[] }>('GET', '/v1/notifications/webhooks');
    const found = existing.webhooks?.find((w) => w.url === url);
    if (found) return found.id;
    const res = await this.api<{ id: string }>('POST', '/v1/notifications/webhooks', { url, event_types: WEBHOOK_EVENTS.map((name) => ({ name })) });
    return res.id;
  }
}

export class PayPalError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: string,
  ) {
    super(message);
  }
}

// ---- pure helpers (tested) ------------------------------------------------------

export function money(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function toCents(value: string | number | undefined): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function orderTotalCents(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
}

interface RawMoney {
  currency_code?: string;
  value?: string;
}
interface RawOrder {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  payer?: { name?: { given_name?: string; surname?: string }; email_address?: string };
  purchase_units?: {
    shipping?: { name?: { full_name?: string }; address?: Record<string, string> };
    payments?: { captures?: { id: string; status: string }[] };
  }[];
}
interface RawPayLink {
  id: string;
  status?: string;
  payment_link?: string;
  links?: { rel: string; href: string }[];
  line_items?: {
    name?: string;
    description?: string;
    unit_amount?: RawMoney;
    collect_shipping_address?: boolean;
    variants?: { dimensions?: { name: string; primary?: boolean; options?: { label: string; unit_amount?: RawMoney }[] }[] };
  }[];
}

export function toOrder(r: RawOrder): PayPalOrder {
  const unit = r.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const a = unit?.shipping?.address;
  const name = [r.payer?.name?.given_name, r.payer?.name?.surname].filter(Boolean).join(' ');
  return {
    id: r.id,
    status: r.status,
    approveUrl: r.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href,
    captureId: capture?.id,
    captureStatus: capture?.status,
    buyerName: unit?.shipping?.name?.full_name || name || undefined,
    buyerEmail: r.payer?.email_address,
    shipTo: a ? [a.address_line_1, a.address_line_2, a.admin_area_2, a.admin_area_1, a.postal_code, a.country_code].filter(Boolean).join(', ') : undefined,
  };
}

function payLinkUrl(r: RawPayLink): string | undefined {
  return r.payment_link ?? r.links?.find((l) => l.rel === 'payment_link')?.href;
}

export function toPayLink(r: RawPayLink): PayLink | null {
  const item = r.line_items?.[0];
  if (!item?.name) return null;
  // A link whose primary option carries prices has no item-level price: the cheapest option is the "from" price.
  const optionPrices = (item.variants?.dimensions ?? []).flatMap((d) => (d.primary ? (d.options ?? []) : [])).flatMap((o) => (o.unit_amount ? [o.unit_amount] : []));
  const base = (item.unit_amount && toCents(item.unit_amount.value) > 0 ? item.unit_amount : undefined) ?? [...optionPrices].sort((a, b) => toCents(a.value) - toCents(b.value))[0];
  return {
    id: r.id,
    url: payLinkUrl(r) ?? '',
    active: (r.status ?? 'ACTIVE') === 'ACTIVE',
    name: item.name,
    description: item.description ?? '',
    priceCents: toCents(base?.value),
    currency: base?.currency_code ?? 'USD',
    needsShipping: item.collect_shipping_address !== false,
    variants: (item.variants?.dimensions ?? []).map((d) => ({
      name: d.name,
      options: (d.options ?? []).map((o) => ({ label: o.label, ...(d.primary && o.unit_amount ? { price_cents: toCents(o.unit_amount.value) } : {}) })),
    })),
  };
}

function featureHint(path: string): string {
  if (path.startsWith('/v1/checkout/payment-resources'))
    return 'In developer.paypal.com → Apps & Credentials → your app → Features, tick "Payment Links and Buttons", save, then retry (it can take a few minutes).';
  return 'Check the features enabled on the PayPal app in developer.paypal.com → Apps & Credentials.';
}

function describeError(text: string): string {
  try {
    const j = JSON.parse(text) as { name?: string; message?: string; details?: { issue?: string; description?: string }[] };
    const detail = j.details?.map((d) => d.description ?? d.issue).filter(Boolean).join('; ');
    return [j.name, j.message, detail].filter(Boolean).join(' – ') || text.slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}
