import { z } from 'zod';
const resourceSchema = z.union([z.string(), z.object({ name: z.string(), types: z.array(z.string()).optional(), idPrefixes: z.array(z.string()).optional() })]);
export const manifestSchema = z.object({
  id: z.string().min(1).max(160), name: z.string().min(1).max(160), version: z.string().min(1),
  description: z.string().optional(), types: z.array(z.string()), resources: z.array(resourceSchema),
  catalogs: z.array(z.object({ type: z.string(), id: z.string(), name: z.string().optional(), extra: z.array(z.object({ name: z.string(), isRequired: z.boolean().optional() })).optional() })).default([]),
  idPrefixes: z.array(z.string()).optional(),
});
export type AddonManifest = z.infer<typeof manifestSchema>;
export interface InstalledAddon { manifest: AddonManifest; transportUrl: string; enabled: boolean }
export const streamSchema = z.object({
  url: z.string().optional(), externalUrl: z.string().optional(), ytId: z.string().optional(),
  infoHash: z.string().optional(), fileIdx: z.number().int().min(0).optional(), sources: z.array(z.string()).optional(), name: z.string().optional(),
  title: z.string().optional(), description: z.string().optional(),
  subtitles: z.array(z.object({ id: z.string().optional(), url: z.string(), lang: z.string() })).optional(),
  behaviorHints: z.object({ notWebReady: z.boolean().optional(), proxyHeaders: z.object({request:z.record(z.string()).optional(),response:z.record(z.string()).optional()}).optional() }).optional(),
}).passthrough();
export type AddonStream = z.infer<typeof streamSchema>;
export interface StreamChoice { id: string; name: string; description?: string; url?: string; externalUrl?: string; kind: 'video' | 'embed' | 'external' | 'unsupported'; reason?: string; service?: string; needsConversion?: boolean; availability?: 'checking'|'reachable'|'ready'|'failed'|'timeout'; provider?: string; subtitles?: { url: string; lang: string }[] }
export function httpsUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS URL without embedded credentials.');
  return url.href;
}
export function isNativeVideoUrl(value:string){
  if(/^\/(streaming-service|hlsv2|api\/playback\/media)\//.test(value))return true;
  try{const url=new URL(value);return !url.username&&!url.password&&(url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)));}catch{return false;}
}
export function normalizeManifestUrl(value: string) {
  const url = new URL(httpsUrl(value.trim().replace(/^stremio:\/\//i, 'https://')));
  if (url.hash || url.search) throw new Error('Use the full manifest.json address, including any configuration in its path.');
  if (!url.pathname.endsWith('/manifest.json')) url.pathname = url.pathname.replace(/\/$/, '') + '/manifest.json';
  return url.href;
}
export function supportsResource(manifest: AddonManifest, resource: string, type: string, id: string) {
  if (!manifest.types.includes(type)) return false;
  return manifest.resources.some(entry => {
    if (typeof entry === 'string') return entry === resource && (!manifest.idPrefixes?.length || manifest.idPrefixes.some(prefix => id.startsWith(prefix)));
    return entry.name === resource && (!entry.types || entry.types.includes(type)) && (!entry.idPrefixes?.length || entry.idPrefixes.some(prefix => id.startsWith(prefix)));
  });
}
export function resourceUrl(transport: string, resource: string, type: string, id: string, extra?: Record<string, string>) {
  const base = normalizeManifestUrl(transport).slice(0, -'manifest.json'.length);
  const args = extra && Object.keys(extra).length ? '/' + Object.entries(extra).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
  return `${base}${encodeURIComponent(resource)}/${encodeURIComponent(type)}/${encodeURIComponent(id)}${args}.json`;
}
export async function requestJson(url: string, signal?: AbortSignal, localService=false): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, 25000);
  try {
    const response = await fetch(localService && url.startsWith('/streaming-service/') ? url : localService ? normalizeServiceUrl(url) : httpsUrl(url), { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`The add-on returned HTTP ${response.status}.`);
    const text = await response.text();
    if (text.length > 5_000_000) throw new Error('This add-on response is too large.');
    return JSON.parse(text);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}
export async function installAddon(url: string) {
  const transportUrl = normalizeManifestUrl(url);
  const manifest = manifestSchema.parse(await requestJson(transportUrl));
  return { transportUrl, manifest, enabled: true };
}
export function normalizeServiceUrl(value: string) {
  if(value.trim()==='/streaming-service')return '/streaming-service';
  const url=new URL(value.trim());
  if ((url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) || url.username || url.password || url.search || url.hash) throw new Error('Use HTTPS, or an HTTP service on localhost, without credentials or query parameters.');
  return url.href.replace(/\/$/,'');
}
export function serviceStreamUrl(stream: AddonStream, service: string) {
  const base=normalizeServiceUrl(service)+'/';
  if(stream.infoHash&&!stream.url){
    if(!/^[a-fA-F0-9]{40}$/.test(stream.infoHash))throw new Error('Invalid torrent hash.');
    const url=new URL(base+stream.infoHash.toLowerCase()+'/'+(stream.fileIdx ?? -1),'https://admax.invalid');
    (stream.sources||[]).forEach(tracker=>url.searchParams.append('tr',tracker));
    return base.startsWith('/') ? url.pathname+url.search : url.href;
  }
  if(stream.url && stream.behaviorHints?.proxyHeaders){
    const target=new URL(stream.url);
    if(!['https:','http:'].includes(target.protocol)||target.username||target.password)throw new Error('Unsupported stream address.');
    const query=new URLSearchParams({d:target.origin});
    const headers=stream.behaviorHints.proxyHeaders;
    Object.entries(headers.request||{}).forEach(([k,v])=>query.append('h',k+':'+v));
    Object.entries(headers.response||{}).forEach(([k,v])=>query.append('r',k+':'+v));
    return base+'proxy/'+query.toString()+'/'+target.pathname.slice(1)+target.search;
  }
  if(stream.url){
    const target=new URL(stream.url);
    if(!['https:','http:'].includes(target.protocol)||target.username||target.password)throw new Error('Unsupported stream address.');
    return target.href;
  }
  throw new Error('This stream requires format conversion in another player.');
}
// Built-in same-origin relay (server/media-proxy.ts) for header-dependent sources when no Stremio Service is connected.
export function mediaProxyUrl(url:string,headers:Record<string,string>={}){
  const query=new URLSearchParams({u:url});
  Object.entries(headers).forEach(([k,v])=>query.append('h',k+':'+v));
  const name=new URL(url).pathname.split('/').pop()?.replace(/[^\w.-]/g,'')||'media';
  return '/api/playback/media/'+name+'?'+query;
}
export function hlsPlaybackUrl(mediaUrl:string,service:string,sessionId:string,origin:string){
  const base=normalizeServiceUrl(service);
  const params=new URLSearchParams({mediaURL:new URL(mediaUrl,origin).href,videoCodecs:'h264',audioCodecs:'aac',maxAudioChannels:'2',forceTranscoding:'1'});
  return (base==='/streaming-service'?'':base)+'/hlsv2/'+encodeURIComponent(sessionId)+'/master.m3u8?'+params;
}
export function classifyStream(stream: AddonStream, id: string, addonName: string, service?: string): StreamChoice {
  const base = { id, name: stream.name || addonName, description: stream.description || stream.title, subtitles: stream.subtitles?.filter(s => { try { return typeof s.lang === 'string' && !!httpsUrl(s.url); } catch { return false; } }).map(s => ({url:s.url,lang:s.lang})) };
  if (stream.externalUrl) {
    try { return { ...base, kind: 'external', externalUrl: httpsUrl(stream.externalUrl) }; } catch { return {...base,kind:'unsupported',reason:'This external link is not a secure web address.'}; }
  }
  if ((stream.infoHash&&!stream.url) || stream.behaviorHints?.proxyHeaders) {
    if(service){try{return {...base,kind:'video',url:serviceStreamUrl(stream,service),service:normalizeServiceUrl(service),needsConversion:!!stream.infoHash&&!stream.url};}catch(e){return {...base,kind:'unsupported',reason:e instanceof Error?e.message:'This source could not be converted.'};}}
    if(stream.url){try{return {...base,kind:'video',url:mediaProxyUrl(httpsUrl(stream.url),stream.behaviorHints?.proxyHeaders?.request)};}catch{ /* Explain below. */ }}
    return { ...base, kind:'unsupported',reason:'Install and start Stremio Service on this computer, then retry. A&D MAX connects to it automatically.' };
  }
  if (stream.behaviorHints?.notWebReady) {
    if(service){try{return {...base,kind:'video',url:serviceStreamUrl(stream,service),service:normalizeServiceUrl(service),needsConversion:true};}catch{ /* Explain unsupported transports below. */ }}
    return { ...base, kind:'unsupported',reason:'Install and start Stremio Service on this computer, then retry. A&D MAX connects to it automatically.' };
  }
  if (stream.ytId && /^[a-zA-Z0-9_-]{11}$/.test(stream.ytId)) return {...base,kind:'external',externalUrl:`https://www.youtube.com/watch?v=${stream.ytId}`};
  if (stream.url) {
    try { return { ...base, kind: 'video', url: httpsUrl(stream.url), ...(service ? {service:normalizeServiceUrl(service),needsConversion:/\.(mkv|avi|wmv|flv|ts|m2ts)(?:[?#]|$)/i.test(stream.url)} : {}) }; } catch { return { ...base, kind:'unsupported', reason:'This source is not available over HTTPS.' }; }
  }
  return { ...base, kind:'unsupported',reason:'The add-on did not return a browser-playable video.' };
}
export async function addonStreams(addon: InstalledAddon, type: string, id: string, signal?: AbortSignal, service?: string) {
  if (!addon.enabled || !supportsResource(addon.manifest, 'stream', type, id)) return [];
  const result = z.object({streams:z.array(streamSchema)}).parse(await requestJson(resourceUrl(addon.transportUrl,'stream',type,id),signal));
  return result.streams.map((stream,index) => classifyStream(stream,`${addon.manifest.id}-${index}`,addon.manifest.name,service));
}
export const metaSchema = z.object({
  id:z.string(), type:z.string(), name:z.string(), poster:z.string().optional(), background:z.string().optional(),
  description:z.string().optional(), releaseInfo:z.string().optional(),
  videos:z.array(z.object({id:z.string(),title:z.string().optional(),season:z.number().optional(),episode:z.number().optional(),thumbnail:z.string().optional()})).optional(),
});
export async function addonCatalog(addon: InstalledAddon, type: string, id: string, signal?: AbortSignal) {
  return z.object({metas:z.array(metaSchema)}).parse(await requestJson(resourceUrl(addon.transportUrl,'catalog',type,id),signal)).metas;
}
export async function addonMeta(addon: InstalledAddon, type: string, id: string, signal?: AbortSignal) {
  return z.object({meta:metaSchema}).parse(await requestJson(resourceUrl(addon.transportUrl,'meta',type,id),signal)).meta;
}
