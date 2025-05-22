import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import tmdbApi, { getBackdropUrl, getPosterUrl } from '@/integrations/api/tmdb';
import { streamingSources as availableStreamingSources, getStreamingUrl, storeAnimeTitle } from '@/integrations/api/streamingSources';
import ReactPlayer from 'react-player';
import MainLayout from '@/layouts/MainLayout';
import { Tables } from '@/types/supabase';
import YouTube from 'react-youtube';
import { Play, PlayCircle, ArrowUpRight, Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type MediaType = 'movie' | 'tv' | 'anime';

interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  runtime?: number;
  episode_run_time?: number[];
  number_of_episodes?: number;
  genres: { id: number; name: string }[];
  videos: {
    results: {
      key: string;
      name: string;
      type: string;
      site: string;
    }[];
  };
  credits: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
    }[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    overview: string;
  }[];
}

interface SeasonDetails {
  id: number;
  name: string;
  episodes: {
    id: number;
    name: string;
    episode_number: number;
    still_path: string | null;
    overview: string;
    air_date: string;
    runtime: number;
  }[];
}

interface UserPreferences {
  active_streaming_source: string | null;
  autoplay: boolean | null;
  theme?: string | null;
  user_id?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AnimeDetails {
  mal_id: number;
  title: string;
  title_english: string;
  title_japanese: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    }
  };
  synopsis: string;
  aired: {
    from: string;
  };
  score: number;
  duration: string;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  episodes: number;
  characters: any[];
  recommendations: any[];
}

interface GogoAnimeInfo {
  id: string;
  title: string;
  episodes: {
    id: string;
    number: number;
  }[];
}

