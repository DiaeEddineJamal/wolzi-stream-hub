// This file contains the available streaming sources
// These are external free APIs that provide streaming links for content

export interface StreamingSource {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  quality?: string;
  region?: string[];
  subtitles?: boolean;
}

// Define available streaming sources - simplified to only reliable sources
export const streamingSources: StreamingSource[] = [
  {
    id: 'vidsrcto',
    name: 'VidSrc.to 🔥',
    isActive: true,
    quality: 'HD'
  },
  {
    id: 'vidking',
    name: 'Vidking Player',
    isActive: true,
    quality: 'HD'
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    isActive: false,
    quality: 'HD'
  }
];

// Function to get streaming URL for content
export const getStreamingUrl = (mediaType: 'movie' | 'tv' | 'anime', id: string, source: StreamingSource, season?: number, episode?: number): string => {
  // Debug logging to track parameters
  console.log('getStreamingUrl called with:', {
    mediaType,
    id,
    sourceId: source.id,
    season,
    episode
  });

  const baseUrls: Record<string, string> = {
    // VidSrc sources - most reliable
    vidsrcto: 'https://vidsrc.to/embed',
    // Secondary reliable sources
    embedsu: 'https://embed.su/embed',
    // Vidking Player - additional source for better availability
    vidking: 'https://www.vidking.net/embed'
  };

  const baseUrl = baseUrls[source.id];
  if (!baseUrl) {
    throw new Error(`Unsupported source: ${source.id}`);
  }

  switch (source.id) {
    // VidSrc sources - all use same URL pattern
    case 'vidsrcto':
      let generatedUrl;
      if (mediaType === 'movie') {
        generatedUrl = `${baseUrl}/movie/${id}`;
      } else if (mediaType === 'tv') {
        generatedUrl = `${baseUrl}/tv/${id}/${season}/${episode}`;
      } else if (mediaType === 'anime') {
        generatedUrl = `${baseUrl}/tv/${id}/${season}/${episode}`;
      } else {
        throw new Error(`Invalid media type: ${mediaType}`);
      }
      console.log(`Generated URL for ${source.id}:`, generatedUrl);
      return generatedUrl;

    case 'embedsu':
      if (mediaType === 'movie') {
        return `${baseUrl}/movie/${id}`;
      } else if (mediaType === 'tv') {
        return `${baseUrl}/tv/${id}/${season}/${episode}`;
      } else if (mediaType === 'anime') {
        return `${baseUrl}/tv/${id}/${season}/${episode}`;
      }
      throw new Error(`Invalid media type: ${mediaType}`);

    case 'vidking':
      if (mediaType === 'movie') {
        return `${baseUrl}/movie/${id}`;
      } else if (mediaType === 'tv') {
        return `${baseUrl}/tv/${id}/${season}/${episode}`;
      } else if (mediaType === 'anime') {
        return `${baseUrl}/tv/${id}/${season}/${episode}`;
      }
      throw new Error(`Invalid media type: ${mediaType}`);

    default:
      throw new Error(`Unsupported source: ${source.id}`);
  }

  throw new Error(`Invalid media type: ${mediaType}`);
};

// Helper function to format anime titles for URL usage (keeping for backward compatibility)
const formatAnimeIdForUrl = (title: string): string => {
  if (!title) return '';
  
  // Convert to lowercase
  const formattedTitle = title
    .toLowerCase()
    // Replace special characters with hyphens
    .replace(/[^\w\s]/gi, '-')
    // Convert spaces to hyphens
    .replace(/\s+/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-|-$/g, '');
    
  return formattedTitle;
};

// Store anime title for ID mapping (keeping for backward compatibility)
export const storeAnimeTitle = (id: string | number, title: string): void => {
  localStorage.setItem(`anime_title_${id}`, title);
};

// Function to set active streaming source 
export const setActiveSource = (sourceId: string): StreamingSource[] => {
  return streamingSources.map(source => ({
    ...source,
    isActive: source.id === sourceId
  }));
};

// Get the active source
export const getActiveSource = (): StreamingSource | undefined => {
  return streamingSources.find(source => source.isActive);
};

export default {
  streamingSources,
  getStreamingUrl,
  setActiveSource,
  getActiveSource,
  storeAnimeTitle
};