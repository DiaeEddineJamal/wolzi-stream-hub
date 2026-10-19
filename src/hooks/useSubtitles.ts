import { useQueries } from '@tanstack/react-query';
import { useAddons } from './useAddons';
import { httpsUrl, requestJson, resourceUrl, supportsResource, type InstalledAddon } from '@/integrations/api/stremio';
import { normalizeLangCode, subtitleLanguage } from '@/lib/subtitles';
const builtins:InstalledAddon[]=[
  {transportUrl:'https://opensubtitles-v3.strem.io/manifest.json',enabled:true,manifest:{id:'org.stremio.opensubtitlesv3',name:'OpenSubtitles',version:'1.0.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
  {transportUrl:'https://opensubtitlesv3-pro.dexter21767.com/manifest.json',enabled:true,manifest:{id:'community.opensubtitlesv3.pro',name:'OpenSubtitles PRO',version:'0.1.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
];
const PRIORITY_LANGS=['en','es','fr','ar','de','pt-BR','pt','it','ja','ko','zh','ru','tr','hi','nl'];
export function useSubtitles(type:string,id?:string){
  const {addons}=useAddons();
  const providers=[...addons,...builtins.filter(a=>!addons.some(existing=>existing.manifest.id===a.manifest.id))].filter(a=>a.enabled&&id&&supportsResource(a.manifest,'subtitles',type,id));
  const results=useQueries({queries:[...providers.map(addon=>({
    queryKey:['subtitles',type,id,addon.transportUrl],enabled:!!id,staleTime:300000,retry:1,
    queryFn:async({signal}:{signal:AbortSignal})=>{
      const data=await requestJson(resourceUrl(addon.transportUrl,'subtitles',type,id!),signal) as {subtitles?:{url:string;lang:string;label?:string}[]};
      if(!Array.isArray(data.subtitles))throw new Error('Invalid subtitle response');
      return {name:addon.manifest.name,tracks:data.subtitles.map(track=>({...track,label:track.label||addon.manifest.name}))};
    }
  })),{
    queryKey:['subtitles-extra',id],enabled:!!id,staleTime:300000,retry:1,
    queryFn:async({signal}:{signal:AbortSignal})=>{
      const response=await fetch('/api/playback/subtitle-search?'+new URLSearchParams({id:id!}),{signal});
      if(!response.ok)throw new Error('Additional providers unavailable');
      const data=await response.json();
      return {name:'Wyzie',tracks:(data.subtitles||[]) as {url:string;lang:string;label:string}[]};
    }
  }]});
  const seen=new Set<string>(),counts=new Map<string,number>();
  const tracks=results.flatMap(result=>result.data?.tracks||[]).flatMap(track=>{
    try {
      const url=httpsUrl(track.url),lang=normalizeLangCode(track.lang);
      // Preserve release alternatives from each provider instead of discarding later providers.
      const key=lang+'|'+track.label.split(' · ')[0],count=counts.get(key)||0;
      if(seen.has(url)||count>=3)return [];
      seen.add(url);counts.set(key,count+1);return [{...track,url,lang}];
    }catch{return [];}
  }).sort((a,b)=>{
    const ia=PRIORITY_LANGS.indexOf(a.lang),ib=PRIORITY_LANGS.indexOf(b.lang);
    return (ia<0?999:ia)-(ib<0?999:ib)||subtitleLanguage(a.lang).localeCompare(subtitleLanguage(b.lang));
  });
  return {isPending:!!id&&results.some(result=>result.isPending),data:{tracks,failed:results.flatMap((result,index)=>result.isError?[providers[index]?.manifest.name||'Additional providers']:[])}};
}
