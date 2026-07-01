// backend/src/routes/searchRoutes.js
import express from 'express';
import { SearchController } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', SearchController.search);

export default router;