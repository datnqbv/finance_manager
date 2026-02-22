import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRocket, FaUsers, FaShieldAlt, FaChartLine, FaHeart } from 'react-icons/fa';

const About = () => {
  const navigate = useNavigate();

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
          <span className="text-sm font-semibold text-slate-700">Về chúng tôi</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 py-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest mb-5">
            Về chúng tôi
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
            Chúng tôi xây dựng công cụ<br />
            <span className="text-emerald-600">giúp bạn tự do tài chính</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
            Finance Manager được ra đời với sứ mệnh giúp mọi người Việt Nam kiểm soát tài chính cá nhân
            một cách dễ dàng, trực quan và hiệu quả nhất.
          </p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-16 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Sứ mệnh</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-4">
              Đơn giản hóa việc quản lý tài chính cho mọi người
            </h2>
            <p className="text-slate-500 leading-relaxed mb-4">
              Chúng tôi tin rằng mọi người đều xứng đáng có công cụ tài chính mạnh mẽ — không cần phải
              là chuyên gia kế toán hay có nhiều kinh nghiệm.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Finance Manager được thiết kế để ai cũng có thể sử dụng ngay từ ngày đầu tiên,
              với giao diện thân thiện và hướng dẫn rõ ràng.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <FaRocket size={20} />, title: 'Khởi đầu 2024', desc: 'Dự án ra đời từ nhu cầu thực tế của người dùng Việt Nam', color: 'bg-emerald-50 text-emerald-600' },
              { icon: <FaUsers size={20} />, title: '10,000+ Users', desc: 'Người dùng tin tưởng và sử dụng mỗi ngày', color: 'bg-blue-50 text-blue-600' },
              { icon: <FaChartLine size={20} />, title: '1M+ Giao dịch', desc: 'Giao dịch được ghi nhận và phân tích', color: 'bg-violet-50 text-violet-600' },
              { icon: <FaShieldAlt size={20} />, title: 'Bảo mật tuyệt đối', desc: 'Dữ liệu mã hóa 256-bit SSL tiêu chuẩn ngân hàng', color: 'bg-amber-50 text-amber-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{item.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-16 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Giá trị cốt lõi</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Những gì chúng tôi đặt lên hàng đầu</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Đơn giản', desc: 'Mọi tính năng đều được thiết kế để dễ dùng nhất có thể. Không cần hướng dẫn dài dòng.', emoji: '✨' },
              { title: 'Minh bạch', desc: 'Dữ liệu của bạn là của bạn. Chúng tôi không bán hay chia sẻ thông tin cá nhân.', emoji: '🔍' },
              { title: 'Tin cậy', desc: 'Hệ thống hoạt động 24/7 với độ ổn định cao và sao lưu dữ liệu tự động.', emoji: '🛡️' },
            ].map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{v.emoji}</div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team / Story ── */}
      <section className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Câu chuyện</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-6">Tại sao chúng tôi làm điều này?</h2>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-left">
            <div className="flex items-start gap-3 mb-4">
              <FaHeart className="text-emerald-500 mt-1 flex-shrink-0" />
              <p className="text-slate-600 leading-relaxed">
                Finance Manager bắt đầu từ một vấn đề rất thực tế: nhiều người Việt Nam — kể cả người
                có thu nhập tốt — vẫn gặp khó khăn trong việc tiết kiệm và đạt mục tiêu tài chính, không
                phải vì thiếu tiền mà vì thiếu công cụ phù hợp.
              </p>
            </div>
            <p className="text-slate-600 leading-relaxed ml-6">
              Chúng tôi muốn tạo ra một ứng dụng mà bất kỳ ai — từ sinh viên đến nhân viên văn phòng,
              từ freelancer đến chủ doanh nghiệp nhỏ — đều có thể dùng để hiểu rõ dòng tiền của mình
              và đưa ra quyết định tài chính tốt hơn mỗi ngày.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-5 sm:px-8 bg-emerald-600">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">Bắt đầu hành trình tài chính của bạn</h2>
          <p className="text-emerald-100 mb-6 text-sm">Miễn phí, không cần thẻ tín dụng.</p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition shadow-lg text-sm"
          >
            Đăng ký miễn phí
          </button>
        </div>
      </section>

      {/* ── Footer nhỏ ── */}
      <footer className="py-6 px-5 text-center text-xs text-slate-400 border-t border-slate-100">
        &copy; 2025 Finance Manager · <button onClick={() => navigate('/home')} className="hover:text-emerald-600 transition">Trang chủ</button>
        {' · '}<button onClick={() => navigate('/contact')} className="hover:text-emerald-600 transition">Liên hệ</button>
        {' · '}<button onClick={() => navigate('/privacy')} className="hover:text-emerald-600 transition">Chính sách bảo mật</button>
      </footer>
    </div>
  );
};

export default About;
