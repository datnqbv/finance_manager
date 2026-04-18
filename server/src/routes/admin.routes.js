import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getAdminDashboard, getAdminUsers, updateUserRole, deleteUser } from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;