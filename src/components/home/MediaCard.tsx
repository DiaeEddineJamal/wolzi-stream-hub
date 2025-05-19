
import React from "react";
import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
}) => {
  const sizeClasses = {
    small: "w-full h-40 sm:h-48",
    medium: "w-full h-48 sm:h-64",
    large: "w-full h-56 sm:h-80",
  };

  return (
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
            <span className="text-gray-300">{year}</span>
          )}
          
          <span className="text-gray-300 text-xs px-1.5 py-0.5 border border-gray-500 rounded">
            {mediaType === "tv" ? "TV" : mediaType === "anime" ? "ANIME" : "MOVIE"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MediaCard;
