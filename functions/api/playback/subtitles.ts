// Subtitle download + WebVTT conversion on Cloudflare's edge (Render's address is refused by
// bot-protected subtitle hosts such as the OpenSubtitles v3 file server).
import { downloadSubtitle, SUBTITLE_HEADERS } from '../../../server/subtitle-core';
import { edgeCache, gunzip, publicUrl, sameSite, type EdgeContext } from '../../../server/edge';

export async function onRequestGet({request,waitUntil}:EdgeContext){
  if(!sameSite(request))return new Response('Forbidden',{status:403});
  const key=new Request(new URL(request.url).href),cache=edgeCache();
  const hit=await cache.match(key);
  if(hit)return hit;
  try{
    const {vtt}=await downloadSubtitle(new URL(request.url).searchParams.get('url')||'',publicUrl,bytes=>gunzip(bytes));
    const response=new Response(vtt,{headers:SUBTITLE_HEADERS});
    waitUntil(cache.put(key,response.clone()));
    return response;
  }catch{
    return new Response('This subtitle could not be loaded or converted.',{status:422,headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}});
  }
}
