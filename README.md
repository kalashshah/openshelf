# Open Shelf

**Your PayPal business, ready for AI shoppers.**

Open Shelf turns the products a small business already sells on PayPal into a store that AI agents can search, ask questions of, and buy from. It also gives the business a web shop for people. Every store gets its own **store agent** that answers shoppers' agents from what the merchant has published. When it doesn't know something, it says so and puts the question in the merchant's inbox. Every sale is a PayPal order in the merchant's own account, approved by the buyer in PayPal.

Live: **https://openshelf.keronlabs.com** · demo store: [/s/dewdrop](https://openshelf.keronlabs.com/s/dewdrop) · agent endpoint: `https://openshelf.keronlabs.com/mcp`

```
Person → their agent      Find me a moisturizer for oily skin, under $30.
Agent → Open Shelf        search_products("moisturizer oily skin", max_price 30)
Agent → Dewdrop's agent   ask_store("Will the gel moisturizer clog pores? Any fragrance?")
Dewdrop's agent           It was tested non-comedogenic by an independent lab and has no added fragrance…
Agent → Open Shelf        buy(Oil-Free Gel Moisturizer, Size 100 ml, qty 2) → PayPal approval link
Person                    approves in PayPal → order captured, shows up in Dewdrop's PayPal and dashboard
Merchant                  adds a USPS tracking number → sent to PayPal → agent's order_status shows it
Agent → Open Shelf        request_refund("It made my skin break out") → inside the 30-day window → refunded via PayPal
```

## The problem

Shoppers are starting to send AI agents to find and buy things for them. PayPal's own agentic commerce programs (Agent Ready, Store Sync) need approval and currently cover US physical goods only. A small seller whose "store" is a few PayPal payment links shared on Instagram has no way to be found by an agent, to answer its questions, or to take an order from it.

## What it does

**For merchants**
- **Log in with PayPal and you can sell.** No API keys: Open Shelf's PayPal app creates each order with your PayPal account as the payee, so money lands straight in it. Connect your own PayPal app (optional) to also import payment links and invoices, refund automatically and send tracking to PayPal.
- **Bring your shop in one click.** Import your **PayPal payment links** (Pay Links & Buttons API), convert a **Shopify store** exactly (via its public `products.json`), have **Claude read any product page**, or paste a price list or CSV. Options and per-option prices come across too.
- **A store agent that only says what you've published.** It answers from your catalog, your "about the store" notes and your past answers. Questions it can't answer land in **Questions** marked "needs answer". You answer once, and every future shopper's agent gets that answer.
- **Orders in your PayPal.** Orders are created with your PayPal app credentials (Orders v2). The buyer picks a shipping address and approves in PayPal. Add a tracking number and it goes to PayPal (Orders tracking API). Refunds go through the Captures API and follow your refund window.
- **The other direction too.** Products you create here can be published as PayPal payment links you can share anywhere.

**For shoppers and their agents**
- **One MCP server for every listed store** (`/mcp`). Each store can also share a link scoped to just its shop (`/s/<store>/mcp`): same tools, no `store` argument needed, and it works for stores that aren't in the directory. Tools: `list_stores`, `search_products`, `get_product`, `ask_store`, `buy`, `order_status`, `request_refund`.
- A web storefront for people at `/s/<store>`, with an "Ask the store" chat that talks to the same store agent, plus `/s/<store>/llms.txt` for agents that read rather than call tools.
- **Nobody is charged without approving.** `buy` returns a PayPal approval link. Prices always come from the catalog, never from the agent.

## Try it (judges)

