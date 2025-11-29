import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaWallet, 
  FaCreditCard, 
  FaBullseye, 
  FaChartBar,
  FaStar,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaCheckCircle,
  FaBolt,
  FaShieldAlt,
  FaUsers,
  FaTrophy,
  FaRocket
} from 'react-icons/fa';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 10px) scale(1.05); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes reveal-up {
          from { 
            transform: translateY(50px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-blob { animation: blob 7s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-slide-in-left { animation: slide-in-left 0.6s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.5s ease-out forwards; }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }
        
        /* Scroll Reveal Animations */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .scroll-reveal.animate-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .scroll-reveal-delay-1 { transition-delay: 0.1s; }
        .scroll-reveal-delay-2 { transition-delay: 0.2s; }
        .scroll-reveal-delay-3 { transition-delay: 0.3s; }
        .scroll-reveal-delay-4 { transition-delay: 0.4s; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/home')} className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <img
                  src="/icons/money-bag.png"
                  alt="Finance Manager Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">Finance Manager</span>
            </button>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-emerald-500 transition font-medium">Tính năng</a>
              <a href="#testimonials" className="text-gray-600 hover:text-emerald-500 transition font-medium">Đánh giá</a>
              <button onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-emerald-500 transition font-medium">Bảng giá</button>
              <button onClick={() => navigate('/blog')} className="text-gray-600 hover:text-emerald-500 transition font-medium">Blog</button>
              <button 
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {user ? 'Vào Dashboard ngay' : 'Tham gia ngay'} →
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section với Animated Background */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              {/* Promo Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-8 animate-bounce-slow">
                <FaBolt className="text-emerald-600" />
                <span className="text-emerald-600 font-semibold text-sm">Miễn phí 14 ngày dùng thử!</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-8 animate-slide-in-left">
                Quản lý tài chính{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-transparent bg-clip-text animate-gradient">
                  thông minh
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-10 leading-relaxed animate-slide-in-left stagger-1">
                Kiểm soát chi tiêu, đạt mục tiêu tài chính và xây dựng tương lai giàu có với công nghệ AI hiện đại.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 mb-10 animate-slide-in-left stagger-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaUsers className="text-emerald-500" />
                  <span className="font-semibold">10,000+ người dùng</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaShieldAlt className="text-emerald-500" />
                  <span className="font-semibold">Bảo mật 256-bit</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FaStar className="text-yellow-500" />
                  <span className="font-semibold">4.9/5 đánh giá</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-left stagger-3">
                <button 
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition shadow-2xl hover:shadow-emerald-500/50 transform hover:-translate-y-1 animate-pulse-glow"
                >
                  <FaRocket className="inline mr-2" />
                  {user ? 'Vào Dashboard ngay' : 'Bắt đầu miễn phí'} →
                </button>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="px-8 py-4 bg-white border-2 border-emerald-500 text-emerald-600 text-lg font-bold rounded-xl hover:bg-emerald-50 transition shadow-lg"
                >
                  Xem bảng giá
                </button>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-10 right-20 text-4xl animate-float hidden lg:block" style={{animationDelay: '0s'}}>💰</div>
              <div className="absolute bottom-20 right-40 text-4xl animate-float hidden lg:block" style={{animationDelay: '1s'}}>📊</div>
              <div className="absolute top-40 right-10 text-4xl animate-float hidden lg:block" style={{animationDelay: '2s'}}>🎯</div>
            </div>

            {/* Right - Dashboard Preview */}
            <div className="relative animate-slide-in-right">
              {/* Mockup Device */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                  {/* Mock Dashboard Content */}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-6 text-white">
                        <div className="text-sm mb-3">Tổng thu nhập</div>
                        <div className="text-2xl font-bold">45.2M</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white">
                        <div className="text-sm mb-3">Chi tiêu</div>
                        <div className="text-2xl font-bold">32.8M</div>
                      </div>
                    </div>

                    {/* Chart Area */}
                    <div className="bg-gray-50 rounded-xl p-6 h-40 flex items-end justify-between gap-3">
                      {[40, 70, 50, 80, 60, 90, 75].map((height, i) => (
                        <div 
                          key={i} 
                          className="bg-gradient-to-t from-emerald-400 to-emerald-600 rounded-t-lg flex-1 transition-all duration-500 hover:from-blue-400 hover:to-blue-600"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>

                    {/* Transaction List */}
                    <div className="mt-8 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
                          <div className="flex-1">
                            <div className="w-24 h-3 bg-gray-200 rounded mb-1"></div>
                            <div className="w-16 h-2 bg-gray-100 rounded"></div>
                          </div>
                          <div className="w-16 h-3 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto relative z-10 mt-20 scroll-reveal">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { icon: <FaUsers />, number: '10K+', label: 'Người dùng' },
              { icon: <FaTrophy />, number: '1M+', label: 'Giao dịch' },
              { icon: <FaCheckCircle />, number: '99%', label: 'Hài lòng' },
              { icon: <FaStar />, number: '4.9', label: 'Đánh giá' }
            ].map((stat, i) => (
              <div key={i} className={`text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 scroll-reveal scroll-reveal-delay-${i + 1}`}>
                <div className="text-4xl text-emerald-500 mb-3 flex justify-center">{stat.icon}</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-reveal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-600 rounded-full font-semibold mb-4">
              Tính năng
            </span>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Mọi thứ bạn cần để{' '}
              <span className="text-emerald-500">quản lý tài chính</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Công cụ mạnh mẽ và dễ sử dụng giúp bạn kiểm soát hoàn toàn tài chính cá nhân
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: <FaWallet className="text-4xl" />, 
                title: 'Theo Dõi Chi Tiêu', 
                desc: 'Ghi chép tự động và phân loại mọi khoản chi tiêu của bạn.',
                color: 'from-emerald-400 to-emerald-600'
              },
              { 
                icon: <FaCreditCard className="text-4xl" />, 
                title: 'Quản Lý Ngân Sách', 
                desc: 'Tạo ngân sách thông minh và nhận cảnh báo khi vượt chi.',
                color: 'from-blue-400 to-blue-600'
              },
              { 
                icon: <FaBullseye className="text-4xl" />, 
                title: 'Mục Tiêu Tài Chính', 
                desc: 'Đặt mục tiêu và theo dõi tiến độ tiết kiệm của bạn.',
                color: 'from-purple-400 to-purple-600'
              },
              { 
                icon: <FaChartBar className="text-4xl" />, 
                title: 'Thống Kê & Báo Cáo', 
                desc: 'Phân tích chi tiết với biểu đồ và báo cáo trực quan.',
                color: 'from-pink-400 to-pink-600'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 overflow-hidden scroll-reveal scroll-reveal-delay-${index + 1}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50 scroll-reveal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-600 rounded-full font-semibold mb-4">
              Đánh giá
            </span>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Người dùng nói gì về chúng tôi
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Nguyễn Văn A', role: 'Nhân viên văn phòng', text: 'Ứng dụng tuyệt vời! Giúp tôi tiết kiệm được 30% thu nhập mỗi tháng.', rating: 5 },
              { name: 'Trần Thị B', role: 'Freelancer', text: 'Giao diện đẹp, dễ sử dụng. Tính năng AI chatbot rất hữu ích!', rating: 5 },
              { name: 'Lê Văn C', role: 'Sinh viên', text: 'Hoàn hảo cho người mới bắt đầu quản lý tài chính. Rất đáng để thử!', rating: 5 }
            ].map((testimonial, index) => (
              <div key={index} className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 scroll-reveal scroll-reveal-delay-${index + 1}`}>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 relative overflow-hidden scroll-reveal">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Sẵn sàng kiểm soát tài chính của bạn?
          </h2>
          <p className="text-2xl text-white/90 mb-10">
            Tham gia cùng hàng nghìn người dùng đang xây dựng tương lai tài chính vững chắc.
          </p>
          <button 
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="px-12 py-5 bg-white text-emerald-600 text-xl font-bold rounded-2xl hover:bg-gray-100 transition shadow-2xl hover:shadow-white/50 transform hover:-translate-y-1 inline-flex items-center gap-3"
          >
            <FaRocket />
            {user ? 'Vào Dashboard ngay' : 'Bắt đầu miễn phí ngay'} →
          </button>
          <p className="text-white/80 mt-6">Không cần thẻ tín dụng • Dùng thử 14 ngày miễn phí</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">FM</span>
                </div>
                <span className="text-xl font-bold">Finance Manager</span>
              </div>
              <p className="text-gray-400">
                Giải pháp quản lý tài chính cá nhân thông minh và hiện đại.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Sản phẩm</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Tính năng</a></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition">Bảng giá</button></li>
                <li><button onClick={() => navigate('/blog')} className="hover:text-white transition">Blog</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Công ty</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white transition">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white transition">Chính sách</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Theo dõi</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition">
                  <FaFacebook />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition">
                  <FaTwitter />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition">
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Finance Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
