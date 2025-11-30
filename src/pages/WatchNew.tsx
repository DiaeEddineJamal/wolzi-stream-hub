import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, X, Download, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import tmdbApi from '@/integrations/api/tmdb';
import jikanApi from '@/integrations/api/jikan';

// Import our new glassmorphism components
import { GlassmorphismVideoPlayer } from '@/components/watch/GlassmorphismVideoPlayer';
import { ContentInfoPanel } from '@/components/watch/ContentInfoPanel';
import { SourceSelector, StreamingSource } from '@/components/watch/SourceSelector';
import NavBar from '@/components/layout/NavBar';

// Import utilities
import { 
  createStreamingSources, 
  autoSelectBestSource, 
  testStreamingSource,
  SourceTestResult 
} from '@/utils/sourceTestUtils';

interface MediaDetails {
  id: string;
  title: string;
  overview?: string;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  genres?: string[];
  posterPath?: string;
  backdropPath?: string;
}

interface EpisodeInfo {
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  episodeOverview?: string;
  airDate?: string;
  runtime?: number;
  stillPath?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function WatchNew() {
  const { id, season, episode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef<HTMLDivElement>(null);

  // Media state
  const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null);
  const [mediaType, setMediaType] = useState<'movie' | 'tv' | 'anime'>('movie');
  
  // Player state
  const [sources, setSources] = useState<StreamingSource[]>([]);
  const [activeSource, setActiveSource] = useState<StreamingSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState<Array<{ quality: string; url: string }>>([]);
  const [customDownloadUrl, setCustomDownloadUrl] = useState<string>("");
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Player controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Settings
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [disableSandbox, setDisableSandbox] = useState(false);

  // Seasons/Episodes state (TV)
  const [tvSeasons, setTvSeasons] = useState<Array<{ season_number: number; name: string; episode_count: number }>>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(season ? parseInt(season) : 1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Array<{ id: number; name: string; episode_number: number; overview?: string; air_date?: string; runtime?: number; still_path?: string | null }>>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Episodes list (Anime)
  const [animeEpisodes, setAnimeEpisodes] = useState<Array<{ episode: number; title?: string }>>([]);
  const [animeEpisodesLoading, setAnimeEpisodesLoading] = useState(false);

  // Determine media type from URL path
  useEffect(() => {
    const path = location.pathname;
    let newMediaType: 'movie' | 'tv' | 'anime';
    
    if (path.includes('/watch/movie/')) {
      newMediaType = 'movie';
    } else if (path.includes('/watch/tv/')) {
      newMediaType = 'tv';
    } else if (path.includes('/watch/anime/')) {
      newMediaType = 'anime';
    } else {
      // Default fallback
      console.warn('Unknown media type from URL path:', path, 'defaulting to movie');
      newMediaType = 'movie';
    }
    
    setMediaType(newMediaType);
    console.log('MediaType set to:', newMediaType);
  }, [location.pathname]);

  // Load media details
  useEffect(() => {
    const loadMediaDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let details: MediaDetails;
        
        if (mediaType === 'movie') {
          const movieResponse = await tmdbApi.getMovieDetails(parseInt(id));
          const movie = movieResponse.data;
          details = {
            id: movie.id.toString(),
            title: movie.title,
            overview: movie.overview,
            releaseDate: movie.release_date,
            runtime: movie.runtime,
            rating: movie.vote_average,
            genres: movie.genres?.map(g => g.name) || [],
            posterPath: movie.poster_path,
            backdropPath: movie.backdrop_path
          };
        } else if (mediaType === 'tv') {
          const showResponse = await tmdbApi.getTVShowDetails(parseInt(id));
          const show = showResponse.data;
          details = {
            id: show.id.toString(),
            title: show.name,
            overview: show.overview,
            releaseDate: show.first_air_date,
            rating: show.vote_average,
            genres: show.genres?.map(g => g.name) || [],
            posterPath: show.poster_path,
            backdropPath: show.backdrop_path
          };
          // Store seasons list (filter out season 0 specials)
          const validSeasons = (show.seasons || []).filter((s: any) => s.season_number > 0);
          setTvSeasons(validSeasons);
          const initialSeason = season ? parseInt(season) : (validSeasons[0]?.season_number || 1);
          setSelectedSeason(initialSeason);
          // Preload episodes for selected season
          await loadSeasonEpisodes(initialSeason);
          
          // Set episode info for TV shows
          if (season && episode) {
            setEpisodeInfo({
              seasonNumber: parseInt(season),
              episodeNumber: parseInt(episode),
              hasNext: true, // Will be updated when episodes load
              hasPrevious: parseInt(episode) > 1
            });
          }
        } else if (mediaType === 'anime') {
          const animeResponse = await jikanApi.getAnimeDetails(parseInt(id));
          const anime = animeResponse.data?.data;
          details = {
            id: anime?.mal_id?.toString() || id,
            title: anime?.title || '',
            overview: anime?.synopsis,
            releaseDate: anime?.aired?.from,
            rating: anime?.score,
            genres: anime?.genres?.map((g: any) => g.name) || [],
            posterPath: anime?.images?.jpg?.large_image_url,
            backdropPath: anime?.images?.jpg?.large_image_url
          };
          // Preload anime episodes (page 1)
          await loadAnimeEpisodes();
          
          // Set episode info for anime
          if (episode) {
            setEpisodeInfo({
              seasonNumber: 1,
              episodeNumber: parseInt(episode),
              hasNext: true, // Will be updated when episodes load
              hasPrevious: parseInt(episode) > 1
            });
          }
        }
        
        setMediaDetails(details);
        
        // Create streaming sources (default season 1 for anime)
        const streamingSources = createStreamingSources(
          mediaType,
          id,
          mediaType === 'anime' ? 1 : (season ? parseInt(season) : undefined),
          episode ? parseInt(episode) : undefined
        );
        
        setSources(streamingSources);
        // Default to Vidking immediately (before tests)
        const defaultVidking = streamingSources.find(s => s.id === 'vidking');
        if (defaultVidking) {
          setActiveSource(defaultVidking);
        }
        
        // Auto-select best source
        const bestSource = await autoSelectBestSource(
          streamingSources,
          mediaType,
          id,
          mediaType === 'anime' ? 1 : (season ? parseInt(season) : undefined),
          episode ? parseInt(episode) : undefined,
          (result: SourceTestResult) => {
            // Update source status in real-time
            setSources(prev => prev.map(source => 
              source.id === result.source.id 
                ? { ...source, isWorking: result.isWorking, responseTime: result.responseTime }
                : source
            ));
          }
        );
        
        if (bestSource) {
          setActiveSource(bestSource);
        }
        
      } catch (err) {
        console.error('Error loading media details:', err);
        setError('Failed to load media details');
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaDetails();
  }, [id, mediaType]);

  // Load TV season episodes
  const loadSeasonEpisodes = async (seasonNum: number) => {
    if (!id) return;
    try {
      setEpisodesLoading(true);
      const res = await tmdbApi.getTVSeasonDetails(parseInt(id), seasonNum);
      const eps = res.data?.episodes || [];
      setSeasonEpisodes(eps);
      const current = episode ? parseInt(episode) : 1;
      setEpisodeInfo(prev => ({
        seasonNumber: seasonNum,
        episodeNumber: current,
        episodeTitle: (eps.find((e: any) => e.episode_number === current)?.name) || prev?.episodeTitle,
        episodeOverview: (eps.find((e: any) => e.episode_number === current)?.overview) || prev?.episodeOverview,
        airDate: (eps.find((e: any) => e.episode_number === current)?.air_date) || prev?.airDate,
        runtime: (eps.find((e: any) => e.episode_number === current)?.runtime) || prev?.runtime,
        stillPath: (eps.find((e: any) => e.episode_number === current)?.still_path) || prev?.stillPath,
        hasNext: current < eps.length,
        hasPrevious: current > 1
      }));
    } catch (e) {
      console.error('Error loading season episodes:', e);
    } finally {
      setEpisodesLoading(false);
    }
  };

  // Respond to episode changes without reloading full details
  useEffect(() => {
    const current = episode ? parseInt(episode) : undefined;
    if (!current) return;
    if (mediaType === 'tv') {
      const epObj = seasonEpisodes.find((e: any) => e.episode_number === current);
      setEpisodeInfo(prev => ({
        seasonNumber: selectedSeason,
        episodeNumber: current,
        episodeTitle: epObj?.name || prev?.episodeTitle,
        episodeOverview: epObj?.overview || prev?.episodeOverview,
        airDate: epObj?.air_date || prev?.airDate,
        runtime: epObj?.runtime || prev?.runtime,
        stillPath: epObj?.still_path || prev?.stillPath,
        hasNext: current < seasonEpisodes.length,
        hasPrevious: current > 1
      }));
    } else if (mediaType === 'anime') {
      const epObj = animeEpisodes.find((e: any) => e.episode === current);
      setEpisodeInfo(prev => ({
        seasonNumber: 1,
        episodeNumber: current,
        episodeTitle: epObj?.title || prev?.episodeTitle,
        episodeOverview: prev?.episodeOverview,
        airDate: prev?.airDate,
        runtime: prev?.runtime,
        stillPath: prev?.stillPath,
        hasNext: current < animeEpisodes.length,
        hasPrevious: current > 1
      }));
    }
  }, [episode, seasonEpisodes, animeEpisodes, selectedSeason, mediaType]);

  // Load Anime episodes (first page)
  const loadAnimeEpisodes = async () => {
    if (!id) return;
    try {
      setAnimeEpisodesLoading(true);
      const resp = await jikanApi.getAnimeEpisodes(parseInt(id), 1);
      const list = resp.data?.data || [];
      const mapped = list.map((ep: any) => ({ episode: ep.episode ?? ep.mal_id, title: ep.title }));
      setAnimeEpisodes(mapped);
      const current = episode ? parseInt(episode) : 1;
      setEpisodeInfo(prev => ({
        seasonNumber: 1,
        episodeNumber: current,
        episodeTitle: (mapped.find((e: any) => e.episode === current)?.title) || prev?.episodeTitle,
        hasNext: current < mapped.length,
        hasPrevious: current > 1
      }));
    } catch (e) {
      console.error('Error loading anime episodes:', e);
    } finally {
      setAnimeEpisodesLoading(false);
    }
  };

  // Handle source selection
  // Handle source selection from GlassmorphismVideoPlayer (receives sourceId string)
  const handleSourceChange = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      handleSourceSelect(source);
    }
  };

