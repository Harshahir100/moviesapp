import express from 'express';
import { MovieController } from '../controllers/movieController.js';

const router = express.Router();

router.get('/search/tmdb', MovieController.searchTMDB);
router.get('/search/torrents', MovieController.searchTorrents);
router.post('/save', MovieController.saveMovie);
router.get('/list', MovieController.getMovies);
router.get('/:id', MovieController.getMovieDetails);

export default router;