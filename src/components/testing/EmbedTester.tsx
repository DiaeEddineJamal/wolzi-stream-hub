import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmbedTesterProps {
  className?: string;
}

const EmbedTester: React.FC<EmbedTesterProps> = ({ className }) => {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [tmdbId, setTmdbId] = useState<string>('299536'); // Default to Avengers: Infinity War
  const [season, setSeason] = useState<string>('1');
  const [episode, setEpisode] = useState<string>('1');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  
  const generateEmbedUrl = () => {
    if (mediaType === 'movie') {
      setEmbedUrl(`https://embed.su/embed/movie/${tmdbId}`);
    } else {
      setEmbedUrl(`https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`);
    }
  };
  
  return (
    <div className={`p-4 bg-wolzi-bg rounded-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4">Embed.su Tester</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Media Type</label>
          <Select value={mediaType} onValueChange={(value: 'movie' | 'tv') => setMediaType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="tv">TV Show</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">TMDB ID</label>
          <Input 
            value={tmdbId} 
            onChange={(e) => setTmdbId(e.target.value)} 
            placeholder="Enter TMDB ID" 
          />
        </div>
        
        {mediaType === 'tv' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Season</label>
              <Input 
                value={season} 
                onChange={(e) => setSeason(e.target.value)} 
                placeholder="Season number" 
                type="number"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Episode</label>
              <Input 
                value={episode} 
                onChange={(e) => setEpisode(e.target.value)} 
                placeholder="Episode number" 
                type="number"
                min="1"
              />
            </div>
          </>
        )}
      </div>
      
      <Button className="w-full mb-4" onClick={generateEmbedUrl}>Generate Embed URL</Button>
      
      {embedUrl && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Embed URL:</h3>
            <code className="bg-wolzi-dark-gray p-1 rounded text-xs">{embedUrl}</code>
          </div>
          
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title="Embed.su Player"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedTester; 