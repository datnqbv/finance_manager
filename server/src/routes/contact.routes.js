import express from 'express';
import { submitContact, getContactMessages, updateContactMessage, deleteContactMessage } from '../controllers/contact.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/contact  –  Public (không cần đăng nhập)
router.post('/', submitContact);

router.get('/messages', protect, authorize('admin'), getContactMessages);
router.put('/messages/:id', protect, authorize('admin'), updateContactMessage);
router.delete('/messages/:id', protect, authorize('admin'), deleteContactMessage);

export default router;
