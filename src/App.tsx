import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MediaDetail from "./pages/MediaDetail";
import Movies from "./pages/Movies";
import TVSeries from "./pages/TVSeries";
import Anime from "./pages/Anime";
import WatchHistory from "./pages/WatchHistory";
import SearchResults from "./pages/SearchResults";
import Watch from "./pages/Watch";
import ViewAllPage from "./pages/ViewAllPage";
import tmdbApi, { getPosterUrl } from "./integrations/api/tmdb";
import jikanApi from "./integrations/api/jikan";
import axios from 'axios';

const queryClient = new QueryClient();

// Create a TMDB API client for anime queries
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const animeApi = axios.create({
  baseURL: import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3',
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Define MediaItem interface to match what's used in ViewAllPage
interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  mediaType: 'movie' | 'tv' | 'anime';
  overview?: string;
}

// --- Mappers ---
const tmdbMovieToMediaItem = (movie: any): MediaItem => ({
  id: movie.id.toString(),
  title: movie.title,
  posterUrl: getPosterUrl(movie.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
  rating: movie.vote_average,
  year: (movie.release_date || "").substring(0, 4),
  mediaType: 'movie',
  overview: movie.overview,
});

const tmdbTvShowToMediaItem = (tvShow: any): MediaItem => ({
  id: tvShow.id.toString(),
  title: tvShow.name,
  posterUrl: getPosterUrl(tvShow.poster_path) || "https://via.placeholder.com/500x750?text=No+Image",
  rating: tvShow.vote_average,
  year: (tvShow.first_air_date || "").substring(0, 4),
  mediaType: 'tv',
  overview: tvShow.overview,
});

const tmdbTrendingToMediaItem = (item: any): MediaItem | null => {
  const mediaType = item.media_type;
  if (mediaType === 'movie') {
    return tmdbMovieToMediaItem(item);
  } else if (mediaType === 'tv') {
    return tmdbTvShowToMediaItem(item);
  }
  return null;
};

// --- Fetch Data Functions ---
const fetchPopularMoviesPage = async (page: number) => {
  const { data } = await tmdbApi.getPopularMovies(page);
  return {
    items: data.results.map(tmdbMovieToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchTopRatedMoviesPage = async (page: number) => {
  const { data } = await tmdbApi.getTopRatedMovies(page);
  return {
    items: data.results.map(tmdbMovieToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchUpcomingMoviesPage = async (page: number) => {
  const { data } = await tmdbApi.getUpcomingMovies(page);
  return {
    items: data.results.map(tmdbMovieToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchPopularTVShowsPage = async (page: number) => {
  const { data } = await tmdbApi.getPopularTVShows(page);
  return {
    items: data.results.map(tmdbTvShowToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchTopRatedTVShowsPage = async (page: number) => {
  const { data } = await tmdbApi.getTopRatedTVShows(page);
  return {
    items: data.results.map(tmdbTvShowToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchTrendingAllPage = async (page: number) => {
  const { data } = await tmdbApi.getTrending('day', page);
  const items = data.results.map(tmdbTrendingToMediaItem).filter((item: MediaItem | null): item is MediaItem => item !== null);
  return {
    items: items,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchPopularAnimePage = async (page: number) => {
  const { data } = await animeApi.get('/discover/tv', { 
    params: { 
      with_genres: '16', // Animation genre
      with_original_language: 'ja', // Japanese language
      sort_by: 'popularity.desc',
      page
    } 
  });
  
  return {
    items: data.results.map(tmdbTvShowToMediaItem), // Use TV show mapper since we're treating anime as TV
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchTopRatedAnimePage = async (page: number) => {
  const { data } = await animeApi.get('/discover/tv', { 
    params: { 
      with_genres: '16', // Animation genre
      with_original_language: 'ja', // Japanese language
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100, // Ensure we get anime with significant votes
      page
    } 
  });
  
  return {
    items: data.results.map(tmdbTvShowToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchOnAirAnimePage = async (page: number) => {
  const { data } = await animeApi.get('/discover/tv', { 
    params: { 
      with_genres: '16', // Animation genre
      with_original_language: 'ja', // Japanese language
      with_status: 'Returning Series', // Currently airing
      sort_by: 'first_air_date.desc', // Sort by newest first
      'air_date.gte': new Date().toISOString().split('T')[0], // Current or future air date
      page
    } 
  });
  
  return {
    items: data.results.map(tmdbTvShowToMediaItem),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
};

const fetchSearchResultsPage = async (page: number, query: string, type: string) => {
  console.log(`Fetching search results page ${page} for type ${type}, query: ${query}`);
  try {
    if (!query.trim()) {
      console.error('Empty query provided to fetchSearchResultsPage');
      return {
        items: [],
        totalPages: 0,
        totalResults: 0,
      };
    }
    
    if (type === 'movie' || type === 'tv') {
      const { data } = await tmdbApi.searchByType(type, query, page);
      return {
        items: data.results.map(type === 'movie' ? tmdbMovieToMediaItem : tmdbTvShowToMediaItem),
        totalPages: data.total_pages || 1,
        totalResults: data.total_results || 0,
      };
    } else if (type === 'anime') {
      // For anime search, use TMDB's TV search with anime filters
      const { data } = await tmdbApi.searchByType('tv', query, page);
      // Filter results to only include Japanese animation
      const animeResults = data.results.filter((item: any) => {
        // Check if it has the animation genre (16)
        const hasAnimationGenre = item.genre_ids?.includes(16);
        // Check if it's Japanese (can expand this check if needed)
        const isJapanese = item.original_language === 'ja';
        return hasAnimationGenre && isJapanese;
      });
      
      return {
        items: animeResults.map(tmdbTvShowToMediaItem),
        totalPages: data.total_pages || 1,
        totalResults: animeResults.length, // Use filtered length
      };
    }
    
    // Fallback for multi-search
    console.log('Using multi-search fallback');
    const { data } = await tmdbApi.searchMulti(query, page);
    const items = data.results
      .filter((item: any) => ['movie', 'tv'].includes(item.media_type))
      .map((item: any) => item.media_type === 'movie' ? tmdbMovieToMediaItem(item) : tmdbTvShowToMediaItem(item));
    
    return {
      items,
      totalPages: data.total_pages || 1,
      totalResults: data.total_results || 0,
    };
  } catch (error) {
    console.error('Error in fetchSearchResultsPage:', error);
    // Return empty data on error
    return {
      items: [],
      totalPages: 1,
      totalResults: 0,
    };
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv-series" element={<TVSeries />} />
            <Route path="/anime" element={<Anime />} />
            
            {/* Media detail routes */}
            <Route path="/movie/:id" element={<MediaDetail />} />
            <Route path="/tv/:id" element={<MediaDetail />} />
            <Route path="/anime/:id" element={<MediaDetail />} />
            
            {/* Add explicit routes for season/episode parameters */}
            <Route path="/tv/:id/season/:seasonNumber" element={<MediaDetail />} />
            <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<MediaDetail />} />
            <Route path="/anime/:id/episode/:episodeNumber" element={<MediaDetail />} />
            
            {/* Watch routes */}
            <Route path="/watch/movie/:id" element={<Watch />} />
            <Route path="/watch/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<Watch />} />
            <Route path="/watch/anime/:id/episode/:episodeNumber" element={<Watch />} />
            
            {/* Protected routes */}
            <Route path="/watch-history" element={
              <ProtectedRoute>
                <WatchHistory />
              </ProtectedRoute>
            } />
            
            {/* Search */}
            <Route path="/search" element={<SearchResults />} />

            {/* View All Routes */}
            <Route 
              path="/trending/all"
              element={<ViewAllPage title="Trending Today" fetchDataFunction={fetchTrendingAllPage} />}
            />
            <Route 
              path="/movies/popular" 
              element={<ViewAllPage title="Popular Movies" fetchDataFunction={fetchPopularMoviesPage} />} 
            />
            <Route 
              path="/movies/top-rated" 
              element={<ViewAllPage title="Top Rated Movies" fetchDataFunction={fetchTopRatedMoviesPage} />} 
            />
            <Route 
              path="/movies/upcoming" 
              element={<ViewAllPage title="Upcoming Movies" fetchDataFunction={fetchUpcomingMoviesPage} />} 
            />
            <Route 
              path="/tv/popular" 
              element={<ViewAllPage title="Popular TV Series" fetchDataFunction={fetchPopularTVShowsPage} />} 
            />
            <Route 
              path="/tv/top-rated" 
              element={<ViewAllPage title="Top Rated TV Series" fetchDataFunction={fetchTopRatedTVShowsPage} />} 
            />
            <Route 
              path="/view-all/anime/popular" 
              element={<ViewAllPage title="Popular Anime" fetchDataFunction={fetchPopularAnimePage} />} 
            />
            <Route 
              path="/view-all/anime/top-rated" 
              element={<ViewAllPage title="Top Rated Anime" fetchDataFunction={fetchTopRatedAnimePage} />} 
            />
            <Route 
              path="/view-all/anime/on-air" 
              element={<ViewAllPage title="Currently Airing Anime" fetchDataFunction={fetchOnAirAnimePage} />} 
            />
            
            {/* View All Search Results */}
            <Route 
              path="/view-all"
              element={
                <ViewAllPage 
                  title={(() => {
                    const searchParams = new URLSearchParams(window.location.search);
                    const query = searchParams.get('query') || '';
                    const type = searchParams.get('type') || 'all';
                    const typeLabel = type === 'movie' ? 'Movies' : 
                                      type === 'tv' ? 'TV Series' : 
                                      type === 'anime' ? 'Anime' : 'Results';
                    return `Search ${typeLabel}: "${query}"`;
                  })()}
                  fetchDataFunction={(page) => {
                    const searchParams = new URLSearchParams(window.location.search);
                    const query = searchParams.get('query') || '';
                    const type = searchParams.get('type') || 'all';
                    console.log(`ViewAllPage fetching data: page=${page}, type=${type}, query=${query}`);
                    return fetchSearchResultsPage(page, query, type);
                  }}
                />
              }
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
