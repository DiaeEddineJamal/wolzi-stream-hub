import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import tmdbApi, { getBackdropUrl, getPosterUrl } from '@/integrations/api/tmdb';
import jikanApi from '@/integrations/api/jikan';
import gogoAnimeApi from '@/integrations/api/gogoanime';
import { streamingSources as availableStreamingSources, getStreamingUrl } from '@/integrations/api/streamingSources';
import ReactPlayer from 'react-player';
import MainLayout from '@/layouts/MainLayout';
import { Tables } from '@/types/supabase';
import YouTube from 'react-youtube';
import { Play, PlayCircle, ArrowUpRight } from 'lucide-react';

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
  const [animeDetails, setAnimeDetails] = useState<AnimeDetails | null>(null);
  const [gogoAnimeInfo, setGogoAnimeInfo] = useState<GogoAnimeInfo | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null);
  const [activeTab, setActiveTab] = useState('stream');
  const [selectedSeason, setSelectedSeason] = useState<number | null>(seasonNumber ? parseInt(seasonNumber) : 1);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(episodeNumber ? parseInt(episodeNumber) : 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamingSources, setStreamingSources] = useState(availableStreamingSources);
  const [preferences, setPreferences] = useState<UserPreferences>({
    active_streaming_source: 'vidjoy',
    autoplay: true
  });
  const [progress, setProgress] = useState(0);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [streamingLinks, setStreamingLinks] = useState<any[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

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
  
  const title = mediaDetails?.title || mediaDetails?.name || animeDetails?.title || '';

  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        if (actualMediaType === 'anime') {
          // Fetch anime details from Jikan API
          const { data } = await jikanApi.getAnimeDetails(parseInt(id));
          setAnimeDetails(data.data);
          
          // Fetch characters
          const charactersResponse = await jikanApi.getAnimeCharacters(parseInt(id));
          const animeWithCharacters = {
            ...data.data,
            characters: charactersResponse.data.data
          };
          setAnimeDetails(animeWithCharacters);
          
          // Try to find trailer for anime
          if (data.data.trailer && data.data.trailer.youtube_id) {
            setTrailerKey(data.data.trailer.youtube_id);
          }
          
          // Try to find this anime on GogoAnime for streaming
          const gogoId = await gogoAnimeApi.findGogoAnimeId(data.data.title);
          if (gogoId) {
            const gogoResponse = await gogoAnimeApi.getAnimeInfo(gogoId);
            setGogoAnimeInfo(gogoResponse.data);
          }
        } else {
          // Fetch movie/TV details from TMDB
          const { data } = actualMediaType === 'movie'
            ? await tmdbApi.getMovieDetails(parseInt(id))
            : await tmdbApi.getTVShowDetails(parseInt(id));
          
          setMediaDetails(data);
          
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
          
          // If it's a TV show and has seasons, fetch first season details
          if (actualMediaType === 'tv' && data.seasons && data.seasons.length > 0) {
            const initialSeason = selectedSeason || 1;
            fetchSeasonDetails(parseInt(id), initialSeason);
          }
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
      if (actualMediaType !== 'anime' || !gogoAnimeInfo || !selectedEpisode) return;
      
      try {
        const episode = gogoAnimeInfo.episodes.find(ep => ep.number === selectedEpisode);
        if (episode) {
          const response = await gogoAnimeApi.getStreamingLinks(episode.id);
          setStreamingLinks(response.data.sources || []);
        }
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
  }, [gogoAnimeInfo, selectedEpisode, actualMediaType, toast]);

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
    if (!user || !id || (!mediaDetails && !animeDetails)) return;
    
    try {
      const posterPath = actualMediaType === 'anime' 
        ? animeDetails?.images.jpg.large_image_url 
        : getPosterUrl(mediaDetails?.poster_path || '');

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
    return streamingSources.find(source => source.isActive)?.id || 'vidjoy';
  };

  const getStreamUrl = () => {
    if (actualMediaType === 'anime' && streamingLinks.length > 0) {
      // Return highest quality link
      const sortedLinks = [...streamingLinks].sort((a, b) => {
        const qualityA = parseInt(a.quality.replace('p', '')) || 0;
        const qualityB = parseInt(b.quality.replace('p', '')) || 0;
        return qualityB - qualityA;
      });
      return sortedLinks[0].url;
    }
    
    const activeSourceId = streamingSources.find(source => source.isActive)?.id || 'vidjoy';
    
    return getStreamingUrl(
      actualMediaType,
      id || '',
      selectedSeason || undefined,
      selectedEpisode || undefined,
      activeSourceId
    );
  };

  const renderAnimeEpisodes = () => {
    if (!gogoAnimeInfo || !gogoAnimeInfo.episodes || gogoAnimeInfo.episodes.length === 0) {
      return <p>No episodes available for streaming.</p>;
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4">
        {gogoAnimeInfo.episodes.map((episode) => (
          <Button
            key={episode.id}
            variant={selectedEpisode === episode.number ? "default" : "outline"}
            className="w-full"
            onClick={() => setSelectedEpisode(episode.number)}
          >
            Episode {episode.number}
          </Button>
        ))}
      </div>
    );
  };

  const renderAnimeDetails = () => {
    if (!animeDetails) return null;
    
    return (
      <div className="mt-4 space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Synopsis</h3>
          <p className="text-wolzi-text">{animeDetails.synopsis}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Japanese Title:</span> {animeDetails.title_japanese}</p>
              <p><span className="font-medium">Episodes:</span> {animeDetails.episodes}</p>
              <p><span className="font-medium">Score:</span> {animeDetails.score}/10</p>
            </div>
            <div>
              <p><span className="font-medium">Studios:</span> {animeDetails.studios?.map(s => s.name).join(', ')}</p>
              <p><span className="font-medium">Genres:</span> {animeDetails.genres?.map(g => g.name).join(', ')}</p>
              <p><span className="font-medium">Aired:</span> {new Date(animeDetails.aired?.from).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        {animeDetails.characters && animeDetails.characters.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Characters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {animeDetails.characters.slice(0, 12).map((character) => (
                <div key={character.character.mal_id} className="text-center">
                  <img 
                    src={character.character.images.jpg.image_url} 
                    alt={character.character.name}
                    className="rounded-md w-full h-40 object-cover mb-2"
                  />
                  <p className="font-medium text-sm">{character.character.name}</p>
                  <p className="text-xs text-wolzi-light-gray">{character.role}</p>
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

  if (!mediaDetails && !animeDetails) {
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
        {actualMediaType === 'anime' && animeDetails?.images.jpg.large_image_url ? (
          <img 
            src={animeDetails.images.jpg.large_image_url} 
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
            <div className="hero-banner-content">
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              
              <div className="flex items-center mb-4 text-wolzi-light-gray">
                <span className="mr-3 text-yellow-400">★ {actualMediaType === 'anime' ? animeDetails?.score || 'N/A' : mediaDetails?.vote_average?.toFixed(1)}</span>
                <span className="mr-3">
                  {actualMediaType === 'anime' 
                    ? new Date(animeDetails?.aired?.from || '').getFullYear() 
                    : mediaDetails?.release_date ? new Date(mediaDetails.release_date).getFullYear() : 
                     mediaDetails?.first_air_date ? new Date(mediaDetails.first_air_date).getFullYear() : 'Unknown'}
                </span>
                {mediaDetails?.runtime && (
                  <span className="mr-3">{Math.floor(mediaDetails.runtime / 60)}h {mediaDetails.runtime % 60}m</span>
                )}
                {mediaDetails?.genres && (
                  <span>{mediaDetails.genres.slice(0, 3).map(g => g.name).join(', ')}</span>
                )}
              </div>
              
              <p className="text-wolzi-text mb-6">{actualMediaType === 'anime' ? animeDetails?.synopsis : mediaDetails?.overview}</p>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  className="glow-button" 
                  onClick={handleWatchNow}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Now
                </Button>
                
                {trailerKey && (
                  <Button 
                    variant="outline" 
                    className="flex items-center" 
                    onClick={() => setActiveTab('trailer')}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Watch Trailer
                  </Button>
                )}
                
                <Button variant="outline">
                  Add to List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="container mx-auto py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 md:w-auto md:flex">
            {trailerKey && <TabsTrigger value="trailer">Trailer</TabsTrigger>}
            <TabsTrigger value="stream">Watch</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            {actualMediaType === 'tv' && (
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
            )}
            {actualMediaType === 'anime' && (
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
            )}
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
          
          {/* Trailer Tab */}
          {trailerKey && (
            <TabsContent value="trailer" className="mt-6">
              <Card className="p-4 md:p-6 frosted-glass">
                <h2 className="text-xl font-medium mb-4">Official Trailer</h2>
                <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
                  <YouTube
                    videoId={trailerKey}
                    opts={youtubeOpts}
                    className="w-full h-full"
                  />
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-wolzi-light-gray">
                    Watch the official trailer for {title}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleWatchNow}>
                    <Play className="mr-2 h-4 w-4" />
                    Watch Full {actualMediaType === 'movie' ? 'Movie' : actualMediaType === 'tv' ? 'TV Show' : 'Anime'}
                  </Button>
                </div>
                
                <div className="mt-8 pt-4 border-t border-wolzi-border">
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
          <TabsContent value="stream" className="mt-6">
            <Card className="p-4 md:p-6 frosted-glass">
              <h2 className="text-xl font-medium mb-4">Watch {title}</h2>
              <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
                {actualMediaType === 'movie' && (
                  <iframe
                    src={getStreamingUrl(actualMediaType, id, undefined, undefined, 'embedsu')}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`${title} stream`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                  ></iframe>
                )}
                
                {actualMediaType === 'tv' && selectedSeason && selectedEpisode && (
                  <iframe
                    src={getStreamingUrl(actualMediaType, id, selectedSeason, selectedEpisode, 'embedsu')}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`${title} S${selectedSeason}E${selectedEpisode} stream`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                  ></iframe>
                )}
                
                {actualMediaType === 'anime' && selectedEpisode && gogoAnimeInfo && (
                  <iframe
                    src={gogoAnimeInfo 
                      ? `https://gogoanimehd.io/streaming.php?id=${gogoAnimeInfo.id}&ep=${selectedEpisode}`
                      : getStreamingUrl(actualMediaType, id, undefined, selectedEpisode, 'embedsu')}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`${title} episode ${selectedEpisode} stream`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                  ></iframe>
                )}
              </div>
              
              <div className="mt-4 flex justify-center">
                <Button 
                  className="glow-button w-64 py-6 text-lg font-medium" 
                  onClick={handleWatchNow}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Open Full Player
                </Button>
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
                  
                  {seasonDetails && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                      {seasonDetails.episodes.map((episode) => (
                        <div 
                          key={episode.id}
                          className={`p-2 rounded-md cursor-pointer transition-colors ${
                            selectedEpisode === episode.episode_number 
                              ? 'bg-wolzi-accent/20 border border-wolzi-accent'
                              : 'bg-wolzi-dark-gray/50 hover:bg-wolzi-dark-gray'
                          }`}
                          onClick={() => handleEpisodeSelect(episode.episode_number)}
                        >
                          <div className="relative aspect-video mb-2 overflow-hidden rounded">
                            {episode.still_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w300${episode.still_path}`} 
                                alt={episode.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-wolzi-dark-gray flex items-center justify-center">
                                <span className="text-wolzi-light-gray">No Preview</span>
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                              {episode.runtime ? `${episode.runtime} min` : '--'}
                            </div>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{episode.episode_number}. {episode.name}</p>
                              <p className="text-xs text-wolzi-light-gray truncate">
                                {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            {actualMediaType === 'anime' ? (
              <Card className="p-6 frosted-glass">
                {renderAnimeDetails()}
              </Card>
            ) : (
              <Card className="p-6 frosted-glass">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 lg:w-1/4">
                    {mediaDetails?.poster_path ? (
                      <img 
                        src={getPosterUrl(mediaDetails.poster_path)} 
                        alt={title}
                        className="w-full h-auto rounded-md shadow-lg"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-wolzi-dark-gray rounded-md flex items-center justify-center">
                        <span className="text-wolzi-light-gray">No Poster</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:w-2/3 lg:w-3/4">
                    <h2 className="text-2xl font-bold mb-4">{title}</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Overview</h3>
                        <p className="text-wolzi-light-gray">{mediaDetails?.overview}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Details</h3>
                          <ul className="space-y-2 text-wolzi-light-gray">
                            <li>
                              <span className="font-medium text-wolzi-text">Released:</span>{' '}
                              {mediaDetails?.release_date ? new Date(mediaDetails.release_date).toLocaleDateString() : 
                               mediaDetails?.first_air_date ? new Date(mediaDetails.first_air_date).toLocaleDateString() : 'Unknown'}
                            </li>
                            {actualMediaType === 'movie' && mediaDetails?.runtime && (
                              <li>
                                <span className="font-medium text-wolzi-text">Runtime:</span>{' '}
                                {Math.floor(mediaDetails.runtime / 60)}h {mediaDetails.runtime % 60}m
                              </li>
                            )}
                          </ul>
                        </div>
                        
                        {mediaDetails?.credits?.cast && mediaDetails.credits.cast.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">Cast</h3>
                            <ul className="space-y-2 text-wolzi-light-gray">
                              {mediaDetails.credits.cast.slice(0, 6).map((actor) => (
                                <li key={actor.id}>
                                  <span className="font-medium text-wolzi-text">{actor.name}</span>{' '}
                                  {actor.character && `as ${actor.character}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
          
          {/* Episodes Tab (TV only) */}
          {actualMediaType === 'tv' && (
            <TabsContent value="episodes" className="mt-6">
              <Card className="p-6 frosted-glass">
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
                    <div className="mb-4">
                      <h2 className="text-xl font-bold">{seasonDetails.name}</h2>
                      {seasonDetails.episodes && (
                        <p className="text-wolzi-light-gray">{seasonDetails.episodes.length} Episodes</p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {seasonDetails.episodes?.map((episode) => (
                        <div 
                          key={episode.id}
                          className={`p-4 rounded-md ${
                            selectedEpisode === episode.episode_number 
                              ? 'bg-wolzi-accent/20 border border-wolzi-accent'
                              : 'bg-wolzi-dark-gray/50 hover:bg-wolzi-dark-gray'
                          } cursor-pointer`}
                          onClick={() => {
                            handleEpisodeSelect(episode.episode_number);
                            setActiveTab('stream');
                            setIsPlaying(true);
                          }}
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="md:w-1/4 lg:w-1/5">
                              {episode.still_path ? (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                  alt={episode.name}
                                  className="w-full h-auto rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-full aspect-video bg-wolzi-dark-gray rounded-md flex items-center justify-center">
                                  <span className="text-wolzi-light-gray">No Preview</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="md:w-3/4 lg:w-4/5">
                              <div className="flex justify-between mb-2">
                                <h3 className="text-lg font-medium">
                                  {episode.episode_number}. {episode.name}
                                </h3>
                                <div className="text-sm text-wolzi-light-gray">
                                  {episode.runtime ? `${episode.runtime} min` : '--'}
                                </div>
                              </div>
                              
                              <div className="text-sm text-wolzi-light-gray mb-2">
                                {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                              </div>
                              
                              <p className="text-wolzi-light-gray">{episode.overview || 'No description available.'}</p>
                            </div>
                          </div>
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
              <Card className="p-6 frosted-glass">
                {renderAnimeEpisodes()}
              </Card>
            </TabsContent>
          )}
          
          {/* Streaming Sources Tab */}
          <TabsContent value="sources" className="mt-6">
            <Card className="p-6 frosted-glass">
              <h2 className="text-xl font-bold mb-6">Video Sources</h2>
              <p className="mb-6 text-wolzi-light-gray">Select your preferred streaming source</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streamingSources
                  .filter(source => {
                    // Show the most reliable sources
                    return ['upcloud', 'vidcloud', 'embedsu', 'vidsrcto', 'lulustreams', 'krakenfiles'].includes(source.id);
                  })
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
                        {source.id === 'upcloud' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/30 text-blue-200">
                            HD TV Shows
                          </span>
                        )}
                        {source.id === 'vidcloud' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/30 text-green-200">
                            Fast Streaming
                          </span>
                        )}
                        {source.id === 'lulustreams' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/30 text-purple-200">
                            Anime
                          </span>
                        )}
                        {source.id === 'krakenfiles' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/30 text-yellow-200">
                            4K
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
                  Recommended sources: 
                  {actualMediaType === 'tv' && <span className="font-medium text-blue-400 ml-1">UpCloud</span>} 
                  {actualMediaType === 'anime' && <span className="font-medium text-purple-400 ml-1">LuluStreams</span>}
                  {actualMediaType === 'movie' && <span className="font-medium text-yellow-400 ml-1">Kraken Files</span>}
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default MediaDetail; 