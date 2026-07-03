import { useEffect, useState } from 'react';
import { 
  FiTrash2, 
  FiShield, 
  FiLock, 
  FiUnlock, 
  FiKey, 
  FiAward,
  FiX,
  FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminService } from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Pagination from '../components/Pagination';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ user: 0, admin: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // VIP override modal state
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipTargetUser, setVipTargetUser] = useState(null);
  const [tempIsVip, setTempIsVip] = useState(false);
  const [tempVipExpire, setTempVipExpire] = useState('');

  const loadUsers = async (page = 1, silent = false, limitOverride = null) => {
    if (!silent) setLoading(true);
    try {
      const response = await adminService.getUsers({
        page,
        limit: limitOverride !== null ? limitOverride : pagination.limit,
        search: search || undefined,
        role: role || undefined,
      });
      setItems(response.data.items || []);
      setSummary(response.data.summary || { user: 0, admin: 0 });
      setPagination(response.data.pagination || { total: 0, page: 1, totalPages: 1, limit: limitOverride !== null ? limitOverride : pagination.limit });
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Cannot load users' : 'Không thể tải người dùng'));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleRoleChange = async (id, nextRole) => {
    setActionLoading(true);
    const previousItems = [...items];
    // Optimistically update the UI
    setItems(prev => prev.map(item => item.id === id ? { ...item, role: nextRole } : item));

    try {
      await adminService.updateUserRole(id, nextRole);
      toast.success(isEnglish ? 'Role updated successfully' : 'Đã cập nhật vai trò thành công');
      loadUsers(pagination.page, true);
    } catch (error) {
      setItems(previousItems);
      toast.error(error.response?.data?.message || (isEnglish ? 'Update failed' : 'Cập nhật thất bại'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanToggle = async (id, currentBanStatus) => {
    if (id === currentUser?.id) {
      toast.warning(isEnglish ? 'You cannot ban your own account' : 'Bạn không thể tự khóa tài khoản của mình');
      return;
    }
    const confirmMsg = currentBanStatus
      ? (isEnglish ? 'Unban this user?' : 'Mở khóa tài khoản này?')
      : (isEnglish ? 'Ban this user? They will lose access immediately.' : 'Khóa tài khoản này? Người dùng này sẽ mất quyền truy cập ngay lập tức.');
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    const previousItems = [...items];
    // Optimistically update the UI
    setItems(prev => prev.map(item => item.id === id ? { ...item, isBanned: !currentBanStatus } : item));

    try {
      const response = await adminService.toggleUserBan(id, { isBanned: !currentBanStatus });
      toast.success(response.message || (isEnglish ? 'Ban status updated' : 'Đã cập nhật trạng thái khóa'));
      loadUsers(pagination.page, true);
    } catch (error) {
      setItems(previousItems);
      toast.error(error.response?.data?.message || (isEnglish ? 'Ban toggle failed' : 'Thao tác khóa/mở khóa thất bại'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      toast.error(isEnglish ? 'Password must be at least 6 characters' : 'Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.resetUserPassword(passwordTargetUser.id, { password: newPassword });
      toast.success(isEnglish ? 'Password reset successful' : 'Đặt lại mật khẩu thành công');
      setShowPasswordModal(false);
      setPasswordTargetUser(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Reset failed' : 'Đặt lại mật khẩu thất bại'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVipOverrideSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    const isTargetAdmin = vipTargetUser.role === 'admin';
    const newVipExpire = tempIsVip && tempVipExpire ? tempVipExpire : null;
    
    const previousItems = [...items];
    // Optimistically update the UI
    setItems(prev => prev.map(item => 
      item.id === vipTargetUser.id 
        ? { ...item, isVip: tempIsVip, vipExpire: newVipExpire } 
        : item
    ));

    try {
      await adminService.updateUserVip(vipTargetUser.id, {
        isVip: tempIsVip,
        vipExpire: newVipExpire
      });

      if (isTargetAdmin) {
        toast.success(
          isEnglish 
            ? `VIP status updated for Admin ${vipTargetUser.name}. Admins still require active VIP status for premium personal features.`
            : `Đã cập nhật trạng thái VIP cho Admin ${vipTargetUser.name}. Admin vẫn cần quyền VIP hoạt động để sử dụng các tính năng cá nhân nâng cao.`
        );
      } else {
        toast.success(isEnglish ? 'VIP status updated successfully' : 'Đã cập nhật trạng thái VIP thành công');
      }

      setShowVipModal(false);
      setVipTargetUser(null);
      loadUsers(pagination.page, true);
    } catch (error) {
      setItems(previousItems);
      toast.error(error.response?.data?.message || (isEnglish ? 'VIP override failed' : 'Cập nhật VIP thất bại'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      toast.warning(isEnglish ? 'You cannot delete your own account here' : 'Bạn không thể xóa chính tài khoản của mình ở đây');
      return;
    }
    if (!window.confirm(isEnglish ? 'Delete this user?' : 'Xóa người dùng này?')) return;
    
    setActionLoading(true);
    const previousItems = [...items];
    // Optimistically update the UI
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      await adminService.deleteUser(id);
      toast.success(isEnglish ? 'Deleted successfully' : 'Xóa thành công');
      loadUsers(pagination.page, true);
    } catch (error) {
      setItems(previousItems);
      toast.error(error.response?.data?.message || (isEnglish ? 'Delete failed' : 'Xóa thất bại'));
    } finally {
      setActionLoading(false);
    }
  };

  const openPasswordModal = (user) => {
    setPasswordTargetUser(user);
    setShowPasswordModal(true);
  };

  const openVipModal = (user) => {
    setVipTargetUser(user);
    setTempIsVip(user.isVip);
    setTempVipExpire(user.vipExpire ? new Date(user.vipExpire).toISOString().split('T')[0] : '');
    setShowVipModal(true);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-[#0a5c48] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Auth Admin' : 'Quản trị tài khoản'}</p>
        <h1 className="mt-2 text-4xl font-black">{isEnglish ? 'User management' : 'Quản lý người dùng'}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
          {isEnglish
            ? 'Manage account roles, ban/unban users, override VIP membership trials, and reset passwords.'
            : 'Quản lý vai trò tài khoản, khóa người dùng, cấp đặc quyền VIP thử nghiệm, và đặt lại mật khẩu.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'Users' : 'Người dùng'}</div><div className="mt-2 text-3xl font-black">{summary.user}</div></div>
        <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'Admins' : 'Quản trị viên'}</div><div className="mt-2 text-3xl font-black">{summary.admin}</div></div>
      </div>

      <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEnglish ? 'Search by name or email...' : 'Tìm theo tên hoặc email...'}
            className="rounded-xl border border-[#d8dde5] bg-[#FFFCF5] dark:border-gray-800 dark:bg-gray-850 dark:text-white px-3 py-2 text-sm outline-none focus:border-[#6aa386]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-[#d8dde5] bg-[#FFFCF5] dark:border-gray-800 dark:bg-gray-850 dark:text-white px-3 py-2 text-sm outline-none focus:border-[#6aa386]"
          >
            <option value="">{isEnglish ? 'All roles' : 'Tất cả vai trò'}</option>
            <option value="user">{isEnglish ? 'User' : 'Người dùng'}</option>
            <option value="admin">{isEnglish ? 'Admin' : 'Quản trị viên'}</option>
          </select>
        </form>
      </div>

      <div className="rounded-2xl bg-[#FFFCF5] shadow-sm dark:bg-[#171a21] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#FFFCF5] dark:bg-[#232936] text-left text-xs uppercase tracking-wide text-[#728095] dark:text-gray-400">
                <th className="px-4 py-3">{isEnglish ? 'User' : 'Người dùng'}</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">{isEnglish ? 'Role' : 'Vai trò'}</th>
                <th className="px-4 py-3">{isEnglish ? 'VIP Account' : 'Thành viên VIP'}</th>
                <th className="px-4 py-3">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                <th className="px-4 py-3 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-[#7b8798]" colSpan={6}>{isEnglish ? 'Loading...' : 'Đang tải...'}</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-[#7b8798]" colSpan={6}>{isEnglish ? 'No users found' : 'Không có người dùng nào'}</td></tr>
              ) : items.map((item) => {
                const isSelf = item.id === currentUser?.id;
                const isVipActive = item.isVip && (!item.vipExpire || new Date(item.vipExpire) > new Date());
                return (
                  <tr key={item.id} className="border-t border-[#edf1f5] dark:border-gray-800 align-top hover:bg-[#FFFCF5]/40 dark:hover:bg-gray-800/10">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1f2a38] dark:text-gray-200 flex items-center gap-1">
                        {item.name}
                        {isVipActive && <span className="text-amber-500" title="VIP Member">👑</span>}
                      </div>
                      <div className="text-xs text-[#6f7f92] dark:text-gray-400">
                        {item.googleId ? (isEnglish ? 'Google Account' : 'Tài khoản Google') : (isEnglish ? 'Local Account' : 'Tài khoản Local')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4b5f77] dark:text-gray-300 font-medium">{item.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.role}
                        disabled={isSelf || actionLoading}
                        onChange={(e) => handleRoleChange(item.id, e.target.value)}
                        className="rounded-lg border border-[#d8dde5] bg-[#FFFCF5] dark:border-gray-700 dark:bg-gray-850 dark:text-white px-2 py-1 text-xs outline-none focus:border-[#6aa386] disabled:cursor-not-allowed disabled:bg-[#F3EBD8] dark:disabled:bg-gray-800"
                      >
                        <option value="user">{isEnglish ? 'User' : 'Người dùng'}</option>
                        <option value="admin">{isEnglish ? 'Admin' : 'Quản trị viên'}</option>
                      </select>
                      {isSelf ? <div className="mt-1 text-[11px] text-[#7a8798]">{isEnglish ? 'You' : 'Bạn'}</div> : null}
                    </td>
                    <td className="px-4 py-3">
                      {isVipActive ? (
                        <div className="text-xs font-semibold">
                          <span className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-amber-600 dark:text-amber-400 font-extrabold mb-1">👑 VIP</span>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {item.vipExpire ? `${isEnglish ? 'Expires' : 'Hết hạn'}: ${new Date(item.vipExpire).toLocaleDateString('vi-VN')}` : (isEnglish ? 'Lifetime' : 'Vĩnh viễn')}
                          </p>
                        </div>
                      ) : (
                        <span className="inline-block rounded-full bg-[#F3EBD8] dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400 font-bold">{isEnglish ? 'Standard' : 'Thường'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.isBanned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-black text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {isEnglish ? 'Banned' : 'Đã khóa'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {isEnglish ? 'Active' : 'Hoạt động'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* VIP Override */}
                        <button
                          onClick={() => openVipModal(item)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:hover:bg-amber-950/20 transition-all"
                          title={isEnglish ? 'VIP Override' : 'Cấp quyền VIP'}
                        >
                          <FiAward size={13} />
                        </button>
                        
                        {/* Password Reset */}
                        {!item.googleId && (
                          <button
                            onClick={() => openPasswordModal(item)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:hover:bg-blue-950/20 transition-all"
                            title={isEnglish ? 'Reset Password' : 'Đặt lại mật khẩu'}
                          >
                            <FiKey size={13} />
                          </button>
                        )}

                        {/* Ban / Unban */}
                        {!isSelf && (
                          <button
                            onClick={() => handleBanToggle(item.id, item.isBanned)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-lg border transition-all ${
                              item.isBanned 
                                ? 'border-emerald-200 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:hover:bg-emerald-950/20' 
                                : 'border-rose-250 hover:bg-rose-50 text-rose-500 dark:border-rose-900/40 dark:hover:bg-rose-950/20'
                            }`}
                            title={item.isBanned ? (isEnglish ? 'Unban Account' : 'Mở khóa') : (isEnglish ? 'Ban Account' : 'Khóa tài khoản')}
                          >
                            {item.isBanned ? <FiUnlock size={13} /> : <FiLock size={13} />}
                          </button>
                        )}

                        {/* Delete User */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isSelf || actionLoading}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-900/40 dark:hover:bg-red-950/20 transition-all disabled:opacity-50"
                          title={isEnglish ? 'Delete User' : 'Xóa tài khoản'}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.total > 0 && (
          <div className="px-4 pb-3">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => loadUsers(p)}
              itemsPerPage={pagination.limit}
              onItemsPerPageChange={(l) => loadUsers(1, false, l)}
              totalItems={pagination.total}
              showItemsPerPageSelector={true}
            />
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFCF5] dark:bg-[#151921] rounded-3xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <FiKey className="text-blue-500" />
                {isEnglish ? 'Reset Password' : 'Đặt lại mật khẩu'}
              </h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordTargetUser(null); }} className="p-1 text-gray-400 hover:bg-[#F3EBD8] dark:hover:bg-gray-800 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handlePasswordResetSubmit} className="p-5 space-y-4">
              <div className="bg-[#FFFCF5] dark:bg-[#1e2430] p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
                <p className="text-gray-500 dark:text-gray-400">{isEnglish ? 'User Account:' : 'Tài khoản:'}</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{passwordTargetUser.name} ({passwordTargetUser.email})</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{isEnglish ? 'New Password' : 'Mật khẩu mới'}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#191e29] dark:text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={actionLoading} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold transition">
                  {isEnglish ? 'Confirm Reset' : 'Đặt lại mật khẩu'}
                </button>
                <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordTargetUser(null); }} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-2.5 text-xs font-bold hover:bg-[#F3EBD8] dark:hover:bg-gray-800 transition">
                  {isEnglish ? 'Cancel' : 'Hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIP Override Modal */}
      {showVipModal && vipTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFCF5] dark:bg-[#151921] rounded-3xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <FiAward className="text-amber-500" />
                {isEnglish ? 'Manual VIP Override' : 'Điều chỉnh quyền VIP'}
              </h3>
              <button onClick={() => { setShowVipModal(false); setVipTargetUser(null); }} className="p-1 text-gray-400 hover:bg-[#F3EBD8] dark:hover:bg-gray-800 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleVipOverrideSubmit} className="p-5 space-y-4">
              <div className="bg-[#FFFCF5] dark:bg-[#1e2430] p-3 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
                <p className="text-gray-500 dark:text-gray-400">{isEnglish ? 'User Account:' : 'Tài khoản:'}</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{vipTargetUser.name} ({vipTargetUser.email})</p>
              </div>
              
              {vipTargetUser.role === 'admin' && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3 rounded-2xl text-xs space-y-1">
                  <p className="font-extrabold flex items-center gap-1">
                    ⚠️ {isEnglish ? 'Admin VIP Status Note' : 'Lưu ý về quyền VIP của Admin'}
                  </p>
                  <p className="leading-relaxed">
                    {isEnglish 
                      ? 'Admins require active VIP status to bypass personal wallet, budget, and transaction limits on their dashboard.' 
                      : 'Tài khoản Admin vẫn cần kích hoạt trạng thái VIP để sử dụng đầy đủ các tính năng nâng cao (ví, ngân sách, giao dịch không giới hạn) trên trang cá nhân của họ.'}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800/40">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{isEnglish ? 'VIP Active Status' : 'Kích hoạt tài khoản VIP'}</label>
                <input
                  type="checkbox"
                  checked={tempIsVip}
                  onChange={(e) => setTempIsVip(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                />
              </div>

              {tempIsVip && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{isEnglish ? 'Expiration Date' : 'Ngày hết hạn (để trống là vĩnh viễn)'}</label>
                  <input
                    type="date"
                    value={tempVipExpire}
                    onChange={(e) => setTempVipExpire(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-[#191e29] dark:text-white rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={actionLoading} className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-2.5 text-xs font-bold transition">
                  {isEnglish ? 'Apply Changes' : 'Lưu thay đổi'}
                </button>
                <button type="button" onClick={() => { setShowVipModal(false); setVipTargetUser(null); }} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-2.5 text-xs font-bold hover:bg-[#F3EBD8] dark:hover:bg-gray-800 transition">
                  {isEnglish ? 'Cancel' : 'Hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
