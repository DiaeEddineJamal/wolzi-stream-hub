import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward,
  Settings,
  Download,
  Share2,
  Heart,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface VideoPlayerControlsProps {
  isPlaying?: boolean;
  isMuted?: boolean;
  volume?: number;
  currentTime?: number;
  duration?: number;
  isFullscreen?: boolean;
  isLoading?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  showControls?: boolean;
  autoHideDelay?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onVolumeChange?: (volume: number) => void;
  onMute?: () => void;
  onSeek?: (time: number) => void;
  onFullscreen?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onAddToWatchlist?: () => void;
  onSettings?: () => void;
  onReload?: () => void;
}

export const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying = false,
  isMuted = false,
  volume = 100,
  currentTime = 0,
  duration = 0,
  isFullscreen = false,
  isLoading = false,
  canGoNext = false,
  canGoPrevious = false,
  showControls = true,
  autoHideDelay = 3000,
  onPlay,
  onPause,
  onVolumeChange,
  onMute,
  onSeek,
  onFullscreen,
  onNext,
  onPrevious,
  onDownload,
  onShare,
  onAddToWatchlist,
  onSettings,
  onReload
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    if (!showControls) {
      setControlsVisible(false);
      return;
    }

    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setControlsVisible(true);
      timeout = setTimeout(() => {
        if (!isDragging && isPlaying) {
          setControlsVisible(false);
        }
      }, autoHideDelay);
    };

    resetTimeout();

    const handleMouseMove = () => resetTimeout();
    const handleTouchStart = () => resetTimeout();
    const handleMouseLeave = () => {
      if (!isDragging && isPlaying) {
        setControlsVisible(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart, { passive: true } as EventListenerOptions);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart as EventListener);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showControls, isDragging, isPlaying, autoHideDelay]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    onSeek?.(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    onVolumeChange?.(value[0]);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {controlsVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-0 left-0 right-0 z-[70] pointer-events-auto video-player-controls"
          style={{ overflow: 'visible' }}
        >
          {/* Progress Bar (hidden here - moved inside main controls to prevent overlap) */}
          <div className="hidden" />

          {/* Main Controls */}
          <div className="frosted-glass-strong backdrop-blur-xl bg-black/40 border-t border-white/10 pointer-events-auto relative z-30" style={{ overflow: 'visible', marginTop: '0', isolation: 'isolate', position: 'relative' }}>
            {/* Progress Bar INSIDE controls (prevents any overlap) */}
            <div className="px-3 sm:px-4 md:px-6 pt-2">
              <div className="relative">
                <Slider
                  value={[progressPercentage]}
                  onValueChange={handleProgressChange}
                  onValueCommit={() => setIsDragging(false)}
                  onPointerDown={() => setIsDragging(true)}
                  className="w-full cursor-pointer touch-manipulation py-2"
                  max={100}
                  step={0.1}
                />
                <div className="flex justify-between text-xs sm:text-sm text-white/70 mt-1 select-none">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 pointer-events-auto" style={{ overflow: 'visible', position: 'relative', zIndex: 40 }}>
              {/* Left Controls */}
              <div className="flex items-center space-x-2 sm:space-x-3 pointer-events-auto" style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}>
                {/* Previous Episode */}
                <Button
                  aria-label="Previous episode"
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 disabled:opacity-50 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Skip Back */}
                <Button
                  aria-label="Skip back 10 seconds"
                  onClick={() => onSeek?.(Math.max(0, currentTime - 10))}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SkipBack className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Play/Pause */}
                <Button
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  onClick={isPlaying ? onPause : onPlay}
                  size="lg"
                  className="frosted-glass border-white/20 hover:bg-white/10 active:bg-white/20 text-white !w-[64px] !h-[64px] sm:!w-[72px] sm:!h-[72px] md:!w-[80px] md:!h-[80px] !p-0 !m-0 !min-w-[64px] !min-h-[64px] sm:!min-w-[72px] sm:!min-h-[72px] md:!min-w-[80px] md:!min-h-[80px] !leading-none rounded-full touch-manipulation active:scale-95 transition-all duration-150 select-none flex items-center justify-center flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 animate-spin flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                  ) : (
                    <Play className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 pointer-events-none" style={{ margin: '0', marginLeft: '2px' }} />
                  )}
                </Button>

                {/* Skip Forward */}
                <Button
                  aria-label="Skip forward 10 seconds"
                  onClick={() => onSeek?.(Math.min(duration, currentTime + 10))}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SkipForward className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Next Episode */}
                <Button
                  aria-label="Next episode"
                  onClick={onNext}
                  disabled={!canGoNext}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 disabled:opacity-50 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronRight className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Volume Controls */}
                <div 
                  className="hidden sm:flex items-center space-x-2"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <Button
                    aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                    onClick={onMute}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                    style={{ 
                      pointerEvents: 'auto',
                      boxSizing: 'border-box',
                      lineHeight: '1',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      position: 'relative',
                      zIndex: 60,
                      padding: '0',
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                    ) : (
                      <Volume2 className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                    )}
                  </Button>
                  
                  <AnimatePresence>
                    {showVolumeSlider && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 80 }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden"
                      >
                        <Slider
                          value={[volume]}
                          onValueChange={handleVolumeChange}
                          className="w-24 touch-manipulation py-2"
                          max={100}
                          step={1}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time Display - Hidden on mobile to save space */}
                <div className="hidden md:block glass-card px-2 sm:px-3 py-1 rounded-full">
                  <span className="text-xs sm:text-sm text-white font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2 pointer-events-auto" style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}>
                {/* Reload */}
                <Button
                  aria-label="Reload player"
                  onClick={onReload}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RotateCcw className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Download - Hidden on mobile */}
                <Button
                  aria-label="Download video"
                  onClick={onDownload}
                  size="sm"
                  variant="ghost"
                  className="hidden sm:flex text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Download className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Add to Watchlist - Hidden on mobile */}
                <Button
                  aria-label="Add to watchlist"
                  onClick={onAddToWatchlist}
                  size="sm"
                  variant="ghost"
                  className="hidden sm:flex text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Heart className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Share - Hidden on mobile */}
                <Button
                  aria-label="Share"
                  onClick={onShare}
                  size="sm"
                  variant="ghost"
                  className="hidden sm:flex text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Share2 className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Settings */}
                <Button
                  aria-label="Settings"
                  onClick={onSettings}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Settings className="w-5 h-5 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                </Button>

                {/* Fullscreen */}
                <Button
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  onClick={onFullscreen}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150 !w-[48px] !h-[48px] sm:!w-[48px] sm:!h-[48px] !p-0 !m-0 !min-w-[48px] !min-h-[48px] sm:!min-w-[48px] sm:!min-h-[48px] !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer relative"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    position: 'relative',
                    zIndex: 60,
                    padding: '0',
                    margin: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                  ) : (
                    <Maximize className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 pointer-events-none" style={{ margin: '0' }} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};