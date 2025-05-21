import React from 'react';
import { Link } from 'react-router-dom';
import MediaCard from './MediaCard';

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
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="h-[300px] flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="container mx-auto px-4 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          {viewMoreLink && (
            <Link 
              to={viewMoreLink} 
              className="text-wolzi-light-gray hover:text-white transition-colors"
            >
              View All
            </Link>
          )}
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div 
              key={item.id}
              className="carousel-item"
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaticCarousel; 