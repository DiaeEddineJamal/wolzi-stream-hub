import React from 'react';
import { Link } from 'react-router-dom';
import MediaCard from './MediaCard';
import { motion } from 'framer-motion';

interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'movie' | 'tv' | 'anime';
}

interface StaticCarouselProps {
  items: MediaItem[];
  title: string;
  viewMoreLink?: string;
}

const StaticCarousel: React.FC<StaticCarouselProps> = ({
  items,
  title,
  viewMoreLink,
}) => {
  // Ensure we have items before proceeding
  if (!items || items.length === 0) {
    return (
      <div className="mb-8">
        <div className="container mx-auto px-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          <div className="h-[300px] flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, 
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      } 
    }
  };

  return (
    <div className="mb-8 sm:mb-12">
      <div className="container mx-auto px-4 mb-3 sm:mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          {viewMoreLink && (
            <Link 
              to={viewMoreLink} 
              className="text-wolzi-light-gray hover:text-white transition-colors flex items-center text-sm sm:text-base"
            >
              View All
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                className="inline-block ml-1"
              >
                →
              </motion.span>
            </Link>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {items.map((item, index) => (
            <motion.div 
              key={item.id}
              className="carousel-item"
              variants={itemVariants}
              custom={index}
            >
              <MediaCard
                id={item.id}
                title={item.title}
                posterUrl={item.posterUrl}
                rating={item.rating}
                year={item.year}
                mediaType={item.mediaType}
                showHover={true}
                description={`Watch ${item.title} online. ${item.mediaType === 'tv' ? 'TV Series' : item.mediaType === 'anime' ? 'Anime' : 'Movie'} from ${item.year || 'recent years'}.`}
                size="medium"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default StaticCarousel; 