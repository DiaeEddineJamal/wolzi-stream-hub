import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
  autoPlayInterval = 6000, // 8 seconds default interval
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
      scale: 1.05,
      filter: "blur(8px)"
    }),
    center: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)"
    },
    exit: (direction: number) => ({
      opacity: 0,
      scale: 0.98,
      filter: "blur(8px)"
    }),
  };
  
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
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
    <div className="hero-banner">
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
            opacity: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 1.5, ease: [0.25, 1, 0.5, 1] },
            filter: { duration: 1.2, ease: "easeOut" }
          }}
        >
          {/* Background Image with its own animation */}
          <motion.img
            src={currentItem.imageUrl}
            alt={currentItem.title}
            className="hero-banner-image"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
          />
          
          {/* Gradient Overlay */}
          <div className="hero-banner-overlay">
            <div className="container mx-auto px-4">
              <motion.div 
                className="hero-banner-content"
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
                  <span className={`px-2 py-1 text-xs font-semibold rounded-sm uppercase ${getMediaLabelStyles(currentItem.mediaType)}`}>
                    {currentItem.mediaType === 'movie' ? 'Movie' : currentItem.mediaType === 'tv' ? 'TV Series' : 'Anime'}
                  </span>
                </motion.div>
                
                <motion.h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-3"
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
                    <Button asChild className="glow-button">
                      <Link to={`/${currentItem.mediaType}/${currentItem.id}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Watch Now
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                  >
                    <Button variant="outline" asChild>
                      <Link to={`/${currentItem.mediaType}/${currentItem.id}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
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
      <div className="hero-indicators">
        {featuredItems.map((_, index) => (
          <div
            key={index}
            className={`hero-indicator ${currentIndex === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
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

  // Animation variants
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: {
        duration: 0.6,
        ease: "easeOut",
      }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: {
        delay: 0.3,
        duration: 0.5,
        ease: "easeOut",
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      }
    }
  };

  return (
    <div className="hero-banner">
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={title}
        className="hero-banner-image"
      />
      
      {/* Gradient Overlay */}
      <div className="hero-banner-overlay">
        <div className="container mx-auto px-4">
          <motion.div 
            className="hero-banner-content"
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
            <motion.div variants={textVariants}>
              <span className={`px-2 py-1 text-xs font-semibold rounded-sm uppercase ${getMediaLabelStyles(mediaType)}`}>
                {mediaType === 'movie' ? 'Movie' : mediaType === 'tv' ? 'TV Series' : 'Anime'}
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mt-3 mb-3"
              variants={textVariants}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              className="text-wolzi-light-gray mb-6 text-base md:text-lg max-w-2xl"
              variants={textVariants}
            >
              {description.length > 200 
                ? `${description.substring(0, 200)}...` 
                : description}
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-3"
              variants={textVariants}
            >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
              >
                <Button asChild className="glow-button">
                  <Link to={`/${mediaType}/${id}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Watch Now
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
              >
                <Button variant="outline" asChild>
                  <Link to={`/${mediaType}/${id}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
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
