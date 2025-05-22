import axios from 'axios';

// Jikan API - Free Anime Database API
const BASE_URL = import.meta.env.VITE_JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

// Create axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
});

// Helper to handle API rate limiting (Jikan has a limit of ~3 requests per second)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API endpoints
export const jikanApi = {
  // Get top anime by filter (default: bypopularity)
  getTopAnime: async (page = 1, limit = 20, filter = 'bypopularity') => {
    const response = await api.get('/top/anime', { 
      params: { page, limit, filter } 
    });
    await sleep(350); // Prevent rate limiting
    return response;
  },
  
  // Get currently airing anime
  getAiringAnime: async (page = 1, limit = 20) => {
    const response = await api.get('/anime', { 
      params: { 
        page, 
        limit, 
        status: 'airing',
        order_by: 'popularity',
        sort: 'asc'
      } 
    });
    await sleep(350);
    return response;
  },
  
  // Get upcoming anime
  getUpcomingAnime: async (page = 1, limit = 20) => {
    const response = await api.get('/anime', { 
      params: { 
        page, 
        limit, 
        status: 'upcoming',
        order_by: 'popularity',
        sort: 'asc'
      } 
    });
    await sleep(350);
    return response;
  },
  
  // Get anime by genre
  getAnimeByGenre: async (genreId: number, page = 1, limit = 20) => {
    const response = await api.get('/anime', { 
      params: { 
        page, 
        limit, 
        genres: genreId,
        order_by: 'popularity',
        sort: 'asc'
      } 
    });
    await sleep(350);
    return response;
  },
  
  // Get anime genres
  getAnimeGenres: async () => {
    const response = await api.get('/genres/anime');
    await sleep(350);
    return response;
  },
  
  // Get anime by search query
  searchAnime: async (query: string, page = 1, limit = 20) => {
    try {
      console.log(`Searching anime with query: ${query}, page: ${page}`);
      const response = await api.get('/anime', { 
        params: { q: query, page, limit } 
      });
      await sleep(350);
      return response;
    } catch (error) {
      console.error('Error searching anime:', error);
      // Return a valid empty response structure
      return {
        data: {
          data: [],
          pagination: {
            last_visible_page: 1,
            has_next_page: false,
            items: {
              count: 0,
              total: 0,
              per_page: limit
            }
          }
        }
      };
    }
  },
  
  // Get anime details by ID
  getAnimeDetails: async (id: number) => {
    const response = await api.get(`/anime/${id}/full`);
    await sleep(350);
    return response;
  },
  
  // Get anime characters
  getAnimeCharacters: async (id: number) => {
    const response = await api.get(`/anime/${id}/characters`);
    await sleep(350);
    return response;
  },
  
  // Get anime episodes
  getAnimeEpisodes: async (id: number, page = 1) => {
    const response = await api.get(`/anime/${id}/episodes`, { params: { page } });
    await sleep(350);
    return response;
  },
  
  // Get anime recommendations
  getAnimeRecommendations: async (id: number) => {
    const response = await api.get(`/anime/${id}/recommendations`);
    await sleep(350);
    return response;
  },
};

export default jikanApi; 