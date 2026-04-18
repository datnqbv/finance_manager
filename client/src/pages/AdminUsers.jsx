import { useEffect, useState } from 'react';
import { FiRefreshCw, FiTrash2, FiShield, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminService } from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ user: 0, admin: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await adminService.getUsers({
        page,
        limit: pagination.limit,
        search: search || undefined,
        role: role || undefined,
      });
      setItems(response.data.items || []);
      setSummary(response.data.summary || { user: 0, admin: 0 });
      setPagination(response.data.pagination || { total: 0, page: 1, totalPages: 1, limit: 20 });
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Cannot load users' : 'Không thể tải người dùng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleRoleChange = async (id, nextRole) => {
    try {
      await adminService.updateUserRole(id, nextRole);
      toast.success(isEnglish ? 'Role updated' : 'Đã cập nhật vai trò');
      loadUsers(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Update failed' : 'Cập nhật thất bại'));
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      toast.warning(isEnglish ? 'You cannot delete your own account here' : 'Bạn không thể xóa chính tài khoản của mình ở đây');
      return;
    }
    if (!window.confirm(isEnglish ? 'Delete this user?' : 'Xóa người dùng này?')) return;
    try {
      await adminService.deleteUser(id);
      toast.success(isEnglish ? 'Deleted successfully' : 'Xóa thành công');
      loadUsers(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Delete failed' : 'Xóa thất bại'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Auth Admin' : 'Quản trị tài khoản'}</p>
        <h1 className="mt-2 text-4xl font-black">{isEnglish ? 'User management' : 'Quản lý người dùng'}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
          {isEnglish
            ? 'Manage account roles and keep tighter control over the system users.'
            : 'Quản lý vai trò tài khoản và kiểm soát chặt hơn người dùng trong hệ thống.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'Users' : 'Người dùng'}</div><div className="mt-2 text-3xl font-black">{summary.user}</div></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'Admins' : 'Quản trị viên'}</div><div className="mt-2 text-3xl font-black">{summary.admin}</div></div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#171a21]">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEnglish ? 'Search by name or email...' : 'Tìm theo tên hoặc email...'}
            className="rounded-xl border border-[#d8dde5] px-3 py-2 text-sm outline-none focus:border-[#6aa386]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-[#d8dde5] px-3 py-2 text-sm outline-none focus:border-[#6aa386]"
          >
            <option value="">{isEnglish ? 'All roles' : 'Tất cả vai trò'}</option>
            <option value="user">{isEnglish ? 'User' : 'Người dùng'}</option>
            <option value="admin">{isEnglish ? 'Admin' : 'Quản trị viên'}</option>
          </select>
          <button type="submit" className="rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00523d]">
            {isEnglish ? 'Search' : 'Tìm'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-[#171a21] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#f6f8fb] text-left text-xs uppercase tracking-wide text-[#728095]">
                <th className="px-4 py-3">{isEnglish ? 'User' : 'Người dùng'}</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">{isEnglish ? 'Role' : 'Vai trò'}</th>
                <th className="px-4 py-3">{isEnglish ? 'Created' : 'Tạo lúc'}</th>
                <th className="px-4 py-3 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-[#7b8798]" colSpan={5}>{isEnglish ? 'Loading...' : 'Đang tải...'}</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-[#7b8798]" colSpan={5}>{isEnglish ? 'No users found' : 'Không có người dùng nào'}</td></tr>
              ) : items.map((item) => {
                const isSelf = item.id === currentUser?.id;
                return (
                  <tr key={item.id} className="border-t border-[#edf1f5] align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1f2a38]">{item.name}</div>
                      <div className="text-xs text-[#6f7f92]">{item.googleId ? (isEnglish ? 'Google account' : 'Tài khoản Google') : (isEnglish ? 'Local account' : 'Tài khoản local')}</div>
                    </td>
                    <td className="px-4 py-3 text-[#4b5f77]">{item.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(item.id, e.target.value)}
                        className="rounded-lg border border-[#d8dde5] px-2 py-1 text-xs outline-none focus:border-[#6aa386] disabled:cursor-not-allowed disabled:bg-[#f2f4f8]"
                      >
                        <option value="user">{isEnglish ? 'User' : 'Người dùng'}</option>
                        <option value="admin">{isEnglish ? 'Admin' : 'Quản trị viên'}</option>
                      </select>
                      {isSelf ? <div className="mt-1 text-[11px] text-[#7a8798]">{isEnglish ? 'You' : 'Bạn'}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6f7f92]">{new Date(item.createdAt).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN')}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isSelf}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2 size={13} /> {isEnglish ? 'Delete' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#edf1f5] px-4 py-3 text-sm">
          <span className="text-[#5f6e82]">{isEnglish ? 'Page' : 'Trang'} {pagination.page}/{pagination.totalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={pagination.page <= 1 || loading} onClick={() => loadUsers(pagination.page - 1)} className="rounded-md border border-[#d6dde6] px-3 py-1.5 disabled:opacity-50">
              {isEnglish ? 'Prev' : 'Trước'}
            </button>
            <button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => loadUsers(pagination.page + 1)} className="rounded-md border border-[#d6dde6] px-3 py-1.5 disabled:opacity-50">
              {isEnglish ? 'Next' : 'Sau'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
