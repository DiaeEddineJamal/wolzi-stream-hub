import React, { useEffect, useState, useRef } from 'react';
import { useSEO } from '@/hooks/useSEO';
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
import { Play, PlayCircle, ArrowUpRight, Volume2, VolumeX, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { trackEvent } from '@/utils/analytics';

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
  reviews?: {
    results: {
      id: string;
      author: string;
      content: string;
      created_at: string;
      author_details?: {
        rating?: number;
        avatar_path?: string | null;
      };
    }[];
  };
  recommendations?: {
    results: any[];
  };
  similar?: {
    results: any[];
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
  const [activeTab, setActiveTab] = useState('trailer'); // Will be set to 'details' if no trailer
  const [selectedSeason, setSelectedSeason] = useState<number | null>(seasonNumber ? parseInt(seasonNumber) : 1);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(episodeNumber ? parseInt(episodeNumber) : 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamingSources, setStreamingSources] = useState(availableStreamingSources);
  const [preferences, setPreferences] = useState<UserPreferences>({
    active_streaming_source: 'vidking',
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

  useSEO(mediaDetails ? {
    title: `${title} – WolziFlix`,
    description: mediaDetails.overview || '',
    image: mediaDetails.backdrop_path ? getBackdropUrl(mediaDetails.backdrop_path) : (mediaDetails.poster_path ? getPosterUrl(mediaDetails.poster_path) : '/wolziflix-social-card.png'),
    type: 'article',
    keywords: [
      ...(mediaDetails.genres?.map(g => g.name) || []),
      actualMediaType === 'movie' ? 'movie' : actualMediaType === 'tv' ? 'tv series' : 'anime'
    ],
    schema: {
      '@context': 'https://schema.org',
      '@type': actualMediaType === 'movie' ? 'Movie' : 'TVSeries',
      'name': title,
      'image': mediaDetails.poster_path ? getPosterUrl(mediaDetails.poster_path) : undefined,
      'description': mediaDetails.overview || '',
      'aggregateRating': mediaDetails.vote_average ? {
        '@type': 'AggregateRating',
        'ratingValue': mediaDetails.vote_average,
        'bestRating': 10,
        'ratingCount': 1
      } : undefined,
      'genre': mediaDetails.genres?.map(g => g.name)
    }
  } : {})

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
        
        // Set vidking as the default active source
        setStreamingSources(prevSources => 
          prevSources.map(source => ({
            ...source,
            isActive: source.id === 'vidking'
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
            setActiveTab('trailer');
          } else if (anyTrailer) {
            setTrailerKey(anyTrailer.key);
            setActiveTab('trailer');
          } else if (anyVideo) {
            setTrailerKey(anyVideo.key);
            setActiveTab('trailer');
          } else {
            setActiveTab('details');
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
          .eq('content_id', id)
          .eq('content_type', actualMediaType)
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
      // Store only the path, not the full URL
      const posterPath = mediaDetails?.poster_path || '';

      const watchData = {
        user_id: user.id,
        content_id: id,
        content_type: actualMediaType,
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
    return streamingSources.find(source => source.isActive)?.id || 'vidking';
  };

  const getStreamUrl = () => {
    const activeSource = streamingSources.find(source => source.isActive);
    if (!activeSource) {
      return '';
    }
    
    return getStreamingUrl(
      actualMediaType,
      id || '',
      activeSource,
      selectedSeason || undefined,
      selectedEpisode || undefined
    );
  };

  // Toggle mute without restarting the video
  const toggleMute = () => {
    if (trailerPlayerRef.current) {
      try {
        if (trailerMuted) {
          trailerPlayerRef.current.unMute();
        } else {
          trailerPlayerRef.current.mute();
        }
        // Update state after successful API call
        setTrailerMuted(!trailerMuted);
      } catch (error) {
        console.error("Error toggling mute state:", error);
      }
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
            <div className="rounded-md bg-black/40 px-3 py-1 text-sm border border-purple-400/30">
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
                  ? 'bg-purple-500/10 border border-purple-500/60 shadow-md shadow-purple-500/20' 
                  : 'bg-black/40 border border-purple-400/20 hover:border-purple-400/40 hover:bg-black/60'}
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
                    selectedEpisode === episode.episode_number ? 'text-purple-400' : 'text-white/80 group-hover:text-purple-400/80'
                  }`}>{episode.episode_number}</span>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                  <Play className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              
              <div className="p-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium truncate text-white">Episode {episode.episode_number}</p>
                    {selectedEpisode === episode.episode_number && (
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    )}
                </div>
              </div>
              
              {/* Selected Indicator */}
                {selectedEpisode === episode.episode_number && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                )}
            </div>
          ))}
        </div>
        
        {/* Watch button */}
        <div className="flex justify-center mt-2 pb-4">
          <Button
            onClick={() => handleWatchNow()}
            className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white px-8 py-2 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Episode {selectedEpisode || 1}
          </Button>
        </div>
        
        {/* Streaming Sources Section */}
        <div className="mt-6 pt-4 border-t border-purple-400/20">
          <h3 className="text-lg font-medium mb-3">Available Streaming Sources</h3>
          <div className="flex flex-wrap gap-2">
            {streamingSources
              .filter(source => ['embedsu', 'vidsrcto', 'vidking'].includes(source.id))
              .map(source => (
                <div 
                  key={source.id} 
                  className={`
                    px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-all 
                    ${getActiveSource() === source.id 
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' 
                      : 'bg-black/40 text-white/80 border border-purple-400/30 hover:border-purple-400/50 hover:bg-black/60'}
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

  const renderMediaDetails = () => {
    if (!mediaDetails) return null;
    
    const releaseDate = mediaDetails.release_date || mediaDetails.first_air_date;
    const dateLabel = actualMediaType === 'movie' ? 'Release Date' : 'First Aired';
    
    return (
      <div className="mt-4 space-y-8">
        {/* Synopsis */}
        <div className="bg-black/20 p-4 rounded-lg border border-white/5">
          <h3 className="text-lg font-medium mb-2 text-white">Synopsis</h3>
          <p className="text-gray-300 leading-relaxed">{mediaDetails.overview}</p>
        </div>
        
        {/* Key Details */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-white">Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 p-3 rounded-md border border-white/5">
              <p className="text-gray-400 text-xs mb-1">{dateLabel}</p>
              <p className="font-medium">{releaseDate ? new Date(releaseDate).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <div className="bg-black/20 p-3 rounded-md border border-white/5">
              <p className="text-gray-400 text-xs mb-1">Genre</p>
              <p className="font-medium truncate">{mediaDetails.genres?.slice(0, 2).map(g => g.name).join(', ')}</p>
            </div>
            <div className="bg-black/20 p-3 rounded-md border border-white/5">
              <p className="text-gray-400 text-xs mb-1">Rating</p>
              <p className="font-medium text-yellow-400">★ {mediaDetails.vote_average ? mediaDetails.vote_average.toFixed(1) : 'N/A'}</p>
            </div>
            <div className="bg-black/20 p-3 rounded-md border border-white/5">
              <p className="text-gray-400 text-xs mb-1">{actualMediaType === 'movie' ? 'Runtime' : 'Episodes'}</p>
              <p className="font-medium">
                {actualMediaType === 'movie' 
                  ? (mediaDetails.runtime ? `${Math.floor(mediaDetails.runtime / 60)}h ${mediaDetails.runtime % 60}m` : 'Unknown')
                  : (mediaDetails.number_of_episodes || 'Unknown')
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Cast */}
        {mediaDetails.credits?.cast?.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-white">Top Cast</h3>
            <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
              {mediaDetails.credits.cast.slice(0, 10).map((actor) => (
                <div key={actor.id} className="flex-none w-32 text-center group">
                  <div className="relative overflow-hidden rounded-lg mb-2 shadow-lg">
                    {actor.profile_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} 
                        alt={actor.name}
                        className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate text-white group-hover:text-purple-400 transition-colors">{actor.name}</p>
                  <p className="text-xs text-gray-400 truncate">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {mediaDetails.reviews?.results && mediaDetails.reviews.results.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-white">User Reviews</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {mediaDetails.reviews.results.slice(0, 3).map((review) => (
                <div key={review.id} className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{review.author}</span>
                    </div>
                    {review.author_details?.rating && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20">
                        ★ {review.author_details.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-4">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations/Similar */}
        {((mediaDetails.recommendations?.results && mediaDetails.recommendations.results.length > 0) || 
           (mediaDetails.similar?.results && mediaDetails.similar.results.length > 0)) && (
          <div>
            <h3 className="text-lg font-medium mb-4 text-white">You May Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(mediaDetails.recommendations?.results || mediaDetails.similar?.results || [])
                .slice(0, 5)
                .filter((item: any) => item.poster_path) // Only show items with posters
                .map((item: any) => (
                  <Link 
                    key={item.id} 
                    to={`/${actualMediaType === 'movie' ? 'movie' : 'tv'}/${item.id}`}
                    className="block group"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-lg">
                      <img 
                        src={getPosterUrl(item.poster_path)} 
                        alt={item.title || item.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    <p className="text-sm font-medium truncate text-white group-hover:text-purple-400 transition-colors">
                      {item.title || item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.release_date || item.first_air_date || Date.now()).getFullYear()}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleWatchNow = () => {
    if (actualMediaType === 'tv' && selectedSeason && selectedEpisode) {
      navigate(`/watch/tv/${id}/${selectedSeason}/${selectedEpisode}`);
    } else if (actualMediaType === 'anime' && selectedEpisode) {
      navigate(`/watch/anime/${id}/${selectedEpisode}`);
    } else if (actualMediaType === 'movie') {
      navigate(`/watch/movie/${id}`);
    } else {
      setActiveTab('trailer');
      setIsPlaying(true);
    }
    trackEvent('watch_start', { id, type: actualMediaType, title })
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
                  controls: 0,
                  showinfo: 0,
                  modestbranding: 1,
                  loop: 1,
                  rel: 0,
                  mute: 1, // Start muted
                  playlist: trailerKey, // Required for looping
                },
              }}
              className="absolute top-0 left-0 w-full h-full object-cover"
              onReady={(event) => {
                // Store player reference
                trailerPlayerRef.current = event.target;
                
                // Don't set mute again - it's already set in playerVars
                // This prevents any audio glitches
              }}
              onError={(error) => {
                console.error("YouTube player error:", error);
                // If there's an error, hide the player and show the backdrop image instead
                setTrailerKey(null);
              }}
            />
            {/* Video controls - positioned clearly below Add to List button */}
            <div className="fixed bottom-36 sm:bottom-32 right-4 z-30 flex flex-row gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/70 hover:bg-black/90 text-white p-1.5 h-8 w-8 sm:h-9 sm:w-9 shadow-md backdrop-blur-sm"
                onClick={toggleMute}
                aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
              >
                {trailerMuted ? (
                  <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-black/70 hover:bg-black/90 text-white text-xs py-1 px-2 sm:px-3 h-8 sm:h-9 shadow-md backdrop-blur-sm"
                onClick={() => setActiveTab('trailer')}
              >
                <PlayCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">Watch Full Trailer</span>
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
                  className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white px-6 py-3 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
                  onClick={handleWatchNow}
                  size="lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Now
                </Button>
                
                {trailerKey && (
                  <Button 
                    variant="outline"
                    className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white px-6 py-3 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
                    size="lg"
                    onClick={() => setActiveTab('trailer')}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Trailer
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  className="glow-button glassmorphism-button bg-white/20 hover:bg-white/30 text-white px-6 py-3 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
                  onClick={() => {
                    // TODO: Implement add to list functionality
                    console.log('Add to list clicked');
                  }}
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
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
              <TabsTrigger value="details" className="text-sm md:text-base px-4 py-2">Details</TabsTrigger>
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
          
          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <Card className="p-6">
              {renderMediaDetails()}
            </Card>
          </TabsContent>
          
        </Tabs>
      </div>
      
      {/* CSS for hero banner video */}
      <style >{`
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