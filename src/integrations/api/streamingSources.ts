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

// Define available streaming sources
export const streamingSources: StreamingSource[] = [
  {
    id: 'vidsrcto',
    name: 'VidSrc.to',
    description: 'Large library of content with reliable streaming',
    isActive: true,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    description: 'Premium quality streams with fast loading times',
    isActive: true,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    description: 'High quality streams with fast servers',
    isActive: true,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'smashystream',
    name: 'SmashyStream',
    description: 'Wide collection of movies and TV shows',
    isActive: true,
    quality: '1080p',
    subtitles: true
  }
];

// Function to get streaming URL for content
export const getStreamingUrl = (
  mediaType: 'movie' | 'tv' | 'anime', 
  id: string,
  seasonNumber?: number,
  episodeNumber?: number,
  sourceId: string = 'vidsrcto'
): string => {
  // For anime, treat it as a TV series
  const actualMediaType = mediaType === 'anime' ? 'tv' : mediaType;
  
  // Get the active streaming source
  const source = streamingSources.find(source => source.id === sourceId);
  if (!source || !source.isActive) {
    console.error(`Source ${sourceId} not found or not active`);
    return ''; // Return empty string if source not found or not active
  }
  
  const tmdbId = id.toString();
  const seasonParam = seasonNumber ? seasonNumber.toString() : '1';
  const episodeParam = episodeNumber ? episodeNumber.toString() : '1';
  
  // Log parameters for debugging
  console.log(`getStreamingUrl called with: mediaType=${mediaType}, id=${id}, season=${seasonNumber}, episode=${episodeNumber}, sourceId=${sourceId}`);
  
  switch(sourceId) {
    case 'embedsu':
      if (actualMediaType === 'movie') {
        return `https://embed.su/embed/movie/${tmdbId}`;
      } else {
        // For TV shows and anime, use the TV endpoint
        return `https://embed.su/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
    case 'vidsrcto':
      if (actualMediaType === 'movie') {
        return `https://vidsrc.to/embed/movie/${tmdbId}`;
      } else {
        // For TV shows and anime, use the TV endpoint
        return `https://vidsrc.to/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      }

    case 'superembed':
      if (actualMediaType === 'movie') {
        return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`;
      } else {
        // For TV shows and anime, use the TV endpoint
        return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${seasonParam}&e=${episodeParam}`;
      }
    
    case 'smashystream':
      if (actualMediaType === 'movie') {
        return `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`;
      } else {
        // For TV shows and anime
        return `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${seasonParam}&episode=${episodeParam}`;
      }
    
    default:
      return getStreamingUrl(mediaType, id, seasonNumber, episodeNumber, 'vidsrcto');
  }
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