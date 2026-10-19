import { useState, type CSSProperties } from 'react';
import { GridPageSkeleton, HeroSkeleton } from '@/components/primitives/Skeletons';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import ContentSection from '@/components/home/ContentSection';
import CatalogCards from '@/components/home/CatalogCards';
import SpotlightCarousel from '@/components/home/SpotlightCarousel';
import BrowseFilters from '@/components/home/BrowseFilters';
import tmdbApi from '@/integrations/api/tmdb';
import { ANIME_GENRES, MOVIE_GENRES, TV_GENRES } from '@/constants/tmdb-genres';
import { toMediaItem, type MediaType } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/hooks/useSEO';

export default function Catalog({type}:{type:MediaType}){
  const [theme,setTheme]=useState<CSSProperties>();
  const [genre,setGenre]=useState('all');
  const [year,setYear]=useState('all');
  const [minRating,setMinRating]=useState('all');
  const [sortBy,setSortBy]=useState('popularity.desc');
  const [lang,setLang]=useState('all');
  const [page,setPage]=useState(1);

  const title=type==='movie'?'Movies':type==='anime'?'Anime':'Series';
  const genres=type==='movie'?MOVIE_GENRES:type==='anime'?ANIME_GENRES:TV_GENRES;
  const hasFilters=genre!=='all'||year!=='all'||minRating!=='all'||sortBy!=='popularity.desc'||lang!=='all';

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

  const filtered=useQuery({
    queryKey:['browse-filtered',type,genre,year,minRating,sortBy,lang,page],
    enabled:hasFilters,
    queryFn:async()=>{
      const params:Record<string,string|number>={
        page,
        sort_by:sortBy,
        'vote_count.gte':sortBy==='vote_average.desc'?150:40,
      };
      if(type==='anime'){
        params.with_genres=genre!=='all'?`16,${genre}`:'16';
        params.with_original_language=lang!=='all'?lang:'ja';
      }else{
        if(genre!=='all')params.with_genres=genre;
        if(lang!=='all')params.with_original_language=lang;
      }
      if(minRating!=='all')params['vote_average.gte']=Number(minRating);
      if(year!=='all'){
        if(year==='2020s')params[type==='movie'?'primary_release_date.gte':'first_air_date.gte']='2020-01-01';
        else if(year==='2010s'){
          params[type==='movie'?'primary_release_date.gte':'first_air_date.gte']='2010-01-01';
          params[type==='movie'?'primary_release_date.lte':'first_air_date.lte']='2019-12-31';
        }else if(year==='classic'){
          params[type==='movie'?'primary_release_date.lte':'first_air_date.lte']='2009-12-31';
        }else{
          params[type==='movie'?'primary_release_year':'first_air_date_year']=Number(year);
        }
      }
      const {data}=type==='movie'?await tmdbApi.discoverMovies(params):await tmdbApi.discoverTV(params);
      return {items:(data.results||[]).map((i:any)=>toMediaItem(i,type)),totalPages:data.total_pages||1,totalResults:data.total_results||0};
    }
  });

  const featured=(popular.data||[]).filter(item=>item.backdropUrl).slice(0,6).map(item=>({...item,imageUrl:item.backdropUrl,description:item.description||'',ctaLink:'/'+item.mediaType+'/'+item.id}));
  const base=type==='movie'?'/movies':type==='anime'?'/view-all/anime':'/tv';
  return <MainLayout theme={theme}><div className="home-world catalog-world">
    {popular.isPending?<HeroSkeleton/>:popular.isError?<div className="hero-skeleton empty-state"><h1>The stories will be right back.</h1><Button onClick={()=>popular.refetch()}>Retry {title.toLowerCase()}</Button></div>:<HeroBanner key={type} featuredItems={featured} onThemeChange={setTheme}/>}
    <section className="page-shell pt-8">
      <BrowseFilters title={title} genre={genre} genres={genres} onGenreChange={value=>{setGenre(value);setPage(1);}}
        fields={[
          {id:'year',label:'Release year',value:year,onChange:value=>{setYear(value);setPage(1);},options:[{value:'all',label:'Any year'},...Array.from({length:3},(_,i)=>({value:String(new Date().getFullYear()-i),label:String(new Date().getFullYear()-i)})),{value:'2020s',label:'2020s'},{value:'2010s',label:'2010s'},{value:'classic',label:'Before 2010'}]},
          {id:'rating',label:'Minimum rating',value:minRating,onChange:value=>{setMinRating(value);setPage(1);},options:[{value:'all',label:'Any rating'},{value:'8',label:'8.0+ stars'},{value:'7',label:'7.0+ stars'},{value:'6',label:'6.0+ stars'}]},
          ...(type!=='anime'?[{id:'language',label:'Original language',value:lang,onChange:(value:string)=>{setLang(value);setPage(1);},options:[{value:'all',label:'Any language'},{value:'en',label:'English'},{value:'ja',label:'Japanese'},{value:'ko',label:'Korean'},{value:'es',label:'Spanish'},{value:'fr',label:'French'}]}]:[])
        ]}
        sort={{id:'sort',label:'Sort by',value:sortBy,defaultValue:'popularity.desc',onChange:value=>{setSortBy(value);setPage(1);},options:[{value:'popularity.desc',label:'Most popular'},{value:'vote_average.desc',label:'Highest rated'},{value:type==='movie'?'primary_release_date.desc':'first_air_date.desc',label:'Newest releases'}]}}
        onReset={()=>{setGenre('all');setYear('all');setMinRating('all');setSortBy('popularity.desc');setLang('all');setPage(1);}}/>
    </section>
    {hasFilters?<section className="page-shell py-4">
      <header className="section-heading"><div><p className="eyebrow">FILTERED {title.toUpperCase()}</p><h2>{genres.find(g=>g.id===genre)?.label||`All ${title}`}</h2></div><span className="text-xs text-muted-foreground">{filtered.data?.totalResults?.toLocaleString()||0} titles</span></header>
      {filtered.isPending?<GridPageSkeleton count={18}/>:filtered.isError?<div className="empty-state"><h2>Could not load filtered {title.toLowerCase()}.</h2><Button onClick={()=>filtered.refetch()}>Try again</Button></div>:filtered.data.items.length?<>
        <CatalogCards items={filtered.data.items}/>
        <div className="flex justify-center items-center gap-5 py-6"><Button variant="secondary" disabled={page===1} onClick={()=>{setPage(p=>p-1);window.scrollTo(0,380);}}>Previous</Button><span className="text-xs text-muted-foreground">Page {page} of {Math.max(1,Math.min(500,filtered.data.totalPages))}</span><Button variant="secondary" disabled={page>=Math.min(500,filtered.data.totalPages)} onClick={()=>{setPage(p=>p+1);window.scrollTo(0,380);}}>Next</Button></div>
      </>:<div className="empty-state"><h2>No titles match these filters.</h2><p>Try adjusting the genre, year, or rating.</p></div>}
    </section>:<>
      <SpotlightCarousel viewMoreLink={base+'/popular'} items={(popular.data||[]).filter(item=>item.backdropUrl).slice(0,8)}/>
      <ContentSection title={type==='movie'?'In cinemas':type==='anime'?'Anime everyone’s talking about':'Series everyone’s talking about'} eyebrow={title.toUpperCase()} items={popular.data||[]} loading={popular.isPending} landscape={false} viewMoreLink={type==='movie'?'/movies/now-playing':base+'/popular'}/>
      <ContentSection title={type==='movie'?'The films that stay with you':type==='anime'?'Extraordinary worlds':'One more unforgettable episode'} eyebrow="HIGHLY RATED" items={rated.data||[]} loading={rated.isPending} landscape={false} viewMoreLink={base+'/top-rated'}/>
      {rated.isError&&<div className="page-shell"><Button variant="secondary" onClick={()=>rated.refetch()}>Reload top rated</Button></div>}
      <ContentSection title={type==='movie'?'Coming to the big screen':type==='anime'?'Fresh from Japan':'Fresh stories to settle into'} eyebrow="SOMETHING NEW" items={fresh.data||[]} loading={fresh.isPending} landscape={false} viewMoreLink={type==='tv'?undefined:base+(type==='anime'?'/on-air':'/upcoming')}/>
      {fresh.isError&&<div className="page-shell"><Button variant="secondary" onClick={()=>fresh.refetch()}>Reload new stories</Button></div>}
    </>}
  </div></MainLayout>;
}
