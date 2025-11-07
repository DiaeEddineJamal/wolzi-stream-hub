import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Info, Volume2, VolumeX } from 'lucide-react';
import YouTube from 'react-youtube';

interface HeroBannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mediaType: string;
  ctaLink: string;
  trailerKey?: string | null;
}

interface HeroBannerProps {
  featuredItems: HeroBannerItem[];
  autoPlayInterval?: number;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredItems,
  autoPlayInterval = 6000, // 6 seconds default interval
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [trailerMuted, setTrailerMuted] = useState<boolean>(true);
  const trailerPlayerRef = useRef<any>(null);
  // Cache for YouTube players
  const playerCacheRef = useRef<Record<string, any>>({});
  
  // Toggle mute for all cached players
  const toggleMute = useCallback(() => {
    const newMutedState = !trailerMuted;
    
    // Apply mute state to current and all cached players
    const currentTrailer = featuredItems[currentIndex]?.trailerKey;
    if (currentTrailer && playerCacheRef.current[currentTrailer]) {
      try {
        if (newMutedState) {
          playerCacheRef.current[currentTrailer].mute();
        } else {
          playerCacheRef.current[currentTrailer].unMute();
        }
        // Only update state after successful player API call
        setTrailerMuted(newMutedState);
      } catch (error) {
        console.error("Error toggling mute state:", error);
      }
    } else {
      // If no player reference, just update the state
      setTrailerMuted(newMutedState);
    }
  }, [featuredItems, currentIndex, trailerMuted]);
  
  // Auto-advance slides every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [autoPlayInterval, currentIndex]);
  
  // Handle direction change and navigation
  const goToSlide = (index: number, newDirection: number = 1) => {
    // Pause current video if it exists
    const currentTrailerKey = featuredItems[currentIndex]?.trailerKey;
    if (currentTrailerKey && playerCacheRef.current[currentTrailerKey]) {
      playerCacheRef.current[currentTrailerKey].pauseVideo();
    }
    
    setDirection(newDirection);
    setCurrentIndex(index);
    
    // Resume or start the next video
    const nextTrailerKey = featuredItems[index]?.trailerKey;
    if (nextTrailerKey && playerCacheRef.current[nextTrailerKey]) {
      const player = playerCacheRef.current[nextTrailerKey];
      if (trailerMuted) {
        player.mute();
      } else {
        player.unMute();
      }
      player.playVideo();
    }
  };
  
