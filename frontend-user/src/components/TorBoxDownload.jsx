// frontend-user/src/components/TorBoxDownload.jsx
import React, { useState, useEffect, useRef } from "react";
import { X, Cloud, Play, Loader } from "lucide-react";
import toast from "react-hot-toast";

// ✅ CORRECT: Point to Node.js backend (port 5000)
const API_URL = "http://localhost:5004";

const TorBoxDownload = ({ movie, onClose }) => {
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [engineStatus, setEngineStatus] = useState("Initializing...");
  const [engineStatusColor, setEngineStatusColor] = useState("#38bdf8");
  const [timerText, setTimerText] = useState("15s");
  const [timerReady, setTimerReady] = useState(false);
  const [speedLabel, setSpeedLabel] = useState("Network Speed: 0.00 MB/s");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

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
    clearInterval(statusIntervalRef.current);
    clearInterval(countdownIntervalRef.current);
  };

  const triggerTorBoxDownload = async () => {
    setErrorMsg("");
    setBtnDisabled(true);
    setPanelVisible(true);
    setEngineStatus("Transmitting hash reference...");

    try {
      // ✅ Using correct API_URL (port 5000)
      const response = await fetch(`${API_URL}/api/add_torrent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnet: movie.magnet_link }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      startVisualTimer(data.torrent_id);
    } catch (err) {
      setErrorMsg("Error: " + err.message);
      setBtnDisabled(false);
      toast.error(err.message);
    }
  };

  const startVisualTimer = (torrentId) => {
    let timeLeft = 15;
    setEngineStatus("Processing Cloud Cache Link...");

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
        // ✅ Using correct API_URL (port 5000)
        const response = await fetch(`${API_URL}/api/get_status?id=${torrentId}`);
        const data = await response.json();
        if (!data.success) return;

        const state = data.state.toLowerCase();
        setEngineStatus(state.toUpperCase());
        setSpeedLabel(`Network Speed: ${data.speed.toFixed(2)} MB/s`);
        setProgress(data.progress);

        if (["completed", "cached", "uploading", "uploading (no peers)"].includes(state)) {
          clearInterval(statusIntervalRef.current);
          setProgress(100);
          fetchPremiumDirectLink(torrentId);
        } else if (state.includes("failed")) {
          clearInterval(statusIntervalRef.current);
          setErrorMsg("Torbox reports file pipeline broken inside network cloud cluster.");
        }
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  };

  const fetchPremiumDirectLink = async (torrentId) => {
    setEngineStatus("Extracting Video Stream Pipeline...");
    try {
      // ✅ Using correct API_URL (port 5000)
      const response = await fetch(`${API_URL}/api/get_link?id=${torrentId}`);
      const data = await response.json();
      if (data.success) {
        setEngineStatus("COMPLETED!");
        setEngineStatusColor("#10b981");
        setDownloadUrl(data.download_url);
        toast.success("Download ready!");
      } else {
        setErrorMsg(data.error || "Direct distribution servers refused request.");
      }
    } catch (e) {
      setErrorMsg("Network extraction failed.");
    }
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative border border-gray-700">
        {/* Close Button */}
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
          {/* Left - Poster */}
          <div className="md:col-span-1">
            <img
              src={movie.poster_path || "/placeholder.png"}
              alt={movie.title}
              className="w-full rounded-xl shadow-2xl"
              onError={(e) => {
                e.target.src = "https://placehold.co/300x450/1e293b/fff?text=No+Poster";
              }}
            />
          </div>

          {/* Right - Details */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-white">{movie.title || "Unknown Title"}</h2>
            <p className="text-gray-400 text-sm">{movie.overview || "No synopsis available."}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-[#0f172a] p-4 rounded-xl border border-gray-700 text-sm">
              <div><span className="text-gray-500">Rating:</span> <b className="text-yellow-400">{movie.vote_average || "0.0"}</b></div>
              <div><span className="text-gray-500">Release:</span> <b className="text-white">{movie.release_date || "N/A"}</b></div>
              <div><span className="text-gray-500">Size:</span> <b className="text-white">{movie.file_size_text || "N/A"}</b></div>
              <div><span className="text-gray-500">Quality:</span> <b className="text-white">{movie.quality || "N/A"}</b></div>
              <div><span className="text-gray-500">Seeders:</span> <b className="text-green-500">{movie.seeders || 0}</b></div>
              <div><span className="text-gray-500">Leechers:</span> <b className="text-red-500">{movie.leechers || 0}</b></div>
            </div>

            {/* Download Button */}
            <button
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all"
              disabled={btnDisabled}
              onClick={triggerTorBoxDownload}
            >
              {btnDisabled ? (
                <>
                  <Loader size={18} className="animate-spin" /> Routing to Torbox servers...
                </>
              ) : (
                <>
                  <Cloud size={18} /> Cloud Unlock to High-Speed Link
                </>
              )}
            </button>

            {/* TorBox Panel */}
            {panelVisible && (
              <div className="bg-[#0f172a] border border-dashed border-blue-400 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <div>
                    Engine Status:{" "}
                    <span style={{ color: engineStatusColor }}>{engineStatus}</span>
                  </div>
                  <div>
                    {timerReady ? (
                      <span className="text-green-500">✅ Target Ready</span>
                    ) : (
                      <>
                        Tunnel verification:{" "}
                        <span className="text-yellow-400 font-bold">{timerText}</span>
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
                    <Play size={18} /> 🎬 Play / Download Direct Video
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

export default TorBoxDownload;