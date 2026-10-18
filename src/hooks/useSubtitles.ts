import { useQuery } from '@tanstack/react-query';
import { useAddons } from './useAddons';
import { httpsUrl, requestJson, resourceUrl, supportsResource, type InstalledAddon } from '@/integrations/api/stremio';
const builtins:InstalledAddon[]=[
  {transportUrl:'https://opensubtitlesv3-pro.dexter21767.com/manifest.json',enabled:true,manifest:{id:'community.opensubtitlesv3.pro',name:'OpenSubtitles PRO',version:'0.1.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
  {transportUrl:'https://opensubtitles-v3.strem.io/manifest.json',enabled:true,manifest:{id:'org.stremio.opensubtitlesv3',name:'OpenSubtitles',version:'1.0.0',types:['movie','series'],resources:['subtitles'],catalogs:[]}},
];
export function useSubtitles(type:string,id?:string){
  const {addons}=useAddons();
  const providers=[...addons,...builtins.filter(a=>!addons.some(existing=>existing.manifest.id===a.manifest.id))].filter(a=>a.enabled&&id&&supportsResource(a.manifest,'subtitles',type,id));
  return useQuery({queryKey:['subtitles',type,id,addons],enabled:!!id,staleTime:300000,queryFn:async({signal})=>{
    const results=await Promise.allSettled(providers.map(async addon=>({name:addon.manifest.name,result:await requestJson(resourceUrl(addon.transportUrl,'subtitles',type,id),signal)})));
    const failed:string[]=[],tracks:{url:string;lang:string;label:string}[]=[];
    results.forEach((result,index)=>{
      if(result.status!=='fulfilled'){failed.push(providers[index].manifest.name);return;}
      const data=result.value.result as {subtitles?:{url:string;lang:string}[]};
      if(!Array.isArray(data?.subtitles)){failed.push(result.value.name);return;}
      data.subtitles.forEach(track=>{try{if(typeof track.lang==='string'&&!tracks.some(t=>t.url===track.url))tracks.push({url:httpsUrl(track.url),lang:track.lang,label:result.value.name});}catch{/* Ignore invalid provider tracks. */}});
    });
    return {tracks,failed};
  }});
}
