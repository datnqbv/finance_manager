import { useEffect, useState } from 'react';
import { 
  FiUsers, 
  FiActivity, 
  FiMail, 
  FiShield, 
  FiTrendingUp, 
  FiAward, 
  FiCreditCard, 
  FiCalendar 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminService } from '../services/admin.service';
import { useLanguage } from '../context/LanguageContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

const StatCard = ({ label, value, icon, hint }) => (
  <div className="rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#718096] dark:text-[#98a2b3]">{label}</p>
        <div className="mt-2 text-3xl font-black text-[#102a20] dark:text-white truncate max-w-[180px]">{value}</div>
        {hint ? <p className="mt-2 text-[10px] text-[#798499] dark:text-[#93a0b3] leading-normal">{hint}</p> : null}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f6ef] text-[#0a6b4e] dark:bg-[#103528] dark:text-[#7ee0b7] flex-shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

const ChartTip = ({ active, payload, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 shadow-lg text-xs">
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnglish]);

  const counts = data?.counts || { users: 0, transactions: 0, contacts: 0, admins: 0, vipRevenue: 0, activeVips: 0 };
  const contactSummary = data?.contactSummary || { new: 0, read: 0, replied: 0 };
  const past6Months = data?.past6Months || [];
  const recentOrders = data?.recentVipOrders || [];

  const fmt = (n) =>
    new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n || 0);

  const fmtShort = (n) => {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Admin Dashboard' : 'Dashboard quản trị'}</p>
        <h1 className="mt-2 text-4xl font-black">{isEnglish ? 'System overview' : 'Tổng quan hệ thống'}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
          {isEnglish
            ? 'Track registered accounts, system transactions, support tickets, and VIP subscription revenue statistics.'
            : 'Theo dõi tổng quan tài khoản, giao dịch toàn hệ thống, yêu cầu hỗ trợ và doanh thu đăng ký thành viên VIP.'}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#d6dde6] bg-white p-6 text-sm text-[#718096] dark:border-[#2a2f3a] dark:bg-[#171a21] animate-pulse">
          {isEnglish ? 'Loading admin data...' : 'Đang tải dữ liệu admin...'}
        </div>
      ) : (
        <>
          {/* Main counts stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={isEnglish ? 'Users' : 'Người dùng'} value={counts.users} icon={<FiUsers size={22} />} hint={isEnglish ? 'All accounts in system' : 'Tài khoản hệ thống'} />
            <StatCard label={isEnglish ? 'Transactions' : 'Giao dịch'} value={counts.transactions} icon={<FiActivity size={22} />} hint={isEnglish ? 'Total ledger entries' : 'Tổng số ghi chép thu chi'} />
            <StatCard label={isEnglish ? 'Active VIPs' : 'VIP Đang hoạt động'} value={counts.activeVips} icon={<FiAward size={22} />} hint={isEnglish ? 'Premium subscribers count' : 'Thành viên VIP hiện tại'} />
            <StatCard label={isEnglish ? 'VIP Revenue' : 'Doanh thu VIP'} value={fmt(counts.vipRevenue)} icon={<FiTrendingUp size={22} />} hint={isEnglish ? 'Total subscription revenue' : 'Tổng doanh thu từ gói VIP'} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            
            {/* VIP Revenue trends chart */}
            <div className="lg:col-span-8 rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21] flex flex-col justify-between">
              <div className="mb-3 flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-emerald-500"/>
                <h3 className="text-lg font-bold text-[#102a20] dark:text-white">
                  {isEnglish ? 'VIP Subscription Revenue (Last 6 Months)' : 'Doanh thu gói VIP (6 tháng gần nhất)'}
                </h3>
              </div>
              <div className="h-[250px] w-full mt-2">
                {past6Months.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={past6Months.map(m => ({ name: m.label, [isEnglish ? 'Revenue' : 'Doanh thu']: m.amount }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#2b303c]"/>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} width={48} />
                      <Tooltip content={<ChartTip fmt={fmt}/>}/>
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey={isEnglish ? 'Revenue' : 'Doanh thu'} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-[#718096]">{isEnglish ? 'No VIP revenue logs yet' : 'Chưa có lịch sử doanh thu VIP'}</div>
                )}
              </div>
            </div>

            {/* Contacts & notes */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21]">
                <h3 className="text-lg font-bold text-[#102a20] dark:text-white">{isEnglish ? 'Support Requests' : 'Trạng thái liên hệ'}</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: isEnglish ? 'New' : 'Mới', value: contactSummary.new, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
                    { label: isEnglish ? 'Read' : 'Đã đọc', value: contactSummary.read, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
                    { label: isEnglish ? 'Replied' : 'Phản hồi', value: contactSummary.replied, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl px-2 py-3 text-center ${item.tone}`}>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="mt-1 text-xl font-black">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#e2e6ee] bg-white p-5 shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21]">
                <h3 className="text-lg font-bold text-[#102a20] dark:text-white">{isEnglish ? 'System Alerts' : 'Lưu ý hệ thống'}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#59667a] dark:text-[#97a3b6]">
                  {isEnglish
                    ? 'Use the sidebar tools to approve MoMo VIP subscription requests, manage user credentials, toggle VIP status overrides, or lock suspended accounts.'
                    : 'Sử dụng các công cụ quản trị bên thanh điều hướng để phê duyệt yêu cầu đăng ký VIP qua MoMo, cấp đặc quyền VIP, hoặc khóa các tài khoản vi phạm điều khoản.'}
                </p>
              </div>
            </div>

          </div>

          {/* Recent VIP transactions */}
          <div className="rounded-2xl border border-[#e2e6ee] bg-white shadow-sm dark:border-[#2a2f3a] dark:bg-[#171a21] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e6ee] dark:border-[#2a2f3a] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#102a20] dark:text-white flex items-center gap-2">
                <FiCreditCard className="text-amber-500" />
                {isEnglish ? 'Recent VIP Subscriptions' : 'Đăng ký VIP gần đây'}
              </h3>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{isEnglish ? 'Last 5 items' : '5 giao dịch mới nhất'}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f8fb] dark:bg-[#232936] text-left text-xs uppercase tracking-wide text-[#728095] dark:text-gray-400">
                    <th className="px-5 py-3">{isEnglish ? 'User' : 'Người dùng'}</th>
                    <th className="px-5 py-3">{isEnglish ? 'Transfer Code' : 'Mã chuyển khoản'}</th>
                    <th className="px-5 py-3">{isEnglish ? 'Duration' : 'Thời hạn'}</th>
                    <th className="px-5 py-3 text-right">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                    <th className="px-5 py-3">{isEnglish ? 'Date' : 'Ngày đăng ký'}</th>
                    <th className="px-5 py-3">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-[#edf1f5] dark:border-gray-800 hover:bg-gray-50/40 dark:hover:bg-gray-800/10 transition-all">
                        <td className="px-5 py-3">
                          <p className="font-bold text-gray-800 dark:text-gray-200">{order.user?.name || '---'}</p>
                          <p className="text-xs text-gray-400">{order.user?.email || '---'}</p>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{order.paymentCode}</td>
                        <td className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                          {order.durationMonths} {isEnglish ? 'Month(s) VIP' : 'Tháng VIP'}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900 dark:text-white">{fmt(order.amount)}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar size={12} />
                            {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {order.status === 'completed' && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {isEnglish ? 'Completed' : 'Hoàn thành'}
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-extrabold animate-pulse">
                              {isEnglish ? 'Pending' : 'Chờ duyệt'}
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-600 dark:text-rose-400 font-extrabold">
                              {isEnglish ? 'Cancelled' : 'Đã hủy'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-gray-400">{isEnglish ? 'No VIP subscriptions yet' : 'Chưa có đăng ký thành viên VIP nào'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
