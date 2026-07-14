// frontend-user/src/components/SeriesTorBoxDownload.jsx
import React, { useState, useEffect, useRef } from "react";
import { X, Cloud, Play, Loader, Zap } from "lucide-react";
import toast from "react-hot-toast";

// ✅ API_URL should point to main backend (port 5000)
const API_URL = "http://localhost:5000/api/torbox";

const SeriesTorBoxDownload = ({ series, onClose }) => {
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [engineStatus, setEngineStatus] = useState("Initializing...");
  const [engineStatusColor, setEngineStatusColor] = useState("#38bdf8");
  const [timerText, setTimerText] = useState("10s");
  const [timerReady, setTimerReady] = useState(false);
  const [speedLabel, setSpeedLabel] = useState("Network Speed: 0.00 MB/s");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isCachedHit, setIsCachedHit] = useState(false);

  const statusIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(statusIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const resetTorBoxUI = () => {
    setBtnDisabled(false);
    setPanelVisible(false);
    setEngineStatus("Initializing...");
    setEngineStatusColor("#38bdf8");
    setTimerText("15s");
    setTimerReady(false);
    setSpeedLabel("Network Speed: 0.00 MB/s");
    setProgress(0);
    setErrorMsg("");
    setDownloadUrl(null);
    setIsCachedHit(false);
    clearInterval(statusIntervalRef.current);
    clearInterval(countdownIntervalRef.current);
  };

  const triggerTorBoxDownload = async () => {
    setErrorMsg("");
    setBtnDisabled(true);
    setPanelVisible(true);
    setEngineStatus("Checking Download Link");

    try {
      const response = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnet: series.magnet_link }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      if (data.found) {
        console.log("⚡ Cache hit — skipping wait timer");
        setIsCachedHit(true);
        setTimerReady(true);
        setEngineStatus("Download- Checking Status…");
        toast.success("⚡ Existing torrent found! Fetching link…");
        pollTorBoxStatus(data.torrent_id);
      } else {
        setIsCachedHit(false);
        setEngineStatus("Transmitting hash reference…");
        startVisualTimer(data.torrent_id);
      }
    } catch (err) {
      setErrorMsg("Error: " + err.message);
      setBtnDisabled(false);
      toast.error(err.message);
    }
  };

  const startVisualTimer = (torrentId) => {
    let timeLeft = 10;
    setEngineStatus("Processing Download Link…");

    countdownIntervalRef.current = setInterval(() => {
      timeLeft--;
      setTimerText(timeLeft + "s");
      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        setTimerReady(true);
        pollTorBoxStatus(torrentId);
      }
    }, 1000);
  };

  const pollTorBoxStatus = (torrentId) => {
    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/status?id=${torrentId}`);
        const data = await response.json();
        if (!data.success) return;

        const state = data.state.toLowerCase();
        setEngineStatus(state.toUpperCase());
        setSpeedLabel(`Network Speed: ${data.speed.toFixed(2)} MB/s`);
        setProgress(data.progress);

        const doneStates = [
          "completed",
          "cached",
          "uploading",
          "uploading (no peers)",
          "seeding",
          "finished",
        ];
        if (doneStates.includes(state)) {
          clearInterval(statusIntervalRef.current);
          setProgress(100);
          fetchPremiumDirectLink(torrentId);
        } else if (
          state.includes("failed") ||
          state === "error" ||
          state === "dead"
        ) {
          clearInterval(statusIntervalRef.current);
          setErrorMsg("Torbox reports the torrent entered an error state.");
        }
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const fetchPremiumDirectLink = async (torrentId) => {
    setEngineStatus("Creating Download Link...");
    try {
      const response = await fetch(`${API_URL}/link?id=${torrentId}`);
      const data = await response.json();
      if (data.success) {
        setEngineStatus("COMPLETED!");
        setEngineStatusColor("#10b981");
        setDownloadUrl(data.download_url);
        toast.success("✅ Download ready!");
      } else {
        setErrorMsg(
          data.error || "Direct distribution servers refused request.",
        );
      }
    } catch (e) {
      setErrorMsg("Network extraction failed.");
    }
  };

  if (!series) return null;

  // ✅ Get year from release_date
  const getYear = () => {
    if (!series?.release_date) return "N/A";
    return series.release_date.split("-")[0] || "N/A";
  };

  // ✅ Get language
  const getLanguage = () => {
    return `${series?.original_language?.toUpperCase() || "N/A"}${
      series?.is_hindi_dubbed ? " / Hindi Dubbed" : ""
    }`;
  };

  // ✅ Get torrent title
  const getTorrentTitle = () => {
    return series?.torrent_title || series?.title || "Unknown Title";
  };

  // ✅ Get quality from torrent
  const getQuality = () => {
    return series?.quality || "N/A";
  };

  // ✅ Get size from torrent
  const getSize = () => {
    return series?.file_size_text || series?.size || "N/A";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-gray-700">
        <button
          onClick={() => {
            resetTorBoxUI();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Poster */}
          <div className="md:col-span-1">
            <img
              src={
                series.poster_path?.startsWith("http")
                  ? series.poster_path
                  : `https://image.tmdb.org/t/p/w500${series.poster_path}`
              }
              alt={series.title}
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
              {getTorrentTitle()}
            </h2>

            <p className="text-gray-400 text-sm">
              {series.overview || "No synopsis available."}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-[#0f172a] p-4 rounded-xl border border-gray-700 text-sm">
              <div>
                <span className="text-gray-500">Rating:</span>
                <b className="text-yellow-400 ml-1">
                  {series.vote_average || "0.0"}
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
              disabled={btnDisabled}
              onClick={triggerTorBoxDownload}
            >
              {btnDisabled ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Download Processing...
                </>
              ) : (
                <span>Cloud Unlock to High-Speed Download Link</span>
              )}
            </button>

            {panelVisible && (
              <div className="bg-[#0f172a] border border-dashed border-blue-400 rounded-xl p-4 space-y-3">
                {isCachedHit && (
                  <div className="flex items-center gap-2 text-xs bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg">
                    <Zap size={13} />
                    <span>skipping upload</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <div>
                    Download Status:{" "}
                    <span style={{ color: engineStatusColor }}>
                      {engineStatus}
                    </span>
                  </div>
                  <div>
                    {timerReady ? (
                      <span className="text-green-500">✅ Download Ready</span>
                    ) : (
                      <>
                        Wait For The Second:{" "}
                        <span className="text-yellow-400 font-bold">
                          {timerText}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400">{speedLabel}</div>

                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {errorMsg && (
                  <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded-lg border border-red-400/30">
                    ❌ {errorMsg}
                  </div>
                )}

                {downloadUrl && (
                  <a
                    href={downloadUrl}
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

export default SeriesTorBoxDownload;
