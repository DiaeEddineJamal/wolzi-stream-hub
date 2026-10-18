import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { publicMediaUrl } from './source-resolver.js';
import { mediaProxyUrl } from '../src/integrations/api/stremio.js';

// Same-origin relay for sources that need request headers (Referer, User-Agent…) browsers cannot set.
const blocked=new Set(['host','connection','content-length','transfer-encoding','range','cookie','authorization']);
const chunk=4*1024*1024; // ponytail: 4 MB ranges keep each call well inside the function time limit
export function rewritePlaylist(text:string,base:string,headers:Record<string,string>){
  const proxied=(uri:string)=>mediaProxyUrl(new URL(uri,base).href,headers);
  return text.split(/\r?\n/).map(line=>{
    const value=line.trim();
    if(!value)return line;
    if(!value.startsWith('#'))return proxied(value);
    return line.replace(/URI="([^"]+)"/g,(_,uri)=>`URI="${proxied(uri)}"`);
  }).join('\n');
}
export async function mediaProxyRoute(req:IncomingMessage,res:ServerResponse){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
  const params=new URL(req.url||'','http://localhost').searchParams,value=params.get('u');
  if(!value||value.length>8000){res.writeHead(400).end();return;}
  const headers:Record<string,string>={};
  for(const entry of params.getAll('h').slice(0,12)){const at=entry.indexOf(':'),name=entry.slice(0,at).trim();if(at>0&&!blocked.has(name.toLowerCase()))headers[name]=entry.slice(at+1).trim();}
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  const upstreamHeaders={...headers,...(range?{Range:`bytes=${range[1]}-${range[2]||Number(range[1])+chunk-1}`}:{})};
  let url=await publicMediaUrl(value),response:Response|undefined;
  const controller=new AbortController();req.on('close',()=>controller.abort());
  for(let redirects=0;redirects<4;redirects++){
    response=await fetch(url,{headers:upstreamHeaders,redirect:'manual',signal:controller.signal});
    if(response.status<300||response.status>=400)break;
    await response.body?.cancel();url=await publicMediaUrl(new URL(response.headers.get('location')||'',url).href);
  }
  if(!response?.ok||!response.body){res.writeHead(response?.status&&response.status>=400?response.status:502).end();return;}
  const type=response.headers.get('content-type')||'';
  if(/mpegurl/i.test(type)||/\.m3u8$/i.test(url.pathname)){
    const text=await response.text();
    if(text.trimStart().startsWith('#EXTM3U')){
      res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','Cache-Control':'no-store'});res.end(rewritePlaylist(text,url.href,headers));return;
    }
    res.writeHead(response.status,{'Content-Type':type||'application/octet-stream'});res.end(text);return;
  }
  const out:Record<string,string>={'Content-Type':type||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'private, max-age=600'};
  for(const name of ['content-length','content-range'])if(response.headers.get(name))out[name]=response.headers.get(name)!;
  res.writeHead(response.status,out);
  if(req.method==='HEAD'){await response.body.cancel();res.end();return;}
  Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).on('error',()=>res.destroy()).pipe(res);
}
