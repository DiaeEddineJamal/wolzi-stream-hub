
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import ContentSection from '@/components/home/ContentSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      searchContent(query);
    }
  }, [query]);

  const searchContent = async (searchTerm: string, pageNum = 1) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await tmdbApi.searchMulti(searchTerm, pageNum);
      
      const processedResults = data.results.map((result: any) => ({
        id: result.id.toString(),
        title: result.title || result.name,
        posterUrl: getPosterUrl(result.poster_path || result.profile_path) || "https://via.placeholder.com/500x750?text=No+Image",
        rating: result.vote_average || 0,
        year: (result.release_date || result.first_air_date || "").substring(0, 4),
        mediaType: result.media_type,
        overview: result.overview
      }));
      
      // If it's the first page, replace results, otherwise append
      if (pageNum === 1) {
        setResults(processedResults);
      } else {
        setResults(prev => [...prev, ...processedResults]);
      }
      
      setTotalResults(data.total_results);
      setTotalPages(data.total_pages);
      setPage(pageNum);
      
      // Filter results by type
      const newMovies = processedResults.filter((item: SearchResult) => item.mediaType === 'movie');
      const newTvShows = processedResults.filter((item: SearchResult) => item.mediaType === 'tv');
      const newPeople = processedResults.filter((item: SearchResult) => item.mediaType === 'person');
      
      if (pageNum === 1) {
        setMovies(newMovies);
        setTvShows(newTvShows);
        setPeople(newPeople);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
        setTvShows(prev => [...prev, ...newTvShows]);
        setPeople(prev => [...prev, ...newPeople]);
      }
      
    } catch (error) {
      console.error('Error searching content:', error);
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

  const handleLoadMore = () => {
    if (page < totalPages) {
      searchContent(query, page + 1);
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
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-wolzi-accent/30 border-t-wolzi-accent rounded-full animate-spin"></div>
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
                  <motion.div variants={childVariants}>
                    <ContentSection
                      title="Movies"
                      items={movies.map(item => ({
                        ...item,
                        mediaType: 'movie' as 'movie' | 'tv' | 'anime'
                      }))}
                      className="mb-12"
                    />
                  </motion.div>
                )}
                
                {tvShows.length > 0 && (
                  <motion.div variants={childVariants}>
                    <ContentSection
                      title="TV Series"
                      items={tvShows.map(item => ({
                        ...item,
                        mediaType: 'tv' as 'movie' | 'tv' | 'anime'
                      }))}
                      className="mb-12"
                    />
                  </motion.div>
                )}
                
                {totalPages > 1 && page < totalPages && (
                  <motion.div 
                    variants={childVariants}
                    className="flex justify-center mt-8"
                  >
                    <Button 
                      onClick={handleLoadMore}
                      variant="outline"
                      className="bg-wolzi-dark-blue/40 backdrop-blur-sm border-wolzi-gray/30 hover:bg-wolzi-dark-blue/60 hover:border-wolzi-accent/50"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-wolzi-light-gray/30 border-t-white rounded-full animate-spin mr-2"></span>
                          Loading...
                        </>
                      ) : 'Load More Results'}
                    </Button>
                  </motion.div>
                )}
                
                {totalResults > 0 && (
                  <motion.div 
                    variants={childVariants}
                    className="text-center text-wolzi-light-gray mt-4"
                  >
                    Showing {results.length} of {totalResults} results
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
