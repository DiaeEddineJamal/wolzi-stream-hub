# Launch splash

Reference: ReactDrops Liquid Glass Logo, using its original WebGL component.
The existing transparent PNG works directly, preserving the A&D MAX lettering and cyan play mark.

Direction: a centered glass reveal on black, followed by the original logo and a 360 ms exit fade.
The existing app supplies the monochrome palette; ReactDrops supplies the droplet, refraction, glass plate, and final-logo sequence.
Motion guidance from the Refero skill supplies reduced-motion handling and an interruptible intro.
Live Refero research was unavailable because its subscription was inactive.

Behavior:
- Each new document (including a mobile PWA launched after being closed) plays the intro.
- Returning after five minutes hidden replays it; short app switches and internal navigation do not.
- visibilitychange, pagehide/pageshow (including back-forward cache), and freeze/resume cover retained documents.
- The app mounts underneath and preserves its route/state on return.
- The animation holds for 2.2 seconds after its renderer is ready, then fades out.
- A five-second renderer-loading timeout, Skip intro, Escape, static WebGL fallback, and animation error boundary prevent lockout.
- Reduced motion uses a static logo for 350 ms and a 100 ms fade.
- Background content is inert and hidden from assistive technology while the splash is active.

The installed web app's OS-managed launch screen remains static; the animation starts once the web document runs.
The five-minute absence threshold is RETURN_AFTER_MS in LaunchSplash.tsx.

Verification:
- Production build, TypeScript compilation, targeted ESLint, and existing npm tests passed.
- Browser screenshots confirmed live WebGL rendering on desktop and a 390 x 844 mobile viewport.
- Simulated short pagehide/pageshow did not replay; advancing the return clock past five minutes replayed and made background content inert.
- Skip intro dismissed and removed inert; reduced-motion emulation avoided the shader and dismissed automatically.
- Screenshots: artifacts/admax-launch-glass-desktop.png and artifacts/admax-launch-glass-mobile.png.
- Physical-device force-close/relaunch still requires device testing; each newly created document starts with the splash by construction.
