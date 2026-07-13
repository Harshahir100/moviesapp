// backend-node/server.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATIONS ---
const TORBOX_API_KEY   = "b25780bb-4b70-488a-a931-6e7d48daf96c";
const TORBOX_BASE_URL  = "https://api.torbox.app/v1/api/torrents";
const TMDB_IMAGE_BASE  = "https://image.tmdb.org/t/p/w500";

// PostgreSQL pool
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME     || "magnet_fetcher",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "Magnet@2026",
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function fixPosterPath(posterPath) {
  if (posterPath && !posterPath.startsWith("http")) {
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  }
  return posterPath;
}

function fixMoviesPosters(movies) {
  return movies.map((movie) => ({
    ...movie,
    poster_path: fixPosterPath(movie.poster_path),
  }));
}

/**
 * Extract the 40-char info-hash from a magnet link.
 * Handles both btih: and base32 forms; always returns lowercase.
 * Returns null if not found.
 */
function extractHashFromMagnet(magnet) {
  if (!magnet) return null;
  // xt=urn:btih:<HEX 40 chars>  or  xt=urn:btih:<BASE32 32 chars>
  const match = magnet.match(/urn:btih:([a-fA-F0-9]{40}|[A-Z2-7]{32})/i);
  if (!match) return null;
  const raw = match[1];
  // Base32 hashes are 32 chars; hex are 40 chars — normalise both to hex lowercase
  if (raw.length === 32) {
    // decode base32 to hex
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

/**
 * Fetch the full torrent list from TorBox and return the entry whose
 * hash matches magnetHash (lowercase hex), or null if not found.
 */
async function findExistingTorrent(magnetHash) {
  if (!magnetHash) return null;
  try {
    const res  = await fetch(`${TORBOX_BASE_URL}/mylist?bypass_cache=true`, {
      headers: { Authorization: `Bearer ${TORBOX_API_KEY}` },
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return null;

    return data.data.find(
      (t) => (t.hash || "").toLowerCase() === magnetHash
    ) || null;
  } catch (e) {
    console.error("❌ findExistingTorrent error:", e.message);
    return null;
  }
}

/**
 * Pick the best video file from a torrent's file list.
 * Prefers known video extensions; falls back to the largest file.
 */
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

// ─────────────────────────────────────────────
// STANDARD ROUTES
// ─────────────────────────────────────────────

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Server is running!" });
});

app.get("/api/movies", async (req, res) => {
  try {
    const query = `
      SELECT m.id, m.title, m.overview, m.poster_path, m.release_date, m.vote_average,
             t.magnet_link, t.file_size_text, t.quality, t.seeders, t.leechers, t.is_hindi_dubbed
      FROM tmdb_movies m
      INNER JOIN movie_torrents t ON m.id = t.movie_id
      ORDER BY m.created_at DESC
      LIMIT 40;
    `;
    const result = await pool.query(query);
    res.json({ success: true, movies: fixMoviesPosters(result.rows), title: "Home - Premium Content" });
  } catch (e) {
    console.error("Error:", e);
    res.json({ success: true, movies: [], title: "Home - Premium Content" });
  }
});

app.get("/api/category/:name", async (req, res) => {
  const name      = req.params.name;
  const isHindi   = ["bollywood", "hindi_dubbed"].includes(name);
  const hindiFilter = isHindi ? "TRUE" : "FALSE";
  try {
    const query = `
      SELECT m.id, m.title, m.overview, m.poster_path, m.release_date, m.vote_average,
             t.magnet_link, t.file_size_text, t.quality, t.seeders, t.leechers, t.is_hindi_dubbed
      FROM tmdb_movies m
      INNER JOIN movie_torrents t ON m.id = t.movie_id
      WHERE t.is_hindi_dubbed = ${hindiFilter}
      ORDER BY m.release_date DESC;
    `;
    const result = await pool.query(query);
    const title  = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    res.json({ success: true, movies: fixMoviesPosters(result.rows), title });
  } catch (e) {
    console.error("Error:", e);
    res.json({ success: true, movies: [], title: name });
  }
});

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ success: true, movies: [], title: "Search Results" });
  try {
    const searchParam = `%${q}%`;
    const query = `
      SELECT m.id, m.title, m.overview, m.poster_path, m.release_date, m.vote_average,
             t.magnet_link, t.file_size_text, t.quality, t.seeders, t.leechers
      FROM tmdb_movies m
      INNER JOIN movie_torrents t ON m.id = t.movie_id
      WHERE m.title ILIKE $1 OR t.torrent_title ILIKE $2 OR t.quality ILIKE $3
    `;
    const result = await pool.query(query, [searchParam, searchParam, searchParam]);
    res.json({ success: true, movies: fixMoviesPosters(result.rows), title: `Search Results for: '${q}'` });
  } catch (e) {
    console.error("Error:", e);
    res.json({ success: true, movies: [], title: `Search Results for: '${q}'` });
  }
});

// ─────────────────────────────────────────────
// TORBOX ENDPOINTS
// ─────────────────────────────────────────────

