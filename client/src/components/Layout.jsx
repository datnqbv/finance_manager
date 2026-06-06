import React, { useState, useEffect, useCallback } from 'react';
//Main layout wrapper - khung chứa chính của app

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TransactionModal from './TransactionModal';
import { FiPlus } from 'react-icons/fi';
import {
  FiHome,
  FiBarChart2,
  FiFolder,
  FiDollarSign,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiAlertCircle,
  FiSettings,
  FiChevronRight,
  FiChevronLeft,
  FiCreditCard,
  FiTarget,
  FiUsers,
  FiShield,
  FiChevronDown,
  FiHelpCircle,
  FiSearch,
  FiBriefcase,
  FiAward,
  FiActivity,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../services/api';
import DarkModeToggle from './DarkModeToggle';
import GlobalSearch from './GlobalSearch';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getNotifications, markAsRead as markNotificationAsRead, markAllAsRead as markAllNotificationsAsRead } from '../services/notification.service';
import { motion, AnimatePresence } from 'framer-motion';



//layout component chua sidebar va header
const Layout = ({ children }) => {
  const location = useLocation(); // Lấy thông tin đường dẫn hiện tại
  const navigate = useNavigate(); // Điều hướng trang
  const { user, logout } = useAuth(); // Lấy thông tin người dùng và hàm đăng xuất từ ngữ cảnh xác thực
  const { language, setLanguage } = useLanguage();
  const { isDarkMode } = useTheme();
  const isEnglish = language === 'en';
  const isVipActive = user?.isVip && (!user?.vipExpire || new Date(user.vipExpire) > new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false); // Trạng thái mở/đóng sidebar
  const [showQuickAdd, setShowQuickAdd] = useState(false); // FAB thêm giao dịch nhanh
  const [showUserMenu, setShowUserMenu] = useState(false); // Trạng thái hiển thị menu user
  const [showSettings, setShowSettings] = useState(false); // Trạng thái hiển thị submenu cài đặt
  const [showNotifications, setShowNotifications] = useState(false); // Trạng thái hiển thị thông báo
  const [notifications, setNotifications] = useState([]); // Danh sách thông báo
  const [unreadCount, setUnreadCount] = useState(0); // Số thông báo chưa đọc
  const [showAdminMenu, setShowAdminMenu] = useState(false); // Trạng thái hiển thị submenu admin
  const [showMobileSearch, setShowMobileSearch] = useState(false); // Trạng thái hiển thị search overlay mobile
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (id) => {
    setOpenGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const menuConfig = [
    {
      type: 'link',
      path: '/dashboard',
      icon: FiHome,
      label: isEnglish ? 'Overview' : 'Tổng quan'
    },
    {
      type: 'group',
      id: 'transactions',
      icon: FiCreditCard,
      label: isEnglish ? 'Finance management' : 'Quản lý tài chính',
      children: [
        { path: '/transactions', icon: FiCreditCard, label: isEnglish ? 'Transactions' : 'Giao dịch' },
        { path: '/recurring', icon: FiRefreshCw, label: isEnglish ? 'Recurring Trans' : 'Giao dịch định kỳ' },
        { path: '/categories', icon: FiFolder, label: isEnglish ? 'Categories' : 'Danh mục' },
        { path: '/budgets', icon: FiDollarSign, label: isEnglish ? 'Budgets' : 'Ngân sách' }
      ]
    },
    {
      type: 'group',
      id: 'assets',
      icon: FiBriefcase,
      label: isEnglish ? 'Asset management' : 'Quản lý tài sản',
      children: [
        { path: '/wallets', icon: FiBriefcase, label: isEnglish ? 'Wallets' : 'Quản lý ví' },
        { path: '/goals', icon: FiTarget, label: isEnglish ? 'Goals' : 'Mục tiêu' },
        { path: '/debts', icon: FiUsers, label: isEnglish ? 'Debt Management' : 'Quản lý nợ' }
      ]
    },
    {
      type: 'link',
      path: '/statistics',
      icon: FiBarChart2,
      label: isEnglish ? 'Statistics' : 'Thống kê'
    },
    {
      type: 'group',
      id: 'personal',
      icon: FiUser,
      label: isEnglish ? 'Account' : 'Tài khoản',
      children: [
        { path: '/profile', icon: FiUser, label: isEnglish ? 'Account' : 'Tài khoản' },
        { path: '/vip', icon: FiAward, label: isEnglish ? 'VIP Membership' : 'Tài khoản VIP' }
      ]
    }
  ];

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount); // Cập nhật số thông báo chưa đọc
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setShowAdminMenu(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Auto-expand group that contains active path
    const activeGroup = menuConfig.find(
      item => item.type === 'group' && item.children.some(child => child.path === location.pathname)
    );
    if (activeGroup) {
      setOpenGroups(prev => ({
        ...prev,
        [activeGroup.id]: true
      }));
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 3 minutes (180,000ms) for live updates
    const interval = setInterval(fetchNotifications, 180000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const recordUserVisit = async () => {
      try {
        const recordedThisSession = sessionStorage.getItem('visit_recorded');
        if (!recordedThisSession) {
          await api.post('/admin/record-visit');
          sessionStorage.setItem('visit_recorded', 'true');
        }
      } catch (err) {
        console.error('Failed to record visit:', err);
      }
    };
    recordUserVisit();
  }, []);

  const toggleNotifications = async () => {
    const nextValue = !showNotifications;
    setShowNotifications(nextValue);

    if (nextValue) {
      await fetchNotifications();
    }
  };

  const markAsRead = async (id) => { // Đánh dấu một thông báo là đã đọc
    try {
      // Gọi API để đánh dấu đã đọc
      await markNotificationAsRead(id);

      // Cập nhật UI
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Gọi API để đánh dấu tất cả đã đọc
      await markAllNotificationsAsRead();

      // Cập nhật UI
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Định nghĩa các mục trong sidebar
  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: isEnglish ? 'Overview' : 'Tổng quan', isImg: false },
    { path: '/transactions', icon: FiCreditCard, label: isEnglish ? 'Transactions' : 'Giao dịch', isImg: false },
    { path: '/recurring', icon: FiRefreshCw, label: isEnglish ? 'Recurring Trans' : 'Giao dịch định kỳ', isImg: false },
    { path: '/categories', icon: FiFolder, label: isEnglish ? 'Categories' : 'Danh mục', isImg: false },
    { path: '/budgets', icon: FiDollarSign, label: isEnglish ? 'Budgets' : 'Ngân sách', isImg: false },
    { path: '/wallets', icon: FiBriefcase, label: isEnglish ? 'Wallets' : 'Quản lý ví', isImg: false },
    { path: '/goals', icon: FiTarget, label: isEnglish ? 'Goals' : 'Mục tiêu', isImg: false },
    { path: '/debts', icon: FiUsers, label: isEnglish ? 'Debt Management' : 'Quản lý nợ', isImg: false },
    { path: '/statistics', icon: FiBarChart2, label: isEnglish ? 'Statistics' : 'Thống kê', isImg: false },
    { path: '/profile', icon: FiUser, label: isEnglish ? 'Account' : 'Tài khoản', isImg: false },
    { path: '/vip', icon: FiAward, label: isEnglish ? 'VIP Membership' : 'Tài khoản VIP', isImg: false },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: FiShield, label: isEnglish ? 'Admin dashboard' : 'Tổng quan quản trị' },
    { path: '/admin/contacts', icon: FiUsers, label: isEnglish ? 'Admin contacts' : 'Quản trị liên hệ' },
    { path: '/admin/users', icon: FiSettings, label: isEnglish ? 'User management' : 'Quản lý người dùng' },
    { path: '/admin/vip-payments', icon: FiCreditCard, label: isEnglish ? 'VIP Payments' : 'Duyệt thanh toán VIP' },
    { path: '/admin/visits', icon: FiActivity, label: isEnglish ? 'Visitor traffic' : 'Lịch sử truy cập' },
  ];

  const currentPageLabel =
    menuItems.find((item) => item.path === location.pathname)?.label ||
    adminMenuItems.find((item) => item.path === location.pathname)?.label ||
    (location.pathname.startsWith('/admin') ? 'Admin' : null) ||
    (isEnglish ? 'Overview' : 'Tổng quan');

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Giao diện của Layout
  return (
    <div
      className="h-screen overflow-hidden flex bg-[#f3f4f6] dark:bg-[#111216]"
      style={{ fontFamily: "'Manrope', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
    >
      {/* Mobile menu button nằm trong header — xem header bên dưới */}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[250px] h-screen lg:h-full bg-[#e9ecef] dark:bg-[#1b1e24]
                    border-r border-[#d8dce2] dark:border-[#2d323c]
                    transform transition-all duration-300 ease-in-out flex flex-col flex-shrink-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="sidebar-nav-grid h-full">
          {/* Logo */}
          <div className="sidebar-brand p-4 border-b border-[#d8dce2] dark:border-[#2d323c]">
            <div className="rounded-xl border border-[#d8dce2] bg-[#f1f3f5] p-3 dark:border-[#323844] dark:bg-[#242936]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#d9efe4] dark:bg-[#244236] flex items-center justify-center text-2xl">
                  <img
                    src="/icons/money-bag.png"
                    alt="Finance Manager Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-[1.05rem] leading-5 font-bold text-[#1f2328] dark:text-[#eceef2]">
                    Finance Manager
                  </h1>
                  <p className="text-[11px] text-[#6a727f] dark:text-[#a0a5ad]">
                    {isEnglish ? 'Priority banking' : 'Ngân hàng ưu tiên'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="sidebar-home px-3 pt-3">
            <Link
              to="/home"
              className="flex items-center gap-2.5 rounded-xl border border-[#d7dce4] bg-white px-3 py-2.5 text-sm text-[#4f5662] transition-colors hover:bg-[#edf5f0] hover:text-[#1f5d45] dark:border-[#333844] dark:bg-[#22252d] dark:text-[#a8adb6] dark:hover:bg-[#273332] dark:hover:text-[#9fd7be] group"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">{isEnglish ? 'Back to home' : 'Về trang chủ'}</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="sidebar-menu p-3 space-y-1 overflow-y-auto">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#77808f] dark:text-[#8d94a1]">
              {isEnglish ? 'Quick navigation' : 'Điều hướng nhanh'}
            </p>
            {menuConfig.map((item) => {
              if (item.type === 'link') {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group border text-sm
                      ${isActive
                        ? 'bg-[#004b38] text-white border-transparent shadow-sm dark:bg-[#004b38] dark:text-white dark:border-transparent'
                        : 'text-[#4f5662] bg-transparent border-transparent hover:bg-[#f2f4f7] hover:border-[#d1d6de] hover:text-[#303844] dark:text-[#a8adb6] dark:hover:bg-[#2a2e37] dark:hover:border-[#3a3f4a] dark:hover:text-[#d5d9e0]'
                      }`}
                  >
                    {React.createElement(item.icon, { size: 20, className: isActive ? '' : 'group-hover:scale-110 transition-transform opacity-90' })}
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                );
              } else {
                const isOpen = openGroups[item.id];
                const hasActiveChild = item.children.some(child => location.pathname === child.path);

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.id)}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-150 group border text-sm
                        ${hasActiveChild
                          ? 'text-[#0d3a2d] border-[#cfe2d8]/30 bg-[#e2ede7]/30 dark:text-[#b9e4d2] dark:bg-[#273332]/30 dark:border-[#335348]/20'
                          : 'text-[#4f5662] bg-transparent border-transparent hover:bg-[#f2f4f7] hover:border-[#d1d6de] hover:text-[#303844] dark:text-[#a8adb6] dark:hover:bg-[#2a2e37] dark:hover:border-[#3a3f4a] dark:hover:text-[#d5d9e0]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {React.createElement(item.icon, { size: 20, className: 'opacity-90 group-hover:scale-110 transition-transform' })}
                        <span className="font-semibold text-sm">{item.label}</span>
                      </div>
                      <FiChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 ml-5 border-l border-[#d8dce2] dark:border-[#2d323c] space-y-1.5 py-1">
                            {item.children.map((child) => {
                              const isChildActive = location.pathname === child.path;

                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group border text-sm
                                    ${isChildActive
                                      ? 'bg-[#004b38] text-white border-transparent shadow-sm dark:bg-[#004b38] dark:text-white dark:border-transparent'
                                      : 'text-[#5c6370] bg-transparent border-transparent hover:bg-[#f2f4f7] hover:border-[#d1d6de] hover:text-[#303844] dark:text-[#9fa5b0] dark:hover:bg-[#2a2e37] dark:hover:border-[#3a3f4a] dark:hover:text-[#d5d9e0]'
                                    }`}
                                >
                                  {React.createElement(child.icon, { size: 18, className: isChildActive ? '' : 'group-hover:scale-110 transition-transform opacity-90' })}
                                  <span className="font-medium flex items-center justify-between w-full">
                                    <span>{child.label}</span>
                                    {child.path === '/debts' && !isVipActive && (
                                      <span className="text-amber-500 text-[10px] ml-1" title="VIP Feature">👑</span>
                                    )}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
            })}
          </nav>

          <div className="sidebar-footer px-3 pb-3 pt-2 border-t border-[#d8dce2] dark:border-[#2d323c]">
            <div className="rounded-xl bg-white dark:bg-[#20242e] border border-[#d8dce2] dark:border-[#323844] p-3 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2.5">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'User avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-[#d3d7df] dark:border-[#30333b]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#006fc7] text-white text-xs font-bold flex items-center justify-center">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#2d323b] dark:text-[#eceef2] truncate flex items-center gap-1">
                    {user?.name || (isEnglish ? 'User' : 'Người dùng')}
                    {isVipActive && <span className="text-amber-500" title="VIP Member">👑</span>}
                  </p>
                  <p className="text-[11px] text-[#6a727f] dark:text-[#a0a5ad] truncate">{user?.email || ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#d3d7df] dark:border-[#30333b] py-1.5 text-[11px] font-semibold text-[#4f5662] dark:text-[#a8adb6] hover:bg-[#eef4fb] dark:hover:bg-[#2a2e37] transition-colors"
                >
                  <FiUser size={12} /> {isEnglish ? 'Profile' : 'Hồ sơ'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <FiLogOut size={12} /> {isEnglish ? 'Logout' : 'Thoát'}
                </button>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#d8dce2] bg-white shadow-sm dark:border-[#323844] dark:bg-[#20242e]">
                <button
                  type="button"
                  onClick={() => setShowAdminMenu((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-3 text-left"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#77808f] dark:text-[#8d94a1]">
                      Admin
                    </p>
                    <p className="text-sm font-semibold text-[#2d323b] dark:text-[#eceef2]">
                      {isEnglish ? 'Admin tools' : 'Công cụ quản trị'}
                    </p>
                  </div>
                  <FiChevronDown
                    size={16}
                    className={`text-[#6a727f] transition-transform duration-200 dark:text-[#a0a5ad] ${showAdminMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {showAdminMenu && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#e3e7ee] px-2 py-2 dark:border-[#2d323c]">
                        {adminMenuItems.map((item) => {
                          const isActive = location.pathname === item.path;

                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                                ? 'bg-[#eef6f2] text-[#1f5d45] dark:bg-[#273332] dark:text-[#b9e4d2]'
                                : 'text-[#4f5662] hover:bg-[#f2f4f7] hover:text-[#303844] dark:text-[#a8adb6] dark:hover:bg-[#2a2e37] dark:hover:text-[#d5d9e0]'
                                }`}
                            >
                              <item.icon size={18} />
                              <span className="font-medium">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-30 
                     animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="bg-[#f8fafb] dark:bg-[#191d24] border-b border-[#d8dce2] dark:border-[#2f343e] sticky top-0 z-30 flex-shrink-0">
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">

              {/* Hamburger — nằm trong header flow trên mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-[#1b1c20]
                           border border-[#cfd2d8] dark:border-[#32353d] shadow-sm
                           hover:bg-[#f5f8fc] dark:hover:bg-[#242730] transition-colors duration-200"
              >
                {sidebarOpen ? (
                  <FiX size={20} className="text-gray-700 dark:text-white" />
                ) : (
                  <FiMenu size={20} className="text-gray-700 dark:text-white" />
                )}
              </button>

              {/* Tiêu đề trang (mobile) / breadcrumb (desktop) */}
              <div className="flex-1 min-w-0">
                <div className="lg:hidden">
                  <h2 className="text-base font-semibold text-[#1f2328] dark:text-[#eceef2] truncate">
                    {currentPageLabel}
                  </h2>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-sm text-[#6d717a] dark:text-[#9ea3ad]">
                  <span>{isEnglish ? 'Home' : 'Trang chủ'}</span>
                  <span>/</span>
                  <span className="font-semibold text-[#22262c] dark:text-[#eceef2]">{currentPageLabel}</span>
                </div>
              </div>

              {/* Global Search — chỉ hiện trên desktop */}
              <div className="hidden lg:block flex-1 max-w-2xl">
                <GlobalSearch />
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Mobile: icon search button — bấm mở overlay */}
                <button
                  onClick={() => setShowMobileSearch(true)}
                  className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md bg-white dark:bg-[#242730]
                             hover:bg-[#eef4fb] dark:hover:bg-[#2b2f39]
                             border border-[#d3d7df] dark:border-[#353943]
                             transition-colors duration-200"
                >
                  <FiSearch size={18} className="text-gray-700 dark:text-gray-300" />
                </button>

                {/* Dark Mode Toggle */}
                <div className="hidden">
                  <DarkModeToggle />
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    className="p-2 rounded-md bg-white dark:bg-[#242730] 
                                     hover:bg-[#eef4fb] dark:hover:bg-[#2b2f39] 
                                     border border-[#d3d7df] dark:border-[#353943]
                                     transition-colors duration-200 relative group">
                    <FiBell size={20} className="text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-1 bg-red-500 text-white text-[9px] leading-none
                                     rounded-full flex items-center justify-center font-bold
                                     animate-pulse group-hover:scale-110 transition-transform">
                        {unreadCount}
                      </span>
                    )}

                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111111] 
                                    rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]
                                    z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-96 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {isEnglish ? 'Notifications' : 'Thông báo'}
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {isEnglish ? 'Mark all as read' : 'Đánh dấu đã đọc'}
                            </button>
                          )}
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                className={`p-4 border-b border-gray-100 dark:border-[#1a1a1a] 
                                          hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer
                                          transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-500/5' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                                ${notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-500/10' : ''}
                                                ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-500/10' : ''}
                                                ${notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-500/10' : ''}`}>
                                    <FiAlertCircle
                                      className={`
                                        ${notification.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                                        ${notification.type === 'success' ? 'text-green-600 dark:text-green-400' : ''}
                                        ${notification.type === 'info' ? 'text-blue-600 dark:text-blue-400' : ''}
                                      `}
                                      size={20}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {notification.title}
                                      </p>
                                      {!notification.read && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {notification.time}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <FiBell className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={48} />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEnglish ? 'No new notifications' : 'Không có thông báo mới'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* User Menu */}

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-xl 
                             bg-white dark:bg-[#242730] 
                             hover:bg-[#eef4fb] dark:hover:bg-[#2b2f39]
                             border border-[#d3d7df] dark:border-[#353943]
                             transition-colors duration-200"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 
                                    flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        {user?.name}
                        {isVipActive && <span className="text-amber-500">👑</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowSettings(false);
                        }}
                      />
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111111] 
                                    rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]
                                    z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[90vh] flex flex-col">
                        {/* Main Menu */}
                        <div className={`transition-transform duration-300 ${showSettings ? 'hidden' : 'block'}`}>
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                              {user?.name}
                              {isVipActive && <span className="text-amber-500">👑</span>}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {user?.email}
                            </p>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            {/* Settings Button */}
                            <button
                              onClick={() => setShowSettings(true)}
                              className="flex items-center justify-between w-full px-4 py-2.5 
                                       hover:bg-gray-50 dark:hover:bg-[#1a1a1a]
                                       text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FiSettings size={18} />
                                <span className="text-sm font-medium">{isEnglish ? 'Settings' : 'Cài đặt'}</span>
                              </div>
                              <FiChevronRight size={18} />
                            </button>

                            <Link
                              to="/profile"
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowSettings(false);
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 
                                       hover:bg-gray-50 dark:hover:bg-[#1a1a1a]
                                       text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <FiUser size={18} />
                              <span className="text-sm font-medium">{isEnglish ? 'Account' : 'Tài khoản'}</span>
                            </Link>
                          </div>
                        </div>

                        {/* Settings Submenu */}
                        <div className={`flex flex-col ${showSettings ? 'block' : 'hidden'}`}>
                          {/* Back Button */}
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                            <button
                              onClick={() => setShowSettings(false)}
                              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              <FiChevronLeft size={18} />
                              <span className="text-sm font-semibold">{isEnglish ? 'Settings' : 'Cài đặt'}</span>
                            </button>
                          </div>

                          {/* Settings Section - Scrollable */}
                          <div className="px-4 py-4 overflow-y-auto flex-1">
                            <div className="mb-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-3 bg-gray-50 dark:bg-[#171717]">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{isEnglish ? 'Theme mode' : 'Chế độ nền'}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {isEnglish ? 'Current' : 'Đang dùng'}: {isDarkMode ? 'Dark mode' : 'Light mode'}
                                  </p>
                                </div>
                                <DarkModeToggle />
                              </div>
                            </div>

                            <div className="mb-4">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-4-8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                {isEnglish ? 'Language' : 'Ngôn ngữ'}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isEnglish ? 'Choose your application display language' : 'Chọn ngôn ngữ hiển thị cho ứng dụng'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setLanguage('vi')}
                                className={`rounded-xl border px-3 py-3 text-left transition-colors ${language === 'vi'
                                  ? 'border-[#2f8e6f] bg-[#e9f7f1] text-[#0d3a2d] dark:border-[#58c39e] dark:bg-[#1f3a32] dark:text-[#bcebd9]'
                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300 dark:hover:bg-[#1f1f1f]'
                                  }`}
                              >
                                <p className="text-sm font-semibold">Tiếng Việt</p>
                                <p className="text-xs opacity-75">VI</p>
                              </button>
                              <button
                                onClick={() => setLanguage('en')}
                                className={`rounded-xl border px-3 py-3 text-left transition-colors ${language === 'en'
                                  ? 'border-[#2f8e6f] bg-[#e9f7f1] text-[#0d3a2d] dark:border-[#58c39e] dark:bg-[#1f3a32] dark:text-[#bcebd9]'
                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300 dark:hover:bg-[#1f1f1f]'
                                  }`}
                              >
                                <p className="text-sm font-semibold">English</p>
                                <p className="text-xs opacity-75">EN</p>
                              </button>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                              <div className="space-y-1.5 mb-3">
                                <Link
                                  to="/profile"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowSettings(false);
                                  }}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <FiUser size={16} />
                                    {isEnglish ? 'Account profile' : 'Hồ sơ tài khoản'}
                                  </span>
                                  <FiChevronRight size={16} />
                                </Link>

                                <Link
                                  to="/privacy"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowSettings(false);
                                  }}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <FiShield size={16} />
                                    {isEnglish ? 'Privacy' : 'Quyền riêng tư'}
                                  </span>
                                  <FiChevronRight size={16} />
                                </Link>

                                <Link
                                  to="/contact"
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    setShowSettings(false);
                                  }}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <FiHelpCircle size={16} />
                                    {isEnglish ? 'Support & contact' : 'Hỗ trợ & liên hệ'}
                                  </span>
                                  <FiChevronRight size={16} />
                                </Link>
                              </div>

                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                💡 {isEnglish ? 'Language is saved automatically' : 'Ngôn ngữ được lưu tự động'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00523d]"
                >
                  <FiPlus size={16} /> {isEnglish ? 'Add Transaction' : 'Thêm Giao dịch'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-[#f3f4f6] dark:bg-[#111216]">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-4 lg:px-5">
            {children}
          </div>
        </main>
      </div>

      {/* Modal thêm giao dịch nhanh */}
      <TransactionModal
        isOpen={showQuickAdd}
        transaction={null}
        onClose={() => setShowQuickAdd(false)}
      />

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMobileSearch(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 right-0 z-[51] bg-[#f8fafb] dark:bg-[#191d24] border-b border-[#d8dce2] dark:border-[#2f343e] p-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <GlobalSearch />
              </div>
              <button
                onClick={() => setShowMobileSearch(false)}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 dark:bg-[#242730] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2b2f39] transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;

