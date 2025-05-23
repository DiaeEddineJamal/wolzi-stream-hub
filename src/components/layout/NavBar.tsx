import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Heart, History, LogIn, Menu, X, Home, Film, Tv, TrendingUp, LogOut, ChevronDown, Github } from "lucide-react";
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

// Interface for user profile data from AuthContext
interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isLoggedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // New states for real-time search
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    
    lastScrollTop.current = currentScrollY;
  };

  useEffect(() => {
    const throttledHandleScroll = () => {
      // Using requestAnimationFrame for better performance
      window.requestAnimationFrame(handleScroll);
    };
    
    window.addEventListener("scroll", throttledHandleScroll);
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [scrolled, mobileMenuOpen]);

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
      { title: "Popular", path: "/view-all/movies/popular" },
      { title: "Top Rated", path: "/view-all/movies/top-rated" },
      { title: "Upcoming", path: "/view-all/movies/upcoming" },
    ],
    tvSeries: [
      { title: "Popular", path: "/view-all/tv/popular" },
      { title: "Top Rated", path: "/view-all/tv/top-rated" },
      { title: "On Air", path: "/view-all/tv/on-air" },
    ],
    anime: [
      { title: "Popular", path: "/view-all/anime/popular" },
      { title: "Top Rated", path: "/view-all/anime/top-rated" },
      { title: "On Air", path: "/view-all/anime/on-air" },
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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 navbar-glass border-b border-wolzi-accent/20",
        scrolled 
          ? "navbar-glass-scrolled shadow-[0_4px_30px_rgba(0,0,0,0.3)]" 
          : "shadow-none",
        hidden ? "-translate-y-full" : "translate-y-0",
        mobileMenuOpen ? "bg-black/80 h-auto" : ""
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Main Navigation */}
        <div className="flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/" className="flex items-center group">
              <h1 className="text-xl sm:text-2xl font-bold mr-2">
                <motion.span 
                  className="inline-block text-wolzi-accent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 500, damping: 10 }}
                >
                  Wolzi
                </motion.span>
                <motion.span 
                  className="inline-block text-white"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 500, damping: 10 }}
                >
                  Flix
                </motion.span>
              </h1>
            </Link>
          </motion.div>
          
          <div className="hidden lg:flex ml-8">
            <ul className="flex space-x-1">
              {mainNavItems.map((item, index) => (
                <motion.li
                  key={item.title}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "relative px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1.5 overflow-hidden group",
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
                        textShadow: "0 0 8px rgba(29, 185, 84, 0.8)"
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
                        textShadow: "0 0 8px rgba(29, 185, 84, 0.8)"
                      }}
                    >
                      {item.title}
                    </motion.span>
                    
                    {/* Active indicator dot */}
                    {isActivePath(item.path) && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full bg-wolzi-accent"
                        layoutId="activeNavIndicator"
                        initial={{ x: "-50%" }}
                        animate={{ 
                          x: "-50%",
                          boxShadow: ["0 0 0px 0px rgba(29, 185, 84, 0.0)", "0 0 5px 2px rgba(29, 185, 84, 0.5)", "0 0 0px 0px rgba(29, 185, 84, 0.0)"]
                        }}
                        transition={{ 
                          boxShadow: { 
                            repeat: Infinity, 
                            duration: 2,
                            ease: "easeInOut"
                          } 
                        }}
                      />
                    )}
                    
                    {/* Hover underline effect */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-wolzi-accent/70"
                      initial={{ scaleX: 0, originX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right side: Search, Login, User */}
        <div className="flex items-center space-x-1">
          {/* Search Input and Icon */}
          <div className="flex items-center relative" ref={searchContainerRef}>
            <AnimatePresence>
              {showSearch ? (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "240px", opacity: 1 }}
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
                  <Input
                    ref={searchInputRef}
                    id="search-input"
                    type="text"
                    placeholder="Search for movies, TV shows..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pr-10 bg-black/30 border-wolzi-accent/30 focus:border-wolzi-accent 
                              focus-visible:ring-1 focus-visible:ring-wolzi-accent/50 rounded-full text-sm"
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
                  
                  {/* Real-time Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-h-96 overflow-y-auto rounded-md bg-black/90 backdrop-blur-lg border border-wolzi-accent/30 shadow-lg z-50">
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
                            
                            <div className="mt-2 pt-2 border-t border-wolzi-border/20">
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
                    </div>
                  )}
                </motion.form>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSearch}
                  className="text-wolzi-light-gray hover:text-white transition-colors"
                  aria-label="Toggle search"
                >
                  <Search className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              )}
            </AnimatePresence>
          </div>
          
          {/* GitHub Icon */}
          <a 
            href="https://github.com/DiaeEddineJamal" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-wolzi-light-gray hover:text-white transition-colors"
              aria-label="GitHub Profile"
            >
              <Github className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </a>
          
          <div className="hidden sm:block">
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={goToLogin} 
                  variant="ghost" 
                  className="text-sm text-wolzi-light-gray hover:text-white"
                >
                  Login
                </Button>
                <Button 
                  onClick={goToSignup}
                  className="bg-wolzi-accent hover:bg-wolzi-accent-hover text-white text-sm py-1 px-3"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="lg:hidden text-wolzi-light-gray hover:text-white transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden frosted-glass border-t border-wolzi-accent/10 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="space-y-4 mb-6">
                {mainNavItems.map((item) => (
                <motion.div
                    key={item.title}
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
                      <span className="font-medium">{item.title}</span>
                  </Link>
                </motion.div>
              ))}
              </nav>
              
              <div className="py-4 border-t border-wolzi-accent/10">
                <h3 className="text-sm uppercase text-wolzi-light-gray mb-4">Account</h3>
                
                  {isLoggedIn ? (
                  <div className="space-y-4">
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/profile"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Profile</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/favorites"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="h-5 w-5" />
                        <span className="font-medium">Favorites</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Link
                        to="/watch-history"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <History className="h-5 w-5" />
                        <span className="font-medium">History</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <a
                        href="https://github.com/DiaeEddineJamal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Github className="h-5 w-5" />
                        <span className="font-medium">GitHub</span>
                      </a>
                    </motion.div>
                    
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
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
                    <motion.div whileTap={{ scale: 0.98 }}>
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
                    
                    <motion.div whileTap={{ scale: 0.98 }}>
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
                    
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <a
                        href="https://github.com/DiaeEddineJamal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center py-3 px-4 rounded-lg hover:bg-wolzi-accent/10 text-wolzi-light-gray hover:text-white gap-3 w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Github className="h-5 w-5" />
                        <span className="font-medium">GitHub</span>
                      </a>
                    </motion.div>
                    </div>
                  )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply the consistent green accent */}
      <style jsx global>{`
        .green-glow {
          text-shadow: 0 0 8px rgba(29, 185, 84, 0.6);
        }
      `}</style>
    </header>
  );
};

export default NavBar;
