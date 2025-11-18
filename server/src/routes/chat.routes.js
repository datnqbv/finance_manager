import express from 'express';
import { sendMessage } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/message', protect, sendMessage);

export default router;