  const handleSourceSelect = (source: StreamingSource) => {
    setActiveSource(source);
    setError(null);
  };

  // Handle source testing
  const handleSourceTest = async (source: StreamingSource): Promise<boolean> => {
    try {
      const result = await testStreamingSource(
        source, 
        mediaType, 
        id || '', 
        season ? parseInt(season) : undefined, 
        episode ? parseInt(episode) : undefined
      );
      return result.isWorking;
    } catch {
      return false;
    }
  };

  // Navigation handlers
  const goBack = () => {
    navigate(-1);
  };

  const goToNextEpisode = () => {
    if (!episodeInfo || !episodeInfo.hasNext) return;
    
    const nextEpisode = episodeInfo.episodeNumber + 1;
    if (mediaType === 'tv') {
      navigate(`/watch/tv/${id}/${selectedSeason}/${nextEpisode}`, { replace: true });
    } else if (mediaType === 'anime') {
      navigate(`/watch/anime/${id}/${nextEpisode}`, { replace: true });
    }
  };

  const goToPreviousEpisode = () => {
    if (!episodeInfo || !episodeInfo.hasPrevious) return;
    
    const prevEpisode = episodeInfo.episodeNumber - 1;
    if (mediaType === 'tv') {
      navigate(`/watch/tv/${id}/${selectedSeason}/${prevEpisode}`, { replace: true });
    } else if (mediaType === 'anime') {
      navigate(`/watch/anime/${id}/${prevEpisode}`, { replace: true });
    }
  };

