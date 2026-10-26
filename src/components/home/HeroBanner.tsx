import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Info, Play, Plus, Pause } from 'lucide-react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCarouselDrag } from '@/hooks/useDragScroll';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useArtworkTheme } from '@/hooks/useArtworkTheme';
import { artworkSet, artworkSize } from '@/lib/artwork';
import { watchPath } from '@/lib/media';
import tmdbApi, {getPosterUrl} from '@/integrations/api/tmdb';

interface HeroItem {id:string;title:string;description:string;imageUrl:string;posterUrl?:string;mediaType:string;ctaLink:string;rating?:number;year?:string}
export default function HeroBanner({featuredItems,onThemeChange}:{featuredItems:HeroItem[];onThemeChange?:(theme:CSSProperties)=>void}){
  const [index,setIndex]=useState(0),[displayed,setDisplayed]=useState(featuredItems[0]);
  const [previous,setPrevious]=useState<HeroItem>();
  const [paused,setPaused]=useState(false),[focused,setFocused]=useState(false),[ready,setReady]=useState(false);
  const {has,toggle}=useWatchlist(),reduced=useReducedMotion(),queryClient=useQueryClient();
  const requested=featuredItems[index%featuredItems.length],current=displayed||requested;
  const type=current?.mediaType==='movie'?'movie':current?.mediaType==='anime'?'anime':'tv';
  const theme=useArtworkTheme(current?.imageUrl);
  useEffect(()=>{onThemeChange?.(theme);},[theme,onThemeChange]);
  useEffect(()=>{
    if(!requested||(requested.id===current?.id&&requested.mediaType===current?.mediaType))return;
    let cancelled=false;
    const image=new Image();image.decoding='async';image.sizes='(max-width:767px) 140vh, 100vw';
    const commit=()=>{if(!cancelled){setPrevious(reduced?undefined:current);setDisplayed(requested);setReady(true);}};
    image.onload=()=>{void image.decode().catch(()=>undefined).then(commit);};
    image.onerror=()=>{if(!cancelled)setIndex(Math.max(0,featuredItems.findIndex(item=>item.id===current?.id&&item.mediaType===current?.mediaType)));};
    image.srcset=artworkSet(requested.imageUrl)||'';image.src=artworkSize(requested.imageUrl,'w1280');
    return()=>{cancelled=true;};
  },[requested,current,featuredItems,reduced]);
  const upcoming=featuredItems[(index+1)%featuredItems.length];
  const nextId=upcoming?.id,nextImage=upcoming?.imageUrl,nextType=upcoming?.mediaType==='movie'?'movie':upcoming?.mediaType==='anime'?'anime':'tv';
  useEffect(()=>{
    if(!nextImage||!nextId)return;
    const image=new Image();image.decoding='async';image.sizes='(max-width:767px) 140vh, 100vw';image.srcset=artworkSet(nextImage)||'';image.src=artworkSize(nextImage,'w1280');
    void queryClient.prefetchQuery({queryKey:['hero-art',nextType,nextId],queryFn:async()=>(await(nextType==='movie'?tmdbApi.getMovieDetails(Number(nextId)):tmdbApi.getTVShowDetails(Number(nextId)))).data});
  },[nextImage,nextId,nextType,queryClient]);
  const details=useQuery({queryKey:['hero-art',type,current?.id],enabled:!!current,queryFn:async()=>(await(type==='movie'?tmdbApi.getMovieDetails(Number(current.id)):tmdbApi.getTVShowDetails(Number(current.id)))).data});
  const logo=details.data?.images?.logos?.filter(i=>i.iso_639_1==='en'&&i.width>i.height*1.8).sort((a,b)=>b.width-a.width)[0];
  const move=(delta:number)=>{if(!previous)setIndex(value=>(value+delta+featuredItems.length)%featuredItems.length);};
  const drag=useCarouselDrag(move),paintX=useTransform(drag.offset,value=>value*.05),copyX=useTransform(drag.offset,value=>value*.08);
  useEffect(()=>{
    if(!ready||paused||focused||reduced||featuredItems.length<2||requested?.id!==current?.id)return;
    const timer=setInterval(()=>{if(!document.hidden&&!drag.dragging.current?.dragged)setIndex(value=>(value+1)%featuredItems.length);},10000);
    return()=>clearInterval(timer);
  },[ready,paused,focused,reduced,featuredItems.length,index,requested?.id,current?.id,drag.dragging]);
  if(!current)return null;
  const item={id:current.id,title:current.title,mediaType:type,posterUrl:current.posterUrl||current.imageUrl,backdropUrl:current.imageUrl,year:current.year} as const;
  const frameKey=type+'-'+current.id;
  return <section className="max-hero scene-hero" aria-roledescription="carousel" aria-label="Featured titles" {...drag.handlers} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setFocused(false);}}>
    <motion.div className="hero-paint" style={{x:paintX}}>
      {[...(previous?[previous]:[]),current].map(frame=>{
        const isCurrent=frame===current;
        // CSS fade: resting opacity is 1, so finishing can never flash the previous frame (framer reset to its initial 0 for a frame).
        return <img key={frame.mediaType+'-'+frame.id} className={'max-hero-image'+(isCurrent&&previous?' hero-fade-in':'')} src={artworkSize(frame.imageUrl,'w1280')} srcSet={artworkSet(frame.imageUrl)} sizes="(max-width:767px) 140vh, 100vw" alt="" {...{fetchpriority:"high"}} decoding="async" width={1920} height={1080} onLoad={()=>setReady(true)} onError={()=>setReady(true)} onAnimationEnd={isCurrent?()=>setPrevious(undefined):undefined}/>;
      })}
    </motion.div>
    <div className="max-hero-gradient"/>
    {/* Keyed CSS fade-in (no exit): framer's exit/enter briefly snapped the outgoing title back to full opacity. */}
    <motion.div key={frameKey} className={'hero-editorial page-shell'+(previous?' hero-copy-in':'')} style={{x:copyX}}>
      <img className="hero-poster" src={current.posterUrl||current.imageUrl} srcSet={artworkSet(current.posterUrl,'poster')} sizes="(max-width:767px) 112px, 240px" alt="" width={240} height={360}/>
      <div className="hero-story-copy"><p className="hero-kicker">A&D MAX SPOTLIGHT</p>
        <h1>{logo?<img src={getPosterUrl(logo.file_path,'w500')} alt={current.title} className="hero-title-art"/>:current.title}</h1>
        <div className="hero-meta"><span>{current.year}</span>{current.rating>0&&<span>★ {current.rating.toFixed(1)}</span>}<span>{type==='movie'?'Film':type==='anime'?'Anime':'Series'}</span></div>
        <p className="hero-description">{current.description}</p>
        <div className="hero-actions flex items-center gap-3"><Button asChild size="lg"><Link to={watchPath(type,current.id)}><Play size={17} fill="currentColor"/>Play</Link></Button><button className="icon-button hero-save" onClick={()=>toggle(item)} aria-pressed={has(item)} aria-label={has(item)?'Remove from My List':'Add to My List'}>{has(item)?<Check size={20}/>:<Plus size={20}/>}</button><Link to={current.ctaLink} className="icon-button hero-info" aria-label={'About '+current.title}><Info size={20}/></Link></div>
      </div>
    </motion.div>
    <button className="hero-edge-arrow previous" aria-label="Previous featured title" disabled={!!previous} onClick={()=>move(-1)}><ChevronLeft/></button><button className="hero-edge-arrow next" aria-label="Next featured title" disabled={!!previous} onClick={()=>move(1)}><ChevronRight/></button>
    <div className="hero-pagination"><div className="hero-dots">{featuredItems.map((item,i)=><button key={item.id} disabled={!!previous} onClick={()=>setIndex(i)} aria-label={'Show '+item.title} aria-current={current.id===item.id?'true':undefined}><span/></button>)}</div><button className="hero-rotation" aria-label={paused?'Resume featured rotation':'Pause featured rotation'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button></div>
  </section>;
}
