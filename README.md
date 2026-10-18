# A&D MAX

A React streaming catalog for movies, series, and anime, with artwork-driven pages, glass navigation, personal lists, compatible Stremio add-ons, and a custom native video player.

## Run locally

Use Node.js 22, then run `npm ci` and `npm run dev`. The preview listens at `http://127.0.0.1:8080`.

Create an ignored `.env` with your own public application values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
VITE_TMDB_API_KEY=YOUR_TMDB_KEY
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
VITE_JIKAN_BASE_URL=https://api.jikan.moe/v4
```

Never put Supabase service-role keys or admin credentials in `VITE_` variables. Supabase setup for the replacement project is pending; see [deployment setup](docs/DEPLOYMENT.md).

## Playback

HTTPS direct media and adaptive HLS play in the browser. Compatible add-ons provide catalogs, streams, and subtitles. Source discovery and remote subtitle conversion run in Node endpoints. Streams that need request headers play through the built-in same-origin relay `/api/playback/media` (rewrites HLS playlists, 4 MB range chunks). Torrent streams and incompatible-codec conversion require a connected Stremio Service; a static website cannot run the desktop torrent/FFmpeg engine. See [playback documentation](docs/PLAYBACK.md).

The routed native player does not load third-party advertising frames. Trailers use the official YouTube embed within the site. Only access content for which you have the necessary permissions.

## Checks and deployment

```sh
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit
npm run build
```

Vercel project `a-d-max` deploys branch `main`, using the Vite output and Node Functions defined in `vercel.json`. [Deployment details](docs/DEPLOYMENT.md) explain environment variables and the optional streaming companion. Local player fixtures in `tests/` are excluded from the production Vite entry.

## Design and credits

See [design notes](docs/DESIGN.md) and [third-party notices](THIRD_PARTY_NOTICES.md). UI adaptations include [Rare UI](https://rareui.com), Obsidian UI, Beautiful UI, and React Bits, using the installed React, Radix, and Framer Motion stack. Vyla SDK is CC-BY-NC 4.0; commercial use requires the appropriate permission.
