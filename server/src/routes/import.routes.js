import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { importTransactions, getTemplate, upload } from '../controllers/import.controller.js';

const router = express.Router();

router.use(protect);

router.post('/transactions', upload.single('file'), importTransactions);
router.get('/template', getTemplate);

export default router;