1. Open https://openshelf.keronlabs.com and click **Try it with a demo store**. You get your own copy of the demo skincare shop, wired to a sandbox PayPal app. No sign-up needed. (Or **Set up my store with PayPal** and log in with a PayPal sandbox account: your shop is created and paid straight into that account.)
2. **As a shopper:** open *View store*, ask "Which moisturizer suits oily skin? Is it safe in pregnancy?", then buy something. At PayPal choose **Pay with Credit or Debit Card**, set the country to United States, and use the sandbox test Visa `4005 5192 0000 0004`, any future expiry, CVV `123`, and any US address. Or log in with any PayPal sandbox personal account.
3. **As an agent:** in Claude, go to *Settings → Connectors → Add custom connector* and paste `https://openshelf.keronlabs.com/mcp`, the one endpoint for every listed store. Then ask: *"Find me something from Dewdrop for oily skin under $30, check it won't clog pores, and buy it."* Demo copies stay out of the directory, so to shop your own copy, paste the store endpoint shown on its Overview page instead.
4. **As the merchant:** watch the question and order appear on Overview. Answer the pregnancy question under *Questions* and ask again. Mark the order shipped with a tracking number, or refund it under *Orders*.
5. **Bring a real shop:** under *Products*, paste a Shopify store URL (e.g. `https://hydrogen-preview.myshopify.com`) or a price list.

## How it uses PayPal

