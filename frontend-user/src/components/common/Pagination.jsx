// frontend-user/src/components/common/Pagination.jsx
import React from 'react';

/**
 * Usage:
 * <Pagination currentPage={page} totalPages={826} onPageChange={(p) => setPage(p)} />
 */
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
    if (totalPages <= 1) return null;

    const go = (page) => {
        const target = Math.min(Math.max(page, 1), totalPages);
        if (target !== currentPage) onPageChange?.(target);
    };

    // Build the page list: 1, 2, 3, 4, 5, 6, ..., lastPage  (matches reference image)
    const getPages = () => {
        const pages = [];
        const window = 6; // how many leading numbers to show before the ellipsis

        if (totalPages <= window + 1) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        for (let i = 1; i <= window; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
        return pages;
    };

    const pages = getPages();

    const baseBtn =
        'min-w-[42px] h-[42px] px-3 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors select-none';

    return (
        <nav aria-label="Pagination" className="w-full">
            <div className="bg-[#1c1c1c] border border-white/5 rounded-xl p-3 flex flex-wrap items-center gap-2">
                {pages.map((page, idx) =>
                    page === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className={`${baseBtn} bg-[#2b2b2b] text-gray-400 cursor-default`}
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => go(page)}
                            aria-current={page === currentPage ? 'page' : undefined}
                            className={`${baseBtn} ${
                                page === currentPage
                                    ? 'bg-[#6abf3f] text-white shadow-sm'
                                    : 'bg-[#2b2b2b] text-gray-200 hover:bg-[#3a3a3a]'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => go(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`${baseBtn} bg-[#2b2b2b] text-gray-200 hover:bg-[#3a3a3a] disabled:opacity-40 disabled:cursor-not-allowed px-4`}
                >
                    Next
                </button>
            </div>
        </nav>
    );
};

export default Pagination;