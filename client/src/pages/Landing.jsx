import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  FaWallet, FaCreditCard, FaBullseye,
  FaStar, FaFacebook, FaTwitter, FaLinkedin,
  FaCheckCircle, FaShieldAlt, FaUsers, FaTrophy,
  FaArrowRight, FaBars, FaTimes, FaRocket,
  FaLock,
} from 'react-icons/fa';

/* ── Animated counter hook ── */
function useCounter(target, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ── Stat item with counter ── */
function StatItem({ icon, value, suffix, label, delay, started }) {
  const num = useCounter(value, 1400, started);
  return (
    <div className={`reveal reveal-delay-${delay} text-center group p-6 rounded-2xl bg-[#FFFCF5] dark:bg-[#111915] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-400/10 text-[#0a5c48] dark:text-emerald-400 rounded-2xl mb-4 group-hover:bg-[#0a5c48] group-hover:text-emerald-400 dark:group-hover:bg-emerald-400 dark:group-hover:text-[#0a5c48] transition-all duration-300">
        {icon}
      </div>
      <div className="text-3xl font-extrabold text-[#0a5c48] dark:text-white tabular-nums">
        {started ? num : 0}{suffix}
      </div>
      <div className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wider">{label}</div>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const isEnglish = language === 'en';
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);

  // Budget Estimator State
  const defaultIncome = isEnglish ? 3000 : 20000000;
  const [incomeInput, setIncomeInput] = useState(defaultIncome);
  
  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);

    // Scroll reveal
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    // Stats counter trigger
    const statsObserver = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsStarted(true); },
      { threshold: 0.2 }
    );
    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const formatWidgetCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: isEnglish ? 'USD' : 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleFaqToggle = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: isEnglish ? "What is Finance Manager?" : "Finance Manager là gì?",
      a: isEnglish
        ? "Finance Manager is a smart personal finance assistant that helps you monitor income, expenses, set automated budgets based on the 50/30/20 rule, and easily achieve savings goals."
        : "Finance Manager là ứng dụng quản lý tài chính cá nhân thông minh giúp bạn theo dõi thu nhập, chi tiêu, lập ngân sách tự động theo quy tắc 50/30/20 và đạt các mục tiêu tiết kiệm một cách kỷ luật."
    },
    {
      q: isEnglish ? "How does AI OCR Receipt Scanning work?" : "Tính năng quét hóa đơn hoạt động như thế nào?",
      a: isEnglish
        ? "Simply snap a photo of any shopping receipt and upload it. Our advanced AI automatically parses the image to extract the total bill amount, date, and automatically categorizes it."
        : "Chỉ cần tải ảnh hóa đơn chi tiêu lên, AI OCR của chúng tôi sẽ tự động trích xuất thông tin về số tiền, ngày giao dịch và tự động phân loại danh mục phù hợp trong vài giây."
    },
    {
      q: isEnglish ? "Is my financial data secure?" : "Dữ liệu của tôi có được bảo mật không?",
      a: isEnglish
        ? "Yes. We take privacy seriously. Your data is encrypted using industry-standard 256-bit SSL encryption, ensuring your financial information remains private and secure."
        : "Có, toàn bộ dữ liệu giao dịch và thông tin tài chính của bạn được mã hóa và bảo mật bằng giao thức SSL 256-bit tiêu chuẩn công nghiệp, cam kết an toàn tuyệt đối."
    },
    {
      q: isEnglish ? "Do I have to pay to use this app?" : "Tôi có cần trả phí để sử dụng không?",
      a: isEnglish
        ? "The basic personal finance tools are 100% free forever. To access advanced features like AI OCR receipt scanning, the Smart Financial Advisor, and PDF/Excel exports, you can upgrade to VIP starting at very low costs."
        : "Gói cơ bản là miễn phí mãi mãi. Nếu bạn muốn sử dụng các tính năng cao cấp như quét hóa đơn AI, Cố vấn tài chính thông minh và xuất báo cáo Excel/PDF, bạn có thể nâng cấp lên VIP với mức phí cực kỳ hấp dẫn."
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F7F1E4] dark:bg-[#0a0f0d] text-[#1E2522] dark:text-gray-200 antialiased"
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        /* ── Scroll reveal animation classes ── */
        .reveal { opacity: 0; transform: translateY(22px); transition: opacity .6s ease, transform .6s ease; }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: .05s; }
        .reveal-delay-2 { transition-delay: .12s; }
        .reveal-delay-3 { transition-delay: .19s; }
        .reveal-delay-4 { transition-delay: .26s; }

        /* ── Stark Wise-style font settings ── */
        .wise-headline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.02em;
        }

        /* ── Micro-animations ── */
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .pulse-lime {
          animation: subtle-pulse 3s infinite ease-in-out;
        }

        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .float-card {
          animation: float-y 4s ease-in-out infinite;
        }

        /* ── Custom scroll behavior ── */
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* ══════════ NAVBAR (Header) ══════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-305 ${
        scrolled
          ? 'bg-[#FFFCF5] dark:bg-[#0c1310] shadow-sm border-b border-gray-200 dark:border-gray-800 py-3 text-[#1E2522] dark:text-white'
          : 'bg-[#0a5c48] py-5 text-white'
      }`}>
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-transparent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/LogoD.png" alt="logo" className="w-5 h-5 object-contain" />
            </div>
            <span className={`text-base font-extrabold tracking-tight wise-headline ${
              scrolled ? 'text-[#1E2522] dark:text-white' : 'text-white'
            }`}>Finance Manager</span>
          </button>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className={`text-sm font-semibold transition ${
              scrolled ? 'text-gray-600 hover:text-[#0a5c48] dark:text-gray-300 dark:hover:text-white' : 'text-gray-300 hover:text-white'
            }`}>{isEnglish ? 'Features' : 'Tính năng'}</a>
            <a href="#how" className={`text-sm font-semibold transition ${
              scrolled ? 'text-gray-600 hover:text-[#0a5c48] dark:text-gray-300 dark:hover:text-white' : 'text-gray-300 hover:text-white'
            }`}>{isEnglish ? 'How it works' : 'Cách dùng'}</a>
            <a href="#pricing" className={`text-sm font-semibold transition ${
              scrolled ? 'text-gray-600 hover:text-[#1ca063] dark:text-gray-300 dark:hover:text-emerald-400' : 'text-gray-300 hover:text-emerald-400'
            }`}>{isEnglish ? 'VIP Packages' : 'Gói VIP'}</a>
            <a href="#faq" className={`text-sm font-semibold transition ${
              scrolled ? 'text-gray-600 hover:text-[#0a5c48] dark:text-gray-300 dark:hover:text-white' : 'text-gray-300 hover:text-white'
            }`}>{isEnglish ? 'FAQ' : 'Hỏi đáp'}</a>
            
            {/* Scoped subpages */}
            <div className="relative group">
              <button className={`flex items-center gap-1 text-sm font-semibold transition ${
                scrolled ? 'text-gray-600 hover:text-[#0a5c48] dark:text-gray-300 dark:hover:text-white' : 'text-gray-300 hover:text-white'
              }`}>
                {isEnglish ? 'Company' : 'Công ty'}
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#FFFCF5] dark:bg-[#111915] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden text-[#1E2522] dark:text-white">
                <button onClick={() => navigate('/about')} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F3EBD8] dark:hover:bg-gray-800 hover:text-[#0a5c48] dark:hover:text-white transition text-left">
                  <span>👥</span> {isEnglish ? 'About us' : 'Về chúng tôi'}
                </button>
                <button onClick={() => navigate('/contact')} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F3EBD8] dark:hover:bg-gray-800 hover:text-[#0a5c48] dark:hover:text-white transition text-left">
                  <span>✉️</span> {isEnglish ? 'Contact' : 'Liên hệ'}
                </button>
                <button onClick={() => navigate('/privacy')} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#F3EBD8] dark:hover:bg-gray-800 hover:text-[#0a5c48] dark:hover:text-white transition text-left">
                  <span>🔒</span> {isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition ${
                scrolled
                  ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title={isEnglish ? 'Toggle theme' : 'Thay đổi giao diện'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                scrolled
                  ? 'text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'
                  : 'text-gray-300 border-gray-600 hover:text-white hover:bg-white/10'
              }`}
              title={isEnglish ? 'Switch to Vietnamese' : 'Chuyển sang Tiếng Anh'}
            >
              <span>🌐</span>
              <span>{language === 'en' ? 'EN' : 'VI'}</span>
            </button>

            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-2.5 bg-emerald-400 text-[#0a5c48] rounded-xl hover:bg-emerald-500 transition"
              >
                <FaRocket size={11} /> {isEnglish ? 'Go to Overview' : 'Vào Tổng quan'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={`text-sm font-semibold transition px-3 py-1.5 rounded-lg ${
                    scrolled ? 'text-gray-600 hover:text-[#0a5c48] dark:text-gray-300 dark:hover:text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {isEnglish ? 'Login' : 'Đăng nhập'}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className={`text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition ${
                    scrolled
                      ? 'bg-[#0a5c48] text-white hover:bg-[#084d3c]'
                      : 'bg-emerald-400 text-[#0a5c48] hover:bg-emerald-500'
                  }`}
                >
                  {isEnglish ? 'Sign up free' : 'Đăng ký miễn phí'}
                </button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-[#0a5c48] dark:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#FFFCF5] dark:bg-[#0c1310] border-t border-gray-100 dark:border-gray-800 text-[#1E2522] dark:text-white px-6 py-5 space-y-3 shadow-lg">
            <a href="#features" className="block text-sm font-bold py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'Features' : 'Tính năng'}</a>
            <a href="#how" className="block text-sm font-bold py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'How it works' : 'Cách dùng'}</a>
            <a href="#pricing" className="block text-sm font-bold py-1.5 text-emerald-600" onClick={() => setMobileOpen(false)}>{isEnglish ? 'VIP Packages' : 'Gói VIP'}</a>
            <a href="#faq" className="block text-sm font-bold py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'FAQ' : 'Hỏi đáp'}</a>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1">
              <button onClick={() => { navigate('/about'); setMobileOpen(false); }} className="block w-full text-left text-sm font-semibold py-1.5">{isEnglish ? 'About us' : 'Về chúng tôi'}</button>
              <button onClick={() => { navigate('/contact'); setMobileOpen(false); }} className="block w-full text-left text-sm font-semibold py-1.5">{isEnglish ? 'Contact' : 'Liên hệ'}</button>
              <button onClick={() => { navigate('/privacy'); setMobileOpen(false); }} className="block w-full text-left text-sm font-semibold py-1.5">{isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}</button>
            </div>
            
            {/* Mobile Switchers */}
            <div className="flex items-center justify-between pt-2 pb-1 border-t border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-bold text-gray-500">{isEnglish ? 'Settings' : 'Cài đặt'}</span>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-[#F3EBD8] dark:bg-gray-800 flex items-center justify-center"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-[#F3EBD8] dark:bg-gray-800 font-bold text-xs flex items-center gap-1.5"
                >
                  <span>🌐</span>
                  <span>{language === 'en' ? 'EN' : 'VI'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              {user ? (
                <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 bg-[#0a5c48] text-white rounded-xl">
                  <FaRocket size={12} /> {isEnglish ? 'Go to Overview' : 'Vào Tổng quan'}
                </button>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                    className="w-full text-sm font-bold px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-[#F3EBD8]">
                    {isEnglish ? 'Login' : 'Đăng nhập'}
                  </button>
                  <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                    className="w-full text-sm font-bold px-4 py-3 bg-emerald-400 text-[#0a5c48] rounded-xl text-center">
                    {isEnglish ? 'Sign up free' : 'Đăng ký miễn phí'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ══════════ HERO SECTION (Deep Brand Green `#0a5c48`) ══════════ */}
      <section className="relative bg-[#0a5c48] text-white pt-32 pb-24 px-5 sm:px-8 overflow-hidden">
        {/* Abstract shapes matching Wise card design */}
        <div className="absolute right-0 top-0 w-[45%] h-full bg-[#084d3c] opacity-65 rounded-l-[150px] pointer-events-none" />
        <div className="absolute -bottom-16 left-12 w-64 h-64 bg-emerald-400 opacity-5 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          
          {/* Left Column: Heading */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-400/10 border border-emerald-400/30 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400">
                {isEnglish ? 'SMART FINANCIAL MANAGER' : 'ỨNG DỤNG LẬP KẾ HOẠCH CHI TIÊU'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] wise-headline text-white">
              {isEnglish ? 'CONTROL YOUR BUDGET,' : 'KIỂM SOÁT CHI TIÊU,'}<br />
              <span className="text-emerald-400">
                {isEnglish ? 'GROW YOUR ASSETS.' : 'TÍCH LŨY THỊNH VƯỢNG.'}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-md">
              {isEnglish
                ? 'Automate budgeting under the 50/30/20 rule, extract bills with AI receipt scanning, and make your money work for you.'
                : 'Lập ngân sách chi tiêu tối ưu theo quy tắc 50/30/20, tự động quét hóa đơn bằng công nghệ AI OCR và theo dõi dòng tiền thông minh.'}
            </p>

            {/* Trust highlights */}
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { icon: <FaUsers size={12} />, label: isEnglish ? '10k+ Active Users' : '10,000+ Người dùng' },
                { icon: <FaShieldAlt size={12} />, label: isEnglish ? '256-bit SSL Cryptography' : 'Mã hóa 256-bit SSL' },
                { icon: <FaStar size={12} className="text-emerald-400" />, label: isEnglish ? '4.9 App Rating' : '4.9 Đánh giá ứng dụng' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#084d3c] border border-emerald-900/40 rounded-full px-4 py-2 text-xs font-semibold">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-400 text-[#0a5c48] font-extrabold rounded-xl hover:bg-emerald-500 hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                  {isEnglish ? 'Go to Overview' : 'Vào Tổng quan'} <FaArrowRight size={11} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-400 text-[#0a5c48] font-extrabold rounded-xl hover:bg-emerald-500 hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-wider"
                  >
                    {isEnglish ? 'Start For Free' : 'Bắt đầu miễn phí'} <FaArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center px-8 py-4 border border-gray-600 hover:border-white text-white font-bold rounded-xl transition text-sm"
                  >
                    {isEnglish ? 'Login' : 'Đăng nhập'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Budget Estimator Card */}
          <div className="relative">
            {/* Background design glow */}
            <div className="absolute inset-2 bg-emerald-400/10 rounded-[28px] blur-xl pointer-events-none" />

            <div className="relative bg-[#FFFCF5] dark:bg-[#111915] rounded-3xl p-6 sm:p-7 shadow-2xl text-[#1E2522] dark:text-white border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-[#0a5c48] dark:text-white mb-2 wise-headline">
                {isEnglish ? '50/30/20 Budget Estimator' : 'Công cụ tính ngân sách 50/30/20'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                {isEnglish ? 'Enter income to instantly view recommended budget allocation' : 'Nhập thu nhập để xem gợi ý phân bổ ngân sách lập tức'}
              </p>

              {/* Input section */}
              <div className="relative mb-6">
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  {isEnglish ? 'Monthly Income' : 'Thu nhập hàng tháng'}
                </label>
                <div className="flex items-center bg-[#F7F1E4] dark:bg-[#0c1310] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-[#0a5c48] transition-all">
                  <input
                    type="number"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-transparent px-4 py-3 text-lg font-bold text-[#0a5c48] dark:text-white outline-none"
                    placeholder="0"
                    min="0"
                    step={isEnglish ? 100 : 1000000}
                  />
                  <span className="bg-gray-200 dark:bg-gray-800 px-4 py-3 font-extrabold text-sm text-[#0a5c48] dark:text-white">
                    {isEnglish ? 'USD' : 'VND'}
                  </span>
                </div>
              </div>

              {/* Connecting Vertical Graph / Results */}
              <div className="space-y-4 relative pl-7 border-l-2 border-dashed border-[#0a5c48]/20 dark:border-emerald-800/40">
                {/* Visual branch nodes */}
                <div className="absolute top-3 -left-[7px] w-3 h-3 rounded-full bg-[#0a5c48] dark:bg-emerald-400" />
                <div className="absolute top-1/2 -translate-y-1/2 -left-[7px] w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a5c48] dark:border-[#0c1310]" />
                <div className="absolute bottom-3 -left-[7px] w-3 h-3 rounded-full bg-emerald-600" />

                {/* 1. Needs (50%) */}
                <div className="p-3 bg-[#F3EBD8] dark:bg-[#0c1310] rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-extrabold text-gray-700 dark:text-gray-300">{isEnglish ? 'Needs (50%)' : 'Thiết yếu (50%)'}</span>
                    <span className="font-black text-[#0a5c48] dark:text-emerald-400">{formatWidgetCurrency(incomeInput * 0.5)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {isEnglish ? 'Rent, utilities, groceries, bills' : 'Nhà ở, điện nước, ăn uống, hóa đơn'}
                  </div>
                </div>

                {/* 2. Wants (30%) */}
                <div className="p-3 bg-[#F3EBD8] dark:bg-[#0c1310] rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-extrabold text-gray-700 dark:text-gray-300">{isEnglish ? 'Wants (30%)' : 'Cá nhân (30%)'}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{formatWidgetCurrency(incomeInput * 0.3)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {isEnglish ? 'Dining out, shopping, coffee, travel' : 'Ăn tiệm, mua sắm, giải trí, cà phê'}
                  </div>
                </div>

                {/* 3. Savings (20%) */}
                <div className="p-3 bg-[#F3EBD8] dark:bg-[#0c1310] rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-extrabold text-gray-700 dark:text-gray-300">{isEnglish ? 'Savings & Debts (20%)' : 'Tích lũy & Trả nợ (20%)'}</span>
                    <span className="font-black text-[#0a5c48] dark:text-emerald-400">{formatWidgetCurrency(incomeInput * 0.2)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {isEnglish ? 'Emergency fund, investments, loan payments' : 'Quỹ dự phòng, tiết kiệm, trả nợ'}
                  </div>
                </div>
              </div>

              {/* CTA bottom */}
              <button
                onClick={() => navigate(user ? '/dashboard' : '/register')}
                className="w-full mt-6 bg-[#0a5c48] hover:bg-[#084d3c] text-white font-extrabold uppercase py-3 rounded-xl text-xs tracking-wider transition-all"
              >
                {user 
                  ? (isEnglish ? 'View your real budget' : 'Xem ngân sách của bạn')
                  : (isEnglish ? 'Start budgeting now' : 'Bắt đầu phân bổ ngân sách')}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════ STATS SECTION ══════════ */}
      <section ref={statsRef} className="py-14 px-5 sm:px-8 bg-[#FFFCF5] dark:bg-[#0a0f0d] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem icon={<FaUsers size={20} />} value={10000} suffix="+" label={isEnglish ? 'Active Users' : 'Người dùng'} delay={1} started={statsStarted} />
          <StatItem icon={<FaTrophy size={20} />} value={1500} suffix="K+" label={isEnglish ? 'Transactions' : 'Giao dịch đã nhập'} delay={2} started={statsStarted} />
          <StatItem icon={<FaCheckCircle size={20} />} value={98} suffix="%" label={isEnglish ? 'Satisfaction' : 'Hài lòng'} delay={3} started={statsStarted} />
          <StatItem icon={<FaStar size={20} />} value={5} suffix="/5" label={isEnglish ? 'App Rating' : 'Đánh giá ứng dụng'} delay={4} started={statsStarted} />
        </div>
      </section>

      {/* ══════════ VALUE PROP SECTION (Save when you spend) ══════════ */}
      <section id="features" className="py-20 px-5 sm:px-8 bg-[#FFFCF5] dark:bg-[#0a0f0d]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          
          {/* Left: Bullet list */}
          <div className="space-y-6 reveal">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full">
              {isEnglish ? 'Save when you spend' : 'Chi tiêu thông minh, tích lũy vượt trội'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a5c48] dark:text-white wise-headline">
              {isEnglish ? 'Budget without boundary.' : 'Quản lý tài chính cá nhân không rào cản.'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              {isEnglish
                ? 'We simplify your personal finance setup. Monitor cashflow across all of your wallets, evaluate budget leaks and build savings discipline.'
                : 'Chúng tôi đơn giản hóa việc quản lý tài sản của bạn. Theo dõi dòng tiền của tất cả các tài khoản ví, đo lường các khoản rò rỉ chi tiêu và thiết lập kỷ luật tiết kiệm.'}
            </p>

            <ul className="space-y-4 pt-2">
              {[
                { title: isEnglish ? 'AI OCR Receipt Scan' : 'Quét ảnh hóa đơn bằng AI', desc: isEnglish ? 'Auto trích xuất thông tin, điền số tiền và danh mục giao dịch lập tức.' : 'Chụp ảnh hóa đơn mua sắm, AI trích xuất và lưu giao dịch lập tức.' },
                { title: isEnglish ? 'Global Incognito Mode' : 'Chế độ ẩn số dư bảo mật', desc: isEnglish ? 'One click to blur all sensitive amounts on public devices.' : 'Nhấp chuột ẩn toàn bộ số tiền nhạy cảm khi mở ứng dụng nơi công cộng.' },
                { title: isEnglish ? 'Dynamic Multi-Wallet Accounts' : 'Liên kết ví linh hoạt', desc: isEnglish ? 'Track assets across multiple physical cash wallets and bank accounts.' : 'Quản lý nhiều ví vật lý, tài khoản ngân hàng và chuyển tiền nội bộ.' }
              ].map((item, index) => (
                <li key={index} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#0a5c48] dark:bg-emerald-400 text-emerald-400 dark:text-[#0a5c48] flex items-center justify-center mt-1 flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0a5c48] dark:text-white">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Premium CSS Mockup of Web App Dashboard */}
          <div className="relative reveal reveal-delay-2 float-card">
            <div className="absolute inset-4 bg-emerald-400/10 rounded-[32px] blur-xl" />
            
            <div className="relative bg-[#0a5c48] rounded-3xl p-5 text-white shadow-2xl border border-emerald-900">
              {/* Header mockup */}
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-transparent rounded flex items-center justify-center">
                    <img src="/LogoD.png" alt="logo" className="w-4 h-4 object-contain" />
                  </div>
                  <span className="text-xs font-bold">My Dashboard</span>
                </div>
                <span className="text-[10px] text-gray-300 font-bold bg-white/10 px-2 py-0.5 rounded-full">Incognito Enabled</span>
              </div>

              {/* Cards row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#084d3c] rounded-xl p-3.5 border border-emerald-700/30">
                  <div className="text-[9px] text-gray-300 uppercase tracking-wider">{isEnglish ? 'Total Wallet Balance' : 'Tổng tài sản ví'}</div>
                  <div className="text-lg font-black tracking-tight mt-1 text-emerald-400">******</div>
                </div>
                <div className="bg-[#084d3c] rounded-xl p-3.5 border border-emerald-700/30">
                  <div className="text-[9px] text-gray-300 uppercase tracking-wider">{isEnglish ? 'This Month Spent' : 'Đã chi tháng này'}</div>
                  <div className="text-lg font-black tracking-tight mt-1">******</div>
                </div>
              </div>

              {/* Progress bars inside dashboard mockup */}
              <div className="bg-[#0f241c] rounded-xl p-4 space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-300">{isEnglish ? 'Food & Drinks Budget' : 'Ngân sách Ăn uống'}</span>
                  <span className="text-emerald-400">{isEnglish ? '72% Used' : 'Đã dùng 72%'}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-emerald-950 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: '72%' }} />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-300">{isEnglish ? 'Shopping Budget' : 'Ngân sách Mua sắm'}</span>
                  <span className="text-emerald-400">{isEnglish ? '30% Used' : 'Đã dùng 30%'}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-emerald-950 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: '30%' }} />
                </div>
              </div>

              {/* Footer row */}
              <div className="mt-4 pt-3 border-t border-emerald-800/80 flex justify-between items-center text-[9px] text-gray-300 font-bold">
                <span>Recent transactions</span>
                <span className="text-emerald-400 hover:underline cursor-pointer">View all →</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════ NO HIDDEN FEES SECTION (Bright Lime Green) ══════════ */}
      <section className="py-14 px-5 sm:px-8 bg-emerald-400 text-[#0a5c48] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 text-emerald-900/10 text-9xl font-black pointer-events-none select-none">₫</div>
        <div className="absolute bottom-0 left-0 w-32 h-32 text-emerald-900/10 text-9xl font-black pointer-events-none select-none">%</div>

        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight wise-headline uppercase">
            {isEnglish ? 'Transparent Pricing. No Hidden Fees.' : 'Trải nghiệm minh bạch. Không phí ẩn.'}
          </h2>
          <p className="text-sm font-semibold max-w-lg mx-auto opacity-80 leading-relaxed">
            {isEnglish
              ? 'Our basic app is free for everyone. Access premium AI features with clear monthly billing.'
              : 'Gói cơ bản là miễn phí mãi mãi cho tất cả mọi người. Nâng cấp VIP mở khóa sức mạnh AI trọn vẹn.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="inline-flex items-center gap-1.5 px-7 py-3 bg-[#0a5c48] text-white hover:bg-[#084d3c] text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg"
            >
              {user
                ? (isEnglish ? 'Go to Overview' : 'Vào Tổng quan')
                : (isEnglish ? 'Create Free Account' : 'Tạo tài khoản miễn phí')}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ DOWNLOAD / MOBILE MOCKUP SECTION ══════════ */}
      <section id="how" className="py-20 px-5 sm:px-8 bg-[#F7F1E4] dark:bg-[#0c1310]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          
          {/* Left: Smartphone CSS Mockup */}
          <div className="relative flex justify-center order-2 lg:order-1 reveal">
            <div className="absolute w-72 h-[520px] bg-emerald-900/5 rounded-[42px] blur-2xl pointer-events-none" />

            {/* Smartphone frame */}
            <div className="relative w-64 h-[490px] bg-[#1a202c] rounded-[36px] p-3 shadow-2xl border-4 border-gray-800 overflow-hidden flex flex-col justify-between">
              
              {/* Dynamic island / camera cutout */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20" />

              {/* Status bar */}
              <div className="flex justify-between items-center text-[8px] text-gray-400 font-bold px-3 pt-1.5 z-10">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* App main screens */}
              <div className="flex-1 flex flex-col pt-6 px-1">
                {/* Profile header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 text-[#0a5c48] flex items-center justify-center text-[10px] font-black">U</div>
                    <div className="leading-none">
                      <p className="text-[7px] text-gray-400">{isEnglish ? 'Welcome back' : 'Chào mừng quay lại'}</p>
                      <p className="text-[9px] text-white font-extrabold">Alex Nguyen</p>
                    </div>
                  </div>
                  <span className="text-[10px]">🔔</span>
                </div>

                {/* Main wallet */}
                <div className="bg-[#2d3748] rounded-xl p-3.5 border border-gray-700/50 mb-3 text-white">
                  <span className="text-[7px] text-gray-300 uppercase tracking-widest block">{isEnglish ? 'Wallet Cash' : 'Số dư tiền mặt'}</span>
                  <span className="text-base font-black text-emerald-400 block mt-0.5">******</span>
                </div>

                {/* Sub category progress */}
                <div className="bg-[#2d3748] rounded-xl p-3 border border-gray-700/50 space-y-2.5 text-white">
                  <div className="flex justify-between items-center text-[7px] font-black">
                    <span className="text-gray-300">{isEnglish ? 'Rent Budget' : 'Ngân sách Thuê nhà'}</span>
                    <span>100% {isEnglish ? 'Saved' : 'Đã đạt'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </div>

                  <div className="flex justify-between items-center text-[7px] font-black">
                    <span className="text-gray-300">{isEnglish ? 'Goal Savings' : 'Mục tiêu Tích lũy'}</span>
                    <span>45%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>

              {/* Bottom navigation mockup */}
              <div className="border-t border-gray-700 bg-gray-900/60 p-2 flex justify-around items-center text-[9px] text-gray-500">
                <span className="text-emerald-400 font-bold">🏠</span>
                <span>📊</span>
                <span>💳</span>
                <span>👤</span>
              </div>
            </div>
          </div>

          {/* Right: Text content */}
          <div className="space-y-6 order-1 lg:order-2 reveal reveal-delay-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#1ca063] bg-[#1ca063]/5 border border-[#1ca063]/25 px-3 py-1.5 rounded-full">
              {isEnglish ? 'How it works' : 'Cách thức hoạt động'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a5c48] dark:text-white wise-headline">
              {isEnglish ? 'Budget planning in three simple steps.' : 'Lập kế hoạch tài chính chỉ trong 3 bước.'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
              {isEnglish
                ? 'Managing money should not be a math puzzle. Establish your workspace, automate categorizing of incomes and optimize expenses.'
                : 'Quản lý tiền bạc không nhất thiết phải là bài toán hóc búa. Thiết lập tài khoản ví, nhập chi tiêu hàng ngày và để AI tự động phân tích.'}
            </p>

            <div className="space-y-5 pt-3">
              {[
                { step: '01', title: isEnglish ? 'Create your account' : 'Đăng ký tài khoản', desc: isEnglish ? 'Sign up free in 30 seconds. Access core dashboard immediately.' : 'Đăng ký miễn phí trong 30 giây. Sử dụng ngay trang bảng điều khiển chính.' },
                { step: '02', title: isEnglish ? 'Add wallets & logs' : 'Tạo ví và nhập giao dịch', desc: isEnglish ? 'Import CSV, type manual spending or snap receipts with AI OCR.' : 'Quản lý ví vật lý/tài khoản ngân hàng, quét ảnh hóa đơn bằng AI nhanh chóng.' },
                { step: '03', title: isEnglish ? 'Review cashflow charts' : 'Nhận báo cáo và tối ưu hóa', desc: isEnglish ? 'Get 50/30/20 budget analysis and anomaly alerts to grow savings.' : 'Xem phân tích ngân sách 50/30/20 và cảnh báo bất thường để cắt giảm lãng phí.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-xs font-black bg-[#0a5c48] dark:bg-emerald-400 text-emerald-400 dark:text-[#0a5c48] w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0a5c48] dark:text-white">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════ CASHFLOW CHART SECTION (Wise Rate Graph Mockup) ══════════ */}
      <section className="py-20 px-5 sm:px-8 bg-[#FFFCF5] dark:bg-[#0a0f0d] border-t border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full uppercase tracking-widest">
              {isEnglish ? 'Financial Advisor' : 'Cố vấn tài chính'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a5c48] dark:text-white wise-headline">
              {isEnglish ? '50/30/20 Budget Analysis & Anomaly Detection' : 'Phân tích ngân sách 50/30/20 & Phát hiện bất thường'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {isEnglish
                ? 'A rule-based expert system checks your Needs/Wants/Savings split, flags unusual spending, and warns when budgets or goals fall behind pace.'
                : 'Hệ chuyên gia dựa trên luật kiểm tra tỷ lệ Thiết yếu/Không thiết yếu/Tiết kiệm, phát hiện chi tiêu bất thường và cảnh báo khi ngân sách hoặc mục tiêu chậm tiến độ.'}
            </p>
          </div>

          {/* SVG line chart simulating Wise chart */}
          <div className="relative pt-6 bg-[#F3EBD8] dark:bg-[#111915] rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/85 shadow-sm flex flex-col justify-between min-h-[300px]">
            {/* Header of chart card */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-left">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">{isEnglish ? 'Savings rate this month' : 'Tỷ lệ tiết kiệm tháng này'}</p>
                <p className="text-xl font-black text-[#0a5c48] dark:text-emerald-400">
                  22%
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-400/20 text-[#0a5c48] dark:text-emerald-400 px-2.5 py-1 rounded-full">
                {isEnglish ? 'On track (target 20%)' : 'Đạt mục tiêu (20%)'}
              </span>
            </div>

            {/* SVG line graph */}
            <div className="relative w-full h-36">
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                
                {/* Trend line */}
                <path
                  d="M 10,95 C 60,95 100,75 150,75 C 200,75 250,55 300,55 C 350,55 400,80 430,80 C 460,80 480,45 490,45"
                  fill="none"
                  stroke="#0a5c48"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Highlight dots */}
                <circle cx="150" cy="75" r="4.5" fill="#34d399" stroke="#0a5c48" strokeWidth="2" />
                <circle cx="300" cy="55" r="4.5" fill="#34d399" stroke="#0a5c48" strokeWidth="2" />
                <circle cx="490" cy="45" r="4.5" fill="#34d399" stroke="#0a5c48" strokeWidth="2" />
              </svg>
            </div>

            {/* Chart footer labels */}
            <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 font-bold border-t border-gray-200/80 dark:border-gray-800 pt-4 mt-2">
              <span>{isEnglish ? 'Month 1' : 'Tháng 1'}</span>
              <span>{isEnglish ? 'Month 2' : 'Tháng 2'}</span>
              <span>{isEnglish ? 'Month 3' : 'Tháng 3'}</span>
              <span>{isEnglish ? 'Month 4 (Current)' : 'Tháng 4 (Hiện tại)'}</span>
              <span>{isEnglish ? 'Month 5' : 'Tháng 5'}</span>
              <span>{isEnglish ? 'Month 6' : 'Tháng 6'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ VIP PLANS PRICING ══════════ */}
      <section id="pricing" className="py-20 px-5 sm:px-8 bg-[#F7F1E4] dark:bg-[#0c1310] relative">
        <div className="absolute top-12 left-12 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14 reveal">
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
              {isEnglish ? 'VIP PACKAGES' : 'GÓI DỊCH VỤ VIP'}
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#0a5c48] dark:text-white wise-headline">
              {isEnglish ? 'Upgrade to Premium VIP' : 'Nâng cấp đặc quyền VIP'}
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              {isEnglish
                ? 'Unlock unlimited wallets, automated AI scanning, and the Smart Financial Advisor.'
                : 'Mở khóa không giới hạn tài nguyên ví, hạn mức ngân sách và Cố vấn tài chính thông minh.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {[
              {
                id: '1_month',
                name: isEnglish ? '1 Month VIP' : '1 Tháng VIP',
                price: '10.000 ₫',
                desc: isEnglish ? 'Perfect for testing premium features' : 'Trải nghiệm đầy đủ tính năng cao cấp',
                isPopular: false,
              },
              {
                id: '6_months',
                name: isEnglish ? '6 Months VIP' : '6 Tháng VIP',
                price: '50.000 ₫',
                desc: isEnglish ? 'Optimal and cost-saving for smart users' : 'Lựa chọn tiết kiệm cho người dùng thông thái',
                isPopular: true,
                originalPrice: '60.000 ₫',
                save: 16
              },
              {
                id: '12_months',
                name: isEnglish ? '1 Year VIP' : '1 Năm VIP',
                price: '90.000 ₫',
                desc: isEnglish ? 'Ultimate commitment for long-term planning' : 'Đồng hành lâu dài cùng kế hoạch tài chính',
                isPopular: false,
                originalPrice: '120.000 ₫',
                save: 25
              }
            ].map((plan, i) => (
              <div
                key={plan.id}
                className={`reveal reveal-delay-${i + 1} relative rounded-3xl border p-7 flex flex-col justify-between transition-all duration-300 bg-[#FFFCF5] dark:bg-[#111915]
                  ${plan.isPopular
                    ? 'border-[#0a5c48] dark:border-emerald-400 shadow-xl scale-[1.02] ring-2 ring-[#0a5c48] dark:ring-emerald-400'
                    : 'border-gray-200 dark:border-gray-800 hover:border-[#0a5c48] dark:hover:border-emerald-400 hover:shadow-md'
                  }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0a5c48] dark:bg-emerald-400 text-white dark:text-[#0a5c48] px-4 py-1 text-[9px] font-black uppercase tracking-widest">
                    {isEnglish ? 'RECOMMENDED' : 'KHUYÊN DÙNG'}
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-[#0a5c48] dark:text-white mb-1 wise-headline">{plan.name}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black text-[#0a5c48] dark:text-white">
                      {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-xs line-through text-gray-400 dark:text-gray-500">
                        {plan.originalPrice}
                      </span>
                    )}
                  </div>

                  {plan.save > 0 && (
                    <span className="inline-block rounded bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 mb-5">
                      {isEnglish ? `Save ${plan.save}%` : `Tiết kiệm ${plan.save}%`}
                    </span>
                  )}

                  <ul className="space-y-3 mb-8 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-5">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">👑</span>
                      <span>{isEnglish ? 'Unlimited wallets & budgets' : 'Không giới hạn ví & ngân sách'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">👑</span>
                      <span>{isEnglish ? 'Unlimited monthly transactions' : 'Không giới hạn nhập chi tiêu'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">👑</span>
                      <span>{isEnglish ? 'Unlimited AI OCR Receipt Scan' : 'Quét ảnh hóa đơn AI không giới hạn'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">👑</span>
                      <span>{isEnglish ? 'Smart Financial Advisor & Trends' : 'Cố vấn tài chính thông minh & Xu hướng'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">👑</span>
                      <span>{isEnglish ? 'Full Debt Management & Exports' : 'Quản lý nợ & Xuất báo cáo PDF/Excel'}</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate(user ? '/vip' : '/register')}
                  className={`w-full rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all duration-150
                    ${plan.isPopular
                      ? 'bg-[#0a5c48] hover:bg-[#084d3c] dark:bg-emerald-400 dark:hover:bg-emerald-500 text-white dark:text-[#0a5c48] shadow-md'
                      : 'bg-emerald-400 hover:bg-emerald-500 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#0a5c48] dark:text-white'
                    }`}
                >
                  {isEnglish ? 'Upgrade Now' : 'Đăng ký ngay'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ GROWTH ROADMAP (Dark Green background) ══════════ */}
      <section className="py-24 px-5 sm:px-8 bg-[#0a5c48] text-white border-t border-b border-emerald-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
              {isEnglish ? 'FINANCIAL ROADMAP' : 'BẢN ĐỒ TĂNG TRƯỞNG'}
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight wise-headline">
              {isEnglish ? 'Roadmap to Financial Freedom' : 'Lộ trình Dòng tiền thịnh vượng'}
            </h2>
            <p className="mt-4 text-sm text-gray-300 max-w-lg mx-auto">
              {isEnglish
                ? 'Follow this simple framework to master your spending and secure a comfortable retirement fund.'
                : 'Thực hiện kế hoạch 4 giai đoạn cụ thể để làm chủ toàn diện đồng tiền của mình.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: isEnglish ? 'Log Cashflow' : 'Nắm dòng tiền', desc: isEnglish ? 'List daily expenses. Map out where your money leaks.' : 'Phân loại thu/chi hàng ngày. Tránh thất thoát tiền bạc.' },
              { step: '02', title: isEnglish ? 'Lock Budget' : 'Thiết lập ngân sách', desc: isEnglish ? 'Define budget rules. Limit overspending automatically.' : 'Đặt hạn mức theo danh mục. Khóa chi tiêu lãng phí.' },
              { step: '03', title: isEnglish ? 'Build Savings' : 'Mục tiêu tích lũy', desc: isEnglish ? 'Set emergency targets. Fund goals with automated metrics.' : 'Tạo quỹ dự phòng. Tự động hóa kế hoạch tích lũy.' },
              { step: '04', title: isEnglish ? 'Financial Liberty' : 'Tự do tài chính', desc: isEnglish ? 'Analyze AI projections and invest excess savings.' : 'Theo dõi biểu đồ AI để nâng hiệu suất tài sản.' }
            ].map((item, i) => (
              <div key={i} className="bg-[#084d3c] dark:bg-[#00261c] border border-emerald-900/60 dark:border-emerald-950/40 rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-emerald-400">{isEnglish ? 'STAGE' : 'GIAI ĐOẠN'} {item.step}</span>
                  <span className="text-lg">⭐</span>
                </div>
                <h4 className="text-base font-extrabold wise-headline">{item.title}</h4>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ SECTION (Interactive Accordions) ══════════ */}
      <section id="faq" className="py-20 px-5 sm:px-8 bg-[#FFFCF5] dark:bg-[#0a0f0d]">
        <div className="max-w-3xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full uppercase tracking-widest">
              {isEnglish ? 'Help Center' : 'Hỗ trợ khách hàng'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a5c48] dark:text-white wise-headline">
              {isEnglish ? 'Frequently Asked Questions' : 'Câu hỏi thường gặp'}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-[#FFFCF5] dark:bg-[#111915] hover:border-[#0a5c48]/30 dark:hover:border-emerald-800 transition-colors"
                >
                  <button
                    onClick={() => handleFaqToggle(index)}
                    className="w-full flex justify-between items-center px-5 py-4 text-left font-bold text-sm sm:text-base text-[#0a5c48] dark:text-white hover:bg-[#F3EBD8]/50 dark:hover:bg-gray-800/40 transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-lg font-black transform transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                      ＋
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 bg-[#F3EBD8]/40 dark:bg-[#0a0f0d]/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="py-20 px-5 sm:px-8 bg-[#0a5c48] text-white text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight wise-headline">
            {isEnglish ? 'Take control of your money today' : 'Bắt đầu làm chủ ví tiền của bạn ngay hôm nay'}
          </h2>
          <p className="text-gray-300 text-sm max-w-md mx-auto">
            {isEnglish
              ? 'Join thousands of smart spenders organizing their life with Finance Manager.'
              : 'Tham gia cùng hàng ngìn người thông minh đang xây dựng thói quen tài chính tốt lành.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-500 text-[#0a5c48] font-extrabold rounded-xl transition text-xs uppercase tracking-wider shadow-lg"
              >
                {isEnglish ? 'Go to Overview' : 'Vào Tổng quan'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-500 text-[#0a5c48] font-extrabold rounded-xl transition text-xs uppercase tracking-wider shadow-lg"
                >
                  {isEnglish ? 'Sign up free' : 'Đăng ký miễn phí'}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3.5 border border-gray-600 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition text-xs"
                >
                  {isEnglish ? 'Sign In' : 'Đăng nhập'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER (Dark Green theme) ══════════ */}
      <footer className="bg-[#00261c] text-gray-400 border-t border-emerald-950/40 py-16 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            
            {/* Column 1: Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-transparent rounded-xl flex items-center justify-center">
                  <img src="/LogoD.png" alt="logo" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-white font-extrabold text-sm wise-headline">Finance Manager</span>
              </div>
              <p className="text-xs leading-relaxed">
                {isEnglish
                  ? 'A modern and clean personal finance dashboard built for fast and organized budget mapping.'
                  : 'Giải pháp lập ngân sách, quét hóa đơn AI và hoạch định chi tiêu tối ưu cho bạn.'}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <FaLock className="text-emerald-400" />
                <span>{isEnglish ? 'Secure 256-bit SSL Data' : 'Dữ liệu bảo mật 256-bit SSL'}</span>
              </div>
            </div>

            {/* Column 2: Product links */}
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">{isEnglish ? 'Product' : 'Sản phẩm'}</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><a href="#features" className="hover:text-white transition">{isEnglish ? 'Features' : 'Tính năng'}</a></li>
                <li><a href="#how" className="hover:text-white transition">{isEnglish ? 'How it works' : 'Cách dùng'}</a></li>
                <li><a href="#pricing" className="hover:text-white transition">{isEnglish ? 'VIP Packages' : 'Gói VIP'}</a></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">{isEnglish ? 'Company' : 'Công ty'}</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition">{isEnglish ? 'About us' : 'Về chúng tôi'}</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition">{isEnglish ? 'Contact' : 'Liên hệ'}</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition">{isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}</button></li>
              </ul>
            </div>

            {/* Column 4: Social */}
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider mb-4">{isEnglish ? 'Follow Us' : 'Theo dõi'}</h4>
              <div className="flex gap-2.5 mb-4">
                {[FaFacebook, FaTwitter, FaLinkedin].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-900/60 hover:bg-emerald-400 hover:text-[#0a5c48] flex items-center justify-center text-white transition-colors"
                  >
                    <Icon size={12} />
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-gray-500">
                {isEnglish ? 'New feature upgrades every week.' : 'Cập nhật tính năng hữu ích hàng tuần.'}
              </p>
            </div>

          </div>

          <div className="border-t border-emerald-950/40 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-gray-500">
            <span>&copy; 2026 Finance Manager. All rights reserved.</span>
            <span>{isEnglish ? 'Made with ❤ for financial freedom' : 'Được xây dựng vì sự phát triển tài chính của bạn'}</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
