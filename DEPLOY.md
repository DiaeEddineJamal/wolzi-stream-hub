# Deploying on Cloudflare Pages + Back4App Containers (free, no card)

The site is split in two:

- **Cloudflare Pages** serves the site (unlimited static bandwidth on the free plan). Its Pages
  Function `functions/api/playback/[[path]].js` forwards `/api/playback/*` to the API.
- **Back4App Containers** (free, no card) runs the playback API (`server/index.ts`) from the
  root `Dockerfile`. It needs a real Node server: the source SDK loads a native TLS library,
  which Cloudflare Workers/Pages Functions cannot run.

The browser only ever talks to the Pages address. Video goes straight from the source to the
viewer; only small responses (source lists, subtitles, playlists) pass through.

## 1. Shared secret

Generate one random value. It goes into both Back4App and Cloudflare:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

## 2. Back4App container (API)

1. Sign up at back4app.com (no card needed) and choose **Containers → New container app**.
2. Connect GitHub and pick `DiaeEddineJamal/wolzi-stream-hub`, branch `main`, root `./`.
3. Plan **Free**. Port **8080**. Health check path `/healthz`.
4. Environment variables: `PROXY_SECRET` (step 1) and `TMDB_API_KEY` (and `WYZIE_API_KEY` if used).
5. Deploy. The API is at the app's `*.b4a.run` address, and `/healthz` should answer `ok`.

Back4App redeploys automatically when `main` changes.

## 3. Cloudflare Pages (site)

Project `a-d-max` (`https://a-d-max.pages.dev`) builds from `main` on every push.
Under **Settings → Variables and secrets** (Production):

- the `VITE_*` variables from `.env` (already set)
- `API_ORIGIN` = the Back4App address from step 2
- `PROXY_SECRET` = the value from step 1, as a secret

Redeploy after changing variables.

## 4. After the first deploy

- **Supabase → Authentication → URL Configuration**: add `https://a-d-max.pages.dev` to the
  Redirect URLs, or sign-up emails will link to the old Vercel address.
- **Optional video relay** (`relay/`): add the `pages.dev` address to `ALLOWED_ORIGINS` in
  `relay/wrangler.toml`, then set `VITE_MEDIA_RELAY_URL` in Pages.

## Free-plan behaviour

- The free container has 0.25 CPU and 256 MB RAM, and 100 GB of transfer a month. Video never
  passes through it.
- Pages Functions: 100,000 requests/day on the free plan. Each title played uses a handful.
