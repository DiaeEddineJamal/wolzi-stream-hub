import { useCallback, useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';
import { audioOption, enableNativeAudio, nativeAudioTracks, type AudioOption, type NativeAudioList } from '@/lib/audio-tracks';

export function useAudioTracks(media:HTMLVideoElement|null,engine:Hls|null,originalLanguage='') {
  const [tracks,setTracks]=useState<AudioOption[]>([]);
  const [selected,setSelected]=useState(-1);
  const [error,setError]=useState('');
  const refresh=useRef<()=>void>(()=>{});
  useEffect(()=>{
    setError('');setTracks([]);setSelected(-1);
    let native:NativeAudioList|undefined;
    const update=()=>{
      if(engine?.audioTracks.length){
        setTracks(engine.audioTracks.map((track,index)=>audioOption(index,track.lang,track.name,originalLanguage,track.characteristics||track.attrs?.CHARACTERISTICS,track.channels)));
        setSelected(engine.audioTrack);
      }else{
        const next=nativeAudioTracks(media);
        if(next!==native){
          detach();native=next;
          ['addtrack','removetrack','change'].forEach(event=>native?.addEventListener(event,update));
        }
        const all=Array.from(native||[]);
        setTracks(all.map((track,index)=>audioOption(index,track.language,track.label,originalLanguage,track.kind)));
        setSelected(all.findIndex(track=>track.enabled));
      }
    };
    const detach=()=>['addtrack','removetrack','change'].forEach(event=>native?.removeEventListener(event,update));
    refresh.current=update;
    const events=engine?(engine.constructor as typeof Hls).Events:null;
    if(events){
      engine.on(events.AUDIO_TRACKS_UPDATED,update);
      engine.on(events.AUDIO_TRACK_SWITCHED,update);
      engine.on(events.MANIFEST_PARSED,update);
    }
    ['loadedmetadata','loadeddata','emptied'].forEach(event=>media?.addEventListener(event,update));
    update();
    return()=>{
      detach();refresh.current=()=>{};
      ['loadedmetadata','loadeddata','emptied'].forEach(event=>media?.removeEventListener(event,update));
      if(events){engine.off(events.AUDIO_TRACKS_UPDATED,update);engine.off(events.AUDIO_TRACK_SWITCHED,update);engine.off(events.MANIFEST_PARSED,update);}
    };
  },[media,engine,originalLanguage]);
  const choose=useCallback((index:number)=>{
    setError('');
    try{
      if(engine?.audioTracks.length){
        if(!Number.isInteger(index)||!engine.audioTracks[index])throw new Error('That audio track is no longer available.');
        engine.audioTrack=index;
      }else{
        const native=nativeAudioTracks(media);
        if(!native)throw new Error('Additional audio is not available in this source or browser.');
        enableNativeAudio(native,index);
      }
      refresh.current();
    }catch(e){setError(e instanceof Error?e.message:'Audio could not switch. Try another track.');}
  },[engine,media]);
  return {tracks,selected,error,choose};
}
