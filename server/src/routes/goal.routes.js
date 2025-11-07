import express from 'express';
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addAmountToGoal,
  getGoalStats
} from '../controllers/goal.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes
router.get('/stats', getGoalStats);
router.post('/:id/add-amount', addAmountToGoal);

// CRUD operations
router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .get(getGoal)
  .put(updateGoal)
  .delete(deleteGoal);

export default router;
