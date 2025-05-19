import React, { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import HeroBanner from "@/components/home/HeroBanner";
import ContentSection from "@/components/home/ContentSection";
import StaticCarousel from "@/components/home/StaticCarousel";
import tmdbApi, { getPosterUrl, getBackdropUrl } from "@/integrations/api/tmdb";
import jikanApi from "@/integrations/api/jikan";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'movie' | 'tv' | 'anime';
  overview?: string;
  backdropUrl?: string;
}

interface HeroBannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mediaType: string;
  ctaLink: string;
}

const Index: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<HeroBannerItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<MediaItem[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<MediaItem[]>([]);
  const [animeShows, setAnimeShows] = useState<MediaItem[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch trending content
        const trendingResponse = await tmdbApi.getTrending();
        const trendingData = trendingResponse.data.results;
        
        // Get featured items for the hero banner (top 5 with backdrop images)
        const heroItems = trendingData
          .filter((item: any) => item.backdrop_path)
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id.toString(),
            title: item.title || item.name,
            description: item.overview || "",
            imageUrl: getBackdropUrl(item.backdrop_path) || "",
            mediaType: item.media_type,
            ctaLink: `/${item.media_type}/${item.id}`
          }));
        
        setFeaturedItems(heroItems);
        
        // Process trending items
        const processedTrending = trendingData.map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.name,
          posterUrl: getPosterUrl(item.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: item.vote_average,
          year: (item.release_date || item.first_air_date || "").substring(0, 4),
          mediaType: item.media_type,
          overview: item.overview
        }));
        
        setTrending(processedTrending);
        
        // Fetch popular movies
        const popularMoviesResponse = await tmdbApi.getPopularMovies();
        const popularMoviesData = popularMoviesResponse.data.results;
        
        const processedPopularMovies = popularMoviesData.map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: movie.vote_average,
          year: (movie.release_date || "").substring(0, 4),
          mediaType: 'movie',
          overview: movie.overview
        }));
        
        setPopularMovies(processedPopularMovies);
        
        // Fetch top rated movies
        const topRatedMoviesResponse = await tmdbApi.getTopRatedMovies();
        const topRatedMoviesData = topRatedMoviesResponse.data.results;
        
        const processedTopRatedMovies = topRatedMoviesData.map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: movie.vote_average,
          year: (movie.release_date || "").substring(0, 4),
          mediaType: 'movie',
          overview: movie.overview
        }));
        
        setTopRatedMovies(processedTopRatedMovies);
        
        // Fetch popular TV shows
        const popularTVResponse = await tmdbApi.getPopularTVShows();
        const popularTVData = popularTVResponse.data.results;
        
        const processedPopularTV = popularTVData.map((show: any) => ({
          id: show.id.toString(),
          title: show.name,
          posterUrl: getPosterUrl(show.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: show.vote_average,
          year: (show.first_air_date || "").substring(0, 4),
          mediaType: 'tv',
          overview: show.overview
        }));
        
        setPopularTVShows(processedPopularTV);
        
        // Fetch top rated TV shows
        const topRatedTVResponse = await tmdbApi.getTopRatedTVShows();
        const topRatedTVData = topRatedTVResponse.data.results;
        
        const processedTopRatedTV = topRatedTVData.map((show: any) => ({
          id: show.id.toString(),
          title: show.name,
          posterUrl: getPosterUrl(show.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: show.vote_average,
          year: (show.first_air_date || "").substring(0, 4),
          mediaType: 'tv',
          overview: show.overview
        }));
        
        setTopRatedTVShows(processedTopRatedTV);
        
        // Fetch anime shows from Jikan API
        const animeResponse = await jikanApi.getTopAnime(1, 20, 'bypopularity');
        const animeData = animeResponse.data.data;
        
        const processedAnime = animeData.map((anime: any) => ({
          id: anime.mal_id.toString(),
          title: anime.title,
          posterUrl: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
          rating: anime.score || 0,
          year: (anime.aired.from || "").substring(0, 4),
          mediaType: 'anime',
          overview: anime.synopsis
        }));
        
        setAnimeShows(processedAnime);
        
        // Fetch upcoming movies
        const upcomingResponse = await tmdbApi.getUpcomingMovies();
        const upcomingData = upcomingResponse.data.results;
        
        const processedUpcoming = upcomingData.map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.title,
          posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: movie.vote_average,
          year: (movie.release_date || "").substring(0, 4),
          mediaType: 'movie',
          overview: movie.overview
        }));
        
        setUpcomingMovies(processedUpcoming);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      {/* Hero Banner */}
      {featuredItems.length > 0 ? (
        <HeroBanner
          featuredItems={featuredItems}
          autoPlayInterval={7000}
        />
      ) : (
        <div className="hero-banner">
          <div className="w-full h-full bg-gradient-to-r from-wolzi-dark-gray to-wolzi-bg flex items-center">
            <div className="container mx-auto px-4">
              <div className="hero-banner-content">
                <h1 className="text-4xl font-bold mb-2">Welcome to WolziFlix</h1>
                <p className="text-wolzi-text mb-6">
                  Discover and stream thousands of movies, TV shows, and anime in one place
                </p>
                <Button asChild className="glow-button">
                  <Link to="/movies">Start Exploring</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Content Sections */}
      <div className="pt-8 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
        <ContentSection
          title="Trending Now"
              items={trending}
          viewMoreLink="/trending"
              className="mt-12"
        />
        
        <ContentSection
          title="Popular Movies"
          items={popularMovies}
          viewMoreLink="/movies"
              className="mt-12"
            />
            
            <ContentSection
              title="Top Rated Movies"
              items={topRatedMovies}
              viewMoreLink="/movies/top-rated"
              className="mt-12"
        />
        
        <ContentSection
              title="Top TV Series"
              items={topRatedTVShows}
              viewMoreLink="/tv-series"
              className="mt-12"
            />
            
            <ContentSection
              title="Anime Shows"
              items={animeShows}
          viewMoreLink="/anime"
              className="mt-12"
        />
        
        <ContentSection
              title="Upcoming Movies"
              items={upcomingMovies}
              viewMoreLink="/movies/upcoming"
              className="mt-12"
        />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;