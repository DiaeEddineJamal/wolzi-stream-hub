import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/layouts/MainLayout';

interface UserPreferences {
  active_streaming_source: string;
  theme: string;
  autoplay: boolean;
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

  if (!user || !profile) {
    console.log('Profile page loading state:', { user, profile, loading: !user || !profile });
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
            <p className="mt-4 text-wolzi-light-gray">Loading profile data...</p>
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
                  onClick={logout} 
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto bg-wolzi-dark-gray/50 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h2 className="text-2xl font-bold text-wolzi-accent mb-6">Watch History</h2>
            <p className="text-wolzi-light-gray mb-4">
              Your watch history will appear here once you start watching content.
            </p>
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
