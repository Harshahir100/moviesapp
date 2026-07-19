// frontend-user/src/pages/SeriesDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSeriesDetails } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SeriesTorBoxDownload from "../components/SeriesTorBoxDownload"; // ✅ Changed
import {
  Star,
  Calendar,
  Tv,
  ArrowLeft,
  Download,
  Copy,
  Check,
  TrendingUp,
  Users,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Cloud,
} from "lucide-react";
import toast from "react-hot-toast";

const SeriesDetail = () => {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [copied, setCopied] = useState(null);
  const [showTorBox, setShowTorBox] = useState(false);
  const [selectedTorrent, setSelectedTorrent] = useState(null);

  useEffect(() => {
    fetchSeriesDetails();
  }, [id]);

  const fetchSeriesDetails = async () => {
    setLoading(true);
    try {
      const response = await getSeriesDetails(id);
      console.log("Series Data:", response.data);
      setSeries(response.data);
    } catch (error) {
      console.error("Error fetching series details:", error);
      toast.error("Failed to load series details");
    } finally {
      setLoading(false);
    }
  };

  const toggleSeason = (seasonNumber) => {
    setExpandedSeasons((prev) => ({
      ...prev,
      [seasonNumber]: !prev[seasonNumber],
    }));
  };

  const copyMagnet = (magnet, id) => {
    if (!magnet) return;
    navigator.clipboard
      .writeText(magnet)
      .then(() => {
        setCopied(id);
        toast.success("Magnet link copied!");
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  };

  const openMagnet = (magnet) => {
    if (!magnet) return;
    window.open(magnet, "_blank");
    toast.success("Opening magnet link...");
  };

  // ✅ TorBox function for series
  const openTorBox = (torrent) => {
    if (!series || !torrent) return;

    const getLanguage = () => {
      if (series?.original_language) {
        const lang = series.original_language.toUpperCase();
        if (torrent?.is_hindi_dubbed) {
          return `${lang} / Hindi Dubbed`;
        }
        return lang;
      }
      const title = torrent?.title || torrent?.torrent_title || "";
      const titleLower = title.toLowerCase();
      if (titleLower.includes('hindi') || titleLower.includes('hin')) {
        return torrent?.is_hindi_dubbed ? "Hindi Dubbed" : "Hindi";
      }
      if (titleLower.includes('english') || titleLower.includes('eng')) {
        return "English";
      }
      if (torrent?.is_hindi_dubbed) {
        return "Hindi Dubbed";
      }
      return "N/A";
    };

    const seriesData = {
      id: series.id,
      title: series.title || series.name,
      poster_path: series.poster_path,
      overview: series.overview,
      release_date: series.first_air_date,
      vote_average: series.vote_average,
      magnet_link: torrent.magnet_link || torrent.magnetLink,
      file_size_text: torrent.size,
      quality: torrent.quality,
      seeders: torrent.seeders,
      leechers: torrent.leechers,
      original_language: series.original_language || "",
      is_hindi_dubbed: torrent.is_hindi_dubbed || false,
      language: getLanguage(),
      torrent_title: torrent.title || torrent.torrent_title,
    };
    
    console.log("📤 Sending to TorBox (Series):", seriesData);
    setSelectedTorrent(seriesData);
    setShowTorBox(true);
  };

  // Safe data functions
  const getTitle = () => {
    if (!series) return "Unknown Series";
    return series.title || series.name || "Unknown Series";
  };

  const getVoteAverage = () => {
    if (series?.vote_average === null || series?.vote_average === undefined)
      return "N/A";
    const num = parseFloat(series.vote_average);
    return isNaN(num) ? "N/A" : num.toFixed(1);
  };

  const getYear = () => {
    if (!series?.first_air_date) return "N/A";
    return series.first_air_date.split("-")[0] || "N/A";
  };

  const getSeasonsCount = () => {
    return series?.number_of_seasons || series?.seasons?.length || 0;
  };

  const getEpisodesCount = () => {
    return series?.number_of_episodes || 0;
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-400 text-lg">Series not found</p>
        <Link
          to="/series"
          className="text-[#e50914] hover:text-red-400 mt-4 inline-block"
        >
          Back to Series
        </Link>
      </div>
    );
  }

  const countries = series?.production_countries || [];
  const torrents = series.torrents || [];

  const allSizes =
    [...new Set(torrents.map((t) => t.size).filter(Boolean))].join(", ") ||
    "N/A";

  const allFormats =
    [...new Set(torrents.map((t) => t.format).filter(Boolean))].join(", ") ||
    "MKV";

  const subtitles = torrents.some((t) => t.subtitle || t.is_esub)
    ? "HC-ESub"
    : series.subtitle || "N/A";

  const isHindiDubbed = torrents.some((t) => t.is_hindi_dubbed);

  const starsValue =
    series.stars?.length > 0
      ? series.stars.join(", ")
      : series.cast?.length > 0
        ? series.cast.map((c) => c.name).join(", ")
        : "N/A";

  const detailRows = [
    { label: "Full Name", value: getTitle() },
    {
      label: "Language",
      value: `${series.original_language?.toUpperCase() || "N/A"}${
        isHindiDubbed ? " / Hindi Dubbed" : ""
      }`,
    },
    { label: "Released Year", value: getYear() },
    { label: "Seasons", value: getSeasonsCount() || "N/A" },
    { label: "Episodes", value: getEpisodesCount() || "N/A" },
    {
      label: "Genres",
      value: series.genres?.map((g) => g.name).join(", ") || "N/A",
    },
    { label: "Cast", value: starsValue },
    ...(series.creator ? [{ label: "Creator", value: series.creator }] : []),
    { label: "Size", value: allSizes },


    {
      label: "Quality",
      value: torrents[0]?.quality || "N/A",
    },
    { label: "Format", value: allFormats },
    { label: "Subtitle", value: subtitles },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <Link
        to="/series"
        className="inline-flex items-center space-x-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </Link>

      {/* Series Header */}
      <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 p-4">
          <div className="relative flex justify-center md:justify-start">
            {series.poster_path ? (
              <>
                <img
                  src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                  alt={getTitle()}
                  className="w-[260px] rounded-xl border-2 border-yellow-400 shadow-2xl"
                />
                <div className="absolute -bottom-3 left-3 bg-yellow-400 text-black font-bold text-sm px-3 py-1 rounded-r-lg rounded-tl-lg shadow-lg flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  {getVoteAverage()}
                </div>
              </>
            ) : (
              <div className="w-[260px] h-[390px] bg-gray-800 rounded-xl flex items-center justify-center border-2 border-yellow-400">
                <Tv size={48} className="text-gray-600" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-[#f5c518]">
              {getTitle()}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span className="text-white font-semibold">
                  {getVoteAverage()}
                </span>
              </div>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{getYear()}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{getSeasonsCount()} Seasons</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">
                {getEpisodesCount()} Episodes
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {series.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-[#f5c518] border border-gray-700"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {(series.stars?.length > 0 || series.cast?.length > 0) && (
              <p className="text-sm">
                <span className="text-gray-400 font-semibold">Stars: </span>
                <span className="text-yellow-500">
                  {(series.stars || series.cast.map((c) => c.name)).join(", ")}
                </span>
              </p>
            )}

            <p className="text-sm leading-relaxed">
              <span className="text-gray-400 font-semibold">Summary: </span>
              <span className="text-gray-200">
                {series.overview || "No overview available."}
              </span>
            </p>

            <div className="space-y-1.5 text-sm">
              {series.director && (
                <p>
                  <span className="text-gray-400 font-semibold">
                    Director:{" "}
                  </span>
                  <span className="text-white">{series.director}</span>
                </p>
              )}
              {series.writer && (
                <p>
                  <span className="text-gray-400 font-semibold">Writer: </span>
                  <span className="text-white">{series.writer}</span>
                </p>
              )}
              {series.creator && (
                <p>
                  <span className="text-gray-400 font-semibold">Creator: </span>
                  <span className="text-white">{series.creator}</span>
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
              {series.original_language && (
                <p>
                  <span className="text-gray-400 font-semibold">
                    Languages:{" "}
                  </span>
                  <span className="text-white">
                    {series.original_language.toUpperCase()}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Series Details block */}
      <div className="mt-6 bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden px-6 py-6">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-[#f5c518] mb-6">
          Download {getTitle()} ({getYear()}) Hindi Web Series ~ BollyFlix
        </h2>

        <h3 className="text-lg font-bold text-white mb-4">Series Details :</h3>
        <ul className="space-y-2.5 mb-8">
          {detailRows.map(({ label, value }) => (
            <li
              key={label}
              className="flex items-start gap-3 text-sm sm:text-base"
            >
              <span className="mt-1.5 w-2 h-2 flex-shrink-0 bg-[#f5c518]" />
              <p className="text-gray-100">
                <span className="font-bold text-white">{label}: </span>
                {value}
              </p>
            </li>
          ))}
        </ul>

        {series.overview && (
          <>
            <h3 className="text-lg font-bold text-white mb-3">Storyline:</h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {series.overview}
            </p>
          </>
        )}
      </div>

      {/* Seasons & Episodes */}
      {series.seasons && series.seasons.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <Download size={20} className="text-[#e50914]" />
            <span>Single Episode</span>
          </h2>
          <div className="space-y-3">
            {series.seasons.map((season) => {
              const hasEpisodes = season.episodes && season.episodes.length > 0;

              return (
                <div
                  key={season.season_number}
                  className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSeason(season.season_number)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-semibold">
                        Season {season.season_number}
                      </span>
                      <span className="text-sm text-gray-400">
                        {season.episode_count || 0} episodes
                      </span>
                    </div>
                    {expandedSeasons[season.season_number] ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </button>

                  {expandedSeasons[season.season_number] && (
                    <div className="border-t border-gray-800 p-3 space-y-3 max-h-96 overflow-y-auto">
                      {hasEpisodes ? (
                        season.episodes.map((episode) => {
                          const episodeTorrents = episode.torrents || [];
                          const hasTorrents = episodeTorrents.length > 0;

                          return (
                            <div
                              key={episode.episode_number}
                              className="flex flex-col p-3 bg-gray-800/30 rounded-lg hover:bg-gray-700/40 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-[#f5c518] bg-[#f5c518]/10 px-2 py-0.5 rounded">
                                    E{episode.episode_number}
                                  </span>
                                  <span className="text-sm text-white font-medium">
                                    {episode.episode_title ||
                                      episode.name ||
                                      `Episode ${episode.episode_number}`}
                                  </span>
                                </div>
                              </div>

                              {hasTorrents ? (
                                <div className="mt-2 space-y-2">
                                  {episodeTorrents.map((torrent, tIndex) => (
                                    <div
                                      key={tIndex}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#111] rounded-lg p-2.5 border border-gray-700/50 hover:border-[#e50914]/30 transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-medium text-white truncate">
                                            {torrent.title ||
                                              torrent.torrent_title ||
                                              `Episode ${episode.episode_number}`}
                                          </span>
                                          {torrent.quality && (
                                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                              torrent.quality === "4K" ? "bg-purple-600" :
                                              torrent.quality === "1080p" ? "bg-red-600" :
                                              torrent.quality === "720p" ? "bg-emerald-600" :
                                              torrent.quality === "480p" ? "bg-amber-600" :
                                              "bg-gray-600"
                                            } text-white`}>
                                              {torrent.quality}
                                            </span>
                                          )}
                                          {torrent.is_hindi_dubbed && (
                                            <span className="text-[10px] text-emerald-400">🇮🇳 Hindi</span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-gray-400">
                                          {torrent.size && (
                                            <span className="flex items-center gap-1">
                                              <HardDrive size={11} />
                                              {torrent.size}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                          onClick={() => openTorBox(torrent)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-medium transition-colors"
                                        >
                                          <Cloud size={13} />
                                          <span>High-Speed</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-gray-500 italic">
                                  No torrents available for this episode
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-gray-500 text-sm py-4">
                          No episodes available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {torrents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Download size={20} className="text-[#e50914]" />
            <span>Full Complete Season</span>
            <span className="text-sm text-gray-400 font-normal">
              ({torrents.filter((t) => t.torrent_type === "season").length})
            </span>
          </h2>

          {["4K", "1080p", "720p", "480p"].map((quality) => {
            const qualityTorrents = torrents.filter(
              (t) => t.quality === quality && t.torrent_type === "season",
            );
            if (qualityTorrents.length === 0) return null;

            return (
              <div
                key={quality}
                className="mb-4 bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden"
              >
                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    quality === "4K" ? "bg-purple-600" :
                    quality === "1080p" ? "bg-red-600" :
                    quality === "720p" ? "bg-green-600" :
                    "bg-yellow-600"
                  }`}>
                    {quality}
                  </span>
                </div>
                <div className="divide-y divide-gray-800">
                  {qualityTorrents.map((torrent, index) => (
                    <div
                      key={torrent.id || index}
                      className="p-3 hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {torrent.title ||
                              torrent.torrent_title ||
                              "Unknown Torrent"}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                            {torrent.size && (
                              <span className="flex items-center space-x-1">
                                <HardDrive size={12} />
                                <span>{torrent.size}</span>
                              </span>
                            )}
                            {torrent.is_hindi_dubbed && (
                              <span className="text-yellow-500">🇮🇳 Hindi</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => openTorBox(torrent)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs font-medium transition-colors"
                          >
                            <Cloud size={14} />
                            <span>High-Speed</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {torrents.filter((t) => t.torrent_type === "season").length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No season pack torrents available
            </div>
          )}
          {/* Season Pack torrents — image style layout */}
          <div className="bg-[#12122a] border border-gray-800 rounded-2xl px-4 py-5 space-y-6">
            {["4K", "1080p", "720p", "480p"].map((quality) => {
              const qualityTorrents = torrents.filter(
                (t) => t.quality === quality && t.torrent_type === "season"
              );
              if (qualityTorrents.length === 0) return null;

              return qualityTorrents.map((torrent, index) => {
                const torrentLabel =
                  torrent.title || torrent.torrent_title || "Unknown Torrent";

                return (
                  <div
                    key={torrent.id || `${quality}-${index}`}
                    className="flex flex-col items-center gap-2"
                  >
                    {/* Title above button */}
                    <p className="text-gray-300 text-sm text-center max-w-lg leading-snug">
                      {torrentLabel}
                    </p>

                    {/* Big red Download button */}
                    <button
                      onClick={() =>
                        openMagnet(torrent.magnet_link || torrent.magnetLink)
                      }
                      className="w-full max-w-md py-3.5 rounded-xl bg-[#e50914] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#e50914]/25"
                    >
                      <Download size={19} />
                      Download
                    </button>

                    {/* Meta row below button */}
                    <div className="flex items-center gap-3 text-xs">
                      {torrent.size && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <HardDrive size={12} />
                          {torrent.size}
                        </span>
                      )}
                      {torrent.quality && (
                        <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                          {torrent.quality}
                        </span>
                      )}
                      {torrent.is_hindi_dubbed && (
                        <span className="text-[#f5c518] font-semibold text-[11px] uppercase tracking-wide">
                          IN Hindi Dubbed
                        </span>
                      )}
                    </div>

                    {/* Thin divider between entries */}
                    <hr className="w-3/4 border-gray-800 mt-1" />
                  </div>
                );
              });
            })}

            {/* No season packs fallback */}
            {torrents.filter((t) => t.torrent_type === "season").length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                No season pack torrents available
              </div>
            )}
          </div>
        </div>
      )}

      {/* TorBox Modal - Using SeriesTorBoxDownload */}
      {showTorBox && selectedTorrent && (
        <SeriesTorBoxDownload
          series={selectedTorrent}
          onClose={() => {
            setShowTorBox(false);
            setSelectedTorrent(null);
          }}
        />
      )}
    </div>
  );
};

export default SeriesDetail;