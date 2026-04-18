import { useEffect, useState } from 'react';
import { FiUsers, FiActivity, FiMail, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminService } from '../services/admin.service';
import { useLanguage } from '../context/LanguageContext';

const StatCard = ({ label, value, icon, hint }) => (
  <div className="rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#718096] dark:text-[#98a2b3]">{label}</p>
        <div className="mt-2 text-3xl font-black text-[#102a20] dark:text-white">{value}</div>
        {hint ? <p className="mt-2 text-xs text-[#798499] dark:text-[#93a0b3]">{hint}</p> : null}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f6ef] text-[#0a6b4e] dark:bg-[#103528] dark:text-[#7ee0b7]">
        {icon}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await adminService.getDashboard();
        setData(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || (isEnglish ? 'Cannot load admin dashboard' : 'Không thể tải dashboard admin'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isEnglish]);

  const counts = data?.counts || { users: 0, transactions: 0, contacts: 0, admins: 0 };
  const contactSummary = data?.contactSummary || { new: 0, read: 0, replied: 0 };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Admin Dashboard' : 'Dashboard quản trị'}</p>
        <h1 className="mt-2 text-4xl font-black">{isEnglish ? 'System overview' : 'Tổng quan hệ thống'}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
          {isEnglish
            ? 'This tab shows the overall health of the system: users, transactions, and contact requests.'
            : 'Tab này hiển thị tổng quan hệ thống: người dùng, giao dịch và các yêu cầu liên hệ.'}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#d6dde6] bg-white p-6 text-sm text-[#718096] dark:border-[#2a2f3a] dark:bg-[#171a21]">
          {isEnglish ? 'Loading admin data...' : 'Đang tải dữ liệu admin...'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={isEnglish ? 'Users' : 'Người dùng'} value={counts.users} icon={<FiUsers size={22} />} hint={isEnglish ? 'All accounts in the system' : 'Tất cả tài khoản trong hệ thống'} />
            <StatCard label={isEnglish ? 'Transactions' : 'Giao dịch'} value={counts.transactions} icon={<FiActivity size={22} />} hint={isEnglish ? 'Total income and expense entries' : 'Tổng số giao dịch thu chi'} />
            <StatCard label={isEnglish ? 'Contacts' : 'Liên hệ'} value={counts.contacts} icon={<FiMail size={22} />} hint={isEnglish ? 'Messages from users' : 'Tin nhắn từ người dùng'} />
            <StatCard label={isEnglish ? 'Admins' : 'Quản trị viên'} value={counts.admins} icon={<FiShield size={22} />} hint={isEnglish ? 'Accounts with admin role' : 'Tài khoản có quyền admin'} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21] lg:col-span-2">
              <h3 className="text-lg font-bold text-[#102a20] dark:text-white">{isEnglish ? 'Contact status' : 'Trạng thái liên hệ'}</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: isEnglish ? 'New' : 'Mới', value: contactSummary.new, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
                  { label: isEnglish ? 'Read' : 'Đã đọc', value: contactSummary.read, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
                  { label: isEnglish ? 'Replied' : 'Đã phản hồi', value: contactSummary.replied, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl px-4 py-3 text-sm font-semibold ${item.tone}`}>
                    <div>{item.label}</div>
                    <div className="mt-1 text-2xl font-black">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21]">
              <h3 className="text-lg font-bold text-[#102a20] dark:text-white">{isEnglish ? 'Quick note' : 'Ghi chú nhanh'}</h3>
              <p className="mt-3 text-sm leading-6 text-[#59667a] dark:text-[#97a3b6]">
                {isEnglish
                  ? 'Use this area to monitor the whole app: accounts, finances, and user support requests.'
                  : 'Dùng tab này để theo dõi toàn bộ ứng dụng: tài khoản, tài chính và yêu cầu hỗ trợ của người dùng.'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
