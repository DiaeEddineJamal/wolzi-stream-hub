
import React from "react";
import { Link } from "react-router-dom";
import { Play, Star, Clock, Calendar, Film, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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
    small: "w-full h-40 sm:h-48",
    medium: "w-full h-48 sm:h-64",
    large: "w-full h-56 sm:h-80",
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

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link
          to={`/${mediaType}/${id}`}
          className={cn(
            "relative rounded-lg overflow-hidden hover-scale block",
            sizeClasses[size],
            className
          )}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${posterUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 transition-opacity" />
          
          {showHover && (
            <div className="absolute inset-0 bg-wolzi-accent/80 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-white">
              <div className="rounded-full bg-white/30 p-2 mb-2">
                <Play className="h-8 w-8 fill-white" />
              </div>
              <span className="font-semibold text-sm sm:text-base text-center">Watch Now</span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
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
              
              <span className="text-wolzi-light-gray text-xs px-1.5 py-0.5 border border-wolzi-gray rounded">
                {mediaType === "tv" ? "TV" : mediaType === "anime" ? "ANIME" : "MOVIE"}
              </span>
            </div>
          </div>
        </Link>
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
              to={`/watch/${mediaType}/${id}`}
              className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white rounded px-3 py-1 text-sm flex items-center"
            >
              <Play className="h-3.5 w-3.5 mr-1" /> Watch Now
            </Link>
            <Link
              to={`/${mediaType}/${id}`}
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
