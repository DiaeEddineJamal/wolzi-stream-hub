import axios from 'axios';

// Using TMDB API as it's free with registration
// You'll need to register at https://www.themoviedb.org/ to get an API key
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

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

// API endpoints
export const tmdbApi = {
  // Movies
  getTrending: (timeWindow = 'day', page = 1) => 
    api.get(`/trending/all/${timeWindow}`, { params: { page } }),
  
  getPopularMovies: (page = 1) => 
    api.get('/movie/popular', { params: { page } }),
  
  getTopRatedMovies: (page = 1) => 
    api.get('/movie/top_rated', { params: { page } }),
  
  getUpcomingMovies: (page = 1) => 
    api.get('/movie/upcoming', { params: { page } }),
  
  // TV Shows
  getPopularTVShows: (page = 1) => 
    api.get('/tv/popular', { params: { page } }),
  
  getTopRatedTVShows: (page = 1) => 
    api.get('/tv/top_rated', { params: { page } }),
  
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
  
  // Details
  getMovieDetails: (id: number) => 
    api.get(`/movie/${id}`, { params: { append_to_response: 'videos,credits' } }),
  
  getTVShowDetails: (id: number) => 
    api.get(`/tv/${id}`, { params: { append_to_response: 'videos,credits' } }),
  
  // Genre lists
  getMovieGenres: () => 
    api.get('/genre/movie/list'),
  
  getTVGenres: () => 
    api.get('/genre/tv/list'),
    
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