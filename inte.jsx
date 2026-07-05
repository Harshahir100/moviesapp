import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieDetails } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  Film,
  Star,
  Download,
  ArrowLeft,
  TrendingUp,
  Users,
  HardDrive,
} from "lucide-react";
import toast from "react-hot-toast";

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const response = await getMovieDetails(id);
      setMovie(response.data);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      toast.error("Failed to load movie details");
    } finally {
      setLoading(false);
    }
  };

  const openMagnet = (magnet) => {
    if (!magnet) return;
    window.open(magnet, "_blank");
    toast.success("Opening magnet link...");
  };

  const getVoteAverage = () => {
    if (movie?.vote_average == null) return "N/A";
    const num = parseFloat(movie.vote_average);
    return isNaN(num) ? "N/A" : num.toFixed(1);
  };

  const getRuntime = () => {
    if (!movie?.runtime) return null;
    const num = parseInt(movie.runtime);
    return isNaN(num) ? null : `${num}min`;
  };

  const getYear = () => movie?.release_date?.split("-")[0] || "";
  const getGenres = () => movie?.genres || [];
  const getTorrents = () => movie?.torrents || [];

  const getProductionCountries = () => {
    if (!movie?.production_countries) return [];
    try {
      return typeof movie.production_countries === "string"
        ? JSON.parse(movie.production_countries)
        : movie.production_countries;
    } catch {
      return [];
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-400 text-lg">Movie not found</p>
        <Link
          to="/movies"
          className="text-[#e50914] hover:text-red-400 mt-4 inline-block"
        >
          Back to Movies
        </Link>
      </div>
    );
  }

  const torrents = getTorrents();
  const countries = getProductionCountries();
  const runtime = getRuntime();
  const genres = getGenres();
  const rating = getVoteAverage();

  const qualityOrder = ["4K", "1080p", "720p", "480p"];
  const groupedTorrents = {};
  torrents.forEach((t) => {
    const q = t.quality || "Unknown";
    if (!groupedTorrents[q]) groupedTorrents[q] = [];
    groupedTorrents[q].push(t);
  });
  const sortedQualities = Object.keys(groupedTorrents).sort(
    (a, b) => qualityOrder.indexOf(a) - qualityOrder.indexOf(b),
  );

  // Derive unified quality string e.g. "480p | 720p | 1080p"
  const allQualities =
    sortedQualities
      .filter((q) => q !== "Unknown")
      .reverse()
      .join(" | ") || "N/A";

  // Unique sizes across all torrents
  const allSizes =
    [...new Set(torrents.map((t) => t.size).filter(Boolean))].join(", ") ||
    "N/A";

  // Unique formats
  const allFormats =
    [...new Set(torrents.map((t) => t.format).filter(Boolean))].join(", ") ||
    "MKV";

  // Subtitles
  const subtitles = torrents.some((t) => t.subtitle || t.is_esub)
    ? "HC-ESub"
    : movie.subtitle || "N/A";
  const isHindiDubbed = torrents.some((t) => t.is_hindi_dubbed);

  // Detail rows
  const detailRows = [
    { label: "Full Name", value: movie.title || "N/A" },
    {
      label: "Language",
      value: `${movie.original_language?.toUpperCase() || "N/A"}${
        isHindiDubbed ? " / Hindi Dubbed" : ""
      }`,
    },
    { label: "Released Year", value: getYear() || "N/A" },
    { label: "Size", value: allSizes },
    { label: "Quality", value: allQualities },
    { label: "Genres", value: genres.map((g) => g.name).join(", ") || "N/A" },
    { label: "Cast", value: movie.cast || "N/A" },
    { label: "Format", value: allFormats },
    { label: "Subtitle", value: subtitles },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <Link
        to="/movies"
        className="inline-flex items-center space-x-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </Link>

      {/* Movie Header - same size/layout as SeriesDetail */}
      <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 p-4">
          <div className="flex justify-center md:justify-start">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-[260px] rounded-lg shadow-2xl"
              />
            ) : (
              <div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center">
                <Film size={48} className="text-gray-600" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span className="text-white font-semibold">{rating}</span>
              </div>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{getYear() || "N/A"}</span>
              {runtime && (
                <>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-400">{runtime}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <span
                  key={genre.id || genre.name}
                  className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-300 border border-gray-700"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {movie.cast && (
              <p className="text-sm">
                <span className="text-gray-400 font-semibold">Stars: </span>
                <span className="text-yellow-500">{movie.cast}</span>
              </p>
            )}

            <p className="text-sm leading-relaxed">
              <span className="text-gray-400 font-semibold">Summary: </span>
              <span className="text-gray-200">
                {movie.overview || "No overview available."}
              </span>
            </p>

            <div className="space-y-1.5 text-sm">
              {movie.director && (
                <p>
                  <span className="text-gray-400 font-semibold">
                    Director:{" "}
                  </span>
                  <span className="text-white">{movie.director}</span>
                </p>
              )}
              {movie.writer && (
                <p>
                  <span className="text-gray-400 font-semibold">
                    Writer:{" "}
                  </span>
                  <span className="text-white">{movie.writer}</span>
                </p>
              )}
              {countries.length > 0 && (
                <p>
                  <span className="text-gray-400 font-semibold">
                    Countries:{" "}
                  </span>
                  <span className="text-white">{countries.join(", ")}</span>
                </p>
              )}
              {movie.original_language && (
                <p>
                  <span className="text-gray-400 font-semibold">
                    Languages:{" "}
                  </span>
                  <span className="text-white">
                    {movie.original_language.toUpperCase()}
                  </span>
                </p>
              )}
            </div>

            {movie.hindi_dubbed_count > 0 && (
              <p className="text-green-400 text-sm font-medium">
                🇮🇳 Hindi Dubbed Available
              </p>
            )}

            <div className="pt-1">
              <a
                href={`https://www.imdb.com/find/?q=${encodeURIComponent(movie.title || "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#f5c518] text-black font-black text-sm px-2.5 py-1 rounded leading-none tracking-wide"
              >
                IMDb
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* BollyFlix Movie Details block */}
      <div className="mt-6 bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden px-6 py-6">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-[#e50914] mb-6">
          Download {movie.title} ({getYear()}) Hindi Movie ~ BollyFlix
        </h2>

        <h3 className="text-lg font-bold text-white mb-4">Movie Details :</h3>
        <ul className="space-y-2.5 mb-8">
          {detailRows.map(({ label, value }) => (
            <li
              key={label}
              className="flex items-start gap-3 text-sm sm:text-base"
            >
              <span className="mt-1.5 w-2 h-2 flex-shrink-0 bg-[#e50914]" />
              <p className="text-gray-100">
                <span className="font-bold text-white">{label}: </span>
                {value}
              </p>
            </li>
          ))}
        </ul>

        {movie.overview && (
          <>
            <h3 className="text-lg font-bold text-white mb-3">Storyline:</h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {movie.overview}
            </p>
          </>
        )}
      </div>

      {/* Torrents */}
      <div className="mt-6">
        {torrents.length > 0 ? (
          <>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Download size={20} className="text-[#e50914]" />
              <span>Download Torrents</span>
              <span className="text-sm text-gray-400 font-normal">
                ({torrents.length})
              </span>
            </h2>

            <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-5 space-y-5">
              {sortedQualities.map((quality) => {
                const qTorrents = groupedTorrents[quality];
                if (!qTorrents?.length) return null;

                return qTorrents.map((torrent, index) => {
                  const torrentTitle =
                    torrent.title ||
                    torrent.torrent_title ||
                    movie.title ||
                    "Unknown Torrent";

                  return (
                    <div
                      key={torrent.id || `${quality}-${index}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <p className="text-gray-300 text-sm text-center max-w-xl line-clamp-2">
                        {torrentTitle}{" "}
                        {torrent.is_hindi_dubbed && (
                          <span className="text-gray-300">
                            in Hindi Dubbed
                          </span>
                        )}{" "}
                        {torrent.size}
                        {" GB"}
                      </p>

                      <button
                        onClick={() =>
                          openMagnet(torrent.magnet_link || torrent.magnetLink)
                        }
                        className="w-full max-w-sm py-3 rounded-lg border-2 border-[#e50914] bg-[#e50914] hover:bg-red-700 hover:border-red-700 text-white font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2 shadow-md shadow-[#e50914]/20"
                      >
                        <Download size={17} />
                        Download
                      </button>

                      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                        {torrent.size && (
                          <span className="flex items-center gap-1">
                            <HardDrive size={12} /> {torrent.size}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-green-500">
                          <TrendingUp size={12} /> {torrent.seeders || 0}{" "}
                          seeders
                        </span>
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Users size={12} /> {torrent.leechers || 0} leechers
                        </span>
                        {torrent.is_hindi_dubbed && (
                          <span className="text-green-400">
                            🇮🇳 Hindi Dubbed
                          </span>
                        )}
                      </div>

                      <hr className="w-full border-gray-800 mt-1" />
                    </div>
                  );
                });
              })}
            </div>
          </>
        ) : (
          <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400">No torrents available for this movie</p>
            <p className="text-gray-600 text-sm mt-1">
              Check back later or search for another movie
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;