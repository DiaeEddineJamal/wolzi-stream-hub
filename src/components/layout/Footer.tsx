import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  // Get Google AdSense client ID from environment variables
  const adClientId = import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID;
  // Replace with your actual footer ad slot ID from Google AdSense dashboard
  const footerAdSlot = import.meta.env.VITE_GOOGLE_ADS_FOOTER_SLOT || '';

  // Dynamically import ad component to prevent crashes if blocked
  const [AdBanner, setAdBanner] = React.useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    if (adClientId && footerAdSlot) {
      // Dynamically import to prevent module loading errors
      import('@/components/ads')
        .then((module) => {
          setAdBanner(() => module.AdBanner);
        })
        .catch((error) => {
          // Silently handle - ad blockers may prevent module loading
          console.log('Ad component could not be loaded (may be blocked)');
        });
    }
  }, [adClientId, footerAdSlot]);

  return (
    <footer className="mt-auto py-8 bg-black/60 backdrop-blur-md">
      {/* Example: Add banner ad above footer content */}
      {adClientId && footerAdSlot && AdBanner && (
        <div className="container mx-auto px-4 mb-6">
          <AdBanner
            adClient={adClientId}
            adSlot={footerAdSlot}
            position="top"
          />
        </div>
      )}
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4 text-wolzi-accent">
              WolziFlix
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Your premier destination for streaming movies, TV series, and anime. 
              Enjoy a vast library of content anytime, anywhere.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Browse</h3>
            <ul className="space-y-2">
              <li><Link to="/movies" className="text-gray-400 hover:text-white text-sm transition-colors">Movies</Link></li>
              <li><Link to="/tv-series" className="text-gray-400 hover:text-white text-sm transition-colors">TV Series</Link></li>
              <li><Link to="/anime" className="text-gray-400 hover:text-white text-sm transition-colors">Anime</Link></li>
              <li><Link to="/trending" className="text-gray-400 hover:text-white text-sm transition-colors">Trending</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">Sign Up</Link></li>
              <li><Link to="/profile" className="text-gray-400 hover:text-white text-sm transition-colors">My Profile</Link></li>
              <li><Link to="/watch-history" className="text-gray-400 hover:text-white text-sm transition-colors">Watch History</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/help" className="text-gray-400 hover:text-white text-sm transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} WolziFlix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
