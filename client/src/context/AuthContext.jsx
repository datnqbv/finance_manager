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
  const isEnglish = localStorage.getItem('language') === 'en';

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
      toast.success(data.message || (isEnglish ? 'Login successful!' : 'Đăng nhập thành công!'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || (isEnglish ? 'Login failed' : 'Đăng nhập thất bại');
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.data.user);
      toast.success(data.message || (isEnglish ? 'Registration successful!' : 'Đăng ký thành công!'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || (isEnglish ? 'Registration failed' : 'Đăng ký thất bại');
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    toast.info(isEnglish ? 'Logged out' : 'Đã đăng xuất');
  };

  const updateProfile = async (userData) => {
    try {
      const data = await authService.updateProfile(userData);
      setUser(data.data.user);
      toast.success(data.message || (isEnglish ? 'Updated successfully!' : 'Cập nhật thành công!'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || (isEnglish ? 'Update failed' : 'Cập nhật thất bại');
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await authService.changePassword(currentPassword, newPassword);
      toast.success(data.message || (isEnglish ? 'Password changed successfully!' : 'Đổi mật khẩu thành công!'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || (isEnglish ? 'Password change failed' : 'Đổi mật khẩu thất bại');
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
    changePassword,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
