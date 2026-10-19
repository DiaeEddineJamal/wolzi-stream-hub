import { useCallback, useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';
import { Download, ExternalLink, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/primitives/LoadingState';
import { hlsPlaybackUrl, isNativeVideoUrl, type StreamChoice } from '@/integrations/api/stremio';
import { openServiceSetup } from '@/hooks/useStreamingService';
import { decodeSubtitle, normalizeLangCode, subtitleLanguage, subtitleUrl, toWebVTT, type SubtitleTrack } from '@/lib/subtitles';
import PlayerControls, { type NextEpisode, type PlayerIdleMeta } from './PlayerControls';
interface Props {source?:StreamChoice;title:string;storageKey:string;poster?:string;onEnded?:()=>void;onProgress?:(seconds:number,duration:number)=>void;onNextSource?:()=>void;onOpenSources?:()=>void;onSourceError?:()=>void;onSourceReady?:()=>void;onRetryService?:()=>void;searching?:boolean;resume?:boolean;initialPosition?:number;nextEpisode?:NextEpisode;autoNext?:boolean;onAutoNextChange?:(value:boolean)=>void;subtitleStatus?:string;idleMeta?:PlayerIdleMeta}
export default function StreamingPlayer({source,title,storageKey,poster,onEnded,onProgress,onNextSource,onOpenSources,onSourceError,onSourceReady,onRetryService,searching=false,resume=true,initialPosition,nextEpisode,autoNext,onAutoNextChange,subtitleStatus,idleMeta}:Props){
  const container=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement|null>(null);
  const [media,setMedia]=useState<HTMLVideoElement|null>(null),[engine,setEngine]=useState<Hls|null>(null);
  const sourceError=useRef(onSourceError);
  useEffect(()=>{sourceError.current=onSourceError;},[onSourceError]);
  const attach=useCallback((element:HTMLVideoElement|null)=>{video.current=element;setMedia(element);},[]);
  const [loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[slow,setSlow]=useState(false),[retry,setRetry]=useState(0),[hint,setHint]=useState('');
  const [transcodeId,setTranscodeId]=useState<string>(),[nativeId,setNativeId]=useState<string>();
  const [uploaded,setUploaded]=useState<SubtitleTrack[]>([]);
  const uploadUrls=useRef<string[]>([]),lastSaved=useRef(0),session=useRef(crypto.randomUUID()),conversionRetries=useRef({id:'',count:0}),handledError=useRef(''),everPlayed=useRef(false),playIntent=useRef(false);
  const safe=source?.kind==='video'&&isNativeVideoUrl(source.url||'');
  const transcoding=!!(safe&&source.service&&(transcodeId===source.id||(source.needsConversion&&nativeId!==source.id)));
  const playbackUrl=safe?(transcoding?hlsPlaybackUrl(source.url,source.service,session.current+'-'+source.id+'-'+retry,window.location.origin):source.url):undefined;
  const isHls=!!playbackUrl&&/\.m3u8(?:[?#]|$)/i.test(playbackUrl);
  const resumePosition=useCallback(()=>{if(!resume)return 0;if(initialPosition!=null)return initialPosition;try{return Number(localStorage.getItem('admax-resume-'+storageKey))||0;}catch{return 0;}},[storageKey,resume,initialPosition]);
  const report=useCallback((seconds:number,duration:number,force=false)=>{
    if(!Number.isFinite(duration)||duration<=0||(!force&&Date.now()-lastSaved.current<15000))return;
    lastSaved.current=Date.now();try{localStorage.setItem('admax-resume-'+storageKey,String(seconds>duration-20?0:seconds));}catch{/* Playback survives full storage. */}onProgress?.(seconds,duration);
  },[storageKey,onProgress]);
  const latestReport=useRef(report);latestReport.current=report;
  useEffect(()=>{if(!media)return;return()=>latestReport.current(media.currentTime,media.duration,true);},[media]);
  useEffect(()=>{if(media&&resume&&initialPosition>0&&media.readyState>=1&&media.currentTime<1&&!everPlayed.current&&initialPosition<media.duration-20)media.currentTime=initialPosition;},[media,resume,initialPosition]);
  const playbackError=useCallback(()=>{
    const key=source?.id+'-'+retry+'-'+transcoding;if(handledError.current===key)return;handledError.current=key;
    if(source?.service&&!transcoding&&!everPlayed.current){setTranscodeId(source.id);setLoading(true);setFailed(false);return;}
    if(source?.service&&transcoding&&!everPlayed.current){if(conversionRetries.current.id!==source.id)conversionRetries.current={id:source.id,count:0};if(conversionRetries.current.count++<1){setRetry(value=>value+1);setLoading(true);setFailed(false);return;}}
    setFailed(true);setLoading(false);sourceError.current?.();
  },[source?.id,source?.service,transcoding,retry]);
  useEffect(()=>{setLoading(true);setFailed(false);setSlow(false);lastSaved.current=0;handledError.current='';everPlayed.current=false;if(nextEpisode)playIntent.current=true;const timeout=setTimeout(()=>setSlow(true),15000);return()=>clearTimeout(timeout);},[playbackUrl,source?.id,retry,storageKey]);
  useEffect(()=>{
    if(!media||!safe||!playbackUrl)return;
    let cancelled=false,hls:Hls;
    setEngine(null);
    if(isHls){void import('hls.js').then(({default:HlsEngine})=>{
      if(cancelled)return;
      // hls.js needs CORS, which Stremio Service grants only to stremio.com; the browser's own HLS player does not.
      const corsBlocked=!!source?.service&&/^https?:/.test(source.service)&&new URL(source.service).origin!==window.location.origin;
      if(corsBlocked&&media.canPlayType('application/vnd.apple.mpegurl')){media.src=playbackUrl;media.load();}
      else if(HlsEngine.isSupported()){
        hls=new HlsEngine({maxBufferLength:60,backBufferLength:30,enableWorker:true,fragLoadPolicy:{default:{maxTimeToFirstByteMs:25000,maxLoadTimeMs:60000,timeoutRetry:{maxNumRetry:4,retryDelayMs:1000,maxRetryDelayMs:8000},errorRetry:{maxNumRetry:4,retryDelayMs:1000,maxRetryDelayMs:8000}}},manifestLoadPolicy:{default:{maxTimeToFirstByteMs:20000,maxLoadTimeMs:30000,timeoutRetry:{maxNumRetry:3,retryDelayMs:1000,maxRetryDelayMs:4000},errorRetry:{maxNumRetry:3,retryDelayMs:1000,maxRetryDelayMs:4000}}}});setEngine(hls);hls.attachMedia(media);hls.loadSource(playbackUrl);
        hls.on(HlsEngine.Events.ERROR,(_,data)=>{if(!data.fatal||cancelled)return;if(data.type===HlsEngine.ErrorTypes.NETWORK_ERROR)hls.startLoad();else if(data.type===HlsEngine.ErrorTypes.MEDIA_ERROR)hls.recoverMediaError();else playbackError();});
      }else if(media.canPlayType('application/vnd.apple.mpegurl')){media.src=playbackUrl;media.load();}else playbackError();
    }).catch(()=>{if(!cancelled)playbackError();});}
    return()=>{cancelled=true;hls?.destroy();};
  },[media,playbackUrl,isHls,safe,playbackError,source?.service]);
  useEffect(()=>{if(!loading||failed||!safe||everPlayed.current)return;const timeout=setTimeout(playbackError,transcoding||source?.service?45000:30000);return()=>clearTimeout(timeout);},[loading,failed,safe,transcoding,source?.service,playbackError]);
  useEffect(()=>()=>uploadUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
  const upload=async(file:File)=>{if(file.size>2_000_000)throw new Error('Choose a subtitle smaller than 2 MB.');const contents=toWebVTT(decodeSubtitle(new Uint8Array(await file.arrayBuffer()))),url=URL.createObjectURL(new Blob([contents],{type:'text/vtt'}));uploadUrls.current.push(url);setUploaded(previous=>[...previous,{url,lang:'und',label:file.name}]);};
  const needsService=!safe&&/Stremio Service/i.test(source?.reason||'');
  useEffect(()=>{if(needsService)openServiceSetup(true);},[needsService,source?.id]);
  if(!source)return <div className="player-stage player-empty">{searching?<LoadingState label="Finding a working source"/>:<div><h2>No playable source yet.</h2><p>Install a stream add-on or retry source discovery.</p></div>}</div>;
  const tracks=[...(source.subtitles||[]),...uploaded].filter((track,index,list)=>list.findIndex(item=>item.url===track.url)===index);
  return <div ref={container} className="player-stage cinema-player" aria-busy={loading&&!failed} tabIndex={0} aria-label={`Video player: ${title}`}>
    {!safe?<div className="player-message"><ExternalLink size={28}/><h2>{source.kind==='embed'?'Embedded players are disabled':'A different source is needed'}</h2><p>{source.reason||'Choose direct video for playback without pop-up pages.'}</p><div className="flex flex-wrap justify-center gap-3">{source.externalUrl&&<Button asChild><a href={source.externalUrl} target="_blank" rel="noopener noreferrer">Open external provider</a></Button>}{needsService&&<Button onClick={()=>openServiceSetup(false)}><Download size={16}/>Install Stremio Service</Button>}{onRetryService&&needsService&&<Button variant="secondary" onClick={onRetryService}><RotateCcw size={16}/>Retry connection</Button>}<Button variant="secondary" onClick={onNextSource}>Choose another source</Button></div></div>:<>
      <video key={storageKey+'-'+source.id+'-'+retry+'-'+transcoding} ref={attach} src={isHls?undefined:playbackUrl} poster={poster} playsInline preload="metadata" autoPlay={playIntent.current} onLoadedMetadata={()=>{setLoading(false);onSourceReady?.();const start=resumePosition();if(video.current&&start>0&&start<video.current.duration-20)video.current.currentTime=start;if(playIntent.current&&video.current?.paused)void video.current.play().catch(()=>{});}} onLoadedData={()=>setLoading(false)} onPlay={()=>{playIntent.current=true;}} onPlaying={()=>{everPlayed.current=true;setLoading(false);onSourceReady?.();}} onWaiting={()=>setLoading(true)} onCanPlay={()=>{setLoading(false);onSourceReady?.();if(playIntent.current&&video.current?.paused)void video.current.play().catch(()=>{});}} onError={playbackError} onTimeUpdate={()=>{if(video.current){if(loading)setLoading(false);report(video.current.currentTime,video.current.duration);}}} onPause={()=>{if(video.current)report(video.current.currentTime,video.current.duration,true);}} onEnded={()=>{if(video.current)report(video.current.duration,video.current.duration,true);onEnded?.();}}>
        {tracks.map(track=><track key={track.url} id={normalizeLangCode(track.lang)+'|'+(track.id||track.url)} kind="subtitles" src={subtitleUrl(track.url)} srcLang={normalizeLangCode(track.lang)} label={subtitleLanguage(track.lang)+(track.label?' · '+track.label:'')} onError={()=>setHint('A subtitle could not load. Choose another track or add a subtitle file.')}/>)}
      </video>
      <PlayerControls captionKey={storageKey+'|'+source.id} media={media} engine={engine} container={container} title={title} sourceName={source.name} loading={loading} nextEpisode={nextEpisode} autoNext={autoNext} onAutoNextChange={onAutoNextChange} onNextSource={onNextSource} onOpenSources={onOpenSources} onUpload={upload} subtitleStatus={subtitleStatus} converted={transcoding} idleMeta={idleMeta} onCompatibility={source.service?()=>{if(video.current)playIntent.current=!video.current.paused;setNativeId(transcoding?source.id:undefined);setTranscodeId(transcoding?undefined:source.id);}:undefined}/>
      {loading&&!failed&&<div className="player-status pointer-events-none" role="status" aria-label="Loading video"><span className="apple-spinner" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--blade':i} as React.CSSProperties}/>)}</span><span className="apple-status-label">Loading…</span></div>}
      {slow&&loading&&!failed&&<div className="player-slow"><span>Still buffering. You can try another source.</span><button onClick={onNextSource}>Switch source</button></div>}
      {failed&&<div className="player-message"><h2>This source couldn’t play.</h2><p>Try it again or choose another source.</p><div className="flex gap-3"><Button onClick={()=>setRetry(value=>value+1)}><RotateCcw size={16}/>Try again</Button><Button variant="secondary" onClick={onNextSource}><SkipForward size={16}/>Next source</Button></div></div>}
    </>}{hint&&<p className="player-hint" role="status">{hint}<button aria-label="Dismiss subtitle notice" onClick={()=>setHint('')}>×</button></p>}
  </div>;
}
