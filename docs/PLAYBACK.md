# A&D MAX playback

## Use locally

1. Run Stremio Service on this computer.
2. Run `npm run dev` (or `npm run build` then `npm run preview`).
3. Open Add-ons, install your trusted HTTPS manifest, and connect `/streaming-service`.
4. Select a source beside the player. On phones, Change source opens a searchable bottom sheet and closes it on selection.

Native HTTPS media plays directly in a single video element. Torrent hashes and custom-header sources resolve through Stremio Service. Incompatible formats use its H.264/AAC stereo HLS conversion; decoding errors also try conversion. The settings menu includes Convert for this browser. hls.js supplies adaptive quality and available audio/subtitle tracks. Quality choices reflect the source, rather than inventing resolutions.

Custom controls include play/pause, seek and buffered progress, ten-second skips, volume, playback speed, picture-in-picture where supported, fullscreen transitions, and optional next-episode autoplay with a five-second countdown. The preparation indicator is centered in place of the large play button until ready. The bottom play control stays available. Embedded third-party players and the application's AdSense startup have been removed from routed playback, so clicking play cannot launch a provider's popup script. An unsupported external provider opens only through an explicit external link.

The next-episode preview appears at 20 seconds remaining, with episode artwork (or title-art fallback), a glass surface, dismiss and Play now actions. The watch page shares the main navigation, artwork ambience, and footer; settings and source actions have been removed from its navbar. The quality menu uses real HLS levels, or reports the single original resolution for a direct file. Alternate direct-file qualities are selected through Sources.

## Source discovery

The local Node backend uses Vyla SDK 1.17.0 to check its 40 active providers with eight workers, a 16-second quick-scan budget, short per-result waits, and cached/shared requests. Results arrive progressively through `/api/playback/sources`; installed Stremio add-ons run alongside discovery. Verification rejects HTML/error pages and checks HLS playlists through the first media segment. A reachable link is not a guarantee of full playback: only the browser's canplay event marks it ready. Failed or stalled choices advance to another source, while a manual selection or an already playing source is preserved.

Public HTTPS destinations and redirects are validated, including DNS/private-address checks. Vyla is licensed CC-BY-NC 4.0; commercial use requires appropriate permission. See THIRD_PARTY_NOTICES.md. Source availability, upstream limits, and torrent peers can still interrupt playback.

## Subtitles

Native text tracks, embedded tracks exposed by the service/HLS manifest, installed subtitle add-ons, OpenSubtitles PRO, and official OpenSubtitles v3 are supported. The language menu includes filtering, Off, and local SRT/WebVTT/ASS file upload. `/api/playback/subtitles` validates remote destinations and converts supported text captions to WebVTT with a 2 MB limit. ASS text is supported; advanced ASS typesetting is not reproduced. Captions move above visible controls while preserving explicitly positioned cues.

Customize subtitles provides size (75–200%), color presets and a color picker, top/middle/bottom positions, and synchronization from -30 to +30 seconds in half-second steps. Positive delay shows text later. Preferences are validated and stored on the device; cue timing is derived from original timestamps to avoid cumulative shifts. Browser checks exercised size, gold text, position selection, and a +1.0-second delay; the native cue reported start=1 and end=53 for an original 0–52-second caption.

Selection enforces one caption language at a time, including after HLS adds tracks. Off disables every caption track while leaving metadata tracks alone. The regression was observed during playback with two OpenSubtitles languages showing; after the fix, only the selected English track remained active.

PRO's tested endpoint returned HTTP 500, so the independent official v3 fallback is enabled. For the tested Interstellar ID, v3 returned 98 subtitle choices and a selected subtitle was successfully fetched as WebVTT. Provider failures are reported in the subtitle menu.

The local relay is limited to localhost and rejects cross-site browser requests. It preserves byte ranges and streams media without buffering it into the frontend. `STREMIO_SERVICE_URL` selects a different upstream when starting Vite; it defaults to `http://127.0.0.1:11470`. HTTPS services that permit this website's origin can also be connected directly.

## Deployment boundary

Vite registers the source resolver, subtitle converter, and streaming relay in dev and preview. The Vercel deployment includes Node Functions for `/api/playback/sources` and `/api/playback/subtitles`, with same-origin browser guards and a 30-second execution limit. Torrent/proxy/codec conversion still needs a separately connected CORS-enabled HTTPS Stremio Service. Vercel does not host the local companion or FFmpeg torrent engine. Use authentication and private networking appropriate to that deployment. Do not expose this computer's Stremio Service publicly. See DEPLOYMENT.md for the production target and remaining setup.

