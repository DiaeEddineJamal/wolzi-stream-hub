import React from 'react';
import { Link } from 'react-router-dom';

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

  // Get the appropriate media type label color based on type
  const getMediaLabelStyles = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return 'bg-wolzi-accent/30 border-wolzi-accent/50 text-wolzi-text';
      case 'tv':
        return 'bg-blue-500/30 border-blue-500/50 text-wolzi-text';
      case 'anime':
        return 'bg-purple-500/30 border-purple-500/50 text-wolzi-text';
      default:
        return 'bg-wolzi-dark-gray/50 border-wolzi-gray/50 text-wolzi-light-gray';
    }
  };

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
              <Link to={`/${item.mediaType}/${item.id}`}>
                <div className="trending-card-hover h-[300px] rounded-lg overflow-hidden">
                  <div className="relative h-full">
                    <img 
                      src={item.posterUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover rounded-md"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 transition-opacity"></div>
                    
                    <div className="absolute inset-0 bg-wolzi-accent/80 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-white scale-hover-effect">
                      <div className="rounded-full bg-white/30 p-2 mb-2 play-button-pulse">
                        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                      <span className="font-semibold text-sm text-center">Watch Now</span>
                    </div>
                    
                    <div className="card-info-overlay absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                      <h3 className="text-sm font-semibold truncate text-white">{item.title}</h3>
                      <div className="flex justify-between text-xs mt-1 w-full">
                        <span className="text-wolzi-light-gray">{item.year}</span>
                        <span className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 border rounded 
                          ${getMediaLabelStyles(item.mediaType)}`}>
                          {item.mediaType === 'movie' ? 'MOVIE' : item.mediaType === 'tv' ? 'TV' : 'ANIME'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaticCarousel; 