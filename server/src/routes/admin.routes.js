import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { 
  getAdminDashboard, 
  getAdminUsers, 
  updateUserRole, 
  deleteUser,
  updateUserVip,
  toggleUserBan,
  resetUserPassword,
  recordVisit,
  getVisitsList
} from '../controllers/admin.controller.js';

const router = express.Router();

// Public route for logged-in users to record their visit
router.post('/record-visit', protect, recordVisit);

// Admin-only routes
router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/vip', updateUserVip);
router.patch('/users/:id/ban', toggleUserBan);
router.patch('/users/:id/password', resetUserPassword);
router.get('/visits', getVisitsList);

export default router;