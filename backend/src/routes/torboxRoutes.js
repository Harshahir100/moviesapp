// backend/src/routes/torboxRoutes.js
import express from 'express';
import fetch from 'node-fetch';


const router = express.Router();

const TORBOX_API_KEY = process.env.TORBOX_API_KEY;
const TORBOX_BASE_URL = process.env.TORBOX_BASE_URL;


function extractHashFromMagnet(magnet) {
  if (!magnet) return null;
  const match = magnet.match(/urn:btih:([a-fA-F0-9]{40}|[A-Z2-7]{32})/i);
  if (!match) return null;
  const raw = match[1];
  if (raw.length === 32) {
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (const ch of raw.toUpperCase()) {
      const idx = base32Chars.indexOf(ch);
      if (idx < 0) return null;
      bits += idx.toString(2).padStart(5, "0");
    }
    let hex = "";
    for (let i = 0; i + 4 <= bits.length; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex.toLowerCase();
  }
  return raw.toLowerCase();
}

async function findExistingTorrent(magnetHash) {
  if (!magnetHash) return null;
  try {
    const res = await fetch(`${TORBOX_BASE_URL}/mylist?bypass_cache=true`, {
      headers: { Authorization: `Bearer ${TORBOX_API_KEY}` },
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return null;
    return data.data.find((t) => (t.hash || "").toLowerCase() === magnetHash) || null;
  } catch (e) {
    console.error("❌ findExistingTorrent error:", e.message);
    return null;
  }
}

function pickVideoFile(files = []) {
  const videoExts = [".mkv", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"];
  let video = files.find((f) => {
    const name = (f.name || "").toLowerCase();
    return videoExts.some((ext) => name.endsWith(ext));
  });
  if (!video) {
    video = files.reduce((max, f) => ((f.size || 0) > (max.size || 0) ? f : max));
  }
  return video || null;
}

// ─── ROUTES ──────────────────────────────────────────────────────

// POST /api/torbox/add
router.post('/add', async (req, res) => {
  console.log("📥 /api/torbox/add called");

  const { magnet } = req.body;
  if (!magnet || !magnet.startsWith("magnet:?")) {
    return res.json({ success: false, error: "Invalid magnet link structure." });
  }

  const magnetHash = extractHashFromMagnet(magnet);
  console.log("🔑 Extracted hash:", magnetHash || "(none)");

  if (magnetHash) {
    console.log("🔍 Checking TorBox account...");
    const existing = await findExistingTorrent(magnetHash);
    if (existing) {
      console.log(`✅ Found existing torrent! ID: ${existing.id}`);
      return res.json({
        success: true,
        torrent_id: existing.id,
        found: true,
        message: "Torrent already exists.",
      });
    }
  }

  try {
    console.log("📝 Adding new torrent...");

    const formData = new URLSearchParams();
    formData.append("magnet", magnet);
    formData.append("seed", "1");
    formData.append("allow_zip", "false");

    const response = await fetch(`${TORBOX_BASE_URL}/createtorrent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TORBOX_API_KEY}` },
      body: formData,
    });

    const data = await response.json();
    console.log("📥 Response:", JSON.stringify(data));

    if (data.success) {
      const torrent_id = typeof data.data === "object" ? data.data.torrent_id : data.data;
      console.log("✅ Torrent added! ID:", torrent_id);
      return res.json({ success: true, torrent_id, found: false });
    }

    return res.json({
      success: false,
      error: data.detail || data.error || "TorBox error.",
    });
  } catch (e) {
    console.error("❌ Error:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

// GET /api/torbox/status
router.get('/status', async (req, res) => {
  const torrent_id = req.query.id;
  if (!torrent_id) return res.json({ success: false, error: "Torrent ID required" });

  try {
    const response = await fetch(
      `${TORBOX_BASE_URL}/mylist?bypass_cache=true&id=${torrent_id}`,
      { headers: { Authorization: `Bearer ${TORBOX_API_KEY}` } }
    );
    const data = await response.json();

    if (data.success && data.data) {
      const d = data.data;
      return res.json({
        success: true,
        state: d.download_state || "unknown",
        progress: Math.round((d.progress || 0) * 100),
        speed: (d.download_speed || 0) / (1024 * 1024),
      });
    }
    return res.json({ success: false });
  } catch (e) {
    console.error("❌ Status error:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

// GET /api/torbox/link
router.get('/link', async (req, res) => {
  const torrent_id = req.query.id;
  if (!torrent_id) return res.json({ success: false, error: "Torrent ID required" });

  try {
    const infoResponse = await fetch(
      `${TORBOX_BASE_URL}/mylist?bypass_cache=true&id=${torrent_id}`,
      { headers: { Authorization: `Bearer ${TORBOX_API_KEY}` } }
    );
    const infoData = await infoResponse.json();

    if (!infoData.success || !infoData.data) {
      return res.json({ success: false, error: "Could not fetch torrent file list." });
    }

    const files = infoData.data.files || [];
    if (!files.length) {
      return res.json({ success: false, error: "No files found." });
    }

    const videoFile = pickVideoFile(files);
    if (!videoFile || videoFile.id == null) {
      return res.json({ success: false, error: "Video file ID not found." });
    }

    console.log("🎯 Selected file:", videoFile.name);

    const dlUrl = `${TORBOX_BASE_URL}/requestdl?token=${TORBOX_API_KEY}&torrent_id=${torrent_id}&file_id=${videoFile.id}&zip_link=false`;
    const dlRes = await fetch(dlUrl, { redirect: "manual" });

    if (dlRes.status === 302 || dlRes.status === 307) {
      return res.json({ success: true, download_url: dlRes.headers.get("location") });
    }

    const dlData = await dlRes.json();
    if (dlData.success) {
      return res.json({ success: true, download_url: dlData.data });
    }

    return res.json({ success: false, error: "Failed to generate direct link." });
  } catch (e) {
    console.error("❌ Link error:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

// GET /api/torbox/test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'TorBox routes are working!',
    apiKeySet: !!TORBOX_API_KEY
  });
});

export default router;