const MediaDetail: React.FC = () => {
  const { id, seasonNumber, episodeNumber } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add debug logging for the URL parameters
  console.log("MediaDetail params:", { id, seasonNumber, episodeNumber });
  console.log("Current path:", location.pathname);
  
  const [loading, setLoading] = useState(true);
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null);
  const [activeTab, setActiveTab] = useState('stream');
  const [selectedSeason, setSelectedSeason] = useState<number | null>(seasonNumber ? parseInt(seasonNumber) : 1);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(episodeNumber ? parseInt(episodeNumber) : 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamingSources, setStreamingSources] = useState(availableStreamingSources);
  const [preferences, setPreferences] = useState<UserPreferences>({
    active_streaming_source: 'superembed',
    autoplay: true
  });
  const [progress, setProgress] = useState(0);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [streamingLinks, setStreamingLinks] = useState<any[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [disableSandbox, setDisableSandbox] = useState<boolean>(false);
  const [trailerMuted, setTrailerMuted] = useState<boolean>(true);
  const trailerPlayerRef = useRef<any>(null);

  // Determine media type from URL path instead of parameter
  // Extract media type from the path: /movie/... or /tv/... or /anime/...
  const determineMediaType = (): MediaType => {
    const path = location.pathname;
    if (path.startsWith('/movie/')) return 'movie';
    if (path.startsWith('/tv/')) return 'tv';  
    if (path.startsWith('/anime/')) return 'anime';
    return 'movie'; // Default fallback
  };
  
  const actualMediaType = determineMediaType();
  console.log("Resolved media type:", actualMediaType);
  
  const title = mediaDetails?.title || mediaDetails?.name || '';

  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch all content types from TMDB (treating anime as TV shows)
        const { data } = actualMediaType === 'movie'
          ? await tmdbApi.getMovieDetails(parseInt(id))
          : await tmdbApi.getTVShowDetails(parseInt(id));
        
        setMediaDetails(data);
        
        // Set superembed as the default active source
        setStreamingSources(prevSources => 
          prevSources.map(source => ({
            ...source,
            isActive: source.id === 'superembed'
          }))
        );
        
        // If it's anime, store the title for backward compatibility
        if (actualMediaType === 'anime' && data.name) {
          storeAnimeTitle(parseInt(id), data.name);
        }
        
        // Extract trailer key from videos
        if (data.videos && data.videos.results && data.videos.results.length > 0) {
          // Find official trailers first
          const officialTrailer = data.videos.results.find(
            (video: any) => video.type === 'Trailer' && video.site === 'YouTube' && video.official === true
          );
          
          // If no official trailer, try any trailer
          const anyTrailer = data.videos.results.find(
            (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
          );
          
          // If still nothing, try any video
          const anyVideo = data.videos.results.find(
            (video: any) => video.site === 'YouTube'
          );
          
          if (officialTrailer) {
            setTrailerKey(officialTrailer.key);
          } else if (anyTrailer) {
            setTrailerKey(anyTrailer.key);
          } else if (anyVideo) {
            setTrailerKey(anyVideo.key);
          }
        }
        
        // If it's a TV show or anime and has seasons, fetch first season details
        if ((actualMediaType === 'tv' || actualMediaType === 'anime') && data.seasons && data.seasons.length > 0) {
          const initialSeason = selectedSeason || 1;
          fetchSeasonDetails(parseInt(id), initialSeason);
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
        toast({
          title: "Error",
          description: "Failed to load content details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMediaDetails();
  }, [id, actualMediaType, toast, selectedSeason]);

  useEffect(() => {
    // Update season details when season changes
    if (id && actualMediaType === 'tv' && selectedSeason) {
      fetchSeasonDetails(parseInt(id), selectedSeason);
    }
  }, [selectedSeason, id, actualMediaType]);

  useEffect(() => {
    // Check watch history to resume playback
    const checkWatchHistory = async () => {
      if (!user || !id) return;
      
      try {
        // @ts-ignore - Supabase schema typing issues
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          // Update from content_id to media_id to match schema
          .eq('media_id', id)
          // Update from content_type to media_type to match schema
          .eq('media_type', actualMediaType)
          .eq('season', selectedSeason || null)
          .eq('episode', selectedEpisode || null)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Not found is OK
          throw error;
        }
        
        if (data) {
          setWatchId(data.id);
          setProgress(data.progress);
          
          // Ask if user wants to resume
          if (data.progress > 0) {
            const minutes = Math.floor(data.progress / 60);
            const seconds = data.progress % 60;
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
    
    checkWatchHistory();
  }, [user, id, actualMediaType, selectedSeason, selectedEpisode]);

  useEffect(() => {
    // Get user preferences
    const fetchPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Not found is OK
          throw error;
        }
        
        if (data) {
          // Update preferences with the data from the database
          setPreferences(data as UserPreferences);
          
          // Update active source
          setStreamingSources(prevSources => 
            prevSources.map(source => ({
              ...source,
              isActive: source.id === data.active_streaming_source
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };
    
    fetchPreferences();
  }, [user]);

  useEffect(() => {
    // Fetch streaming links when anime episode is selected
    const fetchAnimeStreamingLinks = async () => {
      if (actualMediaType !== 'anime' || !mediaDetails || !selectedEpisode) return;
      
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${mediaDetails.id}/season/${selectedSeason}/episode/${selectedEpisode}?api_key=2545dfe546bd75d5de4657e85942ecb2&append_to_response=credits`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch streaming links');
        }
        
        const data = await response.json();
        setStreamingLinks(data.credits.cast.map((castMember: any) => ({
          id: castMember.id.toString(),
          name: castMember.name,
          character: castMember.character,
          profile_path: castMember.profile_path,
          role: castMember.role,
          url: `https://www.youtube.com/watch?v=${data.videos.results.find(
            (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
          )?.key}`,
          quality: '720p'
        })));
      } catch (error) {
        console.error('Error fetching anime streaming links:', error);
        toast({
          title: "Error",
          description: "Failed to load streaming links",
          variant: "destructive",
        });
      }
    };
    
    fetchAnimeStreamingLinks();
  }, [mediaDetails, selectedSeason, selectedEpisode, actualMediaType, toast]);

  const fetchSeasonDetails = async (showId: number, season: number) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/season/${season}?api_key=2545dfe546bd75d5de4657e85942ecb2&append_to_response=credits`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch season details');
      }
      
      const data = await response.json();
      setSeasonDetails(data);
      
      // Set selected episode if it's not set or reset if changing seasons
      if (!selectedEpisode || selectedEpisode > data.episodes.length) {
        setSelectedEpisode(1);
      }
    } catch (error) {
      console.error('Error fetching season details:', error);
      toast({
        title: "Error",
        description: "Failed to load season details",
        variant: "destructive",
      });
    }
  };

  const handleEpisodeSelect = (episodeNum: number) => {
    setSelectedEpisode(episodeNum);
    // Reset progress when changing episodes
    setProgress(0);
  };

  const handleSourceChange = async (sourceId: string) => {
    // Update active source
    setStreamingSources(prevSources => 
      prevSources.map(source => ({
        ...source,
        isActive: source.id === sourceId
      }))
    );
    
    // Update preferences if logged in
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .update({ active_streaming_source: sourceId })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating source preference:', error);
      }
    }
  };

  const updateWatchHistory = async (seconds: number) => {
    if (!user || !id || (!mediaDetails)) return;
    
    try {
      const posterPath = mediaDetails?.poster_path ? getPosterUrl(mediaDetails.poster_path) : '';

      const watchData = {
        user_id: user.id,
        media_id: id,
        media_type: actualMediaType,
        title: title,
        poster_path: posterPath,
        progress: Math.floor(seconds),
        watched_at: new Date().toISOString(),
        season: actualMediaType === 'tv' ? selectedSeason : null,
        episode: (actualMediaType === 'tv' || actualMediaType === 'anime') ? selectedEpisode : null,
      };
      
      if (watchId) {
        // Update existing record
        // @ts-ignore - Supabase schema typing issues
        await supabase
          .from('watch_history')
          .update(watchData)
          .eq('id', watchId);
      } else {
        // Create new record
        // @ts-ignore - Supabase schema typing issues
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

  const getActiveSource = () => {
    return streamingSources.find(source => source.isActive)?.id || 'superembed';
  };

  const getStreamUrl = () => {
    const activeSourceId = streamingSources.find(source => source.isActive)?.id || 'vidjoy';
    
    return getStreamingUrl(
      actualMediaType,
      id || '',
      selectedSeason || undefined,
      selectedEpisode || undefined,
      activeSourceId
    );
  };

  // Toggle mute without restarting the video
  const toggleMute = () => {
    if (trailerPlayerRef.current) {
      if (trailerMuted) {
        trailerPlayerRef.current.unMute();
      } else {
        trailerPlayerRef.current.mute();
      }
      setTrailerMuted(!trailerMuted);
    }
  };

  const renderAnimeEpisodes = () => {
    if (!seasonDetails || !seasonDetails.episodes || seasonDetails.episodes.length === 0) {
      return <p className="text-center py-8 text-white/80">No episodes available for streaming.</p>;
    }
    
    // Create a UI structure similar to TV series episodes
    const totalEpisodes = seasonDetails.episodes.length;
    
    return (
      <div className="space-y-6 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Episodes</h2>
            <p className="text-sm text-gray-400">Total {totalEpisodes} episodes</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="rounded-md bg-black/40 px-3 py-1 text-sm border border-green-500/30">
              <span className="text-white font-medium">Season {selectedSeason || 1}</span>
            </div>
          </div>
        </div>
        
        {/* Episodes Grid - Match the TV series layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {seasonDetails.episodes.map((episode) => (
            <div
              key={episode.id}
              className={`
                relative overflow-hidden rounded-md cursor-pointer transition-all duration-200
                ${selectedEpisode === episode.episode_number 
                  ? 'bg-green-500/10 border border-green-500/60 shadow-md shadow-green-500/20' 
                  : 'bg-black/40 border border-green-500/20 hover:border-green-500/40 hover:bg-black/60'}
                group
              `}
              onClick={() => setSelectedEpisode(episode.episode_number)}
            >
              <div className="aspect-video bg-black/70 flex items-center justify-center relative overflow-hidden">
                {episode.still_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w300${episode.still_path}`} 
                    alt={`Episode ${episode.episode_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={`text-xl font-bold ${
                    selectedEpisode === episode.episode_number ? 'text-green-400' : 'text-white/80 group-hover:text-green-400/80'
                  }`}>{episode.episode_number}</span>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                  <Play className="h-8 w-8 text-green-400" />
                </div>
              </div>
              
              <div className="p-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium truncate text-white">Episode {episode.episode_number}</p>
                  {selectedEpisode === episode.episode_number && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
              </div>
              
              {/* Selected Indicator */}
              {selectedEpisode === episode.episode_number && (
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Watch button */}
        <div className="flex justify-center mt-2 pb-4">
          <Button
            onClick={() => handleWatchNow()}
            className="px-8 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg shadow-green-500/20 transition-all duration-200"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Episode {selectedEpisode || 1}
          </Button>
        </div>
        
        {/* Streaming Sources Section */}
        <div className="mt-6 pt-4 border-t border-green-500/20">
          <h3 className="text-lg font-medium mb-3">Available Streaming Sources</h3>
          <div className="flex flex-wrap gap-2">
            {streamingSources
              .filter(source => ['embedsu', 'vidsrcto'].includes(source.id))
              .map(source => (
                <div 
                  key={source.id} 
                  className={`
                    px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-all 
                    ${getActiveSource() === source.id 
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                      : 'bg-black/40 text-white/80 border border-green-500/30 hover:border-green-500/50 hover:bg-black/60'}
                  `}
                  onClick={() => handleSourceChange(source.id)}
                >
                  {source.name}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  const renderAnimeDetails = () => {
    if (!mediaDetails) return null;
    
    return (
      <div className="mt-4 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Synopsis</h3>
          <p className="text-wolzi-text">{mediaDetails.overview}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Episodes:</span> {mediaDetails.number_of_episodes || 'Unknown'}</p>
              <p><span className="font-medium">Score:</span> {mediaDetails.vote_average ? `${mediaDetails.vote_average}/10` : 'Not rated'}</p>
            </div>
            <div>
              <p><span className="font-medium">Genres:</span> {mediaDetails.genres?.map(g => g.name).join(', ')}</p>
              <p><span className="font-medium">First Aired:</span> {mediaDetails.first_air_date ? new Date(mediaDetails.first_air_date).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
        </div>
        
        {mediaDetails.credits && mediaDetails.credits.cast && mediaDetails.credits.cast.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Cast</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaDetails.credits.cast.slice(0, 12).map((actor) => (
                <div key={actor.id} className="text-center">
                  {actor.profile_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`} 
                      alt={actor.name}
                      className="rounded-md w-full h-40 object-cover mb-2"
                    />
                  ) : (
                    <div className="rounded-md w-full h-40 bg-black/50 flex items-center justify-center mb-2">
                      <span className="text-white/60 text-sm">No Image</span>
                    </div>
                  )}
                  <p className="font-medium text-sm">{actor.name}</p>
                  <p className="text-xs text-wolzi-light-gray">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleWatchNow = () => {
    if (actualMediaType === 'tv' && selectedSeason && selectedEpisode) {
      navigate(`/watch/tv/${id}/season/${selectedSeason}/episode/${selectedEpisode}`);
    } else if (actualMediaType === 'anime' && selectedEpisode) {
      navigate(`/watch/anime/${id}/episode/${selectedEpisode}`);
    } else if (actualMediaType === 'movie') {
      navigate(`/watch/movie/${id}`);
    } else {
      setActiveTab('stream');
      setIsPlaying(true);
    }
  };

  // YouTube trailer options
  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </MainLayout>
    );
  }

  if (!mediaDetails) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
          <p className="mb-6">The requested content could not be found or is unavailable.</p>
          <Button asChild className="glow-button">
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Banner */}
      <div className="hero-banner">
        {trailerKey ? (
          <div className="hero-banner-video">
            <YouTube
              videoId={trailerKey}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: {
                  autoplay: 1,
                  mute: 1, // Always start muted
                  controls: 0,
                  showinfo: 0,
                  modestbranding: 1,
                  loop: 1,
                  playlist: trailerKey,
                  rel: 0,
                },
              }}
              className="absolute top-0 left-0 w-full h-full object-cover"
              ref={trailerPlayerRef}
              onReady={(event) => {
                trailerPlayerRef.current = event.target;
                // Ensure it's muted on initial load
                event.target.mute();
              }}
              onError={(error) => {
                console.error("YouTube player error:", error);
                // If there's an error, hide the player and show the backdrop image instead
                setTrailerKey(null);
              }}
            />
            <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={toggleMute}
                aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
              >
                {trailerMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setActiveTab('trailer')}
              >
                <PlayCircle className="mr-1 h-4 w-4" />
                Watch Full Trailer
              </Button>
            </div>
          </div>
        ) : actualMediaType === 'anime' && mediaDetails?.backdrop_path ? (
          <img 
            src={getBackdropUrl(mediaDetails.backdrop_path)} 
            alt={title}
            className="hero-banner-image"
          />
        ) : mediaDetails?.backdrop_path ? (
          <img 
            src={getBackdropUrl(mediaDetails.backdrop_path)} 
            alt={title}
            className="hero-banner-image"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-wolzi-dark-gray to-wolzi-bg"></div>
        )}
        
        <div className="hero-banner-overlay">
          <div className="container mx-auto px-4">
            <div className="hero-banner-content md:max-w-[50%] max-w-full">
              <h1 className="text-2xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">{title}</h1>
              
              <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4 text-white drop-shadow-lg">
                <span className="mr-2 text-yellow-400 font-medium">★ {mediaDetails?.vote_average?.toFixed(1)}</span>
                <span className="mr-2">
                  {mediaDetails?.release_date ? new Date(mediaDetails.release_date).getFullYear() : 
                   mediaDetails?.first_air_date ? new Date(mediaDetails.first_air_date).getFullYear() : 'Unknown'}
                </span>
                {mediaDetails?.runtime && (
                  <span className="mr-2">{Math.floor(mediaDetails.runtime / 60)}h {mediaDetails.runtime % 60}m</span>
                )}
                {mediaDetails?.genres && (
                  <span className="hidden md:inline">{mediaDetails.genres.slice(0, 3).map(g => g.name).join(', ')}</span>
                )}
              </div>
              
              {/* Show only first genre on mobile for simplicity */}
              <div className="flex flex-wrap mb-2 md:hidden">
                {mediaDetails?.genres && mediaDetails.genres.length > 0 && (
                  <span className="px-2 py-1 bg-black/30 rounded-md text-sm">{mediaDetails.genres[0].name}</span>
                )}
              </div>
              
              <div className="relative mb-4 md:mb-6">
                <div className="text-container max-h-[120px] md:max-h-none overflow-y-auto md:overflow-visible pr-1">
                  <p className="text-sm md:text-base text-white drop-shadow-lg font-medium">{mediaDetails?.overview}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 z-10 relative">
                <Button 
                  className="glow-button bg-green-500 hover:bg-green-600 text-base"
                  onClick={handleWatchNow}
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Now
                </Button>
                
                {trailerKey && (
                  <Button 
                    variant="outline"
                    className="flex items-center bg-black/50 border-white/30 hover:bg-black/70 text-white hover:text-green-400"
                    size="lg"
                    onClick={() => setActiveTab('trailer')}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Trailer
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  className="flex items-center bg-black/50 border-white/30 hover:bg-black/70 text-white hover:text-green-400"
                  size="lg"
                >
                  Add to List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="container mx-auto py-6 md:py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 md:mt-6">
          <div className="overflow-x-auto pb-2 no-scrollbar">
            <TabsList className="flex w-full md:w-auto min-w-max">
              {trailerKey && <TabsTrigger value="trailer" className="text-sm md:text-base px-4 py-2">Trailer</TabsTrigger>}
              <TabsTrigger value="stream" className="text-sm md:text-base px-4 py-2">Watch</TabsTrigger>
              <TabsTrigger value="details" className="text-sm md:text-base px-4 py-2">Details</TabsTrigger>
              {actualMediaType === 'tv' && (
                <TabsTrigger value="episodes" className="text-sm md:text-base px-4 py-2">Episodes</TabsTrigger>
              )}
              {actualMediaType === 'anime' && (
                <TabsTrigger value="episodes" className="text-sm md:text-base px-4 py-2">Episodes</TabsTrigger>
              )}
              <TabsTrigger value="sources" className="text-sm md:text-base px-4 py-2">Sources</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Trailer Tab */}
          {trailerKey && (
            <TabsContent value="trailer" className="mt-4 md:mt-6">
              <Card className="p-3 md:p-6">
                <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">Official Trailer</h2>
                <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
                  <YouTube
                    videoId={trailerKey}
                    opts={youtubeOpts}
                    className="w-full h-full"
                  />
                </div>
                
                <div className="mt-3 md:mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <p className="text-sm md:text-base text-wolzi-light-gray">
                    Watch the official trailer for {title}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleWatchNow} className="w-full md:w-auto">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Full {actualMediaType === 'movie' ? 'Movie' : actualMediaType === 'tv' ? 'TV Show' : 'Anime'}
                  </Button>
                </div>
                
                <div className="mt-6 md:mt-8 pt-4 border-t border-wolzi-border">
                  <div className="flex items-center text-sm text-wolzi-light-gray">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    <a 
                      href={`https://www.youtube.com/watch?v=${trailerKey}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-wolzi-accent transition-colors"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}
          
          {/* Stream Tab */}
          <TabsContent value="stream" className="mt-4 md:mt-6">
            <Card className="p-3 md:p-6">
              <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">Watch {title}</h2>
              <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
                {actualMediaType === 'movie' && (
                  <iframe
                    src={getStreamingUrl(actualMediaType, id, undefined, undefined, 'superembed')}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`${title} stream`}
                    {...(!disableSandbox ? {
                      sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-fullscreen allow-pointer-lock"
                    } : {})}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share; pointer-lock"
                  ></iframe>
                )}
                
                {actualMediaType === 'tv' && selectedSeason && selectedEpisode && (
                  <iframe
                    src={getStreamingUrl(actualMediaType, id, selectedSeason, selectedEpisode, 'superembed')}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`${title} S${selectedSeason}E${selectedEpisode} stream`}
                    {...(!disableSandbox ? {
                      sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-fullscreen allow-pointer-lock"
                    } : {})}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share; pointer-lock"
                  ></iframe>
                )}
                
                {actualMediaType === 'anime' && selectedEpisode && streamingLinks.length > 0 && (
                  <iframe
                    src={streamingLinks[0].url}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`${title} episode ${selectedEpisode} stream`}
                    {...(!disableSandbox ? {
                      sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-fullscreen allow-pointer-lock"
                    } : {})}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share; pointer-lock"
                  ></iframe>
                )}
              </div>
              
              <div className="mt-3 md:mt-4 flex justify-center">
                <Button 
                  className="glow-button w-full md:w-64 py-4 md:py-6 text-base md:text-lg font-medium" 
                  onClick={handleWatchNow}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Open Full Player
                </Button>
              </div>
              
              {/* Player Settings */}
              <div className="mt-6 border border-green-500/20 rounded-md p-3 md:p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="mb-3 md:mb-0">
                    <h3 className="text-sm font-medium text-white">Player Settings</h3>
                    <p className="text-xs text-white/70 mt-1">
                      Configure your stream playback options
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start p-2 rounded-md">
                      <label className="text-sm text-white/80">Sandbox Mode:</label>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={!disableSandbox}
                          onCheckedChange={(value) => {
                            setDisableSandbox(!value);
                            // Force iframe reload
                            const tempActiveTab = activeTab;
                            setActiveTab('details');
                            setTimeout(() => setActiveTab(tempActiveTab), 50);
                          }}
                        />
                        <span className={`text-xs ${!disableSandbox ? "text-green-400" : "text-red-400"}`}>
                          {!disableSandbox ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 block md:hidden">
                  <p className="text-xs text-white/60">
                    <span className="text-white/80">Sandbox Mode</span>: Provides secure playback (recommended). 
                    If you experience issues with certain servers, try disabling this feature temporarily.
                  </p>
                </div>
              </div>
              
              {/* TV Show Episode Navigation */}
              {actualMediaType === 'tv' && mediaDetails?.seasons && mediaDetails.seasons.length > 0 && (
                <div className="mt-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mediaDetails.seasons.map((season) => (
                      <Button
                        key={season.season_number}
                        variant={selectedSeason === season.season_number ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSeason(season.season_number)}
                      >
                        Season {season.season_number}
                      </Button>
                    ))}
                  </div>
                  
                  {seasonDetails ? (
                    <div className="space-y-4">
                      <div className="mb-6 p-4 rounded-md border border-green-500/30">
                        <h2 className="text-xl font-bold text-white">{seasonDetails.name}</h2>
                        {seasonDetails.episodes && (
                          <div className="flex items-center mt-1">
                            <p className="text-white/90">{seasonDetails.episodes.length} Episodes</p>
                            <div className="mx-2 w-1 h-1 rounded-full bg-white/40"></div>
                            <p className="text-white/80 text-sm">{seasonDetails.episodes[0]?.air_date ? new Date(seasonDetails.episodes[0].air_date).getFullYear() : ''}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {seasonDetails.episodes?.map((episode) => (
                          <div 
                            key={episode.id}
                            className={`p-4 rounded-lg transition-all duration-200 ${
                              selectedEpisode === episode.episode_number 
                                ? 'bg-green-500/10 border border-green-500/60 shadow-md shadow-green-500/20' 
                                : 'border border-green-500/20 hover:border-green-500/40'
                            } cursor-pointer relative group`}
                            onClick={() => {
                              handleEpisodeSelect(episode.episode_number);
                              setActiveTab('stream');
                              setIsPlaying(true);
                            }}
                          >
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="md:w-1/4 lg:w-1/5 relative rounded-md overflow-hidden">
                                {episode.still_path ? (
                                  <img 
                                    src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                    alt={episode.name}
                                    className="w-full h-auto rounded-md object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full aspect-video bg-black/50 rounded-md flex items-center justify-center">
                                    <span className="text-white/70">No Preview</span>
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                                  Episode {episode.episode_number}
                                </div>
                                {episode.runtime && (
                                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                                    {episode.runtime} min
                                  </div>
                                )}
                              </div>
                              
                              <div className="md:w-3/4 lg:w-4/5">
                                <div className="flex justify-between mb-2">
                                  <h3 className="text-lg font-medium group-hover:text-green-400 transition-colors">
                                    {episode.name}
                                  </h3>
                                </div>
                                
                                <div className="text-sm text-white/80 mb-2">
                                  {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                                </div>
                                
                                <p className="text-white/70 text-sm line-clamp-2 md:line-clamp-none">{episode.overview || 'No description available.'}</p>
                                
                                <div className="mt-3 flex justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-xs text-white hover:text-green-400 hover:bg-green-500/10 group-hover:text-green-400 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEpisodeSelect(episode.episode_number);
                                      handleWatchNow();
                                    }}
                                  >
                                    <Play className="w-3 h-3 mr-1" /> Watch Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {selectedEpisode === episode.episode_number && (
                              <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-lg"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center p-12">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <Card className="p-6">
              {renderAnimeDetails()}
            </Card>
          </TabsContent>
          
          {/* Episodes Tab (TV only) */}
          {actualMediaType === 'tv' && (
            <TabsContent value="episodes" className="mt-6">
              <Card className="p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {mediaDetails?.seasons?.map((season) => (
                    <Button
                      key={season.season_number}
                      variant={selectedSeason === season.season_number ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSeason(season.season_number)}
                    >
                      Season {season.season_number}
                    </Button>
                  ))}
                </div>
                
                {seasonDetails ? (
                  <div className="space-y-4">
                    <div className="mb-6 p-4 rounded-md border border-green-500/30">
                      <h2 className="text-xl font-bold text-white">{seasonDetails.name}</h2>
                      {seasonDetails.episodes && (
                        <div className="flex items-center mt-1">
                          <p className="text-white/90">{seasonDetails.episodes.length} Episodes</p>
                          <div className="mx-2 w-1 h-1 rounded-full bg-white/40"></div>
                          <p className="text-white/80 text-sm">{seasonDetails.episodes[0]?.air_date ? new Date(seasonDetails.episodes[0].air_date).getFullYear() : ''}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {seasonDetails.episodes?.map((episode) => (
                        <div 
                          key={episode.id}
                          className={`p-4 rounded-lg transition-all duration-200 ${
                            selectedEpisode === episode.episode_number 
                              ? 'bg-green-500/10 border border-green-500/60 shadow-md shadow-green-500/20' 
                              : 'border border-green-500/20 hover:border-green-500/40'
                          } cursor-pointer relative group`}
                          onClick={() => {
                            handleEpisodeSelect(episode.episode_number);
                            setActiveTab('stream');
                            setIsPlaying(true);
                          }}
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="md:w-1/4 lg:w-1/5 relative rounded-md overflow-hidden">
                              {episode.still_path ? (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                  alt={episode.name}
                                  className="w-full h-auto rounded-md object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full aspect-video bg-black/50 rounded-md flex items-center justify-center">
                                  <span className="text-white/70">No Preview</span>
                                </div>
                              )}
                              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                                Episode {episode.episode_number}
                              </div>
                              {episode.runtime && (
                                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                                  {episode.runtime} min
                                </div>
                              )}
                            </div>
                            
                            <div className="md:w-3/4 lg:w-4/5">
                              <div className="flex justify-between mb-2">
                                <h3 className="text-lg font-medium group-hover:text-green-400 transition-colors">
                                  {episode.name}
                                </h3>
                              </div>
                              
                              <div className="text-sm text-white/80 mb-2">
                                {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                              </div>
                              
                              <p className="text-white/70 text-sm line-clamp-2 md:line-clamp-none">{episode.overview || 'No description available.'}</p>
                              
                              <div className="mt-3 flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-xs text-white hover:text-green-400 hover:bg-green-500/10 group-hover:text-green-400 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEpisodeSelect(episode.episode_number);
                                    handleWatchNow();
                                  }}
                                >
                                  <Play className="w-3 h-3 mr-1" /> Watch Now
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {selectedEpisode === episode.episode_number && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-lg"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center p-12">
                    <div className="loading-spinner"></div>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
          
          {/* Episodes Tab for Anime */}
          {actualMediaType === 'anime' && (
            <TabsContent value="episodes" className="mt-6">
              <Card className="p-6">
                {renderAnimeEpisodes()}
              </Card>
            </TabsContent>
          )}
          
          {/* Streaming Sources Tab */}
          <TabsContent value="sources" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Video Sources</h2>
              <p className="mb-6 text-wolzi-light-gray">Select your preferred streaming source</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamingSources
                  .map((source) => (
                  <div 
                    key={source.id}
                    className={`p-4 rounded-md cursor-pointer border transition-all duration-200 hover:shadow-md ${
                      source.isActive 
                        ? 'bg-wolzi-accent/20 border-wolzi-accent' 
                        : 'bg-wolzi-dark-gray/50 border-wolzi-gray/30 hover:bg-wolzi-dark-gray'
                    }`}
                    onClick={() => handleSourceChange(source.id)}
                  >
                    <h3 className="font-medium">{source.name}</h3>
                    {source.description && (
                      <p className="text-sm text-wolzi-light-gray mt-1">{source.description}</p>
                    )}
                    <div className="flex justify-between mt-2">
                      <div className="text-xs">
                        {source.id === 'embedsu' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/30 text-blue-200">
                            Premium Quality
                          </span>
                        )}
                        {source.id === 'vidsrcto' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/30 text-green-200">
                            Fast Streaming
                          </span>
                        )}
                        {source.id === 'superembed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/30 text-purple-200">
                            High Quality
                          </span>
                        )}
                        {source.id === 'smashystream' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/30 text-yellow-200">
                            Wide Collection
                          </span>
                        )}
                      </div>
                      {source.isActive && (
                        <span className="text-xs bg-wolzi-accent px-2 py-1 rounded-full text-white">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-4 border-t border-wolzi-border">
                <p className="text-sm text-wolzi-light-gray">
                  Recommended source: 
                  <span className="font-medium text-purple-400 ml-1">SuperEmbed</span> for high quality streams
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* CSS for hero banner video */}
      <style jsx global>{`
        .hero-banner-video {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .hero-banner-video iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          transform: translate(-50%, -50%) scale(1.5);
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .hero-banner-video iframe {
            transform: translate(-50%, -50%) scale(2);
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default MediaDetail; 