import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/layouts/MainLayout';
import MediaCard from '@/components/home/MediaCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

export interface MediaItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  mediaType: 'movie' | 'tv' | 'anime';
  overview?: string;
}

interface ViewAllPageProps {
  title: string;
  fetchDataFunction: (page: number) => Promise<{
    items: MediaItem[];
    totalPages: number;
    totalResults: number;
    hasMore?: boolean; // Optional, as totalPages can derive this
  }>;
}

const ViewAllPage: React.FC<ViewAllPageProps> = ({ title, fetchDataFunction }) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const { items: newItems, totalPages: newTotalPages, totalResults: newTotalResults } = await fetchDataFunction(pageNum);
      setItems(newItems);
      setCurrentPage(pageNum);
      setTotalPages(newTotalPages);
      setTotalResults(newTotalResults);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load items. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [fetchDataFunction]);

  useEffect(() => {
    fetchPageData(1);
  }, [fetchPageData]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchPageData(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchPageData(currentPage + 1);
    }
  };

  const handleGoToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      fetchPageData(pageNum);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5; // Max number of page links to show (excluding prev/next/ellipsis)
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, currentPage + halfMaxPages);

    if (currentPage - halfMaxPages <= 1) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }
    if (currentPage + halfMaxPages >= totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }
    
    if (startPage > 1) {
      pageNumbers.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handleGoToPage(i); }} isActive={i === currentPage}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      pageNumbers.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Simplified pagination: show first, current, last and ellipsis
    // This logic can be expanded for more complex pagination like 1 ... 4 5 6 ... 10
    const pageLinks = [];
    if (totalPages <= 7) { // Show all pages if 7 or less
        for (let i = 1; i <= totalPages; i++) {
            pageLinks.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handleGoToPage(i);}} isActive={i === currentPage}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }
    } else {
        // Always show first page
        pageLinks.push(
            <PaginationItem key={1}>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handleGoToPage(1);}} isActive={1 === currentPage}>1</PaginationLink>
            </PaginationItem>
        );

        // Ellipsis or pages after first
        if (currentPage > 3) {
            pageLinks.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }
        
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
             if (i > 1 && i < totalPages) { // Ensure not duplicating first/last if they fall in range
                pageLinks.push(
                    <PaginationItem key={i}>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handleGoToPage(i);}} isActive={i === currentPage}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        }
        
        // Ellipsis or pages before last
        if (currentPage < totalPages - 2) {
            pageLinks.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
        }

        // Always show last page
        pageLinks.push(
            <PaginationItem key={totalPages}>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handleGoToPage(totalPages);}} isActive={totalPages === currentPage}>
                    {totalPages}
                </PaginationLink>
            </PaginationItem>
        );
    }


    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePrevPage(); }} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}/>
          </PaginationItem>
          {pageLinks}
          <PaginationItem>
            <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleNextPage(); }} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}/>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pt-20 pb-16">
        <h1 className="text-3xl font-bold my-8 text-center text-wolzi-text">{title}</h1>

        {loading && items.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center p-12 bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-medium mb-2 text-red-400">Error</h2>
            <p className="text-wolzi-light-gray">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center p-12 bg-wolzi-dark-blue/40 backdrop-blur-sm border border-wolzi-gray/20 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-medium mb-2">No Results Found</h2>
            <p className="text-wolzi-light-gray">
              We couldn't find any items matching your criteria.
            </p>
          </div>
        )}

        {!error && items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {items.map(item => (
                <MediaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  posterUrl={item.posterUrl}
                  rating={item.rating}
                  year={item.year}
                  mediaType={item.mediaType}
                  description={item.overview || `Details for ${item.title}`}
                  size="medium" // Or make this dynamic if needed
                  showHover={true}
                />
              ))}
            </div>

            <div className="mt-12">
              {renderPagination()}
            </div>
            
            <div className="text-center text-sm text-wolzi-light-gray mt-4">
              Showing {items.length * (currentPage -1) + 1}-{Math.min(items.length * currentPage, totalResults)} of {totalResults} results
            </div>
             <div className="text-center text-sm text-wolzi-light-gray mt-1">
              Page {currentPage} of {totalPages}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ViewAllPage;
