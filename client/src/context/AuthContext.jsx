import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { clearStatsCache } from '../services/stats.service';
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

  const parseJwtPayload = (token) => {
    try {
      const base64 = token.split('.')[1];
      const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch (_) {
      return null;
    }
  };

  const isTokenExpired = (token) => {
    const payload = parseJwtPayload(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  };

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const savedUser = authService.getCurrentUser();

      if (!token || !savedUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (isTokenExpired(token) && refreshToken) {
        try {
          const data = await authService.refreshAccessToken(refreshToken);
          localStorage.setItem('token', data.data.token);
        } catch (_) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (active) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
      } else if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setUser(savedUser);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials) => {
    try {
      clearStatsCache();
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
      clearStatsCache();
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
    clearStatsCache();
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

  const googleLogin = async (googleToken) => {
    try {
      clearStatsCache();
      const data = await authService.googleLogin(googleToken);
      setUser(data.data.user);
      toast.success(data.message || (isEnglish ? 'Login with Google successful!' : 'Đăng nhập bằng Google thành công!'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || (isEnglish ? 'Google login failed' : 'Đăng nhập bằng Google thất bại');
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
    googleLogin,
    isAuthenticated: !!user,
    loading,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
