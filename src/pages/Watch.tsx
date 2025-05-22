import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
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
  const { id, seasonNumber, episodeNumber } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add logging to debug URL parameters
  console.log(`Watch Component Parameters - id: ${id}, season: ${seasonNumber}, episode: ${episodeNumber}`);
  console.log("Current path:", location.pathname);
  
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
  
  // New function to detect VidSrc.to errors through messages
  const [vidsrcNetworkError, setVidsrcNetworkError] = useState<boolean>(false);
  
  // Add auto-next episode functionality
  const [autoNextEnabled, setAutoNextEnabled] = useState<boolean>(true);
  const [showNextEpisodeOverlay, setShowNextEpisodeOverlay] = useState<boolean>(false);
  const [countdownTime, setCountdownTime] = useState<number>(10);
  const [duration, setDuration] = useState<number>(0);
  const [hasNextEpisode, setHasNextEpisode] = useState<boolean>(false);
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [averageEpisodeDuration] = useState<number>(2400); // Average episode length ~40min in seconds
  const videoEndDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine media type from URL path instead of parameter
  // Extract media type from the path: /watch/movie/... or /watch/tv/... or /watch/anime/...
  const determineMediaType = (): MediaType => {
    const path = location.pathname;
    if (path.startsWith('/watch/movie/')) return 'movie';
    if (path.startsWith('/watch/tv/')) return 'tv';  
    if (path.startsWith('/watch/anime/')) return 'anime';
    return 'movie'; // Default fallback
  };
  
  // Get actual media type with fallback
  const actualMediaType = determineMediaType();
  console.log(`Resolved media type: ${actualMediaType}`);
  
  // Check if there's a next episode available
  useEffect(() => {
    if (actualMediaType === 'tv' || actualMediaType === 'anime') {
      const currentEp = episodeNumber ? parseInt(episodeNumber) : 1;
      const hasNext = currentEp < episodeCount;
      setHasNextEpisode(hasNext);
      console.log(`Has next episode: ${hasNext}, Current: ${currentEp}, Total: ${episodeCount}`);
    } else {
      setHasNextEpisode(false);
    }
  }, [episodeNumber, episodeCount, actualMediaType]);
  
  // Improve auto-next episode detection for iframe players
  useEffect(() => {
    // For iframe players, we need to estimate when a video ends since we can't
    // directly access the video's progress or ended state
    
    // Start a timer that will trigger after average episode length plus some buffer
    // Only do this for TV series and anime with auto-play enabled
    if (autoNextEnabled && hasNextEpisode && (actualMediaType === 'tv' || actualMediaType === 'anime') && 
        !videoEnded && !showNextEpisodeOverlay && !isLoading && sourceUrl) {
      
      console.log("Setting up video end detection timer");
      
      // Clear any existing timer
      if (videoEndDetectionTimerRef.current) {
        clearTimeout(videoEndDetectionTimerRef.current);
      }
      
      // Set a timer to check if we should show the next episode overlay
      // Use average episode duration (40 min) minus 30 seconds for countdown
      videoEndDetectionTimerRef.current = setTimeout(() => {
        console.log("Video end detection timer triggered");
        
        // Only trigger if the user hasn't navigated away or paused
        if (autoNextEnabled && hasNextEpisode && !videoEnded && !showNextEpisodeOverlay) {
          console.log("Starting next episode countdown based on timer");
          setShowNextEpisodeOverlay(true);
        }
      }, (averageEpisodeDuration - 30) * 1000); // Convert to milliseconds
    }
    
    return () => {
      // Clean up timer on unmount or when dependencies change
      if (videoEndDetectionTimerRef.current) {
        clearTimeout(videoEndDetectionTimerRef.current);
      }
    };
  }, [autoNextEnabled, hasNextEpisode, actualMediaType, videoEnded, showNextEpisodeOverlay, isLoading, sourceUrl]);

  // Add event listener for messages from iframe that might indicate video progress
  useEffect(() => {
    const handleVideoMessages = (event: MessageEvent) => {
      // Check if the message might be related to video progress
      // This is a generic approach since different players send different message formats
      try {
        if (typeof event.data === 'string') {
          // Log for debugging
          if (event.data.includes('progress') || event.data.includes('time') || 
              event.data.includes('duration') || event.data.includes('end')) {
            console.log('Received video-related message:', event.data);
          }
          
          // Check for common end signals from various players
          if (event.data.includes('ended') || 
              event.data.includes('complete') || 
              event.data.includes('finished') ||
              (event.data.includes('progress') && event.data.includes('1.0'))) {
            console.log('Video end message detected from iframe');
            setVideoEnded(true);
            if (autoNextEnabled && hasNextEpisode && !showNextEpisodeOverlay) {
              console.log("Starting next episode countdown based on iframe message");
              setShowNextEpisodeOverlay(true);
            }
          }
        } else if (typeof event.data === 'object' && event.data !== null) {
          // Some players send progress as an object
          const data = event.data;
          if (data.event === 'ended' || data.event === 'complete' || 
              data.action === 'ended' || data.action === 'complete' ||
              (data.progress && data.progress > 0.95)) {
            console.log('Video end event detected from iframe object:', data);
            setVideoEnded(true);
            if (autoNextEnabled && hasNextEpisode && !showNextEpisodeOverlay) {
              console.log("Starting next episode countdown based on iframe object");
              setShowNextEpisodeOverlay(true);
            }
          }
        }
      } catch (error) {
        console.error('Error processing video message:', error);
      }
    };
    
    window.addEventListener('message', handleVideoMessages);
    return () => window.removeEventListener('message', handleVideoMessages);
  }, [autoNextEnabled, hasNextEpisode, showNextEpisodeOverlay]);

  // Modify the existing progress handler for ReactPlayer
  const handleProgress = ({ playedSeconds, loadedSeconds, played }: { 
    playedSeconds: number, 
    loadedSeconds: number,
    played: number 
  }) => {
    // Only update database every 10 seconds to reduce writes
    if (Math.abs(playedSeconds - progress) > 10) {
      setProgress(playedSeconds);
      updateWatchHistory(playedSeconds);
    }
    
    // Check if duration is available from video player
    if (loadedSeconds > duration) {
      setDuration(loadedSeconds);
    }
    
    // Check if we're near the end of the video (95% complete)
    if (duration > 0 && playedSeconds > 0 && 
        (playedSeconds / duration > 0.95 || played > 0.95) && 
        !showNextEpisodeOverlay && 
        hasNextEpisode && 
        autoNextEnabled) {
      console.log(`Video nearly complete: ${playedSeconds}/${duration}, ratio: ${playedSeconds/duration}`);
      setShowNextEpisodeOverlay(true);
    }
  };

  // Add a video ended handler for ReactPlayer
  const handleEnded = () => {
    console.log("Video ended event from ReactPlayer");
    setVideoEnded(true);
    if (autoNextEnabled && hasNextEpisode && !showNextEpisodeOverlay) {
      setShowNextEpisodeOverlay(true);
    }
  };

  // Reset video ended state when changing episodes or sources
  useEffect(() => {
    setVideoEnded(false);
    setShowNextEpisodeOverlay(false);
    
    // Also reset the timer
    if (videoEndDetectionTimerRef.current) {
      clearTimeout(videoEndDetectionTimerRef.current);
      videoEndDetectionTimerRef.current = null;
    }
  }, [id, seasonNumber, episodeNumber, activeSource]);
  
  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id) {
        setError('Invalid content ID');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch media details from TMDB API regardless of media type
        // For anime, we'll treat it as a TV show
        const mediaTypeForApi = actualMediaType === 'anime' ? 'tv' : actualMediaType;
        
        try {
          const { data } = mediaTypeForApi === 'movie'
            ? await tmdbApi.getMovieDetails(parseInt(id))
            : await tmdbApi.getTVShowDetails(parseInt(id));
          
          setTitle(data.title || data.name);
          
          // Store seasons information
          if ((mediaTypeForApi === 'tv' || actualMediaType === 'anime') && data.seasons && data.seasons.length > 0) {
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
        } catch (fetchError) {
          console.error(`Error fetching ${mediaTypeForApi} details:`, fetchError);
          setError(`Failed to load content: ${fetchError.message || 'Unknown error'}`);
          return;
        }
        
        // Fetch user preferences if logged in
        if (user) {
          const { data } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (data && data.active_streaming_source) {
            // Only use the preference if it's one of the allowed sources
            if (['embedsu', 'vidsrcto'].includes(data.active_streaming_source)) {
              setActiveSource(data.active_streaming_source);
              setSources(prev => 
                prev.map(source => ({
                  ...source,
                  isActive: source.id === data.active_streaming_source
                }))
              );
            } else {
              // If preference is not allowed, set default to embedsu
              setActiveSource('embedsu');
              setSources(prev => 
                prev.map(source => ({
                  ...source,
                  isActive: source.id === 'embedsu'
                }))
              );
            }
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
  }, [id, actualMediaType, user]);
  
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
    
    // Automatically disable sandbox for providers known to reject it
    if (['vidsrcto', 'vidcloud'].includes(activeSource)) {
      setDisableSandbox(true);
    }
    
  }, [activeSource, id, actualMediaType, seasonNumber, episodeNumber]);
  
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
    
    // For anime storage backward compatibility
    if (actualMediaType === 'anime' && title) {
      const storedTitle = localStorage.getItem(`anime_title_${id}`);
      if (!storedTitle && title) {
        localStorage.setItem(`anime_title_${id}`, title);
      }
    }
    
    // Choose appropriate source from available sources
    let recommendedSource = activeSource;
    
    // If current source is not one of the allowed ones, use embedsu as fallback
    const allowedSources = streamingSources.filter(source => source.isActive).map(source => source.id);
    if (!allowedSources.includes(recommendedSource)) {
      recommendedSource = 'embedsu';
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
    
    // Ensure we're passing the correct mediaType to getStreamingUrl
    // For anime, treat as TV shows
    const mediaTypeForUrl = actualMediaType === 'anime' ? 'tv' : actualMediaType;
    
    const url = getStreamingUrl(
      mediaTypeForUrl,
      id,
      seasonNumber ? parseInt(seasonNumber) : undefined,
      episodeNumber ? parseInt(episodeNumber) : undefined,
      recommendedSource
    );
    
    console.log(`Creating stream URL: ${url} for ${mediaTypeForUrl}/${id} - Season: ${seasonNumber || 'N/A'}, Episode: ${episodeNumber || 'N/A'}`);
    setSourceUrl(url);
    setError(null);
    setIsLoading(true);
  };
  
  const handleSourceChange = async (sourceId: string) => {
    // Validate source is one of the allowed ones
    const allowedSources = streamingSources.map(source => source.id);
    if (!allowedSources.includes(sourceId)) {
      toast({
        title: "Source not available",
        description: "This streaming source is not available",
        variant: "warning",
      });
      return;
    }
    
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
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
    console.log(`Video duration: ${duration} seconds`);
  };
  
  const goBack = () => {
    // Always navigate back to the details page instead of browser history
    navigate(`/${actualMediaType}/${id}`);
  };
  
  const goToDetails = () => {
    navigate(`/${actualMediaType}/${id}`);
  };
  
  // Add the missing goToNextEpisode function
  const goToNextEpisode = () => {
    if (!hasNextEpisode) return;
    
    const nextEp = parseInt(episodeNumber || '1') + 1;
    if (nextEp <= episodeCount) {
      setError(null);
      setIsLoading(true);
      if (actualMediaType === 'tv') {
        navigate(`/watch/${actualMediaType}/${id}/season/${seasonNumber || '1'}/episode/${nextEp}`);
      } else {
        navigate(`/watch/${actualMediaType}/${id}/episode/${nextEp}`);
      }
    }
  };
  
  // Add source availability validation
  const validateSourceAvailability = async (sourceId: string, mediaTypeParam: string, contentId: string) => {
    try {
      // Skip validation for sources we know will work with anime
      if (mediaTypeParam === 'anime' && 
          ['doodstream', 'megamax', 'embedsu', 'streamtape'].includes(sourceId)) {
        return { available: true, sourceId };
      }
      
      // Generate test URL based on the source
      let testUrl = '';
      
      if (mediaTypeParam === 'movie') {
        switch(sourceId) {
          case 'vidcloud':
            testUrl = `https://vidembed.io/movies/watch-${contentId}`;
            break;
          case 'embedsu':
            testUrl = `https://embed.su/embed/movie/${contentId}`;
            break;
          case 'vidsrcto':
            testUrl = `https://vidsrc.to/embed/movie/${contentId}`;
            break;
          case 'superembed':
            testUrl = `https://multiembed.mov/directstream.php?video_id=${contentId}&tmdb=1`;
            break;
          case 'smashystream':
            testUrl = `https://embed.smashystream.com/playere.php?tmdb=${contentId}`;
            break;
        }
      } else if (mediaTypeParam === 'tv') {
        // For TV series, we'll test season 1 episode 1
        switch(sourceId) {
          case 'vidcloud':
            testUrl = `https://vidembed.io/videos/watch-${contentId}-season-1-episode-1`;
            break;
          case 'embedsu':
            testUrl = `https://embed.su/embed/tv/${contentId}/1/1`;
            break;
          case 'vidsrcto':
            testUrl = `https://vidsrc.to/embed/tv/${contentId}/1/1`;
            break;
          case 'superembed':
            testUrl = `https://multiembed.mov/directstream.php?video_id=${contentId}&tmdb=1&s=1&e=1`;
            break;
          case 'smashystream':
            testUrl = `https://embed.smashystream.com/playere.php?tmdb=${contentId}&season=1&episode=1`;
            break;
        }
      } else if (mediaTypeParam === 'anime') {
        // For anime, we'll test episode 1
        switch(sourceId) {
          case 'vidcloud':
            testUrl = `https://vidembed.io/videos/watch-${contentId}-season-1-episode-1?anime=true`;
            break;
          case 'embedsu':
            // Ensure anime uses TV endpoint, not movie
            testUrl = `https://embed.su/embed/tv/${contentId}/1/1`;
            break;
          case 'vidsrcto':
            testUrl = `https://vidsrc.to/embed/tv/${contentId}/1/1`;
            break;
          case 'superembed':
            testUrl = `https://multiembed.mov/directstream.php?video_id=${contentId}&tmdb=1&s=1&e=1`;
            break;
          case 'smashystream':
            testUrl = `https://embed.smashystream.com/playere.php?tmdb=${contentId}&season=1&episode=1`;
            break;
        }
      }
      
      // Log URL generation for debugging
      console.log(`Generated test URL for ${mediaTypeParam}/${contentId} on ${sourceId}: ${testUrl}`);
      
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
          .filter(source => source.isActive)
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
  
  // Update handleIframeError to handle all sources
  const handleIframeError = (e: any) => {
    console.error('Iframe error:', e);
    console.error(`Iframe error details - mediaType: ${actualMediaType}, ID: ${id}, Season: ${seasonNumber || 'N/A'}, Episode: ${episodeNumber || 'N/A'}, Source: ${activeSource}`);
    console.error(`URL that caused error: ${sourceUrl}`);
    
    // Generic error
    setError(`Failed to load content from ${activeSource}. Trying another source...`);
    
    // Auto-switch to another source after delay
    setTimeout(() => {
      // Get available sources excluding the current one
      const availableSources = sources
        .filter(source => source.isActive && source.id !== activeSource)
        .map(source => source.id);
      
      // Pick a random alternative source
      const newSource = availableSources.length > 0 
        ? availableSources[Math.floor(Math.random() * availableSources.length)] 
        : 'embedsu'; // Fallback
      
      handleSourceChange(newSource);
    }, 3000);
  };

  // Update the handle404Error function to handle all sources
  const handle404Error = (sourceId: string) => {
    console.error(`404 Error detected for source: ${sourceId}, URL: ${sourceUrl}`);
    console.error(`404 Error details - mediaType: ${actualMediaType}, ID: ${id}, Season: ${seasonNumber || 'N/A'}, Episode: ${episodeNumber || 'N/A'}`);
    
    setError(`Content not found on ${sourceId}. Trying another source...`);
    
    // Automatically switch to another source after 3 seconds
    setTimeout(() => {
      // Get available sources excluding the current one
      const availableSources = sources
        .filter(source => source.isActive && source.id !== sourceId)
        .map(source => source.id);
      
      // Pick a random alternative source
      const newSource = availableSources.length > 0 
        ? availableSources[Math.floor(Math.random() * availableSources.length)] 
        : 'embedsu'; // Fallback
      
      handleSourceChange(newSource);
    }, 3000);
  };

  // Update useEffect to add event listener for error messages
  useEffect(() => {
    // Listen for error messages from the iframe (especially from VidSrc.to)
    const handleMessageEvent = (event: MessageEvent) => {
      // Check if the message contains error information
      if (typeof event.data === 'string' && event.data.includes('error')) {
        console.log('Received error message from iframe:', event.data);
        
        // Check for specific VidSrc.to errors
        if (event.data.includes('ManifestLoadError') || event.data.includes('networkError')) {
          console.log('VidSrc.to manifest or network error detected');
          setVidsrcNetworkError(true);
          
          // Show helpful error and offer to try another source
          setError(`Network error loading content from ${activeSource}. This may be due to region restrictions or server issues.`);
          
          // Auto-switch to another source after a short delay
          setTimeout(() => {
            // Get available sources excluding the current one
            const availableSources = sources
              .filter(source => source.isActive && source.id !== activeSource)
              .map(source => source.id);
            
            // Pick a random alternative source
            const alternativeSource = availableSources.length > 0 
              ? availableSources[Math.floor(Math.random() * availableSources.length)] 
              : 'embedsu'; // Fallback
            
            toast({
              title: "Trying alternative source",
              description: `Switching to ${alternativeSource} due to network error`,
              variant: "default",
            });
            handleSourceChange(alternativeSource);
          }, 3000);
        }
      }
    };
    
    window.addEventListener('message', handleMessageEvent);
    return () => window.removeEventListener('message', handleMessageEvent);
  }, [activeSource]);
  
  // Update handleIframeLoad function to look for VidSrc.to error indicators
  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    
    // Reset the VidSrc.to network error state
    setVidsrcNetworkError(false);
    
    // Try to communicate with the iframe to detect video events
    try {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        // Send a message to the iframe asking for video events
        // This won't work with all players due to CORS, but worth trying
        iframe.contentWindow.postMessage({ 
          action: 'listenForVideoEvents',
          requestProgress: true 
        }, '*');
        
        // Add a timeout to ensure loading state is cleared even if the iframe doesn't fully load
        setTimeout(() => {
          if (isLoading) {
            console.log('Forcing loading state to complete after timeout');
            setIsLoading(false);
          }
        }, 5000);
      }
    } catch (error) {
      console.log('Error communicating with iframe:', error);
      // Ensure loading state is cleared even if there's an error
      setIsLoading(false);
    }
    
    setIsLoading(false);
  };
  
  // Add effect to isolate Vite HMR connection issues from the iframe
  useEffect(() => {
    // Handle Vite HMR reconnection issues when using iframes
    const handleViteHMRMessage = (event: MessageEvent) => {
      // Check if the message is from Vite HMR
      if (typeof event.data === 'string' && 
         (event.data.includes('[vite] connecting') || event.data.includes('[vite] connected'))) {
        console.log('Vite HMR connection message received:', event.data);
        
        // If we're seeing connection issues with the iframe loaded, try to prevent interference
        if (!isLoading && document.querySelector('iframe')) {
          console.log('Isolating Vite HMR from iframe content');
          // No action needed, just log the event for debugging
        }
      }
    };
    
    window.addEventListener('message', handleViteHMRMessage);
    return () => window.removeEventListener('message', handleViteHMRMessage);
  }, [isLoading]);
  
  // Add a new effect to get anime title from local storage or fetch it if needed
  useEffect(() => {
    // For anime, we need to ensure we have the title stored for URL generation
    if (actualMediaType === 'anime' && id) {
      // Check if we have an anime title in local storage
      const storedTitle = localStorage.getItem(`anime_title_${id}`);
      
      // If we don't have the title, try to fetch it
      if (!storedTitle && id) {
        const fetchAnimeTitle = async () => {
          try {
            const { data } = await jikanApi.getAnimeDetails(parseInt(id));
            if (data && data.data && data.data.title) {
              // Store the title for future use
              localStorage.setItem(`anime_title_${id}`, data.data.title);
              setTitle(data.data.title);
            }
          } catch (error) {
            console.error('Error fetching anime title:', error);
          }
        };
        
        fetchAnimeTitle();
      } else if (storedTitle) {
        // Use the stored title if available
        setTitle(storedTitle);
      }
    }
  }, [actualMediaType, id]);
  
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-wolzi-bg/80 backdrop-blur-md py-3 px-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          {/* Back button - always returns to media details page */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goBack}
            className="mr-3 text-wolzi-light-gray hover:text-white"
            title="Return to details page"
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
      
      {/* Season and Episode Selection - Moved above the video player */}
      {(actualMediaType === 'tv' || actualMediaType === 'anime') && (
        <div className="bg-black/70 backdrop-blur-lg px-4 py-4 border-b border-green-500/20 shadow-md">
          <div className="flex flex-wrap items-center gap-4 max-w-5xl mx-auto">
            {actualMediaType === 'tv' && (
              <div className="flex items-center space-x-2">
                <label className="text-white font-medium text-sm">Season:</label>
                <div className="relative">
                  <select 
                    className="px-4 py-2 rounded-md bg-black/60 backdrop-blur-md border border-green-500/40 text-white appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-green-500/60 focus:border-green-500 transition-all duration-200 hover:bg-black/80 min-w-[120px]"
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
                      Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>Season {num}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <label className="text-white font-medium text-sm">Episode:</label>
              <div className="relative">
                <select 
                  className="px-4 py-2 rounded-md bg-black/60 backdrop-blur-md border border-green-500/40 text-white appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-green-500/60 focus:border-green-500 transition-all duration-200 hover:bg-black/80 min-w-[120px]"
                  value={episodeNumber || '1'}
                  onChange={(e) => {
                    setError(null);
                    setIsLoading(true);
                    if (actualMediaType === 'tv') {
                      navigate(`/watch/${actualMediaType}/${id}/season/${seasonNumber || '1'}/episode/${e.target.value}`);
                    } else {
                      navigate(`/watch/${actualMediaType}/${id}/episode/${e.target.value}`);
                    }
                  }}
                >
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map(epNum => (
                    <option key={epNum} value={epNum}>Episode {epNum}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex-grow"></div>
            
            <div className="flex items-center space-x-2">
              <label className="text-white font-medium text-sm">Server:</label>
              <div className="relative">
                <select 
                  className="px-4 py-2 rounded-md bg-black/60 backdrop-blur-md border border-green-500/40 text-white appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-green-500/60 focus:border-green-500 transition-all duration-200 hover:bg-black/80 min-w-[130px]"
                  value={activeSource}
                  onChange={(e) => {
                    setError(null);
                    setIsLoading(true);
                    handleSourceChange(e.target.value);
                  }}
                >
                  {sources.map(source => (
                      <option key={source.id} value={source.id}>{source.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              className="text-xs bg-black/40 border-green-500/60 hover:bg-black/80 transition-all duration-200 text-white hover:text-green-400"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={14} className="mr-1" />
              Settings
            </Button>
          </div>
          
          {/* Episode Navigation Quick Access Buttons */}
          <div className="flex items-center gap-2 mt-4 max-w-5xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-green-400 hover:bg-green-500/10 flex items-center"
              disabled={parseInt(episodeNumber || '1') <= 1}
              onClick={() => {
                const prevEp = parseInt(episodeNumber || '1') - 1;
                if (prevEp >= 1) {
                  setError(null);
                  setIsLoading(true);
                  if (actualMediaType === 'tv') {
                    navigate(`/watch/${actualMediaType}/${id}/season/${seasonNumber || '1'}/episode/${prevEp}`);
                  } else {
                    navigate(`/watch/${actualMediaType}/${id}/episode/${prevEp}`);
                  }
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Previous
            </Button>
            
            <div className="flex-grow flex justify-center">
              <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-sm text-white flex items-center border border-green-500/30">
                {actualMediaType === 'tv' ? (
                  <span>S{seasonNumber || '1'} · E{episodeNumber || '1'}</span>
                ) : (
                  <span>Episode {episodeNumber || '1'}</span>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-green-400 hover:bg-green-500/10 flex items-center"
              disabled={parseInt(episodeNumber || '1') >= episodeCount}
              onClick={() => {
                const nextEp = parseInt(episodeNumber || '1') + 1;
                if (nextEp <= episodeCount) {
                  setError(null);
                  setIsLoading(true);
                  if (actualMediaType === 'tv') {
                    navigate(`/watch/${actualMediaType}/${id}/season/${seasonNumber || '1'}/episode/${nextEp}`);
                  } else {
                    navigate(`/watch/${actualMediaType}/${id}/episode/${nextEp}`);
                  }
                }
              }}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Button>
          </div>
        </div>
      )}
      
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
              className="absolute top-4 right-4 z-30 bg-black/80 border border-green-500/30 rounded-lg shadow-lg p-5 w-80"
            >
              <h3 className="text-sm font-medium mb-4 text-white">Player Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-white font-medium">Sandbox Mode</label>
                    <p className="text-xs text-white/70 mt-1">
                      Enables secure playback (recommended). Disable only if videos don't load.
                    </p>
                  </div>
                  <Switch 
                    checked={!disableSandbox}
                    onCheckedChange={(value) => {
                      setDisableSandbox(!value);
                      setIsLoading(true);
                      // Force reload with new settings
                      const currentUrl = sourceUrl;
                      setSourceUrl('');
                      setTimeout(() => setSourceUrl(currentUrl), 50);
                    }}
                  />
                </div>
                
                {/* Add auto next episode setting */}
                {(actualMediaType === 'tv' || actualMediaType === 'anime') && (
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-white font-medium">Auto-Play Next Episode</label>
                      <p className="text-xs text-white/70 mt-1">
                        Automatically play the next episode when the current one ends.
                      </p>
                    </div>
                    <Switch 
                      checked={autoNextEnabled}
                      onCheckedChange={(value) => {
                        setAutoNextEnabled(value);
                        if (value && showNextEpisodeOverlay && !hasNextEpisode) {
                          setShowNextEpisodeOverlay(false);
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* Source selection */}
                <div className="space-y-3 pt-3 border-t border-green-500/20">
                  <h4 className="text-sm text-white font-medium">Streaming Source</h4>
                  
                  <div className="bg-black/50 rounded p-3 border border-green-500/20">
                    <p className="text-xs text-white/90 mb-2">Available sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {sources.map(source => (
                        <Button 
                          key={source.id} 
                          size="sm"
                          variant={activeSource === source.id ? "default" : "outline"}
                          className={`text-xs ${activeSource === source.id ? 'bg-green-500 hover:bg-green-600' : 'border-green-500/30 hover:bg-green-500/10'}`}
                          onClick={() => {
                            handleSourceChange(source.id);
                            setShowSettings(false);
                          }}
                        >
                          {source.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                
                  {/* Source-specific options */}
                  {activeSource === 'vidsrcto' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-white font-medium">VidSrc.to Options</label>
                        <p className="text-xs text-white/70 mt-1">
                          If experiencing network errors, try reloading or using a different source.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs border-green-500/40 hover:bg-green-500/10 text-white"
                        onClick={() => {
                          setIsLoading(true);
                          // Force reload the iframe
                          const currentUrl = sourceUrl;
                          setSourceUrl('');
                          setTimeout(() => setSourceUrl(currentUrl), 50);
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/70">Current Server: <span className="text-green-400 font-medium">{activeSource}</span></p>
                      <p className="text-xs text-white/70 mt-1">Sandbox Mode: <span className={disableSandbox ? "text-red-400" : "text-green-400"}>{disableSandbox ? "Disabled" : "Enabled"}</span></p>
                      {(actualMediaType === 'tv' || actualMediaType === 'anime') && (
                        <p className="text-xs text-white/70 mt-1">Auto-Play: <span className={autoNextEnabled ? "text-green-400" : "text-red-400"}>{autoNextEnabled ? "Enabled" : "Disabled"}</span></p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="text-xs border-green-500/40 hover:bg-green-500/10 text-white" onClick={() => setShowSettings(false)}>
                      Close
                    </Button>
                  </div>
                </div>
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
            
            {activeSource === 'vidsrcto' && vidsrcNetworkError && (
              <div className="mb-4 p-3 bg-black/50 rounded-lg border border-red-500/30">
                <p className="text-sm text-red-400">VidSrc.to is experiencing network issues. This may be due to:</p>
                <ul className="text-sm text-white/80 list-disc list-inside mt-2">
                  <li>Region restrictions</li>
                  <li>Server maintenance</li>
                  <li>Content not available</li>
                </ul>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={goBack} variant="outline" className="border-green-500/40">Go Back</Button>
              
              {activeSource === 'vidsrcto' && vidsrcNetworkError && (
                <Button 
                  onClick={() => {
                    const alternativeSources = sources
                      .filter(s => s.id !== activeSource && ['embedsu', 'vidcloud'].includes(s.id));
                      
                    if (alternativeSources.length > 0) {
                      handleSourceChange(alternativeSources[0].id);
                    }
                  }}
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Try Different Source
                </Button>
              )}
            </div>
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
                      sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-popups-to-escape-sandbox"
                    } : {})}
                    allow="fullscreen; autoplay; web-share; picture-in-picture; encrypted-media; clipboard-write"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    importance="high"
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      minHeight: '75vh',
                      backgroundColor: '#000'
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
                    onDuration={handleDuration}
                    onEnded={handleEnded}
                    progressInterval={1000} // More frequent updates to better detect end
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
                
                {/* Next Episode Overlay */}
                <AnimatePresence>
                  {showNextEpisodeOverlay && hasNextEpisode && (
                    <motion.div
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                      exit={{ opacity: 0, y: 100 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8 z-30"
                    >
                      <div className="max-w-3xl mx-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-white">Up Next</h3>
                            <p className="text-green-400 mt-1">
                              {actualMediaType === 'tv' 
                                ? `S${seasonNumber || '1'} · E${parseInt(episodeNumber || '1') + 1}` 
                                : `Episode ${parseInt(episodeNumber || '1') + 1}`
                              }
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="bg-black/60 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-full flex items-center">
                              <svg viewBox="0 0 36 36" className="w-5 h-5">
                                <path
                                  d="M18 2.0845 
                                    a 15.9155 15.9155 0 0 1 0 31.831 
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="rgba(255, 255, 255, 0.2)"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M18 2.0845 
                                    a 15.9155 15.9155 0 0 1 0 31.831 
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#22c55e"
                                  strokeWidth="2"
                                  strokeDasharray="100"
                                  strokeDashoffset={100 - ((10 - countdownTime) / 10 * 100)}
                                />
                              </svg>
                              <span className="ml-2 text-lg font-medium">{countdownTime}</span>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 hover:bg-white/10 text-white"
                              onClick={() => setShowNextEpisodeOverlay(false)}
                            >
                              Cancel
                            </Button>
                            
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => {
                                setShowNextEpisodeOverlay(false);
                                goToNextEpisode();
                              }}
                            >
                              Watch Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Video Sources */}
      <div className="bg-wolzi-bg p-4">
        <h2 className="text-lg font-medium mb-4">Video Sources</h2>
        <p className="text-sm text-wolzi-light-gray mb-4">Select your preferred streaming source</p>
        
        <div className="space-y-6">
          {/* Primary Sources */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-wolzi-light-gray">Available Sources</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sources.map((source) => (
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
                        {source.quality && (
                          <span className={`
                            ${source.id === 'embedsu' ? 'bg-blue-500/80' : ''}
                            ${source.id === 'vidsrcto' ? 'bg-green-500/80' : ''}
                            ${source.id === 'superembed' ? 'bg-purple-500/80' : ''}
                            ${source.id === 'smashystream' ? 'bg-yellow-500/80' : ''}
                            text-white text-xs px-1.5 py-0.5 rounded-full
                          `}>
                            {source.quality}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {source.description && (
                      <p className="text-xs opacity-90">{source.description}</p>
                    )}
                    
                    <div className="mt-2 text-xs">
                      <div className="flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full 
                          ${source.id === 'embedsu' ? 'bg-blue-400' : ''}
                          ${source.id === 'vidsrcto' ? 'bg-green-400' : ''}
                          ${source.id === 'superembed' ? 'bg-purple-400' : ''}
                          ${source.id === 'smashystream' ? 'bg-yellow-400' : ''}
                          mr-1.5"></span>
                        {source.description?.split(' ')[0] || 'Quality'} streams
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
        
        {/* Source compatibility note */}
        <div className="mt-4 text-xs text-wolzi-light-gray bg-wolzi-dark-gray/30 p-3 rounded-md border border-wolzi-gray/20 max-w-4xl">
          <div className="mb-3 px-3 py-2 bg-wolzi-dark-gray rounded-md border border-wolzi-border/50">
            <p className="font-medium text-sm flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              <span>All sources offer high quality streaming for movies, TV series, and anime</span>
            </p>
          </div>
          
          <p className="mb-1 font-medium">Source compatibility:</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li><span className="font-medium text-blue-400">Embed.su</span>: Premium quality streams with reliable HD playback</li>
            <li><span className="font-medium text-green-400">VidSrc.to</span>: Fast loading streams with good quality and minimal buffering</li>
            <li><span className="font-medium text-purple-400">SuperEmbed</span>: High quality streams with fast servers</li>
            <li><span className="font-medium text-yellow-400">SmashyStream</span>: Wide collection of movies and TV shows</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Watch; 