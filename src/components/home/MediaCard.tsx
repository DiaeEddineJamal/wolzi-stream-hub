import React from "react";
import { Link } from "react-router-dom";
import { Play, Star, Calendar, Film, Tv } from "lucide-react";
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
  className,
  size = "medium",
  showHover = true,
  description,
}) => {
  const sizeClasses = {
    small: "w-full h-[300px]",
    medium: "w-full h-[300px]",
    large: "w-full h-[300px]",
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case "movie":
        return <Film className="h-3.5 w-3.5 mr-1" />;
      case "tv":
      case "anime":
        return <Tv className="h-3.5 w-3.5 mr-1" />;
      default:
        return <Film className="h-3.5 w-3.5 mr-1" />;
    }
  };

  // Get the appropriate media type label color based on type
  const getMediaLabelStyles = () => {
    switch (mediaType) {
      case "movie":
        return "text-wolzi-text bg-wolzi-accent/30 border-wolzi-accent/50";
      case "tv":
        return "text-wolzi-text bg-blue-500/30 border-blue-500/50";
      case "anime":
        return "text-wolzi-text bg-purple-500/30 border-purple-500/50";
      default:
        return "text-wolzi-light-gray bg-wolzi-dark-gray/50 border-wolzi-gray/50";
    }
  };

  // Generate the watch URL based on media type
  const getWatchUrl = () => {
    switch (mediaType) {
      case "movie":
        return `/watch/movie/${id}`;
      case "tv":
        return `/watch/tv/${id}/season/1/episode/1`;
      case "anime":
        return `/watch/anime/${id}/episode/1`;
      default:
        return `/${mediaType}/${id}`;
    }
  };

  // Get the details page URL
  const getDetailsUrl = () => {
    return `/${mediaType}/${id}`;
  };

  // Card hover animations - updated for consistency in all directions
  const cardVariants = {
    initial: {
      scale: 1,
      y: 0,
      boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
    },
    hover: {
      scale: 1.03,
      y: -5,
      boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.2)",
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  // Overlay hover animations
  const overlayVariants = {
    initial: { 
      opacity: 0,
      backdropFilter: "blur(0px)" 
    },
    hover: {
      opacity: 1,
      backdropFilter: "blur(3px)",
      transition: {
        duration: 0.2,
      },
    },
  };

  // Button hover animations
  const buttonVariants = {
    initial: { scale: 0.9, opacity: 0, y: 10 },
    hover: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.05,
        type: "spring",
        stiffness: 400,
      },
    },
  };

  // Play icon animation
  const playIconVariants = {
    initial: { scale: 0.8, opacity: 0, rotateY: 90 },
    hover: {
      scale: 1.1,
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
      },
    },
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div 
          initial="initial" 
          whileHover="hover" 
          variants={cardVariants}
          className="overflow-hidden rounded-lg"
        >
          <Link
            to={getDetailsUrl()}
            className={cn(
              "relative rounded-lg overflow-hidden block",
              sizeClasses[size],
              className
            )}
          >
            <div className="absolute inset-0 bg-cover bg-center h-full transform transition-transform duration-700 hover:scale-110" 
                style={{ backgroundImage: `url(${posterUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />
            
            {showHover && (
              <motion.div 
                variants={overlayVariants}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-white"
              >
                <motion.div 
                  variants={playIconVariants}
                  className="rounded-full bg-wolzi-accent p-3 mb-3 shadow-lg shadow-wolzi-accent/20"
                >
                  <Play className="h-8 w-8 fill-white" />
                </motion.div>
                <motion.span 
                  variants={buttonVariants}
                  className="font-semibold text-sm sm:text-base text-center"
                >
                  Watch Now
                </motion.span>
              </motion.div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start z-10">
              <h3 className="text-sm sm:text-base font-medium text-white line-clamp-2 group-hover:text-wolzi-accent transition-colors duration-300">
                {title}
              </h3>
              
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                {rating !== undefined && rating > 0 && (
                  <div className="flex items-center text-yellow-400">
                    <Star className="h-3 w-3 fill-yellow-400 mr-0.5" />
                    <span>{rating.toFixed(1)}</span>
                  </div>
                )}
                
                {year && (
                  <span className="text-wolzi-light-gray">{year}</span>
                )}
                
                <span className={`text-xs px-1.5 py-0.5 border rounded ${getMediaLabelStyles()}`}>
                  {mediaType === "tv" ? "TV" : mediaType === "anime" ? "ANIME" : "MOVIE"}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      </HoverCardTrigger>
      
      <HoverCardContent className="bg-wolzi-dark-blue/80 backdrop-blur-lg border-wolzi-gray/30 w-80 p-4 animate-slide-up">
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">{title}</h4>
          
          <div className="flex items-center gap-3 text-sm">
            {rating !== undefined && rating > 0 && (
              <div className="flex items-center">
                <Star className="h-3.5 w-3.5 fill-yellow-400 mr-1" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            
            {year && (
              <div className="flex items-center text-wolzi-light-gray">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{year}</span>
              </div>
            )}
            
            <div className="flex items-center text-wolzi-light-gray">
              {getMediaIcon()}
              <span>{mediaType === "tv" ? "TV Series" : mediaType === "anime" ? "Anime" : "Movie"}</span>
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-wolzi-light-gray line-clamp-3">
              {description || "No description available."}
            </p>
          )}
          
          <div className="flex gap-2 pt-2">
            <Link
              to={getWatchUrl()}
              className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white rounded px-3 py-1 text-sm flex items-center transition-colors duration-300"
            >
              <Play className="h-3.5 w-3.5 mr-1" /> Watch Now
            </Link>
            <Link
              to={getDetailsUrl()}
              className="bg-wolzi-gray hover:bg-opacity-80 text-white rounded px-3 py-1 text-sm transition-colors duration-300"
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
