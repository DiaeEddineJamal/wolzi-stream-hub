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
    id: 'upcloud',
    name: 'UpCloud',
    description: 'Large library with high-quality streams and fast servers',
    isActive: true,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'vidcloud',
    name: 'VidCloud',
    description: 'Extensive TV series collection with reliable playback',
    isActive: false,
    quality: '1080p',
    subtitles: true
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    description: 'Premium quality streams with fast loading times',
    isActive: false,
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
  
  // Log parameters for debugging
  console.log(`getStreamingUrl called with: mediaType=${mediaType}, contentId=${contentId}, season=${season}, episode=${episode}, sourceId=${sourceId}`);
  
  // For TV series and anime with seasons, ensure we're using the TV endpoint, not movie
  const actualMediaType = mediaType === 'anime' && season ? 'tv' : mediaType;
  
  switch(sourceId) {
    case 'upcloud':
      if (mediaType === 'movie') {
        return `https://dokicloud.one/embed/${tmdbId}?autoplay=1&loop=1`;
      } else {
        // For TV shows and anime, use TV endpoint
        return `https://dokicloud.one/embed/${tmdbId}/${seasonParam}/${episodeParam}?autoplay=1&loop=1`;
      }
    
    case 'vidcloud':
      if (mediaType === 'movie') {
        return `https://vidembed.io/movies/watch-${tmdbId}`;
      } else {
        // For TV shows
        return `https://vidembed.io/videos/watch-${tmdbId}-season-${seasonParam}-episode-${episodeParam}`;
      }
    
    case 'embedsu':
      if (mediaType === 'movie') {
        return `https://embed.su/embed/movie/${tmdbId}`;
      } else {
        // For TV shows and anime, use the TV endpoint
        return `https://embed.su/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
    case 'vidsrcto':
      if (mediaType === 'movie') {
        return `https://vidsrc.to/embed/movie/${tmdbId}`;
      } else {
        // For TV shows and anime, use the TV endpoint
        return `https://vidsrc.to/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
    case 'lulustreams':
      if (mediaType === 'movie') {
        return `https://lulu-streams.com/movies/play/${tmdbId}`;
      } else if (mediaType === 'anime') {
        return `https://lulu-streams.com/anime/watch/${tmdbId}${episode ? `/episode-${episode}` : ''}`;
      } else {
        return `https://lulu-streams.com/series/watch/${tmdbId}/season/${seasonParam}/episode/${episodeParam}`;
      }
    
    case 'krakenfiles':
      if (mediaType === 'movie') {
        return `https://krakenfiles.com/embed/movie/${tmdbId}`;
      } else if (mediaType === 'anime') {
        return `https://krakenfiles.com/embed/anime/${tmdbId}/episode/${episodeParam}`;
      } else {
        return `https://krakenfiles.com/embed/series/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
    case 'superembed':
      if (mediaType === 'movie') {
        return `https://superembed.stream/embed/movie/${tmdbId}`;
      } else {
        return `https://superembed.stream/embed/tv/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
    case 'streamlare':
      if (mediaType === 'movie') {
        return `https://streamlare.com/e/${tmdbId}`;
      } else {
        return `https://streamlare.com/e/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
    case 'vidplay':
      if (mediaType === 'movie') {
        return `https://vidplay.site/e/movie/${tmdbId}`;
      } else {
        return `https://vidplay.site/e/series/${tmdbId}/${seasonParam}/${episodeParam}`;
      }
    
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