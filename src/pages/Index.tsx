import { useQuery } from '@tanstack/react-query';
import { HeroSkeleton } from '@/components/primitives/Skeletons';
import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import ContinueWatching from '@/components/home/ContinueWatching';
import SpotlightCarousel from '@/components/home/SpotlightCarousel';
import ContentSection from '@/components/home/ContentSection';
import FlexCarousel, { type FlexCarouselItem } from '@/components/vendor/reactbits/FlexCarousel';
import { Button } from '@/components/ui/button';
import tmdbApi from '@/integrations/api/tmdb';
import { addonCatalog, httpsUrl, type InstalledAddon } from '@/integrations/api/stremio';
import { useAddons } from '@/hooks/useAddons';
import { toMediaItem } from '@/lib/media';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useSEO } from '@/hooks/useSEO';

export interface StreamingPlatform {
  id: string;
  name: string;
  subtitle: string;
  logo: string;
}

export const STREAMING_PLATFORMS: StreamingPlatform[] = [
  { id: '8', name: 'Netflix', subtitle: 'Originals & global hits', logo: '/providers/netflix.png' },
  { id: '350', name: 'Apple TV+', subtitle: 'Apple Originals', logo: '/providers/appletv.png' },
  { id: '1899', name: 'HBO Max', subtitle: 'HBO, Max Originals & Warner Bros.', logo: '/providers/max.png' },
  { id: '337', name: 'Disney+', subtitle: 'Disney, Pixar, Marvel, Star Wars', logo: '/providers/disney.png' },
  { id: '15', name: 'Hulu', subtitle: 'FX, next-day TV & Hulu Originals', logo: '/providers/hulu.png' },
  { id: '9', name: 'Prime Video', subtitle: 'Amazon MGM Studios & blockbusters', logo: '/providers/prime.png' },
  { id: '2616|2303|582', name: 'Paramount+', subtitle: 'Paramount Pictures, CBS & Showtime', logo: '/providers/paramount.png' },
  { id: '386', name: 'Peacock', subtitle: 'Universal Pictures & NBC series', logo: '/providers/peacock.png' },
  { id: '283', name: 'Crunchyroll', subtitle: 'Simulcast anime from Japan', logo: '/providers/crunchyroll.png' },
  { id: '526|80', name: 'AMC+', subtitle: 'Prestige series & independent cinema', logo: '/providers/amc.png' },
  { id: '43', name: 'STARZ', subtitle: 'Original drama & hit movies', logo: '/providers/starz.png' },
  { id: '11', name: 'MUBI', subtitle: 'Curated auteur & festival films', logo: '/providers/mubi.png' },
];

const CAROUSEL_ITEMS: FlexCarouselItem[] = STREAMING_PLATFORMS.map(p => ({
  src: p.logo,
  alt: p.name,
  title: p.name,
  subtitle: p.subtitle,
}));

function formatCatalogTitle(catalog:InstalledAddon['manifest']['catalogs'][number]){
  const typeLabel=catalog.type==='movie'?'Movies':catalog.type==='anime'?'Anime':'Series';
  const raw=(catalog.name||catalog.id||'Featured').trim();
  const base=raw.toLowerCase()==='top'?`Popular ${typeLabel}`:raw.toLowerCase()==='year'?`New Release ${typeLabel}`:raw.toLowerCase()==='imdbrating'?`Top Rated ${typeLabel}`:raw;
  return base.toLowerCase().includes(typeLabel.toLowerCase())?base:`${base} · ${typeLabel}`;
}

