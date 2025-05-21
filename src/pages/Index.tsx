import React, { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import HeroBanner from "@/components/home/HeroBanner";
import ContentSection from "@/components/home/ContentSection";
import StaticCarousel from "@/components/home/StaticCarousel";
import tmdbApi, { getPosterUrl, getBackdropUrl } from "@/integrations/api/tmdb";
import jikanApi from "@/integrations/api/jikan";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import axios from 'axios';

// Add the axios instance for anime similar to Anime.tsx
const TMDB_API_KEY = '2545dfe546bd75d5de4657e85942ecb2';
const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: TMDB_API_KEY,
  },
});

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
        
        // Fetch anime shows from TMDB API (TV shows with animation genre and Japanese language)
        const animeResponse = await api.get('/discover/tv', { 
          params: { 
            with_genres: '16', // Animation genre
            with_original_language: 'ja', // Japanese language
            sort_by: 'popularity.desc',
            page: 1
          } 
        });
        
        const processedAnime = animeResponse.data.results.map((anime: any) => ({
          id: anime.id.toString(),
          title: anime.name,
          posterUrl: getPosterUrl(anime.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
          rating: anime.vote_average || 0,
          year: (anime.first_air_date || "").substring(0, 4),
          mediaType: 'tv', // Change from 'anime' to 'tv'
          overview: anime.overview
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
          items={trending.slice(0, 12)} // Keep the homepage concise
          viewMoreLink="/trending/all"
          showViewMore={true}
          className="mt-12"
        />
        
        <ContentSection
          title="Popular Movies"
          items={popularMovies.slice(0, 12)}
          viewMoreLink="/movies/popular"
          showViewMore={true}
          className="mt-12"
        />
            
        <ContentSection
          title="Top Rated Movies"
          items={topRatedMovies.slice(0, 12)}
          viewMoreLink="/movies/top-rated"
          showViewMore={true}
          className="mt-12"
        />
        
        {/* Assuming "Top TV Series" on Index means Popular for broader appeal, link to /tv/popular */}
        {/* If you want a dedicated "Top Rated TV" section on Index, create another ContentSection for topRatedTVShows */}
        <ContentSection
          title="Popular TV Series" 
          items={popularTVShows.slice(0, 12)} // Changed from topRatedTVShows to popularTVShows for this section
          viewMoreLink="/tv/popular"
          showViewMore={true}
          className="mt-12"
        />
            
        {animeShows.length > 0 && (
          <ContentSection
            title="Popular Anime"
            items={animeShows.slice(0, 12)}
            viewMoreLink="/anime"
            showViewMore={true}
            className="mb-12"
          />
        )}
        
        <ContentSection
          title="Upcoming Movies"
          items={upcomingMovies.slice(0, 12)}
          viewMoreLink="/movies/upcoming"
          showViewMore={true}
          className="mt-12"
        />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;