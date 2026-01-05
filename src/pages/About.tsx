import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useSEO } from '@/hooks/useSEO';
import { Film, Tv, Zap, Globe, Users, Shield, Star, TrendingUp } from 'lucide-react';

const About: React.FC = () => {
  useSEO({
    title: 'About WolziFlix | Learn About Our Streaming Platform',
    description: 'Learn about WolziFlix, the premier destination for streaming movies, TV shows, and anime. Discover our mission, features, and commitment to providing the best entertainment experience. WolziFlix is your trusted source for online entertainment.',
    keywords: ['WolziFlix', 'wolziflix', 'about wolziflix', 'wolziflix streaming', 'wolziflix platform', 'streaming platform', 'entertainment hub', 'movies tv shows anime', 'wolziflix about'],
    type: 'website',
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About WolziFlix",
      "description": "Learn about WolziFlix, the premier streaming platform for movies, TV shows, and anime",
      "url": (import.meta.env.VITE_SITE_URL || window.location.origin) + "/about",
      "mainEntity": {
        "@type": "Organization",
        "name": "WolziFlix",
        "url": (import.meta.env.VITE_SITE_URL || window.location.origin),
        "logo": (import.meta.env.VITE_SITE_URL || window.location.origin) + "/website-logo.png",
        "description": "WolziFlix is a premier streaming platform and content aggregator for movies, TV shows, and anime"
      }
    }
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-wolzi-accent">About <span className="text-white">WolziFlix</span></h1>
          <p className="text-xl text-center text-gray-300 mb-12">
            Reimagining how you discover and watch your favorite entertainment.
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-gray-300 mb-16">
            <section>
              <h2 className="text-3xl font-bold text-white mb-4">Who We Are</h2>
              <p className="text-lg leading-relaxed mb-4">
                WolziFlix is a modern streaming platform designed to revolutionize how audiences discover and enjoy entertainment content. 
                Founded with a vision to make quality entertainment accessible to everyone, we've built a comprehensive platform that aggregates 
                content from multiple sources, providing users with a seamless, unified viewing experience.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Our platform serves millions of entertainment enthusiasts worldwide, offering access to an extensive library of movies, 
                television series, and anime content. We understand that in today's digital age, viewers want convenience, quality, and 
                variety—all in one place. That's exactly what WolziFlix delivers.
              </p>
              <p className="text-lg leading-relaxed">
                What sets us apart is our commitment to user experience. We've invested heavily in creating an intuitive interface that 
                makes content discovery effortless. Whether you're looking for the latest blockbuster, a classic TV series, or trending anime, 
                our platform helps you find exactly what you want to watch, when you want to watch it.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Our Core Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
                  <Film className="h-10 w-10 text-purple-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Vast Content Library</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Access thousands of movies and TV shows from around the globe. From Hollywood blockbusters to independent films, 
                    international cinema to cult classics, our library spans every genre and era. We continuously update our catalog 
                    to include the latest releases and timeless favorites, ensuring there's always something new to discover.
                  </p>
                </div>
                
                <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
                  <Tv className="h-10 w-10 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Comprehensive Anime Collection</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Dive into our extensive anime collection featuring simulcasts, classics, and hidden gems. We curate content from 
                    various genres including action, romance, sci-fi, fantasy, and slice-of-life. Our anime section is regularly updated 
                    with new episodes and series, keeping you up-to-date with the latest releases from Japan and beyond.
                  </p>
                </div>
                
                <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
                  <Zap className="h-10 w-10 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Optimized Streaming Experience</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Experience buffer-free streaming with our highly optimized video player. We aggregate the best sources available 
                    and use advanced technology to ensure smooth playback. Our adaptive streaming technology automatically adjusts quality 
                    based on your connection speed, providing the best possible viewing experience.
                  </p>
                </div>
                
                <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
                  <Globe className="h-10 w-10 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Personalized Recommendations</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Track your watch history, rate content, and discover new favorites through our intelligent recommendation engine. 
                    Our system learns your preferences and suggests content tailored to your tastes. The more you watch, the better our 
                    recommendations become, creating a truly personalized entertainment experience.
                  </p>
                </div>

                <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
                  <Users className="h-10 w-10 text-pink-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Community Features</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Join a vibrant community of entertainment enthusiasts. Share your favorite shows, discover what others are watching, 
                    and engage with content through ratings and reviews. Our community-driven approach helps you find hidden gems and 
                    popular titles alike.
                  </p>
                </div>

                <div className="bg-black/40 p-6 rounded-lg border border-wolzi-border backdrop-blur-sm">
                  <Shield className="h-10 w-10 text-cyan-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Safe and Secure</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Your privacy and security are our top priorities. We implement industry-standard security measures to protect your 
                    data and ensure a safe browsing experience. Our platform is regularly updated to address security concerns and 
                    maintain the highest standards of user protection.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission and Values</h2>
              <p className="text-lg leading-relaxed mb-4">
                At WolziFlix, we believe that entertainment should be accessible, enjoyable, and easy to discover. Our mission is to 
                build the ultimate streaming hub that brings together content from various sources into one unified, beautiful interface. 
                We strive to provide the best user experience possible, focusing on speed, design, and community features.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                We value innovation, user satisfaction, and continuous improvement. Every feature we add, every design decision we make, 
                is driven by our commitment to enhancing your entertainment experience. We listen to our community, adapt to changing needs, 
                and constantly evolve to stay at the forefront of streaming technology.
              </p>
              <p className="text-lg leading-relaxed">
                Accessibility is at the heart of what we do. We believe everyone deserves access to quality entertainment, regardless of 
                their location or device. That's why we've built a platform that works seamlessly across desktop, tablet, and mobile devices, 
                ensuring you can enjoy your favorite content wherever you are.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-4">How We Work</h2>
              <p className="text-lg leading-relaxed mb-4">
                WolziFlix operates as a content aggregator and search platform. We do not host any video files on our servers. Instead, 
                we provide a user-friendly interface that helps you discover and access content available from various third-party sources 
                across the internet.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                Our technology continuously scans and indexes available streaming sources, organizing content in a way that makes it easy 
                to find what you're looking for. We aggregate metadata, ratings, descriptions, and other information to create comprehensive 
                content profiles that help you make informed viewing decisions.
              </p>
              <p className="text-lg leading-relaxed">
                We work with multiple content sources to ensure availability and quality. Our system automatically tests and verifies sources 
                to provide you with the best streaming options. If one source isn't working, we seamlessly switch to alternatives, ensuring 
                uninterrupted viewing.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-4">Our Commitment to Quality</h2>
              <p className="text-lg leading-relaxed mb-4">
                Quality is non-negotiable at WolziFlix. We're committed to providing high-quality streaming experiences, accurate content 
                information, and reliable service. Our team continuously monitors platform performance, user feedback, and industry trends 
                to maintain and improve our standards.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                We understand that your time is valuable, and we respect that by ensuring our platform is fast, responsive, and free from 
                unnecessary interruptions. Our interface is designed to be intuitive, allowing you to spend less time searching and more 
                time enjoying your favorite content.
              </p>
            </section>

            <section className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Important Legal Disclaimer</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                <strong className="text-white">WolziFlix is a Search Engine and Content Aggregator:</strong> We operate as a search 
                engine and content discovery platform, similar to how Google indexes web pages. We do not host, store, distribute, or 
                transmit any video files, streaming content, or media files on our servers. All content is provided by non-affiliated 
                third-party sources that are completely independent of WolziFlix.
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                <strong className="text-white">Legal Compliance:</strong> We fully comply with applicable laws including the Digital 
                Millennium Copyright Act (DMCA) in the United States, the EU Copyright Directive, GDPR, and other relevant regulations. 
                We operate within the legal framework of search engines and information location tools, qualifying for safe harbor 
                protections under applicable laws.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">Intellectual Property:</strong> We respect intellectual property rights and have 
                established procedures for handling copyright claims. If you are a content owner and believe that any content indexed 
                by our platform infringes your rights, please contact us through our 
                <a href="/contact" className="text-wolzi-accent hover:underline ml-1">Contact page</a>, and we will address your 
                concerns promptly in accordance with applicable laws.
              </p>
              <p className="text-gray-300 leading-relaxed">
                For detailed legal information, please review our 
                <a href="/legal" className="text-wolzi-accent hover:underline ml-1">Legal Disclaimer</a>, 
                <a href="/terms" className="text-wolzi-accent hover:underline ml-1">Terms of Service</a>, and 
                <a href="/privacy" className="text-wolzi-accent hover:underline ml-1">Privacy Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-4">Join Our Community</h2>
              <p className="text-lg leading-relaxed mb-4">
                WolziFlix is more than just a streaming platform—it's a community of entertainment enthusiasts. We invite you to join us, 
                explore our vast library, and become part of a growing community that shares your passion for movies, TV shows, and anime.
              </p>
              <p className="text-lg leading-relaxed">
                Have questions, suggestions, or feedback? We'd love to hear from you. Visit our Contact page to get in touch with our team. 
                Your input helps us improve and ensures that WolziFlix continues to evolve in ways that benefit our entire community.
              </p>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
