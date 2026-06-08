import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FaWallet, FaCreditCard, FaBullseye, FaChartBar,
  FaStar, FaFacebook, FaTwitter, FaLinkedin,
  FaCheckCircle, FaShieldAlt, FaUsers, FaTrophy,
  FaArrowRight, FaBars, FaTimes, FaRocket, FaChartLine,
  FaLock, FaBell, FaRobot, FaCamera, FaHandHoldingUsd, FaFileExcel,
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

/* ── Constellation effect for hero ── */
function ConstellationCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -1000, y: -1000 };
    let particles = [];
    let rafId;

    const random = (min, max) => Math.random() * (max - min) + min;

    const initParticles = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const density = prefersReducedMotion ? 1.25 : 4.8;
      const count = Math.max(48, Math.min(240, Math.floor((width * height) / (16000 / density))));

      const cols = Math.max(8, Math.floor(Math.sqrt(count * (width / Math.max(height, 1)))));
      const rows = Math.max(6, Math.ceil(count / cols));
      const cellW = width / cols;
      const cellH = height / rows;

      const arr = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (arr.length >= count) break;
          arr.push({
            x: c * cellW + random(cellW * 0.12, cellW * 0.88),
            y: r * cellH + random(cellH * 0.12, cellH * 0.88),
            vx: random(-0.24, 0.24),
            vy: random(-0.24, 0.24),
            r: random(0.8, 2),
          });
        }
      }
      particles = arr;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles();
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12;
        if (p.y > height + 12) p.y = -12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 148, 108, 0.92)';
        ctx.fill();
      }

      const maxLinkDistance = 165;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist > maxLinkDistance) continue;

          const alpha = (1 - dist / maxLinkDistance) * 0.58;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(6, 120, 96, ${alpha.toFixed(4)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      const pointerRadius = 220;
      for (const p of particles) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);

        if (dist > pointerRadius) continue;

        const alpha = (1 - dist / pointerRadius) * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.strokeStyle = `rgba(5, 130, 102, ${alpha.toFixed(4)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    const onPointerLeave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerout', onPointerLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none ${className}`} style={{ width: '100%', height: '100%' }} aria-hidden="true" />;
}

