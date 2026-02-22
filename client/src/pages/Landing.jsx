import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaWallet, FaCreditCard, FaBullseye, FaChartBar,
  FaStar, FaFacebook, FaTwitter, FaLinkedin,
  FaCheckCircle, FaShieldAlt, FaUsers, FaTrophy,
  FaArrowRight, FaBars, FaTimes, FaRocket, FaChartLine,
  FaLock, FaBell,
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
    <div className={`reveal reveal-delay-${delay} text-center group`}>
      <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
        {started ? num : 0}{suffix}
      </div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);

    // Scroll reveal
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    // Stats counter trigger
    const statsObserver = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsStarted(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <style>{`
        /* ── Reveal ── */
        .reveal { opacity:0; transform:translateY(28px); transition:opacity .65s ease, transform .65s ease; }
        .reveal.is-visible { opacity:1; transform:translateY(0); }
        .reveal-delay-1 { transition-delay:.07s; }
        .reveal-delay-2 { transition-delay:.14s; }
        .reveal-delay-3 { transition-delay:.21s; }
        .reveal-delay-4 { transition-delay:.28s; }

        /* ── Float mockup ── */
        @keyframes float-y {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-10px); }
        }
        .float-y { animation:float-y 4.5s ease-in-out infinite; }

        /* ── Bars ── */
        @keyframes grow-bar {
          from { transform:scaleY(0); }
          to   { transform:scaleY(1); }
        }
        .grow-bar { transform-origin:bottom; animation:grow-bar .9s cubic-bezier(.22,.61,.36,1) forwards; }

        /* ── Dot grid bg ── */
        .dot-grid {
          background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
          background-size: 22px 22px;
        }

        /* ── Glow blob ── */
        @keyframes blob-drift {
          0%,100% { border-radius:60% 40% 55% 45%/55% 45% 60% 40%; transform:translate(0,0) scale(1); }
          33%      { border-radius:45% 55% 40% 60%/60% 40% 55% 45%; transform:translate(18px,-14px) scale(1.04); }
          66%      { border-radius:55% 45% 60% 40%/45% 60% 40% 55%; transform:translate(-12px,16px) scale(.97); }
        }
        .blob-drift { animation:blob-drift 10s ease-in-out infinite; }

        /* ── Spin slow ── */
        @keyframes spin-slow { to { transform:rotate(360deg); } }
        .spin-slow { animation:spin-slow 18s linear infinite; }

        /* ── Ping badge ── */
        @keyframes ping-soft {
          0%,100% { transform:scale(1); opacity:1; }
          50%      { transform:scale(1.08); opacity:.8; }
        }
        .ping-soft { animation:ping-soft 2.5s ease-in-out infinite; }

        /* ── Step line ── */
        .step-line::after {
          content:'';
          position:absolute; top:24px; left:calc(50% + 28px);
          width:calc(100% - 56px); height:2px;
          background:linear-gradient(90deg,#d1fae5,#a7f3d0);
        }
        @media(max-width:767px){ .step-line::after { display:none; } }

        /* ── Ticker ── */
        @keyframes ticker {
          0%   { transform:translateY(0); }
          33%  { transform:translateY(-33.33%); }
          66%  { transform:translateY(-66.66%); }
          100% { transform:translateY(-100%); }
        }
        .ticker-inner { animation:ticker 6s steps(1) infinite; }
      `}</style>

      {/* ══════════ HEADER ══════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}>
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <img src="/icons/money-bag.png" alt="logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-base font-bold text-slate-800 tracking-tight">Finance Manager</span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">Tính năng</a>
            <a href="#how" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">Cách dùng</a>
            <a href="#testimonials" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">Đánh giá</a>
            {/* Dropdown Công ty */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition font-medium">
                Công ty
                <svg className="w-3.5 h-3.5 mt-0.5 group-hover:rotate-180 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <button onClick={() => navigate('/about')} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition text-left">
                  <span className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xs">👥</span>
                  Về chúng tôi
                </button>
                <button onClick={() => navigate('/contact')} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition text-left">
                  <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs">✉️</span>
                  Liên hệ
                </button>
                <button onClick={() => navigate('/privacy')} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition text-left">
                  <span className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 text-xs">🔒</span>
                  Chính sách bảo mật
                </button>
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm"
              >
                <FaRocket size={12} /> Vào Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-sm font-semibold px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm"
                >
                  Đăng ký miễn phí
                </button>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-500" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-4 space-y-2 shadow-lg">
            <a href="#features" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>Tính năng</a>
            <a href="#how" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>Cách dùng</a>
            <a href="#testimonials" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>Đánh giá</a>
            <div className="border-t border-slate-100 pt-2 mt-1 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1">Công ty</p>
              <button onClick={() => { navigate('/about');   setMobileOpen(false); }} className="block w-full text-left text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5">Về chúng tôi</button>
              <button onClick={() => { navigate('/contact'); setMobileOpen(false); }} className="block w-full text-left text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5">Liên hệ</button>
              <button onClick={() => { navigate('/privacy'); setMobileOpen(false); }} className="block w-full text-left text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5">Chính sách bảo mật</button>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {user ? (
                <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 bg-emerald-600 text-white rounded-xl">
                  <FaRocket size={12} /> Vào Dashboard
                </button>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                    className="w-full text-sm font-medium px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl">
                    Đăng nhập
                  </button>
                  <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                    className="w-full text-sm font-semibold px-4 py-2.5 bg-emerald-600 text-white rounded-xl">
                    Đăng ký miễn phí
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-24 pb-20 px-5 sm:px-8 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        {/* Decorative dot grid */}
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />

        {/* Blob accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 blob-drift pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-72 h-72 bg-teal-300/10 blob-drift pointer-events-none" style={{animationDelay:'3s'}} />

        <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-14 items-center">
          {/* ── Left ── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-7 ping-soft">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 tracking-wide">Miễn phí • Không cần thẻ tín dụng</span>
            </div>

            <h1 className="text-4xl sm:text-[3.2rem] font-extrabold text-slate-900 leading-[1.13] mb-5">
              Kiểm soát tài chính<br />
              <span className="relative">
                <span className="text-emerald-600">thông minh hơn</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 10" preserveAspectRatio="none">
                  <path d="M0 8 Q150 0 300 8" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
              <br />mỗi ngày
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
              Theo dõi thu chi, lập ngân sách và đạt mục tiêu tài chính — giao diện đơn giản, dữ liệu rõ ràng.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mb-9">
              {[
                { icon: <FaUsers className="text-emerald-600" size={13} />, label: '10,000+ người dùng' },
                { icon: <FaShieldAlt className="text-emerald-600" size={13} />, label: 'Bảo mật 256-bit' },
                { icon: <FaStar className="text-amber-400" size={13} />, label: '4.9 / 5 sao' },
              ].map(({ icon, label }, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                  {icon} {label}
                </span>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/25 text-sm"
                >
                  <FaRocket size={13} /> Vào Dashboard <FaArrowRight size={11} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/25 text-sm"
                  >
                    Bắt đầu miễn phí <FaArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-slate-200 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm shadow-sm"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Right: App mockup ── */}
          <div className="relative float-y">
            {/* Glow ring behind card */}
            <div className="absolute inset-4 bg-emerald-400/20 rounded-3xl blur-2xl pointer-events-none" />

            {/* Floating badges */}
            <div className="absolute -top-4 -left-4 z-20 flex items-center gap-2 bg-white border border-slate-100 shadow-lg rounded-2xl px-3 py-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FaChartLine className="text-emerald-600" size={14} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 leading-none">Tiết kiệm tháng này</div>
                <div className="text-sm font-bold text-emerald-600">+12.4M đ</div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-4 z-20 flex items-center gap-2 bg-white border border-slate-100 shadow-lg rounded-2xl px-3 py-2">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                <FaBell className="text-amber-500" size={13} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 leading-none">Cảnh báo ngân sách</div>
                <div className="text-xs font-semibold text-amber-600">Ăn uống: 85%</div>
              </div>
            </div>

            {/* Main card */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* macOS topbar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-3 flex-1 bg-slate-200 h-2 rounded-full max-w-[140px]" />
              </div>

              <div className="p-5">
                {/* Greeting */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400">Tháng 6 · 2025</p>
                    <h3 className="text-base font-bold text-slate-800">Tổng quan tài chính</h3>
                  </div>
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <img src="/icons/money-bag.png" alt="" className="w-5 h-5 object-contain" />
                  </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white shadow-md shadow-emerald-500/20">
                    <div className="text-[11px] opacity-75 mb-1 font-medium">Thu nhập</div>
                    <div className="text-xl font-extrabold">45.2M</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-emerald-200 text-[10px]">▲ 12%</span>
                      <span className="text-emerald-200 text-[10px]">so tháng trước</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-4 text-white shadow-md">
                    <div className="text-[11px] opacity-75 mb-1 font-medium">Chi tiêu</div>
                    <div className="text-xl font-extrabold">32.8M</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-slate-300 text-[10px]">▼ 5%</span>
                      <span className="text-slate-300 text-[10px]">so tháng trước</span>
                    </div>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="bg-slate-50 rounded-2xl p-3.5 mb-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-slate-600">Chi tiêu 7 ngày</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Tuần này</span>
                  </div>
                  <div className="flex items-end justify-between gap-1.5 h-16">
                    {[38, 65, 48, 80, 55, 92, 68].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-lg grow-bar ${i === 5 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                          style={{ height: `${h}%`, animationDelay: `${i * 0.07 + 0.3}s` }}
                        />
                        <span className="text-[8px] text-slate-400 font-medium">
                          {['T2','T3','T4','T5','T6','T7','CN'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transactions */}
                <div className="space-y-2.5">
                  {[
                    { label: 'Lương tháng 6',     cat: 'Thu nhập', amount: '+45.2M', dot: 'bg-emerald-500' },
                    { label: 'Cà phê & Ăn sáng',  cat: 'Ăn uống',  amount: '-85K',   dot: 'bg-amber-400' },
                    { label: 'Tiền điện nước',     cat: 'Hóa đơn',  amount: '-450K',  dot: 'bg-blue-400' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{tx.label}</div>
                        <div className="text-[10px] text-slate-400">{tx.cat}</div>
                      </div>
                      <div className={`text-xs font-bold tabular-nums ${tx.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section ref={statsRef} className="py-14 px-5 sm:px-8 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem icon={<FaUsers />}        value={10000} suffix="+" label="Người dùng"  delay={1} started={statsStarted} />
          <StatItem icon={<FaTrophy />}        value={1000}  suffix="K+" label="Giao dịch"  delay={2} started={statsStarted} />
          <StatItem icon={<FaCheckCircle />}   value={99}    suffix="%"  label="Hài lòng"   delay={3} started={statsStarted} />
          <StatItem icon={<FaStar />}          value={49}    suffix="/5" label="Đánh giá"   delay={4} started={statsStarted} />
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-20 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
              Tính năng nổi bật
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Mọi thứ bạn cần
            </h2>
            <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
              Bộ công cụ hoàn chỉnh để kiểm soát tài chính cá nhân — đơn giản nhưng mạnh mẽ.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <FaWallet size={22} />,    title: 'Theo dõi chi tiêu',  desc: 'Ghi chép và phân loại tự động mọi khoản thu chi hàng ngày.', color: 'emerald', border: 'hover:border-emerald-300' },
              { icon: <FaCreditCard size={22} />, title: 'Quản lý ngân sách',  desc: 'Đặt hạn mức ngân sách và nhận cảnh báo khi sắp vượt giới hạn.', color: 'blue', border: 'hover:border-blue-300' },
              { icon: <FaBullseye size={22} />,   title: 'Mục tiêu tài chính', desc: 'Thiết lập mục tiêu tiết kiệm và bám sát tiến độ mỗi ngày.', color: 'violet', border: 'hover:border-violet-300' },
              { icon: <FaChartBar size={22} />,   title: 'Thống kê & Báo cáo', desc: 'Biểu đồ trực quan giúp bạn hiểu rõ xu hướng chi tiêu.', color: 'amber', border: 'hover:border-amber-300' },
            ].map((f, i) => {
              const palette = {
                emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
                blue:    'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
                violet:  'bg-violet-50 text-violet-600 group-hover:bg-violet-600',
                amber:   'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
              }[f.color];
              return (
                <div key={i}
                  className={`reveal reveal-delay-${i+1} group bg-white rounded-2xl p-6 border border-slate-100 ${f.border} hover:shadow-lg transition-all duration-300 cursor-default`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:text-white ${palette}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2 group-hover:text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 reveal">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
              Cách hoạt động
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Bắt đầu trong 3 bước
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { n: 1, title: 'Đăng ký miễn phí',  desc: 'Tạo tài khoản 30 giây. Không cần thẻ tín dụng.', icon: <FaCheckCircle /> },
              { n: 2, title: 'Nhập giao dịch',     desc: 'Ghi thu nhập và chi tiêu hàng ngày dễ dàng.', icon: <FaWallet /> },
              { n: 3, title: 'Xem báo cáo & tối ưu', desc: 'Phân tích xu hướng và cải thiện thói quen chi tiêu.', icon: <FaChartLine /> },
            ].map((s, i) => (
              <div key={i} className={`reveal reveal-delay-${i+1} relative flex flex-col items-center text-center group ${i < 2 ? 'step-line' : ''}`}>
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-widest">Bước {s.n}</div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section id="testimonials" className="py-20 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
              Đánh giá thật từ người dùng
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Họ nói gì về chúng tôi
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Nguyễn Văn A', role: 'Nhân viên văn phòng', text: 'Tiết kiệm được 30% thu nhập mỗi tháng nhờ theo dõi chi tiêu rõ ràng hơn nhiều!', rating: 5, initColor: 'bg-emerald-600' },
              { name: 'Trần Thị B',   role: 'Freelancer',           text: 'Giao diện cực sạch, dễ dùng. AI chatbot tư vấn tài chính rất hữu ích!', rating: 5, initColor: 'bg-violet-600' },
              { name: 'Lê Văn C',     role: 'Sinh viên',            text: 'Hoàn toàn phù hợp cho người mới bắt đầu. Báo cáo tháng rất chi tiết!', rating: 5, initColor: 'bg-blue-600' },
            ].map((t, i) => (
              <div key={i} className={`reveal reveal-delay-${i+1} bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <FaStar key={j} className="text-amber-400" size={15} />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm text-slate-700 leading-relaxed mb-5">
                  <span className="text-2xl text-emerald-200 font-serif leading-none mr-1">"</span>
                  {t.text}
                  <span className="text-2xl text-emerald-200 font-serif leading-none ml-1">"</span>
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <div className={`w-10 h-10 ${t.initColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="relative py-24 px-5 sm:px-8 overflow-hidden bg-emerald-600">
        {/* Decorative ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] border border-white/10 rounded-full spin-slow" />
          <div className="absolute w-[400px] h-[400px] border border-white/10 rounded-full" style={{animationDirection:'reverse'}} />
        </div>
        <div className="absolute top-8 left-16 text-white/10 text-8xl font-black pointer-events-none select-none">₫</div>
        <div className="absolute bottom-8 right-16 text-white/10 text-8xl font-black pointer-events-none select-none">%</div>

        <div className="relative max-w-2xl mx-auto text-center reveal">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 rounded-full mb-6">
            <FaRocket className="text-white" size={12} />
            <span className="text-xs font-semibold text-white">Bắt đầu ngay hôm nay</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            Sẵn sàng làm chủ<br />tài chính của bạn?
          </h2>
          <p className="text-emerald-100 mb-8 text-base leading-relaxed">
            Tham gia hàng nghìn người đang xây dựng thói quen tài chính tốt mỗi ngày.
          </p>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-9 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition shadow-xl text-sm"
            >
              <FaRocket size={13} /> Vào Dashboard <FaArrowRight size={11} />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition shadow-xl text-sm"
              >
                Đăng ký miễn phí <FaArrowRight size={11} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition text-sm"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            </div>
          )}
          <p className="text-emerald-200 text-xs mt-5">
            Không cần thẻ tín dụng · Miễn phí 14 ngày · Hủy bất cứ lúc nào
          </p>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-slate-900 text-slate-400 py-14 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <img src="/icons/money-bag.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-white font-bold text-sm">Finance Manager</span>
              </div>
              <p className="text-sm leading-relaxed">Giải pháp quản lý tài chính cá nhân thông minh và hiện đại.</p>

              {/* Security badge */}
              <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500">
                <FaLock size={10} className="text-emerald-500" />
                <span>Dữ liệu mã hóa 256-bit SSL</span>
              </div>
            </div>

            <div>
              <h4 className="text-white text-sm font-bold mb-4">Sản phẩm</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition hover:translate-x-1 inline-block">Tính năng</a></li>
                <li><a href="#how" className="hover:text-white transition hover:translate-x-1 inline-block">Cách dùng</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-bold mb-4">Công ty</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate('/about')}   className="hover:text-white transition hover:translate-x-1 inline-block text-left">Về chúng tôi</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition hover:translate-x-1 inline-block text-left">Liên hệ</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition hover:translate-x-1 inline-block text-left">Chính sách bảo mật</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm font-bold mb-4">Theo dõi</h4>
              <div className="flex gap-3 mb-5">
                {[FaFacebook, FaTwitter, FaLinkedin].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-emerald-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-slate-400 hover:text-white">
                    <Icon size={14} />
                  </a>
                ))}
              </div>
              <div className="text-xs text-slate-500">
                Cập nhật tính năng mới<br />mỗi tuần
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span>&copy; 2025 Finance Manager. All rights reserved.</span>
            <span className="text-slate-600">Được xây dựng với ❤ tại Việt Nam</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
