import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Film, Tv, Zap, Globe, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Platform: React.FC = () => {
  useSEO({
    title: 'WolziFlix Platform - Your Ultimate Streaming Destination',
    description: 'Discover WolziFlix, the comprehensive search engine and content aggregator for movies, TV series, and anime. Learn about our features, mission, and how we help you discover entertainment.',
    keywords: ['WolziFlix', 'wolziflix', 'wolziflix platform', 'streaming platform', 'content aggregator', 'movies TV shows anime'],
    type: 'website',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "WolziFlix Platform",
      "description": "Learn about the WolziFlix streaming platform and content discovery features",
      "url": (import.meta.env.VITE_SITE_URL || window.location.origin) + "/platform",
      "mainEntity": {
        "@type": "Organization",
        "name": "WolziFlix",
        "url": (import.meta.env.VITE_SITE_URL || window.location.origin)
      }
    }
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-wolzi-accent">WolziFlix</span> - Your Ultimate Streaming Destination
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-6">
            <strong className="text-wolzi-accent">WolziFlix</strong> is a comprehensive search engine and content aggregator that helps you discover movies, TV series, and anime 
            from multiple sources through one unified, user-friendly interface. Whether you're looking for the latest 
            blockbusters, classic films, trending TV shows, or popular anime series, <strong>WolziFlix</strong> makes it easy to discover 
            and access your favorite entertainment.
          </p>
          <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto mb-8">
            The <strong>WolziFlix</strong> platform features an extensive library of content information spanning every genre imaginable. From action 
            and adventure to romance and comedy, from sci-fi and fantasy to drama and thriller—<strong>WolziFlix</strong> has something 
            for everyone. Our intelligent recommendation system learns your preferences and suggests content tailored 
            to your tastes, making it easier than ever to find your next favorite show or movie on <strong>WolziFlix</strong>.
          </p>
          
          {/* Legal Notice */}
          <div className="bg-black/60 border border-wolzi-border rounded-lg p-4 mt-8 text-left max-w-3xl mx-auto">
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong className="text-white">Legal Notice:</strong> WolziFlix operates as a search engine and content aggregator. 
              We do not host, store, or distribute any video content on our servers. All content is provided by third-party 
              sources. We comply with DMCA (US) and EU Copyright Directive. 
              <Link to="/legal" className="text-wolzi-accent hover:underline ml-1">Learn more about our legal compliance</Link>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Film className="h-10 w-10 text-purple-500 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-3">Vast Content Library</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Access thousands of movies, TV shows, and anime titles from around the world. Our continuously 
                updated catalog ensures you always have fresh content to explore.
              </p>
            </div>
            
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Zap className="h-10 w-10 text-yellow-500 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-3">Seamless Streaming</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enjoy buffer-free streaming with our optimized video player. We aggregate the best sources 
                to ensure smooth playback and high-quality viewing experiences.
              </p>
            </div>
            
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Globe className="h-10 w-10 text-green-500 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-white mb-3">Personalized Experience</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Create an account to track your watch history, receive personalized recommendations, and discover 
                new favorites based on your viewing preferences.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-wolzi-accent hover:bg-purple-700 text-white">
              <Link to="/movies">Explore Movies</Link>
            </Button>
            <Button asChild variant="outline" className="border-wolzi-accent text-wolzi-accent hover:bg-wolzi-accent/10">
              <Link to="/tv-series">Browse TV Series</Link>
            </Button>
            <Button asChild variant="outline" className="border-wolzi-accent text-wolzi-accent hover:bg-wolzi-accent/10">
              <Link to="/anime">Discover Anime</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Platform;

