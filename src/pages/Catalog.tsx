import { useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import ContentSection from '@/components/home/ContentSection';
import SpotlightCarousel from '@/components/home/SpotlightCarousel';
import tmdbApi from '@/integrations/api/tmdb';
import { toMediaItem, type MediaType } from '@/lib/media';
import LoadingState from '@/components/primitives/LoadingState';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/hooks/useSEO';

export default function Catalog({type}:{type:MediaType}){
  const [theme,setTheme]=useState<CSSProperties>();
  const title=type==='movie'?'Movies':type==='anime'?'Anime':'Series';
  useSEO({title:title+' — A&D MAX',description:'Explore '+title.toLowerCase()+' and find your next great watch.'});
  const popular=useQuery({queryKey:['browse-popular',type],queryFn:async()=>{
    const response=await(type==='anime'?tmdbApi.getAnimeCatalog():type==='movie'?tmdbApi.getNowPlayingMovies():tmdbApi.discoverTV({sort_by:'popularity.desc','vote_count.gte':100,'vote_average.gte':6,without_genres:'10763,10767,10764'}));
    return response.data.results.map(item=>toMediaItem(item,type));
  }});
  const rated=useQuery({queryKey:['browse-rated',type],queryFn:async()=>{
    const response=await(type==='anime'?tmdbApi.getAnimeCatalog('vote_average.desc'):type==='movie'?tmdbApi.getTopRatedMovies():tmdbApi.getTopRatedTVShows());
    return response.data.results.map(item=>toMediaItem(item,type));
  }});
  const fresh=useQuery({queryKey:['browse-fresh',type],queryFn:async()=>{
    const response=await(type==='anime'?tmdbApi.getAnimeCatalog('first_air_date.desc'):type==='movie'?tmdbApi.getUpcomingMovies():tmdbApi.discoverTV({sort_by:'first_air_date.desc','vote_count.gte':100,'first_air_date.lte':new Date().toISOString().slice(0,10)}));
    return response.data.results.map(item=>toMediaItem(item,type));
  }});
  const featured=(popular.data||[]).filter(item=>item.backdropUrl).slice(0,6).map(item=>({...item,imageUrl:item.backdropUrl,description:item.description||'',ctaLink:'/'+item.mediaType+'/'+item.id}));
  const base=type==='movie'?'/movies':type==='anime'?'/view-all/anime':'/tv';
  return <MainLayout theme={theme}><div className="home-world catalog-world">
    {popular.isPending?<div className="hero-skeleton page-shell"><LoadingState label={'Exploring '+title.toLowerCase()}/></div>:popular.isError?<div className="hero-skeleton empty-state"><h1>The stories will be right back.</h1><Button onClick={()=>popular.refetch()}>Retry {title.toLowerCase()}</Button></div>:<HeroBanner key={type} featuredItems={featured} onThemeChange={setTheme}/>}
    <SpotlightCarousel viewMoreLink={base+'/popular'} items={(popular.data||[]).filter(item=>item.backdropUrl).slice(0,8)}/>
    <ContentSection title={type==='movie'?'In cinemas':type==='anime'?'Anime everyone’s talking about':'Series everyone’s talking about'} eyebrow={title.toUpperCase()} items={popular.data||[]} landscape={false} viewMoreLink={type==='movie'?'/movies/now-playing':base+'/popular'}/>
    <ContentSection title={type==='movie'?'The films that stay with you':type==='anime'?'Extraordinary worlds':'One more unforgettable episode'} eyebrow="HIGHLY RATED" items={rated.data||[]} landscape={false} viewMoreLink={base+'/top-rated'}/>
    {rated.isError&&<div className="page-shell"><Button variant="secondary" onClick={()=>rated.refetch()}>Reload top rated</Button></div>}
    <ContentSection title={type==='movie'?'Coming to the big screen':type==='anime'?'Fresh from Japan':'Fresh stories to settle into'} eyebrow="SOMETHING NEW" items={fresh.data||[]} landscape viewMoreLink={type==='tv'?undefined:base+(type==='anime'?'/on-air':'/upcoming')}/>
    {fresh.isError&&<div className="page-shell"><Button variant="secondary" onClick={()=>fresh.refetch()}>Reload new stories</Button></div>}
  </div></MainLayout>;
}
