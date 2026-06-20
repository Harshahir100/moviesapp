import express from 'express';
import { SeriesController } from '../controllers/seriesController.js';

const router = express.Router();

router.get('/search/tmdb', SeriesController.searchTMDB);
router.post('/save', SeriesController.saveSeries);

export default router;