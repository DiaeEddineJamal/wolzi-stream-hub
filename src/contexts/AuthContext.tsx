import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User, AuthError } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

// Helper functions for localStorage
const PROFILE_STORAGE_KEY = 'wolziflix_user_profile';

const saveProfileToStorage = (profile: UserProfile | null) => {
  if (profile) {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile to localStorage:', error);
    }
  }
};

const getProfileFromStorage = (): UserProfile | null => {
  try {
    const profileData = localStorage.getItem(PROFILE_STORAGE_KEY);
    return profileData ? JSON.parse(profileData) : null;
  } catch (error) {
    console.error('Error reading profile from localStorage:', error);
    return null;
  }
};

const clearProfileFromStorage = () => {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing profile from localStorage:', error);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Wrapped setProfile function to also save to localStorage
  const updateProfileState = (newProfile: UserProfile | null) => {
    setProfile(newProfile);
    if (newProfile) {
      saveProfileToStorage(newProfile);
    } else {
      clearProfileFromStorage();
    }
  };

  // Get user profile function
  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // Retry logic for transient errors, max 3 retries
        if (retryCount < 3) {
          console.log(`Retrying profile fetch (attempt ${retryCount + 1}/3)`);
          // Exponential backoff: 500ms, 1000ms, 2000ms
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
          return fetchProfile(userId, retryCount + 1);
        }
        
        return null;
      }

      console.log('Profile data fetched:', data);
      
      // If no profile exists, create a basic one (handle missing profile case)
      if (!data && retryCount < 1) {
        console.log('No profile found for user, creating a basic profile');
        try {
          const { data: userData } = await supabase.auth.getUser();
          const username = userData?.user?.email?.split('@')[0] || 'User';
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              username: username,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }
          
          console.log('Created new profile:', newProfile);
          
          // Save the newly created profile to localStorage
          if (newProfile) {
            saveProfileToStorage(newProfile as UserProfile);
          }
          return newProfile as UserProfile;
        } catch (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }
      }
      
      // Save the fetched profile to localStorage
      if (data) {
        saveProfileToStorage(data as UserProfile);
      }
      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get cached profile first
        const cachedProfile = getProfileFromStorage();
        if (cachedProfile) {
          console.log('Using cached profile data from localStorage');
          updateProfileState(cachedProfile);
          
          // Immediately set loading to false if we have a cached profile
          // This ensures the UI shows user data right away
          setLoading(false);
        }

        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setIsLoggedIn(true);

          // If we don't have a cached profile or the user ID doesn't match,
          // fetch fresh profile data from the database
          if (!cachedProfile || cachedProfile.id !== currentSession.user.id) {
            console.log('Fetching fresh profile data from database');
          const profileData = await fetchProfile(currentSession.user.id);
          if (profileData) {
              updateProfileState(profileData);
          }
          } else {
            // Background refresh of profile data for next time
            // This doesn't block the UI since we've already set loading=false
            fetchProfile(currentSession.user.id).then(freshProfile => {
              if (freshProfile) {
                updateProfileState(freshProfile);
              }
            });
          }
        } else {
          // No valid session, clear any cached profile
          clearProfileFromStorage();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearProfileFromStorage();
      } finally {
        // Always ensure loading is false at the end of initialization
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession);
        
        if (event === 'SIGNED_OUT') {
          // Clear all state on sign out
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsLoggedIn(false);
          clearProfileFromStorage();
          console.log('Auth state: Signed out, all state cleared');
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (currentSession?.user) {
            console.log('Auth state: User signed in, updating state');
            setSession(currentSession);
            setUser(currentSession.user);
            setIsLoggedIn(true);
            
            // Try using cached profile if it exists and the ID matches
            const cachedProfile = getProfileFromStorage();
            if (cachedProfile && cachedProfile.id === currentSession.user.id) {
              console.log('Auth state: Using cached profile temporarily');
              updateProfileState(cachedProfile);
              // Set loading to false as soon as we have a profile
              setLoading(false);
            } else {
              console.log('Auth state: No matching cached profile found');
            }
            
            // Always fetch fresh profile data with retries on SIGNED_IN event
            console.log('Auth state: Fetching fresh profile after auth event:', event);
            try {
              // Add a slight delay to allow auth to settle
              await new Promise(resolve => setTimeout(resolve, 300));
              
              const profileData = await fetchProfile(currentSession.user.id);
              if (profileData) {
                console.log('Auth state: Profile successfully fetched after auth event');
                updateProfileState(profileData);
              } else {
                console.warn('Auth state: Failed to fetch profile after auth event');
              }
            } catch (error) {
              console.error('Auth state: Error fetching profile after auth event:', error);
            }
          }
        } else {
          // For any other event, check if we have a session
          if (currentSession?.user) {
            // Update state with current session
            setSession(currentSession);
            setUser(currentSession.user); 
            setIsLoggedIn(true);
            
            // Background fetch profile
            fetchProfile(currentSession.user.id).then(freshProfile => {
              if (freshProfile) {
                updateProfileState(freshProfile);
              }
            });
          } else {
            console.log('Auth state: No user in session, clearing profile');
            updateProfileState(null);
            clearProfileFromStorage();
          }
        }
        
        // Always ensure loading is false after auth state change
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful, setting user state', data);
      
      // Ensure Supabase has time to set up the session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set auth state
      setUser(data.user);
      setSession(data.session);
      setIsLoggedIn(true);

      if (data.user) {
        console.log('Fetching profile after successful login');
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          console.log('Profile found and loaded:', profileData);
          updateProfileState(profileData);
        } else {
          console.warn('No profile data found after login');
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('User was not created');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setUser(data.user);
      setSession(data.session);
      setIsLoggedIn(!!data.session);

      const profileData = await fetchProfile(data.user.id);
      if (profileData) {
        updateProfileState(profileData);
      }

    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("AuthContext: Starting logout process");
      
      // First, attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all tabs/windows
      });
      
      if (error) {
        console.error('Error during logout from Supabase:', error);
      }
      
      // AGGRESSIVE CLEANUP - delete ALL auth-related storage
      
      // 1. Clear localStorage completely (Supabase stores auth data here)
      console.log('Performing aggressive localStorage cleanup');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keysToRemove.push(key);
        }
      }
      
      // Remove keys in a separate loop to avoid index issues
      keysToRemove.forEach(key => {
        console.log(`Removing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
      
      // 2. Clear sessionStorage completely
      console.log('Clearing sessionStorage');
      sessionStorage.clear();
      
      // 3. Set a flag in the URL to indicate complete logout needed
      sessionStorage.setItem('wolziflix_complete_logout', 'true');
      
      // 4. Clear application state
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsLoggedIn(false);
      
      // 5. Use service worker for deep cleanup if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log('Using service worker for deep cleanup');
        navigator.serviceWorker.controller.postMessage({
          type: 'LOGOUT'
        });
      }
      
      // 6. Clear any specific profile storage
      clearProfileFromStorage();
      
      console.log("AuthContext: Logout complete, forcing page reload");
      
      // 7. Force hard reload with cache clearing
      window.location.href = '/?logout=complete&t=' + new Date().getTime();
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear everything and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/?logout=error&t=' + new Date().getTime();
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const dataToUpdate = {
        ...profileData,
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (profileData.id && profileData.id !== user.id) {
        delete dataToUpdate.id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile = { ...(profile || {}), ...data } as UserProfile;
      updateProfileState(updatedProfile);

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isLoggedIn,
      login,
      logout,
      signup,
      updateProfile,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};