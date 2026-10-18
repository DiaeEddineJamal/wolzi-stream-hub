import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import MediaCard from '@/components/home/MediaCard';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/primitives/LoadingState';
import tmdbApi from '@/integrations/api/tmdb';
import { toMediaItem } from '@/lib/media';
import { useSEO } from '@/hooks/useSEO';
export default function SearchResults(){
  const [params,setParams]=useSearchParams();
  const q=params.get('q') || '';
  const page=Math.max(1,Number(params.get('page')) || 1);
  const [input,setInput]=useState(q);
  const [filter,setFilter]=useState('all');
  useEffect(()=>setInput(q),[q]);
  useSEO({title:q?`Search: ${q} — A&D MAX`:'Search — A&D MAX'});
  const results=useQuery({queryKey:['search',q,page,filter],enabled:!!q,queryFn:async()=>{
    const {data}= filter==='all'?await tmdbApi.searchMulti(q,page):await tmdbApi.searchByType(filter,q,page);
    return {...data,results:data.results.filter(i=>filter!=='all'||['movie','tv'].includes(i.media_type)).map(i=>toMediaItem(i,filter==='all'?undefined:filter as 'movie'|'tv'))};
  }});
  return <MainLayout><div className="page-shell search-page"><header className="catalog-header"><div><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h1>Find your next story.</h1></div></header>
    <form className="search-field" onSubmit={e=>{e.preventDefault();setParams(input.trim()?{q:input.trim()}:{});}}><Search size={22}/><input value={input} onChange={e=>setInput(e.target.value)} aria-label="Search titles" placeholder="Movies, series, a whole new world…" /><Button type="submit" disabled={!input.trim()}>Search</Button></form>
    <div className="filter-pills">{[['all','All titles'],['movie','Movies'],['tv','Series']].map(([value,label])=><button key={value} className={value===filter?'active':''} aria-pressed={value===filter} onClick={()=>{setFilter(value);if(q)setParams({q});}}>{label}</button>)}</div>
    {!q?<div className="empty-state"><Search size={32} className="text-muted-foreground"/><h2>So many stories. Start with a name.</h2><p>Search for a film or series you love, or something you’ve been meaning to watch.</p></div>:results.isPending?<div className="empty-state"><LoadingState label="Searching the catalog"/></div>:results.isError?<div className="empty-state"><h2>Search is taking a break.</h2><Button onClick={()=>results.refetch()}>Try again</Button></div>:<>
      <p className="mb-7 text-sm text-muted-foreground">{results.data.total_results.toLocaleString()} results for “{q}”</p>
      {results.data.results.length?<div className="catalog-grid">{results.data.results.map(item=><MediaCard key={item.mediaType+item.id} {...item}/>)}</div>:<div className="empty-state"><h2>No matches this time.</h2><p>Try another title or a shorter search.</p></div>}
      <div className="flex justify-center gap-4 py-8"><Button variant="secondary" disabled={page===1} onClick={()=>setParams({q,page:String(page-1)})}>Previous</Button><Button variant="secondary" disabled={page>=Math.min(results.data.total_pages,500)} onClick={()=>setParams({q,page:String(page+1)})}>Next</Button></div>
    </>}
  </div></MainLayout>;
}
