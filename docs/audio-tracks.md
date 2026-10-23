# Audio language switching

The Audio & Subtitles menu lists audio tracks exposed by the active HLS manifest or the browser's native AudioTrackList. The list refreshes on HLS audio-track discovery/switch events and native addtrack, removetrack, change and media metadata events. Selection invokes hls.js audioTrack or native enabled flags without replacing the video source or changing subtitle selection.

Language labels include Original or Dub when the title's original language is known. Commentary and audio description names retain their own labels. Missing language metadata is shown as a numbered track rather than an invented language. HLS automatic stream names are replaced with language and stereo/surround descriptions. Sources/browsers that do not expose alternatives receive an explicit availability message.

Native switching enables the requested track before disabling the others and restores the previous selection when a switch fails. The playback intent now clears on pause, preventing canplay events during an audio change/seek from resuming paused playback.

Verification on October 23, 2026:
- Shaka's public Angel One HLS sample exposed six renditions: English stereo, German, Italian, French, Spanish, and English 5.1.
- Selecting Spanish requested its playlist, initialization file and audio segments.
- Switching audio retained the selected Arabic subtitle fixture.
- A paused position of 12 seconds remained paused at 12 seconds after switching to Spanish and back to original English, including the mobile menu at 390 x 844.
- Unit checks cover language labels, original/dub labels, commentary, unknown languages, stereo/surround distinction, exclusive native selection, invalid track indexes and failed native switches.
- Production build, TypeScript and targeted lint passed.

Limit: a dub must exist in the chosen stream and be exposed by HLS or the browser. This feature does not generate dubs or reveal tracks removed by an upstream conversion. Native browser API behavior requires physical Safari/iOS coverage in addition to the tested HLS browser path.

References:
- https://hlsjs.video-dev.org/api-docs/hls.js.events
- https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8
