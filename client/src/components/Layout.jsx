//Main layout wrapper - khung chứa chính của app

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiList, 
  FiBarChart2,
  FiFolder,
  FiDollarSign,
  FiTrendingUp,
  FiUser, 
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import DarkModeToggle from './DarkModeToggle';
import GlobalSearch from './GlobalSearch';
import { getNotifications } from '../services/notification.service';
import { toast } from 'react-toastify';

//layout component chua sidebar va header
const Layout = ({ children }) => {
  const location = useLocation(); // Lấy thông tin đường dẫn hiện tại
  const navigate = useNavigate(); // Điều hướng trang
  const { user, logout } = useAuth(); // Lấy thông tin người dùng và hàm đăng xuất từ ngữ cảnh xác thực
  const [sidebarOpen, setSidebarOpen] = useState(false); // Trạng thái mở/đóng sidebar
  const [showUserMenu, setShowUserMenu] = useState(false); // Trạng thái hiển thị menu user
  const [showNotifications, setShowNotifications] = useState(false); // Trạng thái hiển thị thông báo
  const [notifications, setNotifications] = useState([]); // Danh sách thông báo
  const [unreadCount, setUnreadCount] = useState(0); // Số thông báo chưa đọc
  
  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        if (response.success) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };
  
  // Định nghĩa các mục trong sidebar
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Tổng quan' },
    { path: '/transactions', icon: FiList, label: 'Giao dịch' },
    { path: '/categories', icon: FiFolder, label: 'Danh mục' },
    { path: '/budgets', icon: FiDollarSign, label: 'Ngân sách' },
    { path: '/recurring', icon: FiBarChart2, label: 'Định kỳ' },
    { path: '/goals', icon: FiTrendingUp, label: 'Mục tiêu' },
    { path: '/statistics', icon: FiBarChart2, label: 'Thống kê' },
    { path: '/profile', icon: FiUser, label: 'Tài khoản' },
  ];

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Giao diện của Layout
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white dark:bg-[#111111] 
                   border border-gray-200 dark:border-[#2a2a2a] shadow-lg
                   hover:scale-105 transition-all duration-200"
      >
        {sidebarOpen ? (
          <FiX size={24} className="text-gray-700 dark:text-white" />
        ) : (
          <FiMenu size={24} className="text-gray-700 dark:text-white" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 
                    bg-gray-100 dark:bg-[#111111] 
                    border-r border-gray-200 dark:border-[#2a2a2a] 
                    transform transition-all duration-300 ease-in-out
                    backdrop-blur-xl dark:backdrop-blur-2xl
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 
                            flex items-center justify-center text-2xl shadow-lg">
                💰
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Finance Manager
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  v1.0.1
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222222] hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#2a2a2a] 
                         sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-[#111111]/80">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Page title for mobile */}
              <div className="lg:hidden">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
              </div>

              {/* Center: Global Search */}
              <div className="hidden lg:block flex-1 max-w-2xl">
                <GlobalSearch />
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                {/* Mobile search button */}
                <div className="lg:hidden">
                  <GlobalSearch />
                </div>

                {/* Dark Mode Toggle */}
                <div className="hidden sm:block">
                  <DarkModeToggle />
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] 
                                     hover:bg-gray-100 dark:hover:bg-[#222222] 
                                     border border-gray-200 dark:border-[#2a2a2a]
                                     transition-all duration-200 hover:scale-105 relative group">
                    <FiBell size={20} className="text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs 
                                     rounded-full flex items-center justify-center font-semibold
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
                            Thông báo
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              Đánh dấu đã đọc
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
                                Không có thông báo mới
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
                    className="flex items-center gap-3 px-3 py-2 rounded-xl 
                             bg-gray-50 dark:bg-[#1a1a1a] 
                             hover:bg-gray-100 dark:hover:bg-[#222222]
                             border border-gray-200 dark:border-[#2a2a2a]
                             transition-all duration-200 hover:scale-105"
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
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user?.name}
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
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111111] 
                                    rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]
                                    py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {user?.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 
                                     hover:bg-gray-50 dark:hover:bg-[#1a1a1a]
                                     text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            <FiUser size={18} />
                            <span className="text-sm font-medium">Tài khoản</span>
                          </Link>
                          
                          {/* Dark mode toggle for mobile */}
                          <div className="sm:hidden px-4 py-2.5 border-t border-gray-200 dark:border-[#2a2a2a] mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Chế độ tối
                              </span>
                              <DarkModeToggle />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogout();
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 w-full
                                     hover:bg-red-50 dark:hover:bg-red-500/10
                                     text-red-600 dark:text-red-400 transition-colors
                                     border-t border-gray-200 dark:border-[#2a2a2a] mt-2"
                          >
                            <FiLogOut size={18} />
                            <span className="text-sm font-medium">Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="container mx-auto px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
