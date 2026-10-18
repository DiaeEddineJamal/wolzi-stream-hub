import { useState } from 'react';
import YouTube from 'react-youtube';
import LoadingState from '@/components/primitives/LoadingState';

export default function TrailerPlayer({videoId,title}:{videoId:string;title:string}){
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  if(!/^[\w-]{11}$/.test(videoId)||failed)return <div className="trailer-unavailable" role="status"><h3>This trailer can’t play here.</h3><p>The publisher may have disabled embedding. Try another trailer below.</p></div>;
  return <div className="trailer-player">{!ready&&<div className="trailer-loading"><LoadingState label="Opening the trailer"/></div>}<YouTube videoId={videoId} title={title+' · Official trailer'} className="trailer-embed" opts={{host:'https://www.youtube-nocookie.com',playerVars:{autoplay:1,playsinline:1,rel:0,origin:window.location.origin}}} onReady={()=>setReady(true)} onError={()=>setFailed(true)}/></div>;
}
