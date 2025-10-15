import { StreamingSource } from '@/components/watch/SourceSelector';

export interface SourceTestResult {
  source: StreamingSource;
  isWorking: boolean;
  responseTime: number;
  error?: string;
}

/**
 * Test if a streaming source is working by attempting to load it and checking for content availability
 */
export const testStreamingSource = async (
  source: StreamingSource,
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number,
  timeout: number = 15000
): Promise<SourceTestResult> => {
  const startTime = Date.now();
  
  try {
    // Use the pre-generated URL from the source; avoid rebuilding from name
    const url = source.url;
    
    // Create a promise that resolves when the iframe loads or times out
    const testPromise = new Promise<boolean>((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.src = url;
      
      let hasResolved = false;
      
      const cleanup = () => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
        clearTimeout(timeoutId);
      };
      
      const resolveOnce = (value: boolean) => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve(value);
        }
      };
      
      const timeoutId = setTimeout(() => {
        resolveOnce(false);
      }, timeout);
      
      // Check for successful load
      iframe.onload = () => {
        // Additional check: try to access iframe content to verify it's not a 404 or error page
        setTimeout(() => {
          try {
            // If we can access the iframe and it has loaded content, consider it working
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              // Check if the page contains error indicators
              const bodyText = iframeDoc.body?.textContent?.toLowerCase() || '';
              const titleText = iframeDoc.title?.toLowerCase() || '';
              
              // Common error indicators
              const errorIndicators = ['404', 'not found', 'error', 'unavailable', 'blocked'];
              const hasError = errorIndicators.some(indicator => 
                bodyText.includes(indicator) || titleText.includes(indicator)
              );
              
              resolveOnce(!hasError);
            } else {
              // If we can't access the document, assume it's working (cross-origin)
              resolveOnce(true);
            }
          } catch (e) {
            // Cross-origin restriction - assume it's working if it loaded
            resolveOnce(true);
          }
        }, 1000); // Give it a moment to fully load
      };
      
      iframe.onerror = () => {
        resolveOnce(false);
      };
      
      iframe.onabort = () => {
        resolveOnce(false);
      };
      
      document.body.appendChild(iframe);
    });
    
    const isWorking = await testPromise;
    const responseTime = Date.now() - startTime;
    
    return {
      source,
      isWorking,
      responseTime,
      error: isWorking ? undefined : 'Source not accessible or content not found'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      source,
      isWorking: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test multiple sources in parallel with staggered delays
 */
export const testMultipleSources = async (
  sources: StreamingSource[],
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number,
  options: {
    maxConcurrent?: number;
    staggerDelay?: number;
    timeout?: number;
    onProgress?: (result: SourceTestResult) => void;
  } = {}
): Promise<SourceTestResult[]> => {
  const {
    maxConcurrent = 3,
    staggerDelay = 200,
    timeout = 15000,
    onProgress
  } = options;
  
  const results: SourceTestResult[] = [];
  const batches: StreamingSource[][] = [];
  
  // Split sources into batches to avoid overwhelming servers
  for (let i = 0; i < sources.length; i += maxConcurrent) {
    batches.push(sources.slice(i, i + maxConcurrent));
  }
  
  for (const batch of batches) {
    const batchPromises = batch.map(async (source, index) => {
      // Stagger the requests within each batch
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, staggerDelay * index));
      }
      
      const result = await testStreamingSource(source, mediaType, mediaId, seasonNumber, episodeNumber, timeout);
      onProgress?.(result);
      return result;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Find the best working source based on response time and reliability
 */
export const findBestSource = (results: SourceTestResult[]): StreamingSource | null => {
  const workingSources = results
    .filter(result => result.isWorking)
    .sort((a, b) => {
      // Prioritize recommended sources
      if (a.source.isRecommended && !b.source.isRecommended) return -1;
      if (!a.source.isRecommended && b.source.isRecommended) return 1;
      
      // Then sort by response time
      return a.responseTime - b.responseTime;
    });
  
  return workingSources.length > 0 ? workingSources[0].source : null;
};

/**
 * Generate streaming URL for different source types
 */
export const generateStreamingUrl = (
  source: { name: string; baseUrl: string },
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number
): string => {
  const { name, baseUrl } = source;
  const normalizedBase = baseUrl.toLowerCase();
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9\.\-]/g, ''); // strip emojis/symbols

  const isVidSrc = normalizedBase.includes('vidsrc.to') || normalizedName.includes('vidsrc');
  const isEmbedSu = normalizedBase.includes('embed.su') || normalizedName.includes('embedsu') || normalizedName.includes('embed.su');
  const isVidKing = normalizedBase.includes('vidking.net') || normalizedName.includes('vidking');

  if (isVidSrc) {
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${mediaId}`;
    }
    return `${baseUrl}/tv/${mediaId}/${seasonNumber}/${episodeNumber}`;
  }

  if (isEmbedSu) {
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${mediaId}`;
    }
    return `${baseUrl}/tv/${mediaId}/${seasonNumber}/${episodeNumber}`;
  }

  if (isVidKing) {
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${mediaId}`;
    }
    return `${baseUrl}/tv/${mediaId}/${seasonNumber}/${episodeNumber}`;
  }

  throw new Error(`Unsupported source: ${name}`);
};

/**
 * Create streaming sources for a given media item
 */
export const createStreamingSources = (
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number
): StreamingSource[] => {
  const baseSources = [
    // Primary VidSrc sources - most reliable based on P-Stream research
    {
      id: 'vidsrcto',
      name: 'VidSrc.to 🔥',
      baseUrl: 'https://vidsrc.to/embed',
      isRecommended: false,
      quality: 'HD',
      features: ['secure', 'fast', 'reliable']
    },
    // Vidking Player - additional reliable source
    {
      id: 'vidking',
      name: 'Vidking Player',
      baseUrl: 'https://www.vidking.net/embed',
      isRecommended: true,
      quality: 'HD',
      features: ['autoplay', 'nextEpisode', 'episodeSelector']
    },
    // Secondary reliable sources
    {
      id: 'embedsu',
      name: 'Embed.su',
      baseUrl: 'https://embed.su/embed',
      quality: 'HD',
      features: ['reliable', 'stable']
    }
  ];
  
  return baseSources.map(source => ({
    id: source.id,
    name: source.name,
    url: generateStreamingUrl(source, mediaType, mediaId, seasonNumber, episodeNumber),
    quality: source.quality,
    isRecommended: source.isRecommended,
    features: source.features
  }));
};

/**
 * Auto-select the best source with fallback logic
 */
export const autoSelectBestSource = async (
  sources: StreamingSource[],
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  seasonNumber?: number,
  episodeNumber?: number,
  onProgress?: (result: SourceTestResult) => void
): Promise<StreamingSource | null> => {
  if (sources.length === 0) return null;
  
  // First, try recommended sources
  const recommendedSources = sources.filter(s => s.isRecommended);
  if (recommendedSources.length > 0) {
    const recommendedResults = await testMultipleSources(recommendedSources, mediaType, mediaId, seasonNumber, episodeNumber, {
      maxConcurrent: 2,
      staggerDelay: 100,
      timeout: 8000,
      onProgress
    });
    
    const bestRecommended = findBestSource(recommendedResults);
    if (bestRecommended) return bestRecommended;
  }
  
  // If no recommended sources work, try all sources
  const allResults = await testMultipleSources(sources, mediaType, mediaId, seasonNumber, episodeNumber, {
    maxConcurrent: 3,
    staggerDelay: 200,
    timeout: 12000,
    onProgress
  });
  
  return findBestSource(allResults);
};