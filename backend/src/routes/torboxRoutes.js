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
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const TORBOX_API_KEY = process.env.TORBOX_API_KEY || '';
const TORBOX_BASE_URL = 'https://api.torbox.app/v1/api/torrents';

// STRICT CONFIGURATION LOG: Paid plans authentication require proper space inside Bearer string
const getHeaders = () => {
    return {
        'Authorization': `Bearer ${TORBOX_API_KEY.trim()}`, // Added .trim() to prevent space errors
        'Content-Type': 'application/x-www-form-urlencoded'
    };
};

// Add torrent to TorBox
router.post('/add', async (req, res) => {
    try {
        const { magnet } = req.body;
        
        if (!magnet) {
            return res.status(400).json({ success: false, error: 'Magnet link is missing.' });
        }

        const params = new URLSearchParams();
        params.append('magnet', magnet);
        params.append('seed', '3');
        params.append('allow_zip', 'true');

        // Dynamic API request execution
        const response = await axios.post(
            `${TORBOX_BASE_URL}/createtorrent`,
            params,
            { headers: getHeaders() } // Using re-verified headers structure
        );

        if (response.data.success) {
            const torrentId = response.data.data?.torrent_id || response.data.data?.id || response.data.data;
            return res.json({
                success: true,
                torrent_id: torrentId
            });
        }

        return res.json({
            success: false,
            error: response.data.detail || 'TorBox rejection rule triggered.'
        });
    } catch (error) {
        console.error('TorBox Engine Exception Log:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.detail || error.response?.data?.error || error.message
        });
    }
});

// Get torrent status
router.get('/status', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, error: 'ID parameter required' });

        const response = await axios.get(
            `${TORBOX_BASE_URL}/mylist`,
            {
                headers: { 'Authorization': `Bearer ${TORBOX_API_KEY.trim()}` },
                params: { bypass_cache: 'true', id }
            }
        );

        if (response.data.success && response.data.data) {
            const data = response.data.data;
            const targetData = Array.isArray(data) ? data[0] : data;

            return res.json({
                success: true,
                state: targetData.download_state || 'unknown',
                progress: targetData.progress ? targetData.progress * 100 : 0,
                speed: targetData.download_speed ? targetData.download_speed / (1024 * 1024) : 0
            });
        }

        return res.json({ success: false });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Get Link
router.get('/link', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, error: 'ID required' });

        const infoResponse = await axios.get(
            `${TORBOX_BASE_URL}/mylist`,
            {
                headers: { 'Authorization': `Bearer ${TORBOX_API_KEY.trim()}` },
                params: { bypass_cache: 'true', id }
            }
        );

        const torrentData = Array.isArray(infoResponse.data.data) ? infoResponse.data.data[0] : infoResponse.data.data;
        if (!torrentData || !torrentData.files) return res.json({ success: false, error: 'No files tracking.' });

        const files = torrentData.files || [];
        if (files.length === 0) return res.json({ success: false, error: 'File array empty' });
        
        const targetFile = files.reduce((prev, current) => (prev.size > current.size) ? prev : current);

        const dlResponse = await axios.get(
            `${TORBOX_BASE_URL}/requestdl`,
            {
                params: {
                    token: TORBOX_API_KEY.trim(),
                    torrent_id: id,
                    file_id: targetFile.id,
                    zip_link: 'false'
                },
                maxRedirects: 0,
                validateStatus: false
            }
        );

        if (dlResponse.status === 302 || dlResponse.status === 307) {
            return res.json({ success: true, download_url: dlResponse.headers.location });
        }

        return res.json({
            success: true,
            download_url: dlResponse.data.data || dlResponse.data
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;