import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiKey, FiLock, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập token + password mới
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      
      if (response.data.success) {
        // Nếu demo mode (email chưa cấu hình), hiển thị mã
        if (response.data.data.demo) {
          setGeneratedToken(response.data.data.resetToken);
        }
        setStep(2);
        toast.success(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        resetToken,
        newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="w-full max-w-6xl mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Form */}
            <div className="p-12 flex flex-col justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 font-medium"
              >
                <FiArrowLeft /> Quay lại Đăng nhập
              </Link>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tài Chính</h1>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {step === 1 ? 'Đặt Lại Mật Khẩu' : 'Tạo Mật Khẩu Mới'}
                </h2>
                <p className="text-gray-500">
                  {step === 1 
                    ? 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mã xác thực.' 
                    : 'Nhập mã chúng tôi đã gửi đến email của bạn và tạo mật khẩu mới.'}
                </p>
              </div>

              {step === 1 ? (
                // Step 1: Nhập email
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Nhập email của bạn"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang gửi...' : 'Lấy Mã Xác Thực'}
                  </button>
                </form>
              ) : (
                // Step 2: Nhập token và mật khẩu mới
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {generatedToken ? (
                    // Demo mode - hiển thị mã
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700 mb-2 font-medium">
                        Mã xác thực của bạn:
                      </p>
                      <p className="text-3xl font-bold text-green-600 tracking-widest text-center py-2">
                        {generatedToken}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        (Mã có hiệu lực trong 10 phút)
                      </p>
                    </div>
                  ) : (
                    // Email mode - đã gửi email
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">
                        📧 Mã xác thực đã được gửi đến: <strong>{email}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Vui lòng kiểm tra hộp thư (và thư mục spam) để lấy mã 6 chữ số.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã xác thực
                    </label>
                    <div className="relative">
                      <FiKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-bold"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Nhập mật khẩu mới"
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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Xác nhận mật khẩu mới"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang đặt lại...' : 'Đặt Lại Mật Khẩu'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    Quay lại
                  </button>
                </form>
              )}
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden md:block bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
              
              <div className="relative h-full flex flex-col justify-center items-center text-white">
                <div className="text-center space-y-6">
                  <div className="text-8xl mb-8 animate-spin-slow">🔐</div>
                  <h3 className="text-4xl font-bold mb-4">Bảo Mật Tài Khoản</h3>
                  <p className="text-xl text-purple-100 max-w-md">
                    Đừng lo lắng! Đặt lại mật khẩu nhanh chóng và dễ dàng. Chỉ cần làm theo các bước và bạn sẽ quay lại ngay.
                  </p>
                  
                  <div className="flex justify-center gap-4 mt-8">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <div className="text-3xl mb-2">🔒</div>
                      <div className="text-sm text-purple-100">Bảo mật cấp ngân hàng</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                      <div className="text-3xl mb-2">⚡</div>
                      <div className="text-sm text-purple-100">Đặt lại tức thì</div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">1</div>
                      <p className="text-sm text-left">Nhập địa chỉ email của bạn</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">2</div>
                      <p className="text-sm text-left">Nhận mã xác thực</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">3</div>
                      <p className="text-sm text-left">Tạo mật khẩu mới</p>
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

export default ForgotPassword;
