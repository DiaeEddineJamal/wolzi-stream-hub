import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, X, Download, Share2, Heart, ChevronLeft, ChevronRight, Play, List, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const episodeListRef = useRef<HTMLDivElement>(null);

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
  const [showEpisodeList, setShowEpisodeList] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
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
      newMediaType = 'movie';
    }

    setMediaType(newMediaType);
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
          const validSeasons = (show.seasons || []).filter((s: any) => s.season_number > 0);
          setTvSeasons(validSeasons);
          const initialSeason = season ? parseInt(season) : (validSeasons[0]?.season_number || 1);
          setSelectedSeason(initialSeason);
          await loadSeasonEpisodes(initialSeason);

          if (season && episode) {
            setEpisodeInfo({
              seasonNumber: parseInt(season),
              episodeNumber: parseInt(episode),
              hasNext: true,
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
          await loadAnimeEpisodes();

          if (episode) {
            setEpisodeInfo({
              seasonNumber: 1,
              episodeNumber: parseInt(episode),
              hasNext: true,
              hasPrevious: parseInt(episode) > 1
            });
          }
        }

        setMediaDetails(details);

        const streamingSources = createStreamingSources(
          mediaType,
          id,
          mediaType === 'anime' ? 1 : (season ? parseInt(season) : undefined),
          episode ? parseInt(episode) : undefined
        );

        setSources(streamingSources);
        const defaultVidking = streamingSources.find(s => s.id === 'vidking');
        if (defaultVidking) {
          setActiveSource(defaultVidking);
        }

        const bestSource = await autoSelectBestSource(
          streamingSources,
          mediaType,
          id,
          mediaType === 'anime' ? 1 : (season ? parseInt(season) : undefined),
          episode ? parseInt(episode) : undefined,
          (result: SourceTestResult) => {
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

  // Respond to episode changes
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

  // Load Anime episodes
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
  const handleSourceChange = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      setActiveSource(source);
      setError(null);
    }
  };

  const handleSourceSelect = (source: StreamingSource) => {
    setActiveSource(source);
    setError(null);
  };

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
  const goBack = () => navigate(-1);

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

  // Download handler
  const handleDownload = () => {
    if (!id) return;
    const options: { quality: string; url: string }[] = [];
    const mediaTypeForDownload: 'movie' | 'tv' = mediaType === 'anime' ? 'tv' : mediaType;
    const buildDownloadUrl = (
      mediaTypeParam: 'movie' | 'tv',
      contentId: string,
      s?: string | number,
      e?: string | number,
      quality?: string,
    ) => {
      const q = quality && quality.toLowerCase() === "4k" ? "2160p" : (quality || "1080p");
      const baseId = contentId.slice(-8);
      if (mediaTypeParam === "movie") {
        return `https://vikingf1le.us.to/f/${baseId}${q.slice(0, 2)}`;
      }
      return `https://vikingf1le.us.to/f/${baseId}S${s || "1"}E${e || "1"}${q.slice(0, 2)}`;
    };

    ["4K", "1080p", "720p"].forEach((q) => {
      options.push({
        quality: q,
        url: buildDownloadUrl(mediaTypeForDownload, id, season || '1', episode || '1', q),
      });
    });

    setDownloadOptions(options);
    setShowDownloadModal(true);
  };

  const openDownloadUrl = (url: string) => {
    window.open(url, "_blank");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: mediaDetails?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleAddToWatchlist = () => {
    console.log('Add to watchlist');
  };

  const scrollToEpisode = (episodeNum: number) => {
    if (episodeListRef.current) {
      const episodeEl = episodeListRef.current.querySelector(`[data-episode="${episodeNum}"]`);
      if (episodeEl) {
        episodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--wolzi-bg))]">
        <NavBar />
        <div className="pt-20 sm:pt-24">
          {/* Video Player Skeleton */}
          <div className="w-full max-h-[85vh] bg-black relative" style={{ aspectRatio: '16 / 9' }}>
            <Skeleton className="w-full h-full" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto">
              {/* Controls bar skeleton */}
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-10 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>

              {/* Info panel skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
                {/* Episode list skeleton */}
                <div className="lg:col-span-2">
                  <Skeleton className="h-12 w-full rounded-lg mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !activeSource) {
    return (
      <div className="min-h-screen bg-[hsl(var(--wolzi-bg))] flex items-center justify-center">
        <NavBar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="frosted-glass p-8 rounded-2xl text-center max-w-md mx-auto mt-16"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <Button onClick={goBack} className="frosted-glass border-white/20 hover:bg-white/10 text-white">
            Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--wolzi-bg))]">
      {/* Background Image - Subtle backdrop */}
      {mediaDetails?.backdropPath && (
        <div
          className="fixed inset-0 opacity-[0.03] sm:opacity-[0.05] bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${mediaDetails.backdropPath})` }}
        />
      )}

      <NavBar />

      <div className="relative z-10 pt-20 sm:pt-24">
        {/* Full-width cinematic video player */}
        <div ref={playerRef} className="w-full bg-black">
          <div className="w-full max-h-[85vh] relative" style={{ aspectRatio: '16 / 9' }}>
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
          </div>
        </div>

        {/* Content area */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Top Bar: Back button and controls */}
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowSourceSelector(!showSourceSelector)}
                  variant="ghost"
                  className="text-white hover:bg-white/10 text-sm"
                >
                  <List className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sources ({sources.length})</span>
                </Button>

                <Button
                  onClick={() => setShowInfo(!showInfo)}
                  variant="ghost"
                  className={`text-white hover:bg-white/10 ${showInfo ? 'bg-white/10' : ''}`}
                >
                  <Info className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Info</span>
                </Button>

                {(mediaType === 'tv' || mediaType === 'anime') && (
                  <Button
                    onClick={() => setShowEpisodeList(!showEpisodeList)}
                    variant="ghost"
                    className={`text-white hover:bg-white/10 ${showEpisodeList ? 'bg-white/10' : ''}`}
                  >
                    <List className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Episodes</span>
                  </Button>
                )}

                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Source Selector Panel */}
            <AnimatePresence>
              {showSourceSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
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
            </AnimatePresence>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left column: Info panel (or full width if info is hidden) */}
              <motion.div
                className={`${showInfo ? (mediaType === 'movie' || !showEpisodeList ? 'lg:col-span-3' : 'lg:col-span-1') : 'hidden'}`}
                layout
              >
                {showInfo && mediaDetails && (
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
                )}
              </motion.div>

              {/* Episode list section (for TV/Anime) */}
              {(mediaType === 'tv' || mediaType === 'anime') && showEpisodeList && (
                <motion.div
                  className={`${showInfo ? 'lg:col-span-2' : 'lg:col-span-3'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <Card className="bg-[hsl(var(--wolzi-card-bg))] border-white/10 overflow-hidden">
                    {/* Season selector for TV */}
                    {mediaType === 'tv' && tvSeasons.length > 0 && (
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold">Seasons</h3>
                          <div className="flex gap-2 flex-wrap">
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
                                className={`text-xs ${
                                  selectedSeason === s.season_number
                                    ? 'bg-[hsl(var(--wolzi-accent))] hover:bg-[hsl(var(--wolzi-accent-hover))] text-white'
                                    : 'text-white border-white/30 hover:bg-white/10'
                                }`}
                              >
                                {s.season_number}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Episode navigation */}
                    {(mediaType === 'tv' || mediaType === 'anime') && episodeInfo && (
                      <div className="p-4 border-b border-white/10 bg-black/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={goToPreviousEpisode}
                              disabled={!episodeInfo.hasPrevious}
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/10 disabled:opacity-30"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-white font-medium px-2">
                              {mediaType === 'tv'
                                ? `S${episodeInfo.seasonNumber} E${episodeInfo.episodeNumber}`
                                : `Episode ${episodeInfo.episodeNumber}`}
                            </span>
                            <Button
                              onClick={goToNextEpisode}
                              disabled={!episodeInfo.hasNext}
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/10 disabled:opacity-30"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          {episodeInfo.episodeTitle && (
                            <span className="text-white/70 text-sm hidden sm:inline">{episodeInfo.episodeTitle}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Episode list */}
                    <div ref={episodeListRef} className="max-h-[400px] overflow-y-auto p-4">
                      {mediaType === 'tv' ? (
                        episodesLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Skeleton key={i} className="h-20 w-full rounded-lg" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {seasonEpisodes.map((ep) => (
                              <div
                                key={ep.id ?? `${selectedSeason}-${ep.episode_number}`}
                                data-episode={ep.episode_number}
                                onClick={() => {
                                  navigate(`/watch/tv/${id}/${selectedSeason}/${ep.episode_number}`, { replace: true });
                                  scrollToEpisode(ep.episode_number);
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                                  episodeInfo?.episodeNumber === ep.episode_number
                                    ? 'bg-[hsl(var(--wolzi-accent))]/20 border-[hsl(var(--wolzi-accent))]/50'
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                                }`}
                              >
                                <div className="flex gap-3">
                                  {ep.still_path ? (
                                    <img
                                      src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                                      alt={ep.name}
                                      className="w-24 h-14 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-24 h-14 bg-black/50 rounded flex items-center justify-center flex-shrink-0">
                                      <span className="text-white/50 text-xs">No preview</span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium line-clamp-1">{ep.name}</p>
                                    <p className="text-white/60 text-xs mt-1">
                                      Ep {ep.episode_number}
                                      {ep.runtime && ` • ${ep.runtime}m`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        animeEpisodesLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-lg" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {animeEpisodes.map((ep) => (
                              <div
                                key={`anime-${ep.episode}`}
                                data-episode={ep.episode}
                                onClick={() => {
                                  navigate(`/watch/anime/${id}/${ep.episode}`, { replace: true });
                                  scrollToEpisode(ep.episode);
                                }}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border text-center ${
                                  episodeInfo?.episodeNumber === ep.episode
                                    ? 'bg-[hsl(var(--wolzi-accent))]/20 border-[hsl(var(--wolzi-accent))]/50'
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                                }`}
                              >
                                <p className="text-white text-sm font-medium">Ep {ep.episode}</p>
                                {ep.title && (
                                  <p className="text-white/60 text-xs mt-1 line-clamp-2">{ep.title}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="frosted-glass p-6 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Settings</h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <label className="text-white cursor-pointer">Auto-play next episode</label>
                  <input
                    type="checkbox"
                    checked={autoNextEnabled}
                    onChange={(e) => setAutoNextEnabled(e.target.checked)}
                    className="rounded w-5 h-5 cursor-pointer accent-[hsl(var(--wolzi-accent))]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <label className="text-white cursor-pointer">Disable sandbox mode</label>
                  <input
                    type="checkbox"
                    checked={disableSandbox}
                    onChange={(e) => setDisableSandbox(e.target.checked)}
                    className="rounded w-5 h-5 cursor-pointer accent-[hsl(var(--wolzi-accent))]"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDownloadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="frosted-glass p-6 rounded-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Download</h3>
                <Button
                  onClick={() => setShowDownloadModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <Download className="w-12 h-12 text-white/70 mx-auto mb-3" />
                  <p className="text-white/80 text-sm">Select a quality to download from external file hosting services.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {downloadOptions.map((opt) => (
                    <Button
                      key={opt.quality}
                      onClick={() => openDownloadUrl(opt.url)}
                      className="frosted-glass border-white/20 hover:bg-white/10 text-white py-3"
                    >
                      {opt.quality}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={() => setShowDownloadModal(false)}
                    className="frosted-glass border-white/20 hover:bg-white/10 text-white px-6"
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
