# FMHY source research — 2026-11-14

Starting point: [FMHY Movies / TV / Anime](https://fmhy.net/video). Its aggregator, dedicated-server and multi-server sections describe different kinds of viewing sites; a listing alone does not establish a reusable API or working playback.

## Findings

| Site inspected | Evidence | Integration decision |
| --- | --- | --- |
| [Movy](https://www.movy.sx/) | Footer links to [Vidy's embed documentation](https://www.vidy.st/). | Refresh the existing Movy and Vidy adapters. Updated Movy metadata uses `www.movy.sx`, replacing the older `www.movy.bz` origin. |
| [1Shows](https://www.1shows.org/) | Public frontend chunks reference VidFast, VidLink, Viduki, Vidy, VidZee and VidRock. These references identify configured providers, not a guarantee of traffic to every server for every title. | Existing adapters cover five of these; preserve VidRock, which the newer SDK removed. Viduki has no adapter in either pinned release. |
| [AniCine](https://anicine.sbs/watch/movie/157336) | Its public watch-page chunk references Vidly, VidBolt, VidStuck, Vumeto, VidMario, Vidrift, Filmu, VAPlayer, ZXCStream and CinemaOS. | Add the maintained Vidly and VidBolt adapters through the SDK refresh. Other referenced players remain research candidates. |
| [Cinejoy](https://cinejoy.pk/) | Accessible frontend, but neither pinned SDK release includes a Cinejoy adapter. | No new adapter implemented. |
| [PopcornMovies](https://popcornmovies.st/) | Research fetch returned HTTP 403. | No integration inferred from the blocked page. |
| [7Movies](https://7movies.ac/) | Viewing-site catalog was readable; a reusable direct-media API was not established. | No new adapter implemented. |

The SDK refresh also adds FMHY-listed sites including Hexa, MeowTV, Cno, Aether, Willow, ChillFlix, TaroFlix, FrameXTV, 4Movie, and YouPlex. Not every additional SDK provider was individually researched on FMHY or verified for playback.

## Implementation

`@vyla-entertainment/sdk` is pinned to 1.29.0. `vyla-sdk-legacy` aliases 1.17.0. `server/provider-catalog.ts` merges their catalogs by provider key, choosing current adapters first and retaining the 13 removed providers from the older release. Both SDK instances receive the application's TMDB key. Movie requests and TV season/episode coordinates go to the SDK that owns each adapter.

The catalog grows from 40 to 78 unique adapters. Existing stream verification, request-header handling, native playback, source filters, SSE responses, and unavailable/timeout states remain in use. The inspected providers receive early slots in the bounded scan.

New adapter keys: `4movies`, `aether`, `allaboutmovies`, `anizone`, `anv`, `braflix`, `castle`, `chillflix`, `cinebros`, `cinesrc`, `cno`, `fmovies4u`, `framextv`, `frost`, `hdhub`, `hexa`, `kickassanime`, `hyper`, `meowtv`, `moviebox`, `movienerds`, `net79`, `netplayz`, `streamrip`, `taroflix`, `torrentio`, `trendimovies`, `vidbolt`, `vidflix`, `vidlux`, `vidly`, `vidora`, `vidspark`, `watchout`, `willow`, `yapgrid`, `yastream`, `youplex`.

Retained older keys: `anihq-sub`, `anihq-dub`, `anineko-sub`, `anineko-dub`, `bcine`, `dulo`, `movienight`, `peestream`, `vidgod`, `vidnest`, `vidnest-sub`, `vidnest-dub`, `vidrock`. Retention preserves an adapter, not a claim that its upstream currently works.

## Verification

The tested flow is watch page → `/api/playback/sources` → merged SDK adapters → media verification → native player/source list. Tests ran against local Vite on port 8081.

- The browser rendered 78 servers and selectable results from new providers, including VidBolt, Vidly, Hexa, MeowTV and Willow.
- VidBolt / Orion / 1080p played in the native player: current time 28.877 seconds, `readyState=4`, `paused=false`, no media error. This verifies a short playback sample, not an entire film.
- Movie `157336` and TV `1396`, season 1, episode 1 returned HTTP 200, 78 provider results and a final SSE `done`. Each returned 66 verified media links from 31 providers. The movie scan reported 45 unavailable providers and two timeouts; the episode scan reported 41 unavailable and six timeouts. The movie request reused the browser scan's cache; the episode scan completed in 28.021 seconds. Counts are time-specific network snapshots, not reliability rankings.
- Local sanitized scan receipts: `artifacts/fmhy-movie-scan.json` and `artifacts/fmhy-tv-scan.json` (ignored by Git; media URLs and credentials omitted).
- `npm test` passes, including provider deduplication, current-versus-legacy routing, episode coordinates, updated Movy headers, and preservation of all previous keys.
- Frontend TypeScript, strict TypeScript for the changed backend modules, targeted ESLint, frontend production build and standalone server build pass. Build warnings concern old Browserslist data and large bundles.
- The repository-wide Node TypeScript check reports errors in unchanged `server/edge.ts`, `src/integrations/api/stremio.ts`, and `src/lib/subtitles.ts`: missing DOM/cache types, unresolved `@/lib/subtitles`, and a possibly undefined `videoSize`.

No deployment was performed. SDK licensing remains CC BY-NC 4.0; see `THIRD_PARTY_NOTICES.md`.
