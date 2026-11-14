import { useEffect, useState } from 'react';
import { z } from 'zod';
import { classifyStream, streamSchema, type StreamChoice } from '@/integrations/api/stremio';
const resultSchema=z.object({provider:z.string(),name:z.string(),status:z.enum(['reachable','unavailable','timeout']),streams:z.array(streamSchema)});
// The source server sleeps when idle (free hosting) and can take up to a minute to start: until it
// first answers, failed connections are retried, and the 32 s provider window only starts then.
const START_LIMIT=90000,PROVIDER_WINDOW=32000,RETRY_DELAY=3000,WAKE_HINT=5000;
export function useResolvedSources(type:'movie'|'tv'|'anime',id:string,season:number,episode:number,service?:string,scan=0){
  const [sources,setSources]=useState<StreamChoice[]>([]),[checking,setChecking]=useState(true),[error,setError]=useState(''),[waking,setWaking]=useState(false);
  useEffect(()=>{
    setSources([]);setChecking(true);setError('');setWaking(false);
    const params=new URLSearchParams({type:type==='movie'?'movie':'tv',id,...(type!=='movie'?{season:String(season),episode:String(episode)}:{})});
    let events:EventSource|undefined,answered=false,finished=false,retry:ReturnType<typeof setTimeout>|undefined,providerTimer:ReturnType<typeof setTimeout>|undefined;
    const startedAt=Date.now();
    const wakeHint=setTimeout(()=>{if(!answered)setWaking(true);},WAKE_HINT);
    const stop=()=>{finished=true;clearTimeout(wakeHint);clearTimeout(startLimit);clearTimeout(retry);clearTimeout(providerTimer);setWaking(false);setChecking(false);events?.close();};
    const startLimit=setTimeout(()=>{if(!answered){setError('The source server did not start in time. Retry in a moment.');stop();}},START_LIMIT);
    const expire=()=>{setSources(previous=>previous.map(s=>s.availability==='checking'?{...s,availability:'timeout',reason:'This provider did not finish within the quick-check window.'}:s));stop();};
    const connect=()=>{
      if(finished)return;
      events=new EventSource('/api/playback/sources?'+params);
      events.onmessage=e=>{
        try{
          const data=JSON.parse(e.data);
          if(data.type==='providers'){
            answered=true;clearTimeout(wakeHint);clearTimeout(startLimit);setWaking(false);providerTimer??=setTimeout(expire,PROVIDER_WINDOW);
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
      events.onerror=()=>{
        events?.close();
        // While the server is starting (502s, dropped connections), keep trying within the start limit.
        if(!answered&&Date.now()-startedAt+RETRY_DELAY<START_LIMIT){retry=setTimeout(connect,RETRY_DELAY);return;}
        setError('Source discovery could not connect. Retry, or choose an installed add-on.');stop();
      };
    };
    connect();
    return()=>{finished=true;clearTimeout(wakeHint);clearTimeout(startLimit);clearTimeout(retry);clearTimeout(providerTimer);events?.close();};
  },[type,id,season,episode,service,scan]);
  return {sources,checking,error,waking};
}
