# Subtitle providers and synchronization

OpenSubtitles is included by default through the official Stremio v3 endpoint. Enabled subtitle add-ons and stream-provided tracks are also available natively. Provider results appear independently, so one slow provider does not hold the others back.

For additional independent sources, set WYZIE_API_KEY in the server environment and restart the development server (or redeploy). No VITE_ prefix: the key must remain server-side. The /api/playback/subtitle-search endpoint queries all sources available to the key and returns scoped download URLs, converted to VTT. See https://docs.wyzie.io/subs/usage/api-keys and https://docs.wyzie.io/subs/usage/direct. Without a key this integration returns no additional tracks; existing providers still work.

Captions use the browser media clock and original subtitle timestamps at zero offset. Manual 0.1-second corrections are saved per video, source and track instead of carrying a global delay into unrelated videos. For release mismatches (different edits, intros, frame rates), select another release or adjust sync. Automatic dialogue alignment now runs in Chromium browsers (see docs/subtitles.md); elsewhere use Sync by ear or the G / H keys.

The OpenSubtitles.org legacy API has been shut down; do not add the retired XML-RPC API. See https://forum.opensubtitles.org/viewtopic.php?t=19471 and the official provider list https://github.com/Stremio/stremio-official-addons/blob/master/index.json.