| PayPal API | Used for | Called through |
|---|---|---|
| OAuth2 client credentials | access tokens per PayPal app (merchants' own app secrets are sealed with AES-GCM) | Server SDK + REST |
| **Orders v2** create / get / capture | every purchase, agent or human; PayPal collects the address only when something ships (`GET_FROM_FILE` / `NO_SHIPPING`) | **PayPal Server SDK** `OrdersController` |
| **Orders v2 tracking** | the merchant's tracking number goes to PayPal and the buyer (known carriers by code, others as `OTHER` + name) | **PayPal Server SDK** `createOrderTracking` |
| **Payments v2 captures refund** | shopper refunds inside the store's window, merchant refunds anytime | **PayPal Server SDK** `PaymentsController` |
| **Orders v2 `payee`** | merchants who only log in with PayPal: Open Shelf's app creates the order and the money goes straight to their account | **PayPal Server SDK** |
| **Log in with PayPal** (OpenID Connect) | the only way merchants sign in | better-auth |
| **Payment Links & Buttons** (`/v1/checkout/payment-resources`) | importing a merchant's payment links as products, and publishing products back as links | REST (not in the SDK) |
| **Invoicing v2** (search + get) | turning what a service business has invoiced into products | REST (not in the SDK) |
| **Webhooks** + verify-webhook-signature | `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED` complete a sale even if the buyer never comes back | REST (not in the SDK) |

Paying is idempotent: the return page, the webhook and `order_status` all complete a sale, and a conditional update makes sure stock is taken only once.

## Built with APIMatic's PayPal Server SDK context plugin

Every money-moving call (create order, get order, capture, tracking, refund) goes through the APIMatic-generated [PayPal Server SDK](https://www.npmjs.com/package/@paypal/paypal-server-sdk) (`@paypal/paypal-server-sdk`, `src/server/paypal.ts`). That code was written by Claude Code with APIMatic's [context plugin](https://github.com/paypaldev/server-sdk-context-plugin-preview) installed:

```bash
npx context-plugins install https://github.com/paypaldev/server-sdk-context-plugin-preview --targets claude
```

The plugin's TypeScript skills caught details the types alone don't show, and they shaped the code:
- **Client lifetime.** Build one `Client` per PayPal app and reuse it, because it caches its own OAuth token. Open Shelf keeps one per app per isolate, with `oAuthClockSkew` so tokens refresh early.
- **Timeouts.** The generated `timeout` default is `0`, which means wait forever, so it is set explicitly.
- **Workers runtime.** The SDK's transport is axios. `unstable_httpClientOptions: { adapter: 'fetch' }` makes it use the Workers `fetch`, so the SDK runs on Cloudflare with no Node `http`.
- **Errors.** Operations throw `ApiError`, and the payload is on `body`. `sdkCall()` turns it into the same readable error the rest of the app shows, which also keeps the double-capture race safe (`ORDER_ALREADY_CAPTURED` returns the existing capture).
- **Typed enums.** `CheckoutPaymentIntent`, `ItemCategory`, `PaypalWalletContextShippingPreference` and `ShipmentCarrier` are used instead of strings. Carriers PayPal knows are sent by code; any other carrier is sent as `OTHER` with its name.
- **Tests** stub `fetch` under the SDK and assert the exact snake_case body PayPal receives: idempotency key, payee, item categories and shipping preference (`test/rules.test.ts`).

## How it uses Channel3

Open Shelf is an on-ramp **into** [Channel3](https://trychannel3.com)'s product graph for small PayPal merchants, through Channel3's [Partner Program](https://partner.docs.trychannel3.com):

- **List on Channel3** (Overview). A merchant with their own website is provisioned as a Channel3 merchant (`POST /v0/partner/merchants`), and Channel3 starts crawling and normalizing their catalog. Stores that live only on Open Shelf are listed through Open Shelf itself, registered once as a marketplace merchant whose sitemap covers every listed store.
- **Distribute everywhere.** From the same card the merchant opens Channel3's hosted connect page (`…/connections/sessions`) to switch on ChatGPT, Google, Microsoft Copilot, Perplexity and PayPal. Live status and synced product counts come from `…/connections`.
- **Crawlable by design.** Every product has its own page (`/s/<store>/p/<id>`) with schema.org `Product` + `Offer` data (price, currency, stock, options, return window, an image URL even for products without a photo). There is also `/sitemap.xml` and `robots.txt`. Every listing's offer URL is the Open Shelf product page, so the buyer checks out with PayPal.
- **Price check (developer API).** For brand-name products, the merchant can match the item in Channel3's catalog to see what other stores charge (`/v1/search`, `/v1/products/{id}`). Nothing is copied from other retailers.

Keys: `CHANNEL3_PARTNER_KEY` (Partner Program) and `CHANNEL3_API_KEY` (developer API; Channel3's free MCP tier is used without it). The partner redirect URI to allowlist is `<PUBLIC_URL>/app/channel3/return`.

## How it uses AI

- **Claude (claude-opus-5-5) is the store agent.** It gets one shop's catalog, notes and the merchant's past answers as a cached system block. It returns structured output `{answer, product_ids, answered}`, and is told to say "the shop hasn't published that" instead of guessing, because another agent may act on its answer. `answered: false` routes the question to the merchant.
- **Claude reads existing shops.** For a product page, it gets the page's JSON-LD, image URLs and text and returns a typed catalog (names, prices, options, images). Shopify stores skip the model and convert exactly.
- **The shopper's own agent** (Claude, ChatGPT, anything that speaks MCP) does the shopping through the MCP tools.

## Run it yourself

Requires Node 20+, pnpm and a Cloudflare account.

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in the secrets; generators are in the comments
npx wrangler d1 create openshelf # paste the id into wrangler.jsonc
pnpm run db:local && pnpm dev    # http://localhost:3000 (Next dev with the Cloudflare bindings)
pnpm test                        # pricing, refund policy, search, PayPal SDK wire format, Channel3, schema.org
pnpm preview                     # the built worker in workerd, as it runs in production
```

Deploy: `pnpm run db:remote && pnpm run deploy && pnpm run secrets`. To import payment links, the merchant's PayPal app needs **Payment Links and Buttons** ticked under *Features* in developer.paypal.com.

## Stack

- **Next.js 15 (App Router) on Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare), with D1 for data and a Workers rate limiter on the AI routes.
- **AlignUI** components on Tailwind v4 (`src/components/ui`): Button, FancyButton, Input, Select, Switch, StatusBadge, Table, Alert, Divider and the app shell, with AlignUI's design tokens in `src/app/globals.css`.
- **better-auth** for Log in with PayPal (generic OAuth, `openid email profile`) and anonymous demo accounts.
- **MCP TypeScript SDK** (stateless Streamable HTTP route handlers), the **Anthropic TypeScript SDK**, the **PayPal Server SDK** (APIMatic) and PayPal REST for the APIs the SDK doesn't cover, all in `src/server/`.
- Server components render every page; server actions handle the dashboard forms; client components are the interactive parts (the store assistant, option pickers, switches).

## Known limits

- Search is keyword ranking in memory, which is fine for hundreds of products. Swap in D1 FTS or Vectorize for a big directory.
- One currency per store, and shipping is included in prices (PayPal collects the address).
- Payment links carry no images or stock, so imported products start with a tinted placeholder and untracked stock until the merchant edits them.

MIT licensed.
