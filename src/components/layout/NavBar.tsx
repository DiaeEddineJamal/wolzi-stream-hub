import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Menu, User, House, Clapperboard, Tv, Sparkles, Bookmark, Puzzle, Download, Play, ArrowUpRight, X } from 'lucide-react';
import { openInstall, useInstall } from '@/lib/install';
import tmdbApi from '@/integrations/api/tmdb';
import { toMediaItem, watchPath } from '@/lib/media';
import Brand from './Brand';
import UserMenu from '@/components/auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import GlassSurface from '@/components/vendor/reactbits/GlassSurface';
const links=[{to:'/',title:'Discover',Icon:House},{to:'/movies',title:'Movies',Icon:Clapperboard},{to:'/tv-series',title:'Series',Icon:Tv},{to:'/anime',title:'Anime',Icon:Sparkles},{to:'/library',title:'My List',Icon:Bookmark},{to:'/addons',title:'Add-ons',Icon:Puzzle}];
export default function NavBar(){
  const {isLoggedIn}=useAuth();
  const [search,setSearch]=useState(false),[menu,setMenu]=useState(false),[query,setQuery]=useState(''),[debounced,setDebounced]=useState('');
  const navigate=useNavigate();
  const {pathname}=useLocation();
  const header=useRef<HTMLElement>(null);
  const [collapsed,setCollapsed]=useState(false);
  const {installed}=useInstall();
  useEffect(()=>{const t=setTimeout(()=>setDebounced(query.trim()),180);return()=>clearTimeout(t);},[query]);
  const liveSearch=useQuery({
    queryKey:['elastic-search',debounced],
    enabled:search&&debounced.length>=1,
    staleTime:60000,
    queryFn:async()=>{
      const {data}=await tmdbApi.searchMulti(debounced,1);
      return (data.results||[]).filter((i:any)=>['movie','tv'].includes(i.media_type)).slice(0,8).map((i:any)=>toMediaItem(i));
    }
  });
  const trendingSuggestions=useQuery({
    queryKey:['search-trending-suggestions'],
    enabled:search&&debounced.length===0,
    staleTime:300000,
    queryFn:async()=>{
      const {data}=await tmdbApi.getTrending('day',1);
      return (data.results||[]).filter((i:any)=>['movie','tv'].includes(i.media_type)).slice(0,6).map((i:any)=>toMediaItem(i));
    }
  });
  useEffect(()=>{
    let anchor=window.scrollY,frame=0;
    setCollapsed(false);
    const update=()=>{
      frame=0;
      const y=Math.max(0,window.scrollY),delta=y-anchor;
      if(window.matchMedia('(min-width:768px)').matches||y<100||menu||search||header.current?.querySelector(':focus-visible')){setCollapsed(false);anchor=y;}
      else if(Math.abs(delta)>=10){setCollapsed(delta>0);anchor=y;}
    };
    const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
    window.addEventListener('scroll',scroll,{passive:true});
    return()=>{window.removeEventListener('scroll',scroll);cancelAnimationFrame(frame);};
  },[menu,search,pathname]);
  const suggestions=debounced?liveSearch.data||[]:trendingSuggestions.data||[];
  return <>
    <header ref={header} className={'max-nav floating-nav unified-nav'+(collapsed?' is-collapsed':'')} data-collapsed={collapsed} onFocusCapture={()=>setCollapsed(false)}>
      <GlassSurface preBlur={2} saturation={1.15} className="nav-glass" width="100%" height={64} borderRadius={34} backgroundOpacity={.12} blur={9} distortionScale={-65} displace={.8} redOffset={0} greenOffset={2} blueOffset={4} renderer="svg">
        <div className="nav-inner"><Brand/>
          <nav className="desktop-links" aria-label="Main navigation">{links.map(({to,title,Icon})=><NavLink key={to} to={to} end={to==='/'} aria-label={title}><Icon size={18}/><span className="nav-item-label">{title}</span></NavLink>)}</nav>
          <div className="nav-actions"><button className="icon-button nav-search" onClick={()=>setSearch(true)} aria-label="Search titles"><Search size={20}/></button>{isLoggedIn?<UserMenu/>:<Link to="/auth" className="nav-signin"><User size={17}/><span>Sign in</span></Link>}<button className="icon-button mobile-menu-trigger" aria-label="Browse categories" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Menu size={20}/></button></div>
        </div>
      </GlassSurface>
      {menu&&<nav className="mobile-category-menu" aria-label="Browse">{links.map(({to,title,Icon})=><Link key={to} to={to} onClick={()=>setMenu(false)}><Icon size={17}/>{title}</Link>)}{!installed&&<button type="button" onClick={()=>{setMenu(false);openInstall();}}><Download size={17}/>Get the app</button>}</nav>}
    </header>
    <Dialog open={search} onOpenChange={setSearch}><DialogContent className="max-w-2xl glass-dialog search-dialog"><DialogHeader><DialogTitle>Find your next story.</DialogTitle><DialogDescription>Instant suggestions as you type across movies, series, and anime.</DialogDescription></DialogHeader>
      <form className="search-field" onSubmit={e=>{e.preventDefault();if(query.trim()){navigate('/search?q='+encodeURIComponent(query.trim()));setSearch(false);}}}>
        <Search size={20}/>
        <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search movies and series" placeholder="What are you in the mood for?"/>
        {query&&<button type="button" className="text-muted-foreground hover:text-white" aria-label="Clear search" onClick={()=>setQuery('')}><X size={16}/></button>}
        <Button type="submit" size="sm" disabled={!query.trim()}>Search</Button>
      </form>
      <div className="elastic-suggestions" role="region" aria-label="Search suggestions">
        <div className="elastic-head">
          <span>{debounced?(liveSearch.isFetching?'Searching…':`Suggestions for “${debounced}”`):'Trending right now'}</span>
          <Link to="/trending/all" onClick={()=>setSearch(false)}>Trending Today <ArrowUpRight size={13}/></Link>
        </div>
        {suggestions.length>0?<div className="elastic-list">
          {suggestions.map(item=><div key={item.mediaType+item.id} className="elastic-item">
            <Link to={`/${item.mediaType}/${item.id}`} className="elastic-main" onClick={()=>setSearch(false)}>
              <img src={item.posterUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='/poster-placeholder.svg';}}/>
              <div className="elastic-meta">
                <strong>{item.title}</strong>
                <span>{item.mediaType==='movie'?'Movie':item.mediaType==='anime'?'Anime':'Series'}{item.year?` · ${item.year}`:''}{item.rating&&item.rating>0?` · ★ ${item.rating.toFixed(1)}`:''}{item.genres?.length?` · ${item.genres.slice(0,2).join(', ')}`:''}</span>
              </div>
            </Link>
            <Link to={watchPath(item.mediaType,item.id)} className="elastic-play" aria-label={`Play ${item.title}`} onClick={()=>setSearch(false)}><Play size={14} fill="currentColor"/></Link>
          </div>)}
          {debounced&&<button type="button" className="elastic-view-all" onClick={()=>{navigate('/search?q='+encodeURIComponent(debounced));setSearch(false);}}>See all results for “{debounced}” <ArrowUpRight size={14}/></button>}
        </div>:debounced&&!liveSearch.isFetching?<p className="py-6 text-center text-xs text-muted-foreground">No instant matches for “{debounced}”. Press Enter to run a full search.</p>:null}
      </div>
    </DialogContent></Dialog>
  </>;
}
