// frontend/src/components/SavedContent.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Search, Download, Eye, Film, Tv } from "lucide-react";

const SavedContent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchDatabase = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/torrents/database/search`,
        {
          params: { q: searchTerm },
        },
      );
      setResults(response.data.data);
      toast.success(`Found ${response.data.data.length} results`);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const viewContent = async (tmdbId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/torrents/content/${tmdbId}`,
      );
      setSelectedContent(response.data.data);
    } catch (error) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Saved Content Library
        </h2>

        <div className="flex space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchDatabase()}
            placeholder="Search in saved database..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <button
            onClick={searchDatabase}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center space-x-2"
          >
            <Search size={18} />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
            <div
              key={item.tmdb_id}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-red-500 transition-all"
            >
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                  alt={item.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {item.title}
                  </h3>
                  {item.media_type === "movie" ? (
                    <Film size={16} className="text-blue-400" />
                  ) : (
                    <Tv size={16} className="text-green-400" />
                  )}
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-400">
                    {item.release_date || item.first_air_date}
                  </span>
                  <span className="text-yellow-500">
                    ⭐ {item.vote_average}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-gray-400">
                    Torrents: {item.torrent_count}
                  </span>
                  {item.hindi_dub_count > 0 && (
                    <span className="text-green-400">
                      Hindi: {item.hindi_dub_count}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => viewContent(item.tmdb_id)}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white flex items-center justify-center space-x-2"
                >
                  <Eye size={16} />
                  <span>View Torrents</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Details Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {selectedContent.content?.title}
              </h2>
              <button
                onClick={() => setSelectedContent(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Torrents List */}
              <h3 className="text-lg font-semibold text-white mb-4">
                Available Torrents
              </h3>
              <div className="space-y-3">
                {selectedContent.torrents?.map((torrent, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-2">
                          {torrent.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {torrent.quality && (
                            <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                              {torrent.quality}
                            </span>
                          )}
                          {torrent.is_hindi_dub && (
                            <span className="px-2 py-1 bg-green-600 rounded text-xs">
                              Hindi Dubbed
                            </span>
                          )}
                          {torrent.size && (
                            <span className="px-2 py-1 bg-gray-600 rounded text-xs">
                              💾 {torrent.size}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-green-800 rounded text-xs">
                            👥 {torrent.seeders}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Source: {torrent.source}
                        </p>
                      </div>
                      <a
                        href={torrent.magnet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                      >
                        <Download size={14} />
                        <span>Magnet</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      )}
    </div>
  );
};

export default SavedContent;
