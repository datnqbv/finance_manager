import express from 'express';
import { getFinancialAdvice } from '../controllers/advisor.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFinancialAdvice);

export default router;
