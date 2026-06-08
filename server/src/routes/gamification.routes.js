import express from 'express';
import { getLeaderboard } from '../controllers/gamification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/leaderboard', protect, getLeaderboard);

export default router;
