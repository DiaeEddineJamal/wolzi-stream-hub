import React, { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import ContentSection from '@/components/home/ContentSection';
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Movies</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            <ContentSection
              title="Popular Movies"
              items={popularMovies}
              className="mb-12"
            />
            
            <ContentSection
              title="Top Rated Movies"
              items={topRatedMovies}
              className="mb-12"
            />
            
            <ContentSection
              title="Upcoming Movies"
              items={upcomingMovies}
              className="mb-12"
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Movies; 