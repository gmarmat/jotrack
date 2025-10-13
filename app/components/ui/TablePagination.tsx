'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems,
}: TablePaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

  return (
    <div 
      className="flex items-center justify-between py-3 px-4 bg-gray-50 border-t border-gray-200 rounded-b-lg"
      data-testid="table-pagination"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Left: Info */}
      <div className="text-sm text-gray-600">
        {totalItems ? (
          <span>Showing <span className="font-medium">{startItem}-{endItem}</span> of <span className="font-medium">{totalItems}</span></span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* Center: Page Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
          data-testid="pagination-previous"
        >
          <ChevronLeft size={18} />
        </button>

        <select
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          data-testid="pagination-select"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              Page {page}
            </option>
          ))}
        </select>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
          data-testid="pagination-next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right: Keyboard Hint */}
      <div className="text-xs text-gray-500">
        <kbd className="px-1 py-0.5 bg-gray-200 rounded">←</kbd>
        {' '}
        <kbd className="px-1 py-0.5 bg-gray-200 rounded">→</kbd>
      </div>
    </div>
  );
}

