import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const Privacy = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  
  const [activeSection, setActiveSection] = useState(0);

  const sections = isEnglish
    ? [
        {
          title: '1. Information we collect',
          content: [
            'When you register, we collect your name, email address, and password (bcrypt encrypted).',
            'Financial data you enter (transactions, budgets, goals) is stored securely and visible only to your account.',
            'Technical data like IP address and browser type may be logged for security and service improvement.',
          ],
        },
        {
          title: '2. How we use information',
          content: [
            'Provide, maintain, and improve app features and personalized experience.',
            'Send account-related notifications (registration confirmation, password resets, system alerts).',
            'Analyze user interaction patterns to optimize overall app experience using anonymous data.',
            'Detect, investigate, and prevent fraudulent activities or unauthorized system access.',
          ],
        },
        {
          title: '3. Information sharing',
          content: [
            'We DO NOT sell, trade, or rent your personal information to third parties under any circumstances.',
            'Information is shared only when legally required by authorities or to protect legitimate system rights.',
            'Technical providers (hosting, database backups) may access data under strict confidentiality terms.',
          ],
        },
        {
          title: '4. Data security',
          content: [
            'All data connections are encrypted in transit via industry-standard HTTPS/TLS 1.3 encryption.',
            'Passwords are one-way hashed with bcrypt; we do not store raw passwords anywhere.',
            'JWT authentication tokens are time-limited, stored securely, and signed with a secret key.',
            'System backups are performed automatically daily and stored encrypted across multiple locations.',
          ],
        },
        {
          title: '5. Your rights',
          content: [
            'Access and edit your personal information anytime directly on the Profile page.',
            'Request account and all related data deletion; processed completely within 30 days.',
            'Export your personal financial data in CSV or Excel formats at your convenience.',
            'Object to or restrict data processing in certain circumstances under regional data laws.',
          ],
        },
        {
          title: '6. Cookies and local storage',
          content: [
            'We use browser localStorage to store secure session tokens and do not use tracking cookies.',
            'No advertising cookies or third-party behavioral tracking pixels are integrated.',
          ],
        },
        {
          title: '7. Policy changes',
          content: [
            'This policy may be updated. For significant changes, we will notify users via registered email.',
            'Continuing to use the service after changes take effect means you accept the updated policy.',
          ],
        },
        {
          title: '8. Contact support',
          content: [
            'If you have questions about this privacy policy, reach out at: support@financemanager.vn',
          ],
        },
      ]
    : [
        {
          title: '1. Thông tin chúng tôi thu thập',
          content: [
            'Khi bạn đăng ký tài khoản, chúng tôi thu thập: họ tên, địa chỉ email và mật khẩu (được mã hóa bcrypt).',
            'Dữ liệu tài chính bạn nhập (giao dịch, ngân sách, mục tiêu) được lưu trữ bảo mật và chỉ hiển thị cho tài khoản của bạn.',
            'Thông tin kỹ thuật như địa chỉ IP, loại trình duyệt có thể được ghi lại nhằm mục đích bảo mật và cải thiện dịch vụ.',
          ],
        },
        {
          title: '2. Cách chúng tôi sử dụng thông tin',
          content: [
            'Cung cấp, duy trì và cải thiện các tính năng của ứng dụng cũng như trải nghiệm cá nhân hóa.',
            'Gửi thông báo liên quan đến tài khoản (xác nhận đăng ký, đặt lại mật khẩu, cảnh báo hệ thống).',
            'Phân tích cách người dùng tương tác để tối ưu trải nghiệm chung (sử dụng dữ liệu ẩn danh).',
            'Phát hiện, ngăn chặn và xử lý các hoạt động gian lận hoặc truy cập trái phép.',
          ],
        },
        {
          title: '3. Chia sẻ thông tin',
          content: [
            'Chúng tôi KHÔNG bán, trao đổi hay cho thuê thông tin cá nhân của bạn cho bên thứ ba trong mọi trường hợp.',
            'Thông tin chỉ được chia sẻ khi có yêu cầu pháp lý hoặc để bảo vệ quyền lợi hợp pháp của hệ thống.',
            'Các nhà cung cấp dịch vụ kỹ thuật (hosting, sao lưu) có thể tiếp cận dữ liệu theo điều khoản bảo mật nghiêm ngặt.',
          ],
        },
        {
          title: '4. Bảo mật dữ liệu',
          content: [
            'Mọi kết nối đều được mã hóa bằng HTTPS/TLS 1.3 tiêu chuẩn bảo mật cao nhất.',
            'Mật khẩu được băm một chiều bằng bcrypt — chúng tôi không lưu mật khẩu gốc.',
            'Token xác thực JWT có thời hạn rõ ràng và được ký bằng khóa bảo mật an toàn.',
            'Hệ thống được sao lưu tự động hàng ngày và lưu trữ mã hóa tại nhiều địa điểm.',
          ],
        },
        {
          title: '5. Quyền của bạn',
          content: [
            'Truy cập và chỉnh sửa thông tin cá nhân bất kỳ lúc nào qua trang Hồ sơ.',
            'Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan — xử lý triệt để trong vòng 30 ngày.',
            'Xuất dữ liệu tài chính cá nhân của bạn dưới dạng CSV hoặc Excel bất cứ lúc nào.',
            'Phản đối hoặc hạn chế việc xử lý dữ liệu trong một số trường hợp nhất định theo luật định.',
          ],
        },
        {
          title: '6. Cookie và lưu trữ cục bộ',
          content: [
            'Chúng tôi sử dụng localStorage để lưu token phiên đăng nhập — không dùng cookie theo dõi.',
            'Không có cookie quảng cáo hay theo dõi hành vi từ bên thứ ba.',
          ],
        },
        {
          title: '7. Thay đổi chính sách',
          content: [
            'Chính sách này có thể được cập nhật. Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email đã đăng ký.',
            'Tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận chính sách mới.',
          ],
        },
        {
          title: '8. Liên hệ hỗ trợ',
          content: [
            'Nếu bạn có câu hỏi về chính sách bảo mật này, hãy liên hệ: support@financemanager.vn',
          ],
        },
      ];

  const sectionIcons = [
    { icon: '📂', gradient: 'from-blue-500 to-indigo-600' },
    { icon: '⚙️', gradient: 'from-emerald-500 to-teal-600' },
    { icon: '🤝', gradient: 'from-violet-500 to-purple-600' },
    { icon: '🔒', gradient: 'from-rose-500 to-red-600' },
    { icon: '🔑', gradient: 'from-amber-500 to-orange-600' },
    { icon: '🍪', gradient: 'from-cyan-500 to-blue-600' },
    { icon: '🔔', gradient: 'from-fuchsia-500 to-pink-600' },
    { icon: '📧', gradient: 'from-emerald-600 to-emerald-800' }
  ];

  // Scroll section into view
  const scrollToSection = (index) => {
    setActiveSection(index);
    const element = document.getElementById(`section-${index}`);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Dynamic active navigation indicator on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      for (let i = 0; i < sections.length; i++) {
        const element = document.getElementById(`section-${i}`);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#12151c] text-slate-800 dark:text-slate-200 antialiased transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#191d25]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-emerald-400 transition font-bold"
            >
              <FaArrowLeft size={13} /> {isEnglish ? 'Home' : 'Trang chủ'}
            </button>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-300">
              {isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}
            </span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {isEnglish ? 'Updated' : 'Cập nhật'}: <strong className="text-slate-500 dark:text-slate-400">01 Jun, 2026</strong>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-[#191d25] dark:via-[#12151c] dark:to-emerald-950/10 py-16 px-6 border-b border-slate-150 dark:border-slate-850">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl mb-2 text-emerald-600 dark:text-emerald-400 shadow-inner">
            <FaShieldAlt size={28} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEnglish ? 'Your privacy is' : 'Quyền riêng tư của bạn là'}<br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {isEnglish ? 'our top priority' : 'ưu tiên hàng đầu của chúng tôi'}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'We are fully committed to protecting your personal data and financial logs with industry-grade encryption and strict privacy principles.' 
              : 'Chúng tôi cam kết tuyệt đối trong việc bảo vệ dữ liệu cá nhân và lịch sử tài chính của bạn bằng công nghệ mã hóa tiên tiến.'}
          </p>
        </div>
      </section>

      {/* Grid Features Highlights */}
      <section className="py-10 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          { emoji: '🔒', title: isEnglish ? 'Advanced TLS Encryption' : 'Mã hóa TLS tiên tiến', desc: isEnglish ? 'All connections are secured via HTTPS with TLS 1.3 protocol.' : 'Tất cả kết nối được bảo vệ bằng giao thức HTTPS/TLS 1.3 bảo mật.' },
          { emoji: '🚫', title: isEnglish ? 'Zero Data Sharing' : 'Không chia sẻ dữ liệu', desc: isEnglish ? 'We never sell or distribute your financial logs to third parties.' : 'Chúng tôi không bao giờ bán hay chia sẻ lịch sử tài chính của bạn.' },
          { emoji: '🗑️', title: isEnglish ? 'Absolute Deletion' : 'Xóa sạch dữ liệu', desc: isEnglish ? 'Deleting your account fully purges all records within 30 days.' : 'Yêu cầu xóa tài khoản sẽ xóa sạch mọi thông tin trong vòng 30 ngày.' },
        ].map((h, i) => (
          <div key={i} className="flex gap-4 bg-white dark:bg-[#191d25] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 hover:border-emerald-500/20 dark:hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all duration-300">
            <span className="text-3xl flex-shrink-0">{h.emoji}</span>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{h.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{h.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Body Split Layout */}
      <section className="py-10 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Sticky Left Navigation Sidebar */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 bg-white dark:bg-[#191d25] rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                {isEnglish ? 'Sections' : 'Mục lục'}
              </h3>
              <div className="space-y-1">
                {sections.map((sec, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                      activeSection === idx
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <span className="text-base">{sectionIcons[idx].icon}</span>
                    <span className="truncate">{sec.title.replace(/^\d+\.\s/, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Cards */}
          <div className="lg:col-span-8 space-y-6">
            {sections.map((sec, idx) => (
              <div
                id={`section-${idx}`}
                key={idx}
                className="bg-white dark:bg-[#191d25] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-350 space-y-5 scroll-mt-24"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sectionIcons[idx].gradient} text-white flex items-center justify-center text-lg shadow-md`}>
                    {sectionIcons[idx].icon}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {sec.title}
                    </h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      {isEnglish ? 'Privacy Policy Statement' : 'Cam kết điều khoản chính sách'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3 pl-2">
                  {sec.content.map((line, j) => (
                    <li key={j} className="flex items-start gap-3 text-xs md:text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0 animate-pulse" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact Call to Action */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-[#191d25] dark:to-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 rounded-3xl p-8 text-center space-y-4">
              <div className="text-3xl">💬</div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                {isEnglish ? 'Questions about this privacy policy?' : 'Có câu hỏi về chính sách bảo mật?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 max-w-md mx-auto leading-relaxed">
                {isEnglish 
                  ? 'Our data compliance and support team is always here to clarify any questions regarding data usage.' 
                  : 'Đội ngũ hỗ trợ của chúng tôi sẵn sàng làm rõ các thắc mắc về cách dữ liệu được sử dụng.'}
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all hover:scale-105"
              >
                {isEnglish ? 'Contact support team' : 'Liên hệ với chúng tôi'}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-150 dark:border-slate-850/80 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 Finance Manager. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/home')} className="hover:text-emerald-500 transition">{isEnglish ? 'Home' : 'Trang chủ'}</button>
            <span>·</span>
            <button onClick={() => navigate('/about')} className="hover:text-emerald-500 transition">{isEnglish ? 'About us' : 'Về chúng tôi'}</button>
            <span>·</span>
            <button onClick={() => navigate('/contact')} className="hover:text-emerald-500 transition">{isEnglish ? 'Contact' : 'Liên hệ'}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
