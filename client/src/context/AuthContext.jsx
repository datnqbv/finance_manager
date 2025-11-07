import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const savedUser = authService.getCurrentUser();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setUser(data.data.user);
      toast.success(data.message || 'Đăng nhập thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.data.user);
      toast.success(data.message || 'Đăng ký thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.info('Đã đăng xuất');
  };

  const updateProfile = async (userData) => {
    try {
      const data = await authService.updateProfile(userData);
      setUser(data.data.user);
      toast.success(data.message || 'Cập nhật thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
