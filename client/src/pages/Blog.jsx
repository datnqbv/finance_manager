import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaClock, FaUser, FaArrowRight, FaArrowLeft, FaSearch, FaShareAlt, FaBookmark } from 'react-icons/fa';

const Blog = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const blogPosts = [
    {
      id: 1,
      title: '10 Mẹo Tiết Kiệm Tiền Hiệu Quả Trong Năm 2025',
      excerpt: 'Khám phá những phương pháp đơn giản nhưng hiệu quả để tiết kiệm tiền mỗi tháng và đạt được mục tiêu tài chính của bạn.',
      content: `
        <h2>Giới thiệu</h2>
        <p>Tiết kiệm tiền không chỉ là việc cắt giảm chi tiêu, mà còn là nghệ thuật quản lý tài chính thông minh. Trong bài viết này, chúng tôi sẽ chia sẻ 10 mẹo tiết kiệm hiệu quả nhất.</p>
        
        <h2>1. Lập ngân sách 50/30/20</h2>
        <p>Phân bổ 50% thu nhập cho nhu cầu thiết yếu, 30% cho mong muốn và 20% cho tiết kiệm. Đây là quy tắc vàng giúp bạn cân bằng cuộc sống.</p>
        
        <h2>2. Tự động hóa tiết kiệm</h2>
        <p>Thiết lập chuyển khoản tự động mỗi tháng vào tài khoản tiết kiệm. Bạn sẽ không bị cám dỗ chi tiêu số tiền đó.</p>
        
        <h2>3. Sử dụng ứng dụng quản lý chi tiêu</h2>
        <p>Finance Manager giúp bạn theo dõi mọi khoản chi tiêu một cách dễ dàng và trực quan.</p>
        
        <h2>4. Cắt giảm chi phí không cần thiết</h2>
        <p>Xem xét lại các dịch vụ đăng ký hàng tháng và loại bỏ những gì không còn sử dụng.</p>
        
        <h2>5. Mua sắm thông minh</h2>
        <p>So sánh giá, sử dụng mã giảm giá và chỉ mua khi thực sự cần thiết.</p>
      `,
      image: '💰',
      category: 'Tiết kiệm',
      author: 'Nguyễn Văn A',
      date: '15 Tháng 11, 2025',
      readTime: '5 phút đọc',
      color: 'from-emerald-400 to-emerald-600',
      tags: ['tiết kiệm', 'quản lý tài chính', 'ngân sách']
    },
    {
      id: 2,
      title: 'Cách Lập Ngân Sách Cá Nhân Chi Tiết',
      excerpt: 'Hướng dẫn từng bước để tạo một ngân sách cá nhân phù hợp với thu nhập và mục tiêu của bạn.',
      content: `
        <h2>Tại sao cần lập ngân sách?</h2>
        <p>Ngân sách giúp bạn kiểm soát tài chính, tránh chi tiêu quá mức và đạt được mục tiêu tài chính.</p>
        
        <h2>Các bước lập ngân sách</h2>
        <p>1. Tính tổng thu nhập hàng tháng<br/>
        2. Liệt kê tất cả chi phí cố định<br/>
        3. Ước tính chi phí biến động<br/>
        4. Phân bổ ngân sách cho từng hạng mục</p>
        
        <h2>Công cụ hỗ trợ</h2>
        <p>Sử dụng Finance Manager để theo dõi ngân sách một cách tự động và chính xác.</p>
      `,
      image: '📊',
      category: 'Ngân sách',
      author: 'Trần Thị B',
      date: '12 Tháng 11, 2025',
      readTime: '7 phút đọc',
      color: 'from-blue-400 to-blue-600',
      tags: ['ngân sách', 'kế hoạch tài chính', 'quản lý']
    },
    {
      id: 3,
      title: 'Đầu Tư Cho Người Mới Bắt Đầu',
      excerpt: 'Tìm hiểu những kiến thức cơ bản về đầu tư và cách bắt đầu xây dựng danh mục đầu tư của bạn.',
      content: `
        <h2>Đầu tư là gì?</h2>
        <p>Đầu tư là việc sử dụng tiền của bạn để tạo ra lợi nhuận trong tương lai.</p>
        
        <h2>Các loại hình đầu tư phổ biến</h2>
        <p>- Cổ phiếu<br/>- Trái phiếu<br/>- Quỹ đầu tư<br/>- Bất động sản<br/>- Vàng</p>
        
        <h2>Nguyên tắc đầu tư</h2>
        <p>Đa dạng hóa danh mục, đầu tư dài hạn và không bao giờ đầu tư bằng tiền vay.</p>
      `,
      image: '📈',
      category: 'Đầu tư',
      author: 'Lê Văn C',
      date: '10 Tháng 11, 2025',
      readTime: '10 phút đọc',
      color: 'from-purple-400 to-purple-600',
      tags: ['đầu tư', 'cổ phiếu', 'tài chính']
    },
    {
      id: 4,
      title: 'Quản Lý Nợ Thông Minh',
      excerpt: 'Chiến lược hiệu quả để trả nợ nhanh chóng và cải thiện tình hình tài chính của bạn.',
      content: `
        <h2>Hiểu rõ về nợ</h2>
        <p>Nợ có thể là công cụ hữu ích nhưng cũng có thể trở thành gánh nặng nếu không được quản lý tốt.</p>
        
        <h2>Phương pháp trả nợ hiệu quả</h2>
        <p>1. Phương pháp tuyết lở: Trả nợ từ nhỏ đến lớn<br/>
        2. Phương pháp lãi suất cao: Ưu tiên nợ lãi suất cao</p>
        
        <h2>Tránh nợ mới</h2>
        <p>Hạn chế sử dụng thẻ tín dụng và chỉ vay khi thực sự cần thiết.</p>
      `,
      image: '💳',
      category: 'Quản lý nợ',
      author: 'Phạm Thị D',
      date: '8 Tháng 11, 2025',
      readTime: '6 phút đọc',
      color: 'from-red-400 to-red-600',
      tags: ['nợ', 'tín dụng', 'quản lý tài chính']
    },
    {
      id: 5,
      title: 'Tạo Quỹ Khẩn Cấp: Bạn Cần Bao Nhiêu?',
      excerpt: 'Tầm quan trọng của quỹ khẩn cấp và cách xác định số tiền phù hợp cho hoàn cảnh của bạn.',
      content: `
        <h2>Quỹ khẩn cấp là gì?</h2>
        <p>Quỹ khẩn cấp là số tiền dự trữ để đối phó với các tình huống bất ngờ.</p>
        
        <h2>Cần bao nhiêu tiền?</h2>
        <p>Thông thường, bạn nên có quỹ khẩn cấp đủ chi trả 3-6 tháng chi phí sinh hoạt.</p>
        
        <h2>Cách xây dựng</h2>
        <p>Bắt đầu với mục tiêu nhỏ (1 triệu đồng) và tăng dần qua thời gian.</p>
      `,
      image: '🛡️',
      category: 'Tiết kiệm',
      author: 'Hoàng Văn E',
      date: '5 Tháng 11, 2025',
      readTime: '8 phút đọc',
      color: 'from-orange-400 to-orange-600',
      tags: ['quỹ khẩn cấp', 'tiết kiệm', 'an toàn tài chính']
    },
    {
      id: 6,
      title: 'Tài Chính Gia Đình: Mẹo Cho Các Cặp Vợ Chồng',
      excerpt: 'Làm thế nào để quản lý tài chính gia đình hiệu quả và tránh xung đột về tiền bạc.',
      content: `
        <h2>Giao tiếp về tài chính</h2>
        <p>Trò chuyện thường xuyên và cởi mở về tài chính là chìa khóa của một gia đình hạnh phúc.</p>
        
        <h2>Thiết lập mục tiêu chung</h2>
        <p>Cùng nhau đặt ra mục tiêu tài chính và làm việc cùng nhau để đạt được chúng.</p>
        
        <h2>Phân chia trách nhiệm</h2>
        <p>Xác định rõ ai chịu trách nhiệm về các khoản chi tiêu và tiết kiệm nào.</p>
      `,
      image: '👨‍👩‍👧‍👦',
      category: 'Gia đình',
      author: 'Vũ Thị F',
      date: '3 Tháng 11, 2025',
      readTime: '9 phút đọc',
      color: 'from-pink-400 to-pink-600',
      tags: ['gia đình', 'vợ chồng', 'quản lý tài chính']
    }
  ];

  const categories = ['Tất cả', 'Tiết kiệm', 'Ngân sách', 'Đầu tư', 'Quản lý nợ', 'Gia đình'];

  const filteredPosts = blogPosts.filter(post => {
    const matchCategory = selectedCategory === 'Tất cả' || post.category === selectedCategory;
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Single Post View
  if (id) {
    const post = blogPosts.find(p => p.id === parseInt(id));
    if (!post) {
      return <div>Không tìm thấy bài viết</div>;
    }

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
              
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/blog')} className="text-gray-600 hover:text-gray-900 transition">
                  <FaArrowLeft className="inline mr-2" />
                  Quay lại Blog
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Article Content */}
        <article className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-600 rounded-full text-sm font-semibold mb-6">
              {post.category}
            </span>

            {/* Title */}
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FaUser />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock />
                <span>{post.readTime}</span>
              </div>
              <span>{post.date}</span>
            </div>

            {/* Featured Image */}
            <div className={`w-full h-96 bg-gradient-to-br ${post.color} rounded-3xl flex items-center justify-center text-9xl mb-12 shadow-2xl`}>
              {post.image}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div dangerouslySetInnerHTML={{ __html: post.content }} className="
                [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-6
                [&_p]:text-lg [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-6
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
                [&_li]:text-lg [&_li]:text-gray-700 [&_li]:mb-2
              " />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map((tag, index) => (
                <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Share & Actions */}
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl mb-12">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                  <FaShareAlt />
                  Chia sẻ
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:border-emerald-500 transition">
                  <FaBookmark />
                  Lưu bài viết
                </button>
              </div>
            </div>

            {/* Related Posts */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Bài viết liên quan</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {blogPosts.filter(p => p.category === post.category && p.id !== post.id).slice(0, 3).map((relatedPost) => (
                  <div
                    key={relatedPost.id}
                    onClick={() => navigate(`/blog/${relatedPost.id}`)}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer group"
                  >
                    <div className={`h-32 bg-gradient-to-br ${relatedPost.color} flex items-center justify-center text-5xl group-hover:scale-110 transition`}>
                      {relatedPost.image}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition">
                        {relatedPost.title}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FaClock size={12} />
                        {relatedPost.readTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // Blog List View
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
              <button onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-gray-900 transition">Bảng giá</button>
              <button onClick={() => navigate('/blog')} className="text-emerald-600 font-semibold">Blog</button>
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
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Blog về{' '}
            <span className="text-emerald-500">Tài Chính</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Khám phá các mẹo, hướng dẫn và chiến lược để quản lý tài chính cá nhân hiệu quả hơn.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {selectedCategory === 'Tất cả' && !searchQuery && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div 
              onClick={() => navigate(`/blog/${blogPosts[0].id}`)}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <div className="grid md:grid-cols-2 gap-8 p-12">
                <div className="flex flex-col justify-center text-white">
                  <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-semibold mb-4 w-fit">
                    Bài viết nổi bật
                  </span>
                  <h2 className="text-4xl font-bold mb-4">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-emerald-50 mb-6 text-lg">
                    {blogPosts[0].excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-emerald-50 mb-6">
                    <span className="flex items-center gap-2">
                      <FaUser size={14} />
                      {blogPosts[0].author}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaClock size={14} />
                      {blogPosts[0].readTime}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition w-fit">
                    Đọc thêm
                    <FaArrowRight />
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-9xl animate-bounce-slow">{blogPosts[0].image}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {searchQuery ? `Kết quả tìm kiếm "${searchQuery}"` : 'Bài viết mới nhất'}
            </h2>
            <span className="text-gray-600">{filteredPosts.length} bài viết</span>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.id}`)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group cursor-pointer transform hover:-translate-y-2 duration-300"
                >
                  <div className={`h-48 bg-gradient-to-br ${post.color} flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500`}>
                    {post.image}
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-semibold mb-3">
                      {post.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                      <span className="flex items-center gap-2">
                        <FaUser size={12} />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-2">
                        <FaClock size={12} />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600">Không tìm thấy bài viết phù hợp</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">📧</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Đăng ký nhận bài viết mới
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Nhận các mẹo tài chính và bài viết mới nhất trực tiếp vào email của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-md"
            />
            <button className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
