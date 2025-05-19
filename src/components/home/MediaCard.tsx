import React from "react";
import { Link } from "react-router-dom";
import { Play, Star, Clock, Calendar, Film, Tv } from "lucide-react";
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
        return <Tv className="h-3.5 w-3.5 mr-1" />;
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

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <motion.div 
          whileHover={{ 
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7)",
            transition: { 
              duration: 0.3,
              ease: "easeOut" 
            }
          }}
          transition={{ 
            duration: 0.4 
          }}
        >
          <Link
            to={getDetailsUrl()}
            className={cn(
              "relative rounded-lg overflow-hidden block trending-card-hover",
              sizeClasses[size],
              className
            )}
          >
            <div className="absolute inset-0 bg-cover bg-center h-full" 
                style={{ backgroundImage: `url(${posterUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 transition-opacity" />
            
            {showHover && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 text-white">
                <div className="rounded-full bg-wolzi-accent/80 p-3 mb-3 transform hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 fill-white" />
                </div>
                <span className="font-semibold text-sm sm:text-base text-center">Watch Now</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start card-info-overlay">
              <h3 className="text-sm sm:text-base font-medium text-white line-clamp-2">
                {title}
              </h3>
              
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                {rating && (
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
      
      <HoverCardContent className="frosted-glass w-80 p-4">
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">{title}</h4>
          
          <div className="flex items-center gap-3 text-sm">
            {rating && (
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
              className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white rounded px-3 py-1 text-sm flex items-center"
            >
              <Play className="h-3.5 w-3.5 mr-1" /> Watch Now
            </Link>
            <Link
              to={getDetailsUrl()}
              className="bg-wolzi-gray hover:bg-opacity-80 text-white rounded px-3 py-1 text-sm"
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
