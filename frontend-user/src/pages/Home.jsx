// frontend-user/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
// import { getMovies } from '../services/api';  // This will now work
import MovieCard from "../components/common/MovieCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMovies, getSeries } from "../services/api";
const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage]);

  const fetchMovies = async (page) => {
    setLoading(true);

    try {
      const offset = (page - 1) * itemsPerPage;

      const [moviesRes, seriesRes] = await Promise.all([
        getMovies({
          sort: "latest",
          limit: itemsPerPage,
          offset,
        }),
        getSeries({
          sort: "latest",
          limit: itemsPerPage,
          offset,
        }),
      ]);

      const movies = moviesRes.data || [];
      const series = (seriesRes.data || []).map((item) => ({
        ...item,
        media_type: "tv",
      }));

      // Movies + Series combine
      setMovies([...movies, ...series]);

      // Pagination movies ke hisaab se
      if (moviesRes.pagination) {
        setTotalItems(moviesRes.pagination.total);
        setTotalPages(moviesRes.pagination.totalPages);
      } else if (moviesRes.total) {
        setTotalItems(moviesRes.total);
        setTotalPages(Math.ceil(moviesRes.total / itemsPerPage));
      } else {
        setTotalPages(
          Math.ceil((movies.length + series.length) / itemsPerPage),
        );
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 3) {
        endPage = 5;
      }
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-0">
        {/* Movies Grid */}
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center mt-8 space-y-3">
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border ${
                      currentPage === 1
                        ? "border-gray-700 text-gray-500 cursor-not-allowed"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-[#e50914] transition-all"
                    }`}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="w-10 h-10 flex items-center justify-center text-gray-500">
                          …
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === page
                              ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border ${
                      currentPage === totalPages
                        ? "border-gray-700 text-gray-500 cursor-not-allowed"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-[#e50914] transition-all"
                    }`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Page Info */}
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} • {totalItems} items
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No movies found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
