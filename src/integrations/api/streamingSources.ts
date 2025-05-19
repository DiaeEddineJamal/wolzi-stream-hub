// This file contains the available streaming sources
// These are external free APIs that provide streaming links for content
// Note: In a production app, you would need to ensure these APIs are legal in your region

export interface StreamingSource {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// Define available streaming sources
export const streamingSources: StreamingSource[] = [
  {
    id: 'embedsu',
    name: 'Embed.su',
    description: 'Premium quality streams with fast loading times',
    isActive: true
  },
  {
    id: 'vidsrcto',
    name: 'VidSrc.to',
    description: 'Large library of content with reliable streaming',
    isActive: false
  },
  {
    id: 'lulustreams',
    name: 'LuluStreams',
    description: 'High quality anime and TV series streaming',
    isActive: false
  },
  {
    id: 'krakenfiles',
    name: 'Kraken Files',
    description: 'Premium 4K streaming with minimal ads',
    isActive: false
  },
  // Only keeping these reliable sources and removing others
];

// Function to get streaming URL for content
export const getStreamingUrl = (
  mediaType: 'movie' | 'tv' | 'anime', 
  contentId: string | number, 
  season?: number, 
  episode?: number, 
  sourceId: string = 'embedsu'
): string => {
  // These are actual streaming services being used on sites like pstream.org
  
  // Movies and TV shows - ensure we pass proper TMDB IDs
  const tmdbId = contentId.toString();
  const seasonParam = season ? season.toString() : '1';
  const episodeParam = episode ? episode.toString() : '1';
  
  // Handle anime content
  if (mediaType === 'anime') {
    switch(sourceId) {
      case 'gogostream':
        return `https://gogoanimehd.io/streaming.php?id=${contentId}&ep=${episode || 1}`;
      case 'lulustreams':
        return `https://lulu-streams.com/anime/watch/${contentId}${episode ? `/episode-${episode}` : ''}`;
      case 'krakenfiles':
        return `https://krakenfiles.com/embed/anime/${contentId}${episode ? `/episode/${episode}` : ''}`;
      case 'embedsu':
        return `https://embed.su/embed/tmdb/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      case 'vidsrcto':
        return `https://vidsrc.to/embed/tv/${tmdbId}${season ? `/${season}` : ''}${episode ? `/${episode}` : ''}`;
      default:
        // Default to a reliable service for anime
        return `https://lulu-streams.com/anime/watch/${contentId}${episode ? `/episode-${episode}` : ''}`;
    }
  }
  
  // Handle movies
  if (mediaType === 'movie') {
    switch(sourceId) {
      case 'embedsu':
        return `https://embed.su/embed/movie/${tmdbId}`;
      case 'vidsrcto':
        return `https://vidsrc.to/embed/movie/${tmdbId}`;
      case 'lulustreams':
        return `https://lulu-streams.com/movies/play/${tmdbId}`;
      case 'krakenfiles':
        return `https://krakenfiles.com/embed/movie/${tmdbId}`;
      default:
        return `https://embed.su/embed/movie/${tmdbId}`;
    }
  }
  
  // Handle TV series
  if (mediaType === 'tv') {
    switch(sourceId) {
      case 'embedsu':
        return `https://embed.su/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      case 'vidsrcto':
        return `https://vidsrc.to/embed/tv/${tmdbId}${season ? `/${season}` : ''}${episode ? `/${episode}` : ''}`;
      case 'lulustreams':
        return `https://lulu-streams.com/series/watch/${tmdbId}/season/${seasonParam}/episode/${episodeParam}`;
      case 'krakenfiles':
        return `https://krakenfiles.com/embed/series/${tmdbId}/${seasonParam}/${episodeParam}`;
      default:
        return `https://embed.su/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
    }
  }
  
  // Fallback to embed.su
  return `https://embed.su/embed/${mediaType}/${tmdbId}${mediaType === 'tv' ? `/${seasonParam}/${episodeParam}` : ''}`;
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
  getActiveSource
}; 