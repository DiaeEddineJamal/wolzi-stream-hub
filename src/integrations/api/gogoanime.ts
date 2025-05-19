import axios from 'axios';

// For simplicity, we'll use a free Gogoanime API proxy
// In a production app, you might want to set up your own proxy or use a paid API
const BASE_URL = 'https://api.consumet.org/anime/gogoanime';

// Create axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
});

// API endpoints
export const gogoAnimeApi = {
  // Search anime
  searchAnime: async (query: string, page = 1) => {
    try {
      return await api.get(`/search/${query}`, { params: { page } });
    } catch (error) {
      console.error('Error searching anime:', error);
      throw error;
    }
  },
  
  // Get anime details
  getAnimeInfo: async (id: string) => {
    try {
      return await api.get(`/info/${id}`);
    } catch (error) {
      console.error('Error getting anime info:', error);
      throw error;
    }
  },
  
  // Get streaming links
  getStreamingLinks: async (episodeId: string) => {
    try {
      return await api.get(`/watch/${episodeId}`);
    } catch (error) {
      console.error('Error getting streaming links:', error);
      throw error;
    }
  },
  
  // Get recent episodes
  getRecentEpisodes: async (page = 1, type = 1) => {
    try {
      return await api.get('/recent-episodes', { params: { page, type } });
    } catch (error) {
      console.error('Error getting recent episodes:', error);
      throw error;
    }
  },
  
  // Get top airing
  getTopAiring: async (page = 1) => {
    try {
      return await api.get('/top-airing', { params: { page } });
    } catch (error) {
      console.error('Error getting top airing anime:', error);
      throw error;
    }
  },
  
  // Helper function to map between Jikan and GogoAnime IDs
  findGogoAnimeId: async (animeTitle: string) => {
    try {
      const response = await api.get(`/search/${animeTitle}`);
      if (response.data && response.data.length > 0) {
        // Return the most relevant result
        return response.data[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error finding GogoAnime ID:', error);
      return null;
    }
  }
};

export default gogoAnimeApi; 