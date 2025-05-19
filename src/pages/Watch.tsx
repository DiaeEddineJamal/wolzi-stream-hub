import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import jikanApi from '@/integrations/api/jikan';
import gogoAnimeApi from '@/integrations/api/gogoanime';
import { streamingSources, getStreamingUrl } from '@/integrations/api/streamingSources';
import ReactPlayer from 'react-player';
import { ArrowLeft, Info, Bookmark, Heart, Share2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Switch } from "@/components/ui/switch";

type MediaType = 'movie' | 'tv' | 'anime';

interface SourceItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface SeasonInfo {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
}

const Watch: React.FC = () => {
  const { mediaType, id, seasonNumber, episodeNumber } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sources, setSources] = useState<SourceItem[]>(streamingSources);
  const [activeSource, setActiveSource] = useState<string>('embedsu');
  const [watchId, setWatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useIframe, setUseIframe] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [disableSandbox, setDisableSandbox] = useState<boolean>(false);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [episodeCount, setEpisodeCount] = useState<number>(30); // Default to 30 episodes
  
  // Get actual media type with fallback
  const actualMediaType = (mediaType as MediaType) || 'movie';
  
  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id) {
        setError('Invalid content ID');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch media details based on media type
        if (actualMediaType === 'anime') {
          try {
            const { data } = await jikanApi.getAnimeDetails(parseInt(id));
            if (data && data.data) {
              setTitle(data.data.title);
              
              // Set episode count based on anime data
              if (data.data.episodes) {
                setEpisodeCount(data.data.episodes);
              }
            } else {
              throw new Error('Invalid anime data structure');
            }
          } catch (animeError) {
            console.error('Error fetching anime details:', animeError);
            setError(`Failed to load anime: ${animeError.message || 'Unknown error'}`);
            return;
          }
          
        } else if (actualMediaType === 'movie') {
          try {
            const { data } = await tmdbApi.getMovieDetails(parseInt(id));
            setTitle(data.title);
          } catch (movieError) {
            console.error('Error fetching movie details:', movieError);
            setError(`Failed to load movie: ${movieError.message || 'Unknown error'}`);
            return;
          }
        } else if (actualMediaType === 'tv') {
          try {
            const { data } = await tmdbApi.getTVShowDetails(parseInt(id));
            setTitle(data.name);
            
            // Store seasons information
            if (data.seasons && data.seasons.length > 0) {
              // Filter out "Specials" which is usually season 0
              const validSeasons = data.seasons.filter(season => season.season_number > 0);
              setSeasons(validSeasons);
              
              // Set episode count for current season
              const currentSeason = validSeasons.find(
                season => season.season_number === (seasonNumber ? parseInt(seasonNumber) : 1)
              );
              
              if (currentSeason && currentSeason.episode_count) {
                setEpisodeCount(currentSeason.episode_count);
              }
            }
          } catch (tvError) {
            console.error('Error fetching TV details:', tvError);
            setError(`Failed to load TV series: ${tvError.message || 'Unknown error'}`);
            return;
          }
        }
        
        // Fetch user preferences if logged in
        if (user) {
          const { data } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (data && data.active_streaming_source) {
            setActiveSource(data.active_streaming_source);
            setSources(prev => 
              prev.map(source => ({
                ...source,
                isActive: source.id === data.active_streaming_source
              }))
            );
          }
        }
        
        // Check watch history
        await checkWatchHistory();
        
        // Set initial streaming URL
        updateStreamingUrl();
        
      } catch (error) {
        console.error('Error loading content:', error);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMediaDetails();
  }, [id, mediaType, user]);
  
  // Add a separate effect for when season changes
  useEffect(() => {
    if (actualMediaType === 'tv' && id && seasonNumber) {
      const updateSeasonEpisodes = async () => {
        try {
          setIsLoading(true);
          
          // Find the current season in our stored seasons
          const currentSeason = seasons.find(
            season => season.season_number === parseInt(seasonNumber)
          );
          
          // If we have the season info already, use it
          if (currentSeason && currentSeason.episode_count) {
            setEpisodeCount(currentSeason.episode_count);
          } 
          // Otherwise fetch the season info from TMDB
          else {
            const response = await fetch(
              `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=2545dfe546bd75d5de4657e85942ecb2`
            );
            const data = await response.json();
            
            if (data && data.episodes) {
              setEpisodeCount(data.episodes.length);
            }
          }
          
          // Update streaming URL with new season/episode
          updateStreamingUrl();
        } catch (error) {
          console.error('Error fetching season details:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      updateSeasonEpisodes();
    }
  }, [seasonNumber, id, actualMediaType, seasons]);
  
  useEffect(() => {
    // Update streaming URL when source changes
    updateStreamingUrl();
    
    // Set whether to use iframe based on source
    // Almost all streaming services should use iframe
    setUseIframe(true);
    
  }, [activeSource, id, mediaType, seasonNumber, episodeNumber]);
  
  const checkWatchHistory = async () => {
    if (!user || !id) return;
    
    try {
      // @ts-ignore - Supabase types are too complex for TypeScript
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('media_id', id)
        .eq('media_type', actualMediaType)
        .eq('season', seasonNumber || null)
        .eq('episode', episodeNumber || null)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setWatchId(data.id);
        setProgress(data.progress || 0);
        
        // Ask if user wants to resume
        if (data.progress > 0) {
          const minutes = Math.floor(data.progress / 60);
          const seconds = Math.floor(data.progress % 60);
          const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          const shouldResume = window.confirm(`Resume from ${timeFormatted}?`);
          if (!shouldResume) {
            setProgress(0);
          }
        }
      }
    } catch (error) {
      console.error('Error checking watch history:', error);
    }
  };
  
  const updateStreamingUrl = () => {
    if (!id) return;
    
    // Choose appropriate default source based on media type
    let recommendedSource = activeSource;
    
    // If no source is active, choose the best default for the content type
    if (actualMediaType === 'anime') {
      // For anime, prefer LuluStreams or VidSrc.to
      if (!['lulustreams', 'vidsrcto', 'embedsu', 'krakenfiles'].includes(activeSource)) {
        recommendedSource = 'lulustreams';
      }
    } else if (actualMediaType === 'movie') {
      // For movies, prefer Embed.su or Kraken Files
      if (!['embedsu', 'krakenfiles', 'vidsrcto', 'lulustreams'].includes(activeSource)) {
        recommendedSource = 'embedsu';
      }
    } else if (actualMediaType === 'tv') {
      // For TV series, prefer VidSrc.to or Embed.su
      if (!['vidsrcto', 'embedsu', 'lulustreams', 'krakenfiles'].includes(activeSource)) {
        recommendedSource = 'vidsrcto';
      }
    }
    
    // If the recommended source is different from active source, update it
    if (recommendedSource !== activeSource) {
      setActiveSource(recommendedSource);
      setSources(prev => 
        prev.map(source => ({
          ...source,
          isActive: source.id === recommendedSource
        }))
      );
    }
    
    const url = getStreamingUrl(
      actualMediaType,
      id,
      seasonNumber ? parseInt(seasonNumber) : undefined,
      episodeNumber ? parseInt(episodeNumber) : undefined,
      recommendedSource
    );
    
    console.log(`Creating stream URL: ${url} for ${actualMediaType}/${id}`);
    setSourceUrl(url);
    setError(null);
    setIsLoading(true);
  };
  
  const handleSourceChange = async (sourceId: string) => {
    setActiveSource(sourceId);
    setSources(prev => 
      prev.map(source => ({
        ...source,
        isActive: source.id === sourceId
      }))
    );
    
    // Reset any error when switching sources
    setError(null);
    setIsLoading(true);
    
    // Save preference if logged in
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .update({ active_streaming_source: sourceId })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving preference:', error);
      }
    }
  };
  
  const updateWatchHistory = async (seconds: number) => {
    if (!user || !id) return;
    
    try {
      // Get media details for history
      let posterPath = '';
      
      if (actualMediaType === 'anime') {
        const { data } = await jikanApi.getAnimeDetails(parseInt(id));
        posterPath = data.data.images.jpg.large_image_url;
      } else {
        const { data } = actualMediaType === 'movie' 
          ? await tmdbApi.getMovieDetails(parseInt(id))
          : await tmdbApi.getTVShowDetails(parseInt(id));
        posterPath = getPosterUrl(data.poster_path || '');
      }
      
      const watchData = {
        user_id: user.id,
        media_id: id,
        media_type: actualMediaType,
        title: title,
        poster_path: posterPath,
        progress: Math.floor(seconds),
        watched_at: new Date().toISOString(),
        season: actualMediaType === 'tv' ? seasonNumber : null,
        episode: (actualMediaType === 'tv' || actualMediaType === 'anime') ? episodeNumber : null,
      };
      
      if (watchId) {
        // Update existing record
        await supabase
          .from('watch_history')
          .update(watchData)
          .eq('id', watchId);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('watch_history')
          .insert(watchData)
          .select('id')
          .single();
        
        if (error) throw error;
        
        setWatchId(data.id);
      }
    } catch (error) {
      console.error('Error updating watch history:', error);
    }
  };
  
  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    // Only update database every 10 seconds to reduce writes
    if (Math.abs(playedSeconds - progress) > 10) {
      setProgress(playedSeconds);
      updateWatchHistory(playedSeconds);
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  const goToDetails = () => {
    navigate(`/${actualMediaType}/${id}`);
  };
  
  // Add handleIframeError function to debug iframe issues
  const handleIframeError = (e: any) => {
    console.error('Iframe error:', e);
    setError('Failed to load content. Please try a different source.');
  };

  // Handle 404 errors specifically
  const handle404Error = (sourceId: string) => {
    console.error(`404 Error detected for source: ${sourceId}, URL: ${sourceUrl}`);
    
    let errorMessage = 'The content could not be found.';
    
    if (sourceId === 'embedsu') {
      errorMessage = 'The movie or episode was not found on Embed.su. Please try another source.';
    } else if (sourceId === 'vidsrcto') {
      errorMessage = 'The content was not found on VidSrc.to. Please try a different source.';
    } else if (sourceId === 'lulustreams') {
      errorMessage = 'This content is not available on LuluStreams. Please select another option.';
    } else if (sourceId === 'krakenfiles') {
      errorMessage = 'The high-quality version could not be found. Try a standard source instead.';
    }
    
    setError(errorMessage);
    
    // Automatically switch to another source after 3 seconds
    setTimeout(() => {
      const availableSources = sources.filter(s => 
        s.id !== activeSource && ['embedsu', 'vidsrcto', 'lulustreams', 'krakenfiles'].includes(s.id)
      );
      
      if (availableSources.length > 0) {
        // Try the next source
        handleSourceChange(availableSources[0].id);
      }
    }, 3000);
  };

  // Update handleIframeLoad to check for 404 errors
  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    
    // Check if iframe loaded a 404 page
    try {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        // Wait a moment for iframe to fully load
        setTimeout(() => {
          try {
            // Try to access iframe content - this may fail due to CORS
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            
            // Look for common 404 indicators in the title or content
            if (iframeDoc && 
                (iframeDoc.title.includes('404') || 
                 iframeDoc.body.innerHTML.includes('404 Not Found'))) {
              handle404Error(activeSource);
              return;
            }
          } catch (error) {
            // CORS error likely - can't inspect iframe
            console.log('Cannot inspect iframe content due to CORS');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking iframe content:', error);
    }
    
    setIsLoading(false);
  };
  
  // Add LuluStreams special handler for anime
  const getAnimeIdForLuluStreams = async (animeTitle: string): Promise<string> => {
    try {
      // This would normally come from an API call to match the anime title with LuluStreams ID
      // For this example, we'll just use the title with some formatting
      const formattedTitle = animeTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      console.log(`Generated LuluStreams ID for anime: ${formattedTitle}`);
      return formattedTitle;
    } catch (error) {
      console.error('Error generating LuluStreams ID:', error);
      return id || ''; // Fallback to original ID
    }
  };
  
  // Handle anime source switch to LuluStreams
  useEffect(() => {
    if (actualMediaType === 'anime' && activeSource === 'lulustreams' && title) {
      const handleAnimeSourceChange = async () => {
        try {
          setIsLoading(true);
          const luluId = await getAnimeIdForLuluStreams(title);
          
          const url = `https://lulu-streams.com/anime/watch/${luluId}${episodeNumber ? `/episode-${episodeNumber}` : ''}`;
          console.log(`Special anime URL for LuluStreams: ${url}`);
          setSourceUrl(url);
        } catch (error) {
          console.error('Error handling anime source change:', error);
          // Fallback to regular URL generation
          updateStreamingUrl();
        } finally {
          setIsLoading(false);
        }
      };
      
      handleAnimeSourceChange();
    }
  }, [activeSource, actualMediaType, title, episodeNumber]);
  
  // Add source availability validation
  const validateSourceAvailability = async (sourceId: string, mediaTypeParam: string, contentId: string) => {
    try {
      // Generate test URL based on the source
      let testUrl = '';
      
      if (mediaTypeParam === 'movie') {
        switch(sourceId) {
          case 'embedsu':
            testUrl = `https://embed.su/embed/movie/${contentId}`;
            break;
          case 'vidsrcto':
            testUrl = `https://vidsrc.to/embed/movie/${contentId}`;
            break;
          case 'lulustreams':
            testUrl = `https://lulu-streams.com/movies/play/${contentId}`;
            break;
          case 'krakenfiles':
            testUrl = `https://krakenfiles.com/embed/movie/${contentId}`;
            break;
        }
      } else if (mediaTypeParam === 'tv') {
        // For TV series, we'll test season 1 episode 1
        switch(sourceId) {
          case 'embedsu':
            testUrl = `https://embed.su/embed/tv/${contentId}/1/1`;
            break;
          case 'vidsrcto':
            testUrl = `https://vidsrc.to/embed/tv/${contentId}/1/1`;
            break;
          case 'lulustreams':
            testUrl = `https://lulu-streams.com/series/watch/${contentId}/season/1/episode/1`;
            break;
          case 'krakenfiles':
            testUrl = `https://krakenfiles.com/embed/series/${contentId}/1/1`;
            break;
        }
      } else if (mediaTypeParam === 'anime') {
        // For anime, we'll test episode 1
        switch(sourceId) {
          case 'embedsu':
            testUrl = `https://embed.su/embed/tv/${contentId}/1/1`;
            break;
          case 'vidsrcto':
            testUrl = `https://vidsrc.to/embed/tv/${contentId}/1/1`;
            break;
          case 'lulustreams':
            testUrl = `https://lulu-streams.com/anime/watch/${contentId}/episode-1`;
            break;
          case 'krakenfiles':
            testUrl = `https://krakenfiles.com/embed/anime/${contentId}/episode/1`;
            break;
        }
      }
      
      // Skip if no test URL
      if (!testUrl) return { available: true, sourceId };
      
      console.log(`Validating source: ${sourceId} with URL: ${testUrl}`);
      
      // We can't directly check availability due to CORS,
      // but we'll log for debugging purposes. In production,
      // you'd need a backend proxy to check these URLs.
      return { available: true, sourceId };
      
    } catch (error) {
      console.error(`Error validating source ${sourceId}:`, error);
      return { available: false, sourceId };
    }
  };
  
  // Check all sources on component mount
  useEffect(() => {
    if (id) {
      const checkSources = async () => {
        const sourceChecks = await Promise.all(
          sources
            .filter(source => ['embedsu', 'vidsrcto', 'lulustreams', 'krakenfiles'].includes(source.id))
            .map(source => validateSourceAvailability(source.id, actualMediaType, id))
        );
        
        // Log availability results
        console.log('Source availability results:', sourceChecks);
        
        // If current source is not available, switch to an available one
        if (sourceChecks.some(check => !check.available && check.sourceId === activeSource)) {
          const availableSource = sourceChecks.find(check => check.available);
          if (availableSource) {
            console.log(`Current source ${activeSource} unavailable, switching to ${availableSource.sourceId}`);
            handleSourceChange(availableSource.sourceId);
          }
        }
      };
      
      checkSources();
    }
  }, [id, actualMediaType]);
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-wolzi-bg/80 backdrop-blur-md py-3 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goBack}
            className="mr-3 text-wolzi-light-gray hover:text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-medium truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-wolzi-light-gray hover:text-white"
            onClick={goToDetails}
          >
            <Info size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-wolzi-light-gray hover:text-white"
          >
            <Bookmark size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-wolzi-light-gray hover:text-white"
          >
            <Heart size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-wolzi-light-gray hover:text-white"
          >
            <Share2 size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-wolzi-light-gray hover:text-white"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
          </Button>
        </div>
      </header>
      
      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center bg-wolzi-dark-gray relative" style={{ minHeight: '75vh' }}>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-wolzi-bg z-10"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { delay: 0.2 } }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 border-3 border-wolzi-accent border-t-transparent rounded-full animate-spin mb-5"></div>
                <p className="text-lg font-medium text-wolzi-light-gray">LOADING CONTENT...</p>
                <p className="text-sm text-wolzi-light-gray/60 mt-2 text-center max-w-xs">
                  Please be patient as we connect to the streaming server
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-4 right-4 z-30 bg-wolzi-bg border border-wolzi-border rounded-lg shadow-lg p-4 w-64"
            >
              <h3 className="text-sm font-medium mb-3">Player Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Disable Sandbox Mode</label>
                  <Switch 
                    checked={disableSandbox}
                    onCheckedChange={(value) => {
                      setDisableSandbox(value);
                      setIsLoading(true);
                      // Force reload with new settings
                      const currentUrl = sourceUrl;
                      setSourceUrl('');
                      setTimeout(() => setSourceUrl(currentUrl), 50);
                    }}
                  />
                </div>
                <p className="text-xs text-wolzi-light-gray mt-1">
                  Try this if videos show "Sandbox not allowed" errors
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {error ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">Error</h3>
            <p className="text-wolzi-light-gray mb-6">{error}</p>
            <Button onClick={goBack}>Go Back</Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {sourceUrl && (
              <motion.div
                key={sourceUrl} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.5 } }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="w-full h-full relative"
                style={{ aspectRatio: '16/9' }}
              >
                {useIframe ? (
                  <iframe
                    src={sourceUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    title={`${title} player`}
                    {...(!disableSandbox ? {
                      sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups"
                    } : {})}
                    allow="fullscreen; web-share"
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      minHeight: '75vh'
                    }}
                  ></iframe>
                ) : (
                  <ReactPlayer
                    url={sourceUrl}
                    width="100%"
                    height="100%"
                    playing={isPlaying}
                    controls
                    playsinline
                    onProgress={handleProgress}
                    progressInterval={5000}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onStart={() => setIsLoading(false)}
                    onError={(e) => {
                      console.error("Player error:", e);
                      setError("Failed to load video from this source. Please try another server.");
                    }}
                    config={{
                      file: {
                        attributes: {
                          crossOrigin: "anonymous",
                          sandbox: "allow-same-origin allow-scripts",
                          referrerPolicy: "no-referrer"
                        },
                        forceVideo: true
                      },
                      youtube: {
                        playerVars: {
                          modestbranding: 1,
                          origin: window.location.origin
                        }
                      }
                    }}
                    style={{ backgroundColor: '#000', minHeight: '75vh' }}
                  />
                )}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 right-4 z-20 bg-black/80 text-white text-xs px-3 py-1 rounded-full"
                >
                  {activeSource.toUpperCase()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Video Sources */}
      <div className="bg-wolzi-bg p-4">
        <h2 className="text-lg font-medium mb-4">Video Sources</h2>
        <p className="text-sm text-wolzi-light-gray mb-4">Select your preferred streaming source</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl">
          {sources
            .filter(source => ['embedsu', 'vidsrcto', 'lulustreams', 'krakenfiles'].includes(source.id))
            .map((source) => (
            <motion.div
              key={source.id}
              whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-lg cursor-pointer border transition-all 
                ${source.isActive 
                  ? 'bg-gradient-to-br from-wolzi-accent to-wolzi-accent/80 text-white border-wolzi-accent shadow-lg shadow-wolzi-accent/20' 
                  : 'bg-wolzi-dark-gray/70 backdrop-blur-sm border-wolzi-gray/30 hover:bg-wolzi-dark-gray text-white'
                }
              `}
              onClick={() => handleSourceChange(source.id)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold">{source.name}</h3>
                <div className="flex items-center">
                  {source.isActive && (
                    <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full mr-1">
                      Active
                    </span>
                  )}
                  {actualMediaType === 'anime' && source.id === 'lulustreams' && (
                    <span className="bg-purple-500/80 text-white text-xs px-1.5 py-0.5 rounded-full">
                      Best
                    </span>
                  )}
                  {actualMediaType === 'movie' && source.id === 'krakenfiles' && (
                    <span className="bg-yellow-500/80 text-white text-xs px-1.5 py-0.5 rounded-full">
                      4K
                    </span>
                  )}
                  {actualMediaType === 'tv' && source.id === 'vidsrcto' && (
                    <span className="bg-blue-500/80 text-white text-xs px-1.5 py-0.5 rounded-full">
                      HD
                    </span>
                  )}
                </div>
              </div>
              
              {source.description && (
                <p className="text-xs opacity-90">{source.description}</p>
              )}
              
              <div className="mt-2 text-xs">
                {source.id === 'embedsu' && (
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                    All content
                  </div>
                )}
                {source.id === 'vidsrcto' && (
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>
                    Movies & TV
                  </div>
                )}
                {source.id === 'lulustreams' && (
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1.5"></span>
                    Anime & Series
                  </div>
                )}
                {source.id === 'krakenfiles' && (
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                    Premium 4K
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Source compatibility note */}
        <div className="mt-4 text-xs text-wolzi-light-gray bg-wolzi-dark-gray/30 p-3 rounded-md border border-wolzi-gray/20 max-w-4xl">
          <div className="mb-3 px-3 py-2 bg-wolzi-dark-gray rounded-md border border-wolzi-border/50">
            <p className="font-medium text-sm flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              {actualMediaType === 'anime' 
                ? <span>LuluStreams is recommended for anime content</span>
                : actualMediaType === 'movie'
                ? <span>Kraken Files offers the best quality for movies</span>
                : <span>VidSrc.to works best for TV series</span>
              }
            </p>
          </div>
          
          <p className="mb-1 font-medium">Source compatibility:</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li><span className="font-medium text-green-400">Embed.su</span>: Excellent for movies and TV shows, great overall compatibility</li>
            <li><span className="font-medium text-blue-400">VidSrc.to</span>: Reliable for TV series and movies with good quality options</li>
            <li><span className="font-medium text-purple-400">LuluStreams</span>: Best for anime content with wide selection and subtitles</li>
            <li><span className="font-medium text-yellow-400">Kraken Files</span>: High-quality 4K streams for premium content</li>
          </ul>
        </div>

        {/* Season and Episode Selection */}
        {actualMediaType === 'tv' && (
          <div className="mt-6 border-t border-wolzi-border pt-4">
            <h3 className="text-lg font-medium mb-3">Season and Episode</h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-xs">
                <label className="block text-sm font-medium mb-2 text-wolzi-light-gray">Season</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-wolzi-dark-gray border border-wolzi-border text-white appearance-none cursor-pointer pr-10"
                  value={seasonNumber || '1'}
                  onChange={(e) => {
                    setError(null);
                    setIsLoading(true);
                    navigate(`/watch/${actualMediaType}/${id}/season/${e.target.value}/episode/1`);
                  }}
                >
                  {seasons.length > 0 ? (
                    seasons.map(season => (
                      <option key={season.id} value={season.season_number}>{season.name}</option>
                    ))
                  ) : (
                    Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Season {num}</option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-9 pointer-events-none text-wolzi-light-gray">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium mb-3 text-wolzi-light-gray">Select Episode</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-4">
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map(epNum => {
                const isActive = parseInt(episodeNumber || '1') === epNum;
                
                return (
                  <motion.div
                    key={epNum}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative rounded-md overflow-hidden cursor-pointer transition-all shadow-sm
                      hover:shadow-md border
                      ${isActive 
                        ? 'border-wolzi-accent bg-wolzi-accent/20' 
                        : 'border-wolzi-gray/20 bg-wolzi-dark-gray/50 hover:bg-wolzi-dark-gray'
                      }
                    `}
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      navigate(`/watch/${actualMediaType}/${id}/season/${seasonNumber || '1'}/episode/${epNum}`);
                    }}
                  >
                    <div className="aspect-video bg-wolzi-dark-gray/50 flex items-center justify-center">
                      <span className="text-2xl font-bold text-wolzi-accent/80">{epNum}</span>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">Episode {epNum}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-wolzi-accent rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Add similar UI for anime episodes */}
        {actualMediaType === 'anime' && (
          <div className="mt-6 border-t border-wolzi-border pt-4">
            <h3 className="text-lg font-medium mb-3">Episodes</h3>
            
            <h4 className="text-sm font-medium mb-3 text-wolzi-light-gray">Select Episode</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-4">
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map(epNum => {
                const isActive = parseInt(episodeNumber || '1') === epNum;
                
                return (
                  <motion.div
                    key={epNum}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative rounded-md overflow-hidden cursor-pointer transition-all shadow-sm
                      hover:shadow-md border
                      ${isActive 
                        ? 'border-wolzi-accent bg-wolzi-accent/20' 
                        : 'border-wolzi-gray/20 bg-wolzi-dark-gray/50 hover:bg-wolzi-dark-gray'
                      }
                    `}
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      navigate(`/watch/${actualMediaType}/${id}/episode/${epNum}`);
                    }}
                  >
                    <div className="aspect-video bg-wolzi-dark-gray/50 flex items-center justify-center">
                      <span className="text-2xl font-bold text-wolzi-accent/80">{epNum}</span>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">Episode {epNum}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-wolzi-accent rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch; 