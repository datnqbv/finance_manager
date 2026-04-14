import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiKey, FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isEnglish = t('language') === 'English';
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập token + password mới
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const message = error.response?.data?.message || (isEnglish ? 'An error occurred' : 'Có lỗi xảy ra');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(isEnglish ? 'Password confirmation does not match!' : 'Mật khẩu xác nhận không khớp!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error(isEnglish ? 'Password must have at least 6 characters!' : 'Mật khẩu phải có ít nhất 6 ký tự!');
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
      const message = error.response?.data?.message || (isEnglish ? 'An error occurred' : 'Có lỗi xảy ra');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-art-page min-h-screen bg-[#d9e5dc] p-4 md:p-8">
      <div className="login-shell mx-auto max-w-6xl rounded-[28px] border border-white/50 bg-[#e9efe8] p-4 shadow-[0_22px_60px_rgba(20,20,20,0.14)] md:p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 rounded-full border border-[#bfd2c2] bg-white/60 px-4 py-2 text-sm font-semibold text-[#4b5f4f] transition hover:bg-white"
          >
            <FiArrowLeft className="text-base" />
            {isEnglish ? 'Back to home' : 'Quay lại trang chủ'}
          </button>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#bfd2c2] bg-white/60 px-4 py-2 text-sm font-semibold text-[#4b5f4f] transition hover:bg-white"
          >
            <FiArrowLeft className="text-base" />
            {isEnglish ? 'Back to login' : 'Về đăng nhập'}
          </Link>
        </div>

        <div className="grid min-h-[640px] overflow-hidden rounded-[22px] border border-[#c8d8c9] bg-[#e2ece2] lg:grid-cols-[360px_1fr]">
          <section className="flex items-center justify-center bg-[#f4f8f3] p-6 md:p-8">
            <div className="login-form-card w-full max-w-[300px] rounded-[24px] bg-white px-6 py-8 shadow-[0_12px_28px_rgba(45,45,45,0.08)]">
              <p className="mb-8 text-sm font-extrabold uppercase tracking-[0.2em] text-[#273628]">DatPT</p>

              <div className="mb-6">
                <h1 className="text-2xl font-black leading-tight text-[#1f3022]">
                  {step === 1 ? 'Reset password' : 'Create new password'}
                </h1>
                <p className="mt-2 text-sm text-[#687a6a]">
                  {step === 1
                    ? (isEnglish ? 'Enter your email to receive a 6-digit verification code.' : 'Nhập email để nhận mã xác thực 6 chữ số.')
                    : (isEnglish ? 'Enter the code and create a new password for your account.' : 'Nhập mã và tạo mật khẩu mới cho tài khoản.')}
                </p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#93a494]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#dce7dc] bg-[#f8fbf7] py-3 pl-11 pr-4 text-sm text-[#273029] placeholder:text-[#98a999] focus:border-[#62af6f] focus:outline-none"
                      placeholder="Email"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#5d9f67] py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#4f8f5a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (isEnglish ? 'Sending...' : 'Đang gửi...') : (isEnglish ? 'Get verification code' : 'Lấy mã xác thực')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {generatedToken ? (
                    <div className="rounded-xl border border-[#b9dabc] bg-[#eff8ef] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#4d6d51]">{isEnglish ? 'Demo verification code' : 'Mã xác thực demo'}</p>
                      <p className="py-2 text-center text-3xl font-black tracking-[0.3em] text-[#3f7848]">{generatedToken}</p>
                        <p className="text-center text-xs text-[#728373]">{isEnglish ? 'Valid for 10 minutes' : 'Hiệu lực trong 10 phút'}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#c6dac8] bg-[#f1f8f1] p-4 text-xs text-[#607361]">
                        {isEnglish ? 'Verification code has been sent to ' : 'Mã xác thực đã gửi đến '}<span className="font-bold text-[#2f4b33]">{email}</span>{isEnglish ? '. Please check your inbox and spam folder.' : '. Vui lòng kiểm tra hộp thư và spam.'}
                    </div>
                  )}

                  <div className="relative">
                    <FiKey className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#93a494]" />
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                      maxLength={6}
                      className="w-full rounded-xl border border-[#dce7dc] bg-[#f8fbf7] py-3 pl-11 pr-4 text-center text-xl font-extrabold tracking-[0.25em] text-[#273029] placeholder:text-[#98a999] focus:border-[#62af6f] focus:outline-none"
                      placeholder="000000"
                    />
                  </div>

                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#93a494]" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-[#dce7dc] bg-[#f8fbf7] py-3 pl-11 pr-11 text-sm text-[#273029] placeholder:text-[#98a999] focus:border-[#62af6f] focus:outline-none"
                      placeholder={isEnglish ? 'New password' : 'Mật khẩu mới'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#809382] transition hover:bg-[#e8f3e8] hover:text-[#4d6b51]"
                      aria-label={showNewPassword ? (isEnglish ? 'Hide new password' : 'Ẩn mật khẩu mới') : (isEnglish ? 'Show new password' : 'Hiện mật khẩu mới')}
                    >
                      {showNewPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>

                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#93a494]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#dce7dc] bg-[#f8fbf7] py-3 pl-11 pr-11 text-sm text-[#273029] placeholder:text-[#98a999] focus:border-[#62af6f] focus:outline-none"
                      placeholder={isEnglish ? 'Confirm password' : 'Xác nhận mật khẩu'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#809382] transition hover:bg-[#e8f3e8] hover:text-[#4d6b51]"
                      aria-label={showConfirmPassword ? (isEnglish ? 'Hide confirm password' : 'Ẩn xác nhận mật khẩu') : (isEnglish ? 'Show confirm password' : 'Hiện xác nhận mật khẩu')}
                    >
                      {showConfirmPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#5d9f67] py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#4f8f5a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (isEnglish ? 'Resetting...' : 'Đang đặt lại...') : (isEnglish ? 'Reset password' : 'Đặt lại mật khẩu')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-xl border border-[#cfdbcf] bg-[#f4f8f3] py-3 text-sm font-semibold text-[#5d6f5f] transition hover:bg-[#edf5ec]"
                  >
                    {isEnglish ? 'Back to email step' : 'Quay lại bước nhập email'}
                  </button>
                </form>
              )}
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
                  Keep account
                  <br />
                  always secure
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

export default ForgotPassword;
