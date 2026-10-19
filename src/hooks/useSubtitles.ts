import { useQueries } from '@tanstack/react-query';
import { useAddons } from './useAddons';
import { httpsUrl, requestJson, resourceUrl, supportsResource, type InstalledAddon } from '@/integrations/api/stremio';
import { normalizeLangCode, rankSubtitleTracks, subtitleLanguage, type SubtitleTrack } from '@/lib/subtitles';
const builtins:InstalledAddon[]=[
  {transportUrl:'https://opensubtitles-v3.strem.io/manifest.json',enabled:true,manifest:{id:'org.stremio.opensubtitlesv3',name:'OpenSubtitles',version:'1.0.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
  {transportUrl:'https://opensubtitlesv3-pro.dexter21767.com/manifest.json',enabled:true,manifest:{id:'community.opensubtitlesv3.pro',name:'OpenSubtitles PRO',version:'0.1.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
];
const PRIORITY_LANGS=['en','es','fr','ar','de','pt-BR','pt','it','ja','ko','zh','ru','tr','hi','nl'];
export function useSubtitles(type:string,id?:string,release='',searchId=id){
  const {addons}=useAddons();
  const providers=[...addons,...builtins.filter(a=>!addons.some(existing=>existing.manifest.id===a.manifest.id))].filter(a=>a.enabled&&id&&supportsResource(a.manifest,'subtitles',type,id));
  const results=useQueries({queries:[...providers.map(addon=>({
    queryKey:['subtitles',type,id,addon.transportUrl],enabled:!!id,staleTime:300000,retry:1,
    queryFn:async({signal}:{signal:AbortSignal})=>{
      const data=await requestJson(resourceUrl(addon.transportUrl,'subtitles',type,id!),signal) as {subtitles?:SubtitleTrack[]};
      if(!Array.isArray(data.subtitles))throw new Error('Invalid subtitle response');
      return {name:addon.manifest.name,tracks:data.subtitles.map(track=>({...track,label:track.label||addon.manifest.name}))};
    }
  })),...['','ar'].map(language=>({
    queryKey:['subtitles-extra',searchId,language],enabled:!!searchId,staleTime:300000,retry:1,
    queryFn:async({signal}:{signal:AbortSignal})=>{
      const response=await fetch('/api/playback/subtitle-search?'+new URLSearchParams({id:searchId!,...(language?{language}:{})}),{signal});
      if(!response.ok)throw new Error('Additional providers unavailable');
      const data=await response.json();
      return {name:language?'Wyzie Arabic':'Wyzie',tracks:(data.subtitles||[]) as SubtitleTrack[]};
    }
  }))]});
  const seen=new Set<string>();
  const tracks=rankSubtitleTracks(results.flatMap(result=>result.data?.tracks||[]).flatMap(track=>{
    try {
      const url=httpsUrl(track.url),lang=normalizeLangCode(track.lang);
      const key=lang+'|'+(track.id?new URL(url).origin+'|'+track.id:url);
      if(seen.has(key))return [];
      seen.add(key);return [{...track,url,lang}];
    }catch{return [];}
  }),release).sort((a,b)=>{
    const ia=PRIORITY_LANGS.indexOf(a.lang),ib=PRIORITY_LANGS.indexOf(b.lang);
    return (ia<0?999:ia)-(ib<0?999:ib)||subtitleLanguage(a.lang).localeCompare(subtitleLanguage(b.lang));
  });
  return {isPending:results.some(result=>result.isPending&&result.fetchStatus==='fetching'),data:{tracks,failed:results.flatMap((result,index)=>result.isError?[providers[index]?.manifest.name||'Additional providers']:[])}};
}
