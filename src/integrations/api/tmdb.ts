import axios from 'axios';
import { cachedAsyncFunction } from '@/utils/api-cache';

// Using TMDB API as it's free with registration
// You'll need to register at https://www.themoviedb.org/ to get an API key
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 minutes (for trending, now playing)
  MEDIUM: 30 * 60 * 1000, // 30 minutes (for popular, top rated)
  LONG: 12 * 60 * 60 * 1000, // 12 hours (for genres, movie/tv details)
};

// Image sizes
export const posterSizes = {
  small: 'w185',
  medium: 'w342',
  large: 'w500',
  original: 'original'
};

export const backdropSizes = {
  small: 'w300',
  medium: 'w780',
  large: 'w1280',
  original: 'original'
};

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const getPosterUrl = (path: string, size = posterSizes.medium) => 
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

export const getBackdropUrl = (path: string, size = backdropSizes.large) => 
  path ? `${IMAGE_BASE_URL}/${size}${path}` : null;

export const getProfileUrl = (path: string | null, size = 'w185') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// API endpoints with caching
export const tmdbApi = {
  getAnimeCatalog: (sort = 'popularity.desc', page = 1) => api.get('/discover/tv', { params: { with_genres: 16, with_original_language: 'ja', sort_by: sort, 'vote_count.gte': 100, page } }),
  // Movies
  getNowPlayingMovies: (page=1)=>cachedAsyncFunction(()=>api.get('/movie/now_playing',{params:{page}}),`now-playing-movies-${page}`,CACHE_DURATIONS.SHORT),
  getTrending: (timeWindow = 'day', page = 1) => 
    cachedAsyncFunction(
      () => api.get(`/trending/all/${timeWindow}`, { params: { page } }),
      `trending-${timeWindow}-${page}`,
      CACHE_DURATIONS.SHORT
    ),
  
  getPopularMovies: (page = 1) => 
    cachedAsyncFunction(
      () => api.get('/movie/popular', { params: { page } }),
      `popular-movies-${page}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  getTopRatedMovies: (page = 1) => 
    cachedAsyncFunction(
      () => api.get('/movie/top_rated', { params: { page } }),
      `top-rated-movies-${page}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  getUpcomingMovies: (page = 1) => 
    cachedAsyncFunction(
      () => api.get('/movie/upcoming', { params: { page } }),
      `upcoming-movies-${page}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  // TV Shows
  getPopularTVShows: (page = 1) => 
    cachedAsyncFunction(
      () => api.get('/tv/popular', { params: { page } }),
      `popular-tv-${page}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  getTopRatedTVShows: (page = 1) => 
    cachedAsyncFunction(
      () => api.get('/tv/top_rated', { params: { page } }),
      `top-rated-tv-${page}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  // Search
  searchMulti: (query: string, page = 1) => {
    console.log('Searching with query:', query);
    return api.get('/search/multi', { 
      params: { 
        query, 
        page,
        include_adult: false,
        language: 'en-US'
      } 
    }).catch(error => {
      console.error('TMDB search error:', error);
      throw error;
    });
  },
  
  searchByType: (type: string, query: string, page = 1) => {
    console.log(`Searching ${type} with query:`, query);
    return api.get(`/search/${type}`, { 
      params: { 
        query, 
        page,
        include_adult: false,
        language: 'en-US'
      } 
    }).catch(error => {
      console.error(`TMDB ${type} search error:`, error);
      throw error;
    });
  },
  
  // Details (with longer cache)
  getMovieDetails: (id: number) => 
    cachedAsyncFunction(
      () => api.get(`/movie/${id}`, { params: { append_to_response: 'videos,credits,reviews,recommendations,similar,external_ids,images', include_image_language:'en,null' } }),
      `movie-details-artwork-${id}`,
      CACHE_DURATIONS.LONG
    ),
  
  getTVShowDetails: (id: number) => 
    cachedAsyncFunction(
      () => api.get(`/tv/${id}`, { params: { append_to_response: 'videos,credits,reviews,recommendations,similar,external_ids,images', include_image_language:'en,null' } }),
      `tv-details-artwork-${id}`,
      CACHE_DURATIONS.LONG
    ),
  
  // TV season details (episodes list and metadata)
  getTVSeasonDetails: (showId: number, seasonNumber: number) =>
    cachedAsyncFunction(
      () => api.get(`/tv/${showId}/season/${seasonNumber}`, { params: { append_to_response: 'credits' } }),
      `tv-season-${showId}-${seasonNumber}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  // Genre lists (with very long cache)
  getMovieGenres: () => 
    cachedAsyncFunction(
      () => api.get('/genre/movie/list'),
      'movie-genres',
      CACHE_DURATIONS.LONG
    ),
  
  getTVGenres: () => 
    cachedAsyncFunction(
      () => api.get('/genre/tv/list'),
      'tv-genres',
      CACHE_DURATIONS.LONG
    ),
  
  // Discover endpoints
  discoverMovies: (params: any) => 
    cachedAsyncFunction(
      () => api.get('/discover/movie', { params }),
      `discover-movies-${JSON.stringify(params)}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  discoverTV: (params: any) => 
    cachedAsyncFunction(
      () => api.get('/discover/tv', { params }),
      `discover-tv-${JSON.stringify(params)}`,
      CACHE_DURATIONS.MEDIUM
    ),
  
  // Get anime (by filtering TV shows with animation genre and Japanese origin)
  getAnime: (page = 1) => 
    api.get('/discover/tv', { 
      params: { 
        with_genres: '16', // Animation genre
        with_original_language: 'ja', // Japanese language
        sort_by: 'popularity.desc',
        page
      } 
    }),
};

export default tmdbApi;
