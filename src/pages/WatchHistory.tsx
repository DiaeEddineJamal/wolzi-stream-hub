import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Play } from 'lucide-react';

interface WatchHistoryItem {
  id: string;
  content_id: string;
  content_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string | null;
  watched_at: string;
  progress: number;
  duration: number;
  progress_percent: number;
  season?: number;
  episode?: number;
}

const WatchHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('WatchHistory page: Fetching watch history for user:', user.id);
        
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('WatchHistory page fetched watch history:', data);
        
        // Map data to correct interface fields if needed
        const processedHistory = data?.map(item => ({
          ...item,
          // Handle possible field name differences
          content_type: item.content_type || item.media_type,
          content_id: item.content_id || item.media_id,
        })) || [];
        
        if (processedHistory.length > 0) {
          console.log('WatchHistory page: Watch history loaded successfully, found', processedHistory.length, 'items');
        } else {
          console.log('WatchHistory page: No watch history found for user');
        }
        
        setHistory(processedHistory);
      } catch (error) {
        console.error('Error fetching watch history:', error);
        toast({
          title: "Error",
          description: "Failed to load watch history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWatchHistory();
  }, [user, toast]);

  const clearWatchHistory = async () => {
    if (!user || !confirm("Are you sure you want to clear your watch history? This action cannot be undone.")) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setHistory([]);
      toast({
        title: "Watch history cleared",
        description: "Your watch history has been successfully cleared",
      });
    } catch (error: any) {
      console.error('Error clearing watch history:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while clearing your watch history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };
  
  // Helper function to determine continue watching URL
  const getContinueWatchingUrl = (item: WatchHistoryItem) => {
    if (item.content_type === 'movie') {
      return `/watch/movie/${item.content_id}`;
    } else if (item.content_type === 'tv') {
      return `/watch/tv/${item.content_id}/season/${item.season}/episode/${item.episode}`;
    } else if (item.content_type === 'anime') {
      return `/watch/anime/${item.content_id}/episode/${item.episode}`;
    }
    return '';
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text">Watch History</h1>
          
          {history.length > 0 && (
            <Button 
              variant="outline" 
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={clearWatchHistory}
              disabled={loading}
            >
              Clear History
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="loading-spinner"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-12 frosted-glass rounded-lg">
            <h2 className="text-xl font-medium mb-4">No Watch History</h2>
            <p className="text-wolzi-light-gray mb-6">You haven't watched anything yet.</p>
            <Button asChild className="glow-button">
              <Link to="/">Browse Content</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {history.map((item) => (
              <div key={item.id} className="media-card group relative">
                <Link 
                  to={`/${item.content_type}/${item.content_id}${item.season && item.episode ? `/season/${item.season}/episode/${item.episode}` : ''}`}
                  className="block"
                >
                  <div className="relative overflow-hidden rounded-md">
                    <img 
                      src={item.poster_path || 'https://via.placeholder.com/300x450?text=No+Image'} 
                      alt={item.title}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/80">
                      <div 
                        className="h-full bg-wolzi-accent" 
                        style={{ width: `${item.progress_percent || 0}%` }}
                      ></div>
                    </div>
                    
                    {/* Content details overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-sm font-semibold line-clamp-2">{item.title}</h3>
                      <div className="flex justify-between text-xs mt-1 text-wolzi-light-gray">
                        <span>{new Date(item.watched_at).toLocaleDateString()}</span>
                        <span>{formatTime(item.progress)} / {formatTime(item.duration || 0)}</span>
                      </div>
                      {item.season && item.episode && (
                        <div className="text-xs text-wolzi-light-gray mt-1">
                          {item.content_type === 'tv' ? 'Season' : ''} {item.content_type === 'tv' ? item.season : ''} {item.content_type === 'tv' ? '•' : ''} Episode {item.episode}
                        </div>
                      )}
                      <div className="text-xs text-wolzi-accent mt-1">
                        {item.progress_percent}% completed
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Play button overlay */}
                <Link 
                  to={getContinueWatchingUrl(item)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-wolzi-accent/90 hover:bg-wolzi-accent rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
                  title="Continue Watching"
                >
                  <Play className="h-5 w-5 text-white" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WatchHistory; 