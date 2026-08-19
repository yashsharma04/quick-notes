# Deployment Info

## Live app

**URL:** https://typenow-app.pages.dev

Custom domain on this Pages project: `qnote.online` (Cloudflare challenge page as of 19 Aug 2026). Polar webhooks use the `.pages.dev` URL so delivery is not blocked by that challenge.

## Deploy updates

From the repo root so `functions/` is included:

```bash
npx wrangler login   # once, if you are not already logged in
npm run build
npx wrangler pages deploy dist --project-name=typenow-app --commit-dirty=true
```

Polar secrets (`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`) live in the Cloudflare Pages project, not in this file. `POLAR_SERVER=production` is in `wrangler.toml`.

Do not put API tokens in git.

## Cloudflare dashboard

Workers & Pages → typenow-app  
https://dash.cloudflare.com/

---

Last production deploy: 19 Aug 2026 (Buy me a coffee + Polar functions)
