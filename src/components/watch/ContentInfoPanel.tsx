import React from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar, Clock, Play, Download, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentInfoPanelProps {
  title: string;
  overview?: string;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  genres?: string[];
  mediaType: 'movie' | 'tv' | 'anime';
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  onDownload?: () => void;
  onAddToWatchlist?: () => void;
  onShare?: () => void;
}

export const ContentInfoPanel: React.FC<ContentInfoPanelProps> = ({
  title,
  overview,
  releaseDate,
  runtime,
  rating,
  genres,
  mediaType,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  onDownload,
  onAddToWatchlist,
  onShare
}) => {
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatRating = (rating?: number) => {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="frosted-glass p-6 rounded-2xl space-y-6"
    >
      {/* Header */}
      <div className="space-y-2 pr-20">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold text-white title-glow break-words line-clamp-3"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {title}
        </motion.h1>
        
        {(mediaType === 'tv' || mediaType === 'anime') && seasonNumber && episodeNumber && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }}
            className="flex items-center space-x-2"
          >
            <div className="glass-card px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-purple-400">
                S{seasonNumber} · E{episodeNumber}
              </span>
            </div>
            {episodeTitle && (
              <span className="text-lg text-white/90 break-words line-clamp-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{episodeTitle}</span>
            )}
          </motion.div>
        )}
      </div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        className="flex flex-wrap items-center gap-4"
      >
        {rating && (
          <div className="flex items-center space-x-1 glass-card px-3 py-2 rounded-full">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-white">{formatRating(rating)}</span>
          </div>
        )}
        
        {releaseDate && (
          <div className="flex items-center space-x-1 glass-card px-3 py-2 rounded-full">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white/90">
              {new Date(releaseDate).getFullYear()}
            </span>
          </div>
        )}
        
        {runtime && (
          <div className="flex items-center space-x-1 glass-card px-3 py-2 rounded-full">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/90">{formatRuntime(runtime)}</span>
          </div>
        )}
      </motion.div>

      {/* Genres */}
      {genres && genres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="flex flex-wrap gap-2"
        >
          {genres.slice(0, 4).map((genre, index) => (
            <motion.span
              key={genre}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 + index * 0.1 } }}
              className="glass-card px-3 py-1 rounded-full text-sm text-white/80 shimmer-border"
            >
              {genre}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Overview */}
      {overview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          className="space-y-2"
        >
          <h3 className="text-lg font-semibold text-white">Overview</h3>
          <p className="text-white/80 leading-relaxed text-sm">
            {overview.length > 300 ? `${overview.substring(0, 300)}...` : overview}
          </p>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
        className="flex flex-wrap gap-3 pt-4 border-t border-white/10"
      >
        <Button
          onClick={onDownload}
          className="frosted-glass border-purple-400/30 hover:bg-purple-400/20 text-white flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </Button>
        
        <Button
          onClick={onAddToWatchlist}
          variant="outline"
          className="frosted-glass border-white/20 hover:bg-white/10 text-white flex items-center space-x-2"
        >
          <Heart className="w-4 h-4" />
          <span>Watchlist</span>
        </Button>
        
        <Button
          onClick={onShare}
          variant="outline"
          className="frosted-glass border-white/20 hover:bg-white/10 text-white flex items-center space-x-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </Button>
      </motion.div>

      {/* Media type indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
        className="absolute top-4 right-4"
      >
        <div className="glass-card px-3 py-1 rounded-full">
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
            {mediaType === 'tv' ? 'TV Series' : mediaType === 'anime' ? 'Anime' : 'Movie'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};