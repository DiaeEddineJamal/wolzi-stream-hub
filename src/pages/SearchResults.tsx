import { useEffect, useMemo, useState } from 'react';
import { GridPageSkeleton } from '@/components/primitives/Skeletons';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import CatalogCards from '@/components/home/CatalogCards';
import { Button } from '@/components/ui/button';
import { ChoiceSelect } from '@/components/ui/select';
import tmdbApi from '@/integrations/api/tmdb';
import { MOVIE_GENRES } from '@/constants/tmdb-genres';
import { toMediaItem } from '@/lib/media';
import { useSEO } from '@/hooks/useSEO';

export default function SearchResults(){
  const [params,setParams]=useSearchParams();
  const q=params.get('q') || '';
  const page=Math.max(1,Number(params.get('page')) || 1);
  const [input,setInput]=useState(q);
  const [filter,setFilter]=useState('all');
  const [genre,setGenre]=useState('all');
  const [minRating,setMinRating]=useState('all');
  const [yearFilter,setYearFilter]=useState('all');
  const [sortBy,setSortBy]=useState('relevance');

  // Keep what the user is typing (e.g. a trailing space) when the debounced query catches up.
  useEffect(()=>setInput(previous=>previous.trim()===q?previous:q),[q]);
  // Live elastic search: update query parameter as the user types
  useEffect(()=>{
    const trimmed=input.trim();
    if(trimmed===q)return;
    const t=setTimeout(()=>{setParams(trimmed?{q:trimmed}:{},{replace:true});},240);
    return()=>clearTimeout(t);
  },[input,q,setParams]);

  useSEO({title:q?`Search: ${q} — A&D MAX`:'Search — A&D MAX'});
  const results=useQuery({queryKey:['search',q,page,filter],enabled:!!q,queryFn:async()=>{
    const apiType=filter==='anime'?'tv':filter;
    const {data}= filter==='all'?await tmdbApi.searchMulti(q,page):await tmdbApi.searchByType(apiType,q,page);
    const raw=(data.results||[]).filter((i:any)=>filter==='anime'?(i.genre_ids?.includes(16)&&i.original_language==='ja'):filter!=='all'||['movie','tv'].includes(i.media_type));
    return {...data,results:raw.map((i:any)=>toMediaItem(i,filter==='all'?undefined:filter as 'movie'|'tv'|'anime'))};
  }});

  const filteredItems=useMemo(()=>{
    let list=[...(results.data?.results||[])];
    if(genre!=='all'){
      const gLabel=MOVIE_GENRES.find(g=>g.id===genre)?.label?.toLowerCase();
      if(gLabel)list=list.filter(i=>i.genres?.some(g=>g.toLowerCase().includes(gLabel)));
    }
    if(minRating!=='all'){
      const min=Number(minRating);
      list=list.filter(i=>(i.rating||0)>=min);
    }
    if(yearFilter!=='all'){
      list=list.filter(i=>{
        const y=Number(i.year);
        if(!y)return false;
        if(yearFilter==='2020s')return y>=2020;
        if(yearFilter==='2010s')return y>=2010&&y<2020;
        if(yearFilter==='classic')return y<2010;
        return String(y)===yearFilter;
      });
    }
    if(sortBy==='rating')list.sort((a,b)=>(b.rating||0)-(a.rating||0));
    else if(sortBy==='newest')list.sort((a,b)=>Number(b.year||0)-Number(a.year||0));
    else if(sortBy==='title')list.sort((a,b)=>a.title.localeCompare(b.title));
    return list;
  },[results.data?.results,genre,minRating,yearFilter,sortBy]);

  const hasExtraFilters=genre!=='all'||minRating!=='all'||yearFilter!=='all'||sortBy!=='relevance';

  return <MainLayout><div className="page-shell search-page"><header className="catalog-header"><div><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h1>Find your next story.</h1></div></header>
    <form className="search-field" onSubmit={e=>{e.preventDefault();setParams(input.trim()?{q:input.trim()}:{});}}>
      <Search size={22}/>
      <input value={input} onChange={e=>setInput(e.target.value)} aria-label="Search titles" placeholder="Type to search movies, series, anime instantaneously…" />
      {input&&<button type="button" className="text-muted-foreground hover:text-white" aria-label="Clear search" onClick={()=>{setInput('');setParams({});}}><X size={18}/></button>}
      <Button type="submit" disabled={!input.trim()}>Search</Button>
    </form>
    <div className="catalog-filter-bar">
      <div className="filter-pills">
        {[['all','All titles'],['movie','Movies'],['tv','Series'],['anime','Anime']].map(([value,label])=><button key={value} className={value===filter?'active':''} aria-pressed={value===filter} onClick={()=>{setFilter(value);if(q)setParams({q});}}>{label}</button>)}
      </div>
      <div className="filter-selects">
        <ChoiceSelect label="Genre" value={genre} onValueChange={setGenre} options={[{value:'all',label:'All Genres'},...MOVIE_GENRES.map(g=>({value:g.id,label:g.label}))]}/>
        <ChoiceSelect label="Year" value={yearFilter} onValueChange={setYearFilter} options={[{value:'all',label:'All Years'},{value:'2026',label:'2026'},{value:'2025',label:'2025'},{value:'2024',label:'2024'},{value:'2020s',label:'2020s'},{value:'2010s',label:'2010s'},{value:'classic',label:'Before 2010'}]}/>
        <ChoiceSelect label="Rating" value={minRating} onValueChange={setMinRating} options={[{value:'all',label:'Any Rating'},{value:'8',label:'★ 8.0+'},{value:'7',label:'★ 7.0+'},{value:'6',label:'★ 6.0+'}]}/>
        <ChoiceSelect label="Sort by" value={sortBy} onValueChange={setSortBy} options={[{value:'relevance',label:'Best Match'},{value:'rating',label:'Highest Rated'},{value:'newest',label:'Newest First'},{value:'title',label:'Title A–Z'}]}/>
        {hasExtraFilters&&<Button variant="ghost" size="sm" onClick={()=>{setGenre('all');setMinRating('all');setYearFilter('all');setSortBy('relevance');}}>Reset</Button>}
      </div>
    </div>
    {!q?<div className="empty-state"><Search size={32} className="text-muted-foreground"/><h2>So many stories. Start with a name.</h2><p>Results appear automatically as you type.</p></div>:results.isPending?<GridPageSkeleton/>:results.isError?<div className="empty-state"><h2>Search is taking a break.</h2><Button onClick={()=>results.refetch()}>Try again</Button></div>:<>
      <p className="mb-7 text-sm text-muted-foreground">{hasExtraFilters||filter==='anime'?`${filteredItems.length} matching`:results.data.total_results.toLocaleString()} results for “{q}”</p>
      {filteredItems.length?<CatalogCards items={filteredItems}/>:<div className="empty-state"><h2>No matches this time.</h2><p>Try another title or relax your filters.</p></div>}
      <div className="flex justify-center gap-4 py-8"><Button variant="secondary" disabled={page===1} onClick={()=>setParams({q,page:String(page-1)})}>Previous</Button><Button variant="secondary" disabled={page>=Math.min(results.data.total_pages,500)} onClick={()=>setParams({q,page:String(page+1)})}>Next</Button></div>
    </>}
  </div></MainLayout>;
}
