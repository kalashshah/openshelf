# Open Shelf: Devpost submission kit

Paste-ready text for the submission form, a 3-minute demo video script, and a pre-submit checklist. Everything here matches what the code does today; update it if that changes.

## Tagline (≤ 200 chars)

Open Shelf turns a small business's PayPal products into a store that AI shopping agents can search, question and buy from. Every sale is a PayPal order the buyer approves.

## Inspiration

People are starting to send AI agents to shop for them. The big agentic-commerce programs need approval, cover large catalogs and mostly US physical goods. Meanwhile millions of small sellers run their "store" from a few PayPal payment links shared on Instagram. An agent can't find those links, can't ask whether the cream is fragrance-free, and can't place an order. We wanted the smallest PayPal merchant to be agent-ready in one click, without giving up control of what is said about their products or how money moves.

## What it does

**For merchants**
- Log in with PayPal and you can sell: orders are created with your PayPal account as the payee, so money lands directly with you.
- One-click import from your PayPal payment links and invoices, a Shopify store, any product page (read by Claude), or a pasted price list.
- A **store agent** (Claude) that answers shoppers' agents only from what you have published. When it doesn't know, it says so and puts the question in your inbox. You answer once; every future agent gets that answer, and the agent that asked can collect it with `check_question`.
- Orders, tracking (sent to PayPal and the buyer), and full or partial refunds, all through PayPal APIs.
- Listing on Channel3's product graph, so the catalog reaches ChatGPT, Copilot, Perplexity and Google.

**For shoppers and their agents**
- One MCP server for every listed store (`/mcp`) plus a per-store endpoint: `search_products`, `get_product`, `ask_store`, `check_question`, `buy`, `order_status`, `request_refund`.
- A web storefront with an "Ask the shop" chat and a bag for multi-item PayPal checkout, plus `llms.txt` and checkout links for assistants that only read pages.

**Money safety, built for agents**
- Nobody is charged without approving in PayPal; prices always come from the catalog, never from the agent.
- `buy` takes `max_total` (a spending cap) and an `idempotency_key` (a retry never opens a second order).
- Stock is reserved before capture, so two buyers approving the last item never both get charged.
- Captures that are still clearing wait as "payment clearing"; denied captures cancel and restock. Refunds and chargebacks made in PayPal are followed by webhook.
- Shopper refunds are automatic only inside the store's window and before shipping; anything else goes to a private merchant inbox.
- The store agent treats shopper text as data, not instructions, and strips links the shop never published from its answers.

## How we built it

- Next.js on Cloudflare Workers (OpenNext) with D1.
- **PayPal Server SDK** (APIMatic, written with its context plugin) for Orders v2 create, get and capture, order tracking and capture refunds. PayPal REST for Payment Links & Buttons, Invoicing and webhook verification. Log in with PayPal (OpenID Connect) for merchant sign-in.
- MCP TypeScript SDK as stateless Streamable HTTP on Workers.
- Claude for the store agent (structured output `{answer, product_ids, answered}`, cached shop context) and for reading product pages into a typed catalog.
- Channel3 Partner Program for distribution, and Channel3's API for price checks.
- Tests run checkout, oversell, pending captures, partial refunds and MCP tool scoping against an in-memory SQLite with the real migrations, plus wire-format tests on the exact JSON PayPal receives.

## Challenges we ran into

- **Making payment idempotent across three entry points.** The return page, the webhook and an agent's `order_status` can all complete the same sale at once. Conditional updates claim each step: stock is reserved once, and capture uses a PayPal request id.
- **Overselling with deferred capture.** Checking stock at order time isn't enough when the buyer approves minutes later. We reserve at approval, just before capture, and cancel uncharged orders that lose the race.
- **Running the PayPal SDK on Workers.** We pointed its axios transport at `fetch`, set timeouts explicitly (the default is to wait forever) and kept one client per app per isolate.
- **Keeping a store agent honest when another agent acts on its words.** We ground it strictly in the shop's own context, mark shopper input as untrusted, filter links and route unknowns to the merchant.

## Accomplishments we're proud of

- A merchant with only PayPal payment links can be agent-ready in under a minute.
- An agent can go from "find me a moisturizer under $30" to a PayPal approval link, tracking and a policy-checked refund through one MCP connector.

## What we learned

Agentic commerce needs guardrails a human checkout never needed: spending caps, idempotency keys, honest "I don't know" answers, and refund policy enforced by the server, not the model.

## What's next

- Vectorize-backed semantic search for large directories.
- Multi-currency stores, and shipping rates at checkout.
- PayPal's Agent Toolkit and Store Sync as they open to more merchants.

## Built with

paypal-server-sdk, paypal-orders-v2, paypal-payment-links, paypal-invoicing, log-in-with-paypal, paypal-webhooks, cloudflare-workers, d1, next.js, mcp, claude, anthropic, channel3, typescript, tailwind

---

## Demo video script (about 3 minutes)

1. **0:00 Problem (15 s).** "This skincare shop sells through PayPal links on Instagram. When a shopper's AI agent goes looking, the shop doesn't exist."
2. **0:15 Merchant setup (35 s).** Log in with PayPal. Import payment links in one click, then show a Shopify URL converting exactly. Show the Overview checklist and the store endpoint.
3. **0:50 Agent shopping (60 s).** In Claude with the Open Shelf connector: "Find me something for oily skin under $30, check it won't clog pores, and buy it, max $30." Show `search_products`, then `ask_store` answering from the merchant's notes, then `buy` with `max_total` returning a PayPal link. Approve in the PayPal sandbox and run `order_status`, which comes back paid.
4. **1:50 The honest "I don't know" (30 s).** Ask "Is it safe in pregnancy?" The store agent says the shop hasn't published that. Switch to the merchant's Questions inbox, answer once, and the agent's `check_question` returns the answer.
5. **2:20 After the sale (25 s).** Add a tracking number (sent to PayPal) and run a partial refund in Orders. The agent's `request_refund` on a shipped order goes to the merchant's private Refund requests inbox.
6. **2:45 Close (15 s).** "Every sale is a PayPal order the buyer approved. Every store is agent-ready."

## Pre-submit checklist

- [ ] `pnpm test && pnpm typecheck && pnpm build` pass.
- [ ] `pnpm run db:remote` applied (includes `0006_orders_safety.sql` and `0007_stock_guard.sql`), then `pnpm run deploy`.
- [ ] Open the dashboard once after deploying: existing webhooks (each merchant app and the demo app) are patched to the new events (CAPTURE.PENDING, DENIED, REVERSED) on first load.
- [ ] On production: Try the demo store, ask a question, buy with the sandbox card, add tracking, refund part of the order.
- [ ] Claude custom connector at `https://openshelf.keronlabs.com/mcp`: run the judge prompt from the README.
- [ ] Video uploaded (public or unlisted), repository link and testing instructions pasted into Devpost.
