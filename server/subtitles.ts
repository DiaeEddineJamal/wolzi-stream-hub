import type { IncomingMessage, ServerResponse } from 'node:http';
import { publicMediaUrl } from './source-resolver.js';
import { gunzipSync } from 'node:zlib';
import { decodeSubtitle, stripSubtitleAds, toWebVTT } from '../src/lib/subtitles.js';
export async function subtitleRoute(req:IncomingMessage,res:ServerResponse){
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  try{
    const value=new URL(req.url||'','http://localhost').searchParams.get('url');
    if(!value||value.length>8000)throw new Error('Invalid subtitle');
    let url=await publicMediaUrl(value),response:Response|undefined;
    const signal=AbortSignal.timeout(12000);
    for(let redirects=0;redirects<4;redirects++){
      response=await fetch(url,{signal,redirect:'manual',credentials:'omit',headers:{Accept:'text/vtt, text/plain, */*'}});
      if(response.status<300||response.status>=400)break;
      await response.body?.cancel();url=await publicMediaUrl(new URL(response.headers.get('location')||'',url).href);
    }
    if(!response?.ok||!response.body)throw new Error('Subtitle unavailable');
    const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
    try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2_000_000)throw new Error('Subtitle too large');chunks.push(part.value);}}finally{await reader.cancel();}
    let bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    if(bytes[0]===0x1f&&bytes[1]===0x8b)bytes=new Uint8Array(gunzipSync(bytes,{maxOutputLength:8_000_000}));
    const type=response.headers.get('content-type')||'',hint=/^#charset=([\w-]+)$/.exec(new URL(value).hash)?.[1];
    const text=decodeSubtitle(bytes,/charset=/i.test(type)||!hint?type:'text/plain; charset='+hint);
    res.writeHead(200,{'Content-Type':'text/vtt; charset=utf-8','Cache-Control':'public, max-age=86400, s-maxage=604800','X-Content-Type-Options':'nosniff'});res.end(stripSubtitleAds(toWebVTT(text)));
  }catch{if(!res.headersSent)res.writeHead(422,{'Content-Type':'text/plain'});res.end('This subtitle could not be loaded or converted.');}
}
