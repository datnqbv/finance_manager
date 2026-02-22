import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

const Contact = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Vui lòng nhập họ tên';
    if (!form.email.trim())   e.email   = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.subject.trim()) e.subject = 'Vui lòng nhập tiêu đề';
    if (!form.message.trim()) e.message = 'Vui lòng nhập nội dung';
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
      const msg = err.response?.data?.message || 'Gửi thất bại. Vui lòng thử lại sau.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl bg-white text-slate-800 outline-none transition focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
      errors[field] ? 'border-red-400' : 'border-slate-200'
    }`;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition font-medium"
          >
            <FaArrowLeft size={13} /> Trang chủ
          </button>
          <span className="text-slate-200">|</span>
          <span className="text-sm font-semibold text-slate-700">Liên hệ</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest mb-5">
            Liên hệ
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Chúng tôi luôn sẵn sàng<br />
            <span className="text-emerald-600">lắng nghe bạn</span>
          </h1>
          <p className="text-lg text-slate-500">
            Có câu hỏi, góp ý hay cần hỗ trợ? Hãy gửi tin nhắn — chúng tôi sẽ phản hồi trong vòng 24 giờ.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-16 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12">

          {/* Left – Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-5">Thông tin liên hệ</h2>
              <div className="space-y-4">
                {[
                  { icon: <FaEnvelope className="text-emerald-600" size={16} />, label: 'Email', value: 'support@financemanager.vn', href: 'mailto:support@financemanager.vn' },
                  { icon: <FaPhoneAlt className="text-emerald-600" size={16} />, label: 'Điện thoại', value: '1800 1234', href: 'tel:18001234' },
                  { icon: <FaMapMarkerAlt className="text-emerald-600" size={16} />, label: 'Địa chỉ', value: 'TP. Hồ Chí Minh, Việt Nam', href: null },
                  { icon: <FaClock className="text-emerald-600" size={16} />, label: 'Giờ làm việc', value: 'T2 – T6, 8:00 – 17:30', href: null },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition">
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-sm font-semibold text-slate-700">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ shortcuts */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Câu hỏi thường gặp</h3>
              <ul className="space-y-2">
                {[
                  'Làm sao để đặt lại mật khẩu?',
                  'App có miễn phí không?',
                  'Dữ liệu có được bảo mật không?',
                ].map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right – Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
                  <FaCheckCircle className="text-emerald-600" size={28} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Đã gửi thành công!</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs">
                  Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi qua email trong vòng 24 giờ.
                </p>
                <button
                  onClick={() => { setSent(false); setServerError(''); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="text-sm font-semibold text-emerald-600 hover:underline"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Họ và tên *</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={form.name}
                      onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                      className={inputCls('name')}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
                      className={inputCls('email')}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tiêu đề *</label>
                  <input
                    type="text"
                    placeholder="Tôi cần hỗ trợ về..."
                    value={form.subject}
                    onChange={(e) => { setForm({ ...form, subject: e.target.value }); setErrors({ ...errors, subject: '' }); }}
                    className={inputCls('subject')}
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nội dung *</label>
                  <textarea
                    rows={6}
                    placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                    value={form.message}
                    onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: '' }); }}
                    className={`${inputCls('message')} resize-none`}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                </div>
                {serverError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <span className="mt-0.5">⚠️</span> {serverError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang gửi...</>
                  ) : 'Gửi tin nhắn'}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer nhỏ ── */}
      <footer className="py-6 px-5 text-center text-xs text-slate-400 border-t border-slate-100">
        &copy; 2025 Finance Manager · <button onClick={() => navigate('/home')} className="hover:text-emerald-600 transition">Trang chủ</button>
        {' · '}<button onClick={() => navigate('/about')} className="hover:text-emerald-600 transition">Về chúng tôi</button>
        {' · '}<button onClick={() => navigate('/privacy')} className="hover:text-emerald-600 transition">Chính sách bảo mật</button>
      </footer>
    </div>
  );
};

export default Contact;
