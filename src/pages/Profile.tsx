import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/layouts/MainLayout';
import { Link } from 'react-router-dom';
import { Play, History, Clock } from 'lucide-react';
import { forceLogout } from '@/utils/auth-helpers';

interface UserPreferences {
  active_streaming_source: string;
  theme: string;
  autoplay: boolean;
}

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

const Profile: React.FC = () => {
  const { user, profile, logout, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add a debug function to check profile data
  useEffect(() => {
    console.log('Profile component - Current user:', user);
    console.log('Profile component - Current profile:', profile);
  }, [user, profile]);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      console.log('Setting form data from profile:', profile);
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Fetch watch history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && user) {
      fetchWatchHistory();
    }
  }, [activeTab, user]);

  const fetchWatchHistory = async () => {
    if (!user) return;
    
    try {
      setHistoryLoading(true);
      console.log('Profile page: Fetching watch history for user:', user.id);
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching watch history:', error);
        return;
      }
      
      console.log('Profile page fetched watch history:', data);
      
      // Map data to correct interface fields if needed
      const processedHistory = data?.map(item => ({
        ...item,
        // Handle possible field name differences
        content_type: item.content_type || item.media_type,
        content_id: item.content_id || item.media_id,
      })) || [];
      
      setWatchHistory(processedHistory);
    } catch (error) {
      console.error('Error in fetchWatchHistory:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setAvatarFile(file);
    
    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Upload avatar if changed
      let avatar_url = profile?.avatar_url;
      
      if (avatarFile) {
        console.log('Starting avatar upload');
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        console.log('Uploading to path:', filePath);
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
        
        console.log('Upload result:', { uploadError, uploadData });
        
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          throw uploadError;
        }
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = data.publicUrl;
        console.log('Avatar URL:', avatar_url);
      }
      
      // Update profile
      console.log('Updating profile with:', { username, avatar_url });
      const result = await updateProfile({ 
        username,
        avatar_url
      });
      console.log('Profile update result:', result);
      
      setSuccess("Profile updated successfully!");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format watched time
  const formatTime = (seconds: number) => {
    if (!seconds) return '0 min';
    
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

  if (!user) {
    console.log('Profile page: No authenticated user, showing loading state');
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="loading-spinner mb-4"></div>
            <p className="text-wolzi-light-gray">Loading profile data...</p>
            <p className="text-wolzi-light-gray text-sm mt-2">Not signed in? <a href="/auth" className="text-wolzi-accent hover:underline">Login here</a></p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Separate check for profile to provide better feedback
  if (user && !profile) {
    console.log('Profile page: User authenticated but profile data not loaded yet');
    
    // Try to create a minimal UI with just the user data we have
    const emailUsername = user.email?.split('@')[0] || 'User';
    
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="max-w-2xl mx-auto bg-wolzi-dark-gray/50 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-bold text-wolzi-accent mb-6">Your Profile</h2>
            <div className="flex flex-col items-center mb-6">
              <div className="mb-4 w-32 h-32 rounded-full overflow-hidden bg-wolzi-gray flex items-center justify-center">
                <span className="text-4xl text-white">{emailUsername[0].toUpperCase()}</span>
              </div>
              <p className="text-wolzi-light-gray">{user.email}</p>
              <p className="text-wolzi-accent text-sm mt-4">Loading complete profile data...</p>
            </div>
            <div className="loading-spinner-small mt-4 mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex justify-center mb-6">
          <div className="flex space-x-4">
            <button
              className={`px-6 py-2 rounded-md ${activeTab === 'profile' ? 'bg-wolzi-accent text-white' : 'bg-wolzi-dark-gray text-wolzi-light-gray'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`px-6 py-2 rounded-md ${activeTab === 'history' ? 'bg-wolzi-accent text-white' : 'bg-wolzi-dark-gray text-wolzi-light-gray'}`}
              onClick={() => setActiveTab('history')}
            >
              Watch History
            </button>
            <button
              className={`px-6 py-2 rounded-md ${activeTab === 'preferences' ? 'bg-wolzi-accent text-white' : 'bg-wolzi-dark-gray text-wolzi-light-gray'}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
          </div>
        </div>
        
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-wolzi-dark-gray/50 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-bold text-wolzi-accent mb-6">Your Profile</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-white">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-md text-white">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6 flex flex-col items-center">
                <div className="mb-4 w-32 h-32 rounded-full overflow-hidden bg-wolzi-gray">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {profile.username ? profile.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Choose profile photo</span>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-wolzi-light-gray
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-wolzi-accent file:text-white
                      hover:file:bg-wolzi-accent/80"
                  />
                </label>
                <p className="text-sm text-wolzi-light-gray mt-2">
                  Choose a profile picture (max 5MB)
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-wolzi-light-gray mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-wolzi-dark-gray/40"
                />
                <p className="text-xs text-wolzi-light-gray mt-1">
                  Email address cannot be changed
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-wolzi-light-gray mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-between">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-wolzi-accent hover:bg-wolzi-accent/80"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    try {
                      console.log("Profile: Initiating logout");
                      
                      // First try the regular logout to properly clean up auth state
                      try {
                        logout();
                      } catch (e) {
                        console.error("Error during regular logout call:", e);
                      }
                      
                      // Then force logout to ensure clean exit
                      forceLogout();
                    } catch (error) {
                      console.error("Profile: Critical error during logout:", error);
                      // Last resort direct reload
                      window.location.href = '/';
                    }
                  }}
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto bg-wolzi-dark-gray/50 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-wolzi-accent">Watch History</h2>
              <Link to="/watch-history" className="text-wolzi-accent hover:underline text-sm flex items-center">
                <History className="h-4 w-4 mr-1" />
                View Full History
              </Link>
            </div>
            
            {historyLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="loading-spinner-small"></div>
              </div>
            ) : watchHistory.length === 0 ? (
              <div className="text-center p-8">
                <Clock className="h-12 w-12 mx-auto text-wolzi-light-gray mb-3 opacity-50" />
                <p className="text-wolzi-light-gray mb-4">
                  Your watch history will appear here once you start watching content.
                </p>
                <Button asChild className="bg-wolzi-accent hover:bg-wolzi-accent/80">
                  <Link to="/">Browse Content</Link>
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {watchHistory.map((item) => (
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
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'preferences' && (
          <div className="max-w-3xl mx-auto bg-wolzi-dark-gray/50 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-bold text-wolzi-accent mb-6">Preferences</h2>
            <p className="text-wolzi-light-gray mb-4">
              Preferences feature coming soon. You'll be able to adjust streaming sources, theme preferences, and more.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;
