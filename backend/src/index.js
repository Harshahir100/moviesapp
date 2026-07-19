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
app.use("/api/torbox", torboxRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`POST /api/auth/login`);
  console.log(`GET  /api/movies/list`);
  console.log(`GET  /api/series/list`);
  console.log(`GET  /api/tmdb/search`);
  console.log(`POST /api/torbox/add`);
  console.log(`GET  /api/torbox/status`);
  console.log(`GET  /api/torbox/link`);
});