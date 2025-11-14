import React from "react";
import { Link } from "react-router-dom";
import { Play, Star, Calendar, Film, Tv, MonitorPlay, Clapperboard, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion } from "framer-motion";

interface MediaCardProps {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  mediaType: "movie" | "tv" | "anime";
  className?: string;
  size?: "small" | "medium" | "large";
  showHover?: boolean;
  description?: string;
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterUrl,
  rating,
  year,
  mediaType,
  className = "",
  size = "medium",
  showHover = true,
  description = "",
}) => {
  const sizeClasses = {
    small: "w-32 h-48 sm:w-36 sm:h-54",
    medium: "w-40 h-60 sm:w-44 sm:h-66",
    large: "w-48 h-72 sm:w-52 sm:h-78",
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case "movie":
        return <Clapperboard className="h-3 w-3" />;
      case "tv":
        return <MonitorPlay className="h-3 w-3" />;
      case "anime":
        return <Sparkles className="h-3 w-3" />;
      default:
        return <Clapperboard className="h-3 w-3" />;
    }
  };

  const getMediaLabelStyles = () => {
    switch (mediaType) {
      case "movie":
        return "text-blue-400 border-blue-400/50 bg-blue-400/10";
      case "tv":
        return "text-green-400 border-green-400/50 bg-green-400/10";
      case "anime":
        return "text-purple-400 border-purple-400/50 bg-purple-400/10";
      default:
        return "text-gray-400 border-gray-400/50 bg-gray-400/10";
    }
  };

  const getWatchUrl = () => {
    const baseUrl = `/watch/${mediaType}/${id}`;
    return baseUrl;
  };

  const getDetailsUrl = () => {
    return `/${mediaType}/${id}`;
  };

  // Enhanced Framer Motion variants with 3D transformations
  const cardVariants = {
    initial: { 
      scale: 1,
      rotateY: 0,
      rotateX: 0,
      z: 0,
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    },
    hover: { 
      scale: 1.08,
      rotateY: 8,
      rotateX: 5,
      z: 100,
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)",
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    tap: { 
      scale: 0.95,
      rotateY: 2,
      rotateX: 2,
      transition: { duration: 0.15 }
    }
  };

  const overlayVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.7,
      backdropFilter: "blur(0px)",
    },
    hover: { 
      opacity: 1, 
      scale: 1,
      backdropFilter: "blur(20px)",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const playIconVariants = {
    hidden: { 
      scale: 0,
      rotate: -180,
      opacity: 0
    },
    visible: { 
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.2
      }
    },
    hover: {
      scale: 1.15,
      rotate: 5,
      y: -2,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 15,
        duration: 0.3
      }
    }
  };

  const imageVariants = {
    initial: { 
      scale: 1,
      filter: "brightness(1) saturate(1)",
    },
    hover: { 
      scale: 1.15,
      filter: "brightness(1.1) saturate(1.2)",
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const titleVariants = {
    initial: { 
      y: 0,
      opacity: 0.9,
      backgroundPosition: "0% 50%"
    },
    hover: { 
      y: -5,
      opacity: 1,
      backgroundPosition: "100% 50%",
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const glassmorphismOverlayVariants = {
    hidden: { 
      opacity: 0,
      backdropFilter: "blur(0px)",
      background: "rgba(0, 0, 0, 0)"
    },
    visible: { 
      opacity: 1,
      backdropFilter: "blur(20px)",
      background: "rgba(0, 0, 0, 0.3)",
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Get appropriate icon for media type
  const getHoverIcon = () => {
    switch (mediaType) {
      case "movie":
        return <Clapperboard className="h-full w-full" />;
      case "tv":
        return <MonitorPlay className="h-full w-full" />;
      case "anime":
        return <Wand2 className="h-full w-full" />;
      default:
        return <Clapperboard className="h-full w-full" />;
    }
  };

  return (
    <HoverCard openDelay={150} closeDelay={0}>
      <HoverCardTrigger asChild>
        <motion.div 
          initial="initial" 
          whileHover="hover" 
          whileTap="tap"
          variants={cardVariants}
          className="overflow-hidden rounded-2xl touch-manipulation transform-gpu perspective-1000 cursor-pointer"
          style={{ 
            transformStyle: "preserve-3d",
            perspective: "1000px"
          }}
        >
          <Link
            to={getDetailsUrl()}
            className={cn(
              "relative rounded-2xl overflow-hidden block group",
              sizeClasses[size],
              className
            )}
            aria-label={`View details for ${title}`}
          >
            {/* Enhanced image with 3D effect */}
            <motion.div 
              variants={imageVariants}
              className="absolute inset-0 bg-cover bg-center h-full" 
              style={{ backgroundImage: `url(${posterUrl})` }} 
            />
            
            {/* Enhanced glassmorphism overlay */}
            <motion.div 
              variants={glassmorphismOverlayVariants}
              className="absolute inset-0 rounded-2xl border border-white/20"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.1) 100%)",
              }}
            />
            
            {/* Enhanced gradient overlay with depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />
            
            {/* Animated holographic border effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-wolzi-accent/30 via-transparent to-wolzi-accent/30 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-wolzi-accent/40 via-white/20 to-wolzi-accent/40 bg-clip-border animate-pulse" 
                   style={{ 
                     mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                     maskComposite: "xor"
                   }} />
            </div>
            
            {showHover && (
              <motion.div 
                variants={overlayVariants}
                className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white pointer-events-none"
              >
                {/* Enhanced play button with new icon system */}
                <motion.div 
                  variants={playIconVariants}
                  whileHover="hover"
                  className="relative rounded-full p-4 sm:p-5 mb-4 shadow-2xl cursor-pointer"
                  style={{
                    background: "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(25px) saturate(200%)",
                    border: "2px solid rgba(255, 255, 255, 0.25)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wolzi-accent/70 to-wolzi-accent-hover/70 opacity-90" />
                  <div className="relative h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-lg z-10 flex items-center justify-center">
                    {getHoverIcon()}
                  </div>
                  
                  {/* Enhanced pulsing ring effect */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-white/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
            
            {/* Enhanced bottom content with glassmorphism */}
            <div className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex flex-col items-start z-10 ${
              mediaType === 'movie' ? 'pl-1 sm:pl-1' : ''
            }`}>
              <motion.h3 
                variants={titleVariants}
                className="text-xs sm:text-sm font-bold text-white line-clamp-2 mb-2 group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-wolzi-accent group-hover:to-white group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 drop-shadow-lg"
                style={{
                  backgroundSize: "200% 100%",
                }}
              >
                {title}
              </motion.h3>
              
              <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs">
                {rating !== undefined && rating > 0 && (
                  <motion.div 
                    className="flex items-center text-yellow-400 glassmorphism-button px-2 py-1 rounded-full"
                    whileHover={{ scale: 1.1, y: -2 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: "rgba(255, 193, 7, 0.15)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 193, 7, 0.3)"
                    }}
                  >
                    <Star className="h-3 w-3 fill-yellow-400 mr-0.5 drop-shadow-sm" />
                    <span className="font-bold">{rating.toFixed(1)}</span>
                  </motion.div>
                )}
                
                {year && (
                  <motion.span 
                    className="text-wolzi-light-gray font-medium glassmorphism-button px-2 py-1 rounded-full"
                    whileHover={{ scale: 1.05, y: -1 }}
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)"
                    }}
                  >
                    {year}
                  </motion.span>
                )}
                
                <motion.span 
                  className={`text-xs px-2 py-1 border rounded-full font-bold backdrop-blur-sm ${getMediaLabelStyles()}`}
                  whileHover={{ scale: 1.05, y: -1 }}
                  style={{
                    backdropFilter: "blur(15px) saturate(150%)"
                  }}
                >
                  {mediaType === "tv" ? "TV" : mediaType === "anime" ? "ANIME" : "MOVIE"}
                </motion.span>
              </div>
            </div>
          </Link>
        </motion.div>
      </HoverCardTrigger>
      
      <HoverCardContent 
        sideOffset={2} 
        className="glassmorphism-dropdown bg-black/85 backdrop-blur-[40px] saturate-[200%] border border-white/30 w-[90vw] max-w-[380px] sm:w-96 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:bg-black/90 hover:backdrop-blur-[45px] hover:saturate-[220%] hover:border-white/40 hover:shadow-[0_16px_50px_rgba(0,0,0,0.7),0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-1"
      >
        <div 
          className="space-y-3"
        >
          <h4 
            className="text-lg font-bold text-white leading-tight"
          >
            {title}
          </h4>
          
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {rating && rating > 0 && (
              <div className="flex items-center bg-gradient-to-r from-yellow-500/30 to-yellow-400/20 px-3 py-1.5 rounded-full border border-yellow-400/30 backdrop-blur-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1.5" />
                <span className="font-semibold text-yellow-400 shimmer-text">{rating.toFixed(1)}</span>
              </div>
            )}
            
            {year && (
              <div className="flex items-center text-gray-300">
                <Calendar className="h-4 w-4 mr-1.5" />
                <span className="font-medium">{year}</span>
              </div>
            )}
            
            <div className={`flex items-center px-3 py-1.5 rounded-full border backdrop-blur-sm ${getMediaLabelStyles()}`}>
              {getMediaIcon()}
              <span className="ml-1.5 font-semibold text-xs uppercase tracking-wide">
                {mediaType === "tv" ? "TV Series" : mediaType === "anime" ? "Anime" : "Movie"}
              </span>
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed mt-3">
              {description}
            </p>
          )}
          
          <div className="flex gap-3 mt-4">
            <Link
              to={getWatchUrl()}
              className="glow-button glassmorphism-button bg-gradient-to-r from-wolzi-accent/80 to-wolzi-accent-hover/80 hover:from-wolzi-accent hover:to-wolzi-accent-hover text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center justify-center flex-1 border border-white/30 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-wolzi-accent/40"
            >
              <Play className="h-4 w-4 mr-2" /> Watch Now
            </Link>
            <Link
              to={getDetailsUrl()}
              className="glassmorphism-button bg-gradient-to-r from-white/15 to-white/10 hover:from-white/25 hover:to-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-semibold flex-1 text-center border border-white/30 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105"
            >
              Details
            </Link>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default MediaCard;
