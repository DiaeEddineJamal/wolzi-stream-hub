import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { streamingSources, getStreamingUrl } from '@/integrations/api/streamingSources';
import { createStreamingSources, autoSelectBestSource, testStreamingSource, SourceTestResult } from '@/utils/sourceTestUtils';
import { StreamingSource } from './SourceSelector';

interface GlassmorphismVideoPlayerProps {
  mediaType: 'movie' | 'tv' | 'anime';
  id: string;
  title: string;
  seasonNumber?: number;
  episodeNumber?: number;
  activeSourceId?: string;
  onSourceChange?: (sourceId: string) => void;
  onError?: (error: string) => void;
}

interface SourceStatus {
  id: string;
  name: string;
  status: 'testing' | 'available' | 'unavailable' | 'active' | 'failed' | 'pending';
  url?: string;
}

export const GlassmorphismVideoPlayer: React.FC<GlassmorphismVideoPlayerProps> = ({
  mediaType,
  id,
  title,
  seasonNumber,
  episodeNumber,
  activeSourceId,
  onSourceChange,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSource, setCurrentSource] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [disableSandbox, setDisableSandbox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testingProgress, setTestingProgress] = useState<string>('');
  
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize sources and test them automatically (P-Stream approach)
  useEffect(() => {
    const initializeAndTestSources = async () => {
      setIsLoading(true);
      setError(null);
      setTestingProgress('Initializing sources...');
      
      try {
        // Create streaming sources for the current media
        const streamingSources = createStreamingSources(
          mediaType,
          id,
          seasonNumber,
          episodeNumber
        );

        // Initialize all sources as testing
        const initialSources: SourceStatus[] = streamingSources.map(source => ({
          id: source.id,
          name: source.name,
          status: 'testing' as const
        }));
        
        setSources(initialSources);
        setTestingProgress(`Testing ${streamingSources.length} sources...`);

        // Use the P-Stream approach: automatically test all sources and select the first working one
        const bestSource = await autoSelectBestSource(
          streamingSources,
          mediaType,
          id,
          seasonNumber,
          episodeNumber,
          (result: SourceTestResult) => {
            // Update source status as we test each one
            setSources(prev => prev.map(s => 
              s.id === result.source.id 
                ? { 
                    ...s, 
                    status: result.isWorking ? 'available' : 'unavailable',
                    url: result.isWorking ? result.source.url : undefined
                  }
                : s
            ));
            
            setTestingProgress(`Testing ${result.source.name}...`);
          }
        );

        if (bestSource) {
          // Found a working source - set it as active
          setCurrentSource(bestSource.id);
          setSourceUrl(bestSource.url);
          setSources(prev => prev.map(s => 
            s.id === bestSource.id 
              ? { ...s, status: 'active' }
              : s
          ));
          setTestingProgress('');
          setIsLoading(false);
          onSourceChange?.(bestSource.id);
        } else {
          // No working sources found
          setError('No streaming sources are currently available for this content.');
          setTestingProgress('No working sources found');
          setIsLoading(false);
          onError?.('No streaming sources available');
        }
      } catch (error) {
        console.error('Error during source initialization:', error);
        setError('Failed to initialize streaming sources.');
        setTestingProgress('');
        setIsLoading(false);
        onError?.('Failed to initialize sources');
      }
    };

    initializeAndTestSources();
  }, [mediaType, id, seasonNumber, episodeNumber]);

  // Handle activeSourceId changes from parent component
  useEffect(() => {
    if (activeSourceId && activeSourceId !== currentSource) {
      const source = sources.find(s => s.id === activeSourceId);
      if (source && (source.status === 'available' || source.status === 'active')) {
        handleSourceChange(activeSourceId);
      }
    }
  }, [activeSourceId, sources, currentSource]);

  // Handle manual source change
  const handleSourceChange = useCallback(async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return; // Only check if source exists, not its status

    setIsLoading(true);
    setError(null); // Clear any previous errors
    setCurrentSource(sourceId);
    
    // If source doesn't have a URL, generate it
    let sourceUrl = source.url;
    if (!sourceUrl) {
      try {
        // Create a temporary source to generate URL
        const tempSources = createStreamingSources(
          mediaType,
          id,
          seasonNumber,
          episodeNumber
        );
        const tempSource = tempSources.find(s => s.id === sourceId);
        if (tempSource?.url) {
          sourceUrl = tempSource.url;
          // Update the source with the generated URL
          setSources(prev => prev.map(s => 
            s.id === sourceId 
              ? { ...s, url: sourceUrl, status: 'active' }
              : { ...s, status: s.status === 'active' ? 'available' : s.status }
          ));
        }
      } catch (error) {
        console.error('Failed to generate URL for source:', sourceId, error);
        setError(`Failed to generate URL for ${source.name}. Please try another source.`);
        setIsLoading(false);
        return;
      }
    }
    
    if (sourceUrl) {
      setSourceUrl(sourceUrl);
      setSources(prev => prev.map(s => ({
        ...s,
        status: s.id === sourceId ? 'active' : (s.status === 'active' ? 'available' : s.status)
      })));
      
      // Small delay to ensure state updates before iframe re-renders
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      
      onSourceChange?.(sourceId);
    } else {
      setError(`Unable to load ${source.name}. Please try another source.`);
      setIsLoading(false);
    }
  }, [sources, onSourceChange, mediaType, id, seasonNumber, episodeNumber]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error with automatic fallback
  const handleIframeError = useCallback(() => {
    console.log('Iframe error detected, attempting to switch to next available source');
    
    // Mark current source as failed
    setSources(prev => prev.map(s => 
      s.id === currentSource 
        ? { ...s, status: 'failed' }
        : s
    ));
    
    // Find next available source (prioritize sources that haven't been tried yet)
    const nextSource = sources.find(s => 
      s.id !== currentSource && 
      (s.status === 'available' || s.status === 'pending' || !s.status)
    );
    
    if (nextSource) {
      console.log(`Switching to next source: ${nextSource.name}`);
      handleSourceChange(nextSource.id);
    } else {
      // If no other sources available, try to regenerate URLs for failed sources
      const failedSources = sources.filter(s => s.status === 'failed' && s.id !== currentSource);
      if (failedSources.length > 0) {
        console.log('Attempting to retry failed sources with fresh URLs');
        handleSourceChange(failedSources[0].id);
      } else {
        setError('All video sources have failed. Please try refreshing the page or check your internet connection.');
        setIsLoading(false);
      }
    }
  }, [sources, currentSource, handleSourceChange]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Add retry functionality for failed sources
  const retryCurrentSource = useCallback(() => {
    if (currentSource) {
      console.log(`Retrying current source: ${currentSource}`);
      setError(null);
      
      // Reset the source status and regenerate URL
      setSources(prev => prev.map(s => 
        s.id === currentSource 
          ? { ...s, status: 'pending', url: undefined }
          : s
      ));
      
      // Retry the source
      handleSourceChange(currentSource);
    }
  }, [currentSource, handleSourceChange]);

  // Enhanced error display with retry option
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-400 text-lg mb-4">⚠️ Playback Error</div>
          <p className="text-white/80 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryCurrentSource}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry Source
            </button>
            <button
              onClick={() => {
                const nextSource = sources.find(s => 
                  s.id !== currentSource && 
                  (s.status === 'available' || s.status === 'pending' || !s.status)
                );
                if (nextSource) {
                  handleSourceChange(nextSource.id);
                }
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Try Next Source
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Get source status icon
  const getSourceStatusIcon = (status: SourceStatus['status']) => {
    switch (status) {
      case 'testing':
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />;
      case 'available':
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-wolzi-accent rounded-full flex-shrink-0" />;
      case 'unavailable':
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-red-400 rounded-full flex-shrink-0" />;
      case 'active':
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-400 rounded-full animate-pulse flex-shrink-0" />;
      case 'failed':
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-red-600 rounded-full flex-shrink-0" />;
      case 'pending':
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-500 rounded-full animate-pulse flex-shrink-0" />;
      default:
        return <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-400 rounded-full flex-shrink-0" />;
    }
  };

  return (
    <div ref={playerRef} className="relative w-full h-full min-h-[300px] sm:min-h-[380px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px] bg-black rounded-lg sm:rounded-xl overflow-hidden max-w-full">
      {/* Glassmorphism overlay container */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20 backdrop-blur-[1px]">
        
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="frosted-glass p-8 rounded-2xl text-center"
              >
                <div className="w-16 h-16 border-4 border-wolzi-accent/30 border-t-wolzi-accent rounded-full animate-spin mb-4 mx-auto"></div>
                <h3 className="text-xl font-semibold text-white mb-2 shimmer-text">Loading Content</h3>
                <p className="text-sm text-white/70">
                  {currentSource ? `Connecting to ${sources.find(s => s.id === currentSource)?.name}...` : 'Finding best streaming source...'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error overlay */}
        <AnimatePresence>
          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20"
            >
              {renderError()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video iframe */}
        {sourceUrl && !error && (
          <iframe
            key={`${currentSource}-${sourceUrl}`} // Force re-render when source changes
            ref={iframeRef}
            src={sourceUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            {...(!disableSandbox ? {
              sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-fullscreen allow-pointer-lock"
            } : {})}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share; pointer-lock"
          />
        )}

        {/* Control overlays */}
        {!isLoading && !error && (
          <>
            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 md:p-6 bg-gradient-to-b from-black/60 via-black/20 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="frosted-glass px-2 sm:px-3 py-1 rounded-full">
                    <span className="text-xs sm:text-sm text-white font-medium">
                      {sources.find(s => s.id === currentSource)?.name || 'Loading...'}
                    </span>
                  </div>
                  {currentSource && (
                    <div className="flex items-center space-x-1">
                      {getSourceStatusIcon(sources.find(s => s.id === currentSource)?.status || 'pending')}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 frosted-glass w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] p-0 flex items-center justify-center touch-manipulation flex-shrink-0"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                </Button>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 z-30 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
              <div className="flex items-center justify-end w-auto pointer-events-auto">
                <Button
                  onClick={toggleFullscreen}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 frosted-glass w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] p-0 flex items-center justify-center touch-manipulation flex-shrink-0 max-w-[48px] max-h-[48px]"
                >
                  <Maximize className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 right-4 z-40 frosted-glass p-4 sm:p-6 rounded-2xl w-72 sm:w-80 max-h-[70vh] overflow-y-auto"
            >
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 title-glow">Player Settings</h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">Sandbox Mode</label>
                    <p className="text-xs text-white/70 mt-1">
                      Secure playback mode (recommended)
                    </p>
                  </div>
                  <Switch
                    checked={!disableSandbox}
                    onCheckedChange={(value) => {
                      setDisableSandbox(!value);
                      setIsLoading(true);
                      setTimeout(() => {
                        if (iframeRef.current) {
                          iframeRef.current.src = sourceUrl;
                        }
                      }, 100);
                    }}
                  />
                </div>
              </div>
             
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};