  // Player control handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleVolumeChange = (newVolume: number) => setVolume(newVolume);
  const handleMute = () => setIsMuted(!isMuted);
  const handleSeek = (time: number) => setCurrentTime(time);
  
  const handleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Function to open download URL
  const openDownloadUrl = (url: string) => {
    window.open(url, "_blank");
  };

  // Helper: Build external file hosting download URLs
  const buildDownloadUrl = (
    mediaTypeParam: 'movie' | 'tv',
    contentId: string,
    season?: string | number,
    episode?: string | number,
    quality?: string,
  ) => {
    // Generate a realistic-looking download URL for external file hosting
    // This simulates how external file hosts typically structure their URLs
    const q = quality && quality.toLowerCase() === "4k" ? "2160p" : (quality || "1080p");
    const baseId = contentId.slice(-8); // Use last 8 chars for unique identifier
    
    if (mediaTypeParam === "movie") {
      // Example: https://vikingf1le.us.to/f/hUHBWYGB3l (movie format)
      return `https://vikingf1le.us.to/f/${baseId}${q.slice(0,2)}`;
    }
    
    const s = season || "1";
    const e = episode || "1";
    // Example: https://vikingf1le.us.to/f/hUHBWYGB3l (TV show format)
    return `https://vikingf1le.us.to/f/${baseId}S${s}E${e}${q.slice(0,2)}`;
  };

