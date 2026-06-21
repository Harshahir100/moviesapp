// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import movieRoutes from './routes/movieRoutes.js';
import seriesRoutes from './routes/seriesRoutes.js';
import tmdbRoutes from './routes/tmdbRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);  // Added series routes
app.use('/api/tmdb', tmdbRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`\n📋 Available Routes:`);
    console.log(`   POST /api/auth/login     - Admin login`);
    console.log(`   GET  /api/movies/list    - Get all movies`);
    console.log(`   GET  /api/movies/:id     - Get movie details`);
    console.log(`   GET  /api/series/list    - Get all series`);
    console.log(`   GET  /api/series/:id     - Get series details`);
    console.log(`   GET  /api/tmdb/search    - Search TMDB`);
});