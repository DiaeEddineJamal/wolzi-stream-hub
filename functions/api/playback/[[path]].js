// Cloudflare Pages: forwards /api/playback/* to the playback API on Back4App (server/index.ts),
// so the browser keeps calling its own origin. Video is never relayed (MEDIA_RELAY_BYTES=0 in
// the Dockerfile): only small responses and redirects pass through here.
// Pages env vars: API_ORIGIN (e.g. https://<app>.b4a.run) and PROXY_SECRET.
export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 });
  if (request.headers.get('sec-fetch-site') === 'cross-site') return new Response('Forbidden', { status: 403 });
  if (!env.API_ORIGIN || !env.PROXY_SECRET) return new Response('Playback API is not configured.', { status: 503 });
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.set('x-proxy-secret', env.PROXY_SECRET);
  headers.set('x-site-host', url.host);
  // The API rate-limits per viewer; a client-supplied value is always overwritten here.
  headers.set('x-client-ip', request.headers.get('cf-connecting-ip') || '');
  let response;
  try {
    response = await fetch(new URL(url.pathname + url.search, env.API_ORIGIN), { method: request.method, headers, redirect: 'manual' });
  } catch {
    // API asleep or unreachable: a clean 503 the player already retries on, not a Cloudflare error page.
    return new Response('Playback API is unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
  }
  // Pass redirects (direct-to-source video) and streams (source search events) through unchanged.
  return new Response(response.body, response);
}
