// 📁 frontend-user/src/hooks/useTorBoxDownload.js
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL}/api/torbox`;

export const useTorBoxDownload = () => {
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

  const resetUI = () => {
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

  const triggerDownload = async (magnetLink) => {
    setErrorMsg("");
    setBtnDisabled(true);
    setPanelVisible(true);
    setEngineStatus("Checking Download Link");

    try {
      const response = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnet: magnetLink }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      if (data.found) {
        console.log("⚡ Cache hit — skipping wait timer");
        setIsCachedHit(true);
        setTimerReady(true);
        setEngineStatus("Download- Checking Status…");
        toast.success("Preparing your download link...");
        pollStatus(data.torrent_id);
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
        pollStatus(torrentId);
      }
    }, 1000);
  };

  const pollStatus = (torrentId) => {
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
          fetchDirectLink(torrentId);
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

  const fetchDirectLink = async (torrentId) => {
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
          data.error || "Direct distribution servers refused request."
        );
      }
    } catch (e) {
      setErrorMsg("Network extraction failed.");
    }
  };

  return {
    state: {
      btnDisabled,
      panelVisible,
      engineStatus,
      engineStatusColor,
      timerText,
      timerReady,
      speedLabel,
      progress,
      errorMsg,
      downloadUrl,
      isCachedHit
    },
    actions: {
      triggerDownload,
      resetUI
    }
  };
};