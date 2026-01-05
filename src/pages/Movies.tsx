import React, { useEffect, useState } from 'react';
import { useSEO } from '@/hooks/useSEO';
import MainLayout from '@/layouts/MainLayout';
import ContentSection from '@/components/home/ContentSection';
import { Skeleton } from '@/components/ui/skeleton';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';

interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'movie';
}

const Movies: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);

  useSEO({
    title: 'Popular, Top-Rated and Upcoming Movies – WolziFlix',
    description: 'Browse popular, top-rated and upcoming movies. Watch trailers and stream instantly on WolziFlix.',
    keywords: ['movies', 'popular movies', 'top rated films', 'upcoming movies', 'watch movies online'],
    type: 'website'
  })

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        // Fetch popular movies
        const popularResponse = await tmdbApi.getPopularMovies();
        const popularData = popularResponse.data.results;
        const processedPopular = popularData.map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: movie.vote_average,
          year: (movie.release_date || "").substring(0, 4),
          mediaType: 'movie' as const
        }));
        
        setPopularMovies(processedPopular);
        
        // Fetch top rated movies
        const topRatedResponse = await tmdbApi.getTopRatedMovies();
        const topRatedData = topRatedResponse.data.results;
        const processedTopRated = topRatedData.map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: movie.vote_average,
          year: (movie.release_date || "").substring(0, 4),
          mediaType: 'movie' as const
        }));
        
        setTopRatedMovies(processedTopRated);
        
        // Fetch upcoming movies
        const upcomingResponse = await tmdbApi.getUpcomingMovies();
        const upcomingData = upcomingResponse.data.results;
        const processedUpcoming = upcomingData.map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: movie.vote_average,
          year: (movie.release_date || "").substring(0, 4),
          mediaType: 'movie' as const
        }));
        
        setUpcomingMovies(processedUpcoming);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pt-24 sm:pt-8 pb-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">🎬 Movies</h1>
        
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
              title="Popular Movies"
              items={popularMovies.slice(0, 12)}
              viewMoreLink="/movies/popular"
              showViewMore={true}
              className="mb-12"
            />
            
            <ContentSection
              title="Top Rated Movies"
              items={topRatedMovies.slice(0, 12)}
              viewMoreLink="/movies/top-rated"
              showViewMore={true}
              className="mb-12"
            />
            
            <ContentSection
              title="Upcoming Movies"
              items={upcomingMovies.slice(0, 12)}
              viewMoreLink="/movies/upcoming"
              showViewMore={true}
              className="mb-12"
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Movies;