import React, { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import ContentSection from '@/components/home/ContentSection';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';

interface TVShow {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'tv';
}

const TVSeries: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [popularShows, setPopularShows] = useState<TVShow[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<TVShow[]>([]);

  useEffect(() => {
    const fetchTVShows = async () => {
      setLoading(true);
      try {
        // Fetch popular TV shows
        const popularResponse = await tmdbApi.getPopularTVShows();
        const popularData = popularResponse.data.results;
        const processedPopular = popularData.map((show: any) => ({
          id: show.id.toString(),
          title: show.name,
          posterUrl: getPosterUrl(show.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: show.vote_average,
          year: (show.first_air_date || "").substring(0, 4),
          mediaType: 'tv' as const
        }));
        
        setPopularShows(processedPopular);
        
        // Fetch top rated TV shows
        const topRatedResponse = await tmdbApi.getTopRatedTVShows();
        const topRatedData = topRatedResponse.data.results;
        const processedTopRated = topRatedData.map((show: any) => ({
          id: show.id.toString(),
          title: show.name,
          posterUrl: getPosterUrl(show.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: show.vote_average,
          year: (show.first_air_date || "").substring(0, 4),
          mediaType: 'tv' as const
        }));
        
        setTopRatedShows(processedTopRated);
      } catch (error) {
        console.error('Error fetching TV shows:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTVShows();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">TV Series</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            <ContentSection
              title="Popular TV Series"
              items={popularShows.slice(0, 12)}
              viewMoreLink="/tv/popular"
              showViewMore={true}
              className="mb-12"
            />
            
            <ContentSection
              title="Top Rated TV Series"
              items={topRatedShows.slice(0, 12)}
              viewMoreLink="/tv/top-rated"
              showViewMore={true}
              className="mb-12"
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default TVSeries; 