  // Download handler
  const handleDownload = () => {
    if (!id) return;
    const options: { quality: string; url: string }[] = [];
    const mediaTypeForDownload: 'movie' | 'tv' = mediaType === 'anime' ? 'tv' : mediaType;

    ["4K", "1080p", "720p"].forEach((q) => {
      options.push({
        quality: q,
        url: buildDownloadUrl(
          mediaTypeForDownload,
          id,
          season || '1',
          episode || '1',
          q,
        ),
      });
    });

    setDownloadOptions(options);
    setShowDownloadModal(true);
  };

  // Share handler
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mediaDetails?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Add to watchlist handler
  const handleAddToWatchlist = async () => {
    // TODO: Implement watchlist functionality
    console.log('Add to watchlist');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen min-w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="frosted-glass p-6 sm:p-8 md:p-10 rounded-2xl text-center mx-4 max-w-md w-full"
        >
          <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-4 border-white/20 border-t-white rounded-full mx-auto mb-6"></div>
          <p className="text-white text-base sm:text-lg md:text-xl">Loading content...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !activeSource) {
    return (
      <div className="min-h-screen min-w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="frosted-glass p-6 sm:p-8 md:p-10 rounded-2xl text-center max-w-sm sm:max-w-md w-full"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-5 sm:mb-6">Error</h2>
          <p className="text-white/80 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">{error}</p>
          <Button onClick={goBack} className="frosted-glass border-white/20 hover:bg-white/10 text-white w-full sm:w-auto px-6 py-3 text-sm sm:text-base">
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      {/* Background Image */}
      {mediaDetails?.backdropPath && (
        <div 
          className="fixed inset-0 w-full h-full opacity-10 sm:opacity-15 md:opacity-20 bg-cover bg-center bg-no-repeat z-0"
          style={{ 
            backgroundImage: `url(https://image.tmdb.org/t/p/w1280${mediaDetails.backdropPath})`,
            backgroundAttachment: 'fixed'
          }}
        />
      )}
      
      {/* Global NavBar - standard navigation */}
      <NavBar />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-none">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pt-32 sm:pt-32 md:pt-36 lg:pt-40 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16">
            {/* Video Player - Takes up 3 columns on lg+ screens, positioned slightly left */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Video Player */}
              <motion.div
                ref={playerRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden min-h-[340px] xs:min-h-[360px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[600px] xl:min-h-[700px] shadow-2xl w-full"
              >
              {mediaDetails ? (
                <GlassmorphismVideoPlayer
                  mediaType={mediaType}
                  id={id}
                  title={mediaDetails.title}
                  seasonNumber={season ? parseInt(season) : undefined}
                  episodeNumber={episode ? parseInt(episode) : undefined}
                  activeSourceId={activeSource?.id}
                  onSourceChange={handleSourceChange}
                  onError={(error) => setError(error)}
                />
              ) : (
                <div className="w-full h-full frosted-glass flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-lg mb-4">No working sources found</p>
                    <Button
                      onClick={() => setShowSourceSelector(true)}
                      className="frosted-glass border-white/20 hover:bg-white/10 text-white"
                    >
                      Select Source
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Seasons & Episodes (TV) - under player, full width */}
            {mediaType === 'tv' && tvSeasons.length > 0 && (
              <Card className="w-full p-4 sm:p-5 md:p-6 rounded-xl lg:rounded-2xl floating-navbar-glass border border-purple-400/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-white font-semibold text-lg sm:text-xl">Seasons & Episodes</h3>
                    <p className="text-white/70 text-sm sm:text-base">Season {selectedSeason} • {seasonEpisodes.length} Episodes</p>
                  </div>
                  <div className="flex gap-2 sm:gap-3 flex-wrap">
                    {tvSeasons.map((s) => (
                      <Button
                        key={s.season_number}
                        size="sm"
                        variant={selectedSeason === s.season_number ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedSeason(s.season_number);
                          navigate(`/watch/tv/${id}/${s.season_number}/1`, { replace: true });
                          loadSeasonEpisodes(s.season_number);
                        }}
                        className={`text-xs sm:text-sm transition-all ${
                          selectedSeason === s.season_number
                            ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                            : 'text-white border-white/30 hover:border-white/50 hover:bg-white/10'
                        }`}
                      >
                        Season {s.season_number}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-5 md:space-y-6 max-h-80 sm:max-h-96 md:max-h-[500px] overflow-y-auto pr-2">
                  {episodesLoading ? (
                    <p className="text-white/70 text-center py-4">Loading episodes…</p>
                  ) : (
                    seasonEpisodes.map((ep) => (
                      <div
                        key={ep.id ?? `${selectedSeason}-${ep.episode_number}`}
                        className={`p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl transition-all duration-200 ${
                          episodeInfo?.episodeNumber === ep.episode_number
                            ? 'bg-purple-500/10 border-2 border-purple-400/60 shadow-md shadow-purple-500/20'
                            : 'border border-purple-400/20 hover:border-purple-400/40'
                        } cursor-pointer relative group`}
                        onClick={() => navigate(`/watch/tv/${id}/${selectedSeason}/${ep.episode_number}`, { replace: true })}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6">
                          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5 relative rounded-lg overflow-hidden flex-shrink-0">
                            {ep.still_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                srcSet={`https://image.tmdb.org/t/p/w185${ep.still_path} 185w, https://image.tmdb.org/t/p/w300${ep.still_path} 300w, https://image.tmdb.org/t/p/w500${ep.still_path} 500w`}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                                alt={ep.name}
                                className="w-full h-auto rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full aspect-video bg-black/50 rounded-lg flex items-center justify-center">
                                <span className="text-white/70 text-sm">No Preview</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs sm:text-sm px-2 py-1 rounded-md font-medium">
                              Episode {ep.episode_number}
                            </div>
                            {ep.runtime && (
                              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs sm:text-sm px-2 py-1 rounded-md font-medium">
                                {ep.runtime} min
                              </div>
                            )}
                          </div>

                          <div className="flex-1 sm:w-2/3 md:w-3/4 lg:w-4/5 space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                              <h3 className="text-base sm:text-lg md:text-xl font-medium group-hover:text-purple-400 transition-colors line-clamp-2">
                                {ep.name}
                              </h3>
                            </div>

                            <div className="text-sm sm:text-base text-white/80">
                              {ep.air_date ? new Date(ep.air_date).toLocaleDateString() : 'TBA'}
                            </div>

                            <p className="text-white/70 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">{ep.overview || 'No description available.'}</p>

                            <div className="flex justify-end pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm px-4 py-2 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/watch/tv/${id}/${selectedSeason}/${ep.episode_number}`, { replace: true });
                                }}
                              >
                                Watch
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {/* Episodes (Anime) - under player, full width */}
            {mediaType === 'anime' && (
              <Card className="w-full p-4 sm:p-5 md:p-6 rounded-xl lg:rounded-2xl floating-navbar-glass border border-purple-400/30">
                <h3 className="text-white font-semibold text-lg sm:text-xl mb-4 sm:mb-5">Episodes</h3>
                <div className="space-y-4 sm:space-y-5 md:space-y-6 max-h-80 sm:max-h-96 md:max-h-[500px] overflow-y-auto pr-2">
                  {animeEpisodesLoading ? (
                    <p className="text-white/70 text-center py-4">Loading episodes…</p>
                  ) : (
                    animeEpisodes.map((ep) => (
                      <div
                        key={`anime-${ep.episode}`}
                        className={`p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl transition-all duration-200 ${
                          episodeInfo?.episodeNumber === ep.episode
                            ? 'bg-purple-500/10 border-2 border-purple-400/60 shadow-md shadow-purple-500/20'
                            : 'border border-purple-400/20 hover:border-purple-400/40'
                        } cursor-pointer relative group`}
                        onClick={() => navigate(`/watch/anime/${id}/${ep.episode}`, { replace: true })}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6">
                          <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5 relative rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full aspect-video bg-black/50 rounded-lg flex items-center justify-center">
                              <span className="text-white/70 text-sm">No Preview</span>
                            </div>
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs sm:text-sm px-2 py-1 rounded-md font-medium">
                              Episode {ep.episode}
                            </div>
                          </div>

                          <div className="flex-1 sm:w-2/3 md:w-3/4 lg:w-4/5 space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                              <h3 className="text-base sm:text-lg md:text-xl font-medium group-hover:text-purple-400 transition-colors line-clamp-2">
                                {ep.title || `Episode ${ep.episode}`}
                              </h3>
                            </div>

                            <p className="text-white/70 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">No description available.</p>

                            <div className="flex justify-end pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm px-4 py-2 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/watch/anime/${id}/${ep.episode}`, { replace: true });
                                }}
                              >
                                Watch
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {/* Source Selector - Compact version below video */}
            {showSourceSelector && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 sm:mt-6"
              >
                <SourceSelector
                  sources={sources}
                  activeSourceId={activeSource?.id}
                  onSourceSelect={handleSourceSelect}
                  onSourceTest={handleSourceTest}
                  autoSelectBest={false}
                  isCompact={false}
                />
              </motion.div>
            )}
          </div>

          {/* Content Info Panel - Takes up 1 column on lg screens with proper spacing */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 mt-6 sm:mt-8 md:mt-10 lg:mt-0 w-full">
            {/* Watch Page Controls */}
            <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 frosted-glass rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/10 w-full">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="text-white hover:bg-white/10 flex items-center gap-2 text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowSourceSelector(!showSourceSelector)}
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Sources </span>({sources.length})
                </Button>
                
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  size="sm"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {mediaDetails && (
              <div className="mt-4 sm:mt-6">
                <ContentInfoPanel
                  title={mediaDetails.title}
                  overview={episodeInfo?.episodeOverview || mediaDetails.overview}
                  releaseDate={mediaDetails.releaseDate}
                  runtime={episodeInfo?.runtime || mediaDetails.runtime}
                  rating={mediaDetails.rating}
                  genres={mediaDetails.genres}
                  mediaType={mediaType}
                  seasonNumber={episodeInfo?.seasonNumber}
                  episodeNumber={episodeInfo?.episodeNumber}
                  episodeTitle={episodeInfo?.episodeTitle}
                  onDownload={handleDownload}
                  onAddToWatchlist={handleAddToWatchlist}
                  onShare={handleShare}
                />
              </div>
            )}

            
            {/* Compact Source Selector */}
            <div className="mt-6 sm:mt-8">
              <SourceSelector
                sources={sources}
                activeSourceId={activeSource?.id}
                onSourceSelect={handleSourceSelect}
                onSourceTest={handleSourceTest}
                autoSelectBest={false}
                isCompact={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="frosted-glass p-6 sm:p-8 rounded-2xl max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Settings</h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <label className="text-white text-sm sm:text-base cursor-pointer">Auto-play next episode</label>
                  <input
                    type="checkbox"
                    checked={autoNextEnabled}
                    onChange={(e) => setAutoNextEnabled(e.target.checked)}
                    className="rounded w-5 h-5 cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <label className="text-white text-sm sm:text-base cursor-pointer">Disable sandbox mode</label>
                  <input
                    type="checkbox"
                    checked={disableSandbox}
                    onChange={(e) => setDisableSandbox(e.target.checked)}
                    className="rounded w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="frosted-glass p-6 sm:p-8 rounded-2xl max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Download</h3>
                <Button
                  onClick={() => setShowDownloadModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                <div className="text-center space-y-3">
                  <Download className="w-12 h-12 sm:w-14 sm:h-14 text-white/70 mx-auto" />
                  <p className="text-white/80 text-sm sm:text-base">Select a quality to download from external file hosting services.</p>
                  <p className="text-xs sm:text-sm text-white/60">Files are hosted on VikingFile and similar services.</p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {downloadOptions.map((opt) => (
                    <Button
                      key={opt.quality}
                      onClick={() => openDownloadUrl(opt.url)}
                      className="frosted-glass border-white/20 hover:bg-white/10 text-white text-sm sm:text-base py-3 sm:py-4"
                    >
                      {opt.quality}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setShowDownloadModal(false)}
                    className="frosted-glass border-white/20 hover:bg-white/10 text-white px-6 py-2"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
