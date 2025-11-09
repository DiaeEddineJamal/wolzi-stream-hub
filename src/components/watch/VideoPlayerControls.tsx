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
    const handleMouseLeave = () => {
      if (!isDragging && isPlaying) {
        setControlsVisible(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
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
          className="absolute bottom-0 left-0 right-0 z-50"
        >
          {/* Progress Bar */}
          <div className="px-3 sm:px-4 md:px-6 pb-2">
            <div className="relative">
              <Slider
                value={[progressPercentage]}
                onValueChange={handleProgressChange}
                onValueCommit={() => setIsDragging(false)}
                onPointerDown={() => setIsDragging(true)}
                className="w-full cursor-pointer touch-manipulation"
                max={100}
                step={0.1}
              />
              <div className="flex justify-between text-xs sm:text-sm text-white/70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Main Controls */}
          <div className="frosted-glass-strong backdrop-blur-xl bg-black/40 border-t border-white/10">
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              {/* Left Controls */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Previous Episode */}
                <Button
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 disabled:opacity-50 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Skip Back */}
                <Button
                  onClick={() => onSeek?.(Math.max(0, currentTime - 10))}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Play/Pause */}
                <Button
                  onClick={isPlaying ? onPause : onPlay}
                  size="lg"
                  className="frosted-glass border-white/20 hover:bg-white/10 active:bg-white/20 text-white !w-16 !h-16 sm:!w-18 sm:!h-18 md:!w-20 md:!h-20 !p-0 !m-0 !min-w-0 !min-h-0 !leading-none rounded-full touch-manipulation active:scale-95 transition-all duration-150 select-none flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 animate-spin flex-shrink-0 pointer-events-none" />
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex-shrink-0 pointer-events-none" />
                  ) : (
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 ml-1 flex-shrink-0 pointer-events-none" />
                  )}
                </Button>

                {/* Skip Forward */}
                <Button
                  onClick={() => onSeek?.(Math.min(duration, currentTime + 10))}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Next Episode */}
                <Button
                  onClick={onNext}
                  disabled={!canGoNext}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 disabled:opacity-50 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Volume Controls */}
                <div 
                  className="hidden sm:flex items-center space-x-2"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <Button
                    onClick={onMute}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                    style={{ 
                      pointerEvents: 'auto',
                      boxSizing: 'border-box',
                      lineHeight: '1'
                    }}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
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
                          className="w-20 touch-manipulation"
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
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Reload */}
                <Button
                  onClick={onReload}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Download - Hidden on mobile */}
                <Button
                  onClick={onDownload}
                  size="sm"
                  variant="ghost"
                  className="hidden sm:flex text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Add to Watchlist - Hidden on mobile */}
                <Button
                  onClick={onAddToWatchlist}
                  size="sm"
                  variant="ghost"
                  className="hidden sm:flex text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Share - Hidden on mobile */}
                <Button
                  onClick={onShare}
                  size="sm"
                  variant="ghost"
                  className="hidden sm:flex text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Settings */}
                <Button
                  onClick={onSettings}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 !w-[40px] !h-[40px] sm:!w-[44px] sm:!h-[44px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 pointer-events-none" />
                </Button>

                {/* Fullscreen */}
                <Button
                  onClick={onFullscreen}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10 !w-[44px] !h-[44px] sm:!w-[48px] sm:!h-[48px] !p-0 !m-0 !min-w-0 !min-h-0 !leading-none flex items-center justify-center touch-manipulation flex-shrink-0 cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    lineHeight: '1'
                  }}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 pointer-events-none" />
                  ) : (
                    <Maximize className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 pointer-events-none" />
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