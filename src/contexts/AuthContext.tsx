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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Check for session and set up auth state listener
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
          setIsLoggedIn(true);
          
          // Fetch the user's profile
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
          } else {
            console.log('No profile found for user:', session.user.id);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Call the function to check the session
    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setIsLoggedIn(!!session);
        
        if (session?.user) {
          // Fetch the user's profile
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      // Clean up the subscription when the component unmounts
      subscription?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Set user and session
      setUser(data.user);
      setSession(data.session);
      setIsLoggedIn(true);

      // Fetch user profile
      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      console.log('Starting signup process with email:', email);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Add data needed for the profile
          data: {
            username: username
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('Signup response:', data);
      
      if (!data.user) {
        console.error('No user returned from signup');
        throw new Error('User was not created');
      }

      // Create a profile for the user after successful signup
      console.log('Creating profile for user:', data.user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Set user, session, and fetch profile
      setUser(data.user);
      setSession(data.session);
      setIsLoggedIn(!!data.session);
      
      // Fetch the newly created profile
      const profileData = await fetchProfile(data.user.id);
      setProfile(profileData);
      
      console.log('Signup completed successfully');
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Make sure the id is included and matches the user id
      const dataToUpdate = {
        ...profileData,
        id: user.id,
        updated_at: new Date().toISOString(),
      };
      
      // Remove id from the update if it's trying to change the id
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
      
      // Update the local profile state
      setProfile(prev => prev ? { ...prev, ...data } : data);
      
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
