import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  mergeCategories,
  reorderCategories
} from '../controllers/category.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Bulk operations
router.put('/reorder', reorderCategories);

// CRUD operations
router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

// Additional operations
router.get('/:id/stats', getCategoryStats);
router.post('/:id/merge', mergeCategories);

export default router;
