import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, User, House, Clapperboard, Tv, Sparkles, Bookmark, Puzzle } from 'lucide-react';
import Brand from './Brand';
import UserMenu from '@/components/auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import GlassSurface from '@/components/vendor/reactbits/GlassSurface';
const links=[{to:'/',title:'Discover',Icon:House},{to:'/movies',title:'Movies',Icon:Clapperboard},{to:'/tv-series',title:'Series',Icon:Tv},{to:'/anime',title:'Anime',Icon:Sparkles},{to:'/library',title:'My List',Icon:Bookmark},{to:'/addons',title:'Add-ons',Icon:Puzzle}];
export default function NavBar(){
  const {isLoggedIn}=useAuth();
  const [search,setSearch]=useState(false),[menu,setMenu]=useState(false),[query,setQuery]=useState('');
  const navigate=useNavigate();
  const {pathname}=useLocation();
  const header=useRef<HTMLElement>(null);
  const [collapsed,setCollapsed]=useState(false);
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
  return <>
    <header ref={header} className={'max-nav floating-nav unified-nav'+(collapsed?' is-collapsed':'')} data-collapsed={collapsed} onFocusCapture={()=>setCollapsed(false)}>
      <GlassSurface className="nav-glass" width="100%" height={64} borderRadius={34} backgroundOpacity={.12} blur={9} distortionScale={-65} displace={.8} redOffset={0} greenOffset={2} blueOffset={4} renderer="svg">
        <div className="nav-inner"><Brand/>
          <nav className="desktop-links" aria-label="Main navigation">{links.map(({to,title,Icon})=><NavLink key={to} to={to} end={to==='/'} aria-label={title}><Icon size={18}/><span className="nav-item-label">{title}</span></NavLink>)}</nav>
          <div className="nav-actions"><button className="icon-button nav-search" onClick={()=>setSearch(true)} aria-label="Search titles"><Search size={20}/></button>{isLoggedIn?<UserMenu/>:<Link to="/auth" className="nav-signin"><User size={17}/><span>Sign in</span></Link>}<button className="icon-button mobile-menu-trigger" aria-label="Browse categories" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Menu size={20}/></button></div>
        </div>
      </GlassSurface>
      {menu&&<nav className="mobile-category-menu" aria-label="Browse">{links.map(({to,title,Icon})=><Link key={to} to={to} onClick={()=>setMenu(false)}><Icon size={17}/>{title}</Link>)}</nav>}
    </header>
    <Dialog open={search} onOpenChange={setSearch}><DialogContent className="max-w-2xl glass-dialog"><DialogHeader><DialogTitle>Find your next story.</DialogTitle><DialogDescription>Search movies, series, and anime.</DialogDescription></DialogHeader><form className="search-field" onSubmit={e=>{e.preventDefault();if(query.trim()){navigate('/search?q='+encodeURIComponent(query.trim()));setSearch(false);}}}><Search size={22}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search movies and series" placeholder="What are you in the mood for?"/><Button type="submit" disabled={!query.trim()}>Search</Button></form><p className="text-sm text-muted-foreground">Or explore <Link className="text-primary" to="/trending/all" onClick={()=>setSearch(false)}>what’s trending ↗</Link></p></DialogContent></Dialog>
  </>;
}
