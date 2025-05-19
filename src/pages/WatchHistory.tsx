import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

interface WatchHistoryItem {
  id: string;
  content_id: string;
  content_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  watched_at: string;
  progress: number;
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
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false });
        
        if (error) throw error;
        
        setHistory(data || []);
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
              <Link 
                key={item.id} 
                to={`/${item.content_type}/${item.content_id}${item.season && item.episode ? `/season/${item.season}/episode/${item.episode}` : ''}`}
                className="block"
              >
                <div className="media-card">
                  <div className="media-card-poster rounded-md overflow-hidden">
                    <img 
                      src={item.poster_path || 'https://via.placeholder.com/300x450?text=No+Image'} 
                      alt={item.title}
                      className="w-full h-auto object-cover"
                    />
                    <div className="media-card-overlay">
                      <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                      <div className="flex justify-between text-xs mt-1">
                        <span>{new Date(item.watched_at).toLocaleDateString()}</span>
                        <span>{formatTime(item.progress)}</span>
                      </div>
                      {item.season && item.episode && (
                        <div className="text-xs mt-1">
                          S{item.season} E{item.episode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WatchHistory; 