# Subtitle matching and synchronization

The player queries the official OpenSubtitles Stremio endpoint, enabled installed subtitle add-ons, and Wyzie with source=all. Wyzie availability depends on the configured server key and provider health/tier. The unavailable community OpenSubtitles PRO mirror was removed from built-in defaults; explicitly installed add-ons remain user controlled.

Video filename, OpenSubtitles hash and byte size are preserved from stream behaviorHints and passed as Stremio subtitle extras. These hints are part of the query cache key so selecting another file triggers a matching lookup. Release ranking prioritizes source/cut, episode and release group above title-token overlap. Explicitly mismatched episode releases are excluded. Unknown metadata is kept as an alternative, without claiming a verified match.

Native embedded captions take priority within the preferred language. External track ordering follows release rank even after late provider responses. Failed downloads are excluded, disabled and replaced with an available track, honoring explicit Off and the saved language. Native track errors receive a deferred update because browsers can report ERROR after firing the event.

External captions follow HLS presentation offsets for the active fragment, including after seeks and discontinuities. Buffering future fragments does not move current captions. Embedded HLS cues retain their own mapping. Manual offsets remain based on original cue timestamps and are applied once, with exact tenth-second steps and direct numeric entry.

Verification on October 23, 2026:
- OpenSubtitles returned 27 tracks for the test movie; the configured Wyzie query returned 110 tracks.
- One file from each provider passed the site's download/conversion endpoint: HTTP 200 WebVTT with 1,436 and 1,308 cues respectively.
- Browser fixture: +1.5 s moved cues 1–3 s to 2.5–4.5 s and 6–8 s to 7.5–9.5 s; seeking retained those times.
- A broken track transitioned to disabled and a healthy same-language fallback transitioned to showing.
- Regression cases cover video metadata, request extras, cut/group ranking, episode filtering, HLS offsets, empty provider results and upstream rate limits.

Limits: release matching and timeline correction do not analyze speech or guarantee the accuracy of community translations. Alternate edits, missing scenes and frame-rate differences can require another release. No user audio is uploaded. Live checks are samples, not an uptime guarantee.

Protocol references:
- https://stremio.github.io/stremio-addon-sdk/api/responses/stream.html
- https://blog.stremio.com/stremio-add-on-competition-update-guides-subtitles-add-ons/
- https://docs.wyzie.io/subs/usage/direct
