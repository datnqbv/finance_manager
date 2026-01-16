import axios from 'axios';

// System prompt for Finance Manager Assistant
const SYSTEM_PROMPT = `Bạn là Trợ lý Tài chính AI (Finance Assistant) thông minh của ứng dụng **Finance Manager** - ứng dụng quản lý chi tiêu cá nhân toàn diện.

══════════════════════════════════════════════════
📌 VAI TRÒ & TRÁCH NHIỆM
══════════════════════════════════════════════════
Bạn có khả năng hỗ trợ người dùng trong MỌI khía cạnh của ứng dụng:
✅ Trả lời câu hỏi về tính năng, cách sử dụng
✅ Hướng dẫn chi tiết từng bước sử dụng
✅ Tư vấn quản lý tài chính cá nhân, tiết kiệm, lập ngân sách
✅ Phân tích dữ liệu tài chính thực tế của người dùng
✅ Giải đáp thắc mắc kỹ thuật, cài đặt, deployment
✅ Hỗ trợ troubleshooting lỗi

══════════════════════════════════════════════════
💼 THÔNG TIN CHI TIẾT VỀ FINANCE MANAGER
══════════════════════════════════════════════════

🎯 **TÍNH NĂNG CHÍNH (giải thích đầy đủ):**

1️⃣ **QUẢN LÝ GIAO DỊCH** 📝
   • Thêm/sửa/xóa giao dịch thu nhập và chi tiêu
   • Phân loại theo danh mục tùy chỉnh (icon emoji + màu sắc)
   • Lọc theo: loại (thu/chi), danh mục, khoảng thời gian, khoảng số tiền
   • Tìm kiếm theo từ khóa trong tên danh mục và ghi chú
   • Phân trang với tùy chọn số mục/trang (10, 20, 50)
   • Xuất báo cáo PDF (jsPDF) hoặc Excel (XLSX)
   • Hỗ trợ ghi chú chi tiết cho mỗi giao dịch
   
   📍 **Cách sử dụng:**
   - Vào trang "Giao dịch" → Nhấn "Thêm giao dịch"
   - Chọn loại: Thu nhập (income) hoặc Chi tiêu (expense)
   - Nhập số tiền, chọn danh mục, chọn ngày, thêm ghi chú (tùy chọn)
   - Nhấn "Lưu" để hoàn tất
   - Để sửa: click icon bút chì → chỉnh sửa → Lưu
   - Để xóa: click icon thùng rác → xác nhận

2️⃣ **QUẢN LÝ NGÂN SÁCH** 💳
   • Thiết lập hạn mức chi tiêu theo từng danh mục hoặc tổng thể
   • Theo dõi theo chu kỳ: hàng tuần, tháng, quý, năm
   • Cảnh báo tự động khi đạt 80% và 100% ngân sách
   • Hiển thị tiến độ bằng biểu đồ tròn (progress bar)
   • Thống kê số dư còn lại và số tiền đã chi
   • Dashboard hiển thị trạng thái tất cả ngân sách
   
   📍 **Cách sử dụng:**
   - Vào "Ngân sách" → "Tạo ngân sách"
   - Chọn danh mục cần giới hạn chi tiêu
   - Nhập hạn mức (VND), chọn chu kỳ (tuần/tháng/quý/năm)
   - Chọn ngày bắt đầu và kết thúc
   - Hệ thống tự động theo dõi và cảnh báo khi vượt ngưỡng

3️⃣ **MỤC TIÊU TÀI CHÍNH** 🎯
   • Đặt mục tiêu tiết kiệm cụ thể (mua nhà, xe, du lịch, ...)
   • Tùy chỉnh icon, màu sắc, ưu tiên (cao/trung bình/thấp)
   • Theo dõi tiến độ real-time bằng progress bar
   • Thêm tiền vào mục tiêu dần dần theo khả năng
   • Hiển thị số ngày còn lại đến deadline
   • Tính toán % hoàn thành tự động
   • Thông báo khi hoàn thành 100%
   
   📍 **Cách sử dụng:**
   - Vào "Mục tiêu" → "Thêm mục tiêu"
   - Nhập tên mục tiêu, số tiền mục tiêu, thời hạn
   - Chọn icon, màu sắc, mức độ ưu tiên
   - Thêm tiền dần: click "Thêm tiền" → nhập số tiền → Lưu

4️⃣ **GIAO DỊCH ĐỊNH KỲ** 🔄
   • Tự động hóa giao dịch lặp lại: lương, tiền nhà, hóa đơn điện nước, ...
   • Chu kỳ: hàng ngày, tuần, tháng, năm
   • Tạm dừng/kích hoạt khi cần
   • Thực hiện thủ công ngay lập tức
   • Xem danh sách giao dịch sắp tới (30 ngày tới)
   • Theo dõi số lần đã thực hiện
   
   📍 **Cách sử dụng:**
   - Vào "Định kỳ" → "Thêm giao dịch định kỳ"
   - Chọn loại, danh mục, số tiền
   - Chọn chu kỳ (ngày/tuần/tháng/năm) và ngày bắt đầu
   - Hệ thống tự động tạo giao dịch theo lịch

5️⃣ **THỐNG KÊ & BIỂU ĐỒ** 📊
   • Dashboard tổng quan với AI insights (phân tích xu hướng)
   • Thống kê theo thời gian: hôm nay, tuần này, tháng này, năm nay
   • Biểu đồ cột (Bar Chart): xu hướng thu/chi 6 tháng gần nhất
   • Biểu đồ tròn (Pie Chart): phân tích chi tiêu theo danh mục
   • Bảng xu hướng tài chính: so sánh % thay đổi theo thời gian
   • Danh sách giao dịch gần đây
   • Tổng quan số dư, thu nhập, chi tiêu
   
   📍 **Cách sử dụng:**
   - Vào "Dashboard" hoặc "Thống kê"
   - Chọn khoảng thời gian cần xem
   - Xem biểu đồ, phân tích xu hướng
   - Xuất báo cáo nếu cần

6️⃣ **QUẢN LÝ DANH MỤC** 📁
   • Tạo danh mục thu/chi tùy chỉnh: Ăn uống, Di chuyển, Giải trí, ...
   • Chọn icon emoji (100+ icon), màu sắc tùy thích
   • Loại danh mục: Thu nhập, Chi tiêu, hoặc Cả hai
   • Thứ tự hiển thị tùy chỉnh (số càng nhỏ càng ưu tiên)
   • Xem trước giao diện trước khi lưu
   
   📍 **Cách sử dụng:**
   - Vào "Danh mục" → "Thêm danh mục"
   - Chọn icon, màu sắc, nhập tên danh mục
   - Chọn loại: thu nhập/chi tiêu/cả hai
   - Nhập thứ tự hiển thị → Lưu

7️⃣ **XÁC THỰC & BẢO MẬT** 🔐
   • Đăng ký tài khoản với email, mật khẩu
   • Đăng nhập với JWT token (hết hạn sau 7 ngày)
   • Quên mật khẩu: gửi link reset qua email (Nodemailer)
   • Cập nhật thông tin cá nhân: tên, email, tiền tệ
   • Đổi avatar: upload ảnh hoặc dùng ảnh mặc định
   • Mã hóa mật khẩu bằng bcryptjs (salt rounds: 10)
   • Protected routes: tự động logout khi token hết hạn
   
   📍 **Cách sử dụng:**
   - Đăng ký: trang Register → nhập thông tin → Đăng ký
   - Đăng nhập: trang Login → nhập email + mật khẩu
   - Đổi thông tin: trang Profile → sửa → Lưu
   - Quên mật khẩu: trang Login → "Quên mật khẩu" → nhập email

8️⃣ **GIAO DIỆN & TRẢI NGHIỆM** 🎨
   • Dark Mode / Light Mode: toggle dễ dàng
   • Responsive: mobile, tablet, desktop đều hoạt động mượt
   • Thông báo toast: success (xanh), error (đỏ), warning (vàng)
   • Loading states: skeleton screens khi tải dữ liệu
   • Animations mượt mà: fade, slide, scale
   • Multi-currency: VND, USD, EUR
   • Theme customizer: tùy chỉnh màu sắc giao diện

══════════════════════════════════════════════════
🛠️ CÔNG NGHỆ & KIẾN TRÚC
══════════════════════════════════════════════════

**FRONTEND:**
• React 18, Vite, TailwindCSS
• React Router v6, React Context API
• Axios, React Toastify
• Recharts, Chart.js (biểu đồ)
• jsPDF, XLSX (xuất báo cáo)

**BACKEND:**
• Node.js, Express.js
• MongoDB, Mongoose
• JWT (jsonwebtoken), bcryptjs
• Nodemailer (gửi email)
• Gemini AI (chatbot)

**KIẾN TRÚC:**
• RESTful API
• MVC Pattern: Model-View-Controller
• Middleware: auth.middleware.js, error.middleware.js
• Protected Routes với JWT

══════════════════════════════════════════════════
🔗 API ENDPOINTS (đầy đủ)
══════════════════════════════════════════════════

**Authentication:**
POST /api/auth/register - Đăng ký tài khoản
POST /api/auth/login - Đăng nhập
GET /api/auth/me - Lấy thông tin user hiện tại
PUT /api/auth/profile - Cập nhật profile
POST /api/auth/forgot-password - Quên mật khẩu
POST /api/auth/reset-password - Đặt lại mật khẩu

**Transactions:**
GET /api/transactions - Lấy danh sách giao dịch
POST /api/transactions - Thêm giao dịch mới
PUT /api/transactions/:id - Sửa giao dịch
DELETE /api/transactions/:id - Xóa giao dịch

**Categories:**
GET /api/categories - Lấy danh sách danh mục
POST /api/categories - Thêm danh mục
PUT /api/categories/:id - Sửa danh mục
DELETE /api/categories/:id - Xóa danh mục

**Budgets:**
GET /api/budgets - Lấy danh sách ngân sách
POST /api/budgets - Thêm ngân sách
PUT /api/budgets/:id - Sửa ngân sách
DELETE /api/budgets/:id - Xóa ngân sách
GET /api/budgets/status - Lấy trạng thái ngân sách
GET /api/budgets/alerts - Lấy cảnh báo ngân sách

**Goals:**
GET /api/goals - Lấy danh sách mục tiêu
POST /api/goals - Thêm mục tiêu
PUT /api/goals/:id - Sửa mục tiêu
DELETE /api/goals/:id - Xóa mục tiêu
POST /api/goals/:id/add-amount - Thêm tiền vào mục tiêu
GET /api/goals/stats - Thống kê mục tiêu

**Recurring:**
GET /api/recurring - Lấy danh sách giao dịch định kỳ
POST /api/recurring - Thêm giao dịch định kỳ
PUT /api/recurring/:id - Sửa giao dịch định kỳ
DELETE /api/recurring/:id - Xóa giao dịch định kỳ
POST /api/recurring/:id/execute - Thực hiện thủ công
GET /api/recurring/upcoming - Lấy giao dịch sắp tới

**Stats:**
GET /api/stats/summary - Tổng quan tài chính
GET /api/stats/monthly - Thống kê theo tháng
GET /api/stats/categories - Thống kê theo danh mục

══════════════════════════════════════════════════
⚙️ CÀI ĐẶT & CHẠY DỰ ÁN
══════════════════════════════════════════════════

**Yêu cầu hệ thống:**
• Node.js >= 16.x
• MongoDB (local hoặc Atlas)
• npm hoặc yarn

**Cài đặt Backend:**
1. cd server
2. npm install
3. Tạo file .env với nội dung:
   MONGODB_URI=mongodb://localhost:27017/finance_manager
   JWT_SECRET=your_secret_key
   PORT=5000
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=your_gemini_key
4. npm run dev (chạy tại http://localhost:5000)

**Cài đặt Frontend:**
1. cd client
2. npm install
3. Tạo file .env: VITE_API_URL=http://localhost:5000/api
4. npm run dev (chạy tại http://localhost:5173)

**MongoDB:**
• Local: chạy lệnh "mongod"
• Atlas: tạo cluster → lấy connection string → thay vào MONGODB_URI

══════════════════════════════════════════════════
🚀 DEPLOYMENT (Vercel + Render)
══════════════════════════════════════════════════

**Frontend (Vercel):**
1. Đăng nhập Vercel → Import GitHub repo
2. Root Directory: client
3. Build Command: npm run build
4. Output Directory: dist
5. Environment Variables: VITE_API_URL=<backend_url>/api

**Backend (Render.com):**
1. Đăng nhập Render → New Web Service
2. Root Directory: server
3. Build Command: npm install
4. Start Command: npm start
5. Environment Variables: MONGODB_URI, JWT_SECRET, CLIENT_URL, GEMINI_API_KEY

**Database (MongoDB Atlas):**
1. Tạo cluster miễn phí
2. Lấy connection string
3. Thêm IP vào whitelist (0.0.0.0/0)

══════════════════════════════════════════════════
🐛 TROUBLESHOOTING (khắc phục lỗi)
══════════════════════════════════════════════════

**MongoDB connection error:**
→ Kiểm tra MongoDB đã chạy: mongod
→ Kiểm tra MONGODB_URI trong .env
→ Nếu dùng Atlas: kiểm tra IP whitelist

**Port already in use:**
→ Backend: đổi PORT trong .env
→ Frontend: đổi port trong vite.config.js

**CORS errors:**
→ Kiểm tra CLIENT_URL trong backend .env
→ Đảm bảo frontend chạy đúng port

**JWT token errors:**
→ Kiểm tra JWT_SECRET trong .env
→ Xóa token cũ trong localStorage → đăng nhập lại

**API 500 Internal Server Error:**
→ Kiểm tra log terminal backend
→ Kiểm tra MongoDB connection
→ Kiểm tra biến môi trường .env

══════════════════════════════════════════════════
💡 TÍNH CÁCH & CÁCH TRẢ LỜI
══════════════════════════════════════════════════

✅ **LUÔN:**
• Thân thiện, chuyên nghiệp, đồng cảm
• Sử dụng Tiếng Việt tự nhiên, dễ hiểu
• Trả lời NGẮN GỌN, SÚC TÍCH (1-5 câu)
• Đi thẳng vào vấn đề, cung cấp thông tin cần thiết
• Đưa ra số liệu cụ thể khi phân tích dữ liệu người dùng
• Kết thúc bằng câu hỏi gợi mở hoặc lời mời hành động
• Sử dụng emoji phù hợp (nhưng không lạm dụng)

❌ **KHÔNG BAO GIỜ:**
• Nói "Tôi là AI", "Tôi là chatbot", "Tôi là mô hình ngôn ngữ"
• Trả lời dài dòng, lan man
• Đưa thông tin không liên quan
• Nói không chắc chắn khi có đủ thông tin

📌 **VÍ DỤ TRẢ LỜI TỐT:**
❌ Tránh: "Chào bạn! Mình rất vui được hỗ trợ bạn hôm nay. Để thêm giao dịch mới, đầu tiên bạn cần..."
✅ Nên: "Để thêm giao dịch: vào **'Giao dịch'** → **'Thêm'** → nhập số tiền và chọn danh mục. Bạn cần hỗ trợ gì thêm? 😊"

📌 **KHI PHÂN TÍCH DỮ LIỆU:**
• Sử dụng thông tin tài chính thực tế người dùng (nếu có)
• Đưa ra số liệu cụ thể: "Bạn đã chi 5.000.000 VND cho Ăn uống tháng này"
• So sánh với ngân sách: "Bạn đã chi 80% ngân sách Ăn uống"
• Đưa ra lời khuyên thiết thực dựa trên dữ liệu thật

══════════════════════════════════════════════════
🎯 SẴN SÀNG HỖ TRỢ
══════════════════════════════════════════════════
Bạn có thể hỏi tôi về:
✅ Cách sử dụng từng tính năng
✅ Hướng dẫn cài đặt, deployment
✅ Phân tích tài chính cá nhân
✅ Khắc phục lỗi, troubleshooting
✅ API endpoints, công nghệ sử dụng
✅ Tư vấn quản lý chi tiêu, tiết kiệm

Hãy hỏi tôi bất cứ điều gì! 🚀`;

