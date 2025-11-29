import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      console.error('Register error:', result.message);
      setError(result.message || 'Email hoặc mật khẩu không đúng!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="w-full max-w-6xl mx-4">
        {/* Back to Home Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <svg 
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Quay lại trang chủ</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Form */}
            <div className="p-12 flex flex-col justify-center">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tài Chính</h1>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Tạo Tài Khoản Mới</h2>
                <p className="text-gray-500">Theo đuổi ước mơ của bạn một cách đam mê và phấn đấu đạt được mục tiêu mỗi ngày.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Thông báo lỗi */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Đăng ký thất bại</h4>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên người dùng
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Nhập tên người dùng"
                    />
                  </div>
                </div>

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
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                      minLength={6}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
                </button>
              </form>

              <p className="text-center mt-8 text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                  Đăng nhập
                </Link>
              </p>

              <p className="text-xs text-gray-400 text-center mt-6">
                By continuing with Google, Apple, or Email, you agree to Mancing's{' '}
                <a href="#" className="underline hover:text-gray-600">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>
              </p>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden md:block bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
              
              <div className="relative h-full flex flex-col justify-center items-center text-white">
                <div className="text-center space-y-6">
                  <div className="text-8xl mb-8 animate-pulse">🎣</div>
                  <h3 className="text-4xl font-bold mb-4">Nắm Bắt Cơ Hội Lớn Nhất</h3>
                  <p className="text-xl text-green-100 max-w-md">
                    Trở thành một phần của cộng đồng sôi động với những người tận tâm. Hãy lặn vào thế giới quản lý tài chính và bắt đầu hành trình thú vị của bạn ngay hôm nay!
                  </p>
                  
                  <div className="flex justify-center gap-4 mt-8">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold">50K+</div>
                      <div className="text-sm text-green-100">Thành viên</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <div className="text-3xl font-bold">99%</div>
                      <div className="text-sm text-green-100">Hài lòng</div>
                    </div>
                  </div>

                  <div className="flex justify-center -space-x-3 mt-8">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center text-2xl">
                      👤
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

export default Register;
