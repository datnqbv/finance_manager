import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      navigate('/dashboard');
    } else {
      console.error('Login error:', result.message);
      setError(result.message || 'Đăng nhập không thành công!');
    }
  };

  return (
    <div className="login-art-page min-h-screen bg-[#d9e5dc] p-4 md:p-8">
      <div className="login-shell mx-auto max-w-6xl rounded-[28px] border border-white/50 bg-[#e9efe8] p-4 shadow-[0_22px_60px_rgba(20,20,20,0.14)] md:p-6">
        <div className="mb-4">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 rounded-full border border-[#bfd2c2] bg-white/60 px-4 py-2 text-sm font-semibold text-[#4b5f4f] transition hover:bg-white"
          >
            <FiArrowLeft className="text-base" />
            Quay lại trang chủ
          </button>
        </div>

        <div className="grid min-h-[640px] overflow-hidden rounded-[22px] border border-[#c8d8c9] bg-[#e2ece2] lg:grid-cols-[360px_1fr]">
          <section className="flex items-center justify-center bg-[#f4f8f3] p-6 md:p-8">
            <div className="login-form-card w-full max-w-[300px] rounded-[24px] bg-white px-6 py-8 shadow-[0_12px_28px_rgba(45,45,45,0.08)]">
              <p className="mb-8 text-sm font-extrabold uppercase tracking-[0.2em] text-[#273628]">DatPT</p>

              <div className="mb-6">
                <h1 className="text-2xl font-black leading-tight text-[#1f3022]">Welcome back</h1>
                <p className="mt-2 text-sm text-[#687a6a]">Đăng nhập để tiếp tục quản lý chi tiêu.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                    <FiAlertCircle className="mt-0.5 shrink-0 text-red-500" size={16} />
                    <p className="text-xs font-medium text-red-700">{error}</p>
                  </div>
                )}

                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a29a91]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#dce7dc] bg-[#f8fbf7] py-3 pl-11 pr-4 text-sm text-[#273029] placeholder:text-[#98a999] focus:border-[#62af6f] focus:outline-none"
                    placeholder="Email"
                  />
                </div>

                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#93a494]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#dce7dc] bg-[#f8fbf7] py-3 pl-11 pr-11 text-sm text-[#273029] placeholder:text-[#98a999] focus:border-[#62af6f] focus:outline-none"
                    placeholder="Mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#809382] transition hover:bg-[#e8f3e8] hover:text-[#4d6b51]"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#6f806f] hover:text-[#3f7848]">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#5d9f67] py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#4f8f5a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Đang đăng nhập...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-[#748574]">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-bold text-[#1f3022] hover:text-[#3f7848]">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </section>

          <section className="relative hidden overflow-hidden bg-[#dfe9df] lg:block">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} className="border border-white/45" />
              ))}
            </div>

            <div className="login-shape-float absolute left-[11%] top-[8%] h-40 w-40 rounded-full bg-[radial-gradient(circle_at_45%_45%,#8bcf97_0%,#8bcf97_42%,#eaf4ea_43%,#eaf4ea_100%)] opacity-95" />
            <div className="login-shape-spin absolute right-[10%] top-[7%] h-28 w-28 bg-[#3e6f47] [clip-path:polygon(50%_0%,63%_29%,94%_14%,77%_42%,100%_50%,77%_58%,94%_86%,63%_71%,50%_100%,37%_71%,6%_86%,23%_58%,0%_50%,23%_42%,6%_14%,37%_29%)]" />
            <div className="login-shape-float-delayed absolute right-[14%] top-[45%] h-36 w-36 rounded-full bg-[radial-gradient(circle_at_40%_40%,#a9dbb1_0%,#a9dbb1_45%,#f4faf4_46%,#f4faf4_100%)]" />
            <div className="login-shape-float-slow absolute left-[36%] top-[53%] h-28 w-56 origin-top-left -rotate-[28deg] rounded-[56%_46%_62%_38%/51%_47%_53%_49%] bg-[#a7bab1]" />

            <div className="absolute bottom-[10%] left-[8%] max-w-[430px]">
              <div className="relative border border-[#7eb688]/35 bg-[#7bb486] px-5 py-4 shadow-[0_16px_32px_rgba(65,104,73,0.22)]">
                <div className="absolute -right-10 top-6 h-20 w-20 rounded-sm bg-[#6aa474]" />
                <h2 className="relative z-10 text-5xl font-black leading-[0.95] text-[#17301b]">
                  Track spending
                  <br />
                  save smarter
                </h2>
              </div>
              <div className="mt-4 flex items-center gap-2 px-1">
                <span className="h-1.5 w-5 rounded-full bg-white/80" />
                <span className="h-1.5 w-5 rounded-full bg-white/80" />
                <span className="h-1.5 w-7 rounded-full bg-[#234429]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
