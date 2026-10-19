import { useMemo, useState } from 'react';
import { GridPageSkeleton } from '@/components/primitives/Skeletons';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/MainLayout';
import CatalogCards from '@/components/home/CatalogCards';
import { Button } from '@/components/ui/button';
import BrowseFilters from '@/components/home/BrowseFilters';
import { matchesTrendingFilters } from '@/lib/catalog-filters';
import { useArtworkTheme } from '@/hooks/useArtworkTheme';
import tmdbApi from '@/integrations/api/tmdb';
import { MOVIE_GENRES, TV_GENRES } from '@/constants/tmdb-genres';
import { toMediaItem, type MediaItem } from '@/lib/media';
export type { MediaItem } from '@/lib/media';
interface Props {title:string;fetchDataFunction:(page:number)=>Promise<{items:(MediaItem & {overview?:string})[];totalPages:number;totalResults:number;hasMore?:boolean}>}
export default function ViewAllPage({title,fetchDataFunction}:Props){return <Results key={title} title={title} fetchDataFunction={fetchDataFunction}/>;}
function Results({title,fetchDataFunction}:Props){
  const isTrending=/trending/i.test(title);
  const defaultType=/anime/i.test(title)?'anime':/tv|series/i.test(title)?'tv':/movie|cinema/i.test(title)?'movie':'all';
  const [page,setPage]=useState(1);
  const [mediaFilter,setMediaFilter]=useState<'all'|'movie'|'tv'|'anime'>(defaultType);
  const [timeWindow,setTimeWindow]=useState<'day'|'week'>('day');
  const [genre,setGenre]=useState('all');
  const [year,setYear]=useState('all');
  const [minRating,setMinRating]=useState('all');
  const [sortBy,setSortBy]=useState('default');

  const useDiscover=genre!=='all'||year!=='all'||minRating!=='all'||(sortBy!=='default'&&!isTrending)||(isTrending&&timeWindow==='week');

  const result=useQuery({
    queryKey:['view-all',title,page,mediaFilter,timeWindow,genre,year,minRating,sortBy],
    queryFn:async()=>{
      if(isTrending){
        const {data}=await tmdbApi.getTrending(timeWindow,page);
        const mapped=(data.results||[]).filter((item:any)=>matchesTrendingFilters(item,{mediaType:mediaFilter,genre,year,minRating})).map((item:any)=>toMediaItem(item,mediaFilter==='anime'?'anime':undefined));
        return {items:mapped,totalPages:data.total_pages||1,totalResults:data.total_results||mapped.length};
      }
      if(!useDiscover&&mediaFilter===defaultType){
        return fetchDataFunction(page);
      }
      const targetType=mediaFilter==='all'?'movie':mediaFilter;
      const sortParam=sortBy==='rating'?'vote_average.desc':sortBy==='newest'?(targetType==='movie'?'primary_release_date.desc':'first_air_date.desc'):sortBy==='title'?'original_title.asc':'popularity.desc';
      const params:Record<string,string|number>={
        page,
        sort_by:sortParam,
        'vote_count.gte':sortBy==='rating'?150:30,
      };
      if(targetType==='anime'){
        params.with_genres=genre!=='all'?`16,${genre}`:'16';
        params.with_original_language='ja';
      }else if(genre!=='all'){
        params.with_genres=genre;
      }
      if(minRating!=='all')params['vote_average.gte']=Number(minRating);
      if(year!=='all'){
        if(year==='2020s'){
          params[targetType==='movie'?'primary_release_date.gte':'first_air_date.gte']='2020-01-01';
        }else if(year==='2010s'){
          params[targetType==='movie'?'primary_release_date.gte':'first_air_date.gte']='2010-01-01';
          params[targetType==='movie'?'primary_release_date.lte':'first_air_date.lte']='2019-12-31';
        }else if(year==='classic'){
          params[targetType==='movie'?'primary_release_date.lte':'first_air_date.lte']='2009-12-31';
        }else{
          params[targetType==='movie'?'primary_release_year':'first_air_date_year']=Number(year);
        }
      }
      const {data}=targetType==='movie'?await tmdbApi.discoverMovies(params):await tmdbApi.discoverTV(params);
      return {items:(data.results||[]).map((i:any)=>toMediaItem(i,targetType)),totalPages:data.total_pages||1,totalResults:data.total_results||0};
    }
  });

  const filteredItems=useMemo(()=>{
    let list=[...(result.data?.items||[])];
    if(mediaFilter!=='all')list=list.filter(i=>i.mediaType===mediaFilter);
    if(minRating!=='all')list=list.filter(i=>(i.rating||0)>=Number(minRating));
    if(sortBy==='rating')list.sort((a,b)=>(b.rating||0)-(a.rating||0));
    else if(sortBy==='newest')list.sort((a,b)=>Number(b.year||0)-Number(a.year||0));
    else if(sortBy==='title')list.sort((a,b)=>a.title.localeCompare(b.title));
    return list;
  },[result.data?.items,mediaFilter,minRating,sortBy]);

  const genres=mediaFilter==='tv'||mediaFilter==='anime'?TV_GENRES:MOVIE_GENRES;
  const hasFilters=mediaFilter!==defaultType||timeWindow!=='day'||genre!=='all'||year!=='all'||minRating!=='all'||sortBy!=='default';
  const theme=useArtworkTheme(filteredItems[0]?.backdropUrl||result.data?.items?.[0]?.backdropUrl);

  return <MainLayout theme={theme}><div className="page-shell"><header className="catalog-header"><div><p className="eyebrow">KEEP EXPLORING</p><h1>{isTrending?(timeWindow==='week'?'Trending This Week':'Trending Today'):title}</h1><p>{isTrending&&hasFilters?`${filteredItems.length} matches on this trending page`:`${result.data?.totalResults?.toLocaleString() || 'A world of'} titles to discover.`}</p></div></header>
    <BrowseFilters title={title} genre={genre} genres={genres} onGenreChange={value=>{setGenre(value);setPage(1);}}
      groups={[
        ...(isTrending?[{id:'period',label:'Trending period',value:timeWindow,onChange:(value:string)=>{setTimeWindow(value as 'day'|'week');setPage(1);},options:[{value:'day',label:'Today'},{value:'week',label:'This week'}]}]:[]),
        ...(defaultType==='all'?[{id:'type',label:'Content type',value:mediaFilter,onChange:(value:string)=>{setMediaFilter(value as typeof mediaFilter);setGenre('all');setPage(1);},options:[{value:'all',label:'All titles'},{value:'movie',label:'Movies'},{value:'tv',label:'Series'},{value:'anime',label:'Anime'}]}]:[])
      ]}
      fields={[
        {id:'year',label:'Release year',value:year,onChange:value=>{setYear(value);setPage(1);},options:[{value:'all',label:'Any year'},...Array.from({length:3},(_,i)=>({value:String(new Date().getFullYear()-i),label:String(new Date().getFullYear()-i)})),{value:'2020s',label:'2020s'},{value:'2010s',label:'2010s'},{value:'classic',label:'Before 2010'}]},
        {id:'rating',label:'Minimum rating',value:minRating,onChange:value=>{setMinRating(value);setPage(1);},options:[{value:'all',label:'Any rating'},{value:'8',label:'8.0+ stars'},{value:'7',label:'7.0+ stars'},{value:'6',label:'6.0+ stars'}]}
      ]}
      sort={{id:'sort',label:'Sort by',value:sortBy,onChange:value=>{setSortBy(value);setPage(1);},options:[{value:'default',label:isTrending?'Trending order':'Featured'},{value:'rating',label:'Highest rated'},{value:'newest',label:'Newest first'},{value:'title',label:'Title A–Z'}]}}
      onReset={()=>{setMediaFilter(defaultType);setTimeWindow('day');setGenre('all');setYear('all');setMinRating('all');setSortBy('default');setPage(1);}}/>
    {result.isPending?<GridPageSkeleton count={18}/>:result.isError?<div className="empty-state"><h2>The catalog couldn’t load.</h2><Button onClick={()=>result.refetch()}>Try again</Button></div>:<>
      {filteredItems.length?<CatalogCards items={filteredItems}/>:<div className="empty-state"><h2>No titles match these filters.</h2><p>Try another genre, year, or rating.</p></div>}
      <div className="flex justify-center items-center gap-5 py-6"><Button variant="secondary" disabled={page===1} onClick={()=>{setPage(p=>p-1);window.scrollTo(0,0);}}>Previous</Button><span className="text-xs text-muted-foreground">Page {page} of {Math.max(1,Math.min(500,result.data.totalPages))}</span><Button variant="secondary" disabled={page>=Math.min(500,result.data.totalPages)} onClick={()=>{setPage(p=>p+1);window.scrollTo(0,0);}}>Next</Button></div>
    </>}
  </div></MainLayout>;
}
