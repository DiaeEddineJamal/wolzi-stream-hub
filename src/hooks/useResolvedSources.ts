import { useEffect, useState } from 'react';
import { z } from 'zod';
import { classifyStream, streamSchema, type StreamChoice } from '@/integrations/api/stremio';
const resultSchema=z.object({provider:z.string(),name:z.string(),status:z.enum(['reachable','unavailable','timeout']),streams:z.array(streamSchema)});
export function useResolvedSources(type:'movie'|'tv'|'anime',id:string,season:number,episode:number,service?:string,scan=0){
  const [sources,setSources]=useState<StreamChoice[]>([]),[checking,setChecking]=useState(true),[error,setError]=useState('');
  useEffect(()=>{
    setSources([]);setChecking(true);setError('');
    const params=new URLSearchParams({type:type==='movie'?'movie':'tv',id,...(type!=='movie'?{season:String(season),episode:String(episode)}:{})});
    const events=new EventSource('/api/playback/sources?'+params);
    const stop=()=>{setChecking(false);events.close();};
    events.onmessage=e=>{
      try{
        const data=JSON.parse(e.data);
        if(data.type==='providers'){
          const providers=z.array(z.object({id:z.string(),name:z.string()})).parse(data.providers);
          setSources(providers.map(p=>({id:'resolver-'+p.id,name:p.name,provider:p.id,kind:'unsupported',availability:'checking',reason:'Checking this provider for this title…'})));
        }else if(data.type==='result'){
          const result=resultSchema.parse(data);
          const choices:StreamChoice[]=result.streams.length?result.streams.map((s,i)=>({...classifyStream(s,`resolver-${result.provider}-${i}`,result.name,service),provider:result.provider,availability:'reachable'})):[{id:'resolver-'+result.provider,name:result.name,provider:result.provider,kind:'unsupported',availability:result.status==='timeout'?'timeout':'failed',reason:result.status==='timeout'?'This provider did not finish within the quick-check window.':'No playable media link was found for this title.'}];
          setSources(previous=>[...previous.filter(s=>s.provider!==result.provider),...choices]);
        }else if(data.type==='done')stop();
        else if(data.type==='error'){setError('Source discovery is unavailable. Your installed add-ons remain available.');stop();}
      }catch{setError('A provider returned an invalid response.');stop();}
    };
    events.onerror=()=>{setError('Source discovery could not connect. Retry, or choose an installed add-on.');stop();};
    const timeout=setTimeout(()=>{setSources(previous=>previous.map(s=>s.availability==='checking'?{...s,availability:'timeout',reason:'This provider did not finish within the quick-check window.'}:s));stop();},20000);
    return()=>{clearTimeout(timeout);events.close();};
  },[type,id,season,episode,service,scan]);
  return {sources,checking,error};
}
