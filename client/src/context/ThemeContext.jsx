import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
// Cung cấp một context để quản lý trạng thái giao diện sáng/tối của ứng dụng, cho phép người dùng chuyển đổi giữa hai chế độ này và lưu lựa chọn của họ vào localStorage để duy trì trải nghiệm nhất quán trên các phiên làm việc khác nhau, đồng thời áp dụng lớp CSS 'dark' cho phần tử gốc của tài liệu khi chế độ tối được bật để thay đổi giao diện của toàn bộ ứng dụng.
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // sử dụng useEffect để áp dụng lớp CSS 'dark' cho phần tử gốc của tài liệu khi chế độ tối được bật, đồng thời lưu trạng thái lựa chọn của người dùng vào localStorage để duy trì lựa chọn này ngay cả khi họ đóng trình duyệt hoặc tải lại trang, giúp cải thiện trải nghiệm người dùng bằng cách nhớ sở thích về giao diện của họ.
  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
