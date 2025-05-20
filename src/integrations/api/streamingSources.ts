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
    id: 'embedsu',
    name: 'Embed.su',
    description: 'Premium quality streams with fast loading times',
    isActive: true,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'vidsrcto',
    name: 'VidSrc.to',
    description: 'Large library of content with reliable streaming',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'lulustreams',
    name: 'LuluStreams',
    description: 'High quality anime and TV series streaming',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'krakenfiles',
    name: 'Kraken Files',
    description: 'Premium 4K streaming with minimal ads',
    isActive: false,
    quality: '4K',
    subtitles: true
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    description: 'Fast servers with HD quality',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'streamlare',
    name: 'Streamlare',
    description: 'High-speed streaming with multiple qualities',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'vidplay',
    name: 'VidPlay',
    description: 'Reliable streaming with good quality',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'gogostream',
    name: 'GogoStream',
    description: 'Specialized in anime content',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'animixplay',
    name: 'AnimeXPlay',
    description: 'High quality anime streaming',
    isActive: false,
    quality: '1080p',
    subtitles: true
  }
];

// Function to get streaming URL for content
export const getStreamingUrl = (
  mediaType: 'movie' | 'tv' | 'anime', 
  contentId: string | number, 
  season?: number, 
  episode?: number, 
  sourceId: string = 'embedsu'
): string => {
  const tmdbId = contentId.toString();
  const seasonParam = season ? season.toString() : '1';
  const episodeParam = episode ? episode.toString() : '1';
  
  switch(sourceId) {
    case 'embedsu':
      return mediaType === 'movie' 
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
    
    case 'vidsrcto':
      return mediaType === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
    
    case 'lulustreams':
      return mediaType === 'movie'
        ? `https://lulu-streams.com/movies/play/${tmdbId}`
        : mediaType === 'anime'
        ? `https://lulu-streams.com/anime/watch/${tmdbId}${episode ? `/episode-${episode}` : ''}`
        : `https://lulu-streams.com/series/watch/${tmdbId}/season/${seasonParam}/episode/${episodeParam}`;
    
    case 'krakenfiles':
      return mediaType === 'movie'
        ? `https://krakenfiles.com/embed/movie/${tmdbId}`
        : `https://krakenfiles.com/embed/series/${tmdbId}/${seasonParam}/${episodeParam}`;
    
    case 'superembed':
      return mediaType === 'movie'
        ? `https://superembed.stream/embed/movie/${tmdbId}`
        : `https://superembed.stream/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
    
    case 'streamlare':
      return mediaType === 'movie'
        ? `https://streamlare.com/e/${tmdbId}`
        : `https://streamlare.com/e/${tmdbId}/${seasonParam}/${episodeParam}`;
    
    case 'vidplay':
      return mediaType === 'movie'
        ? `https://vidplay.site/e/movie/${tmdbId}`
        : `https://vidplay.site/e/series/${tmdbId}/${seasonParam}/${episodeParam}`;
    
    case 'gogostream':
      if (mediaType === 'anime') {
        return `https://gogoanimehd.io/streaming.php?id=${contentId}&ep=${episode || 1}`;
      }
      return getStreamingUrl(mediaType, contentId, season, episode, 'embedsu');
    
    case 'animixplay':
      if (mediaType === 'anime') {
        return `https://animixplay.to/v1/${contentId}/${episode || 1}`;
      }
      return getStreamingUrl(mediaType, contentId, season, episode, 'embedsu');
    
    default:
      return getStreamingUrl(mediaType, contentId, season, episode, 'embedsu');
  }
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