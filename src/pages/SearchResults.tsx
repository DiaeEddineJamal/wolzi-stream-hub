import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import ContentSection from '@/components/home/ContentSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  posterUrl: string;
  rating: number;
  year: string;
  mediaType: 'movie' | 'tv' | 'person';
  overview?: string;
}

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [movies, setMovies] = useState<SearchResult[]>([]);
  const [tvShows, setTvShows] = useState<SearchResult[]>([]);
  const [people, setPeople] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [totalResults, setTotalResults] = useState(0);
  const [totalMovies, setTotalMovies] = useState(0);
  const [totalTvShows, setTotalTvShows] = useState(0);
  const [totalPeople, setTotalPeople] = useState(0);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      searchContent(query);
    }
  }, [query]);

  const searchContent = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      console.log('Performing search for:', searchTerm);
      const response = await tmdbApi.searchMulti(searchTerm, 1);
      console.log('Search response:', response);
      
      if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
        console.error('Invalid search response structure:', response);
        setResults([]);
        setMovies([]);
        setTvShows([]);
        setPeople([]);
        setTotalResults(0);
        return;
      }
      
      const { data } = response;
      console.log('Search results count:', data.results.length);
      
      const processedResults = data.results.map((result: any) => {
        // Ensure we have all required fields or provide defaults
        return {
          id: result.id?.toString() || '',
          title: result.title || result.name || 'Unknown Title',
        posterUrl: getPosterUrl(result.poster_path || result.profile_path) || "https://via.placeholder.com/500x750?text=No+Image",
        rating: result.vote_average || 0,
        year: (result.release_date || result.first_air_date || "").substring(0, 4),
          mediaType: result.media_type || 'unknown',
          overview: result.overview || ''
        };
      });
      
        setResults(processedResults);
      setTotalResults(data.total_results || 0);
      
      // Filter results by type
      const newMovies = processedResults.filter((item: SearchResult) => item.mediaType === 'movie');
      const newTvShows = processedResults.filter((item: SearchResult) => item.mediaType === 'tv');
      const newPeople = processedResults.filter((item: SearchResult) => item.mediaType === 'person');
      
      console.log('Filtered results:', {
        movies: newMovies.length,
        tvShows: newTvShows.length,
        people: newPeople.length
      });
      
        setMovies(newMovies);
        setTvShows(newTvShows);
        setPeople(newPeople);
      
      // Calculate totals for each category
      const movieTotal = data.results.filter((item: any) => item.media_type === 'movie').length;
      const tvTotal = data.results.filter((item: any) => item.media_type === 'tv').length;
      const peopleTotal = data.results.filter((item: any) => item.media_type === 'person').length;
      
      setTotalMovies(movieTotal);
      setTotalTvShows(tvTotal);
      setTotalPeople(peopleTotal);
      
    } catch (error) {
      console.error('Error searching content:', error);
      // Reset all state on error
      setResults([]);
      setMovies([]);
      setTvShows([]);
      setPeople([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      searchContent(searchQuery);
    }
  };

  const getViewAllUrl = (type: 'movie' | 'tv' | 'person') => {
    if (!query.trim()) return '#'; // Don't navigate if query is empty
    try {
      console.log(`Creating view all URL for type: ${type}, query: ${query}`);
      return `/view-all?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query.trim())}`;
    } catch (error) {
      console.error('Error creating view all URL:', error);
      return '#';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <MainLayout>
      <motion.div 
        className="container mx-auto px-4 pt-24 pb-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={childVariants} className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Search movies, TV shows, anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow bg-wolzi-dark-blue/60 border-wolzi-gray/30 focus:border-wolzi-accent"
            />
            <Button type="submit" className="bg-wolzi-accent hover:bg-wolzi-accent-hover">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </motion.div>
        
        {query && (
          <motion.h1 variants={childVariants} className="text-3xl font-bold mb-8 text-center">
            Search Results for <span className="bg-gradient-to-r from-wolzi-accent to-wolzi-accent-hover bg-clip-text text-transparent">"{query}"</span>
          </motion.h1>
        )}
        
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {results.length === 0 && query ? (
              <motion.div 
                variants={childVariants}
                className="text-center p-12 bg-wolzi-dark-blue/40 backdrop-blur-sm border border-wolzi-gray/20 rounded-lg max-w-2xl mx-auto"
              >
                <h2 className="text-xl font-medium mb-2">No Results Found</h2>
                <p className="text-wolzi-light-gray">
                  We couldn't find anything matching your search. Try different keywords or browse our categories.
                </p>
              </motion.div>
            ) : (
              <>
                {movies.length > 0 && (
                  <motion.div variants={childVariants} className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Movies</h2>
                      <Link 
                        to={getViewAllUrl('movie')}
                        className="flex items-center text-wolzi-accent hover:text-wolzi-accent-hover transition-colors duration-300"
                      >
                        View All <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  <ContentSection
                      title=""
                    items={movies.map(item => ({
                      ...item,
                      mediaType: 'movie' as 'movie' | 'tv' | 'anime'
                    }))}
                      className=""
                  />
                  </motion.div>
                )}
                
                {tvShows.length > 0 && (
                  <motion.div variants={childVariants} className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">TV Series</h2>
                      <Link 
                        to={getViewAllUrl('tv')}
                        className="flex items-center text-wolzi-accent hover:text-wolzi-accent-hover transition-colors duration-300"
                      >
                        View All <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  <ContentSection
                      title=""
                    items={tvShows.map(item => ({
                      ...item,
                      mediaType: 'tv' as 'movie' | 'tv' | 'anime'
                    }))}
                      className=""
                  />
                  </motion.div>
                )}
                
                {totalResults > 0 && (
                  <motion.div 
                    variants={childVariants}
                    className="text-center text-wolzi-light-gray mt-4"
                  >
                    Showing results from the first page. Use "View All" to see more results.
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </MainLayout>
  );
};

export default SearchResults;
