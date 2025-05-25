import React from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './optimized-image';
import { motion } from 'framer-motion';

interface MediaCardProps {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  mediaType: 'movie' | 'tv' | 'anime';
  className?: string;
}

/**
 * MediaCard Component
 * 
 * A performance-optimized media card component that uses:
 * - OptimizedImage for faster loading
 * - Lazy loading of images
 * - Smooth animations
 */
const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterUrl,
  rating,
  year,
  mediaType,
  className = ''
}) => {
  // Determine the link path based on media type
  const getDetailPath = () => {
    switch (mediaType) {
      case 'movie':
        return `/movie/${id}`;
      case 'tv':
        return `/tv/${id}`;
      case 'anime':
        return `/anime/${id}`;
      default:
        return `/movie/${id}`;
    }
  };

  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      <Link 
        to={getDetailPath()} 
        className="block rounded-md overflow-hidden"
        aria-label={`View ${title}`}
      >
        <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-900 relative">
          <OptimizedImage
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            placeholderColor="#1a1a1a"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rating badge */}
          {rating && (
            <div className="absolute top-2 right-2 bg-wolzi-accent/90 text-white text-xs font-bold px-2 py-1 rounded-md">
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <div className="p-2">
          <h3 className="text-white font-medium text-sm line-clamp-1">{title}</h3>
          {year && <p className="text-gray-400 text-xs">{year}</p>}
        </div>
      </Link>
    </motion.div>
  );
};

export default MediaCard; 