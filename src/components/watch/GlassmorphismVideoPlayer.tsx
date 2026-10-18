import { useState } from 'react';
import StreamingPlayer from './StreamingPlayer';
import { createStreamingSources } from '@/utils/sourceTestUtils';
interface Props {
  mediaType:'movie'|'tv'|'anime';id:string;title:string;seasonNumber?:number;episodeNumber?:number;
  activeSourceId?:string;onSourceChange?:(id:string)=>void;onError?:(message:string)=>void;
}
export function GlassmorphismVideoPlayer({mediaType,id,title,seasonNumber=1,episodeNumber=1,activeSourceId,onSourceChange,onError}:Props){
  const [selected,setSelected]=useState<string>();
  const sources=createStreamingSources(mediaType,id,seasonNumber,episodeNumber);
  const index=Math.max(0,sources.findIndex(s=>s.id===(activeSourceId||selected)));
  const source=sources[index];
  return <StreamingPlayer source={source?{id:source.id,name:source.name,url:source.url,kind:'embed'}:undefined} title={title} storageKey={`${mediaType}-${id}-${seasonNumber}-${episodeNumber}`} onNextSource={()=>{
    if(sources.length<2){onError?.('No other sources are available.');return;}
    const next=sources[(index+1)%sources.length];setSelected(next.id);onSourceChange?.(next.id);
  }}/>;
}
