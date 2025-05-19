
import React from "react";
import { Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeroBannerProps {
  title: string;
  description: string;
  imageUrl: string;
  id: string;
  mediaType: "movie" | "tv" | "anime";
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  description,
  imageUrl,
  id,
  mediaType
}) => {
  return (
    <div
      className="relative w-full h-[70vh] md:h-[80vh] bg-cover bg-center"
      style={{
        backgroundImage: `url(${imageUrl})`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-16 flex flex-col justify-end h-full max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 animate-slide-up">
          {title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm md:text-base mb-4 text-gray-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <span className="bg-wolzi-accent px-2 py-0.5 rounded text-white">
            {mediaType === "tv" ? "TV Series" : mediaType === "anime" ? "Anime" : "Movie"}
          </span>
          <span>2023</span>
          <span className="px-2 py-0.5 border border-gray-500 rounded">HD</span>
          <span className="flex items-center">
            <span className="text-yellow-400 mr-1">★</span> 8.7
          </span>
        </div>
        
        <p className="text-sm md:text-base text-gray-300 mb-6 line-clamp-3 md:line-clamp-4 max-w-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {description}
        </p>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button asChild size="lg" className="bg-wolzi-accent hover:bg-wolzi-accent-hover">
            <Link to={`/watch/${mediaType}/${id}`} className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              <span>Play Now</span>
            </Link>
          </Button>
          
          <Button variant="secondary" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            <span>Add to List</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
