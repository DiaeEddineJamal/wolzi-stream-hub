import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Download, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import tmdbApi, { getPosterUrl } from "@/integrations/api/tmdb";
import {
  streamingSources,
  getStreamingUrl,
} from "@/integrations/api/streamingSources";
import jikanApi from "@/integrations/api/jikan";
import ReactPlayer from "react-player";
import {
  ArrowLeft,
  Info,
  Bookmark,
  Heart,
  Share2,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { blockServerAds } from "@/utils/server-ad-blocker";
import {
  applyAdBlockerToIframes,
  createIframeAdBlockerScript,
} from "@/utils/iframe-ad-blocker";
import MainLayout from "@/layouts/MainLayout";

type MediaType = "movie" | "tv" | "anime";

interface SourceItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  quality?: string;
  subtitles?: boolean;
}

interface SeasonInfo {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
}

const Watch: React.FC = () => {
  const { id, seasonNumber, episodeNumber } = useParams<{
    id: string;
    seasonNumber: string;
    episodeNumber: string;
  }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Add logging to debug URL parameters
  console.log(
    `Watch Component Parameters - id: ${id}, season: ${seasonNumber}, episode: ${episodeNumber}`,
  );
  console.log("Current path:", location.pathname);

  const [title, setTitle] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [sources, setSources] = useState<SourceItem[]>(streamingSources);
  const [activeSource, setActiveSource] = useState<string>("vidking");
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
  const [showNextEpisodeOverlay, setShowNextEpisodeOverlay] =
    useState<boolean>(false);
  const [countdownTime, setCountdownTime] = useState<number>(10);
  const [duration, setDuration] = useState<number>(0);
  const [hasNextEpisode, setHasNextEpisode] = useState<boolean>(false);
  const [videoEnded, setVideoEnded] = useState<boolean>(false);
  const [averageEpisodeDuration] = useState<number>(2400); // Average episode length ~40min in seconds
  const videoEndDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add fullscreen state tracking
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadOptions, setDownloadOptions] = useState<
    Array<{ quality: string; url: string }>
  >([]);
  const [customDownloadUrl, setCustomDownloadUrl] = useState<string>("");
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);

  const ALLOWED_DOWNLOAD_DOMAINS = ["protonmovies.com"];
  const isAllowedDownloadUrl = (url: string) => {
    try {
      const u = new URL(url);
      const protocolOk = ["https:", "http:"].includes(u.protocol);
      const domainOk = ALLOWED_DOWNLOAD_DOMAINS.some(
        (d) => u.hostname === d || u.hostname.endsWith(`.${d}`),
      );
      return protocolOk && domainOk;
    } catch (e) {
      return false;
    }
  };

  const triggerDirectDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noreferrer noopener";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Determine media type from URL path instead of parameter
  // Extract media type from the path: /watch/movie/... or /watch/tv/... or /watch/anime/...
  const determineMediaType = (): MediaType => {
    const path = location.pathname;
    if (path.startsWith("/watch/movie/")) return "movie";
    if (path.startsWith("/watch/tv/")) return "tv";
    if (path.startsWith("/watch/anime/")) return "anime";
    return "movie"; // Default fallback
  };

  // Get actual media type with fallback
  const actualMediaType = determineMediaType();
  console.log(`Resolved media type: ${actualMediaType}`);

  // Check if there's a next episode available
  useEffect(() => {
    if (actualMediaType === "tv" || actualMediaType === "anime") {
      const currentEp = episodeNumber ? parseInt(episodeNumber) : 1;
      const hasNext = currentEp < episodeCount;
      setHasNextEpisode(hasNext);
      console.log(
        `Has next episode: ${hasNext}, Current: ${currentEp}, Total: ${episodeCount}`,
      );
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
    if (
      autoNextEnabled &&
      hasNextEpisode &&
      (actualMediaType === "tv" || actualMediaType === "anime") &&
      !videoEnded &&
      !showNextEpisodeOverlay &&
      !isLoading &&
      sourceUrl
    ) {
      console.log("Setting up video end detection timer");

      // Clear any existing timer
      if (videoEndDetectionTimerRef.current) {
        clearTimeout(videoEndDetectionTimerRef.current);
      }

      // Set a timer to check if we should show the next episode overlay
      // Use average episode duration (40 min) minus 30 seconds for countdown
      videoEndDetectionTimerRef.current = setTimeout(
        () => {
          console.log("Video end detection timer triggered");

          // Only trigger if the user hasn't navigated away or paused
          if (
            autoNextEnabled &&
            hasNextEpisode &&
            !videoEnded &&
            !showNextEpisodeOverlay
          ) {
            console.log("Starting next episode countdown based on timer");
            setShowNextEpisodeOverlay(true);
          }
        },
        (averageEpisodeDuration - 30) * 1000,
      ); // Convert to milliseconds
    }

    return () => {
      // Clean up timer on unmount or when dependencies change
      if (videoEndDetectionTimerRef.current) {
        clearTimeout(videoEndDetectionTimerRef.current);
      }
    };
  }, [
    autoNextEnabled,
    hasNextEpisode,
    actualMediaType,
    videoEnded,
    showNextEpisodeOverlay,
    isLoading,
    sourceUrl,
  ]);

  // Add event listener for messages from iframe that might indicate video progress
  useEffect(() => {
    const handleVideoMessages = (event: MessageEvent) => {
      // Check if the message might be related to video progress
      // This is a generic approach since different players send different message formats
      try {
        if (typeof event.data === "string") {
          // Log for debugging
          if (
            event.data.includes("progress") ||
            event.data.includes("time") ||
            event.data.includes("duration") ||
            event.data.includes("end")
          ) {
            console.log("Received video-related message:", event.data);
          }

          // Check for common end signals from various players
          if (
            event.data.includes("ended") ||
            event.data.includes("complete") ||
            event.data.includes("finished") ||
            (event.data.includes("progress") && event.data.includes("1.0"))
          ) {
            console.log("Video end message detected from iframe");
            setVideoEnded(true);
            if (autoNextEnabled && hasNextEpisode && !showNextEpisodeOverlay) {
              console.log(
                "Starting next episode countdown based on iframe message",
              );
              setShowNextEpisodeOverlay(true);
            }
          }
        } else if (typeof event.data === "object" && event.data !== null) {
          // Some players send progress as an object
          const data = event.data;
          if (
            data.event === "ended" ||
            data.event === "complete" ||
            data.action === "ended" ||
            data.action === "complete" ||
            (data.progress && data.progress > 0.95)
          ) {
            console.log("Video end event detected from iframe object:", data);
            setVideoEnded(true);
            if (autoNextEnabled && hasNextEpisode && !showNextEpisodeOverlay) {
              console.log(
                "Starting next episode countdown based on iframe object",
              );
              setShowNextEpisodeOverlay(true);
            }
          }
        }
      } catch (error) {
        console.error("Error processing video message:", error);
      }
    };

    window.addEventListener("message", handleVideoMessages);
    return () => window.removeEventListener("message", handleVideoMessages);
  }, [autoNextEnabled, hasNextEpisode, showNextEpisodeOverlay]);

  // Modify the existing progress handler for ReactPlayer
  const handleProgress = ({
    playedSeconds,
    loadedSeconds,
    played,
  }: {
    playedSeconds: number;
    loadedSeconds: number;
    played: number;
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
    if (
      duration > 0 &&
      playedSeconds > 0 &&
      (playedSeconds / duration > 0.95 || played > 0.95) &&
      !showNextEpisodeOverlay &&
      hasNextEpisode &&
      autoNextEnabled
    ) {
      console.log(
        `Video nearly complete: ${playedSeconds}/${duration}, ratio: ${playedSeconds / duration}`,
      );
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
        setError("Invalid content ID");
        return;
      }

      try {
        setIsLoading(true);

        // Fetch media details from TMDB API regardless of media type
        // For anime, we'll treat it as a TV show
        const mediaTypeForApi =
          actualMediaType === "anime" ? "tv" : actualMediaType;

        try {
          const { data } =
            mediaTypeForApi === "movie"
              ? await tmdbApi.getMovieDetails(parseInt(id))
              : await tmdbApi.getTVShowDetails(parseInt(id));

          setTitle(data.title || data.name);

          // Store seasons information
          if (
            (mediaTypeForApi === "tv" || actualMediaType === "anime") &&
            data.seasons &&
            data.seasons.length > 0
          ) {
            // Filter out "Specials" which is usually season 0
            const validSeasons = data.seasons.filter(
              (season) => season.season_number > 0,
            );
            setSeasons(validSeasons);

            // Set episode count for current season
            const currentSeason = validSeasons.find(
              (season) =>
                season.season_number ===
                (seasonNumber ? parseInt(seasonNumber) : 1),
            );

            if (currentSeason && currentSeason.episode_count) {
              setEpisodeCount(currentSeason.episode_count);
            }
          }
        } catch (fetchError) {
          console.error(
            `Error fetching ${mediaTypeForApi} details:`,
            fetchError,
          );
          setError(
            `Failed to load content: ${fetchError.message || "Unknown error"}`,
          );
          return;
        }

        // Fetch user preferences if logged in
        if (user) {
          const { data } = await supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (data && data.active_streaming_source) {
            // Only use the preference if it's one of the allowed sources
            if (
              ["embedsu", "vidsrcto", "vidking"].includes(
                data.active_streaming_source,
              )
            ) {
              setActiveSource(data.active_streaming_source);
              setSources((prev) =>
                prev.map((source) => ({
                  ...source,
                  isActive: source.id === data.active_streaming_source,
                })),
              );
            } else {
              // If preference is not allowed, set default to vidking
              setActiveSource("vidking");
              setSources((prev) =>
                prev.map((source) => ({
                  ...source,
                  isActive: source.id === "vidking",
                })),
              );
            }
          }
        }

        // Check watch history
        await checkWatchHistory();

        // Set initial streaming URL
        updateStreamingUrl();
      } catch (error) {
        console.error("Error loading content:", error);
        setError("Failed to load content. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMediaDetails();
  }, [id, actualMediaType, user]);

  // Add a separate effect for when season changes
  useEffect(() => {
    if (actualMediaType === "tv" && id && seasonNumber) {
      const updateSeasonEpisodes = async () => {
        try {
          setIsLoading(true);

          // Convert seasonNumber to integer
          const seasonNumberInt = parseInt(seasonNumber);

          // Find the current season in our stored seasons
          const currentSeason = seasons.find(
            (season) => season.season_number === seasonNumberInt,
          );

          // If we have the season info already, use it
          if (currentSeason && currentSeason.episode_count) {
            setEpisodeCount(currentSeason.episode_count);
          }
          // Otherwise fetch the season info from TMDB
          else {
            const response = await fetch(
              `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumberInt}?api_key=2545dfe546bd75d5de4657e85942ecb2`,
            );
            const data = await response.json();

            if (data && data.episodes) {
              setEpisodeCount(data.episodes.length);
            }
          }

          // Update streaming URL with new season/episode
          updateStreamingUrl();
        } catch (error) {
          console.error("Error fetching season details:", error);
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
    // Only VidSrc.to needs sandbox disabled
    if (["vidsrcto"].includes(activeSource)) {
      console.log(
        `Detected ${activeSource} - disabling sandbox for better compatibility`,
      );
      setDisableSandbox(true);
    }
  }, [activeSource, id, actualMediaType, seasonNumber, episodeNumber]);

  const checkWatchHistory = async () => {
    if (!user || !id) return;

    try {
      // Convert string parameters to numbers or null for database query
      const seasonNumberInt = seasonNumber ? parseInt(seasonNumber) : null;
      const episodeNumberInt = episodeNumber ? parseInt(episodeNumber) : null;

      // @ts-ignore - Supabase types are too complex for TypeScript
      const { data, error } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_id", id)
        .eq("content_type", actualMediaType)
        .eq("season", seasonNumberInt)
        .eq("episode", episodeNumberInt)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setWatchId(data.id);
        setProgress(data.progress || 0);

        // Ask if user wants to resume
        if (data.progress > 0) {
          const minutes = Math.floor(data.progress / 60);
          const seconds = Math.floor(data.progress % 60);
          const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

          const shouldResume = window.confirm(`Resume from ${timeFormatted}?`);
          if (!shouldResume) {
            setProgress(0);
          }
        }
      }
    } catch (error) {
      console.error("Error checking watch history:", error);
    }
  };

  const updateStreamingUrl = () => {
    if (!id) return;

    // For anime storage backward compatibility
    if (actualMediaType === "anime" && title) {
      const storedTitle = localStorage.getItem(`anime_title_${id}`);
      if (!storedTitle && title) {
        localStorage.setItem(`anime_title_${id}`, title);
      }
    }

    // Choose appropriate source from available sources
    let recommendedSource = activeSource;

    // If current source is not one of the allowed ones, use vidking as fallback
    const allowedSources = streamingSources
      .filter((source) => source.isActive)
      .map((source) => source.id);
    if (!allowedSources.includes(recommendedSource)) {
      recommendedSource = "vidking";
    }

    // If the recommended source is different from active source, update it
    if (recommendedSource !== activeSource) {
      setActiveSource(recommendedSource);
      setSources((prev) =>
        prev.map((source) => ({
          ...source,
          isActive: source.id === recommendedSource,
        })),
      );
    }

    // Ensure we're passing the correct mediaType to getStreamingUrl
    // For anime, treat as TV shows
    const mediaTypeForUrl =
      actualMediaType === "anime" ? "tv" : actualMediaType;

    // Convert string parameters to numbers for the API call
    const seasonNumberInt = seasonNumber ? parseInt(seasonNumber) : undefined;
    const episodeNumberInt = episodeNumber
      ? parseInt(episodeNumber)
      : undefined;

    // Find the streaming source object
    const sourceObj = streamingSources.find((s) => s.id === recommendedSource);
    if (!sourceObj) {
      setError("Selected streaming source not found");
      return;
    }

    const url = getStreamingUrl(
      mediaTypeForUrl,
      id,
      sourceObj,
      seasonNumberInt,
      episodeNumberInt,
    );

    console.log(
      `Creating stream URL: ${url} for ${mediaTypeForUrl}/${id} - Season: ${seasonNumber || "N/A"}, Episode: ${episodeNumber || "N/A"}`,
    );
    setSourceUrl(url);
    setError(null);
    setIsLoading(true);
  };

  const handleSourceChange = async (sourceId: string) => {
    // Validate source is one of the allowed ones
    const allowedSources = streamingSources.map((source) => source.id);
    if (!allowedSources.includes(sourceId)) {
      toast({
        title: "Source not available",
        description: "This streaming source is not available",
        variant: "destructive",
      });
      return;
    }

    setActiveSource(sourceId);
    setSources((prev) =>
      prev.map((source) => ({
        ...source,
        isActive: source.id === sourceId,
      })),
    );

    // Reset any error when switching sources
    setError(null);
    setIsLoading(true);

    // Save preference if logged in
    if (user) {
      try {
        await supabase
          .from("user_preferences")
          .update({ active_streaming_source: sourceId })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error saving preference:", error);
      }
    }
  };

  const updateWatchHistory = async (seconds: number) => {
    if (!user || !id) return;

    try {
      // Get media details for history
      let posterPath = "";

      if (actualMediaType === "anime") {
        const { data } = await jikanApi.getAnimeDetails(parseInt(id));
        // For anime, we'll store the full URL as it's from Jikan API
        posterPath = data.data.images.jpg.large_image_url;
      } else {
        const { data } =
          actualMediaType === "movie"
            ? await tmdbApi.getMovieDetails(parseInt(id))
            : await tmdbApi.getTVShowDetails(parseInt(id));
        // For TMDB, store only the relative path, not the full URL
        posterPath = data.poster_path || "";
      }

      // Calculate progress percentage
      const currentDuration = duration || averageEpisodeDuration;
      const progressPercent =
        currentDuration > 0
          ? Math.min(100, Math.round((seconds / currentDuration) * 100))
          : 0;

      const watchData = {
        user_id: user.id,
        content_id: id,
        content_type: actualMediaType,
        title: title,
        poster_path: posterPath,
        progress: Math.floor(seconds),
        duration: Math.floor(currentDuration),
        progress_percent: progressPercent,
        watched_at: new Date().toISOString(),
        season:
          actualMediaType === "tv" || actualMediaType === "anime"
            ? parseInt(seasonNumber || "1")
            : null,
        episode:
          actualMediaType === "tv" || actualMediaType === "anime"
            ? parseInt(episodeNumber || "1")
            : null,
      };

      console.log("Updating watch history with data:", watchData);

      if (watchId) {
        // Update existing record
        const { error } = await supabase
          .from("watch_history")
          .update(watchData)
          .eq("id", watchId);

        if (error) {
          console.error("Error updating watch history:", error);
        }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("watch_history")
          .upsert(watchData, {
            onConflict: "user_id, content_id, content_type, season, episode",
            ignoreDuplicates: false,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Error creating watch history:", error);
        } else if (data) {
          setWatchId(data.id);
        }
      }
    } catch (error) {
      console.error("Error updating watch history:", error);
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

    const nextEp = parseInt(episodeNumber || "1") + 1;
    if (nextEp <= episodeCount) {
      setError(null);
      setIsLoading(true);
      if (actualMediaType === "tv") {
        navigate(
          `/watch/${actualMediaType}/${id}/season/${seasonNumber || "1"}/episode/${nextEp}`,
        );
      } else {
        navigate(`/watch/${actualMediaType}/${id}/episode/${nextEp}`);
      }
    }
  };

  // Download functionality is already set up with state variables at the top of the component

  // Helper: Build ProtonMovies download URL by quality
  const buildProtonMoviesDownloadUrl = (
    mediaTypeParam: MediaType,
    contentId: string,
    season?: string | number,
    episode?: string | number,
    quality?: string,
  ) => {
    const q = quality && quality.toLowerCase() === "4k" ? "2160p" : (quality || "1080p");
    if (mediaTypeParam === "movie") {
      return `https://protonmovies.com/movie/${contentId}/download?quality=${q}`;
    }
    const s = season || seasonNumber || "1";
    const e = episode || episodeNumber || "1";
    return `https://protonmovies.com/tv/${contentId}/season/${s}/episode/${e}/download?quality=${q}`;
  };

  // Function to handle download
  const handleDownload = () => {
    const options: { quality: string; url: string }[] = [];
    const mediaTypeForDownload: MediaType = actualMediaType === "anime" ? "tv" : actualMediaType;
    ["4K", "1080p", "720p"].forEach((q) => {
      options.push({
        quality: q,
        url: buildProtonMoviesDownloadUrl(
          mediaTypeForDownload,
          id,
          seasonNumber || "1",
          episodeNumber || "1",
          q,
        ),
      });
    });

    setDownloadOptions(options);
    setShowDownloadModal(true);
  };

  // Function to open download URL
  const openDownloadUrl = (url: string) => {
    window.open(url, "_blank");
  };

  // Add source availability validation
  const validateSourceAvailability = async (
    sourceId: string,
    mediaTypeParam: string,
    contentId: string,
  ) => {
    try {
      // Skip validation for sources we know will work with anime
      if (
        mediaTypeParam === "anime" &&
        ["doodstream", "megamax", "embedsu", "streamtape"].includes(sourceId)
      ) {
        return { available: true, sourceId };
      }

      // Generate test URL based on the source
      let testUrl = "";

      if (mediaTypeParam === "movie") {
        switch (sourceId) {
          case "embedsu":
            testUrl = `https://embed.su/embed/movie/${contentId}`;
            break;
          case "vidsrcto":
            testUrl = `https://vidsrc.to/embed/movie/${contentId}`;
            break;
          case "vidking":
            testUrl = `https://www.vidking.net/embed/movie/${contentId}`;
            break;
        }
      } else if (mediaTypeParam === "tv") {
        // For TV series, we'll test season 1 episode 1
        switch (sourceId) {
          case "embedsu":
            testUrl = `https://embed.su/embed/tv/${contentId}/1/1`;
            break;
          case "vidsrcto":
            testUrl = `https://vidsrc.to/embed/tv/${contentId}/1/1`;
            break;
          case "vidking":
            testUrl = `https://www.vidking.net/embed/tv/${contentId}/1/1`;
            break;
        }
      } else if (mediaTypeParam === "anime") {
        // For anime, we'll test episode 1
        switch (sourceId) {
          case "embedsu":
            // Ensure anime uses TV endpoint, not movie
            testUrl = `https://embed.su/embed/tv/${contentId}/1/1`;
            break;
          case "vidsrcto":
            testUrl = `https://vidsrc.to/embed/tv/${contentId}/1/1`;
            break;
          case "vidking":
            testUrl = `https://www.vidking.net/embed/tv/${contentId}/1/1`;
            break;
        }
      }

      // Log URL generation for debugging
      console.log(
        `Generated test URL for ${mediaTypeParam}/${contentId} on ${sourceId}: ${testUrl}`,
      );

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
            .filter((source) => source.isActive)
            .map((source) =>
              validateSourceAvailability(source.id, actualMediaType, id),
            ),
        );

        // Log availability results
        console.log("Source availability results:", sourceChecks);

        // If current source is not available, switch to an available one
        if (
          sourceChecks.some(
            (check) => !check.available && check.sourceId === activeSource,
          )
        ) {
          const availableSource = sourceChecks.find((check) => check.available);
          if (availableSource) {
            console.log(
              `Current source ${activeSource} unavailable, switching to ${availableSource.sourceId}`,
            );
            handleSourceChange(availableSource.sourceId);
          }
        }
      };

      checkSources();
    }
  }, [id, actualMediaType]);

  // Update handleIframeError to handle all sources
  const handleIframeError = (e: any) => {
    console.error("Iframe error:", e);
    console.error(
      `Iframe error details - mediaType: ${actualMediaType}, ID: ${id}, Season: ${seasonNumber || "N/A"}, Episode: ${episodeNumber || "N/A"}, Source: ${activeSource}`,
    );
    console.error(`URL that caused error: ${sourceUrl}`);

    // Generic error
    setError(
      `Failed to load content from ${activeSource}. Trying another source...`,
    );

    // Auto-switch to another source after delay
    setTimeout(() => {
      // Get available sources excluding the current one
      const availableSources = sources
        .filter((source) => source.isActive && source.id !== activeSource)
        .map((source) => source.id);

      // Pick a random alternative source
      const newSource =
        availableSources.length > 0
          ? availableSources[
              Math.floor(Math.random() * availableSources.length)
            ]
          : "vidking"; // Fallback

      handleSourceChange(newSource);
    }, 3000);
  };

  // Update the handle404Error function to handle all sources
  const handle404Error = (sourceId: string) => {
    console.error(
      `404 Error detected for source: ${sourceId}, URL: ${sourceUrl}`,
    );
    console.error(
      `404 Error details - mediaType: ${actualMediaType}, ID: ${id}, Season: ${seasonNumber || "N/A"}, Episode: ${episodeNumber || "N/A"}`,
    );

    setError(`Content not found on ${sourceId}. Trying another source...`);

    // Automatically switch to another source after 3 seconds
    setTimeout(() => {
      // Get available sources excluding the current one
      const availableSources = sources
        .filter((source) => source.isActive && source.id !== sourceId)
        .map((source) => source.id);

      // Pick a random alternative source
      const newSource =
        availableSources.length > 0
          ? availableSources[
              Math.floor(Math.random() * availableSources.length)
            ]
          : "vidking"; // Fallback

      handleSourceChange(newSource);
    }, 3000);
  };

  // Update useEffect to add event listener for error messages
  useEffect(() => {
    // Listen for error messages from the iframe (especially from VidSrc.to)
    const handleMessageEvent = (event: MessageEvent) => {
      // Check if the message contains error information
      if (typeof event.data === "string" && event.data.includes("error")) {
        console.log("Received error message from iframe:", event.data);

        // Check for specific VidSrc.to errors
        if (
          event.data.includes("ManifestLoadError") ||
          event.data.includes("networkError")
        ) {
          console.log("VidSrc.to manifest or network error detected");
          setVidsrcNetworkError(true);

          // Show helpful error and offer to try another source
          setError(
            `Network error loading content from ${activeSource}. This may be due to region restrictions or server issues.`,
          );

          // Auto-switch to another source after a short delay
          setTimeout(() => {
            // Get available sources excluding the current one
            const availableSources = sources
              .filter((source) => source.isActive && source.id !== activeSource)
              .map((source) => source.id);

            // Pick a random alternative source
            const alternativeSource =
              availableSources.length > 0
                ? availableSources[
                    Math.floor(Math.random() * availableSources.length)
                  ]
                : "vidking"; // Fallback

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

    window.addEventListener("message", handleMessageEvent);
    return () => window.removeEventListener("message", handleMessageEvent);
  }, [activeSource]);

  // Update fullscreen helper function to toggle between enter and exit
  const toggleFullscreen = () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const iframe = document.querySelector("iframe");
        if (iframe) {
          // Try to access the iframe content directly (will work only for same-origin content)
          try {
            if (
              iframe.contentDocument &&
              iframe.contentDocument.documentElement
            ) {
              const iframeDoc = iframe.contentDocument.documentElement;
              if (iframeDoc.requestFullscreen) {
                iframeDoc.requestFullscreen();
              } else if ((iframeDoc as any).webkitRequestFullscreen) {
                (iframeDoc as any).webkitRequestFullscreen();
              } else if ((iframeDoc as any).mozRequestFullScreen) {
                (iframeDoc as any).mozRequestFullScreen();
              } else if ((iframeDoc as any).msRequestFullscreen) {
                (iframeDoc as any).msRequestFullscreen();
              }
            }
          } catch (error) {
            console.log(
              "Direct access to iframe content failed, trying iframe element",
              error,
            );
          }

          // If direct access fails, try the iframe element itself
          if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
          } else if ((iframe as any).webkitRequestFullscreen) {
            (iframe as any).webkitRequestFullscreen();
          } else if ((iframe as any).mozRequestFullScreen) {
            (iframe as any).mozRequestFullScreen();
          } else if ((iframe as any).msRequestFullscreen) {
            (iframe as any).msRequestFullscreen();
          }
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        ),
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Modify the handleIframeLoad function to apply ad blocking
  const handleIframeLoad = () => {
    console.log("Iframe loaded successfully");

    // Reset the VidSrc.to network error state
    setVidsrcNetworkError(false);

    // Apply ad blocking to the iframe
    try {
      const iframe = document.querySelector("iframe");
      if (iframe && iframe.contentWindow) {
        // Try to inject the ad blocker script directly
        try {
          if (iframe.contentDocument && iframe.contentDocument.head) {
            const script = document.createElement("script");
            script.textContent = createIframeAdBlockerScript();
            iframe.contentDocument.head.appendChild(script);
            console.log("Successfully injected ad blocker script into iframe");
          }
        } catch (e) {
          // Cross-origin restrictions prevent direct access
          console.log(
            "Cross-origin restrictions prevented direct script injection",
          );

          // Use message passing to communicate with the iframe
          iframe.contentWindow.postMessage("run-ad-blocker", "*");
        }

        // Send a message to the iframe asking for video events
        // This won't work with all players due to CORS, but worth trying
        iframe.contentWindow.postMessage(
          {
            action: "listenForVideoEvents",
            requestProgress: true,
          },
          "*",
        );

        // Add a timeout to ensure loading state is cleared even if the iframe doesn't fully load
        setTimeout(() => {
          if (isLoading) {
            console.log("Forcing loading state to complete after timeout");
            setIsLoading(false);
          }
        }, 5000);
      }
    } catch (error) {
      console.log("Error communicating with iframe:", error);
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
      if (
        typeof event.data === "string" &&
        (event.data.includes("[vite] connecting") ||
          event.data.includes("[vite] connected"))
      ) {
        console.log("Vite HMR connection message received:", event.data);

        // If we're seeing connection issues with the iframe loaded, try to prevent interference
        if (!isLoading && document.querySelector("iframe")) {
          console.log("Isolating Vite HMR from iframe content");
          // No action needed, just log the event for debugging
        }
      }
    };

    window.addEventListener("message", handleViteHMRMessage);
    return () => window.removeEventListener("message", handleViteHMRMessage);
  }, [isLoading]);

  // Add a new effect to get anime title from local storage or fetch it if needed
  useEffect(() => {
    // For anime, we need to ensure we have the title stored for URL generation
    if (actualMediaType === "anime" && id) {
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
            console.error("Error fetching anime title:", error);
          }
        };

        fetchAnimeTitle();
      } else if (storedTitle) {
        // Use the stored title if available
        setTitle(storedTitle);
      }
    }
  }, [actualMediaType, id]);

  // Add event listener for fullscreen-related messages from the iframe
  useEffect(() => {
    const handleFullscreenMessages = (event: MessageEvent) => {
      // Check if the message might be related to fullscreen requests
      try {
        // Some players send 'requestFullscreen' messages
        if (
          typeof event.data === "string" &&
          (event.data.includes("fullscreen") ||
            event.data.includes("Fullscreen"))
        ) {
          console.log("Received fullscreen-related message:", event.data);
          // Try to trigger fullscreen
          toggleFullscreen();
        } else if (typeof event.data === "object" && event.data !== null) {
          // Some players use objects for their messages
          const data = event.data;
          if (
            data.type === "fullscreen" ||
            data.action === "fullscreen" ||
            data.command === "fullscreen"
          ) {
            console.log("Received fullscreen request via object:", data);
            toggleFullscreen();
          }
        }
      } catch (error) {
        console.error("Error processing fullscreen message:", error);
      }
    };

    window.addEventListener("message", handleFullscreenMessages);
    return () =>
      window.removeEventListener("message", handleFullscreenMessages);
  }, []);

  // Add a separate effect to handle keyboard shortcuts for fullscreen (F key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F key for fullscreen
      if (e.key === "f" || e.key === "F") {
        console.log("F key pressed, attempting fullscreen");
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black text-white">
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

      {/* Media Controls Bar - Always visible for all media types */}
      <div className="bg-black/70 backdrop-blur-lg px-4 py-4 border-b border-purple-400/20 shadow-md">
      </div>
          <div className="flex flex-wrap items-center gap-4 max-w-5xl mx-auto">
            {/* Server Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-white font-medium text-sm">Server:</label>
              <div className="relative">
                <select
                  className="px-4 py-2 rounded-md bg-black/60 backdrop-blur-md border border-purple-400/40 text-white appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500 transition-all duration-200 hover:bg-black/80 min-w-[130px]"
                  value={activeSource}
                  onChange={(e) => {
                    setError(null);
                    setIsLoading(true);
                    handleSourceChange(e.target.value);
                  }}
                >
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-purple-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-grow"></div>

            {/* Download and Settings Buttons - Always visible */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-black/40 border-purple-500/60 hover:bg-black/80 transition-all duration-200 text-white hover:text-purple-400"
                onClick={() => handleDownload()}
              >
                <Download size={14} className="mr-1" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-black/40 border-purple-500/60 hover:bg-black/80 transition-all duration-200 text-white hover:text-purple-400"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={14} className="mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Season and Episode Selection - Only for TV shows and anime */}
        {(actualMediaType === "tv" || actualMediaType === "anime") && (
          <div className="bg-black/70 backdrop-blur-lg px-4 py-4 border-b border-purple-400/20 shadow-md">
            <div className="flex flex-wrap items-center gap-4 max-w-5xl mx-auto">
              {actualMediaType === "tv" && (
                <div className="flex items-center space-x-2">
                  <label className="text-white font-medium text-sm">
                    Season:
                  </label>
                  <div className="relative">
                    <select
                      className="px-4 py-2 rounded-md bg-black/60 backdrop-blur-md border border-purple-400/40 text-white appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500 transition-all duration-200 hover:bg-black/80 min-w-[120px]"
                      value={seasonNumber || "1"}
                      onChange={(e) => {
                        setError(null);
                        setIsLoading(true);
                        navigate(
                          `/watch/${actualMediaType}/${id}/season/${e.target.value}/episode/1`,
                        );
                      }}
                    >
                      {seasons.length > 0
                        ? seasons.map((season) => (
                            <option
                              key={season.id}
                              value={season.season_number}
                            >
                              {season.name}
                            </option>
                          ))
                        : Array.from({ length: 10 }, (_, i) => i + 1).map(
                            (num) => (
                              <option key={num} value={num}>
                                Season {num}
                              </option>
                            ),
                          )}
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-purple-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <label className="text-white font-medium text-sm">
                  Episode:
                </label>
                <div className="relative">
                  <select
                    className="px-4 py-2 rounded-md bg-black/60 backdrop-blur-md border border-purple-400/40 text-white appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500 transition-all duration-200 hover:bg-black/80 min-w-[120px]"
                    value={episodeNumber || "1"}
                    onChange={(e) => {
                      setError(null);
                      setIsLoading(true);
                      if (actualMediaType === "tv") {
                        navigate(
                          `/watch/${actualMediaType}/${id}/season/${seasonNumber || "1"}/episode/${e.target.value}`,
                        );
                      } else {
                        navigate(
                          `/watch/${actualMediaType}/${id}/episode/${e.target.value}`,
                        );
                      }
                    }}
                  >
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map(
                      (epNum) => (
                        <option key={epNum} value={epNum}>
                          Episode {epNum}
                        </option>
                      ),
                    )}
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none text-purple-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex-grow"></div>

              {/* Removed server selection and download/settings buttons as they're now in the Media Controls Bar */}
            </div>

            {/* Episode Navigation Quick Access Buttons */}
            <div className="flex items-center gap-2 mt-4 max-w-5xl mx-auto">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-purple-400 hover:bg-purple-500/10 flex items-center"
                disabled={parseInt(episodeNumber || "1") <= 1}
                onClick={() => {
                  const currentEpisode = parseInt(episodeNumber || "1");
                  const currentSeason = parseInt(seasonNumber || "1");
                  const prevEp = currentEpisode - 1;
                  if (prevEp >= 1) {
                    setError(null);
                    setIsLoading(true);
                    if (actualMediaType === "tv") {
                      navigate(
                        `/watch/${actualMediaType}/${id}/season/${currentSeason}/episode/${prevEp}`,
                      );
                    } else {
                      navigate(
                        `/watch/${actualMediaType}/${id}/episode/${prevEp}`,
                      );
                    }
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Previous
              </Button>

              <div className="flex-grow flex justify-center">
                <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-sm text-white flex items-center border border-purple-400/30">
                  {actualMediaType === "tv" ? (
                    <span>
                      S{seasonNumber || "1"} · E{episodeNumber || "1"}
                    </span>
                  ) : (
                    <span>Episode {episodeNumber || "1"}</span>
                  )}
                </div>
    </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-purple-400 hover:bg-purple-500/10 flex items-center"
                disabled={parseInt(episodeNumber || "1") >= episodeCount}
                onClick={() => {
                  const currentEpisode = parseInt(episodeNumber || "1");
                  const currentSeason = parseInt(seasonNumber || "1");
                  const nextEp = currentEpisode + 1;
                  if (nextEp <= episodeCount) {
                    setError(null);
                    setIsLoading(true);
                    if (actualMediaType === "tv") {
                      navigate(
                        `/watch/${actualMediaType}/${id}/season/${currentSeason}/episode/${nextEp}`,
                      );
                    } else {
                      navigate(
                        `/watch/${actualMediaType}/${id}/episode/${nextEp}`,
                      );
                    }
                  }
                }}
              >
                Next
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-wolzi-bg border border-purple-400/30 rounded-lg shadow-xl p-5 max-w-md w-full mx-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  Download Options
                </h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-wolzi-light-gray hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-wolzi-light-gray mb-2">
                  {actualMediaType === "tv" || actualMediaType === "anime"
                    ? `${title} - Season ${seasonNumber || "1"}, Episode ${episodeNumber || "1"}`
                    : title}
                </p>
                <p className="text-xs text-wolzi-light-gray/70 mb-4">
                  Select a quality to download via ProtonMovies
                </p>
              </div>

              <div className="space-y-2">
                {downloadOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => openDownloadUrl(option.url)}
                    className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-purple-500/20 border border-purple-400/30 rounded-md text-white transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <Download size={16} className="mr-2 text-purple-400" />
                      <span>{option.quality}</span>
                    </div>
                    <ExternalLink size={14} className="text-wolzi-light-gray" />
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-purple-400/20">
                <label className="text-xs text-wolzi-light-gray block mb-2">
                  Paste authorized direct link
                </label>
                <input
                  type="url"
                  value={customDownloadUrl}
                  onChange={(e) => {
                    setCustomDownloadUrl(e.target.value);
                    setCustomUrlError(null);
                  }}
                  placeholder="https://protonmovies.com/path/to/direct-download"
                  className="w-full px-3 py-2 rounded-md bg-black/40 backdrop-blur-md border border-wolzi-gray/30 text-white placeholder:text-wolzi-light-gray/60 focus:ring-2 focus:ring-wolzi-accent/50 focus:border-wolzi-accent outline-none"
                />
                {customUrlError && (
                  <p className="mt-2 text-xs text-red-400">{customUrlError}</p>
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-wolzi-accent/80 hover:bg-wolzi-accent text-white"
                    onClick={() => {
                      if (isAllowedDownloadUrl(customDownloadUrl)) {
                        triggerDirectDownload(customDownloadUrl);
                        setShowDownloadModal(false);
                      } else {
                        setCustomUrlError(
                          "Only direct links from authorized domains are allowed.",
                        );
                      }
                    }}
                  >
                    Download from URL
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-wolzi-light-gray/70">
                  Allowed domain: protonmovies.com
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-wolzi-accent/20">
                <p className="text-xs text-wolzi-light-gray/70">
                  Note: Download speeds may vary based on server load and your
                  internet connection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        <div
          className="flex-1 flex items-center justify-center bg-wolzi-dark-gray relative"
          style={{ minHeight: "80vh" }}
        >
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
                  <p className="text-lg font-medium text-wolzi-light-gray">
                    LOADING CONTENT...
                  </p>
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
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 300, damping: 25 },
                }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-4 right-4 z-30 bg-black/80 border border-wolzi-accent/30 rounded-lg shadow-lg p-5 w-80"
              >
                <h3 className="text-sm font-medium mb-4 text-white">
                  Player Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-white font-medium">
                        Sandbox Mode
                      </label>
                      <p className="text-xs text-white/70 mt-1">
                        Enables secure playback (recommended). Disable only if
                        videos don't load.
                      </p>
                    </div>
                    <Switch
                      checked={!disableSandbox}
                      onCheckedChange={(value) => {
                        setDisableSandbox(!value);
                        setIsLoading(true);
                        // Force reload with new settings
                        const currentUrl = sourceUrl;
                        setSourceUrl("");
                        setTimeout(() => setSourceUrl(currentUrl), 50);
                      }}
                    />
                  </div>

                  {/* Add auto next episode setting */}
                  {(actualMediaType === "tv" ||
                    actualMediaType === "anime") && (
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm text-white font-medium">
                          Auto-Play Next Episode
                        </label>
                        <p className="text-xs text-white/70 mt-1">
                          Automatically play the next episode when the current
                          one ends.
                        </p>
                      </div>
                      <Switch
                        checked={autoNextEnabled}
                        onCheckedChange={(value) => {
                          setAutoNextEnabled(value);
                          if (
                            value &&
                            showNextEpisodeOverlay &&
                            !hasNextEpisode
                          ) {
                            setShowNextEpisodeOverlay(false);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Source selection */}
                  <div className="space-y-3 pt-3 border-t border-wolzi-accent/20">
                    <h4 className="text-sm text-white font-medium">
                      Streaming Source
                    </h4>

                    <div className="bg-black/50 rounded p-3 border border-wolzi-accent/20">
                      <p className="text-xs text-white/90 mb-2">
                        Available sources:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((source) => (
                          <Button
                            key={source.id}
                            size="sm"
                            variant={
                              activeSource === source.id ? "default" : "outline"
                            }
                            className={`text-xs ${activeSource === source.id ? "bg-wolzi-accent hover:bg-wolzi-accent/80" : "border-wolzi-accent/30 hover:bg-wolzi-accent/10"}`}
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
                    {activeSource === "vidsrcto" && (
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm text-white font-medium">
                            VidSrc.to Options
                          </label>
                          <p className="text-xs text-white/70 mt-1">
                            If experiencing network errors, try reloading or
                            using a different source.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-wolzi-accent/40 hover:bg-wolzi-accent/10 text-white"
                          onClick={() => {
                            setIsLoading(true);
                            // Force reload the iframe
                            const currentUrl = sourceUrl;
                            setSourceUrl("");
                            setTimeout(() => setSourceUrl(currentUrl), 50);
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-wolzi-accent/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/70">
                          Current Server:{" "}
                          <span className="text-wolzi-accent font-medium">
                            {activeSource}
                          </span>
                        </p>
                        <p className="text-xs text-white/70 mt-1">
                          Sandbox Mode:{" "}
                          <span
                            className={
                              disableSandbox ? "text-red-400" : "text-wolzi-accent"
                            }
                          >
                            {disableSandbox ? "Disabled" : "Enabled"}
                          </span>
                        </p>
                        {(actualMediaType === "tv" ||
                          actualMediaType === "anime") && (
                          <p className="text-xs text-white/70 mt-1">
                            Auto-Play:{" "}
                            <span
                              className={
                                autoNextEnabled
                                  ? "text-wolzi-accent"
                                  : "text-red-400"
                              }
                            >
                              {autoNextEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </p>
                        )}

                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-wolzi-accent/40 hover:bg-wolzi-accent/10 text-white"
                        onClick={() => setShowSettings(false)}
                      >
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

              {activeSource === "vidsrcto" && vidsrcNetworkError && (
                <div className="mb-4 p-3 bg-black/50 rounded-lg border border-red-500/30">
                  <p className="text-sm text-red-400">
                    VidSrc.to is experiencing network issues. This may be due
                    to:
                  </p>
                  <ul className="text-sm text-white/80 list-disc list-inside mt-2">
                    <li>Region restrictions</li>
                    <li>Server maintenance</li>
                    <li>Content not available</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  onClick={goBack}
                  variant="outline"
                  className="border-wolzi-accent/40"
                >
                  Go Back
                </Button>

                {activeSource === "vidsrcto" && vidsrcNetworkError && (
                  <Button
                    onClick={() => {
                      const alternativeSources = sources.filter(
                        (s) =>
                          s.id !== activeSource &&
                          ["embedsu", "vidking"].includes(s.id)
                      );

                      if (alternativeSources.length > 0) {
                        handleSourceChange(alternativeSources[0].id);
                      }
                    }}
                    variant="default"
                    className="bg-wolzi-accent hover:bg-wolzi-accent/90"
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
                  style={{ aspectRatio: "16/9" }}
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
                      {...(!disableSandbox
                        ? {
                            sandbox:
                              "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-fullscreen allow-pointer-lock",
                          }
                        : {})}
                      allow="fullscreen; autoplay; web-share; picture-in-picture; encrypted-media; clipboard-write; pointer-lock"
                      referrerPolicy="no-referrer"
                      loading="eager"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        minHeight: "80vh",
                        backgroundColor: "#000",
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
                        setError(
                          "Failed to load video from this source. Please try another server.",
                        );
                      }}
                      config={{
                        file: {
                          attributes: {
                            crossOrigin: "anonymous",
                            sandbox: "allow-same-origin allow-scripts",
                            referrerPolicy: "no-referrer",
                          },
                          forceVideo: true,
                        },
                        youtube: {
                          playerVars: {
                            modestbranding: 1,
                            origin: window.location.origin,
                          },
                        },
                      }}
                      style={{ backgroundColor: "#000", minHeight: "75vh" }}
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

                  {/* Download Button */}
                  {useIframe && !isLoading && (
                    <div
                      className="absolute bottom-10 right-24 z-20 bg-black/60 backdrop-blur-sm rounded-full p-2 cursor-pointer hover:bg-black/80 transition-all duration-200"
                      onClick={handleDownload}
                      title="Download Content"
                    >
                      <Download className="text-white" size={20} />
                    </div>
                  )}

                  {/* Next Episode Overlay */}
                  <AnimatePresence>
                    {showNextEpisodeOverlay && hasNextEpisode && (
                      <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          },
                        }}
                        exit={{ opacity: 0, y: 100 }}
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8 z-30"
                      >
                        <div className="max-w-3xl mx-auto">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-white">
                                Up Next
                              </h3>
                              <p className="text-wolzi-accent mt-1">
                                {actualMediaType === "tv"
                                  ? `S${seasonNumber || "1"} · E${parseInt(episodeNumber || "1") + 1}`
                                  : `Episode ${parseInt(episodeNumber || "1") + 1}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="bg-black/60 backdrop-blur-md border border-wolzi-accent/30 px-4 py-2 rounded-full flex items-center">
                                <svg viewBox="0 0 36 36" className="w-5 h-5 text-wolzi-accent">
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
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray="100"
                                    strokeDashoffset={
                                      100 - ((10 - countdownTime) / 10) * 100
                                    }
                                  />
                                </svg>
                                <span className="ml-2 text-lg font-medium">
                                  {countdownTime}
                                </span>
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
                                className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300"
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

        {/* Download Modal */}
        <AnimatePresence>
          {showDownloadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-wolzi-dark-gray rounded-lg max-w-md w-full p-6 border border-wolzi-accent/30"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Download {title}</h3>
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="text-wolzi-light-gray hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-wolzi-light-gray mb-2">
                    Select your preferred quality to download:
                  </p>

                  <div className="space-y-2 mt-4">
                    {downloadOptions.map((option, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-wolzi-bg p-4 rounded-lg border border-wolzi-gray/30 hover:border-wolzi-accent/50 cursor-pointer transition-all"
                        onClick={() => openDownloadUrl(option.url)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Download
                              size={18}
                              className="text-wolzi-accent mr-2"
                            />
                            <span>{option.quality}</span>
                          </div>
                          <ExternalLink
                            size={16}
                            className="text-wolzi-light-gray"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 pt-3 border-t border-wolzi-accent/20">
                  <label className="text-xs text-wolzi-light-gray block mb-2">
                    Paste authorized direct link
                  </label>
                  <input
                    type="url"
                    value={customDownloadUrl}
                    onChange={(e) => {
                      setCustomDownloadUrl(e.target.value);
                      setCustomUrlError(null);
                    }}
                    placeholder="https://protonmovies.com/path/to/direct-download"
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-wolzi-gray/30 text-white placeholder:text-wolzi-light-gray/60 focus:ring-2 focus:ring-wolzi-accent/50 focus:border-wolzi-accent outline-none"
                  />
                  {customUrlError && (
                    <p className="mt-2 text-xs text-red-400">{customUrlError}</p>
                  )}
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-wolzi-accent/80 hover:bg-wolzi-accent text-white"
                      onClick={() => {
                        if (isAllowedDownloadUrl(customDownloadUrl)) {
                          triggerDirectDownload(customDownloadUrl);
                          setShowDownloadModal(false);
                        } else {
                          setCustomUrlError(
                            "Only direct links from authorized domains are allowed.",
                          );
                        }
                      }}
                    >
                      Download from URL
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-wolzi-light-gray/70">
                    Allowed domain: protonmovies.com
                  </p>
                </div>

                <div className="text-xs text-wolzi-light-gray bg-wolzi-bg p-3 rounded-md">
                  <p className="flex items-center">
                    <Info size={14} className="mr-2 text-wolzi-accent" />
                    Downloads are provided by external sources and may require
                    additional steps to complete.
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDownloadModal(false)}
                    className="border-wolzi-gray/30 hover:bg-wolzi-gray/20"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Sources */}
        <div className="bg-wolzi-bg p-4">
          <h2 className="text-lg font-medium mb-4">Video Sources</h2>
          <p className="text-sm text-wolzi-light-gray mb-4">
            Select your preferred streaming source
          </p>

          <div className="space-y-6">
            {/* Primary Sources */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-wolzi-light-gray">
                Available Sources
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sources.map((source) => (
                  <motion.div
                    key={source.id}
                    whileHover={{
                      y: -4,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      p-4 rounded-lg cursor-pointer border transition-all
                      ${
                        source.isActive
                          ? "bg-gradient-to-br from-wolzi-accent to-wolzi-accent/80 text-white border-wolzi-accent shadow-lg shadow-wolzi-accent/20"
                          : "bg-wolzi-dark-gray/70 backdrop-blur-sm border-wolzi-gray/30 hover:bg-wolzi-dark-gray text-white"
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
                          <span
                            className={`
                            ${source.id === "embedsu" ? "bg-blue-500/80" : ""}
                            ${source.id === "vidsrcto" ? "bg-wolzi-accent/80" : ""}
                            text-white text-xs px-1.5 py-0.5 rounded-full
                          `}
                          >
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
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                source.id === "embedsu"
                                  ? "bg-blue-400"
                                : source.id === "vidsrcto"
                                  ? "bg-wolzi-accent"
                                  : ""
                              }`}
                            ></span>
                            {source.description?.split(" ")[0] || "Quality"} streams
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
                <span className="inline-block w-2 h-2 rounded-full bg-wolzi-accent mr-2"></span>
                <span>
                  All sources offer high quality streaming for movies, TV
                  series, and anime
                </span>
              </p>
            </div>

            <p className="mb-1 font-medium">Source compatibility:</p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>
                <span className="font-medium text-blue-400">Embed.su</span>:
                Premium quality streams with reliable HD playback
              </li>
              <li>
                <span className="font-medium text-wolzi-accent">VidSrc.to</span>:
                Fast loading streams with good quality and minimal buffering
              </li>
            </ul>
          </div>
        </div>
      </div>
      
  );
};

export default Watch;
