# Polar setup

This app is a Vite + React SPA on Cloudflare Pages. Polar checkout and webhooks run as **Pages Functions** (Cloudflare Workers) in production, and as Vite middleware during `npm run dev`.

Organization: `typenow` (`051ee727-7d4e-4560-b688-ca953165654a`)  
Environment: **production** (`https://api.polar.sh`)  
Dashboard: https://polar.sh/dashboard/typenow

This integration talks to Polar **production**. Test with a 100% discount (see below), not a live card, unless you intend to charge.

## Files created / changed

- `src/polar/client.js` — shared Polar SDK client (`POLAR_SERVER` selects sandbox vs production)
- `src/polar/checkout.js` — `GET /checkout?products=<id>` → Polar hosted checkout
- `src/polar/webhook.js` — `POST /api/webhook/polar` signature verify + event stubs
- `src/polar/checkout.test.js`, `src/polar/webhook.test.js`
- `functions/checkout.js` — Cloudflare Pages Function for `/checkout`
- `functions/api/webhook/polar.js` — Cloudflare Pages Function for `/api/webhook/polar`
- `vite-plugin-polar.js` — same routes on the Vite dev server
- `vite.config.js` — registers the Polar dev plugin
- `wrangler.toml` — Pages build output + `nodejs_compat` + `POLAR_SERVER`
- `package.json` — `@polar-sh/sdk`, `npm test`
- `.gitignore` — `.env`, `.dev.vars`
- `.env` — local secrets (not committed)

No customer portal route was added. Polar hosts the customer portal and emails customers the link.

## Env keys (names only)

| Key | Where | Purpose |
| --- | --- | --- |
| `POLAR_ACCESS_TOKEN` | `.env`, Cloudflare Pages secrets | Organization access token |
| `POLAR_WEBHOOK_SECRET` | `.env`, Cloudflare Pages secrets | Signing secret from Polar (generated when the endpoint is created) |
| `POLAR_SERVER` | `.env`, `wrangler.toml` `[vars]` | `production` or `sandbox` |

You do **not** invent `POLAR_WEBHOOK_SECRET`. Polar returns it when a webhook endpoint is created. It is still empty locally because the endpoint has not been registered yet (functions are not live on the public site).

After deploy, set the same names in Cloudflare: **Workers & Pages → typenow-app → Settings → Environment variables**.

Token scopes used so far: `products`, `checkouts`, `webhooks` (read and write).

## Provisioned Polar resources

| Resource | ID |
| --- | --- |
| Buy me a coffee (pay-what-you-want, preset $5, min $1) | `0bb40a74-b16e-43b4-8d3e-d75760e1856b` |
| Test Product (one-time $10 USD) | `e8eeeb0f-98ac-4691-b0ad-451f28ba9aa5` |
| Webhook endpoint | `0c624257-3af6-4be6-b2fc-b21f414e9747` → `https://typenow-app.pages.dev/api/webhook/polar` (`order.paid`, `customer.state_changed`) |

Production secrets `POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET` are set on the Cloudflare Pages project `typenow-app`. `POLAR_SERVER=production` comes from `wrangler.toml`. Do not commit `.env`.

The sidebar **Buy me a coffee** link uses the coffee product via `/checkout?products=0bb40a74-b16e-43b4-8d3e-d75760e1856b`. Polar hosts the checkout page. This app does not render a custom payment form.

## Local checkout

```bash
npm install
npm run dev
```

Open the sidebar **Buy me a coffee** link, or:

http://localhost:5173/checkout?products=0bb40a74-b16e-43b4-8d3e-d75760e1856b

Polar shows its own confirmation page after payment. This app does not set a success URL.

### 100% test discount

The current access token does not include `discounts:write` (`403 insufficient_scope`). Create a one-time **100%** code in the dashboard (https://polar.sh/dashboard/typenow) named e.g. `TESTFREE`, and enter it on Polar checkout. A plain checkout link cannot pre-apply it.

Alternatively, add `discounts` read/write to the token and we can create the code via API.

## Webhooks

Route: `POST /api/webhook/polar`

Handled with TODO stubs only:

- `order.paid`
- `customer.state_changed`

Signature is verified with `validateEvent` from `@polar-sh/sdk/webhooks` before any handling.

Live endpoint: `POST https://typenow-app.pages.dev/api/webhook/polar`  
Polar webhook id: `0c624257-3af6-4be6-b2fc-b21f414e9747`  
Unsigned posts return `403 {"received":false}` (signature check is active).

## Verify before merging

- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `.env` / `.dev.vars` are not committed
- [ ] Local `/checkout?products=e8eeeb0f-98ac-4691-b0ad-451f28ba9aa5` redirects to Polar
- [x] Cloudflare Pages has `POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET`; `POLAR_SERVER=production` via `wrangler.toml`
- [x] Deploy includes the `functions/` directory (`https://typenow-app.pages.dev/checkout` → Polar)
- [x] Webhook endpoint exists in Polar and `POLAR_WEBHOOK_SECRET` is set in Cloudflare (not in git)
- [ ] No customer-portal app route was added (Polar already hosts it)

## Production reminder

This talks to Polar **production**, not sandbox. Sandbox and production tokens are separate.
