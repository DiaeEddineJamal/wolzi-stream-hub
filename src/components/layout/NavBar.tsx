import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Heart, History, LogIn, Menu, X, Home, Film, Tv, TrendingUp, LogOut, ChevronDown, Github, Info, Clock, Award, Flame, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import { forceLogout } from "@/utils/auth-helpers";

// Interface for user profile data from AuthContext
interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Interface for nav item descriptions
interface NavItemDescription {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Interface for NavBar props
interface NavBarProps {
  isWatchPage?: boolean;
  onBack?: () => void;
  sourcesCount?: number;
  onSourcesClick?: () => void;
  onSettingsClick?: () => void;
}

// Session-based flag to prevent reanimation only during in-app navigation
const NAV_SESSION_KEY = 'wolziflix-nav-session-key';
// Browser session storage key to track if animations have already run
const NAV_ANIMATION_KEY = 'wolziflix-nav-animated';

// Helper function to determine if user is truly logged in
const isValidSession = (user: any, isLoggedIn: boolean) => {
  // Check if user object exists and has an id AND isLoggedIn flag is true
  const hasValidUser = !!user && !!user.id && typeof user.id === 'string';
  
  // Don't check for token existence as it might not be stored immediately
  return hasValidUser && isLoggedIn;
};

const NavBar: React.FC<NavBarProps> = ({ 
  isWatchPage = false, 
  onBack, 
  sourcesCount, 
  onSourcesClick, 
  onSettingsClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoggedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // State for real-time search
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  // State for nav item descriptions
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  
  // Initialize shouldAnimate state value
  const [shouldAnimate] = useState(() => {
    // Use sessionStorage to ensure animations only run once per browser session
    const hasAnimatedThisSession = sessionStorage.getItem(NAV_ANIMATION_KEY) === 'true';
    
    // Only animate if we haven't animated before in this session
    const shouldRunAnimation = !hasAnimatedThisSession;
    
    // If we decide to animate, mark that we've done so for this session
    if (shouldRunAnimation) {
      sessionStorage.setItem(NAV_ANIMATION_KEY, 'true');
      
      // Also log the animation timestamp in localStorage for debugging
      localStorage.setItem('wolziflix-last-animation', new Date().toISOString());
    }
    
    return shouldRunAnimation;
  });

  // Reset animation flag when user leaves/refreshes the page
  useEffect(() => {
    // Function to handle beforeunload event
    const handleBeforeUnload = () => {
      // Remove the session storage flag when the user refreshes the page or closes the browser
      sessionStorage.removeItem(NAV_ANIMATION_KEY);
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // useEffect to handle sessionStorage update (if still needed)
  useEffect(() => {
    // Store navigation ID to help track navigation state
    if (location.key) {
      sessionStorage.setItem(NAV_SESSION_KEY, location.key);
    }
    
    // Clear animation flag if URL contains 'force-animation' query param
    if (location.search.includes('force-animation')) {
      sessionStorage.removeItem(NAV_ANIMATION_KEY);
      window.location.href = location.pathname; // Reload without the query param
    }
  }, [location.key, location.search]); // Rerun if location changes

  // Handle navigation to auth page
  const goToLogin = () => {
    navigate("/auth?mode=login");
  };

  const goToSignup = () => {
    navigate("/auth?mode=signup");
  };

  // Enhanced scroll effect with direction detection
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // Apply scrolled class when scrolled down
    if (currentScrollY > 50) {
      if (!scrolled) setScrolled(true);
    } else {
      if (scrolled) setScrolled(false);
    }
    
    // Hide navbar when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollTop && currentScrollY > 400 && !mobileMenuOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    
    setLastScrollTop(currentScrollY);
  };

  useEffect(() => {
    const throttledHandleScroll = () => {
      // Using requestAnimationFrame for better performance
      window.requestAnimationFrame(handleScroll);
    };
    
    window.addEventListener("scroll", throttledHandleScroll);
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [scrolled, mobileMenuOpen, lastScrollTop]);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) {
      setHidden(false); // Ensure navbar is visible when menu opens
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      // Focus the search input after the animation completes
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  };

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await tmdbApi.searchMulti(query);
      const results = response.data.results.slice(0, 5); // Only show top 5 results
      
      const processedResults = results.map((result: any) => ({
        id: result.id.toString(),
        title: result.title || result.name || 'Unknown',
        mediaType: result.media_type,
        posterUrl: getPosterUrl(result.poster_path || result.profile_path) || "https://via.placeholder.com/92x138?text=No+Image",
        year: (result.release_date || result.first_air_date || "").substring(0, 4),
      }));
      
      setSearchResults(processedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Set new timeout for debounce
    searchDebounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce time
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setShowResults(false);
      setSearchQuery("");
    }
  };

  // Nav item descriptions
  const navItemDescriptions: Record<string, NavItemDescription> = {
    "Home": {
      title: "Home",
      description: "Discover personalized recommendations and trending content",
      icon: <Home className="h-5 w-5 text-wolzi-accent" />
    },
    "Movies": {
      title: "Movies",
      description: "Explore blockbusters, classics, and hidden gems",
      icon: <Film className="h-5 w-5 text-wolzi-accent" />
    },
    "TV Series": {
      title: "TV Series",
      description: "Binge-worthy shows and exclusive series content",
      icon: <Tv className="h-5 w-5 text-wolzi-accent" />
    },
    "Anime": {
      title: "Anime",
      description: "Latest anime series, movies, and seasonal favorites",
      icon: <TrendingUp className="h-5 w-5 text-wolzi-accent" />
    }
  };

  const mainNavItems = [
    { title: "Home", path: "/", icon: <Home className="h-4 w-4" /> },
    { title: "Movies", path: "/movies", icon: <Film className="h-4 w-4" /> },
    { title: "TV Series", path: "/tv-series", icon: <Tv className="h-4 w-4" /> },
    { title: "Anime", path: "/anime", icon: <TrendingUp className="h-4 w-4" /> }
  ];

  // Get active link status
  const isActivePath = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Navigation menu items with dropdown content
  const categories = {
    movies: [
      { title: "Popular", path: "/movies/popular", icon: <Flame className="h-4 w-4" /> },
      { title: "Top Rated", path: "/movies/top-rated", icon: <Award className="h-4 w-4" /> },
      { title: "Upcoming", path: "/movies/upcoming", icon: <Clock className="h-4 w-4" /> },
    ],
    tvSeries: [
      { title: "Popular", path: "/tv/popular", icon: <Flame className="h-4 w-4" /> },
      { title: "Top Rated", path: "/tv/top-rated", icon: <Award className="h-4 w-4" /> },
      { title: "Currently Airing", path: "/tv/top-rated", icon: <Clock className="h-4 w-4" /> }, // Fixed "On Air" category path
    ],
    anime: [
      { title: "Popular", path: "/view-all/anime/popular", icon: <Flame className="h-4 w-4" /> },
      { title: "Top Rated", path: "/view-all/anime/top-rated", icon: <Award className="h-4 w-4" /> },
      { title: "On Air", path: "/view-all/anime/on-air", icon: <Clock className="h-4 w-4" /> },
    ],
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Enhanced check to ensure we're truly logged in
  const isReallyLoggedIn = isValidSession(user, isLoggedIn);
  
  // Check for invalid auth state and reset if needed
  useEffect(() => {
    // Only attempt to fix auth state if there's a mismatch
    // Don't auto-reset as it interferes with login process
    if (!isReallyLoggedIn && user) {
      console.warn('NavBar detected potential auth state mismatch', {
        hasUser: !!user,
        isLoggedIn,
        isReallyLoggedIn
      });
      
      // Just log warning instead of resetting
    }
  }, [user, isReallyLoggedIn, isLoggedIn]);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-500",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
      style={{ top: '20px' }}
    >
      {/* Floating Navbar Container */}
      <div className="mx-4">
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 25 }}
          whileHover={{ 
            y: -2,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          className={cn(
            "floating-navbar-glass rounded-2xl border border-white/10 transition-all duration-500",
            scrolled 
              ? "floating-navbar-glass-scrolled shadow-[0_20px_40px_rgba(0,0,0,0.4)]" 
              : "shadow-[0_8px_25px_rgba(0,0,0,0.15)]",
            mobileMenuOpen ? "bg-black/90 backdrop-blur-xl" : ""
          )}
          style={{
            transform: scrolled ? "scale(0.98)" : "scale(1)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <div className="px-6 py-4">
        <div className="flex items-center justify-between relative">
          {/* Logo */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
            className="relative z-10"
          >
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <h1 className="text-xl sm:text-2xl font-bold mr-2 flex items-center">
                  <motion.span 
                    className="inline-block text-wolzi-accent"
                  whileHover={{ 
                    scale: 1.05, 
                    textShadow: "0 0 8px rgba(168, 85, 247, 0.8)" 
                  }}
                    transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  >
                    Wolzi
                  </motion.span>
                  <motion.span 
                    className="inline-block text-white ml-1"
                    whileHover={{ 
                      scale: 1.05, 
                      textShadow: "0 0 8px rgba(255, 255, 255, 0.8)" 
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  >
                    Flix
                  </motion.span>
                </h1>
              </div>
            </Link>
          </motion.div>
          
          {/* Main Navigation - Desktop */}
          {isWatchPage ? (
            // Watch page navigation
            <nav className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                
                <Button
                  onClick={onSourcesClick}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Sources ({sourcesCount || 0})
                </Button>
                
                <Button
                  onClick={onSettingsClick}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </nav>
          ) : (
            // Default navigation
            <nav className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
              <ul className="flex space-x-1">
                {mainNavItems.map((item, index) => (
                  <motion.li
                    key={item.title}
                    initial={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: shouldAnimate ? index * 0.1 + 0.2 : 0, duration: 0.3 }}
                    className="relative"
                    onMouseEnter={() => setActiveNavItem(item.title)}
                    onMouseLeave={() => setActiveNavItem(null)}
                  >
                    <Link
                        to={item.path}
                        className={cn(
                          "relative px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 overflow-hidden group",
                          isActivePath(item.path)
                            ? "text-wolzi-accent" 
                            : "text-white/85 hover:text-white"
                        )}
                      >
                        {/* Icon with glow effect */}
                        <motion.span
                          className={cn(
                            "transition-all duration-300 ease-in-out",
                            isActivePath(item.path) 
                              ? "text-wolzi-accent" 
                              : "text-white/90 group-hover:text-wolzi-accent"
                          )}
                          whileHover={{ 
                            scale: 1.2,
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.8)"
                          }}
                        >
                          {item.icon}
                        </motion.span>

                        {/* Text with glow effect */}
                        <motion.span
                          className={cn(
                            "transition-all duration-300 ease-in-out",
                            isActivePath(item.path)
                              ? "text-wolzi-accent" 
                              : "group-hover:text-wolzi-accent"
                          )}
                          whileHover={{ 
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.8)"
                          }}
                        >
                        {item.title}
                      </motion.span>

                      {/* Dropdown arrow indicator */}
                      {item.title !== "Home" && (
                        <motion.div
                          className={cn(
                            "h-3 w-3 transition-all duration-200 ml-1",
                            isActivePath(item.path) 
                              ? "text-wolzi-accent" 
                              : "text-white/70 group-hover:text-wolzi-accent"
                          )}
                          animate={{
                            rotate: activeNavItem === item.title ? 180 : 0
                          }}
                          whileHover={{ 
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.8)"
                          }}
                        >
                          <ChevronDown className="h-full w-full" />
                        </motion.div>
                      )}
                    
                    {/* Active indicator pill */}
                    {isActivePath(item.path) && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 h-0.5 bg-wolzi-accent rounded-full"
                        layoutId="activeNavIndicator"
                        initial={{ width: "30%", x: "-50%" }}
                        animate={{ 
                          width: "60%",
                          x: "-50%"
                        }}
                      />
                    )}
                    
                    {/* Hover indicator */}
                    {!isActivePath(item.path) && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 h-0.5 bg-wolzi-accent/70 rounded-full"
                        initial={{ width: 0, x: "-50%" }}
                        whileHover={{ width: "50%" }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                  
                  {/* Dropdown description */}
                  <AnimatePresence>
                    {activeNavItem === item.title && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 5, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-60 z-50"
                      >
                        <div className="glassmorphism-dropdown bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3 shadow-lg transition-all duration-300"
                             style={{
                               backdropFilter: 'blur(15px)',
                               WebkitBackdropFilter: 'blur(15px)',
                               boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
                             }}>
                          <div className="flex items-start gap-3">
                            {navItemDescriptions[item.title].icon}
                            <div>
                              <h4 className="font-medium text-wolzi-accent">{navItemDescriptions[item.title].title}</h4>
                              <p className="text-xs text-white/80 mt-1">{navItemDescriptions[item.title].description}</p>
                              
                              {/* Category links */}
                              {item.title !== "Home" && (
                                <div className="mt-2 pt-2">
                                  <p className="text-xs text-white/60 mb-1">Popular Categories:</p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {categories[item.title === "Movies" ? "movies" : item.title === "TV Series" ? "tvSeries" : "anime"].map((category) => (
                                      <Link 
                                        key={category.path}
                                        to={category.path}
                                        className="text-xs flex items-center gap-1.5 px-2 py-1 rounded hover:bg-wolzi-accent/20 text-white/70 hover:text-white transition-colors"
                                      >
                                        {category.icon}
                                        <span>{category.title}</span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>
          </nav>
          )}

          {/* Right side: Search, Login, User */}
          <div className="flex items-center space-x-1 relative z-10">
            {/* Search Input and Icon */}
            <div className="flex items-center relative" ref={searchContainerRef}>
              <AnimatePresence>
                {showSearch ? (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "260px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30,
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2"
                    onSubmit={handleSearchSubmit}
                  >
                    <div className="relative">
                      <Input
                        ref={searchInputRef}
                        id="search-input"
                        type="text"
                        placeholder="Search for movies, TV shows..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pr-10 bg-black/30 border-wolzi-accent/30 focus:border-wolzi-accent 
                                  focus-visible:ring-1 focus-visible:ring-wolzi-accent/50 rounded-full text-sm h-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-white/70 hover:text-white"
                        onClick={toggleSearch}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Real-time Search Results Dropdown */}
                    <AnimatePresence>
                      {showResults && searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="glassmorphism-dropdown absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg bg-white/20 backdrop-blur-md border border-white/30 shadow-lg z-50 transition-all duration-300"
                          style={{
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          <div className="p-2">
                            {isSearching ? (
                              <div className="flex justify-center items-center py-3">
                                <div className="w-5 h-5 border-2 border-wolzi-accent/30 border-t-wolzi-accent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <>
                                {searchResults.map((result) => (
                                  <Link
                                    key={`${result.mediaType}-${result.id}`}
                                    to={`/${result.mediaType}/${result.id}`}
                                    className="flex items-center gap-3 p-2 hover:bg-wolzi-accent/20 rounded-md transition-colors"
                                    onClick={() => {
                                      setShowSearch(false);
                                      setShowResults(false);
                                      setSearchQuery("");
                                    }}
                                  >
                                    <img 
                                      src={result.posterUrl} 
                                      alt={result.title}
                                      className="w-10 h-15 object-cover rounded-md"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-white truncate text-sm">{result.title}</p>
                                      <div className="flex items-center text-xs text-wolzi-light-gray">
                                        <span className="capitalize">{result.mediaType}</span>
                                        {result.year && <span className="ml-2">{result.year}</span>}
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                                
                                <div className="mt-2 pt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-wolzi-light-gray hover:text-wolzi-accent rounded-md"
                                    onClick={handleSearchSubmit}
                                  >
                                    View all results for "{searchQuery}"
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.form>
                ) : (
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleSearch}
                      className="text-wolzi-light-gray hover:text-white hover:bg-wolzi-accent/10 transition-colors rounded-full h-10 w-10"
                      aria-label="Toggle search"
                    >
                      <Search className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* GitHub Icon */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <motion.a 
                href="https://github.com/DiaeEddineJamal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
                whileHover={{ 
                  scale: 1.05,
                  textShadow: "0 0 8px rgba(168, 85, 247, 0.6)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-wolzi-light-gray hover:text-white hover:bg-wolzi-accent/10 transition-all duration-300 ease-in-out rounded-full h-10 w-10 hover:shadow-lg hover:shadow-wolzi-accent/30"
                  aria-label="GitHub Profile"
                >
                  <motion.span
                    whileHover={{ 
                      scale: 1.1,
                      color: "#a855f7",
                      textShadow: "0 0 8px rgba(168, 85, 247, 0.8)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Github className="h-[1.2rem] w-[1.2rem]" />
                  </motion.span>
                </Button>
              </motion.a>
            </motion.div>
            
            {/* Auth Buttons or User Menu */}
            <div className="hidden sm:block">
              {isReallyLoggedIn ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={goToLogin} 
                      variant="ghost" 
                      className="text-sm text-wolzi-light-gray hover:text-white hover:bg-wolzi-accent/10 transition-colors rounded-full px-4"
                    >
                      Login
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={goToSignup}
                      className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white text-sm py-1 px-4 rounded-full shadow-lg shadow-wolzi-accent/30"
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="text-wolzi-light-gray hover:text-white hover:bg-wolzi-accent/10 transition-colors rounded-full h-10 w-10"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
          </div>
      </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden floating-navbar-glass mt-2 mx-4 rounded-2xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="space-y-3 mb-6">
                {isWatchPage ? (
                  // Watch page mobile navigation
                  <>
                    <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                      <button
                        onClick={() => {
                          onBack?.();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full text-left"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Back</span>
                      </button>
                    </motion.div>
                    
                    <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                      <button
                        onClick={() => {
                          onSourcesClick?.();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full text-left"
                      >
                        <Film className="h-5 w-5" />
                        <span className="font-medium">Sources ({sourcesCount || 0})</span>
                      </button>
                    </motion.div>
                    
                    <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                      <button
                        onClick={() => {
                          onSettingsClick?.();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full text-left"
                      >
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Settings</span>
                      </button>
                    </motion.div>
                  </>
                ) : (
                  // Default mobile navigation
                  mainNavItems.map((item) => (
                    <motion.div
                        key={item.title}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to={item.path}
                        className={cn(
                            "flex items-center py-3 px-4 rounded-lg transition-all gap-3",
                          isActivePath(item.path)
                            ? "bg-wolzi-accent/20 text-wolzi-accent"
                              : "hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white"
                        )}
                          onClick={() => setMobileMenuOpen(false)}
                      >
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <span className="font-medium">{item.title}</span>
                            <p className="text-xs text-white/60 mt-0.5">{navItemDescriptions[item.title].description}</p>
                          </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </nav>
              
              <div className="py-4 border-t border-wolzi-accent/10">
                <h3 className="text-sm uppercase text-wolzi-light-gray mb-4">Account</h3>
                
                {isReallyLoggedIn ? (
                  <div className="space-y-3">
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to="/profile"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Profile</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to="/favorites"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="h-5 w-5" />
                        <span className="font-medium">Favorites</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to="/watch-history"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <History className="h-5 w-5" />
                        <span className="font-medium">History</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.a
                        href="https://github.com/DiaeEddineJamal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full transition-all duration-300 ease-in-out"
                        onClick={() => setMobileMenuOpen(false)}
                        whileHover={{ 
                          backgroundColor: "rgba(168, 85, 247, 0.15)",
                          textShadow: "0 0 8px rgba(168, 85, 247, 0.6)"
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          whileHover={{ 
                            scale: 1.1,
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.8)"
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Github className="h-5 w-5" />
                        </motion.span>
                        <motion.span 
                          className="font-medium"
                          whileHover={{ 
                            color: "#a855f7",
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.6)"
                          }}
                        >
                          GitHub
                        </motion.span>
                      </motion.a>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => {
                          try {
                            console.log("NavBar: Initiating logout");
                            // Close mobile menu
                            setMobileMenuOpen(false);
                            
                            // First try the regular logout to properly clean up auth state
                            try {
                              logout();
                            } catch (e) {
                              console.error("Error during regular logout call:", e);
                            }
                            
                            // Then force logout to ensure clean exit
                            forceLogout();
                          } catch (error) {
                            console.error("NavBar: Critical error during logout:", error);
                            // Last resort direct reload
                            window.location.href = '/';
                          }
                        }}
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full text-left"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Log Out</span>
                      </button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => {
                          goToLogin();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full text-left"
                      >
                        <LogIn className="h-5 w-5" />
                        <span className="font-medium">Login</span>
                      </button>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => {
                          goToSignup();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center py-3 px-4 rounded-lg bg-wolzi-accent hover:bg-wolzi-accent-hover text-white gap-3 w-full text-left"
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Sign Up</span>
                      </button>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.a
                        href="https://github.com/DiaeEddineJamal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full transition-all duration-300 ease-in-out"
                        onClick={() => setMobileMenuOpen(false)}
                        whileHover={{ 
                          backgroundColor: "rgba(168, 85, 247, 0.15)",
                          textShadow: "0 0 8px rgba(168, 85, 247, 0.6)"
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          whileHover={{ 
                            scale: 1.1,
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.8)"
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Github className="h-5 w-5" />
                        </motion.span>
                        <motion.span 
                          className="font-medium"
                          whileHover={{ 
                            color: "#a855f7",
                            textShadow: "0 0 8px rgba(168, 85, 247, 0.6)"
                          }}
                        >
                          GitHub
                        </motion.span>
                      </motion.a>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <style>{`
        .green-glow {
          text-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .pulse-animation {
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>
    </header>
  );
};

export default NavBar;
