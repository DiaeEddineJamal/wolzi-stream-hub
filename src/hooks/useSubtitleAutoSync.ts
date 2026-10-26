import { useEffect, useRef, useState } from 'react';
import { estimateAlignment, parseVttCues, SpeechTimeline, type SubtitleAlignment, type SyncCue } from '@/lib/subtitle-sync';

export type AutoSyncStatus='off'|'unsupported'|'embedded'|'listening'|'synced'|'no-match';
type CaptureVideo=HTMLVideoElement&{captureStream?:()=>MediaStream};
const cueCache=new Map<string,Promise<SyncCue[]>>();
function loadCues(src:string){
  if(!cueCache.has(src)){
    if(cueCache.size>40)cueCache.delete(cueCache.keys().next().value!);
    cueCache.set(src,fetch(src,{credentials:'same-origin'}).then(response=>response.ok?response.text():Promise.reject(new Error('Subtitle unavailable'))).then(parseVttCues).catch(error=>{cueCache.delete(src);throw error;}));
  }
  return cueCache.get(src)!;
}
export const trackSource=(media:HTMLVideoElement|null,track?:TextTrack)=>media&&track?Array.from(media.querySelectorAll('track')).find(element=>element.track===track)?.src:undefined;

// Listens to the playing audio (never rerouting it) and records speech energy against the media clock.
function useSpeechTimeline(media:HTMLVideoElement|null,enabled:boolean){
  const timeline=useRef(new SpeechTimeline());
  const [supported,setSupported]=useState(true);
  useEffect(()=>{
    timeline.current=new SpeechTimeline();setSupported(true);
    if(!media||!enabled)return;
    const capture=(media as CaptureVideo).captureStream,AudioCtx=window.AudioContext;
    // Firefox's mozCaptureStream silences the element, so only the standard capture API is used.
    if(typeof capture!=='function'||!AudioCtx){setSupported(false);return;}
    let context:AudioContext|undefined,stream:MediaStream|undefined,source:MediaStreamAudioSourceNode|undefined,analyser:AnalyserNode|undefined,disposed=false;
    const spectrum=new Float32Array(1024);
    const connect=()=>{
      if(source||disposed)return;
      try{stream??=capture.call(media);}catch{setSupported(false);return;}
      // Media Source playback exposes its audio track a moment after metadata.
      if(!stream.getAudioTracks().length){stream.onaddtrack=connect;return;}
      try{
        context??=new AudioCtx();
        source=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=0;
        const sink=context.createGain();sink.gain.value=0;source.connect(analyser);analyser.connect(sink);sink.connect(context.destination);
      }catch{setSupported(false);}
    };
    const resume=()=>{connect();if(context?.state==='suspended')void context.resume().catch(()=>{});};
    const sample=setInterval(()=>{
      if(!analyser||!context||context.state!=='running'||media.paused||media.seeking||media.readyState<3)return;
      analyser.getFloatFrequencyData(spectrum);
      const hz=context.sampleRate/analyser.fftSize;let voice=0;
      for(let i=Math.ceil(300/hz);i<=Math.floor(3400/hz);i++)voice+=10**(spectrum[i]/10);
      if(!(voice>0))return;
      // The analyser window ends "now"; its centre is half a window behind the playhead.
      timeline.current.record(media.currentTime-analyser.fftSize/2/context.sampleRate-(context.baseLatency||0),10*Math.log10(voice));
    },50);
    media.addEventListener('playing',resume);document.addEventListener('pointerdown',resume,true);document.addEventListener('keydown',resume,true);
    if(!media.paused)resume();
    return()=>{disposed=true;clearInterval(sample);media.removeEventListener('playing',resume);document.removeEventListener('pointerdown',resume,true);document.removeEventListener('keydown',resume,true);if(stream)stream.onaddtrack=null;source?.disconnect();void context?.close().catch(()=>{});};
  },[media,enabled]);
  return {timeline,supported};
}

interface Options {media:HTMLVideoElement|null;enabled:boolean;track?:TextTrack;candidates:TextTrack[];allowSwitch:boolean;initial?:SubtitleAlignment}
export function useSubtitleAutoSync({media,enabled,track,candidates,allowSwitch,initial}:Options){
  const {timeline,supported}=useSpeechTimeline(media,enabled);
  const [result,setResult]=useState<{track?:TextTrack;alignment?:SubtitleAlignment;status:AutoSyncStatus;observed:number;better?:TextTrack}>({status:'off',observed:0});
  const tried=useRef(new Set<string>());
  const latest=useRef({candidates,allowSwitch,initial});latest.current={candidates,allowSwitch,initial};
  useEffect(()=>{
    const src=trackSource(media,track);
    if(!enabled||!track){setResult({status:'off',observed:0});return;}
    if(!src){setResult({track,status:'embedded',observed:0});return;}
    if(!supported){setResult({track,alignment:latest.current.initial,status:'unsupported',observed:0});return;}
    let cancelled=false,current=latest.current.initial,busy=false,timer:ReturnType<typeof setTimeout>;
    setResult({track,alignment:current,status:current?'synced':'listening',observed:timeline.current.observed});
    const run=async()=>{
      if(busy)return;busy=true;
      try{
        const observed=timeline.current.observed,estimate=estimateAlignment(await loadCues(src),timeline.current);
        if(cancelled)return;
        // Hysteresis: keep a confident alignment unless the new one is clearly different and as trustworthy.
        if(estimate&&(!current||Math.abs(estimate.offset-current.offset)>.15||estimate.scale!==current.scale)&&estimate.confidence>=Math.min(.8,(current?.confidence??0)*.8))current=estimate;
        else if(estimate&&current)current={...current,confidence:Math.max(current.confidence,estimate.confidence),observed};
        let better:TextTrack|undefined;
        // Several minutes of dialogue with no match: this release doesn't fit, so look for one that does.
        if(!estimate&&observed>=150&&latest.current.allowSwitch&&!tried.current.has(src)){
          tried.current.add(src);
          for(const candidate of latest.current.candidates){
            const candidateSrc=trackSource(media,candidate);
            if(!candidateSrc||candidate===track||tried.current.has(candidateSrc))continue;
            const alignment=await loadCues(candidateSrc).then(cues=>estimateAlignment(cues,timeline.current)).catch(()=>undefined);
            if(cancelled)return;
            if(alignment&&alignment.confidence>=.7){better=candidate;break;}
          }
        }
        setResult({track,alignment:current,status:current?'synced':observed>=240?'no-match':'listening',observed,better});
      }catch{/* A subtitle that fails to download is handled by the track error path. */}
      finally{busy=false;if(!cancelled)timer=setTimeout(run,current&&current.confidence>=.8&&current.observed>=180?60000:15000);}
    };
    timer=setTimeout(run,5000);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[media,enabled,track,supported,timeline]);
  return result.track===track?result:{status:enabled?'listening' as AutoSyncStatus:'off' as AutoSyncStatus,observed:0};
}
