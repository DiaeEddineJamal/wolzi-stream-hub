# A&D MAX redesign

## Reference lock
Apple TV is the primary direction: artwork leads, navigation recedes, white play actions, quiet surfaces. A&D MAX uses the requested neutral #161616 base with pearl #f5f5f7 controls. Color comes from the actual title artwork. Poster grids complement landscape discovery rails. Motion respects reduced-motion preferences.

## Research
- Apple TV: https://tv.apple.com/
- Apple, Playing video: https://developer.apple.com/design/human-interface-guidelines/playing-video (familiar controls, aspect ratio, keyboard, subtitles).
- Steve Krug, Don't Make Me Think: https://sensible.com/dont-make-me-think/ (clear navigation and visible actions).
- Don Norman, The Design of Everyday Things: https://www.hachettebookgroup.com/titles/don-norman/the-design-of-everyday-things/9780465050659/ (feedback and discoverability).
- Nielsen Norman Group, Video Usability: https://www.nngroup.com/articles/video-usability/ (viewer control, no surprising autoplay).
- Nielsen Norman Group, Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/ (visible status and recovery).
- Stremio Web architecture: https://github.com/Stremio/stremio-web
- Stremio protocol: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/protocol.md
- Stream capabilities: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/stream.md
- FMHY video directory reviewed: https://fmhy.net/video. Provider names are discovery leads; availability is checked against actual media. Direct streams and compatible add-ons feed the player.
- React Bits GlassSurface: https://reactbits.dev/components/glass-surface (floating navigation with SVG refraction and a blur fallback).
- React Bits Particles: https://reactbits.dev/backgrounds/particles (sign-in background, lazy loaded with a capped pixel ratio).

## Component sources
Obsidian UI supplies the shared button styling; Rare UI supplies the inline confirmation delete control used to uninstall add-ons. Beautiful UI supplies the loading-state pattern. Local adaptations retain accessible controls, the installed Radix/Framer Motion stack, and the A&D MAX palette. See THIRD_PARTY_NOTICES.md.

## Scope
Navigation and mobile dock, footer, hero, cards and rails, home, movies/series/anime, detail and episodes, search and results, library/history, add-ons, playback, shared controls, account/auth and information/legal page presentation, metadata and brand assets. Account list/history sync is implemented with owner-scoped queries, optimistic list updates, local progress fallback, and a fresh-project schema. The user deferred live Supabase setup; signed-in sync is not verified. Legal information uses app-specific text and links to Stremio’s separate service terms.

## Playback boundaries
The single native video element uses custom controls and lazy-loaded hls.js for adaptive streams. There are no third-party player frames or ad scripts in routed playback. Torrent and custom-header sources resolve through Stremio Service; incompatible codecs use its H.264/AAC HLS conversion. A bounded, searchable source panel shows progressive checks and playback failures. See PLAYBACK.md for setup, subtitle support, deployment requirements, and verification.

## Artwork and motion

The supplied references guide the floating glass dock, full-bleed hero with poster and title artwork, seamless artwork-colored background, and centered spotlight with peeking neighbors. Detail pages extract a restrained palette from their own artwork. Responsive TMDB image sets provide larger hero/backdrop assets and smaller card assets; below-the-fold images load lazily. Cards expand to landscape on hover or keyboard focus. Touch and reduced-motion modes retain accessible actions without requiring hover.

Discover, Movies, Series, and Anime share the hero/carousel structure. The wide glass navbar contains the brand, categories, search, and sign-in; the watch page uses the same navbar. Mobile uses a floating five-item glass dock. A single blurred artwork layer sits behind the upper and middle page and fades into #161616 before the transparent footer. Trailer, episode, and related rails share one gutter and scroll-snap inset.

Mouse dragging scrolls card rails and changes hero/spotlight slides without triggering links. The hero rotates every ten seconds, pauses for keyboard focus, and includes a pause button; reduced-motion and hidden documents stop automatic changes. Ten seconds is this product's chosen interval, not a claim about Netflix's or Apple's internal timings.

The navbar uses full-width SVG glass refraction with a translucent tint, 64px desktop/56px mobile height, subtle hover highlights, and a darker selected badge. Desktop navigation stays visible; mobile navigation responds to scroll direction. Focus, search, and an open menu keep it available. Hero images decode before switching; artwork, page ambience, and slide copy crossfade together, with restrained drag movement. The shared progressive image mask removes the hero boundary; detail artwork begins fading higher.

## Generated brand asset
`public/brand/admax-logo.png` was generated with imagegen: a premium transparent horizontal A&D MAX wordmark, intertwined monogram with play-shaped negative space, white lettering and an ice-blue accent. The favicon is a matching lightweight SVG. Cards use existing catalog artwork, with landscape artwork revealed during desktop hover or keyboard focus; reduced-motion and touch layouts retain immediate actions.

## Final refinements
The actual generated logo is used in the shared Brand component. Hero transitions retain the outgoing keyed image node at full opacity until the decoded incoming image finishes fading, including reverse/drag transitions. The preparation indicator replaces the central play button while loading; the bottom play control remains available for browser gestures. Rare UI Hook Sidebar replaces the legal contents card on Privacy, Terms, and Legal, with section anchors, scroll tracking, keyboard focus, reduced motion, and a card-free neutral rail.

The sign-in form is centered. Catalog hover rows use the same expansion layout as home. Continue Watching follows Everyone’s Watching and uses the latest episode and resume position. Footer bounds no longer include a decorative off-page layer. Native trailers use the official YouTube embed within the website.
