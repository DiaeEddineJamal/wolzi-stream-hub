import { ChoiceSelect } from '@/components/ui/select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronRight, Clock, Layers, Play, Plus, SkipForward, Sparkles, Star } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useArtworkTheme } from '@/hooks/useArtworkTheme';
import StreamingPlayer from '@/components/watch/StreamingPlayer';
import { detectQualityTier, QUALITY_BADGES, SourcePicker, SourcePickerSheet } from '@/components/watch/SourcePicker';
import ContentSection from '@/components/home/ContentSection';
import DraggableRail from '@/components/home/DraggableRail';
import LoadingState from '@/components/primitives/LoadingState';
import { Button } from '@/components/ui/button';
import tmdbApi, { getBackdropUrl, getPosterUrl, getProfileUrl } from '@/integrations/api/tmdb';
import { addonStreams, supportsResource } from '@/integrations/api/stremio';
import { useSubtitles } from '@/hooks/useSubtitles';
import { useAddons } from '@/hooks/useAddons';
import { useResolvedSources } from '@/hooks/useResolvedSources';
import { usePlaybackSelection } from '@/hooks/usePlaybackSelection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { openServiceSetup, useStreamingService } from '@/hooks/useStreamingService';
import { toMediaItem, watchPath } from '@/lib/media';
import { artworkSet } from '@/lib/artwork';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { usePlaybackHistory } from '@/hooks/usePlaybackHistory';
import { resumeSeconds } from '@/lib/watch-progress';
import { toast } from 'sonner';

