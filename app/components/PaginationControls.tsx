'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange,
}: PaginationControlsProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Left: Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          data-testid="rows-per-page-select"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
          Showing {startItem}-{endItem} of {totalItems} jobs
        </span>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
          aria-label="Previous page"
          data-testid="prev-page-button"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`
              min-w-[40px] h-10 px-3 rounded-md text-sm font-medium
              ${page === currentPage
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : page === '...'
                ? 'cursor-default text-gray-400 dark:text-gray-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }
              disabled:cursor-default
            `}
            data-testid={typeof page === 'number' ? `page-${page}-button` : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
          aria-label="Next page"
          data-testid="next-page-button"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

