import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import ViewAllPage, { MediaItem } from "./pages/ViewAllPage";
import tmdbApi, { getPosterUrl } from "./integrations/api/tmdb";
import { jikanApi } from "./integrations/api/jikan";

const queryClient = new QueryClient();

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

const jikanAnimeToMediaItem = (anime: any): MediaItem => ({
  id: anime.mal_id.toString(),
  title: anime.title,
  posterUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "https://via.placeholder.com/500x750?text=No+Image",
  rating: anime.score || 0,
  year: (anime.aired?.from || "").substring(0, 4),
  mediaType: 'anime',
  overview: anime.synopsis,
});

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
  const { data } = await jikanApi.getTopAnime(page, 24, 'bypopularity');
  return {
    items: data.data.map(jikanAnimeToMediaItem),
    totalPages: data.pagination?.last_visible_page || page, // Jikan provides last_visible_page
    totalResults: data.pagination?.items?.total || data.data.length, // And total items
  };
};

const fetchAiringAnimePage = async (page: number) => {
  const { data } = await jikanApi.getAiringAnime(page, 24);
  return {
    items: data.data.map(jikanAnimeToMediaItem),
    totalPages: data.pagination?.last_visible_page || page,
    totalResults: data.pagination?.items?.total || data.data.length,
  };
};

const fetchUpcomingAnimePage = async (page: number) => {
  const { data } = await jikanApi.getUpcomingAnime(page, 24);
  return {
    items: data.data.map(jikanAnimeToMediaItem),
    totalPages: data.pagination?.last_visible_page || page,
    totalResults: data.pagination?.items?.total || data.data.length,
  };
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
            <Route path="/tv/:id/season/:seasonNumber/episode/:episodeNumber" element={<MediaDetail />} />
            
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
              path="/anime/popular" 
              element={<ViewAllPage title="Popular Anime" fetchDataFunction={fetchPopularAnimePage} />} 
            />
            <Route 
              path="/anime/airing" 
              element={<ViewAllPage title="Currently Airing Anime" fetchDataFunction={fetchAiringAnimePage} />} 
            />
            <Route 
              path="/anime/upcoming" 
              element={<ViewAllPage title="Upcoming Anime" fetchDataFunction={fetchUpcomingAnimePage} />} 
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
