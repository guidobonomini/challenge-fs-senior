import React from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PaginationProps {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  showPageSize?: boolean;
  showPageInfo?: boolean;
  showFirstLast?: boolean;
  className?: string;
  compact?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  showPageSize = true,
  showPageInfo = true,
  showFirstLast = false,
  className = '',
  compact = false,
}) => {
  const { page, limit, total, pages } = pagination;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages && newPage !== page) {
      onPageChange(newPage);
    }
  };

  const getVisiblePages = (): number[] => {
    if (compact) {
      // For compact mode, show fewer pages
      const range = 2;
      const start = Math.max(1, page - range);
      const end = Math.min(pages, page + range);
      
      const visiblePages = [];
      for (let i = start; i <= end; i++) {
        visiblePages.push(i);
      }
      return visiblePages;
    }

    // For normal mode, show more pages
    const range = 3;
    let start = Math.max(1, page - range);
    let end = Math.min(pages, page + range);

    // Adjust range to always show the same number of pages when possible
    const totalVisible = end - start + 1;
    const maxVisible = Math.min(pages, range * 2 + 1);
    
    if (totalVisible < maxVisible) {
      if (start === 1) {
        end = Math.min(pages, start + maxVisible - 1);
      } else if (end === pages) {
        start = Math.max(1, end - maxVisible + 1);
      }
    }

    const visiblePages = [];
    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  };

  const visiblePages = getVisiblePages();
  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);

  const pageSizeOptions = [10, 25, 50, 100];

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <span className="text-sm text-gray-500 dark:text-gray-400">No items to display</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Left side - Page info */}
      {showPageInfo && !compact && (
        <div className="flex-1 flex justify-between sm:hidden">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startItem} to {endItem} of {total} results
          </span>
        </div>
      )}
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        {showPageInfo && (
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </p>
            
            {showPageSize && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Per page:
                </label>
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
                  className="border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white text-sm"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Pagination controls */}
        <div className="flex items-center space-x-1">
          {/* First page button */}
          {showFirstLast && pages > 5 && (
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                page === 1
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="First page"
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </button>
          )}

          {/* Previous button */}
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
              page === 1
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          {/* Page numbers */}
          <div className="flex space-x-1">
            {/* Show first page if not in visible range */}
            {!compact && visiblePages[0] > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  1
                </button>
                {visiblePages[0] > 2 && (
                  <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    ...
                  </span>
                )}
              </>
            )}

            {visiblePages.map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pageNum === page
                    ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-400 border'
                    : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Show last page if not in visible range */}
            {!compact && visiblePages[visiblePages.length - 1] < pages && (
              <>
                {visiblePages[visiblePages.length - 1] < pages - 1 && (
                  <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    ...
                  </span>
                )}
                <button
                  onClick={() => handlePageChange(pages)}
                  className="relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {pages}
                </button>
              </>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pages}
            className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
              page === pages
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="Next page"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>

          {/* Last page button */}
          {showFirstLast && pages > 5 && (
            <button
              onClick={() => handlePageChange(pages)}
              disabled={page === pages}
              className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                page === pages
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Last page"
            >
              <ChevronDoubleRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile pagination */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md transition-colors ${
            page === 1
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-white dark:bg-gray-800'
              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300 px-4 py-2">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === pages}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md transition-colors ${
            page === pages
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-white dark:bg-gray-800'
              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;