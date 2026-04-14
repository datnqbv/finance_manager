import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const Privacy = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const sections = isEnglish
    ? [
        {
          title: '1. Information we collect',
          content: [
            'When you register, we collect your name, email address, and password (bcrypt encrypted).',
            'Financial data you enter (transactions, budgets, goals) is stored and visible only to your account.',
            'Technical data like IP address and browser type may be logged for security and service improvement.',
          ],
        },
        {
          title: '2. How we use information',
          content: [
            'Provide, maintain, and improve app features.',
            'Send account-related notifications (registration confirmation, password reset).',
            'Analyze user interaction to optimize experience (anonymous, non-identifiable data).',
            'Detect and prevent fraud or unauthorized access.',
          ],
        },
        {
          title: '3. Information sharing',
          content: [
            'We DO NOT sell, trade, or rent your personal information to third parties.',
            'Information is shared only when legally required or to protect legitimate rights.',
            'Technical providers (hosting, analytics) may access anonymized data under strict confidentiality terms.',
          ],
        },
        {
          title: '4. Data security',
          content: [
            'All connections are encrypted via HTTPS/TLS 1.3.',
            'Passwords are one-way hashed with bcrypt; we do not store raw passwords.',
            'JWT authentication tokens are time-limited and signed with a secret key.',
            'System backups are performed daily and stored across multiple locations.',
          ],
        },
        {
          title: '5. Your rights',
          content: [
            'Access and edit your personal information anytime on the Profile page.',
            'Request account and related data deletion; processed within 30 days.',
            'Export your data in CSV or JSON format on request.',
            'Object to or restrict data processing in certain circumstances.',
          ],
        },
        {
          title: '6. Cookies and local storage',
          content: [
            'We use localStorage to store session tokens and do not use tracking cookies.',
            'No advertising cookies or third-party behavioral tracking cookies are used.',
          ],
        },
        {
          title: '7. Policy changes',
          content: [
            'This policy may be updated. For significant changes, we notify users via registered email.',
            'Continuing to use the service after changes take effect means you accept the updated policy.',
          ],
        },
        {
          title: '8. Contact',
          content: [
            'If you have questions about this privacy policy, contact: support@financemanager.vn',
          ],
        },
      ]
    : [
        {
          title: '1. Thông tin chúng tôi thu thập',
          content: [
            'Khi bạn đăng ký tài khoản, chúng tôi thu thập: họ tên, địa chỉ email và mật khẩu (được mã hóa bcrypt).',
            'Dữ liệu tài chính bạn nhập (giao dịch, ngân sách, mục tiêu) được lưu trữ và chỉ hiển thị cho tài khoản của bạn.',
            'Thông tin kỹ thuật như địa chỉ IP, loại trình duyệt có thể được ghi lại nhằm mục đích bảo mật và cải thiện dịch vụ.',
          ],
        },
        {
          title: '2. Cách chúng tôi sử dụng thông tin',
          content: [
            'Cung cấp, duy trì và cải thiện các tính năng của ứng dụng.',
            'Gửi thông báo liên quan đến tài khoản (xác nhận đăng ký, đặt lại mật khẩu).',
            'Phân tích cách người dùng tương tác để tối ưu trải nghiệm (dữ liệu ẩn danh, không liên kết cá nhân).',
            'Phát hiện và ngăn chặn các hoạt động gian lận hoặc truy cập trái phép.',
          ],
        },
        {
          title: '3. Chia sẻ thông tin',
          content: [
            'Chúng tôi KHÔNG bán, trao đổi hay cho thuê thông tin cá nhân của bạn cho bên thứ ba.',
            'Thông tin chỉ được chia sẻ khi có yêu cầu pháp lý hoặc để bảo vệ quyền lợi hợp pháp.',
            'Các nhà cung cấp dịch vụ kỹ thuật (hosting, phân tích) có thể tiếp cận dữ liệu ẩn danh theo điều khoản bảo mật nghiêm ngặt.',
          ],
        },
        {
          title: '4. Bảo mật dữ liệu',
          content: [
            'Mọi kết nối đều được mã hóa bằng HTTPS/TLS 1.3.',
            'Mật khẩu được băm một chiều bằng bcrypt — chúng tôi không lưu mật khẩu gốc.',
            'Token xác thực JWT có thời hạn và được ký bằng khóa bí mật.',
            'Hệ thống được sao lưu tự động hàng ngày và lưu trữ tại nhiều địa điểm.',
          ],
        },
        {
          title: '5. Quyền của bạn',
          content: [
            'Truy cập và chỉnh sửa thông tin cá nhân bất kỳ lúc nào qua trang Hồ sơ.',
            'Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan — xử lý trong vòng 30 ngày.',
            'Xuất dữ liệu của bạn dưới dạng CSV hoặc JSON theo yêu cầu.',
            'Phản đối hoặc hạn chế việc xử lý dữ liệu trong một số trường hợp nhất định.',
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
          title: '8. Liên hệ',
          content: [
            'Nếu bạn có câu hỏi về chính sách bảo mật này, hãy liên hệ: support@financemanager.vn',
          ],
        },
      ];

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition font-medium"
          >
            <FaArrowLeft size={13} /> {isEnglish ? 'Home' : 'Trang chủ'}
          </button>
          <span className="text-slate-200">|</span>
          <span className="text-sm font-semibold text-slate-700">{isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-5">
            <FaShieldAlt className="text-emerald-600" size={24} />
          </div>
          <span className="block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest mb-5 w-fit mx-auto">
            {isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            {isEnglish ? 'Your data,' : 'Dữ liệu của bạn,'}<br />
            <span className="text-emerald-600">{isEnglish ? 'your rights' : 'quyền của bạn'}</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            {isEnglish ? 'We are fully committed to protecting your personal and financial data.' : 'Chúng tôi cam kết bảo vệ tuyệt đối thông tin cá nhân và dữ liệu tài chính của bạn.'}
          </p>
          <div className="mt-4 text-xs text-slate-400">
            {isEnglish ? 'Last updated' : 'Cập nhật lần cuối'}: <strong className="text-slate-500">01 Jan, 2025</strong>
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="py-10 px-5 sm:px-8 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-4">
          {[
            { emoji: '🔒', title: isEnglish ? '256-bit encryption' : 'Mã hóa 256-bit', desc: isEnglish ? 'Data is transmitted via HTTPS and encrypted at rest' : 'Dữ liệu truyền tải qua HTTPS và lưu trữ mã hóa' },
            { emoji: '🚫', title: isEnglish ? 'No data selling' : 'Không bán dữ liệu', desc: isEnglish ? 'Your information is never sold to third parties' : 'Thông tin của bạn không bao giờ được bán cho bên thứ ba' },
            { emoji: '🗑️', title: isEnglish ? 'Delete on request' : 'Xóa theo yêu cầu', desc: isEnglish ? 'You can request full data deletion anytime' : 'Bạn có thể xóa toàn bộ dữ liệu bất kỳ lúc nào' },
          ].map((h, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-2xl">{h.emoji}</span>
              <div>
                <div className="text-sm font-bold text-slate-800">{h.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nội dung chính ── */}
      <section className="py-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-slate max-w-none space-y-10">
            {sections.map((sec, i) => (
              <div key={i}>
                <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg flex items-center justify-center">
                    {i + 1}
                  </span>
                  {sec.title.replace(/^\d+\.\s/, '')}
                </h2>
                <ul className="space-y-2.5">
                  {sec.content.map((line, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact block */}
          <div className="mt-12 bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-600 mb-3">{isEnglish ? 'Questions about this privacy policy?' : 'Có câu hỏi về chính sách bảo mật?'}</p>
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm"
            >
              {isEnglish ? 'Contact us' : 'Liên hệ với chúng tôi'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer nhỏ ── */}
      <footer className="py-6 px-5 text-center text-xs text-slate-400 border-t border-slate-100">
        &copy; 2025 Finance Manager · <button onClick={() => navigate('/home')} className="hover:text-emerald-600 transition">{isEnglish ? 'Home' : 'Trang chủ'}</button>
        {' · '}<button onClick={() => navigate('/about')} className="hover:text-emerald-600 transition">{isEnglish ? 'About us' : 'Về chúng tôi'}</button>
        {' · '}<button onClick={() => navigate('/contact')} className="hover:text-emerald-600 transition">{isEnglish ? 'Contact' : 'Liên hệ'}</button>
      </footer>
    </div>
  );
};

export default Privacy;