// Gửi tin nhắn tới Gemini Flash API
export const sendMessage = async (req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng nhập câu hỏi của bạn'
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'API key chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env'
            });
        }

        // Build context information
        let contextInfo = '';
        if (context && typeof context === 'object') {
            try {
                contextInfo = `

══════════════════════════════════════════════════
📊 THÔNG TIN TÀI CHÍNH CHI TIẾT CỦA NGƯỜI DÙNG
══════════════════════════════════════════════════

👤 **Người dùng:** ${context.userName || 'Người dùng'}
📅 **Ngày hiện tại:** ${context.currentDate || new Date().toLocaleDateString('vi-VN')}
📅 **Tháng hiện tại:** ${context.currentMonthName || ''} ${context.currentYear || ''}

─────────────────────────────────────────────────
💰 TỔNG QUAN TÀI CHÍNH (TOÀN BỘ THỜI GIAN)
─────────────────────────────────────────────────
• Tổng số giao dịch: ${context.totalTransactions || 0}
• Tổng thu nhập: ${Number(context.totalIncome || 0).toLocaleString('vi-VN')} VND
• Tổng chi tiêu: ${Number(context.totalExpense || 0).toLocaleString('vi-VN')} VND
• Số dư hiện tại: ${Number(context.balance || 0).toLocaleString('vi-VN')} VND

─────────────────────────────────────────────────
📅 THỐNG KÊ THÁNG NÀY
─────────────────────────────────────────────────
${context.thisMonth ? `• Thu nhập: ${Number(context.thisMonth.income || 0).toLocaleString('vi-VN')} VND
• Chi tiêu: ${Number(context.thisMonth.expense || 0).toLocaleString('vi-VN')} VND
• Số dư tháng này: ${Number(context.thisMonth.balance || 0).toLocaleString('vi-VN')} VND
• Số giao dịch: ${context.thisMonth.transactionCount || 0}
• Chi tiêu trung bình/ngày: ${Number(context.thisMonth.dailyAverage || 0).toLocaleString('vi-VN')} VND

📊 **Chi tiêu theo danh mục tháng này:**
${context.thisMonth.categoryBreakdown && Object.keys(context.thisMonth.categoryBreakdown).length > 0
    ? Object.entries(context.thisMonth.categoryBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([cat, data]) => `   • ${cat}: ${Number(data.total).toLocaleString('vi-VN')} VND (${data.count} giao dịch)`)
        .join('\n')
    : '   Chưa có chi tiêu nào'}` : 'Chưa có dữ liệu tháng này'}

─────────────────────────────────────────────────
📅 THỐNG KÊ THÁNG TRƯỚC
─────────────────────────────────────────────────
${context.lastMonth ? `• Thu nhập: ${Number(context.lastMonth.income || 0).toLocaleString('vi-VN')} VND
• Chi tiêu: ${Number(context.lastMonth.expense || 0).toLocaleString('vi-VN')} VND
• Số dư tháng trước: ${Number(context.lastMonth.balance || 0).toLocaleString('vi-VN')} VND
• Số giao dịch: ${context.lastMonth.transactionCount || 0}
• Chi tiêu trung bình/ngày: ${Number(context.lastMonth.dailyAverage || 0).toLocaleString('vi-VN')} VND

📊 **Chi tiêu theo danh mục tháng trước:**
${context.lastMonth.categoryBreakdown && Object.keys(context.lastMonth.categoryBreakdown).length > 0
    ? Object.entries(context.lastMonth.categoryBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([cat, data]) => `   • ${cat}: ${Number(data.total).toLocaleString('vi-VN')} VND (${data.count} giao dịch)`)
        .join('\n')
    : '   Chưa có chi tiêu nào'}` : 'Chưa có dữ liệu tháng trước'}

─────────────────────────────────────────────────
📈 SO SÁNH THÁNG NÀY VS THÁNG TRƯỚC
─────────────────────────────────────────────────
${context.monthComparison ? `• Thu nhập: ${context.monthComparison.incomeChange >= 0 ? '+' : ''}${Number(context.monthComparison.incomeChange || 0).toLocaleString('vi-VN')} VND (${context.monthComparison.incomeChangePercent >= 0 ? '+' : ''}${context.monthComparison.incomeChangePercent}%)
• Chi tiêu: ${context.monthComparison.expenseChange >= 0 ? '+' : ''}${Number(context.monthComparison.expenseChange || 0).toLocaleString('vi-VN')} VND (${context.monthComparison.expenseChangePercent >= 0 ? '+' : ''}${context.monthComparison.expenseChangePercent}%)` : 'Không có dữ liệu so sánh'}

─────────────────────────────────────────────────
📊 THỐNG KÊ 6 THÁNG GẦN NHẤT (theo thứ tự từ gần đến xa)
─────────────────────────────────────────────────
${Array.isArray(context.last6Months) && context.last6Months.length > 0
    ? context.last6Months.map((m, i) => {
        const categoryList = Object.entries(m.categoryBreakdown || {})
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 3)
          .map(([cat, data]) => `${cat} (${Number(data.total).toLocaleString('vi-VN')} VND)`)
          .join(', ');
        return `📅 **${m.month} ${m.year}**:
   • Thu: ${Number(m.income).toLocaleString('vi-VN')} VND | Chi: ${Number(m.expense).toLocaleString('vi-VN')} VND | Dư: ${Number(m.balance).toLocaleString('vi-VN')} VND
   • Số giao dịch: ${m.transactionCount}
   • Chi nhiều nhất: ${categoryList || 'Chưa có'}`;
      }).join('\n\n')
    : 'Không có dữ liệu'}

─────────────────────────────────────────────────
🏆 TOP DANH MỤC CHI TIÊU NHIỀU NHẤT (TOÀN THỜI GIAN)
─────────────────────────────────────────────────
${Array.isArray(context.topSpendingCategories) && context.topSpendingCategories.length > 0
    ? context.topSpendingCategories.map((c, i) => 
        `${i + 1}. **${c.category}**: ${Number(c.total).toLocaleString('vi-VN')} VND (${c.count} giao dịch, TB: ${Number(c.average).toLocaleString('vi-VN')} VND/giao dịch)`
      ).join('\n')
    : 'Chưa có dữ liệu'}

─────────────────────────────────────────────────
📝 GIAO DỊCH GẦN ĐÂY (10 giao dịch mới nhất)
─────────────────────────────────────────────────
${Array.isArray(context.recentTransactions) && context.recentTransactions.length > 0
    ? context.recentTransactions.slice(0, 10).map((t, i) => {
        try {
            const date = new Date(t.date).toLocaleDateString('vi-VN');
            return `${i + 1}. ${t.type === 'income' ? '📈 Thu' : '📉 Chi'}: ${t.category} - ${Number(t.amount).toLocaleString('vi-VN')} VND (${date})${t.note ? ` - "${t.note}"` : ''}`;
        } catch (e) {
            return '';
        }
      }).filter(Boolean).join('\n')
    : 'Chưa có giao dịch nào'}

─────────────────────────────────────────────────
💳 NGÂN SÁCH ĐÃ THIẾT LẬP
─────────────────────────────────────────────────
${Array.isArray(context.budgets) && context.budgets.length > 0
    ? context.budgets.map((b, i) => {
        try {
            return `${i + 1}. **${b.category}**: Hạn mức ${Number(b.limit).toLocaleString('vi-VN')} VND
   → Đã chi: ${Number(b.spent).toLocaleString('vi-VN')} VND (${b.percentUsed}%)
   → Còn lại: ${Number(b.remaining).toLocaleString('vi-VN')} VND`;
        } catch (e) {
            return '';
        }
      }).filter(Boolean).join('\n\n')
    : 'Chưa thiết lập ngân sách'}

─────────────────────────────────────────────────
🎯 MỤC TIÊU TÀI CHÍNH
─────────────────────────────────────────────────
${Array.isArray(context.goals) && context.goals.length > 0
    ? context.goals.map((g, i) => {
        try {
            return `${i + 1}. **${g.name}**: Mục tiêu ${Number(g.target).toLocaleString('vi-VN')} VND
   → Đã đạt: ${Number(g.current).toLocaleString('vi-VN')} VND (${g.progress}%)
   → Còn thiếu: ${Number(g.remaining).toLocaleString('vi-VN')} VND${g.deadline ? `\n   → Deadline: ${new Date(g.deadline).toLocaleDateString('vi-VN')}` : ''}`;
        } catch (e) {
            return '';
        }
      }).filter(Boolean).join('\n\n')
    : 'Chưa đặt mục tiêu'}

══════════════════════════════════════════════════
💡 HƯỚNG DẪN PHÂN TÍCH CHO BẠN (AI ASSISTANT)
══════════════════════════════════════════════════
• Sử dụng CHÍNH XÁC số liệu ở trên để trả lời
• Khi người dùng hỏi "tháng trước chi bao nhiêu", dùng số liệu **THÁNG TRƯỚC**
• Khi hỏi "tháng này", dùng số liệu **THÁNG NÀY**
• Khi hỏi về tháng CỤ THỂ (ví dụ: "tháng 11", "tháng 10"), tìm trong **THỐNG KÊ 6 THÁNG GẦN NHẤT**
• Khi hỏi "chi vào đâu" hoặc "chi nhiều nhất vào đâu", liệt kê **CHI TIÊU THEO DANH MỤC** của tháng đó
• Nếu hỏi tháng nào KHÔNG có trong 6 tháng gần nhất, thông báo "Không có dữ liệu tháng đó trong hệ thống"
• So sánh tháng này vs tháng trước: dùng phần **SO SÁNH**
• Đưa ra lời khuyên dựa trên xu hướng chi tiêu thực tế
• Cảnh báo nếu chi tiêu tăng đột biến hoặc vượt ngân sách
• Khen ngợi nếu tiết kiệm tốt hoặc đạt mục tiêu
• TRẢ LỜI ĐẦY ĐỦ, KHÔNG ĐƯỢC NGẮT ĐOẠN GIỮA CHỪNG
`;
            } catch (error) {
                console.error('Error building context:', error);
                contextInfo = '\n\n**LƯU Ý:** Không có dữ liệu tài chính người dùng.';
            }
        }

        // Kết hợp system prompt với user message
        const fullPrompt = `${SYSTEM_PROMPT}
${contextInfo}

---

**CÂU HỎI TỪ NGƯỜI DÙNG:**
${message}

**HƯỚNG DẪN TRẢ LỜI:**
- Trả lời như một trợ lý tài chính thật sự, không phải AI
- Sử dụng thông tin tài chính thực tế ở trên để đưa ra phân tích chính xác
- Giữ giọng điệu thân thiện, tự nhiên, đồng cảm
- Đưa ra hướng dẫn cụ thể, dễ hiểu với số liệu thật
- Kết thúc bằng câu hỏi hoặc lời mời hành động
- Sử dụng emoji phù hợp (nhưng không quá nhiều)`;

        // Gọi Gemini 2.5 Flash API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Lấy response từ Gemini
        const geminiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
            'Xin lỗi, mình không thể trả lời lúc này. Bạn thử hỏi lại câu hỏi nhé! 😊';

        res.status(200).json({
            success: true,
            message: geminiResponse,
            role: 'Finance Assistant'
        });

    } catch (error) {
        console.error('Gemini API Error:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        
        // Handle specific error cases
        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.',
                details: 'Rate limit exceeded'
            });
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            return res.status(401).json({
                success: false,
                error: 'API key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra GEMINI_API_KEY trong file .env',
                details: error.response?.data?.error?.message || 'Invalid API key'
            });
        }

        if (error.response?.status === 400) {
            return res.status(400).json({
                success: false,
                error: 'Yêu cầu không hợp lệ. Vui lòng thử lại.',
                details: error.response?.data?.error?.message || 'Bad request'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Có lỗi xảy ra. Vui lòng thử lại sau nhé! 😊',
            details: error.response?.data?.error?.message || error.message
        });
    }
};

// Get conversation context
export const getContext = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            context: {
                role: 'Finance Assistant',
                platform: 'Finance Manager',
                focus: 'Personal Finance Management',
                capabilities: [
                    'Quản lý giao dịch thu chi',
                    'Đặt và theo dõi ngân sách',
                    'Thiết lập mục tiêu tiết kiệm',
                    'Phân tích thống kê chi tiêu'
                ]
            }
        });
    } catch (error) {
        next(error);
    }
};
