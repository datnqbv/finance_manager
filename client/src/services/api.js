import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Đặt URL API từ biến môi trường hoặc mặc định

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào header của mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token từ localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Thêm token vào header Authorization
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); 
  }
);

// Tự động đăng xuất nếu nhận được lỗi 401 Unauthorized
api.interceptors.response.use( // Xử lý phản hồi từ server
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
