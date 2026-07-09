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
// ✅ Your working API key
const TORBOX_API_KEY = "b25780bb-4b70-488a-a931-6e7d48daf96c";
const TORBOX_BASE_URL = "https://api.torbox.app/v1/api/torrents";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "magnet_fetcher",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Magnet@2026",
});

// Helper: fix poster path
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

// ✅ Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Server is running!" });
});

// ============================================================
// EXISTING API ROUTES
// ============================================================

app.get("/api/movies", async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id, m.title, m.overview, m.poster_path, m.release_date, m.vote_average,
        t.magnet_link, t.file_size_text, t.quality, t.seeders, t.leechers, t.is_hindi_dubbed
      FROM tmdb_movies m
      INNER JOIN movie_torrents t ON m.id = t.movie_id
      ORDER BY m.created_at DESC
      LIMIT 40;
    `;
    const result = await pool.query(query);
    const movies = fixMoviesPosters(result.rows);
    res.json({ success: true, movies, title: "Home - Premium Content" });
  } catch (e) {
    console.error("Error:", e);
    res.json({ success: true, movies: [], title: "Home - Premium Content" });
  }
});

app.get("/api/category/:name", async (req, res) => {
  const name = req.params.name;
  const isHindi = ["bollywood", "hindi_dubbed"].includes(name);
  const hindiFilter = isHindi ? "TRUE" : "FALSE";

  try {
    const query = `
      SELECT 
        m.id, m.title, m.overview, m.poster_path, m.release_date, m.vote_average,
        t.magnet_link, t.file_size_text, t.quality, t.seeders, t.leechers, t.is_hindi_dubbed
      FROM tmdb_movies m
      INNER JOIN movie_torrents t ON m.id = t.movie_id
      WHERE t.is_hindi_dubbed = ${hindiFilter}
      ORDER BY m.release_date DESC;
    `;
    const result = await pool.query(query);
    const movies = fixMoviesPosters(result.rows);
    const title = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    res.json({ success: true, movies, title });
  } catch (e) {
    console.error("Error:", e);
    res.json({ success: true, movies: [], title: name });
  }
});

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json({ success: true, movies: [], title: "Search Results" });
  }

  try {
    const searchParam = `%${q}%`;
    const query = `
      SELECT 
        m.id, m.title, m.overview, m.poster_path, m.release_date, m.vote_average,
        t.magnet_link, t.file_size_text, t.quality, t.seeders, t.leechers
      FROM tmdb_movies m
      INNER JOIN movie_torrents t ON m.id = t.movie_id
      WHERE m.title ILIKE $1 OR t.torrent_title ILIKE $2 OR t.quality ILIKE $3
    `;
    const result = await pool.query(query, [searchParam, searchParam, searchParam]);
    const movies = fixMoviesPosters(result.rows);
    res.json({ success: true, movies, title: `Search Results for: '${q}'` });
  } catch (e) {
    console.error("Error:", e);
    res.json({ success: true, movies: [], title: `Search Results for: '${q}'` });
  }
});

// ============================================================
// ✅ TORBOX ENDPOINTS - EXACTLY LIKE YOUR WORKING TEST
// ============================================================

// POST /api/add_torrent - Using working test logic
app.post("/api/add_torrent", async (req, res) => {
  console.log("📥 /api/add_torrent called");
  
  const { magnet } = req.body;
  
  if (!magnet || !magnet.startsWith("magnet:?")) {
    return res.json({ success: false, error: "Invalid Magnet link structure." });
  }

  try {
    console.log("📝 Magnet:", magnet.substring(0, 60) + "...");

    // ✅ EXACTLY LIKE YOUR WORKING TEST
    const formData = new URLSearchParams();
    formData.append("magnet", magnet);  // ✅ "magnet" not "magnet_link"
    formData.append("seed", "1");
    formData.append("allow_zip", "false");

    const response = await fetch(`${TORBOX_BASE_URL}/createtorrent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TORBOX_API_KEY}`,
        // ❌ DON'T set Content-Type - fetch handles it
      },
      body: formData,
    });

    console.log("📥 Response Status:", response.status);

    const data = await response.json();
    console.log("📥 Response Data:", JSON.stringify(data));

    if (data.success) {
      const torrent_id = typeof data.data === "object" ? data.data.torrent_id : data.data;
      console.log("✅ Torrent added! ID:", torrent_id);
      return res.json({ success: true, torrent_id });
    }

    console.log("❌ TorBox Error:", data.detail || data.error);
    return res.json({
      success: false,
      error: data.detail || data.error || "TorBox Engine error.",
    });
  } catch (e) {
    console.error("❌ Exception:", e.message);
    return res.json({ success: false, error: e.message });
  }
});

// GET /api/get_status
app.get("/api/get_status", async (req, res) => {
  const torrent_id = req.query.id;
  if (!torrent_id) {
    return res.json({ success: false, error: "Torrent ID required" });
  }

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

// GET /api/get_link
app.get("/api/get_link", async (req, res) => {
  const torrent_id = req.query.id;
  if (!torrent_id) {
    return res.json({ success: false, error: "Torrent ID required" });
  }

  try {
    // Step 1: Get torrent info
    const infoResponse = await fetch(
      `${TORBOX_BASE_URL}/mylist?bypass_cache=true&id=${torrent_id}`,
      { headers: { Authorization: `Bearer ${TORBOX_API_KEY}` } }
    );
    const infoData = await infoResponse.json();

    if (!infoData.success || !infoData.data) {
      return res.json({ success: false, error: "Could not fetch torrent file list." });
    }

    const torrentData = infoData.data;
    const files = torrentData.files || [];

    if (!files.length) {
      return res.json({ success: false, error: "No files found inside this torrent." });
    }

    // Find video file (same as working test)
    const videoExtensions = ['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    let videoFile = files.find(f => {
      const name = (f.name || '').toLowerCase();
      return videoExtensions.some(ext => name.endsWith(ext));
    });
    
    if (!videoFile) {
      videoFile = files.reduce((max, f) => (f.size || 0) > (max.size || 0) ? f : max);
    }

    const file_id = videoFile.id;
    if (file_id === undefined || file_id === null) {
      return res.json({ success: false, error: "Video file ID not found." });
    }

    console.log("🎯 Selected file:", videoFile.name, "ID:", file_id);

    // Step 2: Get download link
    const dlUrl = `${TORBOX_BASE_URL}/requestdl?token=${TORBOX_API_KEY}&torrent_id=${torrent_id}&file_id=${file_id}&zip_link=false`;
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

const PORT = process.env.PORT || 500;
app.listen(PORT, () => {
  console.log(`🚀 TorBox Server running on http://localhost:${PORT}`);
});