import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { forceLogout } from '@/utils/auth-helpers';

// Helper function to determine if user is truly logged in
const isValidSession = (user: any, isLoggedIn: boolean) => {
  // Check if user object exists and has an id AND isLoggedIn flag is true
  const hasValidUser = !!user && !!user.id && typeof user.id === 'string';
  
  // Don't check for token existence as it might not be stored immediately
  return hasValidUser && isLoggedIn;
};

const UserMenu: React.FC = () => {
  const { user, profile, logout, loading, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Debug logging to help track user/profile state
  useEffect(() => {
    if (user && !profile) {
      console.log('User authenticated but profile not loaded yet:', user);
    }
  }, [user, profile]);

  // Enhanced check to ensure we're truly logged in - use our helper function
  const isReallyLoggedIn = isValidSession(user, isLoggedIn);

  // Check for invalid auth state and reset if needed
  useEffect(() => {
    // Only attempt to fix auth state if we've had time to initialize
    // and there's a mismatch between user existence and isReallyLoggedIn
    const authInitialized = !loading;
    
    if (authInitialized && !isReallyLoggedIn && user) {
      console.warn('UserMenu detected potential auth state mismatch', { 
        hasUser: !!user, 
        isLoggedIn,
        isReallyLoggedIn
      });
      
      // Don't automatically reset - just log the warning for now
      // The aggressive reset was causing problems with login
    }
  }, [user, isReallyLoggedIn, loading, isLoggedIn]);

  // If no user and not loading, show login button
  if (!isReallyLoggedIn && !loading) {
    return (
      <Button asChild variant="ghost" className="nav-link">
        <Link to="/auth">Login</Link>
      </Button>
    );
  }

  // If user exists but no loading indication, show user menu even if profile is not fully loaded
  // This ensures the menu is accessible after page refresh
  if (isReallyLoggedIn) {
    // Get initials for avatar fallback
    const getInitials = () => {
      if (profile?.username) {
        return profile.username.substring(0, 2).toUpperCase();
      }
      if (user.email) {
        return user.email.substring(0, 2).toUpperCase();
      }
      return 'U';
    };

    // Get display name
    const displayName = profile?.username || user.email?.split('@')[0] || 'User';
    
    // Log detailed info for debugging
    console.log('UserMenu rendering with:', {
      hasUser: !!user,
      hasProfile: !!profile,
      email: user.email,
      username: profile?.username,
      displayName,
      isLoggedIn,
      isReallyLoggedIn
    });

    // Handle logout with proper error handling
    const handleLogout = () => {
      try {
        console.log("UserMenu: Initiating logout");
        
        // First try the regular logout to properly clean up auth state
        try {
          logout();
        } catch (e) {
          console.error("Error during regular logout call:", e);
        }
        
        // Then force logout to ensure clean exit
        forceLogout();
      } catch (error) {
        console.error("UserMenu: Critical error during logout:", error);
        // Last resort direct reload
        window.location.href = '/';
      }
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-wolzi-accent/50 focus:ring-offset-2 focus:ring-offset-wolzi-bg">
            <Avatar className="h-8 w-8 border border-wolzi-accent/30 transition-all hover:border-wolzi-accent/70">
              <AvatarImage 
                src={profile?.avatar_url || undefined} 
                alt={displayName} 
              />
              <AvatarFallback className="bg-wolzi-accent/20 text-wolzi-accent font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 frosted-glass" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-wolzi-light-gray">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer flex w-full items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Loading state as fallback - should rarely show with our optimized loading handling
  return (
    <Button variant="ghost" className="h-8 w-8 rounded-full" disabled>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-wolzi-dark-gray/50 text-wolzi-light-gray">
          ...
        </AvatarFallback>
      </Avatar>
    </Button>
  );
};

export default UserMenu;
