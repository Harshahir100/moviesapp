import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import movieRoutes from "./routes/movieRoutes.js";
import seriesRoutes from "./routes/seriesRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import torboxRoutes from "./routes/torboxRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- Security ---------------- */

// Hide Express headers & add security headers
app.use(helmet());

// Allow only your frontend
app.use(
  cors({
    origin: [
      "https://vegafilms.in",
      "https://www.vegafilms.in",
      "https://admin.vegafilms.in",
      "http://localhost:5173",
      "https://moviesapp-3-qe48.onrender.com",
    ],
    credentials: true,
  }),
);

// API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// Apply rate limit only on API
app.use("/api", apiLimiter);

// Body Parser
app.use(express.json({ limit: "50mb" }));

/* ---------------- Routes ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/torbox", torboxRoutes);

/* ---------------- Health ---------------- */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* ---------------- Start Server ---------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);

  console.log("====================================");
  console.log("Available API Routes");
  console.log("====================================");
  console.log("POST /api/auth/login");
  console.log("GET  /api/movies/list");
  console.log("GET  /api/movies/:id");
  console.log("GET  /api/series/list");
  console.log("GET  /api/series/:id");
  console.log("GET  /api/search");
  console.log("GET  /api/tmdb/search");
  console.log("POST /api/torbox/add");
  console.log("GET  /api/torbox/status");
  console.log("GET  /api/torbox/link");
  console.log("GET  /api/health");
});
