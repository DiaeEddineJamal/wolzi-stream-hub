import { useQuery } from '@tanstack/react-query';
import { HeroSkeleton } from '@/components/primitives/Skeletons';
import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Film, Tv, Sparkles, Compass } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import HeroBanner from '@/components/home/HeroBanner';
import ContinueWatching from '@/components/home/ContinueWatching';
import SpotlightCarousel from '@/components/home/SpotlightCarousel';
import ContentSection from '@/components/home/ContentSection';
import { Button } from '@/components/ui/button';
import tmdbApi from '@/integrations/api/tmdb';
import { toMediaItem } from '@/lib/media';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useSEO } from '@/hooks/useSEO';
export default function Index() {
  const [sceneStyle,setSceneStyle]=useState<CSSProperties>();
  const { items: saved } = useWatchlist();
  useSEO({title:'A&D MAX — A world of stories',description:'Discover your next great film, unforgettable series, and favorite anime.'});
  const trending = useQuery({queryKey:['home-trending'],queryFn: async () => (await tmdbApi.getTrending()).data.results.filter(i => ['movie','tv'].includes(i.media_type)).map(i => toMediaItem(i))});
  const movies = useQuery({queryKey:['home-movies'],queryFn: async () => (await tmdbApi.getPopularMovies()).data.results.map(i => toMediaItem(i,'movie'))});
  const series = useQuery({queryKey:['home-series'],queryFn: async () => (await tmdbApi.getPopularTVShows()).data.results.map(i => toMediaItem(i,'tv'))});
  const rated = useQuery({queryKey:['home-rated'],queryFn: async () => (await tmdbApi.getTopRatedMovies()).data.results.map(i => toMediaItem(i,'movie'))});
  const featured = (trending.data || []).filter(i => i.backdropUrl).slice(0,5).map(item => ({...item,imageUrl:item.backdropUrl,description:item.description || '',ctaLink:`/${item.mediaType}/${item.id}`}));
  return <MainLayout theme={sceneStyle}><div className="home-world">
    {trending.isPending ? <HeroSkeleton /> : trending.isError ? <div className="page-shell empty-state"><h1>The stories will be right back.</h1><p>We couldn’t reach the catalog.</p><Button onClick={() => trending.refetch()}>Try again</Button></div> : <HeroBanner featuredItems={featured} onThemeChange={setSceneStyle} />}
    <SpotlightCarousel items={(trending.data || []).filter(item=>item.backdropUrl).slice(0,8)}/>
    <ContinueWatching/>
    <ContentSection title="Find your next favorite" eyebrow="THE BIG SCREEN, ANY SCREEN" items={(movies.data || []).slice(0,14)} loading={movies.isPending} landscape={false} viewMoreLink="/movies" />
    {movies.isError && <div className="page-shell"><Button variant="secondary" onClick={() => movies.refetch()}>Reload movies</Button></div>}
    <section className="editorial-band page-shell"><div><p className="eyebrow">ENDLESS POSSIBILITIES</p><h2>One more episode.<br />A whole new world.</h2><p>Get lost in the stories worth staying in for.</p><Button variant="secondary" asChild><Link to="/tv-series">Explore series <ArrowUpRight size={17} /></Link></Button></div><div className="editorial-posters">{(series.data || []).slice(0,3).map(item => <Link key={item.id} to={`/tv/${item.id}`}><img src={item.posterUrl} alt={item.title} loading="lazy" /></Link>)}</div></section>
    <ContentSection title="Series to settle into" items={(series.data || []).slice(0,12)} loading={series.isPending} viewMoreLink="/tv-series" />
    {series.isError && <div className="page-shell"><Button variant="secondary" onClick={() => series.refetch()}>Reload series</Button></div>}
    <ContentSection title="The ones that stay with you" eyebrow="HIGHLY RATED" items={(rated.data || []).slice(0,12)} loading={rated.isPending} viewMoreLink="/movies/top-rated" landscape={false} />
    {saved.length > 0 && <ContentSection title="Your own little universe" eyebrow="MY LIST" items={saved} viewMoreLink="/library" />}
  </div></MainLayout>;
}