function AddonCatalogSection({addon,catalog}:{addon:InstalledAddon;catalog:InstalledAddon['manifest']['catalogs'][number]}){
  const result=useQuery({queryKey:['addon-catalog',addon.transportUrl,catalog.type,catalog.id],queryFn:({signal})=>addonCatalog(addon,catalog.type,catalog.id,signal)});
  const items=(result.data||[]).slice(0,18).map(item=>{
    let poster='/poster-placeholder.svg';try{if(item.poster)poster=httpsUrl(item.poster);}catch{/* fallback */}
    let backdrop:string|undefined;
    try{if(item.background)backdrop=httpsUrl(item.background);}catch{/* fallback */}
    if(!backdrop&&/^tt\d+$/.test(item.id))backdrop=`https://images.metahub.space/background/medium/${encodeURIComponent(item.id)}/img`;
    const route=`/addons/${encodeURIComponent(addon.manifest.id)}/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}`;
    const rating=item.imdbRating!=null?Number(item.imdbRating):undefined;
    return {id:item.id,title:item.name,posterUrl:poster,backdropUrl:backdrop||poster,mediaType:(item.type==='movie'?'movie':item.type==='anime'?'anime':'tv') as 'movie'|'tv'|'anime',year:item.releaseInfo,rating:Number.isFinite(rating)?rating:undefined,description:item.description,detailTo:route,playTo:route};
  });
  return <ContentSection title={formatCatalogTitle(catalog)} eyebrow={`${addon.manifest.name.toUpperCase()} CATALOG`} items={items} loading={result.isPending} landscape={false} viewMoreLink="/addons"/>;
}

