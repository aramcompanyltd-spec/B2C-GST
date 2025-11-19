
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const handlePrev = () => { if (currentPage > 1) onPageChange(currentPage - 1); };
  const handleNext = () => { if (currentPage < totalPages) onPageChange(currentPage + 1); };

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  if (currentPage > totalPages - 3) {
    startPage = Math.max(1, totalPages - 4);
  }

  const pages = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex justify-between items-center mt-4 text-sm">
      <div>
        <p className="text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </p>
      </div>
      <nav className="flex items-center space-x-2">
        <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
        {pages.map(page => (
          <button key={page} onClick={() => onPageChange(page)} className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'border'}`}>
            {page}
          </button>
        ))}
        <button onClick={handleNext} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
      </nav>
    </div>
  );
};

export default Pagination;
