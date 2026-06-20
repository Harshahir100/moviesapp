// backend/src/routes/tmdbRoutes.js
import express from 'express';
import { TMDBController } from '../controllers/tmdbController.js';

const router = express.Router();

router.get('/search', TMDBController.search);
router.get('/details/:mediaType/:tmdbId', TMDBController.getDetails);

export default router;