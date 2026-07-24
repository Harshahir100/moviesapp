// frontend-user/src/components/common/MovieCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Star, Film } from "lucide-react";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  const handleMovieClick = (e) => {
    e.preventDefault();

    const key = `movie_click_${movie.id}`;

    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");

      // 👇 Apna Adsterra Smartlink yahan paste karna
      window.open(
        "https://www.effectivecpmnetwork.com/pg2wg2y1c?key=d0bf263d9d00350b34c8b28d99993007",
      );

      return;
    }

    navigate(
      movie.media_type === "tv" ? `/series/${movie.id}` : `/movie/${movie.id}`,
    );
  };
  // Safe data extraction
  const getYear = () => {
    if (!movie.release_date && !movie.first_air_date) return "N/A";
    const date = movie.release_date || movie.first_air_date;
    return date.split("-")[0] || "N/A";
  };

  const getTitle = () => {
    return movie.title || movie.name || "Unknown";
  };

  const getVoteAverage = () => {
    if (movie.vote_average === null || movie.vote_average === undefined)
      return null;
    const num = parseFloat(movie.vote_average);
    return isNaN(num) ? null : num;
  };
  //   console.log(movie);
  return (
    <Link
      to={
        movie.media_type === "tv" ? `/series/${movie.id}` : `/movie/${movie.id}`
      }
      onClick={handleMovieClick}
      className="block group"
    >
      <div className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-gray-800 hover:border-[#e50914] transition-all hover:transform hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={getTitle()}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h18M3 16h18"/></svg></div>`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film size={40} className="text-gray-600" />
            </div>
          )}

          {getVoteAverage() !== null && (
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 px-2 py-0.5 bg-black/70 rounded-lg">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold text-white">
                {getVoteAverage().toFixed(1)}
              </span>
            </div>
          )}

          {movie.hindi_dubbed_count > 0 && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-600/80 text-[10px] font-semibold rounded">
              🇮🇳 Hindi
            </div>
          )}
        </div>

        <div className="p-2.5">
          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-[#e50914] transition-colors">
            {getTitle()}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-0.5">
            <span>{getYear()}</span>
            {/* {movie.torrent_count > 0 && (
                            <span className="text-gray-500">{movie.torrent_count} torrents</span>
                        )} */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
