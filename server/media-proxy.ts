import type { IncomingMessage, ServerResponse } from 'node:http';
import { publicMediaUrl } from './source-resolver.js';
import { mediaProxyUrl } from '../src/integrations/api/stremio.js';

// Same-origin relay for sources that need request headers (Referer, User-Agent…) browsers cannot set.
// Every byte relayed here is billed as Vercel Fast Origin Transfer, so media goes direct whenever
// the browser can fetch it itself; `full=1` (the client's fallback) forces the relay.
const blocked=new Set(['host','connection','content-length','transfer-encoding','range','cookie','authorization']);
const chunk=4*1024*1024; // ponytail: 4 MB ranges keep each call well inside the function time limit
const isPlaylist=(value:string)=>/\.m3u8(?:$|\?)/i.test(value);
interface RewriteOptions {directHost?:string;full?:boolean}
export function rewritePlaylist(text:string,base:string,headers:Record<string,string>,{directHost,full}:RewriteOptions={}){
  const proxied=(uri:string)=>mediaProxyUrl(new URL(uri,base).href,headers)+(full?'&full=1':'');
  const media=(uri:string)=>{const url=new URL(uri,base);return directHost&&url.host===directHost&&url.protocol==='https:'?url.href:proxied(uri);};
  return text.split(/\r?\n/).map(line=>{
    const value=line.trim();
    if(!value)return line;
    // Variant playlists and keys stay relayed (they're tiny); segments may go direct.
    if(!value.startsWith('#'))return isPlaylist(value)?proxied(value):media(value);
    if(value.startsWith('#EXT-X-MAP'))return line.replace(/URI="([^"]+)"/g,(_,uri)=>`URI="${media(uri)}"`);
    return line.replace(/URI="([^"]+)"/g,(_,uri)=>`URI="${proxied(uri)}"`);
  }).join('\n');
}

const directHosts=new Map<string,{ok:boolean;until:number}>();
export async function directlyReachable(url:URL,origin:string,cors:boolean){
  const key=url.host+'|'+cors,cached=directHosts.get(key);
  if(cached&&cached.until>Date.now())return cached.ok;
  let ok=false;
  try{
    // Mirror what the browser will send: this site as Referer, and its origin for CORS fetches.
    const response=await fetch(url,{headers:{Range:'bytes=0-0',Referer:origin+'/',...(cors?{Origin:origin}:{})},redirect:'manual',signal:AbortSignal.timeout(4000)});
    await response.body?.cancel();
    const allow=response.headers.get('access-control-allow-origin');
    ok=(response.status===200||response.status===206)&&(!cors||allow==='*'||allow===origin);
  }catch{ok=false;}
  if(directHosts.size>500)directHosts.clear();
  directHosts.set(key,{ok,until:Date.now()+10*60_000});
  return ok;
}
async function directSegmentHost(text:string,base:string,origin:string){
  const first=text.split(/\r?\n/).map(line=>line.trim()).find(line=>line&&!line.startsWith('#'));
  if(!first||isPlaylist(first))return undefined;
  try{
    const url=await publicMediaUrl(new URL(first,base).href);
    return await directlyReachable(url,origin,true)?url.host:undefined;
  }catch{return undefined;}
}

