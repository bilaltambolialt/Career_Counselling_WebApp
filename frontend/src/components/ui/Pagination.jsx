import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Props:
 *   page      — current page (1-based)
 *   totalPages
 *   onPage    — (newPage) => void
 */
const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  for (let i = left; i <= right; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-6 select-none">
      {/* Prev */}
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* First page gap */}
      {left > 1 && (
        <>
          <PageBtn n={1} current={page} onPage={onPage} />
          {left > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
        </>
      )}

      {pages.map((n) => (
        <PageBtn key={n} n={n} current={page} onPage={onPage} />
      ))}

      {/* Last page gap */}
      {right < totalPages && (
        <>
          {right < totalPages - 1 && (
            <span className="px-1 text-gray-400 text-sm">…</span>
          )}
          <PageBtn n={totalPages} current={page} onPage={onPage} />
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const PageBtn = ({ n, current, onPage }) => (
  <button
    onClick={() => onPage(n)}
    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
      n === current
        ? 'bg-indigo-600 text-white shadow'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {n}
  </button>
);

export default Pagination;
