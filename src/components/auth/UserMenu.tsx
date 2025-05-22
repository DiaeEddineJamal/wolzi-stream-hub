import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { User, LogOut, Settings } from 'lucide-react';

const UserMenu: React.FC = () => {
  const { user, profile, logout, loading } = useAuth();

  // Debug logging to help track user/profile state
  useEffect(() => {
    if (user && !profile) {
      console.log('User authenticated but profile not loaded yet:', user);
    }
  }, [user, profile]);

  // If no user and not loading, show login button
  if (!user && !loading) {
    return (
      <Button asChild variant="ghost" className="nav-link">
        <Link to="/auth">Login</Link>
      </Button>
    );
  }

  // If user exists but no loading indication, show user menu even if profile is not fully loaded
  // This ensures the menu is accessible after page refresh
  if (user) {
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
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => logout()}
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