## Verified on this computer, 2026-10-18

- Installed Stremio Service 4.21.0 answered settings but its bundled ffprobe could not start: exit 3221225781. Its FFmpeg 4 DLL dependencies were missing.
- Original `ffmpeg.exe` and `ffprobe.exe` were backed up to `C:\Users\PC\.codex\backups\stremio-media-20261018`.
- Replaced those two binaries in `C:\Users\PC\AppData\Local\Programs\StremioService` with the static Gyan FFmpeg 8.1.2 essentials build. The vendor is linked by https://ffmpeg.org/download.html.
- Download source: https://github.com/GyanD/codexffmpeg/releases/download/8.1.2/ffmpeg-8.1.2-essentials_build.zip
- SHA256 verified against the vendor publication and GitHub asset digest: `db580001caa24ac104c8cb856cd113a87b0a443f7bdf47d8c12b1d740584a2ec`.
- The service returned HTTP 200 for HLS master, audio/video playlists, initialization fragments, and first audio/video segments using the public Sintel trailer hosted by W3C.
- Native browser play, seek, pause and resume progress were exercised with that trailer. The browser also played the service-converted HLS stream to its end (53.248 seconds, readyState 4, no media error). These checks do not establish the availability of every add-on or torrent.
- The installed add-on returned 133 streams for a tested title. The desktop list stayed within a bounded scroll area. At 390 × 844, its bottom sheet had no horizontal overflow; choosing a source closed it and left the page at scroll position 0. Quality filters and immediate selection were exercised.
- Actual Torrentio playback of Hope subsequently ran past ten minutes with readyState 4 and no media error. A separate Creative Commons Sintel torrent range request had timed out after 50 seconds, illustrating that individual torrents remain network-dependent.
- An initial 40-provider scan completed in 13.47 seconds: 15 reachable, 18 unavailable, seven timed out. Verification was then tightened to follow HLS variants through the first segment; these counts are a snapshot, not a permanent reliability ranking.
- `tests/format-compatibility.ps1` generated 12-second fixtures and checked converted video/audio segments for MKV (HEVC/AC3), AVI (MPEG-4/MP3), WMV (WMV2/WMA2), MOV (ProRes/PCM), and WebM (VP9/Opus). All five passed; the MKV also produced an embedded subtitle VTT segment. Results: `artifacts/format-compatibility.json`. This does not imply VLC-level support for every codec, transport, or DRM scheme.
- The custom browser fixture exercised rapid seeking, play/pause, mute, speed changes, native uploaded captions above the toolbar, and fullscreen enter/exit. Browser captures are in `artifacts/`.
- The updated HLS fixture also played through to 53.248 seconds after parent state updates, with readyState 4. The 20-second preview threshold is asserted in `npm test` and was exercised in the browser (hidden with 22 seconds remaining, visible with 19 seconds remaining).

To undo the local binary repair, stop playback, copy the two backed-up binaries back into the StremioService installation directory, then restart Stremio Service. The original missing-DLL problem will return unless its dependencies are restored separately. This machine repair is separate from repository changes.

## Protocol checks

The next-episode glass card appears with 20 seconds remaining. Its progress bar fills through the episode ending and, when autoplay is enabled, the existing five-second post-roll countdown. Dismissal cancels automatic advance; replaying resets the countdown. The browser fixture verified the bar at 31%, 80% at the ending, and one automatic advance to clip 2.

`npm test` covers manifest parsing, configured base paths, resource/type/id-prefix matching, episode URLs, disabled add-ons, failures, cancellation, unsafe URLs, torrent service conversion, HLS URLs, proxy headers, media validation, subtitle text conversion, responsive artwork, and palette extraction. `tests/player.html` is a local development fixture using public test media, excluded from the production entry.

Final checks include app/Node TypeScript, targeted ESLint, and a production build. Build warnings remain for large application/HLS chunks and an old Browserslist data snapshot. The dependency audit reports 45 advisories (including two critical); dependency-wide remediation and authenticated account flows were outside this playback/design verification.

Architecture references:
- https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/protocol.md
- https://github.com/Stremio/stremio-core/blob/development/src/types/resource/stream.rs
- https://github.com/Stremio/stremio-video/blob/master/src/withStreamingServer/withStreamingServer.js
- https://blog.stremio.com/using-stremio-service/
- https://github.com/webtorrent/webtorrent/blob/master/docs/free-torrents.md
