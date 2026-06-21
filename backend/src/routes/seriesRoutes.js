// backend/src/routes/seriesRoutes.js (Add search route)
import express from 'express';
import { SeriesController } from '../controllers/seriesController.js';

const router = express.Router();

// Public routes
router.get('/list', SeriesController.getSeriesList);
router.get('/:id', SeriesController.getSeriesDetails);

// Admin routes
router.get('/search/tmdb', SeriesController.searchTMDB);  // Add this line
router.post('/save', SeriesController.saveSeries);

export default router;