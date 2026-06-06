import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaCheckCircle, FaChevronDown, FaQuestionCircle } from 'react-icons/fa';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqData = isEnglish ? [
    { q: 'How do I reset my secure password?', a: 'Go to the Login screen, click "Forgot Password?", enter your email, and follow instructions sent to your inbox to reset securely.' },
    { q: 'Is the personal finance manager free?', a: 'Yes, our standard plan is 100% free with core expense tracking. You can upgrade to VIP for OCR receipt scans and advanced reports.' },
    { q: 'Is my financial data encrypted and secure?', a: 'Absolutely. We use industry-grade HTTPS/TLS 1.3 protocol and encrypt sensitive files. Passwords are fully hashed using bcrypt.' },
    { q: 'How do I export my monthly budgets and transaction logs?', a: 'Navigate to the Transactions page, click the "Export" button, and select your preferred format (CSV, Excel, or PDF report).' }
  ] : [
    { q: 'Làm thế nào để tôi đặt lại mật khẩu?', a: 'Tại màn hình Đăng nhập, bấm "Quên mật khẩu?", nhập email đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu về email của bạn.' },
    { q: 'Ứng dụng quản lý tài chính có miễn phí không?', a: 'Có, gói cơ bản là hoàn toàn miễn phí. Bạn có thể nâng cấp lên VIP để sử dụng tính năng AI quét hóa đơn tự động và các báo cáo nâng cao.' },
    { q: 'Dữ liệu tài chính của tôi có được bảo mật không?', a: 'Tuyệt đối an toàn. Mọi dữ liệu truyền tải đều được mã hóa bằng TLS 1.3. Mật khẩu lưu trữ được băm bảo mật bằng thuật toán bcrypt.' },
    { q: 'Tôi có thể xuất báo cáo giao dịch ra file Excel không?', a: 'Có. Tại trang Giao dịch, bạn có thể click nút "Xuất" để tải báo cáo dạng CSV, Excel, hoặc xuất file PDF.' }
  ];

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = isEnglish ? 'Please enter your full name' : 'Vui lòng nhập họ tên';
    if (!form.email.trim())   e.email   = isEnglish ? 'Please enter your email' : 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = isEnglish ? 'Invalid email address' : 'Email không hợp lệ';
    if (!form.subject.trim()) e.subject = isEnglish ? 'Please enter a subject' : 'Vui lòng nhập tiêu đề';
    if (!form.message.trim()) e.message = isEnglish ? 'Please enter your message' : 'Vui lòng nhập nội dung';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post('/contact', {
        name:    form.name.trim(),
        email:   form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || (isEnglish ? 'Send failed. Please try again later.' : 'Gửi thất bại. Vui lòng thử lại sau.');
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
              {isEnglish ? 'Contact Us' : 'Hỗ trợ & Liên hệ'}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-[#191d25] dark:via-[#12151c] dark:to-emerald-950/10 py-16 px-6 border-b border-slate-150 dark:border-slate-850">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/20 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-250 dark:text-emerald-450 dark:bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
            {isEnglish ? 'Contact Us' : 'Hỗ trợ & liên hệ'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEnglish ? 'How can we help' : 'Chúng tôi có thể giúp gì'}<br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {isEnglish ? 'your financial journey?' : 'cho hành trình tài chính của bạn?'}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isEnglish 
              ? 'Have a question, feedback, or need premium VIP features support? Drop us a line and we will reply within 24 hours.' 
              : 'Có câu hỏi, góp ý hay cần hỗ trợ các tính năng VIP? Hãy gửi lời nhắn — chúng tôi sẽ phản hồi trong vòng 24 giờ.'}
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Info & FAQ */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Info Cards */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-505 px-1">
                {isEnglish ? 'Support Directory' : 'Thông tin liên hệ'}
              </h2>
              <div className="grid gap-3">
                {[
                  { icon: <FaEnvelope className="text-blue-500" size={16} />, label: 'Email Support', value: 'support@financemanager.vn', href: 'mailto:support@financemanager.vn', desc: isEnglish ? 'Response within 24 business hours' : 'Phản hồi trong 24 giờ làm việc' },
                  { icon: <FaPhoneAlt className="text-emerald-500" size={16} />, label: isEnglish ? 'Hotline' : 'Điện thoại', value: '1800 1234', href: 'tel:18001234', desc: isEnglish ? 'Toll-free customer support line' : 'Miễn phí cước cuộc gọi hỗ trợ' },
                  { icon: <FaMapMarkerAlt className="text-rose-500" size={16} />, label: isEnglish ? 'Headquarters' : 'Văn phòng', value: isEnglish ? 'District 1, Ho Chi Minh City, VN' : 'Quận 1, TP. Hồ Chí Minh, VN', href: null, desc: isEnglish ? 'Operating center & research hub' : 'Trung tâm vận hành chính' },
                  { icon: <FaClock className="text-amber-500" size={16} />, label: isEnglish ? 'Working Hours' : 'Giờ hoạt động', value: isEnglish ? 'Mon – Fri, 8:00 – 17:30' : 'Thứ 2 – Thứ 6, 8:00 – 17:30', href: null, desc: isEnglish ? 'Excluding public national holidays' : 'Ngoại trừ các ngày lễ tết' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 bg-white dark:bg-[#191d25] rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:text-emerald-500 transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{item.value}</p>
                      )}
                      <p className="text-[11px] text-slate-400 dark:text-slate-450">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive FAQs Accordion */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-505 px-1 flex items-center gap-2">
                <FaQuestionCircle /> {isEnglish ? 'Quick FAQs' : 'Câu hỏi thường gặp'}
              </h2>
              <div className="space-y-2.5">
                {faqData.map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#191d25] rounded-2xl border border-slate-100 dark:border-slate-800/85 overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200"
                    >
                      <span>{faq.q}</span>
                      <FaChevronDown size={11} className={`text-slate-400 transition-transform duration-350 ${openFaq === idx ? 'rotate-180 text-emerald-500' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <div className="px-5 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/50 pt-3 animate-slide-down">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Form Widget */}
          <div className="lg:col-span-7 bg-white dark:bg-[#191d25] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800/80 shadow-md">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <FaCheckCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {isEnglish ? 'Message Sent Successfully!' : 'Đã gửi thành công!'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    {isEnglish 
                      ? 'Thank you for reaching out. A copy of your inquiry has been recorded and our team will follow up via email within 24 hours.' 
                      : 'Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ phản hồi câu hỏi của bạn qua email trong vòng 24 giờ.'}
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setServerError(''); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl transition"
                >
                  {isEnglish ? 'Send another inquiry' : 'Gửi tin nhắn khác'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                    {isEnglish ? 'Submit a Ticket' : 'Gửi yêu cầu hỗ trợ'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isEnglish ? 'Fill out the details below to contact our engineers.' : 'Vui lòng điền đầy đủ các mục bên dưới để gửi yêu cầu hỗ trợ.'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                      {isEnglish ? 'Full Name *' : 'Họ và tên *'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEnglish ? 'e.g., Jane Doe' : 'Ví dụ: Nguyễn Văn A'}
                      value={form.name}
                      onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                      className={`input text-sm w-full ${errors.name ? 'border-red-500 focus:ring-red-500/10' : ''}`}
                    />
                    {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                      className={`input text-sm w-full ${errors.email ? 'border-red-500 focus:ring-red-500/10' : ''}`}
                    />
                    {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                    {isEnglish ? 'Subject *' : 'Tiêu đề *'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEnglish ? 'e.g., Billing support, VIP upgrade issue...' : 'Ví dụ: Hỗ trợ thanh toán, Lỗi nâng cấp VIP...'}
                    value={form.subject}
                    onChange={(e) => { setForm({ ...form, subject: e.target.value }); setErrors({ ...errors, subject: '' }); }}
                    className={`input text-sm w-full ${errors.subject ? 'border-red-500 focus:ring-red-500/10' : ''}`}
                  />
                  {errors.subject && <p className="text-[11px] text-red-500 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">
                    {isEnglish ? 'Message Content *' : 'Nội dung *'}
                  </label>
                  <textarea
                    rows={5}
                    placeholder={isEnglish ? 'Detail your inquiry or question so we can serve you best...' : 'Chi tiết câu hỏi hoặc vấn đề của bạn...'}
                    value={form.message}
                    onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: '' }); }}
                    className={`input text-sm w-full resize-none ${errors.message ? 'border-red-500 focus:ring-red-500/10' : ''}`}
                  />
                  {errors.message && <p className="text-[11px] text-red-500 mt-1">{errors.message}</p>}
                </div>

                {serverError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-950/40 rounded-xl text-xs text-red-600 dark:text-red-400">
                    <span className="mt-0.5">⚠️</span> {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>{isEnglish ? 'Sending inquiry...' : 'Đang gửi yêu cầu...'}</span>
                    </>
                  ) : (
                    <span>{isEnglish ? 'Submit Support Ticket' : 'Gửi tin nhắn'}</span>
                  )}
                </button>
                
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                  {isEnglish 
                    ? 'By submitting this ticket, you agree to our privacy conditions.' 
                    : 'Bằng việc gửi tin nhắn, bạn đồng ý với các điều khoản bảo mật của chúng tôi.'}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-150 dark:border-slate-850/80 transition-colors duration-300 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 Finance Manager. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/home')} className="hover:text-emerald-500 transition">{isEnglish ? 'Home' : 'Trang chủ'}</button>
            <span>·</span>
            <button onClick={() => navigate('/about')} className="hover:text-emerald-500 transition">{isEnglish ? 'About us' : 'Về chúng tôi'}</button>
            <span>·</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-emerald-500 transition">{isEnglish ? 'Privacy Policy' : 'Chính sách bảo mật'}</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Contact;