const getFeaturedArtwork = (isEnglish) => ({
  title: isEnglish ? 'Prosperous cash flow' : 'Dòng tiền thịnh vượng',
  subtitle: isEnglish ? 'Discipline creates financial freedom' : 'Kỷ luật tạo nên tự do tài chính',
  desc1: isEnglish
    ? 'The carp crossing the waterfall symbolizes rising cash flow through discipline, clear budgeting, and timely decisions.'
    : 'Hình ảnh cá chép vượt thác trước long môn tượng trưng cho dòng tiền đi lên nhờ sự bền bỉ, quản lý ngân sách rõ ràng và quyết định đúng lúc.',
  desc2: isEnglish
    ? 'When income, expenses, and savings are planned, cash flow becomes stable and opens bigger opportunities for life goals.'
    : 'Khi thu nhập, chi tiêu và tiết kiệm được vận hành có kế hoạch, dòng tiền sẽ không chỉ ổn định mà còn mở ra nhiều cơ hội lớn cho mục tiêu cuộc sống.',
  image: '/art/dragon.png',
});

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const FEATURED_ARTWORK = getFeaturedArtwork(isEnglish);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);
  const ctaWaveLayerRef = useRef(null);
  const ctaWaveRafRef = useRef(null);
  const ctaWavePosRef = useRef({ x: 50, y: 50, tx: 50, ty: 50, active: false });

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
      if (ctaWaveRafRef.current) cancelAnimationFrame(ctaWaveRafRef.current);
    };
  }, []);

  const runWaveAnimation = () => {
    if (ctaWaveRafRef.current) return;

    const tick = () => {
      const p = ctaWavePosRef.current;
      p.x += (p.tx - p.x) * 0.07;
      p.y += (p.ty - p.y) * 0.07;

      if (ctaWaveLayerRef.current) {
        ctaWaveLayerRef.current.style.setProperty('--wave-x', `${p.x}%`);
        ctaWaveLayerRef.current.style.setProperty('--wave-y', `${p.y}%`);
      }

      const nearTarget = Math.abs(p.tx - p.x) < 0.03 && Math.abs(p.ty - p.y) < 0.03;
      if (!p.active && nearTarget) {
        ctaWaveRafRef.current = null;
        return;
      }

      ctaWaveRafRef.current = requestAnimationFrame(tick);
    };

    ctaWaveRafRef.current = requestAnimationFrame(tick);
  };

  const handleCtaWaveMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ctaWavePosRef.current.tx = Math.max(0, Math.min(100, x));
    ctaWavePosRef.current.ty = Math.max(0, Math.min(100, y));
    ctaWavePosRef.current.active = true;
    runWaveAnimation();
  };

  const handleCtaWaveLeave = () => {
    ctaWavePosRef.current.tx = 50;
    ctaWavePosRef.current.ty = 50;
    ctaWavePosRef.current.active = false;
    runWaveAnimation();
  };

  const handleArtCardMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const rx = ((50 - y) / 50) * 3.2;
    const ry = ((x - 50) / 50) * 4;

    e.currentTarget.style.setProperty('--mx', `${x}%`);
    e.currentTarget.style.setProperty('--my', `${y}%`);
    e.currentTarget.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
  };

  const handleArtCardLeave = (e) => {
    e.currentTarget.style.setProperty('--mx', '50%');
    e.currentTarget.style.setProperty('--my', '50%');
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };

  return (
    <div className="relative min-h-screen bg-white text-slate-900 antialiased">
      <ConstellationCanvas className="fixed inset-0 z-0 opacity-100" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_14%_16%,rgba(16,185,129,0.13)_0,rgba(16,185,129,0)_36%),radial-gradient(circle_at_86%_12%,rgba(20,184,166,0.11)_0,rgba(20,184,166,0)_38%),linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.32)_58%,rgba(255,255,255,0.40)_100%)]" />
      <div className="relative z-10">
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

        /* ── AI artwork hover ── */
        .ai-art-card {
          --mx: 50%;
          --my: 50%;
          --rx: 0deg;
          --ry: 0deg;
        }
        .ai-art-media {
          transform: perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry)) scale(1.01);
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
          will-change: transform;
        }
        .ai-art-card:hover .ai-art-media {
          transform: perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry)) scale(1.045);
        }
        .ai-art-shine {
          position: absolute;
          inset: 0;
          background: radial-gradient(260px 180px at var(--mx) var(--my), rgba(255,255,255,.32), rgba(255,255,255,0) 72%);
          opacity: .55;
          mix-blend-mode: screen;
          pointer-events: none;
          transition: opacity .35s ease;
        }
        .ai-art-card:hover .ai-art-shine { opacity: .78; }

        /* ── Growth roadmap mood ── */
        .growth-surface {
          background:
            radial-gradient(1200px 420px at 50% -10%, rgba(16,185,129,0.14), rgba(16,185,129,0) 62%),
            linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }
        .growth-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: linear-gradient(165deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 100%);
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
          transition: transform .36s cubic-bezier(.22,.61,.36,1), box-shadow .36s ease, border-color .36s ease;
        }
        .growth-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.08) 40%, rgba(16,185,129,0) 82%);
          transform: translateX(-100%);
          transition: transform .7s ease;
          pointer-events: none;
        }
        .growth-card:hover {
          transform: translateY(-8px);
          border-color: #a7f3d0;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.14);
        }
        .growth-card:hover::before { transform: translateX(100%); }

        /* ── Water wave field on CTA ── */
        .cta-wave-surface {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          --wave-x: 50%;
          --wave-y: 50%;
        }
        .cta-wave-surface::before {
          content: '';
          position: absolute;
          inset: -10%;
          background:
            repeating-radial-gradient(circle at var(--wave-x) var(--wave-y), rgba(16,185,129,.12) 0 1px, rgba(16,185,129,0) 1px 54px),
            radial-gradient(520px 520px at var(--wave-x) var(--wave-y), rgba(16,185,129,.1) 0%, rgba(16,185,129,.05) 34%, rgba(16,185,129,0) 72%);
          opacity: .4;
          transform: translateZ(0);
          animation: cta-water-breathe 10.5s ease-in-out infinite;
        }
        .cta-wave-surface::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(16,185,129,.05) 0%, rgba(16,185,129,.02) 45%, rgba(16,185,129,.04) 100%);
        }
        .cta-wave-ripple {
          position: absolute;
          left: var(--wave-x);
          top: var(--wave-y);
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(16,185,129,.3);
          transform: translate(-50%, -50%) scale(.16);
          opacity: 0;
          will-change: transform, opacity;
        }
        .cta-wave-ripple.r1 { animation: cta-water-ripple 6.8s ease-out infinite; }
        .cta-wave-ripple.r2 { animation: cta-water-ripple 6.8s ease-out 2.4s infinite; }
        .cta-wave-ripple.r3 { animation: cta-water-ripple 6.8s ease-out 4.8s infinite; }
        .cta-wave-core {
          position: absolute;
          left: var(--wave-x);
          top: var(--wave-y);
          width: 54px;
          height: 54px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(16,185,129,.25) 0%, rgba(16,185,129,.12) 30%, rgba(16,185,129,0) 72%);
          filter: blur(0.6px);
          opacity: .52;
        }
        @keyframes cta-water-ripple {
          0%   { transform: translate(-50%, -50%) scale(.2); opacity: .45; }
          75%  { opacity: .18; }
          100% { transform: translate(-50%, -50%) scale(9.5); opacity: 0; }
        }
        @keyframes cta-water-breathe {
          0%,100% { transform: scale(1) translate3d(0,0,0); }
          50%     { transform: scale(1.01) translate3d(0,-2px,0); }
        }
        @media (hover:none) {
          .cta-wave-surface::before { opacity: .38; }
          .cta-wave-ripple,
          .cta-wave-core { display: none; }
        }
      `}</style>

        {/* ══════════ HEADER ══════════ */}
        <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
          }`}>
          <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <button onClick={() => navigate('/home')} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-transparent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <img src="/LogoD.png" alt="logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-base font-bold text-slate-800 tracking-tight">Finance Manager</span>
            </button>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-7">
              <a href="#features" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">{isEnglish ? 'Features' : 'Tính năng'}</a>
              <a href="#how" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">{isEnglish ? 'How it works' : 'Cách dùng'}</a>
              <a href="#pricing" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">{isEnglish ? 'VIP Packages' : 'Gói VIP'}</a>
              <a href="#testimonials" className="text-sm text-slate-500 hover:text-emerald-600 transition font-medium">{isEnglish ? 'Roadmap' : 'Lộ trình'}</a>
              {/* Dropdown Công ty */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition font-medium">
                  {isEnglish ? 'Company' : 'Công ty'}
                  <svg className="w-3.5 h-3.5 mt-0.5 group-hover:rotate-180 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  <button onClick={() => navigate('/about')} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition text-left">
                    <span className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xs">👥</span>
                    {isEnglish ? 'About us' : 'Về chúng tôi'}
                  </button>
                  <button onClick={() => navigate('/contact')} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition text-left">
                    <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs">✉️</span>
                    {isEnglish ? 'Contact' : 'Liên hệ'}
                  </button>
                  <button onClick={() => navigate('/privacy')} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition text-left">
                    <span className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 text-xs">🔒</span>
                    {isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}
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
                  <FaRocket size={12} /> {isEnglish ? 'Go to Dashboard' : 'Vào Dashboard'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    {isEnglish ? 'Sign in' : 'Đăng nhập'}
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-sm font-semibold px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm"
                  >
                    {isEnglish ? 'Sign up free' : 'Đăng ký miễn phí'}
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
              <a href="#features" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'Features' : 'Tính năng'}</a>
              <a href="#how" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'How it works' : 'Cách dùng'}</a>
              <a href="#pricing" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'VIP Packages' : 'Gói VIP'}</a>
              <a href="#testimonials" className="block text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5" onClick={() => setMobileOpen(false)}>{isEnglish ? 'Roadmap' : 'Đánh giá'}</a>
              <div className="border-t border-slate-100 pt-2 mt-1 space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1">{isEnglish ? 'Company' : 'Công ty'}</p>
                <button onClick={() => { navigate('/about'); setMobileOpen(false); }} className="block w-full text-left text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5">{isEnglish ? 'About us' : 'Về chúng tôi'}</button>
                <button onClick={() => { navigate('/contact'); setMobileOpen(false); }} className="block w-full text-left text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5">{isEnglish ? 'Contact' : 'Liên hệ'}</button>
                <button onClick={() => { navigate('/privacy'); setMobileOpen(false); }} className="block w-full text-left text-sm text-slate-600 hover:text-emerald-600 font-medium py-1.5">{isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}</button>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {user ? (
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 bg-emerald-600 text-white rounded-xl">
                    <FaRocket size={12} /> {isEnglish ? 'Go to Dashboard' : 'Vào Dashboard'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                      className="w-full text-sm font-medium px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl">
                      {isEnglish ? 'Sign in' : 'Đăng nhập'}
                    </button>
                    <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                      className="w-full text-sm font-semibold px-4 py-2.5 bg-emerald-600 text-white rounded-xl">
                      {isEnglish ? 'Sign up free' : 'Đăng ký miễn phí'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ══════════ HERO ══════════ */}
        <section className="relative pt-24 pb-20 px-5 sm:px-8 overflow-hidden bg-gradient-to-br from-slate-50/20 via-white/20 to-emerald-50/12">
          {/* Decorative dot grid */}
          <div className="absolute -inset-12 dot-grid opacity-14 pointer-events-none" />

          {/* Blob accent */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 blob-drift pointer-events-none" />
          <div className="absolute bottom-0 -left-16 w-72 h-72 bg-teal-300/10 blob-drift pointer-events-none" style={{ animationDelay: '3s' }} />

          <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-14 items-center">
            {/* ── Left ── */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-7 ping-soft">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 tracking-wide">{isEnglish ? 'Free • No credit card required' : 'Miễn phí • Không cần thẻ tín dụng'}</span>
              </div>

              <h1 className="text-4xl sm:text-[3.2rem] font-extrabold text-slate-900 leading-[1.13] mb-5">
                {isEnglish ? 'Control your finances' : 'Kiểm soát tài chính'}<br />
                <span className="relative">
                  <span className="text-emerald-600">{isEnglish ? 'more intelligently' : 'thông minh hơn'}</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 10" preserveAspectRatio="none">
                    <path d="M0 8 Q150 0 300 8" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                <br />{isEnglish ? 'every day' : 'mỗi ngày'}
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
                {isEnglish ? 'Track income and expenses, set budgets, and reach financial goals with a simple interface and clear data.' : 'Theo dõi thu chi, lập ngân sách và đạt mục tiêu tài chính — giao diện đơn giản, dữ liệu rõ ràng.'}
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mb-9">
                {[
                  { icon: <FaUsers className="text-emerald-600" size={13} />, label: isEnglish ? '10,000+ users' : '10,000+ người dùng' },
                  { icon: <FaShieldAlt className="text-emerald-600" size={13} />, label: isEnglish ? '256-bit security' : 'Bảo mật 256-bit' },
                  { icon: <FaStar className="text-amber-400" size={13} />, label: isEnglish ? '4.9 / 5 stars' : '4.9 / 5 sao' },
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
                    <FaRocket size={13} /> {isEnglish ? 'Go to Dashboard' : 'Vào Dashboard'} <FaArrowRight size={11} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/register')}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/25 text-sm"
                    >
                      {isEnglish ? 'Start for free' : 'Bắt đầu miễn phí'} <FaArrowRight size={11} />
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-slate-200 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm shadow-sm"
                    >
                      {isEnglish ? 'Sign in' : 'Đăng nhập'}
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
                  <div className="text-[10px] text-slate-400 leading-none">{isEnglish ? 'Savings this month' : 'Tiết kiệm tháng này'}</div>
                  <div className="text-sm font-bold text-emerald-600">+12.4M đ</div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-4 z-20 flex items-center gap-2 bg-white border border-slate-100 shadow-lg rounded-2xl px-3 py-2">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FaBell className="text-amber-500" size={13} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 leading-none">{isEnglish ? 'Budget alert' : 'Cảnh báo ngân sách'}</div>
                  <div className="text-xs font-semibold text-amber-600">{isEnglish ? 'Food: 85%' : 'Ăn uống: 85%'}</div>
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
                      <p className="text-xs text-slate-400">{isEnglish ? 'June · 2025' : 'Tháng 6 · 2025'}</p>
                      <h3 className="text-base font-bold text-slate-800">{isEnglish ? 'Financial overview' : 'Tổng quan tài chính'}</h3>
                    </div>
                    <div className="w-9 h-9 bg-transparent rounded-xl flex items-center justify-center">
                      <img src="/LogoD.png" alt="" className="w-5 h-5 object-contain" />
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white shadow-md shadow-emerald-500/20">
                      <div className="text-[11px] opacity-75 mb-1 font-medium">{isEnglish ? 'Income' : 'Thu nhập'}</div>
                      <div className="text-xl font-extrabold">45.2M</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-emerald-200 text-[10px]">▲ 12%</span>
                        <span className="text-emerald-200 text-[10px]">{isEnglish ? 'vs previous month' : 'so tháng trước'}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-4 text-white shadow-md">
                      <div className="text-[11px] opacity-75 mb-1 font-medium">{isEnglish ? 'Expense' : 'Chi tiêu'}</div>
                      <div className="text-xl font-extrabold">32.8M</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-slate-300 text-[10px]">▼ 5%</span>
                        <span className="text-slate-300 text-[10px]">{isEnglish ? 'vs previous month' : 'so tháng trước'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 mb-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-semibold text-slate-600">{isEnglish ? '7-day expense' : 'Chi tiêu 7 ngày'}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">{isEnglish ? 'This week' : 'Tuần này'}</span>
                    </div>
                    <div className="flex items-end justify-between gap-1.5 h-16">
                      {[38, 65, 48, 80, 55, 92, 68].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full rounded-t-lg grow-bar ${i === 5 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            style={{ height: `${h}%`, animationDelay: `${i * 0.07 + 0.3}s` }}
                          />
                          <span className="text-[8px] text-slate-400 font-medium">
                            {isEnglish ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="space-y-2.5">
                    {[
                      { label: isEnglish ? 'June salary' : 'Lương tháng 6', cat: isEnglish ? 'Income' : 'Thu nhập', amount: '+45.2M', dot: 'bg-emerald-500' },
                      { label: isEnglish ? 'Coffee & breakfast' : 'Cà phê & Ăn sáng', cat: isEnglish ? 'Food' : 'Ăn uống', amount: '-85K', dot: 'bg-amber-400' },
                      { label: isEnglish ? 'Utilities bill' : 'Tiền điện nước', cat: isEnglish ? 'Bills' : 'Hóa đơn', amount: '-450K', dot: 'bg-blue-400' },
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
            <StatItem icon={<FaUsers />} value={1000} suffix="+" label={isEnglish ? 'Users' : 'Người dùng'} delay={1} started={statsStarted} />
            <StatItem icon={<FaTrophy />} value={1000} suffix="K+" label={isEnglish ? 'Transactions' : 'Giao dịch'} delay={2} started={statsStarted} />
            <StatItem icon={<FaCheckCircle />} value={97} suffix="%" label={isEnglish ? 'Satisfied' : 'Hài lòng'} delay={3} started={statsStarted} />
            <StatItem icon={<FaStar />} value={5} suffix="/5" label={isEnglish ? 'Rating' : 'Đánh giá'} delay={4} started={statsStarted} />
          </div>
        </section>

        {/* ══════════ FEATURES ══════════ */}
        <section id="features" className="py-20 px-5 sm:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 reveal">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                {isEnglish ? 'Key features' : 'Tính năng nổi bật'}
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
                {isEnglish ? 'Everything you need' : 'Mọi thứ bạn cần'}
              </h2>
              <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
                {isEnglish ? 'A complete toolkit to control personal finance: simple yet powerful.' : 'Bộ công cụ hoàn chỉnh để kiểm soát tài chính cá nhân — đơn giản nhưng mạnh mẽ.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <FaWallet size={22} />, title: isEnglish ? 'Expense tracking' : 'Theo dõi chi tiêu', desc: isEnglish ? 'Record and auto-categorize daily income and expenses easily.' : 'Ghi chép và phân loại tự động mọi khoản thu chi hàng ngày nhanh chóng.', color: 'emerald', border: 'hover:border-emerald-300' },
                { icon: <FaCreditCard size={22} />, title: isEnglish ? 'Budget management' : 'Quản lý ngân sách', desc: isEnglish ? 'Set budget caps and get early warnings before overspending.' : 'Đặt hạn mức ngân sách và nhận cảnh báo khi sắp vượt giới hạn.', color: 'blue', border: 'hover:border-blue-300' },
                { icon: <FaCamera size={22} />, title: isEnglish ? 'AI OCR Receipt Scan' : 'Quét hóa đơn AI (OCR)', desc: isEnglish ? 'Scan invoice images; AI automatically extracts amounts and categories.' : 'Tải ảnh hóa đơn lên, AI tự động phân tích và điền số tiền, danh mục cực nhanh.', color: 'violet', border: 'hover:border-violet-300' },
                { icon: <FaRobot size={22} />, title: isEnglish ? 'AI Cashflow Forecast' : 'Dự báo tài chính AI', desc: isEnglish ? 'Predict future spending and cashflow trends using machine learning.' : 'Phát hiện thói quen, dự báo xu hướng dòng tiền tương lai của bạn bằng trí tuệ nhân tạo.', color: 'indigo', border: 'hover:border-indigo-300' },
                { icon: <FaHandHoldingUsd size={22} />, title: isEnglish ? 'Debt Management' : 'Quản lý nợ & vay', desc: isEnglish ? 'Track personal loans, debts, and set due dates for timely repayment.' : 'Ghi chép và quản lý chi tiết các khoản vay, cho nợ và hạn thanh toán.', color: 'amber', border: 'hover:border-amber-300' },
                { icon: <FaBullseye size={22} />, title: isEnglish ? 'Financial Goals' : 'Mục tiêu tích lũy', desc: isEnglish ? 'Establish smart savings goals and monitor daily progress step-by-step.' : 'Thiết lập các mục tiêu mua sắm, tiết kiệm và bám sát tiến độ thực tế.', color: 'rose', border: 'hover:border-rose-300' },
              ].map((f, i) => {
                const palette = {
                  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
                  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
                  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600',
                  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
                  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
                  rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
                }[f.color];
                return (
                  <div key={i}
                    className={`reveal reveal-delay-${(i % 3) + 1} group bg-white rounded-2xl p-6 border border-slate-100 ${f.border} hover:shadow-lg transition-all duration-300 cursor-default`}>
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
                {isEnglish ? 'How it works' : 'Cách hoạt động'}
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
                {isEnglish ? 'Start in 3 steps' : 'Bắt đầu trong 3 bước'}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { n: 1, title: isEnglish ? 'Sign up for free' : 'Đăng ký miễn phí', desc: isEnglish ? 'Create an account in 30 seconds. No credit card needed.' : 'Tạo tài khoản 30 giây. Không cần thẻ tín dụng.', icon: <FaCheckCircle /> },
                { n: 2, title: isEnglish ? 'Add transactions' : 'Nhập giao dịch', desc: isEnglish ? 'Record daily income and expenses easily.' : 'Ghi thu nhập và chi tiêu hàng ngày dễ dàng.', icon: <FaWallet /> },
                { n: 3, title: isEnglish ? 'Review and optimize' : 'Xem báo cáo & tối ưu', desc: isEnglish ? 'Analyze trends and improve spending habits.' : 'Phân tích xu hướng và cải thiện thói quen chi tiêu.', icon: <FaChartLine /> },
              ].map((s, i) => (
                <div key={i} className={`reveal reveal-delay-${i + 1} relative flex flex-col items-center text-center group ${i < 2 ? 'step-line' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {s.icon}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-widest">{isEnglish ? 'Step' : 'Bước'} {s.n}</div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ FEATURED INSPIRATION ART ══════════ */}
        <section className="py-20 px-5 sm:px-8 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 reveal">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                {isEnglish ? 'Art inspiration' : 'Cảm hứng nghệ thuật'}
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
                {isEnglish ? 'Cash flow and life goals' : 'Dòng tiền và mục tiêu cuộc sống'}
              </h2>
            </div>

            <div className="grid lg:grid-cols-[1fr_1.45fr] gap-8 lg:gap-10 items-center">
              <article className="reveal">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {FEATURED_ARTWORK.title}
                </h3>
                <p className="mt-3 text-sm font-semibold text-emerald-700 uppercase tracking-widest">
                  {FEATURED_ARTWORK.subtitle}
                </p>
                <p className="mt-5 text-base text-slate-600 leading-relaxed">
                  {FEATURED_ARTWORK.desc1}
                </p>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  {FEATURED_ARTWORK.desc2}
                </p>
              </article>

              <figure
                onMouseMove={handleArtCardMove}
                onMouseLeave={handleArtCardLeave}
                className="ai-art-card reveal reveal-delay-2 group rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                <div className="ai-art-media relative aspect-[16/10] overflow-hidden">
                  <img
                    src={FEATURED_ARTWORK.image}
                    alt={FEATURED_ARTWORK.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="ai-art-shine" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* ══════════ VIP PLANS PRICING ══════════ */}
        <section id="pricing" className="py-20 px-5 sm:px-8 bg-white border-t border-slate-100 relative">
          {/* Decorative elements */}
          <div className="absolute top-12 left-12 w-64 h-64 bg-amber-200/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-12 w-64 h-64 bg-emerald-200/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-14 reveal">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-widest">
                {isEnglish ? 'VIP Packages' : 'Gói dịch vụ VIP'}
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">
                {isEnglish ? 'Upgrade to Premium VIP' : 'Nâng cấp đặc quyền VIP'}
              </h2>
              <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
                {isEnglish
                  ? 'Unlock advanced AI forecasting, receipt scanning, and unlimited resources.'
                  : 'Mở khóa không giới hạn tài nguyên và trải nghiệm trọn vẹn sức mạnh của trí tuệ nhân tạo AI.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {[
                {
                  id: '1_month',
                  name: isEnglish ? '1 Month VIP' : '1 Tháng VIP',
                  price: '20.000 ₫',
                  desc: isEnglish ? 'Perfect for testing premium features' : 'Trải nghiệm đầy đủ tính năng cao cấp',
                  isPopular: false,
                  save: 0
                },
                {
                  id: '6_months',
                  name: isEnglish ? '6 Months VIP' : '6 Tháng VIP',
                  price: '100.000 ₫',
                  desc: isEnglish ? 'Optimal and cost-saving for smart users' : 'Lựa chọn tiết kiệm cho người dùng thông thái',
                  isPopular: true,
                  save: 16,
                  originalPrice: '120.000 ₫'
                },
                {
                  id: '12_months',
                  name: isEnglish ? '1 Year VIP' : '1 Năm VIP',
                  price: '180.000 ₫',
                  desc: isEnglish ? 'Ultimate commitment for long-term planning' : 'Đồng hành lâu dài cùng kế hoạch tài chính',
                  isPopular: false,
                  save: 25,
                  originalPrice: '240.000 ₫'
                }
              ].map((plan, i) => (
                <div
                  key={plan.id}
                  className={`reveal reveal-delay-${i + 1} relative rounded-3xl border p-7 flex flex-col justify-between transition-all duration-300 bg-white dark:bg-[#191d25]
                    ${plan.isPopular
                      ? 'border-amber-500 shadow-xl scale-[1.02] ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-gray-800 hover:border-slate-350 dark:hover:border-gray-700 hover:shadow-md'
                    }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3.5 py-1 text-[11px] font-black uppercase text-white tracking-wider shadow-md animate-pulse">
                      {isEnglish ? 'Most Popular' : 'Khuyên dùng'}
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">{plan.desc}</p>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.originalPrice && (
                        <span className="text-sm line-through text-slate-400 dark:text-gray-500">
                          {plan.originalPrice}
                        </span>
                      )}
                    </div>

                    {plan.save > 0 && (
                      <span className="inline-block rounded bg-red-500/10 px-2 py-0.5 text-[11px] text-red-600 dark:text-red-400 font-bold mb-6">
                        {isEnglish ? `Save ${plan.save}%` : `Tiết kiệm ${plan.save}%`}
                      </span>
                    )}

                    <ul className="space-y-3 mb-8 text-xs text-slate-650 dark:text-gray-300 border-t border-slate-100 dark:border-gray-800 pt-5">
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👑</span>
                        <span>{isEnglish ? 'Unlimited wallets & budgets' : 'Không giới hạn ví & ngân sách'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👑</span>
                        <span>{isEnglish ? 'Unlimited monthly transactions' : 'Không giới hạn giao dịch thu chi'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👑</span>
                        <span>{isEnglish ? 'Unlimited AI OCR Receipt Scan' : 'Quét ảnh hóa đơn bằng AI không giới hạn'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👑</span>
                        <span>{isEnglish ? 'AI Cashflow Forecast & Trends' : 'Dự báo dòng tiền & phân tích xu hướng AI'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold">👑</span>
                        <span>{isEnglish ? 'Full Debt Management & Exports' : 'Quản lý nợ & Xuất báo cáo PDF/Excel'}</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate(user ? '/vip' : '/register')}
                    className={`w-full rounded-2xl py-3 text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm
                      ${plan.isPopular
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'
                      }`}
                  >
                    {isEnglish ? 'Upgrade Now' : 'Đăng ký ngay'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ GROWTH ROADMAP ══════════ */}
        <section id="testimonials" className="growth-surface py-24 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 reveal">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 px-3 py-1 rounded-full uppercase tracking-widest">
                {isEnglish ? 'Growth roadmap' : 'Bản đồ tăng trưởng'}
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {isEnglish ? 'Prosperous Cashflow Roadmap' : 'Lộ trình Dòng tiền thịnh vượng'}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
                {isEnglish ? 'Instead of testimonials, here is a practical action framework to move from expense control to financial freedom in clear stages.' : 'Thay vì lời khen, đây là khâu hành động thực tế giúp bạn đi từ kiểm soát chi tiêu đến tự do tài chính theo từng giai đoạn rõ ràng.'}
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
              <article className="growth-card reveal rounded-3xl p-7">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{isEnglish ? 'Mindset and pace' : 'Tư duy và nhịp độ'}</h3>
                <p className="mt-4 text-slate-500 leading-relaxed">
                  {isEnglish ? 'The goal is not extreme austerity, but healthy cash flow: know where money goes, what to prioritize, and keep monthly savings habits.' : 'Mục tiêu không phải “thắt chặt cực đoan”, mà là tạo một dòng tiền lành mạnh: biết tiền đi đâu, ưu tiên gì trước, và duy trì thói quen tích lũy mỗi tháng.'}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold">{isEnglish ? 'Priority' : 'Ưu tiên'}</p>
                    <p className="mt-1 font-semibold text-slate-800">{isEnglish ? 'Emergency fund safety' : 'An toàn quỹ dự phòng'}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                    <p className="text-xs uppercase tracking-widest text-blue-700 font-bold">{isEnglish ? 'Consistency' : 'Nhịp độ'}</p>
                    <p className="mt-1 font-semibold text-slate-800">{isEnglish ? 'Automated monthly savings' : 'Tích lũy tự động hàng tháng'}</p>
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3 col-span-2">
                    <p className="text-xs uppercase tracking-widest text-violet-400 font-bold">{isEnglish ? 'Principle' : 'Nguyên tắc'}</p>
                    <p className="mt-1 font-semibold text-slate-800">{isEnglish ? 'Track - Optimize - Improve continuously' : 'Theo dõi - Tối ưu - Nâng cấp liên tục'}</p>
                  </div>
                </div>
              </article>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { step: '01', title: isEnglish ? 'Understand cash flow' : 'Nắm dòng tiền', desc: isEnglish ? 'Categorize income/expense and find biggest leakage points.' : 'Phân loại thu/chi và xác định điểm rò rỉ lớn nhất.', icon: <FaWallet size={16} className="text-emerald-600" /> },
                  { step: '02', title: isEnglish ? 'Set budget milestones' : 'Đặt mốc ngân sách', desc: isEnglish ? 'Set spending caps by group and early warnings.' : 'Khóa trần chi tiêu theo nhóm và cảnh báo sớm.', icon: <FaCreditCard size={16} className="text-blue-600" /> },
                  { step: '03', title: isEnglish ? 'Set goals' : 'Thiết lập mục tiêu', desc: isEnglish ? 'Break long-term goals into smaller milestones.' : 'Biến mục tiêu dài hạn thành cột mốc nhỏ dễ theo.', icon: <FaBullseye size={16} className="text-violet-600" /> },
                  { step: '04', title: isEnglish ? 'Measure and grow' : 'Đo và tăng trưởng', desc: isEnglish ? 'Track monthly charts to improve savings efficiency.' : 'Theo dõi biểu đồ tháng để nâng hiệu quả tiết kiệm.', icon: <FaChartLine size={16} className="text-slate-400" /> },
                ].map((item, i) => (
                  <article key={item.step} className={`growth-card reveal reveal-delay-${(i % 4) + 1} rounded-3xl p-5`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black tracking-widest text-emerald-600">{isEnglish ? 'STAGE' : 'CHẶNG'} {item.step}</span>
                      {item.icon}
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">{item.title}</h4>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section
          className="relative py-24 px-5 sm:px-8 overflow-hidden bg-white border-t border-b border-slate-100"
        >
          <div ref={ctaWaveLayerRef} className="cta-wave-surface" style={{ '--wave-x': '50%', '--wave-y': '50%' }}>
            <span className="cta-wave-ripple r1" />
            <span className="cta-wave-ripple r2" />
            <span className="cta-wave-ripple r3" />
            <span className="cta-wave-core" />
          </div>
          <div className="absolute top-8 left-16 text-emerald-600/5 text-8xl font-black pointer-events-none select-none">₫</div>
          <div className="absolute bottom-8 right-16 text-emerald-600/5 text-8xl font-black pointer-events-none select-none">%</div>

          <div className="relative max-w-2xl mx-auto text-center reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100/60 border border-emerald-200/80 rounded-full mb-6">
              <FaRocket className="text-emerald-700" size={12} />
              <span className="text-xs font-semibold text-emerald-800">{isEnglish ? 'Start today' : 'Bắt đầu ngay hôm nay'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
              {isEnglish ? 'Ready to master' : 'Sẵn sàng làm chủ'}<br />{isEnglish ? 'your finances?' : 'tài chính của bạn?'}
            </h2>
            <p className="text-slate-600 mb-8 text-base leading-relaxed">
              {isEnglish ? 'Join thousands building better financial habits every day.' : 'Tham gia hàng nghìn người đang xây dựng thói quen tài chính tốt mỗi ngày.'}
            </p>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-9 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <FaRocket size={13} /> {isEnglish ? 'Go to Dashboard' : 'Vào Dashboard'} <FaArrowRight size={11} />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  {isEnglish ? 'Sign up free' : 'Đăng ký miễn phí'} <FaArrowRight size={11} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 px-9 py-4 border border-emerald-200 bg-white text-emerald-700 font-semibold rounded-2xl hover:bg-emerald-50 hover:scale-[1.02] transition-all duration-200 text-sm shadow-sm"
                >
                  {isEnglish ? 'Already have an account? Sign in' : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>
            )}
            <p className="text-emerald-700 text-xs mt-5 font-medium">
              {isEnglish ? 'No credit card required · 14-day free trial · Cancel anytime' : 'Không cần thẻ tín dụng · Miễn phí 14 ngày · Hủy bất cứ lúc nào'}
            </p>
          </div>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer className="bg-black text-gray-300 border-t border-gray-800 py-14 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-transparent rounded-xl flex items-center justify-center">
                    <img src="/LogoD.png" alt="" className="w-5 h-5 object-contain" />
                  </div>
                  <span className="text-white font-bold text-sm">Finance Manager</span>
                </div>
                <p className="text-sm leading-relaxed">{isEnglish ? 'A smart and modern personal finance management solution.' : 'Giải pháp quản lý tài chính cá nhân thông minh và hiện đại.'}</p>

                {/* Security badge */}
                <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-500">
                  <FaLock size={10} className="text-emerald-500" />
                  <span>{isEnglish ? '256-bit SSL encrypted data' : 'Dữ liệu mã hóa 256-bit SSL'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-white text-sm font-bold mb-4">{isEnglish ? 'Product' : 'Sản phẩm'}</h4>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><a href="#features" className="hover:text-white transition hover:translate-x-1 inline-block">{isEnglish ? 'Features' : 'Tính năng'}</a></li>
                  <li><a href="#how" className="hover:text-white transition hover:translate-x-1 inline-block">{isEnglish ? 'How it works' : 'Cách dùng'}</a></li>
                  <li><a href="#pricing" className="hover:text-white transition hover:translate-x-1 inline-block">{isEnglish ? 'VIP Packages' : 'Gói VIP'}</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm font-bold mb-4">{isEnglish ? 'Company' : 'Công ty'}</h4>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><button onClick={() => navigate('/about')} className="hover:text-white transition hover:translate-x-1 inline-block text-left">{isEnglish ? 'About us' : 'Về chúng tôi'}</button></li>
                  <li><button onClick={() => navigate('/contact')} className="hover:text-white transition hover:translate-x-1 inline-block text-left">{isEnglish ? 'Contact' : 'Liên hệ'}</button></li>
                  <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition hover:translate-x-1 inline-block text-left">{isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}</button></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white text-sm font-bold mb-4">{isEnglish ? 'Follow' : 'Theo dõi'}</h4>
                <div className="flex gap-3 mb-5">
                  {[FaFacebook, FaTwitter, FaLinkedin].map((Icon, i) => (
                    <a key={i} href="#"
                      className="w-9 h-9 rounded-xl bg-[#121212] border border-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-gray-400 hover:text-white">
                      <Icon size={14} />
                    </a>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {isEnglish ? 'New feature updates' : 'Cập nhật tính năng mới'}<br />{isEnglish ? 'every week' : 'mỗi tuần'}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span>&copy; 2025 Finance Manager. All rights reserved.</span>
              <span className="text-gray-500">{isEnglish ? 'Built with ❤ in Vietnam' : 'Được xây dựng với ❤ tại Việt Nam'}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
