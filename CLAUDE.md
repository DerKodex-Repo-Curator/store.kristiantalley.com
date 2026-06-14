# store.kristiantalley.com — deploy & ops runbook

Art store: a React/Vite single-page storefront + a small Node "MCP" server that
powers the support bot, cart, and **Stripe checkout**. The product catalog is
local JSON (no Shopify). Payments go through Stripe's hosted checkout.

## Architecture

```
                         nginx
buyer ──HTTPS──▶ store.kristiantalley.com ──▶ static /dist (the SPA)
                         │
browser fetch ─▶ llm.kristiantalley.com ──▶ proxied to node 127.0.0.1:3001
                         ├─ /mcp/      (bot + cart tools)
                         ├─ /checkout  (creates Stripe Checkout Session)
                         └─ /webhook   (Stripe → records paid orders)
                         └─ Ollama (support-bot LLM) also lives on this host

checkout payment ──▶ Stripe hosted page ──▶ back to store.kristiantalley.com
```

- **Frontend**: built with `vite build` into `dist/`, served as static files. Public
  config baked in from `.env.production` (URLs only — never secrets).
- **Backend**: `mcp-server/` Node HTTP server on port 3001, behind nginx on
  `llm.kristiantalley.com`. Runs under systemd. Secrets come from an
  EnvironmentFile, NOT from the repo.
- **Data**: `mcp-server/data/` — `products.json` (catalog, from the repo) and the
  runtime files `carts.json` / `orders.json` / `inquiries.json` (live only on the
  server; `orders.json`/`inquiries.json` hold customer PII and are gitignored).

## First-time server setup

Prereqs: Node ≥18, nginx, certbot, a Stripe account.

> Paths below assume the repo lives at `~/store.kristiantalley.com`. Adjust the
> systemd `WorkingDirectory`/`User` and the nginx `root` to match where you put it.

### 1. Install dependencies
```bash
cd ~/store.kristiantalley.com
npm ci                      # frontend build deps
cd mcp-server && npm ci --production && cd ..
```

### 2. Build the storefront
```bash
npm run build               # uses .env.production → writes ./dist
```
Serve `dist/` via the `store.kristiantalley.com` server block in
`nginx.conf.example` (set `root` to this repo's `dist`, or copy `dist` to
`/var/www/...`).

### 3. Server secrets (NEVER in the repo)
Create `/etc/store.kristiantalley.com/env`, root-owned, `chmod 600`:
```ini
STRIPE_SECRET_KEY=sk_live_xxx        # use sk_test_ until you're ready for real money
STRIPE_WEBHOOK_SECRET=whsec_xxx      # from step 6
SITE_URL=https://store.kristiantalley.com
# optional: STRIPE_CURRENCY=usd  STRIPE_SHIPPING_COUNTRIES=US,CA,GB,...
```
> ⚠️ Do NOT ship the local `.env` to the server. The MCP server reads this
> EnvironmentFile; a stray repo `.env` could leak a test key into prod. If you
> scp'd one over, delete it: `rm -f ~/store.kristiantalley.com/.env`.

### 4. systemd service (the Node backend)
```bash
sudo cp mcp-server/deploy/systemd/mcp-server.service /etc/systemd/system/
sudo nano /etc/systemd/system/mcp-server.service   # fix WorkingDirectory + User
sudo systemctl daemon-reload
sudo systemctl enable --now mcp-server
systemctl status mcp-server          # should be active
```

### 5. nginx
```bash
# Backend (llm subdomain): proxies /mcp/ /checkout /webhook /health → :3001
sudo cp mcp-server/deploy/nginx/mcp.conf /etc/nginx/conf.d/mcp.conf
# Storefront (store subdomain): static dist (adapt from nginx.conf.example)
sudo cp nginx.conf.example /etc/nginx/sites-available/kristiantalley-store
sudo ln -s /etc/nginx/sites-available/kristiantalley-store /etc/nginx/sites-enabled/
sudo certbot --nginx -d store.kristiantalley.com -d llm.kristiantalley.com
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Stripe webhook
Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://llm.kristiantalley.com/webhook`
- Event: `checkout.session.completed`
- Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in the env file (step 3),
  then `sudo systemctl restart mcp-server`.

### 7. Verify
```bash
curl https://llm.kristiantalley.com/health                     # {"status":"healthy"}
curl https://llm.kristiantalley.com/mcp/tools | head -c 200    # tool list
```
Then on the live site: add a piece → checkout → pay with test card
`4242 4242 4242 4242` → you should return to the store, and the order should
appear in `mcp-server/data/orders.json` (`journalctl -u mcp-server -f` logs
`🧾 ORDER PAID …`).

## Updating after first deploy

- **Backend code/catalog** (run from your laptop): `./scripts/deploy-mcp.sh`
  — rsyncs `mcp-server/`, pushes only `products.json`, restarts the service, and
  **never** touches runtime data (orders/carts/inquiries).
- **Storefront**: `npm run build`, then copy/rsync `dist/` to the web root and
  reload nginx.

## Editing inventory

The catalog lives in two hand-edited source arrays plus two generated copies:
1. `src/lib/shopifyClient.js` → `getMockProducts()` (frontend source of truth)
2. `scripts/sync-data.js` (a copy of that array)
3. `mcp-server/data/products.json` (generated — MCP/bot backend)
4. `public/data/products.json` (generated — storefront local fallback, fetched by
   `src/lib/mcpApiClient.js`)

Edit (1) and (2) so they match, then run `node scripts/sync-data.js` to regenerate
**both** (3) and (4). Rebuild the frontend and redeploy the server.

Product images live in `public/products/` and are referenced by root-relative path
(e.g. `/products/pyromancer.jpg`); `vite build` copies them into `dist/`.

## Environment variables

| Var | Side | Where | Purpose |
|-----|------|-------|---------|
| `VITE_MCP_TOOLS_URL` | client | `.env.production` | bot/cart endpoint base |
| `VITE_CHECKOUT_URL` | client | `.env.production` | Stripe checkout endpoint |
| `VITE_OLLAMA_URL` / `VITE_MODEL` | client | `.env.production` | support-bot LLM |
| `STRIPE_SECRET_KEY` | server | `/etc/.../env` | create checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | server | `/etc/.../env` | verify webhook signatures |
| `SITE_URL` | server | `/etc/.../env` | post-checkout return URL |

`VITE_*` are public and baked into the JS bundle. Everything without the `VITE_`
prefix is server-only and must never appear in `.env.production` or the bundle.

## Local development

```bash
cp .env.example .env        # fill STRIPE_SECRET_KEY (sk_test_)
npm run dev                 # storefront on :5173 (uses .env, localhost URLs)
cd mcp-server && node server.js --transport=http --port=3001   # backend
```
Webhook locally: `stripe listen --forward-to localhost:3001/webhook`, paste the
printed `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET`, restart the backend.
