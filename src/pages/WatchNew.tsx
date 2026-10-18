import { ChoiceSelect } from '@/components/ui/select';
import { useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, ExternalLink, Layers, Play, Plus, SkipForward } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useArtworkTheme } from '@/hooks/useArtworkTheme';
import StreamingPlayer from '@/components/watch/StreamingPlayer';
import { SourcePicker, SourcePickerSheet } from '@/components/watch/SourcePicker';
import LoadingState from '@/components/primitives/LoadingState';
import { Button } from '@/components/ui/button';


import tmdbApi, { getBackdropUrl } from '@/integrations/api/tmdb';
import { addonStreams, supportsResource } from '@/integrations/api/stremio';
import { useSubtitles } from '@/hooks/useSubtitles';
import { useAddons } from '@/hooks/useAddons';
import { useResolvedSources } from '@/hooks/useResolvedSources';
import { usePlaybackSelection } from '@/hooks/usePlaybackSelection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toMediaItem, watchPath } from '@/lib/media';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { resumeSeconds } from '@/lib/watch-progress';
import { toast } from 'sonner';
export default function WatchNew(){ const {pathname,search}=useLocation();return <WatchSession key={pathname+search}/>; }
function WatchSession(){
  const {id,season:seasonParam,episode:episodeParam}=useParams();
  const [params]=useSearchParams();
  const location=useLocation();
  const navigate=useNavigate();
  const type=location.pathname.includes('/movie/')?'movie':location.pathname.includes('/anime/')?'anime':'tv';
  const season=Math.max(1,Number(seasonParam || params.get('season'))||1), episode=Math.max(1,Number(episodeParam)||1);

  const [sourcesOpen,setSourcesOpen]=useState(false);
  const [autoNext,setAutoNext]=useLocalStorage('admax-auto-next',false);
  const resume=true;
  const {addons}=useAddons();
  const [service]=useLocalStorage<string>('admax-streaming-service','');
  const [scan,setScan]=useState(0);
  const resolved=useResolvedSources(type,id,season,episode,typeof service==='string'?service:undefined,scan);
  const {user}=useAuth();
  const {has,toggle}=useWatchlist();
  const warned=useRef(false);
  const {items:watched,save:saveProgress}=usePlaybackHistory();
  const details=useQuery({queryKey:['detail',type,id],queryFn:async()=>(await(type==='movie'?tmdbApi.getMovieDetails(Number(id)):tmdbApi.getTVShowDetails(Number(id)))).data});
  const episodes=useQuery({queryKey:['episodes',id,season],enabled:type!=='movie',queryFn:async()=>(await tmdbApi.getTVSeasonDetails(Number(id),season)).data});
  const imdb=details.data?.imdb_id || details.data?.external_ids?.imdb_id;
  const streamId=type==='movie'?imdb:`${imdb}:${season}:${episode}`;
  const addonResults=useQuery({queryKey:['addon-streams',addons,streamId,service],enabled:!!imdb&&addons.some(a=>a.enabled),queryFn:async({signal})=>{
    const eligible=addons.filter(a=>a.enabled&&supportsResource(a.manifest,'stream',type==='movie'?'movie':'series',streamId));
    return Promise.all(eligible.map(async addon=>{
      try{return {name:addon.manifest.name,streams:await addonStreams(addon,type==='movie'?'movie':'series',streamId,signal,typeof service==='string'?service:undefined),error:false};}
      catch{return {name:addon.manifest.name,streams:[],error:true};}
    }));
  }});
  const subtitles=useSubtitles(type==='movie'?'movie':'series',imdb?streamId:undefined);
  const playback=usePlaybackSelection([...resolved.sources,...(addonResults.data || []).flatMap(r=>r.streams)],resolved.checking||addonResults.isFetching);
  const {choices,active}=playback;
  const item=details.data?toMediaItem(details.data,type):null;
  const theme=useArtworkTheme(item?.backdropUrl);
  const currentEpisode=episodes.data?.episodes?.find(ep=>ep.episode_number===episode);
  const next=episodes.data?.episodes?.find(ep=>ep.episode_number===episode+1);
  const initialPosition=resumeSeconds(watched.find(entry=>entry.content_id===id&&entry.content_type===type&&(entry.season||1)===season&&(entry.episode||1)===episode));
  const onProgress=useCallback(async(seconds:number,duration:number)=>{
    if(!details.data||!Number.isFinite(seconds)||!Number.isFinite(duration)||duration<=0)return;
    try{await saveProgress({content_id:id,content_type:type,title:details.data.title||details.data.name,poster_path:details.data.poster_path,backdropUrl:item?.backdropUrl,watched_at:new Date().toISOString(),progress:Math.floor(seconds),duration:Math.floor(duration),progress_percent:Math.min(100,Math.round(seconds/duration*100)),season:type==='movie'?null:season,episode:type==='movie'?null:episode});}
    catch{if(!warned.current){toast.error('Progress is saved on this device. Account sync could not finish.');warned.current=true;}}
  },[saveProgress,details.data,id,type,season,episode,item?.backdropUrl]);
  const pickerProps={sources:choices,activeId:active?.id,onSelect:playback.onSelect,loading:resolved.checking||addonResults.isFetching,errors:[...(resolved.error?['Source discovery']:[]),...(addonResults.data||[]).filter(r=>r.error).map(r=>r.name)],onRetry:()=>{setScan(s=>s+1);void addonResults.refetch();}};
  return <MainLayout theme={theme}><div className="page-shell player-page">
      <div className="watch-player-layout"><StreamingPlayer source={active?{...active,subtitles:[...(active.subtitles||[]),...(subtitles.data?.tracks||[])]}:undefined} title={item?.title || 'A&D MAX'} storageKey={`${user?.id||"guest"}-${type}-${id}-${season}-${episode}`} initialPosition={initialPosition} poster={item?.backdropUrl} searching={pickerProps.loading} onSourceReady={playback.onReady} onSourceError={playback.onFailure} onNextSource={playback.next} onProgress={onProgress} resume={resume} onOpenSources={()=>setSourcesOpen(true)} nextEpisode={next?{label:next.name,image:getBackdropUrl(next.still_path)||item?.backdropUrl,eyebrow:`Season ${season} · Episode ${next.episode_number}`,onPlay:()=>navigate(watchPath(type,id,season,next.episode_number))}:undefined} autoNext={autoNext} onAutoNextChange={setAutoNext} subtitleStatus={subtitles.isPending?'Finding subtitles…':subtitles.data?.failed.length?subtitles.data.failed.join(', ')+' is temporarily unavailable. Other tracks remain available.':undefined}/><aside className="desktop-source-picker"><SourcePicker {...pickerProps}/></aside></div>
      <div className="selected-source-bar"><span><Layers size={15}/>{active?.name || 'Choose a source'}</span><Button size="sm" variant="secondary" onClick={()=>setSourcesOpen(true)}>Change source <span className="nav-count">{choices.length}</span></Button></div>
      <header className="watch-titlebar"><div><p className="eyebrow">NOW WATCHING</p><h1>{item?.title || (details.isError?'Title unavailable':'Opening title…')}</h1><p>{type==='movie'?item?.year:`Season ${season} · Episode ${episode}${currentEpisode?.name?' — '+currentEpisode.name:''}`}</p></div><div className="flex gap-3">{item&&<Button variant="secondary" onClick={()=>toggle(item)} aria-pressed={has(item)}>{has(item)?<Check size={17}/>:<Plus size={17}/>}My List</Button>}{next&&<Button variant="secondary" asChild><Link to={watchPath(type,id,season,next.episode_number)}>Next episode <SkipForward size={16}/></Link></Button>}</div></header>
      {details.isError&&<p role="alert" className="mb-6 text-sm text-muted-foreground">Metadata couldn’t load. <button className="underline" onClick={()=>details.refetch()}>Retry</button></p>}
      <div className="watch-content"><section>
        <p className="player-note">Make it your kind of movie night. Change audio, captions, and available quality levels in the player.</p>
        {active?.kind==='video'&&<p className="player-note mt-2">Player shortcuts: Space / K to pause · ← / → to seek · M to mute · F for fullscreen. Use Audio & Subtitles for embedded tracks, OpenSubtitles, and your own subtitle files.</p>}
        {item&&<div className="mt-9 border-t border-white/10 pt-7"><p className="eyebrow">ABOUT THIS STORY</p><p className="max-w-2xl text-sm leading-7 text-muted-foreground">{item.description}</p></div>}
      </section>{type!=='movie'&&<aside><h2 className="mb-5 text-xl">Episodes</h2><ChoiceSelect label="Select season" value={String(season)} onValueChange={value=>navigate(watchPath(type,id,Number(value),1))} options={(details.data?.seasons||[]).filter(s=>s.season_number>0).map(s=>({value:String(s.season_number),label:s.name}))}/>
        {episodes.isPending?<div className="py-5"><LoadingState label="Loading episodes"/></div>:episodes.isError?<Button className="mt-5" variant="secondary" onClick={()=>episodes.refetch()}>Retry episodes</Button>:<div className="episode-watch-list">{episodes.data.episodes?.map(ep=><Link className={ep.episode_number===episode?'active':''} key={ep.id} to={watchPath(type,id,season,ep.episode_number)}><span className="episode-number">{String(ep.episode_number).padStart(2,'0')}</span>{ep.name}</Link>)}</div>}
      </aside>}</div>
    </div>
    <SourcePickerSheet {...pickerProps} open={sourcesOpen} onOpenChange={setSourcesOpen}/>

  </MainLayout>;
}
