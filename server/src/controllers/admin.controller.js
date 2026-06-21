import {
  getAdminDashboardStats,
  getAdminUsersList,
  updateUserRoleService,
  deleteUserService,
  updateUserVipService,
  toggleUserBanService,
  resetUserPasswordService,
  recordUserVisitService,
  getVisitsListService
} from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await getAdminDashboardStats();
  return res.json({
    success: true,
    data
  });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const data = await getAdminUsersList(req.query);
  return res.json({
    success: true,
    data
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = await updateUserRoleService(id, role);
  return res.json({
    success: true,
    message: 'Cập nhật vai trò thành công',
    data: user
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await deleteUserService(req.params.id);
  return res.json({ success: true, message: 'Xóa người dùng thành công' });
});

export const updateUserVip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isVip, vipExpire } = req.body;
  const user = await updateUserVipService(id, isVip, vipExpire);
  return res.json({
    success: true,
    message: 'Cập nhật trạng thái VIP thành công',
    data: user
  });
});

export const toggleUserBan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;
  const user = await toggleUserBanService(req.user.id, id, isBanned);
  return res.json({
    success: true,
    message: user.isBanned ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản thành công',
    data: user
  });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  await resetUserPasswordService(id, password);
  return res.json({
    success: true,
    message: 'Đặt lại mật khẩu thành công'
  });
});

export const recordVisit = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  await recordUserVisitService(req.user.id, ipAddress, userAgent);
  return res.json({ success: true });
});

export const getVisitsList = asyncHandler(async (req, res) => {
  const data = await getVisitsListService(req.query);
  return res.json({
    success: true,
    data
  });
});