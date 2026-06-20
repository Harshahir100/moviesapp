// backend/src/routes/torrentRoutes.js (Updated)
import express from 'express';
import { TorrentController } from '../controllers/torrentController.js';

const router = express.Router();

router.get('/search', TorrentController.searchTorrents);
router.post('/save', TorrentController.saveContent);
router.get('/database/search', TorrentController.searchDatabase);
router.get('/content/:tmdbId', TorrentController.getContent);

export default router;