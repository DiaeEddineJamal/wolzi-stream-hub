# Mobile player parity

Desktop and mobile watch routes use the same StreamingPlayer, PlayerControls, subtitle search/ranking, caption timing, failure recovery and audio-track hooks. No separate mobile subtitle or dubbing implementation is needed.

Mobile follow-up:
- Touch layout and portal menus now apply on coarse pointers as well as narrow viewports, preserving controls through landscape rotation and on tablets.
- Mobile player menus lock background scrolling and restore it when closed. Sheets remain scrollable and respect safe-area insets.
- Sync buttons and numeric input are 44 CSS pixels tall; the input uses 16 px text to avoid automatic input zoom on mobile Safari.
- Fullscreen supports standard container fullscreen, falls back to native Safari video fullscreen if the container API rejects, and observes native begin/end events.
- HLS uses a 30 s target forward buffer, 60 s upper duration, 10 s back buffer and 24 MB buffer-size target on mobile. HLS can exceed the byte target to satisfy its guaranteed forward-buffer duration. Desktop retains its previous 60 s forward / 30 s back settings.

Verification on October 23, 2026:
- Real multilingual HLS playback at 390 x 844 and 844 x 390 with touch emulation.
- Spanish audio selection retained Arabic captions and paused playback at 6.5 s.
- +1.5 s sync moved fixture cues from 1–3 / 6–8 s to 2.5–4.5 / 7.5–9.5 s.
- Landscape retained touch transport, attached its menu to BODY, and kept menu bounds inside the viewport.
- Computed sync input/button heights were 44 px; closing the menu restored page scrolling without resuming playback.
- Regression checks cover mobile buffer settings and standard/native fullscreen entry, exit and rejection fallback.
- Production build, TypeScript, targeted lint and regression suite passed.

Physical iPhone/Safari native fullscreen and device memory consumption still need device coverage. Emulation verifies responsive browser behavior, not those device-specific implementations.
