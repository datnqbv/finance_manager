import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCheck, FaTimes } from 'react-icons/fa';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const plans = [
    {
      name: 'Miễn phí',
      price: '0đ',
      period: '/tháng',
      description: 'Hoàn hảo để bắt đầu quản lý tài chính cá nhân',
      features: [
        { text: 'Theo dõi giao dịch không giới hạn', included: true },
        { text: 'Tạo tối đa 5 danh mục', included: true },
        { text: 'Báo cáo cơ bản', included: true },
        { text: 'Ngân sách hàng tháng', included: true },
        { text: 'Hỗ trợ email', included: true },
        { text: 'Xuất báo cáo PDF', included: false },
        { text: 'Mục tiêu tiết kiệm nâng cao', included: false },
        { text: 'Phân tích AI', included: false },
      ],
      popular: false,
      buttonText: 'Bắt đầu miễn phí',
      buttonStyle: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
    },
    {
      name: 'Pro',
      price: '99,000đ',
      period: '/tháng',
      description: 'Dành cho người dùng nghiêm túc về tài chính',
      features: [
        { text: 'Tất cả tính năng Miễn phí', included: true },
        { text: 'Danh mục không giới hạn', included: true },
        { text: 'Báo cáo nâng cao với biểu đồ', included: true },
        { text: 'Xuất báo cáo PDF & Excel', included: true },
        { text: 'Mục tiêu tiết kiệm nâng cao', included: true },
        { text: 'Giao dịch định kỳ', included: true },
        { text: 'Hỗ trợ ưu tiên', included: true },
        { text: 'Phân tích AI', included: false },
      ],
      popular: true,
      buttonText: 'Nâng cấp lên Pro',
      buttonStyle: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg'
    },
    {
      name: 'Premium',
      price: '199,000đ',
      period: '/tháng',
      description: 'Giải pháp hoàn hảo cho chuyên gia tài chính',
      features: [
        { text: 'Tất cả tính năng Pro', included: true },
        { text: 'Phân tích AI thông minh', included: true },
        { text: 'Tư vấn tài chính cá nhân hóa', included: true },
        { text: 'Dự đoán xu hướng chi tiêu', included: true },
        { text: 'Đồng bộ đa thiết bị', included: true },
        { text: 'Sao lưu đám mây không giới hạn', included: true },
        { text: 'Hỗ trợ 24/7', included: true },
        { text: 'Quản lý nhiều tài khoản', included: true },
      ],
      popular: false,
      buttonText: 'Nâng cấp Premium',
      buttonStyle: 'border-2 border-purple-500 text-purple-600 hover:bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/home')} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">FM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Finance Manager</span>
            </button>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate('/home')} className="text-gray-600 hover:text-gray-900 transition">Trang chủ</button>
              <button onClick={() => navigate('/pricing')} className="text-emerald-600 font-semibold">Bảng giá</button>
              <button onClick={() => navigate('/blog')} className="text-gray-600 hover:text-gray-900 transition">Blog</button>
              <button 
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-md hover:shadow-lg"
              >
                {user ? 'Vào Dashboard ngay' : 'Tham gia ngay'}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Chọn gói phù hợp với{' '}
            <span className="text-emerald-500">bạn</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Bắt đầu miễn phí, nâng cấp khi bạn cần thêm tính năng. Không có phí ẩn, hủy bất cứ lúc nào.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <FaCheck className="text-emerald-500" />
            <span>Dùng thử 14 ngày miễn phí</span>
            <span className="mx-2">•</span>
            <FaCheck className="text-emerald-500" />
            <span>Không cần thẻ tín dụng</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-4 ring-emerald-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Phổ biến nhất
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 mb-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <FaCheck className="text-emerald-500 mt-1 flex-shrink-0" />
                      ) : (
                        <FaTimes className="text-gray-300 mt-1 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tôi có thể hủy bất cứ lúc nào không?
              </h3>
              <p className="text-gray-600">
                Có, bạn có thể hủy gói đăng ký bất cứ lúc nào. Không có hợp đồng dài hạn hay phí hủy.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tôi có thể nâng cấp hoặc hạ cấp không?
              </h3>
              <p className="text-gray-600">
                Tất nhiên! Bạn có thể thay đổi gói bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dữ liệu của tôi có an toàn không?
              </h3>
              <p className="text-gray-600">
                Chúng tôi sử dụng mã hóa cấp ngân hàng và tuân thủ các tiêu chuẩn bảo mật cao nhất để bảo vệ dữ liệu của bạn.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Có hỗ trợ khách hàng không?
              </h3>
              <p className="text-gray-600">
                Có! Tất cả các gói đều được hỗ trợ qua email. Gói Premium có hỗ trợ ưu tiên 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              Bắt đầu miễn phí ngay hôm nay
            </h2>
            <p className="text-xl text-emerald-50 mb-8">
              Không cần thẻ tín dụng. Nâng cấp bất cứ lúc nào.
            </p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="px-10 py-4 bg-white text-emerald-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {user ? 'Vào Dashboard ngay' : 'Tham gia ngay'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
