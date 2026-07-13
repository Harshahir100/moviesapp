import "dotenv/config";

import express from "express";
import cors from "cors";

import movieRoutes from "./routes/movieRoutes.js";
import seriesRoutes from "./routes/seriesRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import torboxRoutes from "./routes/torboxRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/torbox", torboxRoutes); // ✅ Add this

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`   POST /api/torbox/add     - Add torrent to TorBox`);
  console.log(`   GET  /api/torbox/status  - Get torrent status`);
  console.log(`   GET  /api/torbox/link    - Get download link`);
  console.log(`   GET  /api/torbox/test    - Test TorBox routes`);
  // console.log("🔑 =========================================");
  // console.log(process.cwd());
  // console.log(process.env.TORBOX_API_KEY);
  
});