export default function WatchNew(){ const {id}=useParams(),{pathname}=useLocation(); const type=pathname.includes('/movie/')?'movie':pathname.includes('/anime/')?'anime':'tv'; return <WatchSession key={`${type}-${id}`}/>; }
function WatchSession(){
  const {id,season:seasonParam,episode:episodeParam}=useParams();
  const [params]=useSearchParams();
  const location=useLocation();
  const navigate=useNavigate();
  const type=location.pathname.includes('/movie/')?'movie':location.pathname.includes('/anime/')?'anime':'tv';
  const season=Math.max(1,Number(seasonParam || params.get('season'))||1), episode=Math.max(1,Number(episodeParam)||1);
  const episodeKey=`${type}-${id}-${season}-${episode}`;

  const [sourcesOpen,setSourcesOpen]=useState(false);
  const [autoNext,setAutoNext]=useLocalStorage('admax-auto-next',true);
  const resume=true;
  const {addons}=useAddons();
  const {service,recheck,detectedOnce}=useStreamingService();
  const [scan,setScan]=useState(0);
  const resolved=useResolvedSources(type,id,season,episode,service,scan);
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
      try{return {name:addon.manifest.name,streams:await addonStreams(addon,type==='movie'?'movie':'series',streamId,signal,service),error:false};}
      catch{return {name:addon.manifest.name,streams:[],error:true};}
    }));
  }});
  const addonStreamList=(addonResults.data || []).flatMap(r=>r.streams);
  useEffect(()=>{
    if(detectedOnce&&!service&&addonStreamList.some(s=>/Stremio Service/i.test(s.reason||''))){
      try{if(!sessionStorage.getItem('admax-service-prompt-dismissed'))openServiceSetup(true);}catch{openServiceSetup(true);}
    }
  },[detectedOnce,service,addonStreamList]);
  const playback=usePlaybackSelection([...resolved.sources,...addonStreamList],resolved.checking||addonResults.isFetching,episodeKey);
  const {choices,active}=playback;
  const subtitles=useSubtitles(type==='movie'?'movie':'series',imdb?streamId:undefined,[details.data?.title||details.data?.name,active?.name,active?.description].filter(Boolean).join(' '),imdb?streamId:type==='movie'?id:`${id}:${season}:${episode}`);
  const item=details.data?toMediaItem(details.data,type):null;
  const theme=useArtworkTheme(item?.backdropUrl);
  const currentEpisode=episodes.data?.episodes?.find((ep:any)=>ep.episode_number===episode);
  const next=episodes.data?.episodes?.find((ep:any)=>ep.episode_number===episode+1);
  const logo=details.data?.images?.logos?.filter((i:any)=>i.iso_639_1==='en'&&i.width>i.height*1.6).sort((a:any,b:any)=>b.width-a.width)[0];
  const logoUrl=logo?getPosterUrl(logo.file_path,'w500')||undefined:undefined;
  const initialPosition=resumeSeconds(watched.find(entry=>entry.content_id===id&&entry.content_type===type&&(entry.season||1)===season&&(entry.episode||1)===episode));
  const onProgress=useCallback(async(seconds:number,duration:number)=>{
    if(!details.data||!Number.isFinite(seconds)||!Number.isFinite(duration)||duration<=0)return;
    try{await saveProgress({content_id:id,content_type:type,title:details.data.title||details.data.name,poster_path:details.data.poster_path,backdropUrl:item?.backdropUrl,watched_at:new Date().toISOString(),progress:Math.floor(seconds),duration:Math.floor(duration),progress_percent:Math.min(100,Math.round(seconds/duration*100)),season:type==='movie'?null:season,episode:type==='movie'?null:episode});}
    catch{if(!warned.current){toast.error('Progress is saved on this device. Account sync could not finish.');warned.current=true;}}
  },[saveProgress,details.data,id,type,season,episode,item?.backdropUrl]);
  const pickerProps={sources:choices,activeId:active?.id,onSelect:playback.onSelect,loading:resolved.checking||addonResults.isFetching,errors:[...(resolved.error?['Source discovery']:[]),...(addonResults.data||[]).filter(r=>r.error).map(r=>r.name)],onRetry:()=>{setScan(s=>s+1);void recheck();void addonResults.refetch();}};
  const activeTier=active?detectQualityTier(active.name+' '+(active.description||'')):'auto';
  const activeBadge=QUALITY_BADGES[activeTier]?.icon;
  const idleMeta={
    title:item?.title||'A&D MAX',
    logoUrl,
    subtitle:type!=='movie'?currentEpisode?.name:undefined,
    episodeCode:type!=='movie'?`S${season} E${episode}`:undefined,
    year:item?.year,
    rating:item?.rating,
    contentRating:details.data?.adult?'TV-MA':type==='movie'?'PG-13':'TV-MA',
    description:currentEpisode?.overview||item?.description,
    backdropUrl:getBackdropUrl(currentEpisode?.still_path)||item?.backdropUrl,
  };
  const recommendations=(details.data?.recommendations?.results||[]).slice(0,12).map((i:any)=>toMediaItem(i,type));

  return <MainLayout theme={theme}><div className="page-shell player-page apple-watch-page">
      <div className="watch-player-layout">
        <StreamingPlayer
          source={active?{...active,subtitles:[...(active.subtitles||[]),...(subtitles.data?.tracks||[])]}:undefined}
          title={item?.title || 'A&D MAX'}
          storageKey={`${user?.id||"guest"}-${type}-${id}-${season}-${episode}`}
          initialPosition={initialPosition}
          poster={getBackdropUrl(currentEpisode?.still_path)||item?.backdropUrl}
          searching={pickerProps.loading}
          onSourceReady={playback.onReady}
          onSourceError={playback.onFailure}
          onNextSource={playback.next}
          onRetryService={()=>{void recheck();void addonResults.refetch();}}
          onProgress={onProgress}
          resume={resume}
          onOpenSources={()=>setSourcesOpen(true)}
          nextEpisode={next?{label:next.name,image:getBackdropUrl(next.still_path)||item?.backdropUrl,eyebrow:`S${season} · E${next.episode_number}`,onPlay:()=>navigate(watchPath(type,id,season,next.episode_number))}:undefined}
          autoNext={autoNext}
          onAutoNextChange={setAutoNext}
          subtitleStatus={subtitles.isPending?'Finding subtitle tracks…':subtitles.data?.failed.length?subtitles.data.failed.join(', ')+' is temporarily unavailable.':undefined}
          idleMeta={idleMeta}
        />
        <aside className="desktop-source-picker"><SourcePicker {...pickerProps}/></aside>
      </div>

      <div className="selected-source-bar">
        <span><Layers size={15}/>{activeBadge&&<img src={activeBadge} alt="" className="h-4 w-auto"/>}{active?.name || 'Choose a source'}</span>
        <Button size="sm" variant="secondary" onClick={()=>setSourcesOpen(true)}>Change source <span className="nav-count">{choices.length}</span></Button>
      </div>

      <section className="apple-watch-hero">
        <div className="apple-watch-hero-main">
          <div className="apple-watch-kicker">
            <span className="eyebrow">NOW STREAMING</span>
            {type!=='movie'&&<span className="apple-episode-pill">SEASON {season} · EPISODE {episode}</span>}
          </div>
          {logoUrl?<img src={logoUrl} alt={item?.title||''} className="apple-watch-logo"/>:<h1>{item?.title || (details.isError?'Title unavailable':'Opening title…')}</h1>}
          {type!=='movie'&&currentEpisode?.name&&<h2 className="apple-watch-ep-title">“{currentEpisode.name}”</h2>}
          <div className="apple-watch-badges">
            {item?.rating&&item.rating>0&&<span className="apple-meta-rating"><Star size={13} fill="currentColor"/>{item.rating.toFixed(1)}</span>}
            {item?.year&&<span>{item.year}</span>}
            <span className="apple-cert-badge">{idleMeta.contentRating}</span>
            <img src="/badges/4k.png" alt="4K UHD" className="h-4 w-auto opacity-90"/>
            <img src="/badges/1080p.png" alt="Full HD" className="h-4 w-auto opacity-85"/>
            {(currentEpisode?.runtime||details.data?.runtime)>0&&<span className="inline-flex items-center gap-1"><Clock size={12}/>{currentEpisode?.runtime||details.data?.runtime} min</span>}
            {item?.genres?.slice(0,3).map(g=><span key={g} className="apple-genre-chip">{g}</span>)}
          </div>
          <p className="apple-watch-synopsis">{currentEpisode?.overview||item?.description}</p>
        </div>
        <div className="apple-watch-actions">
          {item&&<Button variant="secondary" className="rounded-full px-5" onClick={()=>toggle(item)} aria-pressed={has(item)}>{has(item)?<Check size={16}/>:<Plus size={16}/>}{has(item)?'In Up Next':'Add to Up Next'}</Button>}
          <Button variant="secondary" className="rounded-full px-5" onClick={()=>setSourcesOpen(true)}><Layers size={16}/>Servers ({choices.length})</Button>
          {next&&<Button className="rounded-full px-5" asChild><Link to={watchPath(type,id,season,next.episode_number)}>Next Episode <SkipForward size={16}/></Link></Button>}
          {item&&<Button variant="ghost" className="rounded-full" asChild><Link to={`/${type}/${id}`}>Title Details <ChevronRight size={15}/></Link></Button>}
        </div>
      </section>

      {details.isError&&<p role="alert" className="mb-6 text-sm text-muted-foreground">Metadata couldn’t load. <button className="underline" onClick={()=>details.refetch()}>Retry</button></p>}

      {type!=='movie'&&<section className="apple-episodes-section">
        <header className="apple-episodes-header">
          <div>
            <p className="eyebrow">EPISODES</p>
            <h2>Season {season} <span className="text-sm font-normal text-muted-foreground">({episodes.data?.episodes?.length||0} episodes)</span></h2>
          </div>
          <ChoiceSelect label="Select season" value={String(season)} onValueChange={value=>navigate(watchPath(type,id,Number(value),1))} options={(details.data?.seasons||[]).filter((s:any)=>s.season_number>0).map((s:any)=>({value:String(s.season_number),label:s.name}))}/>
        </header>
        {episodes.isPending?<div className="py-6"><LoadingState label="Loading episodes"/></div>:episodes.isError?<Button className="mt-4" variant="secondary" onClick={()=>episodes.refetch()}>Retry episodes</Button>:<DraggableRail className="apple-episode-rail">
          {episodes.data.episodes?.map((ep:any)=>{
            const isCurrent=ep.episode_number===episode;
            const epProgress=watched.find(w=>w.content_id===id&&w.content_type===type&&(w.season||1)===season&&(w.episode||1)===ep.episode_number)?.progress_percent;
            const thumb=getBackdropUrl(ep.still_path,'w780')||item?.backdropUrl||'/poster-placeholder.svg';
            return <Link key={ep.id} to={watchPath(type,id,season,ep.episode_number)} aria-current={isCurrent?'true':undefined} className={`apple-ep-card ${isCurrent?'is-active':''}`}>
              <div className="apple-ep-art">
                <img src={thumb} srcSet={artworkSet(thumb)} sizes="(max-width:767px) 76vw, 310px" alt="" loading="lazy" decoding="async"/>
                <span className="apple-ep-shade"/>
                <span className="apple-ep-play"><Play size={15} fill="currentColor"/></span>
                {isCurrent&&<span className="apple-ep-playing-badge"><span className="episode-playing-icon" aria-hidden="true"><i/><i/><i/></span>NOW PLAYING</span>}
                {ep.runtime>0&&<span className="apple-ep-duration">{ep.runtime}m</span>}
                {epProgress!=null&&epProgress>0&&<span className="apple-ep-progress"><i style={{width:`${Math.min(100,epProgress)}%`}}/></span>}
              </div>
              <div className="apple-ep-body">
                <span className="apple-ep-num">EPISODE {ep.episode_number}</span>
                <h3>{ep.name||`Episode ${ep.episode_number}`}</h3>
                <p>{ep.overview||'Watch this episode on A&D MAX.'}</p>
              </div>
            </Link>;
          })}
        </DraggableRail>}
      </section>}

      {details.data?.credits?.cast?.length>0&&<section className="apple-cast-section">
        <header className="section-heading"><div><p className="eyebrow">CAST & CREW</p><h2>Starring</h2></div></header>
        <DraggableRail className="cast-rail apple-cast-rail">
          {details.data.credits.cast.slice(0,16).map((person:any)=><div key={person.id} className="apple-cast-card">
            <img src={getProfileUrl(person.profile_path)||'/poster-placeholder.svg'} alt={person.name} loading="lazy"/>
            <h3>{person.name}</h3>
            <p>{person.character}</p>
          </div>)}
        </DraggableRail>
      </section>}

      {recommendations.length>0&&<div className="-mx-[var(--site-gutter)]"><ContentSection title="More Like This" eyebrow="RELATED ON A&D MAX" items={recommendations} landscape={false}/></div>}
    </div>
    <SourcePickerSheet {...pickerProps} open={sourcesOpen} onOpenChange={setSourcesOpen}/>
  </MainLayout>;
}
