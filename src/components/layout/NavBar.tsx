import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Heart, History, LogIn, Menu, X, Home, Film, Tv, TrendingUp, LogOut, ChevronDown } from "lucide-react";
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
  const { user, isLoggedIn, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const lastScrollY = useRef(0);
  
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
    if (currentScrollY > lastScrollY.current && currentScrollY > 400 && !mobileMenuOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    
    lastScrollY.current = currentScrollY;
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
      setTimeout(() => {
        document.getElementById("search-input")?.focus();
      }, 100);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 navbar-glass border-b border-wolzi-accent/20",
        scrolled 
          ? "navbar-glass-scrolled shadow-[0_4px_30px_rgba(0,0,0,0.3)]" 
          : "shadow-none",
        hidden ? "-translate-y-full" : "translate-y-0",
        mobileMenuOpen ? "bg-black/60" : ""
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
              <h1 className="text-2xl font-bold mr-2">
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
        <div className="hidden md:flex items-center space-x-2">
          <AnimatePresence mode="wait">
            {showSearch ? (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 250, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                className="relative"
                onSubmit={handleSearchSubmit}
              >
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search for movies, shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-black/20 border-wolzi-accent/30 focus:border-wolzi-accent focus-visible:ring-1 focus-visible:ring-wolzi-accent/50 rounded-full text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full text-white/70 hover:text-white"
                  onClick={toggleSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSearch}
                  className="text-white/70 hover:text-white hover:bg-wolzi-accent/10 transition-colors rounded-full"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isLoggedIn ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goToLogin}
                  className="hover:bg-wolzi-accent/10 text-white/80 hover:text-white transition-colors rounded-lg"
                >
                  Log In
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={goToSignup}
                  className="bg-wolzi-accent hover:bg-wolzi-accent text-white rounded-lg transition-colors"
                >
                  Sign Up
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="text-white/70 hover:text-white hover:bg-wolzi-accent/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </motion.div>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden px-4 py-2 frosted-glass border-t border-wolzi-accent/20"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                id="mobile-search-input"
                type="text"
                placeholder="Search movies, shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-black/30 border-wolzi-accent/30 focus:border-wolzi-accent rounded-lg text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-white/70 hover:text-white"
                onClick={toggleSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden frosted-glass-dark absolute top-full left-0 right-0 py-4 shadow-lg border-t border-wolzi-accent/20 overflow-hidden"
          >
            <nav className="flex flex-col space-y-1 px-6">
              {!showSearch && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button 
                    variant="ghost" 
                    className="justify-start py-3 -ml-2 mb-2 w-full text-left text-white/80 hover:text-white hover:bg-wolzi-accent/10" 
                    onClick={() => {
                      toggleSearch();
                      toggleMobileMenu();
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Movies, TV Shows & Anime
                  </Button>
                </motion.div>
              )}
              
              {mainNavItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center py-3 px-2 rounded-md transition-all duration-300",
                      isActivePath(item.path)
                        ? "bg-wolzi-accent/20 text-wolzi-accent"
                        : "hover:bg-wolzi-accent/10 text-white/80 hover:text-wolzi-accent hover:shadow-[0_0_10px_rgba(29,185,84,0.3)]"
                    )}
                    onClick={toggleMobileMenu}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.title}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="pt-4 border-t border-wolzi-accent/20 mt-2">
                  {isLoggedIn ? (
                    <>
                      <Link to="/profile" className="flex items-center gap-2 py-3 px-2 hover:bg-wolzi-accent/10 rounded-md text-white/80 hover:text-white" onClick={toggleMobileMenu}>
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-2 py-3 px-2 hover:bg-wolzi-accent/10 rounded-md text-white/80 hover:text-white" onClick={toggleMobileMenu}>
                        <Heart className="h-4 w-4" />
                        Favorites
                      </Link>
                      <Link to="/watch-history" className="flex items-center gap-2 py-3 px-2 hover:bg-wolzi-accent/10 rounded-md text-white/80 hover:text-white" onClick={toggleMobileMenu}>
                        <History className="h-4 w-4" />
                        Watch History
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="justify-start text-red-400 hover:text-red-500 hover:bg-red-500/10 w-full py-3 px-2 mt-2" 
                        onClick={() => {
                          logout();
                          toggleMobileMenu();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-2 border-wolzi-accent/30 text-white/80 hover:text-white hover:bg-wolzi-accent/10"
                        onClick={() => {
                          goToLogin();
                          toggleMobileMenu();
                        }}
                      >
                        <LogIn className="h-4 w-4" />
                        Log In
                      </Button>
                      <Button 
                        variant="default" 
                        className="w-full bg-wolzi-accent hover:bg-wolzi-accent text-white"
                        onClick={() => {
                          goToSignup();
                          toggleMobileMenu();
                        }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </nav>
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
