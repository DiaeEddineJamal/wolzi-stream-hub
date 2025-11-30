import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Film, Tv, Zap, Globe } from 'lucide-react';

const About: React.FC = () => {
  useSEO({
    title: 'About Us - WolziFlix',
    description: 'Learn more about WolziFlix, your premier destination for streaming entertainment.',
    type: 'website'
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center text-wolzi-accent">About WolziFlix</h1>
          <p className="text-xl text-center text-gray-300 mb-12">
            Reimagining how you discover and watch your favorite entertainment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Film className="h-10 w-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Vast Library</h3>
              <p className="text-gray-400">
                Access thousands of movies and TV shows from around the globe. From Hollywood blockbusters to indie gems, we've got it all covered.
              </p>
            </div>
            
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Tv className="h-10 w-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Anime Collection</h3>
              <p className="text-gray-400">
                Dive into our extensive anime collection. Simulcasts, classics, and hidden treasures are all available in high quality.
              </p>
            </div>
            
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Zap className="h-10 w-10 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Fast Streaming</h3>
              <p className="text-gray-400">
                Experience buffer-free streaming with our optimized player. We aggregate the best sources to ensure a smooth viewing experience.
              </p>
            </div>
            
            <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
              <Globe className="h-10 w-10 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Community Driven</h3>
              <p className="text-gray-400">
                Track your watch history, rate content, and discover new favorites through our personalized recommendation engine.
              </p>
            </div>
          </div>

          <div className="space-y-6 text-gray-300">
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p>
              At WolziFlix, we believe entertainment should be accessible and easy to discover. Our mission is to build the ultimate streaming hub 
              that brings together content from various sources into one unified, beautiful interface. We strive to provide the best user experience 
              possible, focusing on speed, design, and community features.
            </p>
            
            <h2 className="text-2xl font-bold text-white mb-4 mt-8">Disclaimer</h2>
            <p>
              WolziFlix is a content aggregator. We do not host any video files on our servers. All content is provided by non-affiliated third parties. 
              We merely provide a user-friendly interface to access publicly available content on the web.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
