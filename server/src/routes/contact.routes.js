import express from 'express';
import { submitContact } from '../controllers/contact.controller.js';

const router = express.Router();

// POST /api/contact  –  Public (không cần đăng nhập)
router.post('/', submitContact);

export default router;