export async function mediaProxyRoute(req:IncomingMessage,res:ServerResponse){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
  const params=new URL(req.url||'','http://localhost').searchParams,value=params.get('u'),full=params.get('full')==='1';
  if(!value||value.length>8000){res.writeHead(400).end();return;}
  const proto=String(req.headers['x-forwarded-proto']||((req.socket as {encrypted?:boolean}|undefined)?.encrypted?'https':'http')).split(',')[0].trim();
  const origin=proto+'://'+req.headers.host;
  const headers:Record<string,string>={};
  for(const entry of params.getAll('h').slice(0,12)){const at=entry.indexOf(':'),name=entry.slice(0,at).trim();if(at>0&&!blocked.has(name.toLowerCase()))headers[name]=entry.slice(at+1).trim();}
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  let url=await publicMediaUrl(value),response:Response|undefined;
  // Progressive video (<video> range requests) is redirected to the source when it serves us without special headers.
  if(range&&!full&&req.method==='GET'&&!isPlaylist(value)&&url.protocol==='https:'&&await directlyReachable(url,origin,false)){
    res.writeHead(302,{Location:url.href,'Cache-Control':'private, max-age=300'}).end();return;
  }
  const upstreamHeaders={...headers,...(range?{Range:`bytes=${range[1]}-${range[2]||Number(range[1])+chunk-1}`}:{})};
  const controller=new AbortController();req.on('close',()=>controller.abort());
  const fetchUpstream=async(hdrs:Record<string,string>)=>{
    let target=url,res:Response|undefined;
    for(let redirects=0;redirects<4;redirects++){
      res=await fetch(target,{headers:hdrs,redirect:'manual',signal:controller.signal});
      if(res.status<300||res.status>=400)break;
      await res.body?.cancel();target=await publicMediaUrl(new URL(res.headers.get('location')||'',target).href);
    }
    return {res,target};
  };
  ({res:response,target:url}=await fetchUpstream(upstreamHeaders));
  if((response?.status===403||response?.status===401)&&(headers.Referer||headers.Origin||headers.referer||headers.origin)){
    await response.body?.cancel();
    const minimal:Record<string,string>={};
    for(const [k,v] of Object.entries(upstreamHeaders))if(!/^(referer|origin)$/i.test(k))minimal[k]=v;
    ({res:response,target:url}=await fetchUpstream(minimal));
  }
  if(!response?.ok||!response.body){res.writeHead(response?.status&&response.status>=400?response.status:502).end();return;}
  const type=response.headers.get('content-type')||'';
  if(req.method==='HEAD'){
    res.writeHead(response.status,{'Content-Type':type||'application/octet-stream','Accept-Ranges':'bytes'});
    await response.body.cancel();res.end();return;
  }
  const sendPlaylist=async(text:string)=>{
    const directHost=full?undefined:await directSegmentHost(text,url.href,origin);
    res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store'});res.end(rewritePlaylist(text,url.href,headers,{directHost,full}));
  };
  if(/mpegurl/i.test(type)||isPlaylist(url.pathname)||isPlaylist(req.url||'')){
    const text=await response.text();
    if(text.trimStart().startsWith('#EXTM3U')){await sendPlaylist(text);return;}
    res.writeHead(response.status,{'Content-Type':type||'application/octet-stream'});res.end(text);return;
  }
  // Peek first chunk in case an HLS playlist is served without an .m3u8 extension or mpegurl content-type.
  const reader=response.body.getReader();
  const first=await reader.read();
  if(!first.done&&first.value){
    const prefix=new TextDecoder().decode(first.value.slice(0,64)).trimStart();
    if(prefix.startsWith('#EXTM3U')){
      const chunks=[first.value];let size=first.value.length;
      while(size<2_000_000){const next=await reader.read();if(next.done)break;chunks.push(next.value);size+=next.value.length;}
      await reader.cancel();
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
      await sendPlaylist(new TextDecoder().decode(bytes));return;
    }
  }
  // Whole segments never change: Vercel's CDN can serve repeats without re-running this relay.
  const out:Record<string,string>={'Content-Type':type||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':response.status===200&&!range?'public, max-age=3600, s-maxage=86400':'private, max-age=600'};
  for(const name of ['content-length','content-range'])if(response.headers.get(name))out[name]=response.headers.get(name)!;
  res.writeHead(response.status,out);
  if(first.done||!first.value){res.end();return;}
  res.write(Buffer.from(first.value));
  const pump=async()=>{
    try{while(true){const part=await reader.read();if(part.done)break;if(!res.write(Buffer.from(part.value)))await new Promise<void>(r=>res.once('drain',r));}res.end();}
    catch{res.destroy();}
  };
  void pump();
}
