// 📁 frontend-user/src/components/common/TorBoxDownloadModal.jsx
import React from "react";
import { X, Loader, Zap } from "lucide-react";
import { useTorBoxDownload } from "../../hooks/useTorBoxDownload";

const TorBoxDownloadModal = ({ 
  media,        // movie or series object
  onClose,
  type = 'movie' // 'movie' or 'series'
}) => {
  const { state, actions } = useTorBoxDownload();

  if (!media) return null;

  // ✅ Common helper functions
  const getTitle = () => {
    return media?.torrent_title || media?.title || media?.name || "Unknown Title";
  };

  const getYear = () => {
    const date = media?.release_date || media?.first_air_date;
    if (!date) return "N/A";
    return date.split("-")[0] || "N/A";
  };

  const getLanguage = () => {
    const lang = media?.original_language?.toUpperCase() || "N/A";
    const dubbed = media?.is_hindi_dubbed ? " / Hindi Dubbed" : "";
    return `${lang}${dubbed}`;
  };

  const getQuality = () => media?.quality || "N/A";
  
  const getSize = () => media?.file_size_text || media?.size || "N/A";
  
  const getPosterPath = () => {
    if (media.poster_path?.startsWith("http")) {
      return media.poster_path;
    }
    return `https://image.tmdb.org/t/p/w500${media.poster_path}`;
  };

  const getOverview = () => media?.overview || "No synopsis available.";
  
  const getRating = () => media?.vote_average || "0.0";

  const handleDownload = () => {
    actions.triggerDownload(media.magnet_link);
  };

  const handleClose = () => {
    actions.resetUI();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-gray-700">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Poster */}
          <div className="md:col-span-1">
            <img
              src={getPosterPath()}
              alt={getTitle()}
              className="w-[260px] rounded-xl border-2 shadow-2xl"
              onError={(e) => {
                e.target.src =
                  "https://placehold.co/300x450/1e293b/fff?text=No+Poster";
              }}
            />
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-white">
              {getTitle()}
            </h2>

            <p className="text-gray-400 text-sm">
              {getOverview()}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-[#0f172a] p-4 rounded-xl border border-gray-700 text-sm">
              <div>
                <span className="text-gray-500">Rating:</span>
                <b className="text-yellow-400 ml-1">
                  {getRating()}
                </b>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <b className="text-white ml-1">{getSize()}</b>
              </div>
              <div>
                <span className="text-gray-500">Quality:</span>
                <b className="text-white ml-1">{getQuality()}</b>
              </div>
              <div>
                <span className="text-gray-500">Language:</span>
                <b className="text-white ml-1">{getLanguage()}</b>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Released Year:</span>
                <b className="text-white ml-1">{getYear()}</b>
              </div>
            </div>

            <button
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all"
              disabled={state.btnDisabled}
              onClick={handleDownload}
            >
              {state.btnDisabled ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Download Processing...
                </>
              ) : (
                <span>Cloud Unlock to High-Speed Download Link</span>
              )}
            </button>

            {state.panelVisible && (
              <div className="bg-[#0f172a] border border-dashed border-blue-400 rounded-xl p-4 space-y-3">
                {state.isCachedHit && (
                  <div className="flex items-center gap-2 text-xs bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg">
                    <Zap size={13} />
                    <span>skipping upload</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <div>
                    Download Status:{" "}
                    <span style={{ color: state.engineStatusColor }}>
                      {state.engineStatus}
                    </span>
                  </div>
                  <div>
                    {state.timerReady ? (
                      <span className="text-green-500">✅ Download Ready</span>
                    ) : (
                      <>
                        Wait For The Second:{" "}
                        <span className="text-yellow-400 font-bold">
                          {state.timerText}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400">{state.speedLabel}</div>

                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>

                {state.errorMsg && (
                  <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded-lg border border-red-400/30">
                    ❌ {state.errorMsg}
                  </div>
                )}

                {state.downloadUrl && (
                  <a
                    href={state.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <span>🎬 Click This Direct Download Link</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TorBoxDownloadModal;