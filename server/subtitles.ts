import type { IncomingMessage, ServerResponse } from 'node:http';
import { publicMediaUrl } from './source-resolver.js';
import { toWebVTT } from '../src/lib/subtitles.js';
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
    const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
    try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2_000_000)throw new Error('Subtitle too large');text+=decoder.decode(part.value,{stream:true});}}finally{await reader.cancel();}
    text+=decoder.decode();
    res.writeHead(200,{'Content-Type':'text/vtt; charset=utf-8','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'});res.end(toWebVTT(text));
  }catch{if(!res.headersSent)res.writeHead(422,{'Content-Type':'text/plain'});res.end('This subtitle could not be loaded or converted.');}
}
