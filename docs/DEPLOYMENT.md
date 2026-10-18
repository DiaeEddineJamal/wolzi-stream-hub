# A&D MAX deployment

Vercel project: `a-d-max`, ID `prj_sepMPMz92VDitB4Gxrg8jr5U7b64`, owner `diaeeddinejamals-projects`. Existing project renamed from `wolziflix`. GitHub: `DiaeEddineJamal/wolzi-stream-hub`, production branch `main`.

The Vite build outputs `dist`; SPA rewrites exclude API paths. Node Functions serve source discovery and subtitle conversion. Source results stream progressively and are capped by the existing quick-scan budget. In-process cache is best-effort per warm function instance.

## Environment
- Existing Vercel TMDB catalog variables are retained. The source function uses `TMDB_API_KEY` or `VITE_TMDB_API_KEY`. Never expose server/admin keys through `VITE_` variables.
- Supabase configuration was explicitly deferred by the user. The new project ref is `ixbzfdomobyahxwcsxam`. Existing environment values still reference the previous project; real sign-in/account sync must not be treated as working until updated and verified.
- To complete account setup: inspect the schema first (the SQL may already have been submitted in the dashboard), apply only missing changes from `supabase/migrations/20261018_account_library.sql`, verify owner RLS, replace `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the new URL and public/publishable key, configure Auth site URL and `/auth` redirects for the production domain and local preview, then redeploy. Never put a service-role key in the frontend.
- `VITE_SUPPORT_EMAIL` is optional; no support inbox has been invented.

## Streaming companion
HTTPS direct streams can play without a companion. Torrent streams, custom request headers, and codec conversion require the user to connect an HTTPS Stremio Service permitting this website’s origin. The development `/streaming-service` relay points to this computer and is not published to Vercel. No local machine service is exposed to the Internet.

## Validation
Protocol/progress/player-state/origin-guard tests, application and server TypeScript, targeted lint, and Vite production build are required before publishing. Deployment readiness, canonical URL, deep links, static brand assets and Node endpoints are checked after publishing. Browser checks cover hero crossfade and mobile layout. Live account checks are deferred with Supabase setup.

Generated media, screenshots, local credentials, and editor state stay outside source-control staging; generated brand assets and source/tests/migrations/docs are committed.

## Auth emails
Branded templates live in `supabase/templates/` (`confirmation`, `recovery`, `magic_link`, `email_change`). Paste each into Supabase → Authentication → Email Templates. Supabase → Authentication → URL Configuration must use Site URL `https://a-d-max.vercel.app` with redirect URLs `https://a-d-max.vercel.app/auth**` and `http://127.0.0.1:8080/auth**`; otherwise links fall back to `http://localhost:3000`. A custom sender address requires custom SMTP (Authentication → Emails → SMTP Settings) with a verified sending domain.
