// Media relay for sources that need request headers (Referer, User-Agent…) browsers cannot set.
// Same API as server/media-proxy.ts (/api/playback/media/:name?u=…&h=Name:value), but run on
// Cloudflare Workers so video bytes are not billed as Vercel Fast Origin Transfer.
// Deploy: see relay/README.md. Only pages from ALLOWED_ORIGINS may use it (no open proxy).

const blocked = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'range', 'cookie', 'authorization', 'proxy-authorization', 'forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip', 'via', 'te', 'upgrade', 'expect']);
// Same rule as server/media-proxy.ts: an upstream never chooses a type a browser would render or run.
const safeMediaType = type => {
  const value = type.split(';')[0].trim().toLowerCase();
  return /^(video|audio)\/[\w.+-]+$|^image\/(jpeg|png|webp|gif)$|^text\/(vtt|plain)$|^application\/(vnd\.apple\.mpegurl|x-mpegurl|dash\+xml)$/.test(value) ? value : 'application/octet-stream';
};
const relayGuard = { 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" };

function relayUrl(target, headers) {
  const query = new URLSearchParams({ u: target });
  for (const [name, value] of Object.entries(headers)) query.append('h', name + ':' + value);
  const raw = new URL(target).pathname.split('/').pop()?.replace(/[^\w.-]/g, '') || 'media';
  return '/api/playback/media/' + raw + '?' + query;
}

function rewritePlaylist(text, base, headers) {
  const relayed = uri => relayUrl(new URL(uri, base).href, headers);
  return text.split(/\r?\n/).map(line => {
    const value = line.trim();
    if (!value) return line;
    if (!value.startsWith('#')) return relayed(value);
    return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${relayed(uri)}"`);
  }).join('\n');
}

function allowedOrigin(request, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  // <video> requests carry no Origin header but do carry the page's origin as Referer.
  let origin = request.headers.get('origin');
  if (!origin) try { origin = new URL(request.headers.get('referer') || '').origin; } catch { origin = ''; }
  return allowed.includes(origin) ? origin : null;
}

export default {
  // Cron trigger (every 10 min): keeps the free-tier playback API awake, since it sleeps after 15 idle
  // minutes and a cold start outlasts the site's source search. KEEP_WARM_URL is its /healthz address.
  async scheduled(_controller, env, ctx) {
    if (env.KEEP_WARM_URL) ctx.waitUntil(fetch(env.KEEP_WARM_URL, { signal: AbortSignal.timeout(90000) }).catch(() => {}));
  },
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return new Response('Forbidden', { status: 403 });
    const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, HEAD', 'Access-Control-Allow-Headers': 'Range', 'Access-Control-Max-Age': '86400' } });
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: cors });

    const params = new URL(request.url).searchParams, value = params.get('u');
    let target;
    try { target = new URL(value || ''); } catch { return new Response(null, { status: 400, headers: cors }); }
    if (target.protocol !== 'https:' || target.username || target.password || value.length > 8000) return new Response(null, { status: 400, headers: cors });

    const headers = {};
    for (const entry of params.getAll('h').slice(0, 12)) {
      const at = entry.indexOf(':'), name = entry.slice(0, at).trim();
      if (at > 0 && !blocked.has(name.toLowerCase())) headers[name] = entry.slice(at + 1).trim();
    }
    const range = request.headers.get('range');
    const upstream = { ...headers, ...(range && /^bytes=\d*-\d*$/.test(range) ? { Range: range } : {}) };
    let response = await fetch(target, { method: request.method, headers: upstream, redirect: 'follow' });
    // Some CDNs reject a stale Referer/Origin but serve the file without one.
    if ((response.status === 401 || response.status === 403) && Object.keys(headers).some(name => /^(referer|origin)$/i.test(name))) {
      const minimal = Object.fromEntries(Object.entries(upstream).filter(([name]) => !/^(referer|origin)$/i.test(name)));
      response = await fetch(target, { method: request.method, headers: minimal, redirect: 'follow' });
    }
    if (!response.ok) return new Response(null, { status: response.status >= 400 ? response.status : 502, headers: cors });

    const type = response.headers.get('content-type') || '';
    const out = { ...cors, ...relayGuard, 'Content-Type': safeMediaType(type), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=600' };
    for (const name of ['content-length', 'content-range']) if (response.headers.get(name)) out[name] = response.headers.get(name);
    if (request.method !== 'GET' || !response.body) return new Response(request.method === 'GET' ? response.body : null, { status: response.status, headers: out });
    // Playlists are found by content: some hosts serve them without an .m3u8 extension or an
    // mpegurl content type.
    const reader = response.body.getReader();
    const first = await reader.read();
    const head = first.done ? '' : new TextDecoder().decode(first.value.slice(0, 64)).trimStart();
    if (head.startsWith('#EXTM3U')) {
      const chunks = first.done ? [] : [first.value];
      let size = chunks[0]?.length || 0;
      while (size < 4_000_000) { const part = await reader.read(); if (part.done) break; chunks.push(part.value); size += part.value.length; }
      await reader.cancel();
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const text = new TextDecoder().decode(bytes);
      if (text.trimStart().startsWith('#EXTM3U')) {
        return new Response(rewritePlaylist(text, response.url || target.href, headers), { headers: { ...cors, ...relayGuard, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' } });
      }
      return new Response(bytes, { status: response.status, headers: out });
    }
    // Media: send the peeked chunk, then stream the rest untouched.
    const rest = new ReadableStream({
      start(controller) { if (!first.done) controller.enqueue(first.value); },
      async pull(controller) { const part = await reader.read(); if (part.done) controller.close(); else controller.enqueue(part.value); },
      cancel(reason) { return reader.cancel(reason); },
    });
    return new Response(rest, { status: response.status, headers: out });
  },
};
