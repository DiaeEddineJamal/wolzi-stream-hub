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
  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      console.log('Profile data fetched:', data);
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
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setIsLoggedIn(!!currentSession);

        if (currentSession?.user) {
          // Try using cached profile if it exists and the ID matches
          const cachedProfile = getProfileFromStorage();
          if (cachedProfile && cachedProfile.id === currentSession.user.id) {
            updateProfileState(cachedProfile);
            // Set loading to false as soon as we have a profile
            setLoading(false);
          }
          
          // Always fetch fresh profile data to ensure it's up to date
          // But don't block the UI if we already have cached data
          const profileData = await fetchProfile(currentSession.user.id);
          if (profileData) {
            updateProfileState(profileData);
          }
          
          // Always ensure loading is false after auth state change
          setLoading(false);
        } else {
          updateProfileState(null);
          clearProfileFromStorage();
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setSession(data.session);
      setIsLoggedIn(true);

      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          updateProfileState(profileData);
        }
      }
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      updateProfileState(null);
      setSession(null);
      setIsLoggedIn(false);
      clearProfileFromStorage();
    } catch (error) {
      console.error('Error during logout:', error);
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