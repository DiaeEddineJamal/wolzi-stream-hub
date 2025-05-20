
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';

interface HeroBannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mediaType: string;
  ctaLink: string;
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
  
  // Auto advance slides
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredItems.length);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [featuredItems.length, autoPlayInterval]);
  
  // Handle indicator click
  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
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
      scale: direction > 0 ? 1.05 : 0.95,
      filter: "blur(8px)"
    }),
    center: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)"
    },
    exit: (direction: number) => ({
      opacity: 0,
      scale: direction > 0 ? 0.95 : 1.05,
      filter: "blur(8px)"
    }),
  };
  
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.4,
        duration: 0.6,
        ease: "easeOut",
      }
    },
    hover: {
      scale: 1.08,
      boxShadow: "0 0 20px rgba(255, 255, 255, 0.4)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      }
    }
  };
  
  return (
    <div className="hero-banner relative h-[80vh] min-h-[500px] overflow-hidden">
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
            opacity: { duration: 1.5, ease: "easeInOut" },
            scale: { duration: 1.8, ease: [0.19, 1, 0.22, 1] }, // Expo ease
            filter: { duration: 1.5, ease: "easeOut" }
          }}
        >
          {/* Background Image with its own animation */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentItem.imageUrl})` }}
            initial={{ scale: 1.1, filter: "brightness(0.8)" }}
            animate={{ 
              scale: 1, 
              filter: "brightness(1)",
              transition: { duration: 10, ease: "easeOut" }
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
            <div className="container mx-auto px-4 h-full flex items-end pb-20 sm:pb-24">
              <motion.div 
                className="max-w-3xl"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.18
                    }
                  },
                  exit: {
                    opacity: 0,
                    transition: {
                      staggerChildren: 0.08,
                      staggerDirection: -1
                    }
                  }
                }}
              >
                <motion.div variants={textVariants}>
                  <span className={`px-2 py-1 text-xs sm:text-sm font-semibold rounded-sm uppercase ${getMediaLabelStyles(currentItem.mediaType)}`}>
                    {currentItem.mediaType === 'movie' ? 'Movie' : currentItem.mediaType === 'tv' ? 'TV Series' : 'Anime'}
                  </span>
                </motion.div>
                
                <motion.h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
                  variants={textVariants}
                >
                  {currentItem.title}
                </motion.h1>
                
                <motion.p 
                  className="text-wolzi-light-gray mb-6 text-base md:text-lg max-w-2xl"
                  variants={textVariants}
                >
                  {currentItem.description.length > 200 
                    ? `${currentItem.description.substring(0, 200)}...` 
                    : currentItem.description}
                </motion.p>
                
                <motion.div 
                  className="flex flex-wrap gap-3"
                  variants={textVariants}
                >
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                  >
                    <Button asChild className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white">
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
                    <Button variant="outline" asChild className="border-wolzi-gray/50 hover:bg-wolzi-dark-blue/50 hover:border-white/50">
                      <Link to={`/${currentItem.mediaType}/${currentItem.id}`}>
                        <Info className="w-5 h-5 mr-2" />
                        More Info
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {featuredItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? "w-8 bg-wolzi-accent" 
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
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
  ctaLink
}) => {
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
    <div className="hero-banner relative h-[80vh] min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        initial={{ scale: 1.1, filter: "brightness(0.8)" }}
        animate={{ 
          scale: 1, 
          filter: "brightness(1)",
          transition: { duration: 6, ease: "easeOut" }
        }}
      />
      
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
