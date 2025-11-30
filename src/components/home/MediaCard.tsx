import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  description,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  // Refs for timeouts to handle safe hovering between card and portal
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    small: "w-32 h-48 sm:w-36 sm:h-54",
    medium: "w-40 h-60 sm:w-44 sm:h-66",
    large: "w-48 h-72 sm:w-52 sm:h-78",
  };

  const handleMouseEnter = () => {
    if (!showHover) return;
    
    // Clear any pending close action (e.g., moving from portal back to card)
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    // If already open, keep it open
    if (isHovered) return;

    // Start open timer
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    
    openTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setPortalPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
        setIsHovered(true);
      }
    }, 300); // Reduced delay to 300ms for faster response
  };

  const handleMouseLeave = () => {
    // Clear open timer if we leave before it opens
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    // Delay closing to allow moving to the portal
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    closeTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // Small delay to allow bridging the gap
  };

  // Handler for the Portal itself to keep it open
  const handlePortalMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Close portal on scroll or resize
  useEffect(() => {
    if (!isHovered) return;

    const handleScrollOrResize = () => {
      setIsHovered(false);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isHovered]);

  const getDetailsUrl = () => `/${mediaType}/${id}`;

  return (
    <>
      <div 
        ref={cardRef}
        className={cn("relative z-0", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Base Card (Always Visible) */}
        <Link 
          to={getDetailsUrl()} 
          className={cn(
            "block relative rounded-md overflow-hidden bg-gray-900 transition-opacity duration-300",
            sizeClasses[size],
            isHovered ? "opacity-0" : "opacity-100" // Hide base card when hover is active to prevent duplication
          )}
        >
          <img 
            src={posterUrl} 
            alt={title}
            className="object-cover w-full h-full" 
            loading="lazy"
          />
        </Link>
      </div>

      {/* Portal Hover Card */}
      {isHovered && portalPosition && createPortal(
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ 
                scale: 1, 
                opacity: 0,
                top: portalPosition.top,
                left: portalPosition.left,
                width: portalPosition.width,
                height: portalPosition.height
              }}
              animate={{ 
                scale: 1.5, 
                opacity: 1,
                top: portalPosition.top - 40, // Increased lift for better visibility
                transition: { duration: 0.2, ease: "easeOut" } // Faster animation
              }}
              exit={{ 
                scale: 1, 
                opacity: 0,
                top: portalPosition.top,
                transition: { duration: 0.15 } 
              }}
              className="absolute z-[9999] rounded-md overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.7)] bg-[#141414] border border-white/10"
              style={{
                transformOrigin: 'center center',
              }}
              onMouseEnter={handlePortalMouseEnter} // Keep open when hovering portal
              onMouseLeave={handleMouseLeave} // Close when leaving portal
            >
              {/* Media Section */}
              <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                <img 
                  src={posterUrl} 
                  alt={title}
                  className="object-cover w-full h-full"
                  style={{ objectPosition: "center top" }} // Ensure faces/key elements are visible if cropped
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent opacity-40" />
              </div>

              {/* Info Section */}
              <div className="p-3 bg-[#141414] flex flex-col gap-3">
                
                {/* Action Bar */}
                <div className="flex items-center gap-2">
                  {/* Play Button */}
                  <Link to={getDetailsUrl()} className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-white/90 transition-colors text-black">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </Link>
                  
                  {/* Add to List */}
                  <button className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white transition-colors bg-[#2a2a2a]/60">
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  {/* Like */}
                  <button className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white transition-colors bg-[#2a2a2a]/60">
                    <ThumbsUp className="w-4 h-4" />
                  </button>

                  {/* More Info (Right aligned) */}
                  <Link to={getDetailsUrl()} className="ml-auto flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white transition-colors bg-[#2a2a2a]/60">
                    <ChevronDown className="w-4 h-4" />
                  </Link>
                </div>

                {/* Metadata Row 1 */}
                <div className="flex items-center gap-2 text-[10px] font-semibold flex-wrap">
                  <span className="text-wolzi-accent">98% Match</span>
                  <span className="border border-gray-500 px-1 rounded-[2px] text-gray-400">
                    {mediaType === 'movie' ? 'Movie' : 'TV'}
                  </span>
                  <span className="text-gray-400">{year}</span>
                  <span className="border border-gray-500 px-1 rounded-[2px] text-[8px] leading-tight text-gray-400">HD</span>
                </div>

                {/* Metadata Row 2 (Genres/Title) */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-bold text-xs line-clamp-1">{title}</h3>
                  <div className="flex items-center gap-1 text-[9px] text-gray-400 flex-wrap">
                     <span>Exciting</span>
                     <span className="text-gray-600">•</span>
                     <span>{mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Drama' : 'Action'}</span>
                     <span className="text-gray-600">•</span>
                     <span>Sci-Fi</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default MediaCard;
