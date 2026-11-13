# Media relay (Cloudflare Worker)

Some sources only serve video when the request carries headers a browser cannot set
(a provider `Referer`, a `User-Agent`). Those bytes have to pass through a relay.

On Vercel, every byte a function returns counts as **Fast Origin Transfer**. The Hobby plan
allows 10 GB per 30 days, which is only a few films. So the Vercel function
(`server/media-proxy.ts`) no longer relays video bytes. It still relays playlists and
encryption keys, which are kilobytes. It sends video direct to the source when the browser can
fetch it. When the browser can't, it fails fast so the player moves to the next source.

To keep header-dependent sources playable, run this Worker and point the site at it.

## Deploy

```bash
cd relay
npx wrangler login
npx wrangler deploy
```

Edit `ALLOWED_ORIGINS` in `wrangler.toml` first if the site has a custom domain.

Then in Vercel → Project → Settings → Environment Variables, set:

```
VITE_MEDIA_RELAY_URL=https://a-d-max-relay.<your-subdomain>.workers.dev
```

and redeploy (Vite bakes the value in at build time).

## Limits

- Workers Free: 100,000 requests/day. Each HLS segment is one request, so a two-hour film is
  about 1,000 to 1,500 requests.
- Check Cloudflare's current terms on video traffic before sending heavy use through it.
- Without `VITE_MEDIA_RELAY_URL`, the site still works. Only sources that need the relay are
  skipped.

## Local dev

`npm run dev` relays everything itself, as before. Set `MEDIA_RELAY_BYTES=0` to reproduce the
Vercel behaviour, or `MEDIA_RELAY_BYTES=1` on Vercel to turn byte relaying back on.
