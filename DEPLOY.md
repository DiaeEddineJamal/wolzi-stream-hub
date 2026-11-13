# Deploying on Cloudflare Pages + Render (free)

The site is split in two:

- **Cloudflare Pages** serves the site (unlimited static bandwidth on the free plan). Its Pages
  Function `functions/api/playback/[[path]].js` forwards `/api/playback/*` to the API.
- **Render** runs the playback API (`server/index.ts`) as a normal Node server.

The browser only ever talks to the Pages address. Video goes straight from the source to the
viewer; only small responses (source lists, subtitles, playlists) pass through.

## 1. Render (API)

1. Sign in at render.com with GitHub and choose **New → Blueprint**.
2. Pick the `wolzi-stream-hub` repo. Render reads `render.yaml` and creates `a-d-max-api`.
3. When asked, enter `TMDB_API_KEY` (and `WYZIE_API_KEY` if you use it).
4. After the first deploy, open the service and note:
   - its URL, e.g. `https://a-d-max-api.onrender.com`
   - **Environment → PROXY_SECRET** (generated): copy the value.

Check it works: `https://<your-service>.onrender.com/healthz` should answer `ok`.

## 2. Cloudflare Pages (site)

1. Sign in at dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `wolzi-stream-hub` repo, branch `main`.
3. Build settings: framework **None** (or Vite), build command `npm run build`, output `dist`.
4. **Environment variables** (Production):
   - every `VITE_*` variable from your local `.env` (Supabase, TMDB, …)
   - `API_ORIGIN` = the Render URL from step 1
   - `PROXY_SECRET` = the value copied from Render (mark it as a secret)
5. Deploy. The site will be at `https://<project>.pages.dev`.

## 3. After the first deploy

- **Supabase → Authentication → URL Configuration**: add the `pages.dev` address (and any custom
  domain) to Site URL / Redirect URLs, or sign-up emails will link to the old Vercel address.
- **Optional video relay** (`relay/`): add the `pages.dev` address to `ALLOWED_ORIGINS` in
  `relay/wrangler.toml`, then set `VITE_MEDIA_RELAY_URL` in Pages.
- Set `VITE_SITE_URL` in Pages if you use it for SEO links.

## Free-plan behaviour

- Render's free service sleeps after ~15 minutes without traffic. The first source search after
  that waits 30–60 seconds while it wakes up.
- Pages Functions: 100,000 requests/day on the free plan. Each title played uses a handful.
