import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      console.error('Login error:', result.message);
      setError(result.message || 'Đăng nhập không thành công!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-6xl mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Form */}
            <div className="p-12 flex flex-col justify-center">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tài Chính</h1>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Chào Mừng Trở Lại!</h2>
                <p className="text-gray-500">Đăng nhập để tiếp tục quản lý tài chính của bạn</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Thông báo lỗi */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Đăng nhập thất bại</h4>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nhập email của bạn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nhập mật khẩu của bạn"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </button>
              </form>

              <p className="text-center mt-8 text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Đăng ký ngay
                </Link>
              </p>

              <p className="text-xs text-gray-400 text-center mt-6">
                By continuing, you agree to our{' '}
                <a href="#" className="underline hover:text-gray-600">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>
              </p>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden md:block bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
              
              <div className="relative h-full flex flex-col justify-center items-center text-white">
                <div className="text-center space-y-6">
                  <div className="text-8xl mb-8 animate-bounce">💎</div>
                  <h3 className="text-4xl font-bold mb-4">Đạt Được Mục Tiêu Tài Chính</h3>
                  <p className="text-xl text-blue-100 max-w-md">
                    Theo dõi chi tiêu, đặt ngân sách và đạt được mục tiêu tiết kiệm của bạn với các công cụ quản lý tài chính thông minh.
                  </p>
                  
                  <div className="flex justify-center gap-4 mt-8">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold">10K+</div>
                      <div className="text-sm text-blue-100">Người dùng</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold">$2M+</div>
                      <div className="text-sm text-blue-100">Đã tiết kiệm</div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 mt-8">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-2xl">📈</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
