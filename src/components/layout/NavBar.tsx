
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, User, Heart, History, LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavBar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would come from auth context in a real app

  const handleScroll = () => {
    if (window.scrollY > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-md shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-wolzi-accent">
              Wolzi<span className="text-white">Flix</span>
            </h1>
          </Link>
          
          <nav className="hidden md:flex ml-10 space-x-6">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/movies" className="nav-link">Movies</Link>
            <Link to="/tv-series" className="nav-link">TV Series</Link>
            <Link to="/anime" className="nav-link">Anime</Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites" className="flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    <span>Favorites</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/watch-history" className="flex items-center">
                    <History className="h-4 w-4 mr-2" />
                    <span>Watch History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setIsLoggedIn(true)}>
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md absolute top-full left-0 right-0 py-4 shadow-md animate-fade-in">
          <nav className="flex flex-col space-y-4 px-6">
            <Link to="/" className="nav-link py-2" onClick={toggleMobileMenu}>
              Home
            </Link>
            <Link to="/movies" className="nav-link py-2" onClick={toggleMobileMenu}>
              Movies
            </Link>
            <Link to="/tv-series" className="nav-link py-2" onClick={toggleMobileMenu}>
              TV Series
            </Link>
            <Link to="/anime" className="nav-link py-2" onClick={toggleMobileMenu}>
              Anime
            </Link>
            <Link to="/search" className="nav-link py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
              <Search className="h-4 w-4" />
              Search
            </Link>
            <div className="pt-2 border-t border-gray-700">
              {isLoggedIn ? (
                <>
                  <Link to="/profile" className="nav-link py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link to="/favorites" className="nav-link py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                    <Heart className="h-4 w-4" />
                    Favorites
                  </Link>
                  <Link to="/watch-history" className="nav-link py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                    <History className="h-4 w-4" />
                    Watch History
                  </Link>
                  <Button 
                    variant="link" 
                    className="nav-link px-0 py-2" 
                    onClick={() => {
                      setIsLoggedIn(false);
                      toggleMobileMenu();
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mt-2 flex items-center justify-center gap-2"
                  onClick={() => {
                    setIsLoggedIn(true);
                    toggleMobileMenu();
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;
