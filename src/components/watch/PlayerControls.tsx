import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject, type ReactNode } from 'react';
import type Hls from 'hls.js';
import type { BufferAppendedData } from 'hls.js';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Maximize, Minimize, Pause, PictureInPicture2, Play, RotateCcw, RotateCw, Settings2, SkipForward, Star, Subtitles, Upload, Volume2, VolumeX, X } from 'lucide-react';
import { preferredSubtitleIndex, subtitleCodeBadge, subtitleFlagUrl, subtitleLanguage, subtitleNativeLanguage } from '@/lib/subtitles';
import { activateCaptionTrack, applyCaptionTiming, captionPreferences, defaultCaptions, hlsSubtitleOffset, nextEpisodeDue, nextEpisodeProgress, type CaptionTiming } from '@/lib/captions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { detectQualityTier, QUALITY_BADGES } from './SourcePicker';
import CaptionSettings from './CaptionSettings';
import { useAudioTracks } from '@/hooks/useAudioTracks';
export interface NextEpisode {label:string;image?:string;eyebrow?:string;onPlay:()=>void}
export interface PlayerIdleMeta {
  title:string;
  logoUrl?:string;
  subtitle?:string;
  episodeCode?:string;
  year?:string;
  rating?:number;
  contentRating?:string;
  description?:string;
  backdropUrl?:string;
}
interface Props {originalAudioLanguage?:string;captionKey?:string;media:HTMLVideoElement|null;engine:Hls|null;container:RefObject<HTMLDivElement>;title:string;sourceName:string;loading:boolean;nextEpisode?:NextEpisode;autoNext?:boolean;onAutoNextChange?:(value:boolean)=>void;onNextSource?:()=>void;onOpenSources?:()=>void;onUpload:(file:File)=>Promise<void>;subtitleStatus?:string;converted:boolean;onCompatibility?:()=>void;idleMeta?:PlayerIdleMeta}
const clock=(seconds:number)=>{const value=Math.max(0,Math.floor(seconds||0));return value>=3600?`${Math.floor(value/3600)}:${String(Math.floor(value/60)%60).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`:`${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;};
const qualityBadgeForHeight=(h?:number)=>!h?undefined:h>=2160?'/badges/4k.png':h>=1080?'/badges/1080p.png':h>=720?'/badges/720p.png':h>=480?'/badges/480p.png':'/badges/360p.png';
export default function PlayerControls({originalAudioLanguage,captionKey='video',media,engine,container,title,sourceName,loading,nextEpisode,autoNext,onAutoNextChange,onNextSource,onOpenSources,onUpload,subtitleStatus,converted,onCompatibility,idleMeta}:Props){
  const [compact,setCompact]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width:767px)').matches);
  useEffect(()=>{const query=window.matchMedia('(max-width:767px)');const update=()=>setCompact(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const touchControls=compact||(typeof window!=='undefined'&&window.matchMedia('(pointer: coarse)').matches);
  const [state,setState]=useState({time:0,duration:0,buffered:0,paused:true,volume:1,muted:false,rate:1,ended:false});
  const [visible,setVisible]=useState(true),[menu,setMenu]=useState<'settings'|'subtitles'|null>(null),[fullscreen,setFullscreen]=useState(false),[hint,setHint]=useState('');
  const [tracks,setTracks]=useState<TextTrack[]>([]),[trackIndex,setTrackIndex]=useState(-1),[quality,setQuality]=useState(-1),[languageQuery,setLanguageQuery]=useState('');
  const audio=useAudioTracks(media,engine,originalAudioLanguage);
  const [scrub,setScrub]=useState<number|null>(null),[countdown,setCountdown]=useState(5),[dismissNext,setDismissNext]=useState(false);
  const dragging=useRef(false),timer=useRef<ReturnType<typeof setTimeout>>(),menuRef=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null);
  const advanced=useRef(false);
  const selectedCaption=useRef<TextTrack|null>();
  const [storedCaptions,saveCaptionStyle]=useLocalStorage<unknown>('admax-captions',defaultCaptions);
  const [offsets,saveOffsets]=useLocalStorage<Record<string,number>>('admax-caption-offsets',{});
  const syncKey=captionKey+'|'+(tracks[trackIndex]?.id||tracks[trackIndex]?.label||'default');
  const captions=useMemo(()=>({...captionPreferences(storedCaptions),delay:captionPreferences({delay:offsets[syncKey]}).delay}),[storedCaptions,offsets,syncKey]);
  const setCaptions=(value:typeof defaultCaptions)=>{saveCaptionStyle({...value,delay:0});saveOffsets(previous=>({...previous,[syncKey]:value.delay}));};
  const cueTimes=useRef(new WeakMap<object,CaptionTiming>());
  const [timelineOffset,setTimelineOffset]=useState(0);
  const cueLines=useRef(new WeakMap<VTTCue,{line:VTTCue['line'];snap:boolean}>());
  const wake=useCallback(()=>{setVisible(true);clearTimeout(timer.current);timer.current=setTimeout(()=>{if(!dragging.current)setVisible(false);},touchControls?1800:3500);},[touchControls]);
  useEffect(()=>{if(!state.paused&&!loading)wake();},[state.paused,loading,wake]);
  const toggle=useCallback(()=>{if(!media)return;if(media.paused)void media.play().catch(()=>setHint('Press play again when the source is ready.'));else media.pause();wake();},[media,wake]);
  const lastTouch=useRef(false);
  const onSurfaceClick=useCallback(()=>{
    const touch=touchControls||lastTouch.current;
    lastTouch.current=false;
    if(touch){
      if(visible){clearTimeout(timer.current);setVisible(false);setMenu(null);}
      else wake();
      return;
    }
    toggle();
  },[touchControls,visible,wake,toggle]);
  const playNextEpisode=useCallback(()=>{if(!nextEpisode)return;if(media&&!media.paused)void media.play().catch(()=>{});nextEpisode.onPlay();},[nextEpisode,media]);
  const seek=useCallback((time:number)=>{if(media&&Number.isFinite(media.duration)){const position=Math.min(media.duration,Math.max(0,time));media.currentTime=position;setState(previous=>({...previous,time:position,ended:false}));}},[media]);
  const toggleFullscreen=useCallback(()=>{const stage=container.current;if(!stage)return;if(document.fullscreenElement)void document.exitFullscreen().catch(()=>setHint('Fullscreen could not close.'));else if(stage.requestFullscreen)void stage.requestFullscreen().catch(()=>setHint('Fullscreen is unavailable in this browser.'));else if('webkitEnterFullscreen' in (media||{}))(media as HTMLVideoElement&{webkitEnterFullscreen:()=>void}).webkitEnterFullscreen();},[container,media]);
  useEffect(()=>{
    setMenu(null);setDismissNext(false);setCountdown(5);
    selectedCaption.current=undefined;
    if(!media)return;
    const update=()=>setState({time:media.currentTime,duration:Number.isFinite(media.duration)?media.duration:0,buffered:media.buffered.length?media.buffered.end(media.buffered.length-1):0,paused:media.paused,volume:media.volume,muted:media.muted,rate:media.playbackRate,ended:media.ended});
    const updateTracks=()=>{
      const elements=Array.from(media.querySelectorAll('track'));
      elements.filter(element=>element.readyState===3).forEach(element=>{element.track.mode='disabled';});
      const external=new Set(elements.map(element=>element.track));
      // DOM order reflects release ranking even when a slower provider inserts tracks.
      // Embedded tracks belong to the playing file and are preferred ahead of downloads.
      const all=[...Array.from(media.textTracks).filter(track=>!external.has(track)),...elements.filter(element=>element.readyState!==3).map(element=>element.track)].filter(track=>track.kind==='subtitles'||track.kind==='captions');
      if(selectedCaption.current&&!all.includes(selectedCaption.current))selectedCaption.current=undefined;
      let selected=selectedCaption.current===null?-1:selectedCaption.current?all.indexOf(selectedCaption.current):all.findIndex(t=>t.mode==='showing');
      if(selectedCaption.current===undefined){
        try{
          const preferred=localStorage.getItem('admax-subtitle-language');
          selected=preferredSubtitleIndex(all,preferred);
        }catch{/* Storage is optional. */}
        // Keep auto-selection open while slower providers add the preferred language.
      }
      activateCaptionTrack(all,selected);setTracks(all);setTrackIndex(selected);
    };
    const events=['timeupdate','loadedmetadata','durationchange','progress','volumechange','play','pause','ratechange','ended'];events.forEach(event=>media.addEventListener(event,update));
    let errorTimer:ReturnType<typeof setTimeout>;
    // Some browsers dispatch the track error before exposing readyState=ERROR.
    const trackError=(event:Event)=>{if(event.target instanceof HTMLTrackElement){clearTimeout(errorTimer);errorTimer=setTimeout(updateTracks,0);}};
    media.addEventListener('error',trackError,true);
    media.textTracks.addEventListener('addtrack',updateTracks);media.textTracks.addEventListener('removetrack',updateTracks);media.textTracks.addEventListener('change',updateTracks);media.addEventListener('admax:subtitleerror',updateTracks);update();updateTracks();
    const orderObserver=new MutationObserver(updateTracks);orderObserver.observe(media,{childList:true});
    return()=>{clearTimeout(errorTimer);media.removeEventListener('error',trackError,true);orderObserver.disconnect();events.forEach(event=>media.removeEventListener(event,update));media.textTracks.removeEventListener('addtrack',updateTracks);media.textTracks.removeEventListener('removetrack',updateTracks);media.textTracks.removeEventListener('change',updateTracks);media.removeEventListener('admax:subtitleerror',updateTracks);};
  },[media,captionKey]);
  useEffect(()=>{if(!engine)return;const events=(engine.constructor as typeof Hls).Events;const update=()=>setQuality(engine.autoLevelEnabled?-1:engine.currentLevel);engine.on(events.LEVEL_SWITCHED,update);update();return()=>{engine.off(events.LEVEL_SWITCHED,update);};},[engine]);
  useEffect(()=>{
    setTimelineOffset(0);
    if(!engine)return;
    const events=(engine.constructor as typeof Hls).Events;
    let aligned=false,playingFragment='';
    const align=(_:unknown,{frag}:Pick<BufferAppendedData,'frag'>)=>{
      const offset=hlsSubtitleOffset(frag);
      if(offset===undefined)return;
      // Buffered future segments must not change the timing of the current scene.
      if(!aligned||playingFragment===`${frag.cc}:${frag.sn}`){aligned=true;setTimelineOffset(offset);}
    };
    const changed=(_:unknown,data:Pick<BufferAppendedData,'frag'>)=>{playingFragment=`${data.frag.cc}:${data.frag.sn}`;aligned=false;align(_,data);};
    engine.on(events.BUFFER_APPENDED,align);engine.on(events.FRAG_CHANGED,changed);
    return()=>{engine.off(events.BUFFER_APPENDED,align);engine.off(events.FRAG_CHANGED,changed);};
  },[engine,media]);
  useEffect(()=>{
    const stage=container.current;if(!stage)return;
    const change=()=>{const full=document.fullscreenElement===stage;setFullscreen(full);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)stage.animate?.([{opacity:.72,transform:`scale(${full ? .985 : 1.015})`},{opacity:1,transform:'scale(1)'}],{duration:300,easing:'cubic-bezier(.2,.7,.3,1)'});};
    const key=(e:KeyboardEvent)=>{if(!stage.contains(document.activeElement)&&document.fullscreenElement!==stage)return;if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement)return;if(e.key==='Escape'){setMenu(null);return;}if((e.code==='Space'&&!(e.target instanceof HTMLButtonElement))||e.key.toLowerCase()==='k'){e.preventDefault();toggle();}else if(e.key==='ArrowRight'||e.key.toLowerCase()==='l'){e.preventDefault();seek((media?.currentTime||0)+10);wake();}else if(e.key==='ArrowLeft'||e.key.toLowerCase()==='j'){e.preventDefault();seek((media?.currentTime||0)-10);wake();}else if(e.key.toLowerCase()==='m'&&media){media.muted=!media.muted;}else if(e.key.toLowerCase()==='f'){e.preventDefault();toggleFullscreen();}};
    const outside=(e:PointerEvent)=>{if(menuRef.current&&!menuRef.current.contains(e.target as Node)&&!(e.target as HTMLElement).closest('[data-player-menu]'))setMenu(null);};
    const onPointerMove=(e:PointerEvent)=>{if(e.pointerType!=='touch')wake();};
    document.addEventListener('fullscreenchange',change);window.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);stage.addEventListener('pointermove',onPointerMove);stage.addEventListener('focusin',wake);
    return()=>{document.removeEventListener('fullscreenchange',change);window.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);stage.removeEventListener('pointermove',onPointerMove);stage.removeEventListener('focusin',wake);clearTimeout(timer.current);};
  },[media,container,wake,toggle,seek,toggleFullscreen]);
  const hasNextEpisode=!!nextEpisode;
  useEffect(()=>{setDismissNext(false);setCountdown(5);advanced.current=false;},[nextEpisode?.label,nextEpisode?.eyebrow,title]);
  useEffect(()=>{if(!state.ended){advanced.current=false;setCountdown(5);}},[state.ended]);
  useEffect(()=>{if(!state.ended||!hasNextEpisode||!autoNext||dismissNext)return;const interval=setInterval(()=>setCountdown(value=>Math.max(0,value-1)),1000);return()=>clearInterval(interval);},[state.ended,hasNextEpisode,autoNext,dismissNext]);
  useEffect(()=>{if(countdown===0&&state.ended&&autoNext&&!dismissNext&&!advanced.current){advanced.current=true;playNextEpisode();}},[countdown,state.ended,autoNext,dismissNext,playNextEpisode]);
  const show=visible||!!menu||(!touchControls&&(state.paused||loading));
  useEffect(()=>{
    const stage=container.current;if(!media||!stage)return;
    stage.style.setProperty('--caption-scale',String(captions.size/100));stage.style.setProperty('--caption-color',captions.color);
    const position=()=>{
      const controlHeight=stage.querySelector<HTMLElement>('.cinema-bottom')?.offsetHeight||90;
      const available=show?Math.max(20,100-(controlHeight+12)/Math.max(1,media.clientHeight)*100):94;
      // HLS already maps its own tracks; only standalone files need the stream offset.
      const external=new Set(Array.from(media.querySelectorAll('track')).map(element=>element.track));
      tracks.filter(track=>track.mode!=='disabled').forEach(track=>Array.from(track.cues||[]).forEach(cue=>{
      applyCaptionTiming(cue,captions.delay+(external.has(track)?timelineOffset:0),cueTimes.current);
      if(!(cue instanceof VTTCue))return;
      if(!cueLines.current.has(cue))cueLines.current.set(cue,{line:cue.line,snap:cue.snapToLines});
      const line=cueLines.current.get(cue)!;
      const custom=line.line==='auto'||captions.position!==90;
      const target=custom?Math.min(captions.position,available):line.line;
      if(cue.snapToLines!==(custom?false:line.snap))cue.snapToLines=custom?false:line.snap;
      if(cue.line!==target)cue.line=target;
      }));
    };
    tracks.forEach(track=>track.addEventListener('cuechange',position));media.addEventListener('load',position,true);media.addEventListener('loadeddata',position);media.addEventListener('seeked',position);position();
    const interval=setInterval(position,1000);
    return()=>{clearInterval(interval);tracks.forEach(track=>track.removeEventListener('cuechange',position));media.removeEventListener('load',position,true);media.removeEventListener('loadeddata',position);media.removeEventListener('seeked',position);};
  },[tracks,show,captions,media,container,timelineOffset]);
  const progress=state.duration?((scrub??state.time)/state.duration)*100:0;
  const chooseTrack=(index:number)=>{selectedCaption.current=index>=0?tracks[index]:null;activateCaptionTrack(tracks,index);setTrackIndex(index);try{localStorage.setItem('admax-subtitle-language',index<0?'off':tracks[index].language);}catch{/* Playback works without storage. */}};
  const upload=async(file?:File)=>{if(!file)return;try{await onUpload(file);setHint('Subtitle added.');}catch(e){setHint(e instanceof Error?e.message:'Subtitle could not load.');}};
  const nextProgress=nextEpisode?nextEpisodeProgress(state.duration,state.time,state.ended,countdown,!!autoNext):0;
  const sourceTier=detectQualityTier(sourceName);
  const sourceBadge=QUALITY_BADGES[sourceTier]?.icon||qualityBadgeForHeight(media?.videoHeight);
  const showPausedIdle=Boolean(show&&idleMeta&&state.paused&&!state.ended&&!loading&&!menu&&scrub==null);
  // Fixed mobile menus must escape the player's clipped backdrop and stacking context.
  const renderMenu=(content:ReactNode)=>compact&&!fullscreen?createPortal(content,document.body):content;
  return <div className={`cinema-controls ${show?'is-visible':''} ${showPausedIdle?'is-paused-idle':''}`} data-menu-open={!!menu} data-touch-controls={touchControls}>
    <button className="player-click-surface" tabIndex={-1} aria-label={touchControls?(show?'Hide playback controls':'Show playback controls'):(state.paused?'Play video':'Pause video')} onPointerDown={e=>{lastTouch.current=e.pointerType==='touch';}} onClick={onSurfaceClick} onDoubleClick={touchControls?undefined:toggleFullscreen}/>
    {showPausedIdle&&idleMeta&&<div className="cinema-pause-idle" aria-hidden="true">
      {idleMeta.backdropUrl&&<img className="cinema-pause-watermark" src={idleMeta.backdropUrl} alt=""/>}
      <div className="cinema-pause-content">
        {idleMeta.logoUrl?<img className="cinema-pause-logo" src={idleMeta.logoUrl} alt={idleMeta.title}/>:<h2 className="cinema-pause-title">{idleMeta.title}</h2>}
        {idleMeta.subtitle&&<h3 className="cinema-pause-subtitle">{idleMeta.subtitle}</h3>}
        <div className="cinema-pause-meta">
          {idleMeta.year&&<span>{idleMeta.year}</span>}
          {idleMeta.rating!=null&&idleMeta.rating>0&&<span className="cinema-pause-rating"><Star size={12} fill="currentColor"/>{idleMeta.rating.toFixed(1)}</span>}
          {idleMeta.contentRating&&<span className="cinema-pause-badge">{idleMeta.contentRating}</span>}
          {idleMeta.episodeCode&&<span>{idleMeta.episodeCode}</span>}
          {sourceBadge&&<img src={sourceBadge} alt="" className="cinema-pause-qbadge"/>}
        </div>
        {idleMeta.description&&<p className="cinema-pause-desc">{idleMeta.description}</p>}
      </div>
    </div>}
    <header className="cinema-topbar">
      <div className="cinema-topbar-title">
        <span>{idleMeta?.episodeCode?`NOW PLAYING · ${idleMeta.episodeCode}`:'NOW PLAYING'}</span>
        <h2>{title}{idleMeta?.subtitle?` — ${idleMeta.subtitle}`:''}</h2>
      </div>
      <button className="cinema-source-label" aria-label={`Change source: ${sourceName}`} onClick={onOpenSources||onNextSource}>
        {sourceBadge&&<img src={sourceBadge} alt="" className="cinema-source-qbadge"/>}
        <span>{sourceName}</span>
        <ChevronRight size={14}/>
      </button>
    </header>
    {!state.ended&&!loading&&(state.paused||visible)&&<button className={state.paused?'cinema-center-play':'cinema-center-play is-playing'} aria-label={state.paused?'Play':'Pause'} onClick={toggle}>{state.paused?<Play fill="currentColor" size={33}/>:<Pause fill="currentColor" size={31}/>}</button>}
    {!state.ended&&!loading&&show&&<div className="cinema-mobile-transport">
      <button className="cinema-skip" aria-label="Rewind 10 seconds" onClick={()=>{seek((media?.currentTime||0)-10);wake();}}><RotateCcw size={28}/><small>10</small></button>
      <button className="cinema-mobile-play" onPointerDown={event=>event.stopPropagation()} aria-label={state.paused?'Play':'Pause'} onClick={event=>{event.stopPropagation();toggle();}}>{state.paused?<Play fill="currentColor" size={30}/>:<Pause fill="currentColor" size={28}/>}</button>
      <button className="cinema-skip" aria-label="Forward 10 seconds" onClick={()=>{seek((media?.currentTime||0)+10);wake();}}><RotateCw size={28}/><small>10</small></button>
    </div>}
    <div className="cinema-bottom">
      <div className="cinema-timeline">
        <div className="cinema-buffered" style={{width:`${state.duration?state.buffered/state.duration*100:0}%`}}/>
        <input aria-label="Seek video" type="range" min={0} max={state.duration||100} step={1} value={scrub??state.time} aria-valuetext={`${clock(scrub??state.time)} of ${clock(state.duration)}`} style={{'--played':progress+'%'} as CSSProperties} onPointerDown={()=>{dragging.current=true;setScrub(state.time);}} onChange={e=>{const time=Number(e.target.value);if(dragging.current)setScrub(time);else seek(time);}} onPointerUp={e=>{seek(Number(e.currentTarget.value));dragging.current=false;setScrub(null);}} onPointerCancel={()=>{dragging.current=false;setScrub(null);}} onBlur={()=>{if(scrub!=null)seek(scrub);dragging.current=false;setScrub(null);}}/>
        {scrub!=null&&<span className="cinema-seek-time" style={{left:`${Math.max(4,Math.min(95,progress))}%`}}>{clock(scrub)}</span>}
      </div>
      <div className="cinema-toolbar">
        <div className="cinema-toolbar-start">
          <button aria-label={state.paused?'Play':'Pause'} onClick={toggle}>{state.paused?<Play size={22} fill="currentColor"/>:<Pause size={22} fill="currentColor"/>}</button>
          <button className="cinema-skip" aria-label="Rewind 10 seconds" onClick={()=>seek((media?.currentTime||0)-10)}><RotateCcw size={24}/><small>10</small></button>
          <button className="cinema-skip" aria-label="Forward 10 seconds" onClick={()=>seek((media?.currentTime||0)+10)}><RotateCw size={24}/><small>10</small></button>
          <div className="cinema-volume">
            <button aria-label={state.muted?'Unmute':'Mute'} onClick={()=>{if(media)media.muted=!media.muted;}}>{state.muted||state.volume===0?<VolumeX size={21}/>:<Volume2 size={21}/>}</button>
            <input type="range" aria-label="Volume" min={0} max={1} step={.05} value={state.muted?0:state.volume} onChange={e=>{if(media){media.muted=false;media.volume=Number(e.target.value);}}}/>
          </div>
          <span className="cinema-clock">{clock(state.time)}<i>/</i>{state.duration?`-${clock(Math.max(0,state.duration-state.time))}`:'0:00'}</span>
        </div>
        <div className="cinema-toolbar-end">
          {nextEpisode&&<button aria-label="Next episode" onClick={playNextEpisode}><SkipForward size={21}/></button>}
          <button aria-label="Audio and subtitles" aria-expanded={menu==='subtitles'} data-caption-active={trackIndex>=0} data-player-menu onClick={()=>{setMenu(menu==='subtitles'?null:'subtitles');setVisible(true);}}><Subtitles size={22}/></button>
          <button aria-label="Playback settings" aria-expanded={menu==='settings'} data-player-menu onClick={()=>{setMenu(menu==='settings'?null:'settings');setVisible(true);}}><Settings2 size={21}/></button>
          {document.pictureInPictureEnabled&&<button className="cinema-pip" aria-label="Picture in picture" onClick={()=>{if(!media)return;if(document.pictureInPictureElement)void document.exitPictureInPicture();else void media.requestPictureInPicture().catch(()=>setHint('Picture in picture is unavailable for this video.'));}}><PictureInPicture2 size={21}/></button>}
          <button aria-label={fullscreen?'Exit fullscreen':'Enter fullscreen'} onClick={toggleFullscreen}>{fullscreen?<Minimize size={22}/>:<Maximize size={22}/>}</button>
        </div>
      </div>
    </div>
    {menu&&renderMenu(<div ref={menuRef} className="cinema-menu glass-popup" role="dialog" aria-label={menu==='subtitles'?'Audio and subtitles':'Playback settings'}>
      <header><h3>{menu==='subtitles'?'Audio & Subtitles':'Playback Settings'}</h3><button aria-label="Close player menu" onClick={()=>setMenu(null)}><X size={16}/></button></header>
      {menu==='subtitles'?<>
        <p className="cinema-menu-label">AUDIO TRACKS</p>
        {audio.tracks.length?audio.tracks.map(track=><button className="cinema-menu-option" key={track.index} aria-pressed={audio.selected===track.index} onClick={()=>audio.choose(track.index)}><span>{track.label}</span>{audio.selected===track.index&&<Check size={15}/>}</button>):<p className="cinema-menu-note">Playing source audio. Additional languages are not exposed by this source or browser.</p>}
        {audio.tracks.length>1&&<p className="cinema-menu-note">Choose original audio or an available dub. Subtitles can be selected separately below.</p>}
        {audio.error&&<p className="cinema-menu-note" role="status">{audio.error}</p>}
        <div className="flex items-center justify-between"><p className="cinema-menu-label">SUBTITLE TRACKS</p><span className="text-[10px] text-white/50">{tracks.length} available</span></div>
        <input className="caption-search" aria-label="Filter subtitle languages" placeholder="Search language (English, Arabic, Français, Español…)" value={languageQuery} onChange={e=>setLanguageQuery(e.target.value)}/>
        <div className="cinema-caption-list">
          <button className="cinema-menu-option" aria-pressed={trackIndex===-1} onClick={()=>chooseTrack(-1)}>
            <span className="caption-lang-row"><span className="caption-lang-code">OFF</span><span>Subtitles Off</span></span>
            {trackIndex===-1&&<Check size={15}/>}
          </button>
          {tracks.map((track,index)=>({track,index})).filter(({track})=>{
            const en=subtitleLanguage(track.language);
            const nat=subtitleNativeLanguage(track.language);
            return (track.label+' '+en+' '+nat+' '+track.language).toLowerCase().includes(languageQuery.toLowerCase());
          }).map(({track,index})=>{
            const en=subtitleLanguage(track.language);
            const nat=subtitleNativeLanguage(track.language);
            const flag=subtitleFlagUrl(track.language);
            const badge=subtitleCodeBadge(track.language);
            return <button className="cinema-menu-option" key={index} aria-pressed={trackIndex===index} onClick={()=>chooseTrack(index)}>
              <span className="caption-lang-row">
                {flag?<img src={flag} alt="" className="caption-flag" loading="lazy"/>:<span className="caption-lang-code">{badge}</span>}
                <span className="caption-lang-text">
                  <strong>{en}{nat&&nat.toLowerCase()!==en.toLowerCase()?` · ${nat}`:''}</strong>
                  <small>{track.label||'Embedded'} · {badge}</small>
                </span>
              </span>
              {trackIndex===index&&<Check size={15}/>}
            </button>;
          })}
        </div>
        {subtitleStatus&&<p className="cinema-menu-note">{subtitleStatus}</p>}
        <CaptionSettings value={captions} onChange={setCaptions}/>
        <button className="cinema-menu-upload" onClick={()=>fileInput.current?.click()}><Upload size={15}/>Upload custom subtitle (.srt, .vtt, .ass)</button>
        <input ref={fileInput} className="sr-only" tabIndex={-1} type="file" accept=".vtt,.srt,.ass,.ssa" onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/>
      </>:<>
        <p className="cinema-menu-label">VIDEO QUALITY</p>
        {engine?.levels?.length?<div className="cinema-quality-options">
          <button aria-pressed={quality===-1} onClick={()=>{engine.currentLevel=-1;setQuality(-1);}}>Auto</button>
          {engine.levels.map((level,index)=>{
            const qIcon=qualityBadgeForHeight(level.height);
            return <button key={index} aria-pressed={quality===index} onClick={()=>{engine.currentLevel=index;setQuality(index);}}>
              {qIcon&&<img src={qIcon} alt="" className="h-3.5 w-auto"/>}
              <span>{level.height?level.height+'p':engine.levels.length===1?(media?.videoHeight?media.videoHeight+'p':'Source quality'):'Stream '+(index+1)}</span>
            </button>;
          })}
        </div>:<div className="cinema-quality-note">
          {sourceBadge&&<img src={sourceBadge} alt="" className="h-5 w-auto"/>}
          <span>Original Stream{media?.videoHeight?` · ${media.videoHeight}p`:""}</span>
        </div>}
        <p className="cinema-menu-label">PLAYBACK SPEED</p>
        <div className="cinema-speed-options">{[.5,.75,1,1.25,1.5,2].map(rate=><button key={rate} aria-pressed={state.rate===rate} onClick={()=>{if(media)media.playbackRate=rate;}}>{rate}×</button>)}</div>
        {nextEpisode&&<button className="cinema-menu-option" role="switch" aria-checked={!!autoNext} onClick={()=>onAutoNextChange?.(!autoNext)}><span>Autoplay next episode</span><span className={`cinema-toggle ${autoNext?'on':''}`}/></button>}
        {onCompatibility&&<button className="cinema-menu-option" onClick={onCompatibility}><span>{converted?'Browser-compatible mode':'Convert for this browser'}</span>{converted&&<Check size={15}/>}</button>}
        <button className="cinema-menu-option" onClick={()=>{(onOpenSources||onNextSource)?.();setMenu(null);}}><span>Switch server / resolution</span><ChevronRight size={15}/></button>
      </>}
    </div>)}
    {nextEpisode&&!dismissNext&&nextEpisodeDue(state.duration,state.time,state.ended)&&<aside className="cinema-next-up" aria-label="Up next">
      <button className="cinema-next-close" aria-label="Dismiss next episode" onClick={()=>setDismissNext(true)}><X size={14}/></button>
      <div className="cinema-next-thumb" onClick={playNextEpisode}>
        <img className="cinema-next-art" src={nextEpisode.image||'/poster-placeholder.svg'} alt=""/>
        <span className="cinema-next-thumb-play" aria-hidden="true"><Play size={16} fill="currentColor"/></span>
      </div>
      <div className="cinema-next-copy">
        <span className="cinema-next-eyebrow">UP NEXT{state.ended&&autoNext?` · ${countdown}S`:nextEpisode.eyebrow?` · ${nextEpisode.eyebrow.toUpperCase()}`:''}</span>
        <h3>{nextEpisode.label}</h3>
        <div className="cinema-next-actions">
          <button className="cinema-next-play" onClick={playNextEpisode} style={{'--next-fill':`${Math.round(nextProgress*100)}%`} as CSSProperties}>
            <span className="cinema-next-play-fill" aria-hidden="true"/>
            <span className="cinema-next-play-label"><Play size={13} fill="currentColor"/>{state.ended&&autoNext?`Watch Next · ${countdown}s`:'Watch Next'}</span>
          </button>
        </div>
      </div>
      <div className="cinema-next-progress" role="progressbar" aria-label={autoNext?'Next episode countdown':'Current episode ending'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(nextProgress*100)}><span style={{transform:'scaleX('+nextProgress+')'}}/></div>
    </aside>}
    {hint&&<div className="cinema-toast" role="status">{hint}<button aria-label="Dismiss notice" onClick={()=>setHint('')}><X size={14}/></button></div>}
  </div>;
}
