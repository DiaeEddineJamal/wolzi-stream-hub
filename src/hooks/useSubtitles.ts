import { useQueries } from '@tanstack/react-query';
import { useAddons } from './useAddons';
import { httpsUrl, requestJson, resourceUrl, supportsResource, type InstalledAddon } from '@/integrations/api/stremio';
import { normalizeLangCode, rankSubtitleTracks, subtitleLanguage, subtitleVideoExtras, subtitleMatchesEpisode, type SubtitleTrack, type SubtitleVideo } from '@/lib/subtitles';
const builtins:InstalledAddon[]=[
  {transportUrl:'https://opensubtitles-v3.strem.io/manifest.json',enabled:true,manifest:{id:'org.stremio.opensubtitlesv3',name:'OpenSubtitles',version:'1.0.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
];
// Languages the viewer is likely to want: their saved choice, the browser's languages, then English and Arabic.
function viewerLanguages(){
  let saved:string|null=null;
  try{saved=localStorage.getItem('admax-subtitle-language');}catch{/* Storage is optional. */}
  const browser=typeof navigator==='undefined'?[]:navigator.languages||[navigator.language];
  return [...new Set([saved&&saved!=='off'?saved:'',...browser,'en','ar'].filter(Boolean).map(lang=>normalizeLangCode(lang!).split('-')[0]).filter(lang=>/^[a-z]{2}$/.test(lang)))].slice(0,5);
}
// SubSense aggregates keyless providers (OpenSubtitles, SubDL, Addic7ed, Gestdown, BetaSeries, YIFY); its path carries the language list.
const subsense=(languages:string[]):InstalledAddon=>({transportUrl:`https://subsense.nepiraw.com/admaxsub-${encodeURIComponent(JSON.stringify({languages}))}/manifest.json`,enabled:true,manifest:{id:'com.subsense.nepiraw',name:'SubSense',version:'2.4.1',types:['movie','series'],resources:['subtitles'],idPrefixes:['tt'],catalogs:[]}});
const PRIORITY_LANGS=['en','es','fr','ar','de','pt-BR','pt','it','ja','ko','zh','ru','tr','hi','nl'];
export function useSubtitles(type:string,id?:string,release='',searchId=id,video:SubtitleVideo={}){
  const {addons}=useAddons();
  const extra=subtitleVideoExtras(video);
  const languages=viewerLanguages();
  const providers=[...addons,...[...builtins,subsense(languages)].filter(a=>!addons.some(existing=>existing.manifest.id===a.manifest.id))].filter(a=>a.enabled&&id&&supportsResource(a.manifest,'subtitles',type,id));
  const results=useQueries({queries:[...providers.map(addon=>({
    queryKey:['subtitles',type,id,addon.transportUrl,extra],enabled:!!id,staleTime:300000,retry:1,
    queryFn:async({signal}:{signal:AbortSignal})=>{
      const data=await requestJson(resourceUrl(addon.transportUrl,'subtitles',type,id!,extra),signal) as {subtitles?:SubtitleTrack[]};
      if(!Array.isArray(data.subtitles))throw new Error('Invalid subtitle response');
      return {name:addon.manifest.name,tracks:data.subtitles.map(track=>({...track,label:track.label||addon.manifest.name}))};
    }
  })),...['',...languages.slice(0,2)].map(language=>({
    queryKey:['subtitles-extra',searchId,language],enabled:!!searchId,staleTime:300000,retry:1,
    queryFn:async({signal}:{signal:AbortSignal})=>{
      const response=await fetch('/api/playback/subtitle-search?'+new URLSearchParams({id:searchId!,...(language?{language}:{})}),{signal});
      if(!response.ok)throw new Error('Additional providers unavailable');
      const data=await response.json();
      if(!Array.isArray(data.subtitles)||data.configured===false)throw new Error('Subtitle sources are not configured');
      return {name:'OpenSubtitles.org & Wyzie',tracks:data.subtitles as SubtitleTrack[]};
    }
  }))]});
  const seen=new Set<string>();
  const tracks=rankSubtitleTracks(results.flatMap(result=>result.data?.tracks||[]).flatMap(track=>{
    try {
      if(!track||typeof track.lang!=='string'||typeof track.url!=='string')return [];
      if(!subtitleMatchesEpisode(track,searchId))return [];
      const url=httpsUrl(track.url),lang=normalizeLangCode(track.lang);
      const key=lang+'|'+(track.id?new URL(url).origin+'|'+track.id:url);
      if(seen.has(key))return [];
      seen.add(key);return [{...track,url,lang}];
    }catch{return [];}
  }),release).sort((a,b)=>{
    const ia=PRIORITY_LANGS.indexOf(a.lang),ib=PRIORITY_LANGS.indexOf(b.lang);
    return (ia<0?999:ia)-(ib<0?999:ib)||subtitleLanguage(a.lang).localeCompare(subtitleLanguage(b.lang));
  });
  return {isPending:results.some(result=>result.isPending&&result.fetchStatus==='fetching'),data:{tracks,failed:[...new Set(results.flatMap((result,index)=>result.isError?[providers[index]?.manifest.name||'OpenSubtitles.org & Wyzie']:[]))]}};
}
