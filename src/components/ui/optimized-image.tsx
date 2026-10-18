import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
  lazyLoading?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * A performance-optimized image component that:
 * - Lazy loads images by default
 * - Shows color placeholder while loading
 * - Handles errors gracefully
 * - Uses native browser lazy loading
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#121212',
  lazyLoading = true,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Handle source changes and progressive loading
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    
    // Reset source when src prop changes
    if (src) {
      setImgSrc(src);
    }
  }, [src]);

  // Handle image load event
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error event
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true); // Consider it "loaded" so placeholder goes away
    if (onError) onError();
    
    // Set fallback image
    setImgSrc('/image-placeholder.png');
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        backgroundColor: placeholderColor,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          loading={lazyLoading ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          width={width}
          height={height}
          className={`
            w-full h-full object-cover
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-300
          `}
          decoding="async"
        />
      )}
      
      {/* Skeleton/placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-neutral-800 animate-pulse"
          style={{ 
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '100%',
          }}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 bg-opacity-75 text-white text-sm">
          {alt || 'Image not available'}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 