export default function Index() {
  const [sceneStyle,setSceneStyle]=useState<CSSProperties>();
  const [selectedPlatform,setSelectedPlatform]=useState<StreamingPlatform|null>(null);
  const { items: saved } = useWatchlist();
  const { addons } = useAddons();
  const addonCatalogs = addons.filter(a=>a.enabled).flatMap(addon=>addon.manifest.catalogs.filter(c=>!c.extra?.some(e=>e.isRequired)).map(catalog=>({addon,catalog})));
  useSEO({title:'A&D MAX — A world of stories',description:'Discover your next great film, unforgettable series, and favorite anime.'});
  const trending = useQuery({queryKey:['home-trending'],queryFn: async () => (await tmdbApi.getTrending()).data.results.filter((i:any) => ['movie','tv'].includes(i.media_type)).map((i:any) => toMediaItem(i))});
  const movies = useQuery({queryKey:['home-movies'],queryFn: async () => (await tmdbApi.getPopularMovies()).data.results.map((i:any) => toMediaItem(i,'movie'))});
  const series = useQuery({queryKey:['home-series'],queryFn: async () => (await tmdbApi.getPopularTVShows()).data.results.map((i:any) => toMediaItem(i,'tv'))});
  const rated = useQuery({queryKey:['home-rated'],queryFn: async () => (await tmdbApi.getTopRatedMovies()).data.results.map((i:any) => toMediaItem(i,'movie'))});

  const providerMovies = useQuery({
    queryKey:['provider-movies',selectedPlatform?.id],
    enabled:!!selectedPlatform,
    queryFn:async()=> (await tmdbApi.discoverMovies({with_watch_providers:selectedPlatform!.id,watch_region:'US',sort_by:'popularity.desc'})).data.results.map((i:any)=>toMediaItem(i,'movie'))
  });
  const providerSeries = useQuery({
    queryKey:['provider-series',selectedPlatform?.id],
    enabled:!!selectedPlatform,
    queryFn:async()=> (await tmdbApi.discoverTV({with_watch_providers:selectedPlatform!.id,watch_region:'US',sort_by:'popularity.desc'})).data.results.map((i:any)=>toMediaItem(i,'tv'))
  });

  const featured = (trending.data || []).filter((i:any) => i.backdropUrl).slice(0,5).map((item:any) => ({...item,imageUrl:item.backdropUrl,description:item.description || '',ctaLink:`/${item.mediaType}/${item.id}`}));
  return <MainLayout theme={sceneStyle}><div className="home-world">
    {trending.isPending ? <HeroSkeleton /> : trending.isError ? <div className="page-shell empty-state"><h1>The stories will be right back.</h1><p>We couldn’t reach the catalog.</p><Button onClick={() => trending.refetch()}>Try again</Button></div> : <HeroBanner featuredItems={featured} onThemeChange={setSceneStyle} />}

    <section className="provider-hub-section" aria-label="Browse by streaming service">
      <header className="section-heading page-shell">
        <div>
          <p className="eyebrow">CHANNELS & STREAMING HUBS</p>
          <h2>Explore by network</h2>
        </div>
        {selectedPlatform&&<button type="button" className="provider-clear-btn" onClick={()=>setSelectedPlatform(null)}>
          <img src={selectedPlatform.logo} alt="" className="h-5 w-5 rounded-md object-cover"/>
          <span>Filtering by {selectedPlatform.name}</span>
          <X size={14}/>
        </button>}
      </header>
      <div className="provider-flex-stage">
        <FlexCarousel
          items={CAROUSEL_ITEMS}
          preset="liquid"
          intro="bloom"
          fit="square"
          cardHeight={0.58}
          gap={18}
          radius={26}
          squeeze={0.18}
          focusOnClick={false}
          captureWheel={false}
          captions
          onSelect={index => {
            const picked = STREAMING_PLATFORMS[index];
            if (picked) setSelectedPlatform(prev => prev?.id === picked.id ? null : picked);
          }}
        />
      </div>
      <div className="provider-pill-rail page-shell" role="group" aria-label="Quick select streaming network">
        <button type="button" className={`provider-logo-pill ${!selectedPlatform?'is-active':''}`} aria-pressed={!selectedPlatform} onClick={()=>setSelectedPlatform(null)}>
          <span>All Networks</span>
        </button>
        {STREAMING_PLATFORMS.map(p=>{
          const active=selectedPlatform?.id===p.id;
          return <button key={p.id} type="button" className={`provider-logo-pill ${active?'is-active':''}`} aria-pressed={active} onClick={()=>setSelectedPlatform(active?null:p)}>
            <img src={p.logo} alt="" loading="lazy"/>
            <span>{p.name}</span>
          </button>;
        })}
      </div>
    </section>

    {selectedPlatform&&<div className="provider-filtered-showcase">
      <ContentSection title={`Popular Movies on ${selectedPlatform.name}`} eyebrow={`${selectedPlatform.name.toUpperCase()} MOVIES`} items={(providerMovies.data||[]).slice(0,16)} loading={providerMovies.isPending} landscape={false} showViewMore={false}/>
      <ContentSection title={`Hit Series on ${selectedPlatform.name}`} eyebrow={`${selectedPlatform.name.toUpperCase()} SERIES`} items={(providerSeries.data||[]).slice(0,16)} loading={providerSeries.isPending} landscape={false} showViewMore={false}/>
    </div>}

    <SpotlightCarousel items={(trending.data || []).filter((item:any)=>item.backdropUrl).slice(0,8)}/>
    <ContinueWatching/>
    <ContentSection title="Find your next favorite" eyebrow="THE BIG SCREEN, ANY SCREEN" items={(movies.data || []).slice(0,14)} loading={movies.isPending} landscape={false} viewMoreLink="/movies" />
    {movies.isError && <div className="page-shell"><Button variant="secondary" onClick={() => movies.refetch()}>Reload movies</Button></div>}
    <section className="editorial-band page-shell"><div><p className="eyebrow">ENDLESS POSSIBILITIES</p><h2>One more episode.<br />A whole new world.</h2><p>Get lost in the stories worth staying in for.</p><Button variant="secondary" asChild><Link to="/tv-series">Explore series <ArrowUpRight size={17} /></Link></Button></div><div className="editorial-posters">{(series.data || []).slice(0,3).map((item:any) => <Link key={item.id} to={`/tv/${item.id}`}><img src={item.posterUrl} alt={item.title} loading="lazy" /></Link>)}</div></section>
    <ContentSection title="Series to settle into" eyebrow="WORTH EVERY EPISODE" items={(series.data || []).slice(0,12)} loading={series.isPending} landscape={false} viewMoreLink="/tv-series" />
    {series.isError && <div className="page-shell"><Button variant="secondary" onClick={() => series.refetch()}>Reload series</Button></div>}
    <ContentSection title="The ones that stay with you" eyebrow="HIGHLY RATED" items={(rated.data || []).slice(0,12)} loading={rated.isPending} viewMoreLink="/movies/top-rated" landscape={false} />
    {addonCatalogs.map(({addon,catalog})=><AddonCatalogSection key={`${addon.manifest.id}-${catalog.type}-${catalog.id}`} addon={addon} catalog={catalog}/>)}
    {saved.length > 0 && <ContentSection title="Your own little universe" eyebrow="MY LIST" items={saved} landscape={false} viewMoreLink="/library" />}
  </div></MainLayout>;
}
