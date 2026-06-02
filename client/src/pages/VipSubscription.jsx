import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { 
  FiAward, 
  FiCheck, 
  FiLock, 
  FiZap, 
  FiTrendingUp, 
  FiBriefcase, 
  FiTarget, 
  FiFileText,
  FiClock
} from 'react-icons/fi';

const VipSubscription = () => {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [loading, setLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);

  const plans = [
    {
      id: '1_month',
      durationMonths: 1,
      name: isEnglish ? '1 Month VIP' : '1 Tháng VIP',
      price: 20000,
      originalPrice: 20000,
      savePercent: 0,
      description: isEnglish ? 'Perfect for testing premium features' : 'Trải nghiệm đầy đủ các tính năng cao cấp'
    },
    {
      id: '6_months',
      durationMonths: 6,
      name: isEnglish ? '6 Months VIP' : '6 Tháng VIP',
      price: 100000,
      originalPrice: 120000,
      savePercent: 16,
      description: isEnglish ? 'Great value for budget planning' : 'Lựa chọn tiết kiệm cho người dùng thông thái',
      isPopular: true
    },
    {
      id: '12_months',
      durationMonths: 12,
      name: isEnglish ? '1 Year VIP' : '1 Năm VIP',
      price: 180000,
      originalPrice: 240000,
      savePercent: 25,
      description: isEnglish ? 'Ultimate experience for long-term planning' : 'Đồng hành lâu dài cùng kế hoạch tài chính'
    }
  ];

  const benefits = [
    {
      title: isEnglish ? 'Multi-wallet account limit' : 'Giới hạn tài khoản ví',
      standard: isEnglish ? 'Max 3 wallets' : 'Tối đa 3 ví',
      vip: isEnglish ? 'Unlimited' : 'Không giới hạn 👑',
      icon: FiBriefcase
    },
    {
      title: isEnglish ? 'Budget limit' : 'Giới hạn ngân sách',
      standard: isEnglish ? 'Max 5 budgets' : 'Tối đa 5 ngân sách',
      vip: isEnglish ? 'Unlimited' : 'Không giới hạn 👑',
      icon: FiTarget
    },
    {
      title: isEnglish ? 'Monthly Transactions' : 'Số giao dịch mỗi tháng',
      standard: isEnglish ? 'Max 30 transactions' : 'Tối đa 30 giao dịch',
      vip: isEnglish ? 'Unlimited' : 'Không giới hạn 👑',
      icon: FiTrendingUp
    },
    {
      title: isEnglish ? 'OCR AI Scan Limit' : 'Giới hạn quét hóa đơn AI (OCR)',
      standard: isEnglish ? '3 scans / day' : '3 lượt quét / ngày',
      vip: isEnglish ? 'Unlimited' : 'Không giới hạn 👑',
      icon: FiZap
    },
    {
      title: isEnglish ? 'Advanced statistical analysis' : 'Phân tích & Dự báo tài chính',
      standard: isEnglish ? 'Locked' : 'Bị khóa',
      vip: isEnglish ? 'Full Access' : 'Mở khóa toàn bộ 👑',
      icon: FiTrendingUp
    },
    {
      title: isEnglish ? 'Advanced Export Options' : 'Xuất báo cáo cao cấp (PDF/Excel)',
      standard: isEnglish ? 'Basic reports only' : 'Chỉ báo cáo cơ bản',
      vip: isEnglish ? 'Full grouping & custom dates' : 'Tự do lọc thời gian & gộp dữ liệu 👑',
      icon: FiFileText
    }
  ];

  const fetchMyOrders = async () => {
    try {
      const response = await api.get('/vip/my-orders');
      if (response.data?.success) {
        setMyOrders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching VIP registration history:', err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [user]);

  // Handle redirect callback query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) {
      if (status === 'success') {
        toast.success(isEnglish ? 'VIP Account activated successfully! 👑' : 'Đã nâng cấp VIP thành công! 👑');
        refreshUser();
        fetchMyOrders();
      } else if (status === 'paid_pending') {
        toast.success(isEnglish ? 'Payment successful! Please wait for Admin approval to activate your VIP status. 👑' : 'Thanh toán thành công! Vui lòng chờ Admin kiểm duyệt và kích hoạt tài khoản VIP. 👑');
        fetchMyOrders();
      } else if (status === 'cancel') {
        toast.info(isEnglish ? 'Payment registration was cancelled' : 'Đơn đăng ký thanh toán đã bị hủy');
      } else if (status === 'error') {
        toast.error(isEnglish ? 'An error occurred during payment processing' : 'Có lỗi xảy ra trong quá trình thanh toán');
      }
      // Clean up query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isEnglish]);

  // Get active subscription duration
  const currentVipDuration = user?.isVip
    ? myOrders.reduce((max, order) => order.status === 'completed' ? Math.max(max, order.durationMonths) : max, 0)
    : 0;

  const hasPendingOrder = myOrders.some(order => order.status === 'pending');

  const handleSelectPlan = async (plan) => {
    setLoading(true);
    try {
      const response = await api.post('/vip/order', {
        durationMonths: plan.durationMonths,
        amount: plan.price
      });

      if (response.data?.success && response.data.data?.vnpayUrl) {
        // Redirect directly to VNPay checkout
        window.location.href = response.data.data.vnpayUrl;
      } else {
        toast.error(isEnglish ? 'Failed to initiate order' : 'Lỗi khởi tạo đơn đăng ký');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (isEnglish ? 'An error occurred' : 'Có lỗi xảy ra'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVip = async () => {
    const confirmMsg = isEnglish 
      ? 'Are you sure you want to cancel your VIP membership? You will lose all VIP privileges immediately.' 
      : 'Bạn có chắc chắn muốn hủy tư cách thành viên VIP? Tất cả quyền lợi VIP (ví, ngân sách, xuất báo cáo cao cấp...) của bạn sẽ bị khóa ngay lập tức.';
    
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const response = await api.post('/vip/cancel');
      if (response.data?.success) {
        toast.success(isEnglish ? 'VIP Membership cancelled successfully.' : 'Đã hủy tư cách thành viên VIP thành công.');
        await refreshUser();
        await fetchMyOrders();
      }
    } catch (err) {
      console.error('Error cancelling VIP:', err);
      toast.error(err.response?.data?.message || (isEnglish ? 'Failed to cancel VIP' : 'Lỗi khi hủy tư cách VIP'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmMsg = isEnglish 
      ? 'Are you sure you want to cancel and delete this VIP registration request?' 
      : 'Bạn có chắc chắn muốn hủy và xóa yêu cầu đăng ký VIP này?';

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const response = await api.delete(`/vip/order/${orderId}`);
      if (response.data?.success) {
        toast.success(isEnglish ? 'Order deleted successfully.' : 'Đã xóa đơn đăng ký thành công.');
        await fetchMyOrders();
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error(err.response?.data?.message || (isEnglish ? 'Failed to delete order' : 'Lỗi khi xóa đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { 
      style: 'currency', 
      currency: user?.currency || 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      
      {/* Header section with Premium design */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 mb-2">
          <FiAward size={36} className="animate-bounce" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          {isEnglish ? 'Upgrade to Premium VIP' : 'Nâng cấp tài khoản VIP'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base">
          {isEnglish 
            ? 'Unlock unlimited wallets, budgets, monthly transactions, advanced forecasts, and full custom reports.' 
            : 'Mở khóa giới hạn ví, ngân sách, lượt ghi chép và các công cụ thống kê nâng cao giúp quản lý tài chính hiệu quả hơn.'}
        </p>

        {user?.isVip && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 font-bold">
              👑 {isEnglish ? 'You are a VIP Member!' : 'Bạn đang là thành viên VIP!'} 
              {user.vipExpire && ` (${isEnglish ? 'Expires' : 'Hết hạn'}: ${new Date(user.vipExpire).toLocaleDateString('vi-VN')})`}
            </div>
            <button
              onClick={handleCancelVip}
              disabled={loading}
              className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 font-extrabold transition-all"
            >
              {isEnglish ? 'Cancel VIP Membership' : 'Hủy tư cách VIP'}
            </button>
          </div>
        )}

        {hasPendingOrder && (
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-bold max-w-xl mx-auto mt-2 text-center animate-pulse">
            ℹ️ {isEnglish 
              ? 'You have a pending VIP order. Please wait for Admin approval or cancel/complete it before upgrading further.' 
              : 'Bạn đang có yêu cầu đăng ký VIP đang chờ duyệt. Vui lòng đợi Admin kiểm duyệt hoặc xử lý yêu cầu cũ trước khi đăng ký gói mới.'}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isLocked = plan.durationMonths <= currentVipDuration;
          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col justify-between transition-all duration-300
                ${plan.isPopular 
                  ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.03] z-10' 
                  : ''
                }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 dark:bg-emerald-600 px-3 py-1 text-[11px] font-black uppercase text-white tracking-wider shadow-sm">
                  {isEnglish ? 'Popular' : 'Khuyên dùng'}
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{plan.description}</p>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    {formatCurrency(plan.price)}
                  </span>
                  {plan.savePercent > 0 && (
                    <span className="text-sm line-through text-gray-450 dark:text-gray-500">
                      {formatCurrency(plan.originalPrice)}
                    </span>
                  )}
                </div>

                {plan.savePercent > 0 && (
                  <span className="inline-block rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-650 dark:text-red-400 font-bold mb-6">
                    {isEnglish ? `Save ${plan.savePercent}%` : `Tiết kiệm ${plan.savePercent}%`}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading || isLocked || hasPendingOrder}
                className={`w-full py-3 mt-6 flex items-center justify-center gap-2 btn ${
                  isLocked || hasPendingOrder
                    ? 'bg-gray-100 dark:bg-dark-bg-hover text-gray-400 dark:text-gray-600 cursor-not-allowed border border-dashed border-gray-250 dark:border-dark-border'
                    : plan.isPopular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm hover:shadow-md'
                      : 'btn-secondary'
                }`}
              >
                {plan.durationMonths === currentVipDuration ? (
                  <>
                    <FiCheck size={16} className="text-emerald-500" />
                    {isEnglish ? 'Current Package' : 'Gói đang sử dụng'}
                  </>
                ) : plan.durationMonths < currentVipDuration ? (
                  <>
                    <FiLock size={14} />
                    {isEnglish ? 'Unavailable' : 'Không thể hạ cấp'}
                  </>
                ) : hasPendingOrder ? (
                  <>
                    <FiClock size={14} />
                    {isEnglish ? 'Awaiting Approval' : 'Đang chờ duyệt'}
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>{isEnglish ? 'Upgrade Now' : 'Nâng cấp ngay'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Benefits Table Comparison */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {isEnglish ? 'Membership Benefits Comparison' : 'So sánh quyền lợi thành viên'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-500 font-semibold">
                <th className="pb-4 text-emerald-600 dark:text-emerald-400 font-bold">{isEnglish ? 'Benefits' : 'Quyền lợi'}</th>
                <th className="pb-4">{isEnglish ? 'Standard' : 'Tài khoản thường'}</th>
                <th className="pb-4 text-emerald-600 dark:text-emerald-400 font-bold">{isEnglish ? 'VIP Premium' : 'Tài khoản VIP'}</th>
              </tr>
            </thead>
            <tbody>
              {benefits.map((benefit, index) => (
                <tr key={index} className="border-b border-gray-50 dark:border-[#1a1a1a]/40 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/20 transition-colors">
                  <td className="py-4 font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2.5">
                    {benefit.icon && <benefit.icon size={16} className="text-gray-400 dark:text-gray-550 flex-shrink-0" />}
                    {benefit.title}
                  </td>
                  <td className="py-4 text-gray-500 dark:text-gray-400">{benefit.standard}</td>
                  <td className="py-4 text-amber-500 dark:text-amber-400 font-extrabold flex items-center gap-1.5">
                    {benefit.vip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIP Registration History */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {isEnglish ? 'VIP Subscription History' : 'Lịch sử đăng ký VIP'}
        </h3>
        
        {myOrders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-450 text-center py-4">
            {isEnglish ? 'No VIP subscriptions yet.' : 'Bạn chưa đăng ký gói VIP nào.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2a2a2a] text-gray-450 dark:text-gray-550 font-semibold">
                  <th className="pb-4">{isEnglish ? 'Plan' : 'Gói'}</th>
                  <th className="pb-4">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                  <th className="pb-4">{isEnglish ? 'Payment Code' : 'Mã chuyển khoản'}</th>
                  <th className="pb-4">{isEnglish ? 'Date' : 'Ngày đăng ký'}</th>
                  <th className="pb-4">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-[#1a1a1a]/40 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/20 transition-colors">
                    <td className="py-4 font-semibold text-gray-800 dark:text-gray-255">
                      👑 {isEnglish ? `${order.durationMonths} Month(s) VIP` : `Gói VIP ${order.durationMonths} Tháng`}
                    </td>
                    <td className="py-4 text-gray-900 dark:text-white font-bold">{formatCurrency(order.amount)}</td>
                    <td className="py-4 font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">{order.paymentCode}</td>
                    <td className="py-4 text-gray-550 dark:text-gray-450">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4">
                      {order.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                          {isEnglish ? 'Activated' : 'Đã kích hoạt'}
                        </span>
                      )}
                      {order.status === 'pending' && (
                        <div className="flex items-center gap-3">
                          {order.isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-450 border border-blue-200 dark:border-blue-500/20 animate-pulse">
                              <FiClock size={12} className="mr-1" />
                              {isEnglish ? 'Paid (Pending Approval)' : 'Đã thanh toán (Chờ duyệt)'}
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse">
                                <FiClock size={12} className="mr-1" />
                                {isEnglish ? 'Pending Payment' : 'Chờ chuyển khoản'}
                              </span>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-bold transition-all"
                                title={isEnglish ? 'Cancel registration request' : 'Hủy yêu cầu đăng ký này'}
                              >
                                {isEnglish ? 'Cancel' : 'Hủy đơn'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          {isEnglish ? 'Cancelled' : 'Đã hủy'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default VipSubscription;
