import React, { useEffect, useState } from 'react';
import { useSEO } from '@/hooks/useSEO';
import MainLayout from '@/layouts/MainLayout';
import ContentSection from '@/components/home/ContentSection';
import { Skeleton } from '@/components/ui/skeleton';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import axios from 'axios';

interface AnimeItem {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'tv';  // Changed from 'anime' to 'tv' to match TMDB format
  description?: string;
}

// Create an instance of the TMDB API client similar to the one in tmdbApi.ts
const TMDB_API_KEY = '2545dfe546bd75d5de4657e85942ecb2';
const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: TMDB_API_KEY,
  },
});

const Anime: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [popularAnime, setPopularAnime] = useState<AnimeItem[]>([]);
  const [topRatedAnime, setTopRatedAnime] = useState<AnimeItem[]>([]);
  const [onAirAnime, setOnAirAnime] = useState<AnimeItem[]>([]);
  useSEO({
    title: 'Popular, Top-Rated and On-Air Anime – WolziFlix',
    description: 'Discover trending, top-rated and currently airing anime. Stream episodes and follow your favorite series on WolziFlix.',
    keywords: ['anime', 'popular anime', 'top rated anime', 'on-air anime', 'watch anime'],
    type: 'website'
  })
  
  useEffect(() => {
    const fetchAnimeData = async () => {
      setLoading(true);
      try {
        // Fetch anime using TMDB's discover/tv with animation genre (16) and Japanese language
        const popularResponse = await api.get('/discover/tv', { 
          params: { 
            with_genres: '16', // Animation genre
            with_original_language: 'ja', // Japanese language
            sort_by: 'popularity.desc',
            page: 1
          } 
        });
        
        const processedPopular = popularResponse.data.results.map((anime: any) => ({
          id: anime.id.toString(),
          title: anime.name,
          posterUrl: getPosterUrl(anime.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: anime.vote_average || 0,
          year: (anime.first_air_date || "").substring(0, 4),
          mediaType: 'tv' as const,
          description: anime.overview
        }));
        setPopularAnime(processedPopular);
        
        // Fetch top rated anime (using TMDB)
        const topRatedResponse = await api.get('/discover/tv', { 
          params: { 
            with_genres: '16', // Animation genre
            with_original_language: 'ja', // Japanese language
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100, // Ensure we get anime with significant votes
            page: 1
          } 
        });
        
        const processedTopRated = topRatedResponse.data.results.map((anime: any) => ({
          id: anime.id.toString(),
          title: anime.name,
          posterUrl: getPosterUrl(anime.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: anime.vote_average || 0,
          year: (anime.first_air_date || "").substring(0, 4),
          mediaType: 'tv' as const,
          description: anime.overview
        }));
        setTopRatedAnime(processedTopRated);
        
        // Fetch currently airing anime (using TMDB's on_the_air endpoint with filters)
        const onAirResponse = await api.get('/discover/tv', { 
          params: { 
            with_genres: '16', // Animation genre
            with_original_language: 'ja', // Japanese language
            with_status: 'Returning Series', // Currently airing
            sort_by: 'first_air_date.desc', // Sort by newest first
            'air_date.gte': new Date().toISOString().split('T')[0], // Current or future air date
            page: 1
          } 
        });
        
        const processedOnAir = onAirResponse.data.results.map((anime: any) => ({
          id: anime.id.toString(),
          title: anime.name,
          posterUrl: getPosterUrl(anime.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: anime.vote_average || 0,
          year: (anime.first_air_date || "").substring(0, 4),
          mediaType: 'tv' as const,
          description: anime.overview
        }));
        setOnAirAnime(processedOnAir);
        
      } catch (error) {
        console.error('Error fetching anime data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimeData();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pt-24 sm:pt-8 pb-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">🎌 Anime</h1>
        
        {loading ? (
          <div className="space-y-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 bg-slate-800/50" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full bg-slate-800/50 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 bg-slate-800/50" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full bg-slate-800/50 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ContentSection
              title="Popular Anime"
              items={popularAnime.slice(0, 12)}
              viewMoreLink="/view-all/anime/popular"
              showViewMore={true}
              className="mb-12"
            />
            
            <ContentSection
              title="Top Rated Anime"
              items={topRatedAnime.slice(0, 12)}
              viewMoreLink="/view-all/anime/top-rated"
              showViewMore={true}
              className="mb-12"
            />
            
            <ContentSection
              title="Currently Airing Anime"
              items={onAirAnime.slice(0, 12)}
              viewMoreLink="/view-all/anime/on-air"
              showViewMore={true}
              className="mb-12"
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Anime;