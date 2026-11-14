// Server-side subtitle search (OpenSubtitles.org REST, Wyzie when WYZIE_API_KEY is set) on
// Cloudflare's edge; successful results are cached for an hour.
import { searchSubtitles } from '../../../server/subtitle-core';
import { edgeCache, sameSite, type EdgeContext } from '../../../server/edge';

export async function onRequestGet({request,env,waitUntil}:EdgeContext){
  if(!sameSite(request))return new Response('Forbidden',{status:403});
  const key=new Request(new URL(request.url).href),cache=edgeCache();
  const hit=await cache.match(key);
  if(hit)return hit;
  const result=await searchSubtitles(new URL(request.url).searchParams,env.WYZIE_API_KEY);
  const response=new Response(JSON.stringify(result.body),{status:result.status,headers:{'Content-Type':'application/json','Cache-Control':result.cache}});
  if(result.status===200)waitUntil(cache.put(key,response.clone()));
  return response;
}
