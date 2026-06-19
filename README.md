# KTT Art Store

A headless Stripe storefront for KTT artwork. The product catalog is local JSON (no Shopify), payments run through **Stripe Checkout** (hosted payment pages), and a support bot (Ollama + a small MCP server) handles browsing and cart actions. Design matches the minimal aesthetic of [kristiantalley.com](https://kristiantalley.com).

> **Deploying to the Ubuntu/nginx server? See [CLAUDE.md](./CLAUDE.md)** — it has the full runbook (systemd, nginx, Stripe secrets, webhook).

## Architecture

```
browser ──▶ store.kristiantalley.com (static SPA)
              │
fetch ─▶ llm.kristiantalley.com ──▶ MCP server (port 3001)
              │         ├── /mcp/*     (bot + cart tools)
              │         ├── /checkout  (Stripe Checkout Session)
              │         └── /webhook   (Stripe → records orders)
              │
checkout ──▶ Stripe hosted page ──▶ back to store.kristiantalley.com
```

**Key points:**
- **No Shopify** — the catalog is hand-edited local JSON (`mcp-server/data/products.json`). The `shopifyClient.js` file provides mock data + a live catalog fetch from the MCP server, but never connects to Shopify.
- **Headless Stripe** — the MCP server creates Stripe Checkout Sessions with `mode: 'payment'`. Buyers are redirected to Stripe's hosted page, pay with a card, and are redirected back. The MCP server receives a webhook (`checkout.session.completed`) and records the order.
- **1/1 originals** — every piece is unique. Once purchased, the webhook marks it as sold so it drops out of the store automatically.

## Tech stack

- **Build**: Vite · **Frontend**: React 18 + React Router 6 · **Styling**: Tailwind
- **Catalog**: local JSON (`mcp-server/data/products.json`) — no Shopify
- **Payments**: Stripe Checkout (server creates sessions; webhook records orders)
- **Support bot**: Ollama LLM + MCP server (`mcp-server/`)
- **Deploy**: static SPA on nginx + a Node service behind nginx

## Quick start (local)

```bash
npm install
cp .env.example .env          # set STRIPE_SECRET_KEY=sk_test_...
npm run dev                   # storefront → http://localhost:5173

# in another shell — the bot/cart/checkout backend:
cd mcp-server && npm install && node server.js --transport=http --port=3001
```

Stripe webhook locally: `stripe listen --forward-to localhost:3001/webhook`, then put the printed `whsec_…` in `.env` as `STRIPE_WEBHOOK_SECRET`.

## Layout

```
src/                         # React storefront
├── pages/  components/  context/CartContext.jsx
└── lib/    shopifyClient.js (catalog/data) · mcpCart.js · supportBot.js
mcp-server/                  # Node backend
├── server.js                # HTTP: /mcp/* (bot+cart), /checkout, /webhook
├── checkout.js              # Stripe session + webhook handling
├── data/products.json       # the catalog
└── deploy/{nginx,systemd}/  # production config
scripts/
├── sync-data.js             # regenerate products.json from the frontend catalog
└── deploy-mcp.sh            # deploy the backend to the server
```

## Editing inventory

The catalog is duplicated in three places — edit `src/lib/shopifyClient.js` (`getMockProducts`) **and** `scripts/sync-data.js`, then run `node scripts/sync-data.js` to regenerate `mcp-server/data/products.json`.

## Contact

talleykristian@gmail.com
