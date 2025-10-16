import React, { useEffect } from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Scroll to top on route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check if current page is home page
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-hidden">
      {/* Global NavBar - appears on all pages */}
      <NavBar />
      
      {/* Main content with conditional padding - no padding for home page to allow seamless hero banner */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.15,
            ease: "easeInOut"
          }}
          style={{ 
            willChange: "opacity",
            position: "relative" 
          }}
          className={`flex-grow transition-all duration-300 overflow-x-hidden ${
            isHomePage ? '' : 'pt-24 lg:pt-28'
          }`}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      
      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
