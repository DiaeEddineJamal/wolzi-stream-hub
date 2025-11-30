import React, { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { motion } from "framer-motion";
import MainLayout from "@/layouts/MainLayout";
import HeroBanner from "@/components/home/HeroBanner";
import ContentSection from "@/components/home/ContentSection";
import StaticCarousel from "@/components/home/StaticCarousel";
import tmdbApi, { getPosterUrl, getBackdropUrl } from "@/integrations/api/tmdb";
import jikanApi from "@/integrations/api/jikan";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Play, Clock } from "lucide-react";
import axios from 'axios';

// Add the axios instance for anime similar to Anime.tsx
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const api = axios.create({
  baseURL: import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3',
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

interface WatchHistoryItem {
  id: string;
  content_id: string;
  content_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string | null;
  watched_at: string;
  progress: number;
  duration: number;
  progress_percent: number;
  season?: number;
  episode?: number;
}

interface HeroBannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mediaType: string;
  ctaLink: string;
  trailerKey?: string | null;
}

const Index: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<HeroBannerItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<MediaItem[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<MediaItem[]>([]);
  const [animeShows, setAnimeShows] = useState<MediaItem[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<MediaItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch watch history if user is logged in
  useEffect(() => {
    if (user && isLoggedIn) {
      fetchWatchHistory();
    }
  }, [user, isLoggedIn]);

  const fetchWatchHistory = async () => {
    try {
      setHistoryLoading(true);
      
      if (!user || !user.id) {
        console.log('Index page: User not logged in or missing ID, skipping watch history fetch');
        return;
      }
      
      console.log('Index page: Fetching watch history for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('Error fetching watch history:', error);
          return;
        }
        
        console.log('Index page raw watch history data:', JSON.stringify(data, null, 2));
        
        // Map data to correct interface fields if needed
        const processedHistory = data?.map(item => ({
          ...item,
          // Handle possible field name differences
          content_type: item.content_type || item.media_type,
          content_id: item.content_id || item.media_id,
        })) || [];
        
        console.log('Index page processed watch history:', JSON.stringify(processedHistory, null, 2));
        console.log('Index page: setting watchHistory state with length:', processedHistory.length);
        
        if (processedHistory.length > 0) {
          console.log('Index page: Watch history loaded successfully, found', processedHistory.length, 'items');
          console.log('First item:', JSON.stringify(processedHistory[0], null, 2));
        } else {
          console.log('Index page: No watch history found for user');
        }
        
        setWatchHistory(processedHistory);
      } catch (supabaseError) {
        console.error('Supabase error in fetchWatchHistory:', supabaseError);
      }
    } catch (error) {
      console.error('Error in fetchWatchHistory:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper function to format watched time
  const formatTime = (seconds: number) => {
    if (!seconds) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };
  
  // Helper function to determine continue watching URL
  const getContinueWatchingUrl = (item: WatchHistoryItem) => {
    if (item.content_type === 'movie') {
      return `/watch/movie/${item.content_id}`;
    } else if (item.content_type === 'tv') {
      return `/watch/tv/${item.content_id}/season/${item.season}/episode/${item.episode}`;
    } else if (item.content_type === 'anime') {
      return `/watch/anime/${item.content_id}/episode/${item.episode}`;
    }
    return '';
  };

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
          .slice(0, 5);
          
        // Fetch trailers for each hero item
        const heroItemsWithTrailers = await Promise.all(
          heroItems.map(async (item: any) => {
            let trailerKey = null;
            try {
              // Fetch detailed information with videos based on media type
              const detailsResponse = item.media_type === 'movie' 
                ? await tmdbApi.getMovieDetails(item.id)
                : await tmdbApi.getTVShowDetails(item.id);
                
              const videos = detailsResponse.data.videos?.results || [];
              
              // Find official trailers first
              const officialTrailer = videos.find(
                (video: any) => video.type === 'Trailer' && video.site === 'YouTube' && video.official === true
              );
              
              // If no official trailer, try any trailer
              const anyTrailer = videos.find(
                (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
              );
              
              // If still nothing, try any video
              const anyVideo = videos.find(
                (video: any) => video.site === 'YouTube'
              );
              
              if (officialTrailer) {
                trailerKey = officialTrailer.key;
              } else if (anyTrailer) {
                trailerKey = anyTrailer.key;
              } else if (anyVideo) {
                trailerKey = anyVideo.key;
              }
            } catch (error) {
              console.error(`Error fetching trailer for ${item.media_type} ${item.id}:`, error);
            }
            
            return {
              id: item.id.toString(),
              title: item.title || item.name,
              description: item.overview || "",
              imageUrl: getBackdropUrl(item.backdrop_path) || "",
              mediaType: item.media_type,
              ctaLink: `/${item.media_type}/${item.id}`,
              trailerKey: trailerKey
            };
          })
        );
        
        setFeaturedItems(heroItemsWithTrailers);
        
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

  useSEO({
    title: "WolziFlix – Stream Movies, TV Shows & Anime",
    description: "Stream popular movies, top-rated TV series, and trending anime. Watch trailers, browse categories, and continue watching across devices.",
    keywords: ["streaming", "movies", "tv series", "anime", "watch online", "trailers"],
    type: "website",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": (import.meta.env.VITE_SITE_URL || window.location.origin),
      "name": "WolziFlix",
      "potentialAction": {
        "@type": "SearchAction",
        "target": (import.meta.env.VITE_SITE_URL || window.location.origin) + "/search?query={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  })

  return (
    <MainLayout>
      <h1 className="sr-only">WolziFlix – Stream Movies, TV Series and Anime</h1>
      {/* Hero Banner */}
      {featuredItems.length > 0 ? (
        <HeroBanner
          featuredItems={featuredItems}
          autoPlayInterval={12000}
        />
      ) : (
        <div className="hero-banner">
          <div className="w-full h-full bg-gradient-to-r from-wolzi-dark-gray to-wolzi-bg flex items-center justify-center">
            <div className="loading-spinner"></div>
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
          <div className="container mx-auto px-4">
            {/* Continue Watching Section - Only show if user is logged in and has watch history */}
            {user && isLoggedIn && watchHistory.length > 0 && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Continue Watching</h2>
                  <Link to="/watch-history" className="text-wolzi-accent hover:text-wolzi-accent/80 text-sm">
                    View All
                  </Link>
                </div>
                
                <div className="relative">
                  <div className="overflow-x-auto hide-scrollbar">
                    <div className="flex gap-4 p-4">
                      {watchHistory.map((item) => (
                        <motion.div 
                          key={item.id} 
                          className="min-w-[180px] max-w-[180px] rounded-lg overflow-hidden bg-wolzi-dark-gray/30 relative group"
                          initial={{ scale: 1, y: 0, zIndex: 0, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" }}
                          whileHover={{ 
                            scale: 1.05, 
                            y: -6, 
                            zIndex: 10,
                            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(168, 85, 247, 0.4)",
                            transition: { duration: 0.3, ease: "easeOut" }
                          }}
                          whileTap={{ scale: 0.98, y: -2, transition: { duration: 0.1 } }}
                        >
                          <Link to={`/${item.content_type}/${item.content_id}`}>
                            <div className="relative aspect-[2/3] overflow-hidden">
                              <img 
                                src={item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : getPosterUrl(item.poster_path)) : 'https://via.placeholder.com/300x450?text=No+Image'} 
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-300"
                              />
                              
                              {/* Progress bar */}
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                <div 
                                  className="h-full bg-wolzi-accent" 
                                  style={{ width: `${item.progress_percent || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Content info */}
                          <div className="p-2">
                            <h3 className="font-medium text-sm line-clamp-1" title={item.title}>
                              {item.title}
                            </h3>
                            <div className="flex justify-between items-center mt-1 text-xs text-wolzi-light-gray">
                              <span>
                                {item.progress_percent}%
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(item.progress)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Play button overlay */}
                          <Link 
                            to={getContinueWatchingUrl(item)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-wolzi-accent/90 hover:bg-wolzi-accent rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
                            title="Continue Watching"
                          >
                            <Play className="h-5 w-5 text-white" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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

            {/* SEO & Welcome Section - AdSense Requirement for Text Content */}
            <div className="mt-20 mb-8 p-6 md:p-8 bg-gradient-to-b from-wolzi-dark-gray/40 to-transparent rounded-2xl border border-white/5 backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-6 text-white text-center md:text-left">Welcome to WolziFlix</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    WolziFlix is your premier destination for streaming the latest movies, TV series, and anime. 
                    We provide a seamless entertainment experience with a vast library of content ranging from 
                    Hollywood blockbusters to classic cinema, trending TV shows, and popular Asian dramas.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Our platform is designed to offer high-quality streaming with minimal buffering, ensuring 
                    you can enjoy your favorite content anytime, anywhere. With personalized recommendations 
                    and a user-friendly interface, discovering your next favorite show has never been easier.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-black/30 transition-colors">
                    <h3 className="text-lg font-semibold text-wolzi-accent mb-2">Unlimited Library</h3>
                    <p className="text-sm text-gray-400">
                      Access thousands of titles across multiple genres. From action and romance to sci-fi and documentaries.
                    </p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-black/30 transition-colors">
                    <h3 className="text-lg font-semibold text-wolzi-accent mb-2">High Definition</h3>
                    <p className="text-sm text-gray-400">
                      Experience your favorite movies and shows in stunning HD quality for the best viewing experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;