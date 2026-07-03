import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { 
  FiCheckCircle, 
  FiClock, 
  FiXCircle, 
  FiCreditCard, 
  FiUser, 
  FiCalendar, 
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import Pagination from '../components/Pagination';

const AdminVipPayments = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vip/orders');
      if (response.data?.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (isEnglish ? 'Failed to fetch orders' : 'Lỗi tải danh sách đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset page on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleConfirm = async (orderId) => {
    if (!window.confirm(isEnglish ? 'Confirm payment receipt and activate VIP for this user?' : 'Xác nhận đã nhận tiền và kích hoạt VIP cho người dùng này?')) {
      return;
    }
    
    try {
      const response = await api.put(`/vip/order/${orderId}/confirm`);
      if (response.data?.success) {
        toast.success(response.data.message || (isEnglish ? 'Order confirmed successfully!' : 'Duyệt thanh toán thành công!'));
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (isEnglish ? 'Approval failed' : 'Duyệt thanh toán thất bại'));
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(isEnglish ? 'Are you sure you want to delete/reject this payment request?' : 'Bạn có chắc chắn muốn xóa/bỏ qua yêu cầu kiểm duyệt thanh toán này?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/vip/order/${orderId}`);
      if (response.data?.success) {
        toast.success(isEnglish ? 'Order deleted successfully!' : 'Đã xóa đơn đăng ký thành công!');
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (isEnglish ? 'Delete failed' : 'Xóa đơn đăng ký thất bại'));
    }
  };

  const getStatusBadge = (order) => {
    switch (order.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle size={12} />
            {isEnglish ? 'Completed' : 'Hoàn thành'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/40 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
            <FiXCircle size={12} />
            {isEnglish ? 'Cancelled' : 'Đã hủy'}
          </span>
        );
      case 'pending':
      default:
        if (order.isPaid) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/40 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 animate-pulse">
              <FiCheckCircle size={12} />
              {isEnglish ? 'Paid (Pending)' : 'Đã thanh toán (Chờ duyệt)'}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
            <FiClock size={12} />
            {isEnglish ? 'Pending Payment' : 'Chờ chuyển khoản'}
          </span>
        );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const removeVietnameseTones = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // Filter & Search logic
  const filteredOrders = orders.filter(order => {
    const searchLower = removeVietnameseTones(searchQuery.toLowerCase());
    const matchesSearch = 
      removeVietnameseTones(order.paymentCode?.toLowerCase() || '').includes(searchLower) ||
      removeVietnameseTones(order.user?.name?.toLowerCase() || '').includes(searchLower) ||
      removeVietnameseTones(order.user?.email?.toLowerCase() || '').includes(searchLower);
      
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {isEnglish ? 'VIP Payment Approvals' : 'Kiểm duyệt thanh toán VIP'}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isEnglish ? 'Review and approve MoMo and VNPay VIP subscription orders' : 'Xem xét và xác nhận các đơn đăng ký VIP qua MoMo và VNPay'}
        </p>
      </div>

      {/* Control panel (Filters + Search) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-gray-800">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder={isEnglish ? 'Search code, name, email...' : 'Tìm mã, tên, email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-gray-200 bg-[#FFFCF5] dark:border-gray-800 dark:bg-[#232936] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <FiFilter size={15} className="text-gray-400 flex-shrink-0" />
          <div className="flex rounded-xl bg-[#F3EBD8] dark:bg-gray-800/40 p-0.5 shrink-0">
            {['all', 'pending', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors
                  ${statusFilter === status
                    ? 'bg-[#FFFCF5] text-gray-950 dark:bg-[#22252d] dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                {status === 'all' ? (isEnglish ? 'All' : 'Tất cả') : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table List */}
      <div className="rounded-2xl bg-[#FFFCF5] p-6 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-sm text-gray-500">
            {isEnglish ? 'Loading payments log...' : 'Đang tải lịch sử giao dịch...'}
          </div>
        ) : paginatedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">{isEnglish ? 'Date' : 'Ngày tạo'}</th>
                  <th className="py-3 px-4">{isEnglish ? 'User' : 'Khách hàng'}</th>
                  <th className="py-3 px-4">{isEnglish ? 'Code' : 'Mã chuyển khoản'}</th>
                  <th className="py-3 px-4">{isEnglish ? 'Duration' : 'Gói hạn'}</th>
                  <th className="py-3 px-4 text-right">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                  <th className="py-3 px-4">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                  <th className="py-3 px-4 text-center">{isEnglish ? 'Action' : 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-[#FFFCF5]/50 dark:hover:bg-gray-800/5 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <FiCalendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#F3EBD8] dark:bg-gray-850 flex items-center justify-center text-gray-500">
                          <FiUser size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{order.user?.name || '---'}</p>
                          <p className="text-xs text-gray-400">{order.user?.email || '---'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-amber-500 tracking-wider">
                      {order.paymentCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      {order.durationMonths} {isEnglish ? 'Months' : 'Tháng'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-colors"
                          >
                            <FiCheckCircle size={12} />
                            {isEnglish ? 'Approve' : 'Duyệt'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-405 transition-colors"
                          title={isEnglish ? 'Delete payment entry' : 'Xóa đơn hàng'}
                        >
                          <FiXCircle size={12} />
                          {isEnglish ? 'Xóa' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <FiCreditCard className="mx-auto text-gray-300 dark:text-gray-750 mb-3" size={48} />
            <p className="text-sm font-semibold">{isEnglish ? 'No orders matching filter' : 'Không tìm thấy hóa đơn phù hợp'}</p>
          </div>
        )}

        {totalItems > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(l) => {
                setItemsPerPage(l);
                setCurrentPage(1);
              }}
              totalItems={totalItems}
              showItemsPerPageSelector={true}
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminVipPayments;
