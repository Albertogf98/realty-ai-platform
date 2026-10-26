'use client';

import { useTranslations } from 'next-intl';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const t = useTranslations('Pagination');

  if (totalPages <= 1) return null;

  const pagesToShow = () => {
    const pages = [];
    const maxPages = 3;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
      {/* --- MODO MÓVIL: SOLO FLECHAS --- */}
      <div className="flex sm:hidden gap-4">
        {/* PREV (flecha) */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-yellow-300 border border-yellow-400 rounded 
                     hover:bg-yellow-400 disabled:opacity-40 text-black text-lg"
        >
          «
        </button>

        {/* NEXT (flecha) */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-yellow-300 border border-yellow-400 rounded 
                     hover:bg-yellow-400 disabled:opacity-40 text-black text-lg"
        >
          »
        </button>
      </div>

      {/* --- MODO DESKTOP: COMPLETO --- */}
      <div className="hidden sm:flex gap-2">
        {/* FIRST */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-yellow-300 border border-yellow-400 rounded 
                     hover:bg-yellow-400 disabled:opacity-40 text-black"
        >
          {t('first')}
        </button>

        {/* PREV */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-yellow-300 border border-yellow-400 rounded 
                     hover:bg-yellow-400 disabled:opacity-40 text-black"
        >
          {t('prev')}
        </button>

        {/* PAGE NUMBERS */}
        {pagesToShow().map(num => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`px-3 py-1 rounded ${num === currentPage ? 'bg-yellow-600 text-black' : 'bg-yellow-300 hover:bg-yellow-400'}`}
          >
            {num}
          </button>
        ))}

        {/* NEXT */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-yellow-300 border border-yellow-400 rounded 
                     hover:bg-yellow-400 disabled:opacity-40 text-black"
        >
          {t('next')}
        </button>

        {/* LAST */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-yellow-300 border border-yellow-400 rounded 
                     hover:bg-yellow-400 disabled:opacity-40 text-black"
        >
          {t('last')}
        </button>
      </div>
    </div>
  );
}