/**
 * POST /api/add_torrent
 *
 * Workflow:
 *  1. Extract info-hash from magnet link.
 *  2. Check TorBox account for an existing torrent with the same hash.
 *  3a. Found  → return existing torrent_id + found:true (skip re-adding).
 *  3b. Not found → submit magnet to TorBox, return new torrent_id.
 */
app.post("/api/add_torrent", async (req, res) => {
  console.log("📥 /api/add_torrent called");

  const { magnet } = req.body;
  if (!magnet || !magnet.startsWith("magnet:?")) {
    return res.json({ success: false, error: "Invalid magnet link structure." });
  }

  // ── Step 1: extract hash ──────────────────────────────────────────────────
  const magnetHash = extractHashFromMagnet(magnet);
  console.log("🔑 Extracted hash:", magnetHash || "(none)");

  // ── Step 2: check for duplicate ───────────────────────────────────────────
  if (magnetHash) {
    console.log("🔍 Checking TorBox account for existing torrent…");
    const existing = await findExistingTorrent(magnetHash);

    if (existing) {
      console.log(`✅ Duplicate found! Torrent ID: ${existing.id} (${existing.name})`);
      return res.json({
        success:    true,
        torrent_id: existing.id,
        found:      true,   // ← tells the frontend this was a cached hit
        message:    "Torrent already exists in your TorBox account.",
      });
    }
    console.log("➕ Not found — adding new torrent…");
  }

  // ── Step 3: add new torrent ───────────────────────────────────────────────
  try {
    console.log("📝 Magnet:", magnet.substring(0, 60) + "…");

    const formData = new URLSearchParams();
    formData.append("magnet",    magnet);
    formData.append("seed",      "1");
    formData.append("allow_zip", "false");

    const response = await fetch(`${TORBOX_BASE_URL}/createtorrent`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${TORBOX_API_KEY}` },
      body:    formData,
    });

    console.log("📥 Response Status:", response.status);
    const data = await response.json();
    console.log("📥 Response Data:",  JSON.stringify(data));

    if (data.success) {
      const torrent_id =
        typeof data.data === "object" ? data.data.torrent_id : data.data;
      console.log("✅ Torrent added! ID:", torrent_id);
      return res.json({ success: true, torrent_id, found: false });
    }

    console.log("❌ TorBox Error:", data.detail || data.error);

    // Handle DUPLICATE_ITEM gracefully: TorBox itself rejected it as a dup
    // but our hash check missed it (e.g. base32 / different format).
    // Try to pull the existing torrent by hash one more time.
    if (
      (data.error === "DUPLICATE_ITEM" || (data.detail || "").toLowerCase().includes("duplicate")) &&
      magnetHash
    ) {
      const existing = await findExistingTorrent(magnetHash);
      if (existing) {
        console.log("♻️  Recovered duplicate via fallback lookup. ID:", existing.id);
        return res.json({
          success:    true,
          torrent_id: existing.id,
          found:      true,
          message:    "Torrent already exists (duplicate detected by TorBox).",
        });
      }
    }

    return res.json({
      success: false,
      error:   data.detail || data.error || "TorBox engine error.",
    });
  } catch (e) {
    console.error("❌ Exception:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/get_status?id=<torrent_id>
 */
app.get("/api/get_status", async (req, res) => {
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
        success:  true,
        state:    d.download_state || "unknown",
        progress: Math.round((d.progress || 0) * 100),
        speed:    (d.download_speed || 0) / (1024 * 1024),
      });
    }
    return res.json({ success: false });
  } catch (e) {
    console.error("❌ Status error:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/get_link?id=<torrent_id>
 */
app.get("/api/get_link", async (req, res) => {
  const torrent_id = req.query.id;
  if (!torrent_id) return res.json({ success: false, error: "Torrent ID required" });

  try {
    // Step 1: get torrent info & file list
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
      return res.json({ success: false, error: "No files found inside this torrent." });
    }

    const videoFile = pickVideoFile(files);
    if (!videoFile || videoFile.id == null) {
      return res.json({ success: false, error: "Video file ID not found." });
    }

    console.log("🎯 Selected file:", videoFile.name, "ID:", videoFile.id);

    // Step 2: request download link
    const dlUrl = `${TORBOX_BASE_URL}/requestdl?token=${TORBOX_API_KEY}&torrent_id=${torrent_id}&file_id=${videoFile.id}&zip_link=false`;
    const dlRes = await fetch(dlUrl, { redirect: "manual" });

    if (dlRes.status === 302 || dlRes.status === 307) {
      const location = dlRes.headers.get("location");
      console.log("✅ Redirect URL:", location);
      return res.json({ success: true, download_url: location });
    }

    const dlData = await dlRes.json();
    if (dlData.success) {
      console.log("✅ Download URL:", dlData.data);
      return res.json({ success: true, download_url: dlData.data });
    }

    return res.json({ success: false, error: "Failed to generate direct video link." });
  } catch (e) {
    console.error("❌ Link error:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`🚀 TorBox Server running on http://localhost:${PORT}`);
});