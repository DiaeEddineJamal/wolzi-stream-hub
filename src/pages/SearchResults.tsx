import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import tmdbApi, { getPosterUrl } from '@/integrations/api/tmdb';
import ContentSection from '@/components/home/ContentSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      
      setResults(processedResults);
      setTotalResults(data.total_results);
      setTotalPages(data.total_pages);
      setPage(pageNum);
      
      // Filter results by type
      setMovies(processedResults.filter((item: SearchResult) => item.mediaType === 'movie'));
      setTvShows(processedResults.filter((item: SearchResult) => item.mediaType === 'tv'));
      
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search movies, TV shows, anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-lg"
            />
            <Button type="submit" className="glow-button">Search</Button>
          </form>
        </div>
        
        {query && (
          <h1 className="text-3xl font-bold mb-6">
            Search Results for <span className="gradient-text">"{query}"</span>
          </h1>
        )}
        
        {loading && results.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            {results.length === 0 && query ? (
              <div className="text-center p-12 frosted-glass rounded-lg">
                <h2 className="text-xl font-medium mb-2">No Results Found</h2>
                <p className="text-wolzi-light-gray">
                  We couldn't find anything matching your search. Try different keywords or browse our categories.
                </p>
              </div>
            ) : (
              <>
                {movies.length > 0 && (
                  <ContentSection
                    title="Movies"
                    items={movies}
                    className="mb-12"
                  />
                )}
                
                {tvShows.length > 0 && (
                  <ContentSection
                    title="TV Series"
                    items={tvShows}
                    className="mb-12"
                  />
                )}
                
                {totalPages > 1 && page < totalPages && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={handleLoadMore}
                      variant="outline"
                      className="frosted-glass"
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More Results'}
                    </Button>
                  </div>
                )}
                
                {totalResults > 0 && (
                  <div className="text-center text-wolzi-light-gray mt-4">
                    Showing {results.length} of {totalResults} results
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SearchResults; 