  const goToNext = () => {
    const newIndex = (currentIndex + 1) % featuredItems.length;
    goToSlide(newIndex, 1);
  };
  
  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + featuredItems.length) % featuredItems.length;
    goToSlide(newIndex, -1);
  };
  
  // If no featured items, return null
  if (!featuredItems || featuredItems.length === 0) {
    return null;
  }
  
  // If only one item, simplify the component
  if (featuredItems.length === 1) {
    return (
      <SingleHeroBanner {...featuredItems[0]} />
    );
  }
  
  const currentItem = featuredItems[currentIndex];
  
  // Get the appropriate media type label color based on type
  const getMediaLabelStyles = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return 'bg-wolzi-accent/30 border border-wolzi-accent/50 text-wolzi-text';
      case 'tv':
        return 'bg-blue-500/30 border border-blue-500/50 text-wolzi-text';
      case 'anime':
        return 'bg-purple-500/30 border border-purple-500/50 text-wolzi-text';
      default:
        return 'bg-wolzi-dark-gray/50 border-wolzi-gray/50 text-wolzi-light-gray';
    }
  };
  
  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 40 : -40,
      scale: direction > 0 ? 1.08 : 0.95,
      filter: "blur(8px) brightness(1.2)"
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px) brightness(1)"
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -40 : 40,
      scale: direction > 0 ? 0.95 : 1.08,
      filter: "blur(8px) brightness(0.8)"
    }),
  };
  
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.19, 1, 0.22, 1], // Expo ease
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      filter: "blur(4px)",
      transition: {
        duration: 0.5,
        ease: "easeIn",
      }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.5,
        ease: [0.19, 1, 0.22, 1], // Expo ease
      }
    },
    hover: {
      y: -3,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2), 0 0 15px rgba(168, 85, 247, 0.3)",
      transition: {
        duration: 0.2,
        ease: "easeOut",
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 10,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      }
    }
  };
  
  // Cleanup players when component unmounts
  useEffect(() => {
    return () => {
      // Stop all cached players on unmount
      Object.values(playerCacheRef.current).forEach(player => {
        try {
          player.stopVideo();
        } catch (e) {
          // Ignore any errors during cleanup
        }
      });
    };
  }, []);

  // Preload the next video in the carousel
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    
    // Calculate the next index
    const nextIndex = (currentIndex + 1) % featuredItems.length;
    const nextTrailerKey = featuredItems[nextIndex]?.trailerKey;
    
    // If next item has a trailer that's not in cache, preload it
    if (nextTrailerKey && !playerCacheRef.current[nextTrailerKey]) {
      // We don't need to do anything more here since YouTube component will
      // automatically be created when we render it below, and it will be cached
    }
  }, [currentIndex, featuredItems]);
  
  return (
    <div className="hero-banner relative h-[100vh] min-h-[600px] overflow-hidden -mt-[80px] sm:-mt-24 lg:-mt-28">
      <AnimatePresence custom={direction} initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1.0] },
            x: { duration: 1.0, ease: [0.25, 0.1, 0.25, 1.0] },
            scale: { duration: 1.5, ease: [0.19, 1, 0.22, 1] },
            filter: { duration: 1.2, ease: "easeOut" }
          }}
        >
          {/* Background Image with its own animation */}
          {currentItem.trailerKey ? (
            <div className="hero-banner-video">
              <YouTube
                videoId={currentItem.trailerKey}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    rel: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    loop: 1,
                    playlist: currentItem.trailerKey, // Required for looping
                    mute: 1, // Always start muted and control via API later
                  },
                }}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                onReady={(event) => {
                  // Store the player in our cache using the trailer key as identifier
                  const player = event.target;
                  trailerPlayerRef.current = player;
                  playerCacheRef.current[currentItem.trailerKey!] = player;
                  
                  // Start playing immediately
                  player.playVideo();
                  
                  // Apply current mute state after player is ready - don't call mute() as it's in playerVars
                  if (!trailerMuted) {
                    player.unMute();
                  }
                }}
                onEnd={(event) => {
                  // Loop the video when it ends
                  event.target.playVideo();
                }}
                onError={(error) => {
                  console.error("YouTube player error:", error);
                }}
              />
              <div 
                className="absolute bottom-4 right-4 z-50 p-1.5 sm:p-2 rounded-full bg-wolzi-bg/60 hover:bg-wolzi-bg/90 cursor-pointer transition-colors"
                onClick={toggleMute}
              >
                {trailerMuted ? (
                  <VolumeX className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                )}
              </div>
            </div>
          ) : (
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentItem.imageUrl})` }}
              initial={{ scale: 1.1, filter: "brightness(0.8)" }}
              animate={{ 
                scale: 1.05, 
                filter: "brightness(1)",
                y: -10, // Subtle parallax
                transition: { 
                  scale: { duration: 10, ease: "easeOut" },
                  filter: { duration: 1.5, ease: "easeOut" },
                  y: { duration: 8, ease: [0.25, 0.1, 0.25, 1.0], repeat: Infinity, repeatType: "reverse" }
                }
              }}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
            <motion.div 
              className="container mx-auto px-4 h-full flex items-end justify-start pb-20 sm:pb-24"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.12,
                    delayChildren: 0.4
                  }
                },
                exit: {
                  opacity: 0,
                  transition: {
                    staggerChildren: 0.06,
                    staggerDirection: -1,
                    when: "afterChildren"
                  }
                }
              }}
            >
              {/* Header Content Container */}
              <div className="space-y-4 text-left max-w-3xl">
                {/* Content Rating/Classification */}
                <div className="flex items-center justify-start gap-2">
                  <span className={`px-2 py-1 text-xs sm:text-sm font-semibold rounded-sm uppercase ${getMediaLabelStyles(currentItem.mediaType)}`}>
                    {currentItem.mediaType === 'movie' ? 'Movie' : currentItem.mediaType === 'tv' ? 'TV Series' : 'Anime'}
                  </span>
                </div>
                
                {/* Movie Title */}
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent text-left">
                    {currentItem.title}
                  </h1>
                </div>
                
                {/* Description Text */}
                <motion.div 
                  className="max-w-2xl text-left"
                  variants={textVariants}
                >
                  <p className="text-wolzi-light-gray text-base md:text-lg leading-relaxed text-left">
                    {currentItem.description.length > 200 
                      ? `${currentItem.description.substring(0, 200)}...` 
                      : currentItem.description}
                  </p>
                </motion.div>
                
                {/* Action Buttons */}
                <motion.div 
                  className="flex flex-wrap gap-3 pt-2 justify-start"
                  variants={textVariants}
                >
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                  >
                    <Button asChild className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white px-6 py-3 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300">
                      <Link to={`/${currentItem.mediaType}/${currentItem.id}`}>
                        <Play className="w-5 h-5 mr-2" />
                        Watch Now
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                  >
                    <Button variant="outline" asChild className="glassmorphism-button bg-white/20 hover:bg-white/30 text-white px-6 py-3 border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300">
                      <Link to={`/${currentItem.mediaType}/${currentItem.id}`}>
                        <Info className="w-5 h-5 mr-2" />
                        More Info
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation controls */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 z-20">
        {featuredItems.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index, index > currentIndex ? 1 : -1)}
            className={`h-2 rounded-full transition-all overflow-hidden relative ${
              currentIndex === index 
                ? "w-12" 
                : "w-2"
            }`}
            initial={false}
            animate={{
              backgroundColor: currentIndex === index ? "rgb(168, 85, 247)" : "rgba(255, 255, 255, 0.4)",
              boxShadow: currentIndex === index ? "0 0 10px rgba(168, 85, 247, 0.5)" : "none"
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ 
              backgroundColor: currentIndex === index ? "rgb(168, 85, 247)" : "rgba(255, 255, 255, 0.8)",
              scale: 1.1 
            }}
            aria-label={`Go to slide ${index + 1}`}
          >
            {currentIndex === index && (
              <motion.div 
                className="absolute left-0 top-0 bottom-0 bg-white/30 w-full"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: autoPlayInterval / 1000, 
                  ease: "linear", 
                  repeat: Infinity,
                  repeatType: "loop" 
                }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Prev/Next buttons */}
      {featuredItems.length > 1 && (
        <>
          <button 
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          <button 
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </>
      )}
    </div>
  );
};

// Component for a single hero banner
const SingleHeroBanner: React.FC<HeroBannerItem> = ({
  id,
  title,
  description,
  imageUrl,
  mediaType,
  ctaLink,
  trailerKey
}) => {
  const [trailerMuted, setTrailerMuted] = useState<boolean>(true);
  const trailerPlayerRef = useRef<any>(null);
  
  // Toggle mute for trailer videos
  const toggleMute = useCallback(() => {
    if (trailerPlayerRef.current) {
      try {
        if (trailerMuted) {
          trailerPlayerRef.current.unMute();
        } else {
          trailerPlayerRef.current.mute();
        }
        // Update state after successful player API call
        setTrailerMuted(!trailerMuted);
      } catch (error) {
        console.error("Error toggling mute state:", error);
      }
    }
  }, [trailerMuted]);
  
  // Get the appropriate media type label color based on type
  const getMediaLabelStyles = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return 'bg-wolzi-accent/30 border border-wolzi-accent/50 text-wolzi-text';
      case 'tv':
        return 'bg-blue-500/30 border border-blue-500/50 text-wolzi-text';
      case 'anime':
        return 'bg-purple-500/30 border border-purple-500/50 text-wolzi-text';
      default:
        return 'bg-wolzi-dark-gray/50 border-wolzi-gray/50 text-wolzi-light-gray';
    }
  };

  return (
    <div className="hero-banner relative h-[100vh] min-h-[600px] overflow-hidden -mt-[80px] sm:-mt-24 lg:-mt-28">
      {/* Background Image or Trailer */}
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
                playlist: trailerKey, // Required for looping
                rel: 0,
                mute: 1, // Always start muted and control via API
              },
            }}
            className="absolute top-0 left-0 w-full h-full object-cover"
            onReady={(event) => {
              // Store player reference
              trailerPlayerRef.current = event.target;
              
              // Don't call mute() as it's already set in playerVars
              // and may cause audio glitches on some browsers
            }}
            onError={(error) => {
              console.error("YouTube player error:", error);
            }}
          />
          <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 h-auto w-auto"
              onClick={toggleMute}
              aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
            >
              {trailerMuted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
          initial={{ scale: 1.1, filter: "brightness(0.8)" }}
          animate={{ 
            scale: 1.05, 
            filter: "brightness(1)",
            y: -10, // Subtle parallax
            transition: { 
              scale: { duration: 10, ease: "easeOut" },
              filter: { duration: 1.5, ease: "easeOut" },
              y: { duration: 8, ease: [0.25, 0.1, 0.25, 1.0], repeat: Infinity, repeatType: "reverse" }
            }
          }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
        <div className="container mx-auto px-4 h-full flex items-end pb-20 sm:pb-24">
          <motion.div 
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className={`px-2 py-1 text-xs sm:text-sm font-semibold rounded-sm uppercase ${getMediaLabelStyles(mediaType)}`}>
                {mediaType === 'movie' ? 'Movie' : mediaType === 'tv' ? 'TV Series' : 'Anime'}
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="text-wolzi-light-gray mb-6 text-base md:text-lg max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {description.length > 200 
                ? `${description.substring(0, 200)}...` 
                : description}
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Button asChild className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white">
                  <Link to={`/${mediaType}/${id}`}>
                    <Play className="w-5 h-5 mr-2" />
                    Watch Now
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="outline" asChild className="border-wolzi-gray/50 hover:bg-wolzi-dark-blue/50 hover:border-white/50">
                  <Link to={`/${mediaType}/${id}`}>
                    <Info className="w-5 h-5 mr-2" />
                    More Info
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

// CSS for hero banner video
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);
