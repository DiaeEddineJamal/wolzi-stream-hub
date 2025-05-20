
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Heart, History, LogIn, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Handle navigation to auth page
  const goToLogin = () => {
    navigate("/auth?mode=login");
  };

  const goToSignup = () => {
    navigate("/auth?mode=signup");
  };

  // Handle scroll effect with throttling for performance
  const handleScroll = () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      if (!scrolled) setScrolled(true);
    } else {
      if (scrolled) setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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

  const navItems = [
    { title: "Home", path: "/" },
    { title: "Movies", path: "/movies" },
    { title: "TV Series", path: "/tv-series" },
    { title: "Anime", path: "/anime" }
  ];

  // Get active link status
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled 
          ? "bg-black/75 backdrop-blur-md shadow-lg py-2" 
          : "bg-gradient-to-b from-black/80 to-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-wolzi-accent to-wolzi-accent-hover bg-clip-text text-transparent">Wolzi</span>
              <span className="text-white">Flix</span>
            </h1>
          </Link>
          
          <NavigationMenu className="hidden md:flex ml-8">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <Link 
                    to={item.path}
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
                      isActivePath(item.path) 
                        ? "text-wolzi-accent" 
                        : "text-white/80 hover:text-white"
                    )}
                  >
                    {item.title}
                    {isActivePath(item.path) && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-wolzi-accent"
                        layoutId="navbar-indicator"
                      />
                    )}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <AnimatePresence>
            {showSearch ? (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 250, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
                onSubmit={handleSearchSubmit}
              >
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8 bg-wolzi-dark-blue/50 border-wolzi-gray/30 focus:border-wolzi-accent"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
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
              >
                <Button variant="ghost" size="icon" onClick={toggleSearch}>
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isLoggedIn ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToLogin}
                className="hover:bg-wolzi-dark-blue/30"
              >
                Log In
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={goToSignup}
                className="bg-wolzi-accent hover:bg-wolzi-accent-hover"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden px-4 py-2 bg-wolzi-dark-blue/80 border-t border-wolzi-gray/20"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                id="mobile-search-input"
                type="text"
                placeholder="Search movies, shows, anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
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
            className="md:hidden bg-black/95 backdrop-blur-lg absolute top-full left-0 right-0 py-4 shadow-lg border-t border-wolzi-gray/20"
          >
            <nav className="flex flex-col space-y-1 px-6">
              {!showSearch && (
                <Button 
                  variant="ghost" 
                  className="justify-start py-3 -ml-2 mb-2" 
                  onClick={toggleSearch}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              )}
              
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.path}
                  className={cn(
                    "py-3 px-2 rounded-md transition-colors",
                    isActivePath(item.path)
                      ? "bg-wolzi-accent/20 text-wolzi-accent"
                      : "hover:bg-wolzi-dark-blue/30"
                  )}
                  onClick={toggleMobileMenu}
                >
                  {item.title}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-700 mt-2">
                {isLoggedIn ? (
                  <>
                    <Link to="/profile" className="flex items-center gap-2 py-3 px-2 hover:bg-wolzi-dark-blue/30 rounded-md" onClick={toggleMobileMenu}>
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-2 py-3 px-2 hover:bg-wolzi-dark-blue/30 rounded-md" onClick={toggleMobileMenu}>
                      <Heart className="h-4 w-4" />
                      Favorites
                    </Link>
                    <Link to="/watch-history" className="flex items-center gap-2 py-3 px-2 hover:bg-wolzi-dark-blue/30 rounded-md" onClick={toggleMobileMenu}>
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
                      Log out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
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
                      className="w-full bg-wolzi-accent hover:bg-wolzi-accent-hover"
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
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default NavBar;
