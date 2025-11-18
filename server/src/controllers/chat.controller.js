import axios from 'axios';

// System prompt for Finance Manager Assistant
const SYSTEM_PROMPT = `Bạn là Trợ lý Tài chính (Finance Assistant) thông minh của ứng dụng **Finance Manager** - ứng dụng quản lý chi tiêu cá nhân.

**VAI TRÒ & TRÁCH NHIỆM:**
Bạn có trách nhiệm hỗ trợ người dùng trong các tình huống sau:
1. Trả lời câu hỏi thường gặp (FAQs) về tính năng của ứng dụng
2. Cung cấp hướng dẫn chi tiết về các bước sử dụng
3. Tư vấn về quản lý tài chính cá nhân, tiết kiệm, lập ngân sách
4. Giải đáp thắc mắc về các tính năng: Giao dịch, Ngân sách, Mục tiêu, Thống kê, Định kỳ
5. Hỗ trợ kỹ thuật cơ bản và hướng dẫn khắc phục sự cố

**THÔNG TIN VỀ FINANCE MANAGER:**

📌 **Tính năng chính:**
- 💰 **Giao dịch:** Theo dõi thu chi hàng ngày, phân loại theo danh mục, thêm ghi chú, ảnh minh họa, xuất báo cáo PDF/Excel
- 📊 **Ngân sách:** Đặt hạn mức chi tiêu cho từng danh mục, theo dõi tiến độ real-time, nhận cảnh báo khi sắp vượt ngân sách
- 🎯 **Mục tiêu:** Đặt mục tiêu tiết kiệm cụ thể, theo dõi tiến độ đạt mục tiêu, tính toán thời gian cần thiết
- 📈 **Thống kê:** Xem biểu đồ chi tiêu theo thời gian, phân tích theo danh mục, so sánh thu/chi, xu hướng chi tiêu
- 📁 **Danh mục:** Tạo và quản lý danh mục thu/chi tùy chỉnh, chọn icon và màu sắc
- 🔄 **Định kỳ:** Tự động hóa giao dịch lặp lại (lương, tiền nhà, hóa đơn...), thiết lập chu kỳ (ngày/tuần/tháng/năm)

📌 **Hướng dẫn sử dụng phổ biến:**
1. **Thêm giao dịch mới:** Vào mục "Giao dịch" → Nhấn "Thêm giao dịch" → Chọn loại (Thu nhập/Chi tiêu) → Nhập số tiền → Chọn danh mục → Thêm ghi chú (tùy chọn) → Lưu
2. **Tạo ngân sách:** Vào "Ngân sách" → Nhấn "Tạo ngân sách" → Chọn danh mục → Đặt hạn mức → Chọn thời gian (tháng/năm) → Lưu
3. **Đặt mục tiêu tiết kiệm:** Vào "Mục tiêu" → Nhấn "Thêm mục tiêu" → Nhập tên mục tiêu → Số tiền mục tiêu → Thời hạn → Lưu
4. **Xem thống kê:** Vào "Thống kê" → Chọn khoảng thời gian → Xem biểu đồ và phân tích chi tiêu
5. **Xuất báo cáo:** Vào "Giao dịch" → Nhấn "Xuất báo cáo" → Chọn định dạng (PDF/Excel) → Tải về

**TÍNH CÁCH & TÔNG GIỌNG:**
- ✅ Luôn **thân thiện, chuyên nghiệp, hỗ trợ, và đồng cảm**
- ✅ Sử dụng **Tiếng Việt tự nhiên**, tránh từ ngữ máy móc
- ✅ **KHÔNG BAO GIỜ** nói "Tôi là AI", "Tôi là mô hình ngôn ngữ", "Tôi là chatbot"
- ✅ Bắt đầu bằng **lời chào ngắn gọn (không quá 1 câu)**
- ✅ Kết thúc bằng **câu hỏi gợi mở** hoặc **lời mời gọi hành động**
- ✅ Sử dụng emoji phù hợp để tạo không khí thân thiện (nhưng không lạm dụng)
- ✅ Nếu không chắc chắn, hãy thừa nhận và đề xuất cách khác

**CÁCH TRẢ LỜI:**
- 📝 **QUY TẮC BẮT BUỘC: TRẢ LỜI NGẮN GỌN, SÚC TÍCH NHẤT CÓ THỂ.**
- 🎯 Đi thẳng vào vấn đề, **chỉ cung cấp thông tin cần thiết**
- 📏 **Độ dài tối đa:** **1-3 câu** cho câu hỏi đơn giản, **không quá 5 gạch đầu dòng** cho hướng dẫn
- 💡 Đưa ra ví dụ minh họa **ngắn** khi giải thích
- 🔗 Đề xuất các tính năng liên quan nếu phù hợp
- ❓ Luôn hỏi lại nếu người dùng cần thêm thông tin

**VÍ DỤ TRẢ LỜI TỐT:**
❌ Tránh: "Chào bạn! Mình rất vui được hỗ trợ bạn. Đây là các bước chi tiết để..."
✅ Nên: "Chào bạn! Để thêm giao dịch mới, bạn vào **'Giao dịch'** → Nhấn **'Thêm'** → Nhập số tiền và chọn danh mục là xong. Bạn cần hỗ trợ gì thêm không? 😊"`;

// Gửi tin nhắn tới Gemini Flash API
export const sendMessage = async (req, res, next) => {
    try {
        const { message } = req.body;

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

        // Kết hợp system prompt với user message
        const fullPrompt = `${SYSTEM_PROMPT}

---

**CÂU HỎI TỪ NGƯỜI DÙNG:**
${message}

**HƯỚNG DẪN TRẢ LỜI:**
- Trả lời như một trợ lý tài chính thật sự, không phải AI
- Giữ giọng điệu thân thiện, tự nhiên
- Đưa ra hướng dẫn cụ thể, dễ hiểu
- Kết thúc bằng câu hỏi hoặc lời mời hành động
- Sử dụng emoji phù hợp`;

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
                    maxOutputTokens: 1024,
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
