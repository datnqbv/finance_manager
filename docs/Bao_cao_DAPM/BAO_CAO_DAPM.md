# BÁO CÁO THIẾT KẾ VÀ PHÂN TÍCH HỆ THỐNG
## Đề tài: Ứng dụng Web Quản Lý Chi Tiêu Cá Nhân

**Sinh viên thực hiện:** ...  
**Lớp:** ...  
**Giảng viên hướng dẫn:** ...  
**Thời gian thực hiện:** ...

---


# Lời mở đầu

Quản lý tài chính cá nhân đã trở thành một nhu cầu thiết yếu trong cuộc sống hiện đại. Mỗi ngày, chúng ta thực hiện hàng chục giao dịch tài chính—mua sắm, chuyển khoản, thanh toán hóa đơn—nhưng thường không có cơ sở để biết rõ tiền đã đi đâu và còn lại bao nhiêu. Nhiều người vẫn ghi chép tay trên giấy, dùng file bảng tính hoặc các ứng dụng đơn lẻ mà không có sự liên kết giữa giao dịch, ngân sách, mục tiêu tiết kiệm và khoản nợ. Các công cụ này không cung cấp cái nhìn tổng thể về dòng tiền, không hỗ trợ phân tích xu hướng chi tiêu, và thiếu tính bảo mật cũng như tính năng backup dữ liệu. Vì vậy, nhu cầu xây dựng một hệ thống thông tin quản lý chi tiêu cá nhân tích hợp—có khả năng số hóa dữ liệu, chuẩn hóa quy trình, hỗ trợ ra quyết định dựa trên dữ liệu, và bảo vệ thông tin người dùng—đã trở nên cấp thiết.

Đề tài này trình bày quá trình phân tích, thiết kế và triển khai một ứng dụng web quản lý chi tiêu cá nhân—từ việc xác định yêu cầu người dùng, thiết kế kiến trúc kỹ thuật phù hợp, cho đến lập kế hoạch phát triển, quản lý rủi ro, ước lượng chi phí, và xây dựng kế hoạch kiểm thử. Nội dung báo cáo bao gồm ba chương chính:

**Chương 1: Giới thiệu bài toán** — Trình bày nhu cầu thực tiễn, bài toán đặt ra, mục tiêu của đề tài, phạm vi công việc, ý nghĩa học thuật và kỹ thuật, cũng như cơ sở lý thuyết nền tảng cho việc xây dựng hệ thống.

**Chương 2: Phân tích và thiết kế hệ thống** — Trình bày chi tiết quá trình phân tích yêu cầu chức năng và phi chức năng, thiết kế kiến trúc hệ thống, thiết kế dữ liệu, khảo sát và xác lập dự án, xây dựng kế hoạch chi tiết với ước lượng thời gian, phân tích và quản lý rủi ro, ước lượng chi phí, phân tích hướng đối tượng cho hai chức năng chủ lực (quản lý giao dịch và quản lý ngân sách), cũng như lập kế hoạch kiểm thử và chiến lược bảo trì.

**Chương 3: Xây dựng, triển khai và tài liệu tham khảo** — Trình bày quá trình xây dựng hệ thống từ khâu chuẩn bị môi trường phát triển, triển khai backend và frontend, đến triển khai trên production, kèm quy trình kiểm thử, bảo mật, giám sát và bảo trì. Nội dung bao gồm: chuẩn bị công cụ và môi trường (Node.js, MongoDB, Git), triển khai backend với cấu hình biến môi trường, triển khai frontend và kết nối API, các loại kiểm thử trước triển khai (unit, integration, E2E, security), triển khai trên production với Nginx/SSL, và chiến lược giám sát, backup, bảo trì liên tục.

Báo cáo này được viết với mục đích cung cấp nền tảng lý thuyết vững chắc và hướng dẫn thực tiễn cho sinh viên, giảng viên, và nhà phát triển muốn hiểu sâu hơn về các quyết định kỹ thuật, cách ước lượng và quản lý dự án phần mềm, cũng như các biện pháp đảm bảo chất lượng khi triển khai một hệ thống quản lý tài chính cá nhân.

---

## Mục lục

1. [Chương 1. Giới thiệu bài toán](#chương-1-giới-thiệu-bài-toán)
2. [Chương 2. Triển khai thực hiện](#chương-2-triển-khai-thực-hiện)
   - [2.1. Phân tích và thiết kế hệ thống](#21-phân-tích-và-thiết-kế-hệ-thống)
   - [2.2. Khảo sát, xác lập dự án](#22-khảo-sát-xác-lập-dự-án)
   - [2.3. Xây dựng kế hoạch dự án](#23-xây-dựng-kế-hoạch-dự-án)
   - [2.4. Ước lượng rủi ro](#24-ước-lượng-rủi-ro)
   - [2.5. Ước lượng chi phí](#25-ước-lượng-chi-phí)
   - [2.6. Phân tích và thiết kế hệ thống theo hướng đối tượng cho 1 đến 2 chức năng chính](#26-phân-tích-và-thiết-kế-hệ-thống-theo-hướng-đối-tượng-cho-1-đến-2-chức-năng-chính)
   - [2.7. Tài liệu kiểm thử và bảo trì](#27-tài-liệu-kiểm-thử-và-bảo-trì)
3. [Chương 3. Xây dựng, triển khai và tài liệu tham khảo](#chương-3-xây-dựng-triển-khai-và-tài-liệu-tham-khảo)
   - [3.1. Chuẩn bị môi trường](#31-chuẩn-bị-môi-trường)
   - [3.2. Triển khai thành phần backend](#32-triển-khai-thành-phần-backend)
   - [3.3. Triển khai thành phần frontend](#33-triển-khai-thành-phần-frontend)
   - [3.4. Quy trình kiểm thử trước triển khai](#34-quy-trình-kiểm-thử-trước-triển-khai)
   - [3.5. Triển khai lên môi trường production](#35-triển-khai-lên-môi-trường-production)
   - [3.6. Giám sát, bảo trì và cải tiến](#36-giám-sát-bảo-trì-và-cải-tiến)

---

# CHƯƠNG 1: TỔNG QUAN BÀI TOÁN VÀ LÝ LUẬN NỀN TẢNG

Chương này trình bày nhu cầu, bài toán, mục tiêu, phạm vi, ý nghĩa và cơ sở lý thuyết của hệ thống quản lý chi tiêu cá nhân.

## 1.1. Nhu cầu thực tiễn của bài toán

Trong bối cảnh thanh toán điện tử và mua sắm trực tuyến ngày càng phổ biến, việc quản lý tài chính cá nhân không còn dừng ở thói quen ghi chép thủ công. Người dùng thường thực hiện nhiều giao dịch trong ngày với các mục đích khác nhau như ăn uống, đi lại, học tập, giải trí, thanh toán hóa đơn, tiết kiệm hoặc trả nợ. Nếu không có một công cụ theo dõi tập trung, người dùng rất dễ rơi vào tình trạng:

- Không biết chính xác tiền đã đi đâu và còn lại bao nhiêu.
- Khó phân biệt giữa chi tiêu thiết yếu và chi tiêu phát sinh.
- Không có cơ sở để đánh giá mức độ vượt ngân sách theo từng danh mục.
- Thiếu công cụ hỗ trợ lập kế hoạch tài chính dài hạn như mục tiêu tiết kiệm.
- Không dễ dàng tổng hợp dữ liệu để phân tích thói quen chi tiêu.

Vì vậy, một hệ thống quản lý chi tiêu cá nhân là cần thiết nhằm hỗ trợ người dùng ghi nhận giao dịch, theo dõi biến động dòng tiền, đặt ngân sách, quản lý khoản nợ và đưa ra quyết định dựa trên dữ liệu.

## 1.2. Đặt vấn đề

Bài toán đặt ra là xây dựng một ứng dụng web cho phép người dùng quản lý toàn bộ hoạt động tài chính cá nhân trong một hệ thống thống nhất. Ứng dụng không chỉ dừng ở việc nhập và xem dữ liệu, mà cần cung cấp một môi trường có khả năng:

- Lưu trữ và phân loại giao dịch theo thời gian.
- Theo dõi ngân sách theo danh mục và toàn hệ thống.
- Hỗ trợ mục tiêu tiết kiệm, khoản nợ và các chỉ số tổng quan.
- Trực quan hóa dữ liệu bằng biểu đồ và dashboard.
- Đảm bảo an toàn xác thực và quyền truy cập.
- Có khả năng mở rộng, kiểm thử và bảo trì.

Từ đó, đề tài không chỉ là một ứng dụng ghi chép thu chi đơn thuần mà là một hệ thống quản lý tài chính cá nhân có định hướng phân tích và hỗ trợ ra quyết định.

## 1.3. Mục tiêu của đề tài

Mục tiêu của đề tài là xây dựng một ứng dụng web full-stack phục vụ quản lý chi tiêu cá nhân với các mục tiêu cụ thể sau:

- Tổ chức dữ liệu tài chính theo mô hình rõ ràng, dễ mở rộng.
- Hỗ trợ người dùng nhập, sửa, xóa, tìm kiếm và lọc giao dịch.
- Cung cấp công cụ quản lý danh mục, ngân sách, mục tiêu và khoản nợ.
- Hiển thị thống kê tài chính bằng dashboard và biểu đồ.
- Bảo đảm cơ chế đăng nhập an toàn, phân quyền và bảo vệ dữ liệu.
- Hỗ trợ kiểm thử, bảo trì và phát triển tiếp trong tương lai.

## 1.4. Phạm vi của đề tài

Đề tài tập trung vào phạm vi sau:

| Nội dung | Phạm vi áp dụng | Ghi chú |
| --- | --- | --- |
| Nền tảng | Ứng dụng web | Truy cập bằng trình duyệt |
| Người dùng | Cá nhân, quản trị viên | Phân quyền theo vai trò |
| Dữ liệu | Thu/chi, ngân sách, mục tiêu, nợ | Lưu theo từng tài khoản |
| Tính năng | Quản lý, thống kê, tìm kiếm, nhập/xuất | Tập trung vào nghiệp vụ cốt lõi |
| Ngoài phạm vi | Kết nối ngân hàng thực, đồng bộ thời gian thực phức tạp | Có thể mở rộng sau |

- Nền tảng triển khai: ứng dụng web.
- Đối tượng sử dụng: người dùng cá nhân và tài khoản quản trị.
- Chức năng chính:
  - Đăng ký, đăng nhập, quên mật khẩu.
  - Quản lý giao dịch thu/chi.
  - Quản lý danh mục chi tiêu.
  - Quản lý ngân sách.
  - Quản lý mục tiêu tiết kiệm.
  - Quản lý khoản nợ.
  - Thống kê, tìm kiếm, nhập/xuất dữ liệu.
- Phạm vi dữ liệu: dữ liệu tài chính cá nhân của từng tài khoản.
- Ngoài phạm vi:
  - Kết nối trực tiếp với ngân hàng thực.
  - Tự động hóa hoàn toàn giao dịch từ nguồn ngoài.
  - Đồng bộ đa thiết bị theo thời gian thực phức tạp.

## 1.5. Ý nghĩa của đề tài

Về mặt thực tiễn, hệ thống giúp người dùng hình thành thói quen quản lý tài chính có kỷ luật hơn. Về mặt học thuật, đề tài là một bài toán tổng hợp, kết hợp nhiều nội dung đã học như phân tích yêu cầu, thiết kế hệ thống, lập trình web, thiết kế cơ sở dữ liệu, bảo mật, kiểm thử và triển khai.

Về mặt kỹ thuật, dự án thể hiện các năng lực quan trọng:

- Tách biệt frontend và backend.
- Thiết kế REST API.
- Quản lý trạng thái ứng dụng.
- Bảo mật bằng JWT và refresh token.
- Kiểm thử tự động ở cả client và server.
- Chuẩn hóa quy trình phát triển phần mềm.

## 1.6. Cơ sở lý thuyết nền tảng

### 1.6.1. Quản lý tài chính cá nhân và ngân sách

Quản lý tài chính cá nhân là quá trình lập kế hoạch, kiểm soát và tối ưu hóa nguồn tài chính để đạt mục tiêu. Ngân sách (budget) là công cụ cốt lõi, cho phép cá nhân:
- Lập kế hoạch chi tiêu dựa trên thu nhập dự kiến.
- Phân bổ tiền cho các mục đích khác nhau (thiết yếu, tiết kiệm, giải trí).
- Kiểm soát chi tiêu không vượt quá khả năng.

### 1.6.2. Phân loại chi tiêu

Chi tiêu được phân thành các danh mục (category) để dễ theo dõi:
- **Chi thiết yếu**: ăn uống, nhà ở, giao thông, y tế.
- **Chi phát sinh**: giải trí, mua sắm, du lịch.
- **Chi đầu tư**: học tập, bảo hiểm, tiết kiệm, trả nợ.

Phân loại rõ ràng giúp nhận diện thói quen chi tiêu, từ đó điều chỉnh ngân sách hợp lý.

### 1.6.3. Kế hoạch tài chính

Kế hoạch tài chính bao gồm:
- **Mục tiêu ngắn hạn**: tiết kiệm cho khủng hoảng, quỹ dự phòng.
- **Mục tiêu dài hạn**: mua nhà, mua xe, nghỉ hưu.
- **Quản lý nợ**: trả nợ định kỳ, tránh nợ cao lãi.

### 1.6.4. Hệ thống Thông tin Quản lý (MIS)

MIS áp dụng trong tài chính cá nhân:
- **Thu thập dữ liệu**: ghi chép giao dịch từ các nguồn khác nhau.
- **Xử lý dữ liệu**: tính toán, phân loại, tổng hợp theo danh mục, thời kỳ.
- **Trực quan hóa**: biểu đồ, dashboard, báo cáo.
- **Hỗ trợ quyết định**: phân tích xu hướng, dự báo, so sánh với ngân sách.

Một hệ thống MIS hiệu quả giúp người dùng quản lý tài chính dựa trên dữ liệu thực tế thay vì ước đoán, từ đó ra quyết định tài chính sáng suốt hơn.

### 1.6.5. Kiến trúc và công nghệ

Hệ thống được xây dựng theo kiến trúc client-server:
- **Frontend** (React, SPA): giao diện người dùng, điều hướng mượt mà.
- **Backend** (Node.js, Express, MVC): xử lý logic, API REST.
- **Database** (MongoDB): lưu trữ dữ liệu tài chính.
- **Bảo mật** (JWT): xác thực người dùng, bảo vệ dữ liệu cá nhân.

Kiến trúc này cho phép phát triển song song, mở rộng độc lập, và đảm bảo bảo mật dữ liệu tài chính nhạy cảm.

---

# CHƯƠNG 2. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

Chương này tập trung vào quá trình phân tích chi tiết, thiết kế kỹ thuật, lập kế hoạch và quản lý rủi ro cho dự án xây dựng ứng dụng quản lý chi tiêu. Đây là giai đoạn quan trọng để chuyển từ bài toán (chương 1) sang khả năng triển khai thực tế, bao gồm việc xác định các yêu cầu cụ thể, thiết kế kiến trúc phù hợp, ước lượng nguồn lực và công nghệ cần dùng.

Chương 2 được chia thành bảy phần chính:

- **2.1. Phân tích và thiết kế hệ thống**: phân tích yêu cầu chức năng (7 nhóm chính) và phi chức năng (SLA, SLO, observability), mô tả kiến trúc hệ thống, lựa chọn công nghệ, và thiết kế dữ liệu ở mức khái niệm.
- **2.2. Khảo sát, xác lập dự án**: khảo sát nhu cầu người dùng hiện tại, xác định đối tượng sử dụng, thiết lập mục tiêu và tiêu chí thành công của dự án.
- **2.3. Xây dựng kế hoạch dự án**: phân tách công việc, ước lượng thời gian bằng phương pháp PERT, xây dựng timeline chi tiết (8 tuần), và xác định các deliverable theo từng giai đoạn.
- **2.4. Ước lượng rủi ro**: nhận diện các rủi ro kỹ thuật, kinh doanh, và lịch biểu; đánh giá mức độ tác động; xây dựng kế hoạch giảm thiểu rủi ro.
- **2.5. Ước lượng chi phí**: tính toán chi phí nhân lực (88-132 giờ × 50,000-70,000 VND/giờ), chi phí cơ sở hạ tầng (domain, VPS, email dịch vụ), và chi phí tổng thể.
- **2.6. Phân tích và thiết kế theo hướng đối tượng cho hai chức năng chính**: phân tích chi tiết hai chức năng tiêu biểu (quản lý giao dịch và quản lý ngân sách) theo hướng OOP, bao gồm thuộc tính, hành vi, quan hệ giữa các lớp, và trách nhiệm.
- **2.7. Tài liệu kiểm thử và bảo trì**: xác định chiến lược kiểm thử (đơn vị, tích hợp, hệ thống, E2E), các trường hợp test mẫu, chỉ số kiểm thử, và kế hoạch bảo trì dài hạn.

Nội dung chương này cung cấp nền tảng để đi từ ý tưởng sang phối cảnh kỹ thuật cụ thể, hỗ trợ quá trình lập kế hoạch, ra quyết định công nghệ, và quản lý rủi ro hiệu quả.

## 2.1. Phân tích và thiết kế hệ thống

### 2.1.1. Mô tả tổng quan hệ thống

Hệ thống được xây dựng theo kiến trúc web full-stack với hai lớp chính:

- **Frontend**: giao diện người dùng, xử lý tương tác, hiển thị dữ liệu.
- **Backend**: xử lý nghiệp vụ, xác thực, truy xuất dữ liệu và cung cấp API.

Dữ liệu được lưu trữ tập trung trong cơ sở dữ liệu, qua đó đảm bảo tính nhất quán và khả năng truy xuất linh hoạt. Cách tổ chức này phù hợp với các bài toán quản lý thông tin có nhiều thực thể và nhiều quan hệ như giao dịch, danh mục, ngân sách, mục tiêu và khoản nợ.

Lý thuyết bổ trợ (mở rộng):

- Separation of Concerns (Tách rõ trách nhiệm): tách biệt trách nhiệm thành các lớp/miền (presentation, business, data) giúp giảm độ phức tạp, tăng khả năng tái sử dụng, và thuận tiện cho kiểm thử đơn vị.
- Consistency Models (Mô hình nhất quán dữ liệu): lựa chọn giữa ACID (Atomicity, Consistency, Isolation, Durability - nhất quán mạnh) và BASE/eventual consistency (Basically Available, Soft state, Eventually consistent - nhất quán cuối cùng). Trong hệ thống dùng MongoDB, một số phép toán thống kê có thể chấp nhận eventual consistency để đổi lấy hiệu năng và khả năng mở rộng ngang (scale-out).
- Transaction Boundaries & Compensating Actions (Ranh giới giao dịch và hành động bù trừ): khi thao tác nhiều document/collection cần xác định ranh giới giao dịch; nếu không hỗ trợ giao dịch phân tán, dùng cơ chế bù trừ (compensation) để đảm bảo nhất quán nghiệp vụ.
- Separation of Concerns trong UI (Tách rõ giao diện và logic): tách rõ component trình bày (view) và state management/logic để giảm xung đột khi nhiều developer làm việc song song.

| Thành phần | Công nghệ đang dùng | Mục đích |
| --- | --- | --- |  
| Frontend | React 18, Vite, TailwindCSS, React Router | Xây dựng giao diện và điều hướng |
| Biểu đồ | Recharts, Chart.js, react-chartjs-2 | Trực quan hóa tài chính |
| Backend | Node.js, Express | Xử lý nghiệp vụ và REST API |
| Cơ sở dữ liệu | MongoDB, Mongoose | Lưu trữ dữ liệu người dùng |
| Xác thực | JWT, bcryptjs, refresh token | Đăng nhập an toàn |
| Gửi email | Nodemailer, Google auth library | Hỗ trợ quên mật khẩu |
| Kiểm thử | Vitest, Jest, Supertest, Testing Library | Đảm bảo chất lượng phần mềm |

Từ cấu hình gói có thể thấy dự án đã sử dụng 15 thư viện runtime và 18 thư viện phát triển ở phía client, cùng 14 thư viện runtime và 4 thư viện phát triển ở phía server. Quy mô này cho thấy dự án đủ chiều sâu công nghệ để triển khai một hệ thống web có xác thực, biểu đồ, kiểm thử và xuất báo cáo.

### 2.1.2. Yêu cầu chức năng

Hệ thống cần đáp ứng các nhóm chức năng sau:

| Nhóm chức năng | Mục tiêu | Đầu ra chính |
| --- | --- | --- |
| Xác thực và người dùng | Quản lý truy cập an toàn | Tài khoản, phiên đăng nhập, hồ sơ |
| Giao dịch | Ghi nhận và theo dõi dòng tiền | Danh sách giao dịch, bộ lọc, tìm kiếm |
| Danh mục | Phân loại chi tiêu hợp lý | Danh mục có màu sắc, biểu tượng |
| Ngân sách | Kiểm soát mức chi tiêu | Tiến độ ngân sách, cảnh báo vượt mức |
| Mục tiêu | Hỗ trợ tiết kiệm dài hạn | Tiến độ hoàn thành, số dư tích lũy |
| Khoản nợ | Theo dõi nghĩa vụ tài chính | Trạng thái nợ, lịch sử cập nhật |
| Thống kê và báo cáo | Hỗ trợ phân tích quyết định | Biểu đồ, dashboard, dữ liệu xuất |

1. **Nhóm xác thực và người dùng**
   - Đăng ký tài khoản.
   - Đăng nhập/đăng xuất.
   - Quên mật khẩu, đặt lại mật khẩu.
   - Cập nhật hồ sơ cá nhân.

2. **Nhóm giao dịch**
   - Thêm giao dịch thu hoặc chi.
   - Chỉnh sửa, xóa giao dịch.
   - Lọc theo thời gian, loại giao dịch, danh mục.
   - Tìm kiếm, phân trang và xem chi tiết.

3. **Nhóm danh mục**
   - Tạo, sửa, xóa danh mục.
   - Gắn màu sắc, biểu tượng để dễ phân biệt.

4. **Nhóm ngân sách**
   - Khai báo ngân sách theo danh mục hoặc tổng thể.
   - Theo dõi mức độ sử dụng ngân sách.
   - Cảnh báo khi vượt ngưỡng.

5. **Nhóm mục tiêu**
   - Tạo mục tiêu tiết kiệm.
   - Cập nhật tiến độ.
   - Theo dõi thời hạn hoàn thành.

6. **Nhóm khoản nợ**
   - Theo dõi khoản phải trả hoặc phải thu.
   - Cập nhật trạng thái nợ.

7. **Nhóm thống kê và báo cáo**
   - Thống kê tổng thu, tổng chi, số dư.
   - Biểu đồ dòng tiền theo thời gian.
   - Biểu đồ phân bổ theo danh mục.
   - Xuất dữ liệu khi cần.

### 2.1.3. Yêu cầu phi chức năng

Ngoài các chức năng nghiệp vụ, hệ thống còn phải đáp ứng các yêu cầu phi chức năng:

- **Tính dễ dùng**: giao diện rõ ràng, dễ thao tác.
- **Tính an toàn**: bảo vệ dữ liệu người dùng, hạn chế truy cập trái phép.
- **Tính ổn định**: xử lý lỗi tập trung, tránh làm gián đoạn hệ thống.
- **Tính mở rộng**: có thể bổ sung chức năng mới.
- **Tính kiểm thử được**: có test cho các luồng quan trọng.
- **Tính bảo trì được**: mã nguồn có cấu trúc tách lớp, dễ sửa đổi.

Lý thuyết bổ sung về phi chức năng:

- SLA (Service Level Agreement) và SLO (Service Level Objective): xác định mục tiêu thời gian phản hồi và tỉ lệ lỗi chấp nhận được (ví dụ: 99.9% uptime), giúp đặt chuẩn cho kiểm thử hiệu năng và giám sát vận hành.
- RPO/RTO cho backup: Recovery Point Objective và Recovery Time Objective được dùng để thiết kế chính sách sao lưu và kế hoạch khôi phục khi có sự cố.
- Observability: xây dựng telemetry (metrics, logs, traces) để có khả năng quan sát hệ thống, dễ dàng định vị nguyên nhân gây lỗi và theo dõi hành vi hệ thống sau deploy.


### 2.1.4. Mô hình kiến trúc đề xuất

Kiến trúc hệ thống có thể mô tả theo mô hình sau:

- **Tầng trình bày**: React SPA ở phía client.
- **Tầng dịch vụ**: API REST trên Express.
- **Tầng nghiệp vụ**: controller, service, middleware.
- **Tầng dữ liệu**: MongoDB với Mongoose.

Ưu điểm của mô hình này:

- Phân tách rõ giao diện và xử lý nghiệp vụ.
- Dễ bảo trì và thay thế từng phần.
- Hỗ trợ phát triển theo mô-đun.
- Phù hợp với các nhóm chức năng độc lập như giao dịch, ngân sách, mục tiêu.

Ưu điểm và cân nhắc kiến trúc:

- Monolith modular: bắt đầu bằng một monolith có module rõ ràng giúp giảm chi phí triển khai ban đầu và đơn giản hóa debug.
- Microservices: khi hệ thống cần scale theo miền hoặc đội ngũ phát triển lớn, cân nhắc tách bounded context thành dịch vụ riêng — tuy nhiên microservice tăng chi phí vận hành (deploy, monitoring, giao tiếp giữa dịch vụ).
- Trade-offs: lựa chọn kiến trúc cần cân bằng giữa tốc độ phát triển, chi phí vận hành, và yêu cầu mở rộng/nghịch cảnh trong tương lai.


### 2.1.5. Thiết kế dữ liệu ở mức khái niệm

Các thực thể chính trong hệ thống gồm:

- **User**: thông tin tài khoản người dùng.
- **Transaction**: giao dịch thu/chi.
- **Category**: danh mục giao dịch.
- **Budget**: ngân sách.
- **Goal**: mục tiêu tiết kiệm.
- **Debt**: khoản nợ.
- **Notification**: thông báo hệ thống.
- **Admin**: tài khoản quản trị, nếu có tách riêng nghiệp vụ.

Các quan hệ chính có thể suy ra:

- Một người dùng có nhiều giao dịch.
- Một giao dịch thuộc về một danh mục.
- Một người dùng có thể có nhiều ngân sách.
- Một người dùng có thể tạo nhiều mục tiêu.
- Một người dùng có thể theo dõi nhiều khoản nợ.

Mô hình quan hệ này giúp hệ thống lưu trữ dữ liệu theo chiều sâu nhưng vẫn đủ linh hoạt để thống kê và truy vấn.

Lý thuyết thiết kế dữ liệu (mở rộng):

- Normalization vs Denormalization: trong các cơ sở dữ liệu quan hệ, normalization giảm dư thừa và giữ tính nhất quán; trong NoSQL, denormalization (embed) thường dùng để tối ưu tốc độ đọc nhưng làm phức tạp cập nhật.
- Schema Evolution: thiết kế cơ chế versioning cho schema và migration scripts để cập nhật dữ liệu cũ khi thay đổi cấu trúc.
- Indexing Strategy: xác định các trường cần index dựa trên pattern truy vấn (ví dụ: `userId`, `date`, `category`), cân bằng giữa lợi ích truy vấn và chi phí cập nhật/bộ nhớ chỉ mục.
- Data Retention & Archiving: chính sách lưu trữ và lưu trữ lịch sử (archiving) để giới hạn kích thước collection và duy trì hiệu năng.


   ## 2.2. Khảo sát, xác lập dự án

### 2.2.1. Khảo sát hiện trạng

Trong thực tế, nhiều người dùng hiện nay vẫn quản lý tài chính cá nhân bằng cách ghi chép rời rạc trên giấy, file bảng tính hoặc ứng dụng đơn lẻ chỉ có một vài tính năng cơ bản. Các hạn chế thường gặp là:

- Không liên kết được giữa giao dịch và ngân sách.
- Không có báo cáo tổng hợp theo thời gian.
- Khó xem được xu hướng chi tiêu.
- Không hỗ trợ nhập/xuất dữ liệu linh hoạt.
- Bảo mật và sao lưu dữ liệu chưa tốt.

Từ khảo sát này, nhu cầu của người dùng không chỉ là “ghi chép” mà còn là “hiểu và kiểm soát” tài chính của mình.

Lý thuyết nghiên cứu người dùng:

- Personas & User Journeys: xây dựng persona (hình mẫu người dùng) giúp ưu tiên chức năng và thiết kế các luồng tương tác phù hợp.
- Competitive Benchmarking: phân tích các ứng dụng tương tự để nhận diện gap và điểm khác biệt có thể tận dụng.
- Metric-driven design: định nghĩa success metrics (engagement, retention, task completion) để đo lường tính hiệu quả của tính năng.


### 2.2.2. Đối tượng sử dụng

Hệ thống hướng tới hai nhóm người dùng chính:

| Nhóm người dùng | Nhu cầu chính | Quyền hạn |
| --- | --- | --- |
| Người dùng cá nhân | Ghi nhận thu chi, quản lý ngân sách, theo dõi mục tiêu | Tạo và chỉnh sửa dữ liệu của chính mình |
| Quản trị viên | Giám sát vận hành, hỗ trợ xử lý dữ liệu, quản lý phản hồi | Truy cập các chức năng quản trị |

- **Người dùng cá nhân**: nhập giao dịch, theo dõi ngân sách và mục tiêu.
- **Quản trị viên**: hỗ trợ vận hành, giám sát, quản lý phản hồi và dữ liệu hệ thống ở mức cần thiết.

### 2.2.3. Xác lập mục tiêu dự án

Dựa trên khảo sát, dự án được xác lập với định hướng:

- Ưu tiên nhóm chức năng cốt lõi liên quan đến thu chi và quản lý ngân sách.
- Mở rộng sang thống kê, tìm kiếm và báo cáo để tăng giá trị sử dụng.
- Xây dựng hệ thống có khả năng kiểm thử và triển khai ổn định.

### 2.2.4. Tiêu chí thành công

Dự án được xem là đạt yêu cầu nếu:

- Người dùng có thể đăng nhập và sử dụng hệ thống an toàn.
- Giao dịch được lưu trữ và truy vấn chính xác.
- Ngân sách và mục tiêu hiển thị tiến độ đúng.
- Biểu đồ và dashboard phản ánh đúng dữ liệu.
- Hệ thống hoạt động ổn định với các luồng nghiệp vụ chính.

## 2.3. Xây dựng kế hoạch dự án

### 2.3.1. Phân rã công việc

Dự án có thể được chia thành các giai đoạn chính:

1. Khảo sát và phân tích yêu cầu.
2. Thiết kế kiến trúc, dữ liệu và luồng nghiệp vụ.
3. Xây dựng backend API.
4. Xây dựng frontend và trải nghiệm người dùng.
5. Tích hợp và kiểm thử.
6. Hoàn thiện báo cáo, tài liệu và triển khai.

Lý thuyết quản lý công việc:

- Work Breakdown Structure (WBS): chia nhỏ công việc theo deliverable, giúp ước lượng và giao trách nhiệm rõ ràng.
- Estimation Techniques: PERT/Three-point estimation (Expected = (O + 4M + P)/6), story points (so sánh tính tương đối), và bottom-up estimation cho các task có thể ước lượng.
- Iterative Delivery: áp dụng vòng lặp ngắn (sprint) để giảm rủi ro và nhận phản hồi sớm từ người dùng.

### 2.3.2. Kế hoạch theo giai đoạn

| Giai đoạn | Nội dung | Kết quả mong đợi |
| --- | --- | --- |
| Phân tích yêu cầu | Xác định phạm vi, chức năng, ràng buộc | Danh sách yêu cầu rõ ràng |
| Thiết kế | Lập kiến trúc, dữ liệu, giao diện | Mô hình hệ thống thống nhất |
| Phát triển backend | Xây API, middleware, bảo mật | API ổn định, có kiểm thử |
| Phát triển frontend | Xây giao diện, trạng thái, điều hướng | UI hoàn chỉnh, dễ dùng |
| Kiểm thử | Test chức năng và luồng chính | Hệ thống giảm lỗi |
| Hoàn thiện | Tối ưu, tài liệu, đóng gói | Báo cáo và sản phẩm hoàn chỉnh |

### 2.3.3. Ước lượng tiến độ theo tuần

| Tuần | Trọng tâm công việc | Kết quả |
| --- | --- | --- |
| Tuần 1 | Khảo sát, xác định yêu cầu | Mô tả bài toán và phạm vi |
| Tuần 2 | Thiết kế kiến trúc và dữ liệu | Sơ đồ và mô hình tổng thể |
| Tuần 3-4 | Xây dựng backend | API và nghiệp vụ chính |
| Tuần 5-6 | Xây dựng frontend | Các màn hình chức năng |
| Tuần 7 | Kiểm thử và sửa lỗi | Các test case quan trọng |
| Tuần 8 | Viết báo cáo và hoàn thiện | Tài liệu cuối cùng |

### 2.3.3. Phương pháp triển khai

Dự án phù hợp với phương pháp phát triển lặp tăng dần:

- Hoàn thiện sớm chức năng lõi trước.
- Kiểm tra liên tục giữa client và server.
- Điều chỉnh giao diện và logic theo phản hồi thực tế.
- Ưu tiên các chức năng có giá trị sử dụng cao như giao dịch, ngân sách, thống kê.

Cách làm này giúp giảm rủi ro tích hợp và dễ kiểm soát tiến độ.

## 2.4. Ước lượng rủi ro

### 2.4.1. Nhóm rủi ro kỹ thuật

- Sai lệch giữa thiết kế giao diện và dữ liệu thực tế.
- Lỗi xác thực hoặc hết hạn token trong quá trình sử dụng.
- Truy vấn thống kê phức tạp gây chậm hiệu năng.
- Xung đột giữa nhiều trạng thái frontend.
- Lỗi khi import dữ liệu từ nhiều định dạng khác nhau.

| Rủi ro kỹ thuật | Mức ảnh hưởng | Cách xử lý |
| --- | --- | --- |
| Sai lệch UI - dữ liệu | Trung bình | Chuẩn hóa response và schema |
| Token hết hạn | Cao | Dùng refresh token, xử lý 401 rõ ràng |
| Truy vấn chậm | Cao | Tối ưu chỉ mục và giới hạn dữ liệu trả về |
| Xung đột state | Trung bình | Tách logic theo context/service |
| Import sai định dạng | Trung bình | Validate file và báo lỗi cụ thể |

Lý thuyết quản lý rủi ro (mở rộng):

- Risk Scoring: đánh giá mỗi rủi ro theo xác suất (probability) và tác động (impact), thường chuẩn hóa về thang điểm để tạo ma trận ưu tiên (ví dụ: probability 1-5, impact 1-5, risk = p*i).
- Residual Risk: sau khi áp dụng biện pháp giảm thiểu, đánh giá lại rủi ro còn lại và theo dõi qua các KPI (số lỗi, thời gian trung bình để phục hồi).
- Risk Register: lưu lại tất cả rủi ro, trạng thái xử lý, chủ sở hữu và các milestone để quản lý xuyên suốt dự án.

### 2.4.2. Nhóm rủi ro nghiệp vụ

- Người dùng nhập sai loại giao dịch.
- Danh mục không đồng nhất làm thống kê lệch.
- Ngân sách đặt không đúng thực tế dẫn đến cảnh báo không chính xác.
- Thiếu dữ liệu đầu vào khiến biểu đồ không phản ánh đúng xu hướng.

| Rủi ro nghiệp vụ | Hệ quả | Biện pháp |
| --- | --- | --- |
| Nhập sai loại giao dịch | Dữ liệu thống kê sai | Ràng buộc kiểu giao dịch, kiểm tra phía client và server |
| Danh mục không đồng nhất | Biểu đồ phân loại lệch | Chuẩn hóa danh mục mặc định |
| Ngân sách đặt sai | Cảnh báo không thực tế | Gợi ý ngưỡng theo lịch sử chi tiêu |
| Thiếu dữ liệu đầu vào | Phân tích kém chính xác | Hiển thị thông báo và trạng thái dữ liệu trống |

### 2.4.3. Nhóm rủi ro tiến độ

- Phạm vi chức năng mở rộng ngoài dự kiến.
- Tốn thời gian cho phần giao diện và hiệu ứng hiển thị.
- Việc viết kiểm thử và sửa lỗi có thể kéo dài hơn kế hoạch.

| Rủi ro tiến độ | Tác động | Biện pháp kiểm soát |
| --- | --- | --- |
| Mở rộng phạm vi | Trễ tiến độ | Chốt phạm vi từ đầu và ưu tiên chức năng lõi |
| Giao diện phức tạp | Tăng khối lượng hoàn thiện | Tái sử dụng component và mẫu layout chung |
| Kiểm thử kéo dài | Chậm bàn giao | Viết test song song với phát triển |

### 2.4.4. Biện pháp giảm thiểu

- Chia nhỏ chức năng và ưu tiên phần lõi.
- Thiết kế API rõ ràng, có validate dữ liệu đầu vào.
- Áp dụng kiểm thử tự động cho luồng quan trọng.
- Theo dõi tiến độ theo từng sprint hoặc mốc nhỏ.
- Dùng middleware và cơ chế xử lý lỗi tập trung để giảm lỗi dây chuyền.

## 2.5. Ước lượng chi phí

### 2.5.1. Chi phí phát triển

Với một đề tài sinh viên, chi phí thường không nằm ở mua bản quyền phần mềm lớn mà chủ yếu là thời gian phát triển, công sức thiết kế, kiểm thử và viết tài liệu.

Có thể ước lượng chi phí theo các nhóm sau:

- **Thời gian phân tích**: khảo sát, đọc tài liệu, xác định yêu cầu.
- **Thời gian thiết kế**: kiến trúc, dữ liệu, giao diện.
- **Thời gian lập trình**: frontend, backend, tích hợp.
- **Thời gian kiểm thử**: test thủ công và tự động.
- **Thời gian tài liệu**: báo cáo, hướng dẫn, chuẩn hóa nội dung.

Nếu quy đổi theo đơn giá công sức thực tập khoảng 50.000 - 80.000 VNĐ/giờ, khối lượng ước tính 88 - 132 giờ tương đương khoảng 5.620.000 - 8.430.000 VNĐ. Đây là mức hợp lý cho một đồ án có cả frontend, backend, kiểm thử và viết tài liệu.

| Hạng mục | Số giờ ước lượng | Đơn giá tham khảo (VNĐ/giờ) | Thành tiền ước lượng (VNĐ) |
| --- | --- | --- | --- |
| Phân tích yêu cầu | 8 - 12 | 50.000 | 400.000 - 600.000 |
| Thiết kế hệ thống | 12 - 18 | 60.000 | 720.000 - 1.080.000 |
| Phát triển backend | 25 - 35 | 70.000 | 1.750.000 - 2.450.000 |
| Phát triển frontend | 25 - 40 | 70.000 | 1.750.000 - 2.800.000 |
| Kiểm thử | 10 - 15 | 60.000 | 600.000 - 900.000 |
| Viết báo cáo | 8 - 12 | 50.000 | 400.000 - 600.000 |
| **Tổng** | **88 - 132** |  | **5.620.000 - 8.430.000** |

### 2.5.2. Chi phí hạ tầng

Các công nghệ sử dụng chủ yếu là mã nguồn mở nên chi phí nền tảng thấp:

- React, Vite, Node.js, Express, MongoDB Community.
- Công cụ kiểm thử và build đều có thể sử dụng miễn phí.
- Có thể dùng hosting miễn phí hoặc chi phí thấp cho giai đoạn demo.

| Hạng mục hạ tầng | Chi phí dự kiến | Ghi chú |
| --- | --- | --- |
| Mã nguồn mở | 0 | Phần lớn công nghệ đều miễn phí |
| Máy phát triển cá nhân | 0 nếu có sẵn | Dùng máy cá nhân để phát triển |
| Lưu trữ thử nghiệm | 0 - thấp | Tùy nền tảng triển khai |
| Miền/demo | 0 - thấp | Chỉ cần nếu cần trình bày trực tuyến |

| Hạng mục triển khai thực tế | Mức giá tham khảo | Ghi chú |
| --- | --- | --- |
| Domain .com / .net | 250.000 - 500.000 VNĐ/năm | Nếu muốn có địa chỉ riêng |
| VPS cơ bản | 80.000 - 200.000 VNĐ/tháng | Phù hợp demo hoặc test |
| Email dịch vụ ngoài | 0 - 200.000 VNĐ/tháng | Tùy gói dùng |
| Sao lưu dữ liệu | 0 - 100.000 VNĐ/tháng | Có thể dùng dịch vụ miễn phí |

Với cách triển khai hiện tại, tổng chi phí thực tế của đồ án có thể giữ ở mức 0 - 500.000 VNĐ nếu chỉ chạy cục bộ và demo nội bộ. Nếu đưa lên môi trường có domain và VPS cơ bản trong 1 năm, tổng chi phí có thể dao động khoảng 1.000.000 - 3.000.000 VNĐ tùy gói dịch vụ.

### 2.5.3. Bảng ước lượng tham khảo

| Hạng mục | Đơn vị | Số lượng ước lượng | Ghi chú |
| --- | --- | --- | --- |
| Phân tích yêu cầu | Giờ | 8 - 12 | Khảo sát, đặc tả |
| Thiết kế hệ thống | Giờ | 12 - 18 | Sơ đồ, kiến trúc |
| Phát triển backend | Giờ | 25 - 35 | API, bảo mật, logic |
| Phát triển frontend | Giờ | 25 - 40 | Giao diện, trạng thái |
| Kiểm thử | Giờ | 10 - 15 | Test chức năng chính |
| Viết báo cáo | Giờ | 8 - 12 | Tổng hợp tài liệu |

Bảng trên chỉ mang tính tham khảo và có thể thay đổi tùy mức độ hoàn thiện mong muốn.

## 2.6. Phân tích và thiết kế hệ thống theo hướng đối tượng cho 1 đến 2 chức năng chính

Trong phần này, báo cáo tập trung vào hai chức năng tiêu biểu và có tính trung tâm của hệ thống: **quản lý giao dịch** và **quản lý ngân sách**. Đây là hai chức năng thể hiện rõ nhất tư duy hướng đối tượng, vì chúng liên quan trực tiếp đến đối tượng nghiệp vụ, thuộc tính, hành vi và sự tương tác giữa các lớp.

### 2.6.1. Chức năng 1: Quản lý giao dịch

#### a) Mô tả nghiệp vụ

Giao dịch là đơn vị dữ liệu cơ bản nhất trong hệ thống. Mỗi giao dịch phản ánh một lần phát sinh thu hoặc chi, gắn với thời điểm, số tiền, loại giao dịch, danh mục và ghi chú.

Người dùng cần có khả năng:

- Tạo giao dịch mới.
- Cập nhật giao dịch đã có.
- Xóa giao dịch không còn hợp lệ.
- Lọc và tìm kiếm giao dịch theo điều kiện.

#### b) Phân tích đối tượng

Các đối tượng chính có thể bao gồm:

| Đối tượng | Vai trò | Trách nhiệm chính |
| --- | --- | --- |
| Transaction | Thực thể nghiệp vụ | Lưu thông tin thu/chi |
| TransactionService | Xử lý nghiệp vụ | Kiểm tra, tính toán, điều phối |
| TransactionController | Lớp điều khiển | Nhận request, trả response |
| TransactionRepository/Model | Lớp dữ liệu | Lưu và truy xuất dữ liệu |
| Category | Thực thể hỗ trợ | Phân loại giao dịch |

- **Transaction**: biểu diễn một giao dịch.
- **TransactionService**: xử lý nghiệp vụ giao dịch.
- **TransactionController**: nhận yêu cầu từ client và điều phối xử lý.
- **TransactionRepository/Model**: lưu trữ và truy xuất dữ liệu.
- **Category**: hỗ trợ phân loại giao dịch.

#### c) Thuộc tính chính của Transaction

- Mã giao dịch.
- Người sở hữu.
- Loại giao dịch: thu hoặc chi.
- Số tiền.
- Danh mục.
- Ngày thực hiện.
- Ghi chú.
- Trạng thái hiển thị.

| Thuộc tính | Kiểu ý nghĩa | Mô tả |
| --- | --- | --- |
| Mã giao dịch | Định danh | Phân biệt từng bản ghi |
| Người sở hữu | Liên kết người dùng | Thuộc tài khoản nào |
| Loại giao dịch | Phân loại | Thu hoặc chi |
| Số tiền | Giá trị số | Giá trị phát sinh |
| Danh mục | Phân loại nghiệp vụ | Nhóm chi tiêu tương ứng |
| Ngày thực hiện | Thời gian | Mốc ghi nhận giao dịch |
| Ghi chú | Mô tả tự do | Bổ sung ngữ cảnh |
| Trạng thái hiển thị | Trạng thái logic | Đang sử dụng hay đã ẩn |

#### d) Hành vi chính của Transaction

- `createTransaction()` - tạo mới.
- `updateTransaction()` - cập nhật.
- `deleteTransaction()` - xóa.
- `getTransactions()` - truy vấn danh sách.
- `filterTransactions()` - lọc theo tiêu chí.

| Hành vi | Mục đích | Kết quả |
| --- | --- | --- |
| createTransaction() | Tạo bản ghi mới | Giao dịch được lưu vào hệ thống |
| updateTransaction() | Sửa thông tin giao dịch | Dữ liệu được đồng bộ |
| deleteTransaction() | Loại bỏ giao dịch | Bản ghi bị xóa hoặc đánh dấu |
| getTransactions() | Lấy danh sách | Hiển thị dữ liệu cho người dùng |
| filterTransactions() | Lọc theo điều kiện | Danh sách rút gọn theo tiêu chí |

#### e) Quan hệ giữa các đối tượng

- Một `Transaction` thuộc về một `User`.
- Một `Transaction` thường tham chiếu đến một `Category`.
- `TransactionService` tách logic xử lý khỏi giao diện.
- `TransactionController` chỉ làm vai trò trung gian nhận và trả dữ liệu.

#### f) Luồng xử lý tổng quát

1. Người dùng nhập thông tin giao dịch.
2. Giao diện gửi dữ liệu lên API.
3. Controller nhận request và kiểm tra sơ bộ.
4. Service xử lý nghiệp vụ và validate.
5. Model lưu dữ liệu vào cơ sở dữ liệu.
6. Hệ thống trả kết quả về client.
7. Giao diện cập nhật danh sách và biểu đồ liên quan.

### 2.6.2. Chức năng 2: Quản lý ngân sách

#### a) Mô tả nghiệp vụ

Ngân sách là công cụ giúp người dùng đặt giới hạn chi tiêu cho một khoảng thời gian hoặc cho một danh mục cụ thể. Chức năng này mang ý nghĩa kiểm soát tài chính, không chỉ ghi lại dữ liệu mà còn so sánh dữ liệu thực tế với kế hoạch ban đầu.

Người dùng có thể:

- Tạo ngân sách theo danh mục hoặc tổng thể.
- Theo dõi số tiền đã sử dụng.
- Nhận cảnh báo khi gần vượt mức.
- Xem tỷ lệ phần trăm sử dụng.

#### b) Phân tích đối tượng

Các đối tượng chính có thể bao gồm:

| Đối tượng | Vai trò | Trách nhiệm chính |
| --- | --- | --- |
| Budget | Thực thể nghiệp vụ | Lưu thông tin ngân sách |
| BudgetService | Xử lý nghiệp vụ | Tính toán mức sử dụng |
| BudgetController | Lớp điều khiển | Cung cấp API |
| Transaction | Nguồn dữ liệu | Cung cấp chi tiêu thực tế |
| Category | Phạm vi ngân sách | Xác định nhóm áp dụng |

- **Budget**: mô hình ngân sách.
- **BudgetService**: xử lý nghiệp vụ liên quan.
- **BudgetController**: cung cấp API.
- **Transaction**: nguồn dữ liệu để tính tổng chi tiêu thực tế.
- **Category**: giúp xác định phạm vi ngân sách.

#### c) Thuộc tính chính của Budget

- Mã ngân sách.
- Người sở hữu.
- Danh mục áp dụng.
- Số tiền giới hạn.
- Chu kỳ thời gian.
- Số tiền đã dùng.
- Trạng thái cảnh báo.
- Thời gian bắt đầu và kết thúc.

| Thuộc tính | Ý nghĩa | Vai trò trong nghiệp vụ |
| --- | --- | --- |
| Mã ngân sách | Định danh | Phân biệt từng ngân sách |
| Người sở hữu | Liên kết người dùng | Xác định chủ thể quản lý |
| Danh mục áp dụng | Phạm vi | Gắn với nhóm chi tiêu |
| Số tiền giới hạn | Ngưỡng | Mức chi tối đa |
| Chu kỳ thời gian | Khoảng áp dụng | Theo tháng, quý hoặc tùy chỉnh |
| Số tiền đã dùng | Giá trị thực tế | Dùng để so sánh với giới hạn |
| Trạng thái cảnh báo | Trạng thái hệ thống | Cho biết đã gần vượt hay chưa |
| Thời gian bắt đầu/kết thúc | Mốc thời gian | Xác định chu kỳ ngân sách |

#### d) Hành vi chính của Budget

- `createBudget()` - thiết lập ngân sách.
- `updateBudget()` - điều chỉnh ngân sách.
- `calculateSpentAmount()` - tính số đã chi.
- `checkBudgetStatus()` - xác định trạng thái còn đủ hay đã vượt.
- `getBudgetSummary()` - tổng hợp tiến độ.

| Hành vi | Mục đích | Kết quả |
| --- | --- | --- |
| createBudget() | Thiết lập ngân sách mới | Ngân sách được lưu |
| updateBudget() | Điều chỉnh ngân sách | Dữ liệu ngân sách thay đổi |
| calculateSpentAmount() | Tính chi tiêu thực tế | Có số đã dùng |
| checkBudgetStatus() | So sánh với giới hạn | Trạng thái vượt/ngưỡng |
| getBudgetSummary() | Tổng hợp tiến độ | Hiển thị % sử dụng ngân sách |

#### e) Mối liên hệ với giao dịch

Ngân sách không tồn tại độc lập mà phụ thuộc vào dữ liệu giao dịch. Khi có giao dịch mới phát sinh, hệ thống cần cập nhật mức chi tiêu thực tế để tính toán lại tiến độ ngân sách.

Điều này thể hiện mối quan hệ rõ ràng giữa hai lớp nghiệp vụ:

- `Transaction` cung cấp dữ liệu đầu vào.
- `Budget` là đối tượng quản lý, tổng hợp và đánh giá dữ liệu đó.

#### f) Luồng xử lý tổng quát

1. Người dùng tạo ngân sách.
2. Hệ thống lưu thông tin ngân sách.
3. Khi phát sinh giao dịch chi, hệ thống tính lại số đã sử dụng.
4. Nếu gần vượt ngưỡng, hệ thống tạo cảnh báo.
5. Dashboard hiển thị tiến độ ngân sách.

### 2.6.3. Mô hình lớp mức khái niệm

Có thể khái quát thiết kế hướng đối tượng của hệ thống theo các lớp sau:

| Nhóm lớp | Các lớp tiêu biểu | Vai trò |
| --- | --- | --- |
| Lớp thực thể | User, Transaction, Category, Budget, Goal, Debt | Biểu diễn dữ liệu nghiệp vụ |
| Lớp điều khiển | AuthController, TransactionController, BudgetController | Nhận và điều phối yêu cầu |
| Lớp nghiệp vụ | AuthService, TransactionService, BudgetService | Xử lý logic chính |
| Lớp dữ liệu | Model hoặc repository | Lưu trữ và truy xuất dữ liệu |

- Lớp thực thể: `User`, `Transaction`, `Category`, `Budget`, `Goal`, `Debt`.
- Lớp điều khiển: `AuthController`, `TransactionController`, `BudgetController`.
- Lớp xử lý nghiệp vụ: `AuthService`, `TransactionService`, `BudgetService`.
- Lớp truy cập dữ liệu: model hoặc repository.

Mô hình phân tầng này đảm bảo:

- Mỗi lớp có trách nhiệm rõ ràng.
- Logic nghiệp vụ không trộn lẫn với giao diện.
- Dễ bảo trì và mở rộng trong tương lai.

### 2.6.4. Ma trận đối tượng và trách nhiệm

| Đối tượng | Dữ liệu quản lý | Trách nhiệm chính | Mức độ liên quan |
| --- | --- | --- | --- |
| User | Thông tin tài khoản | Xác thực, phân quyền, hồ sơ | Rất cao |
| Transaction | Thu/chi, ngày, số tiền | Ghi nhận và truy vấn dòng tiền | Rất cao |
| Category | Tên, màu, icon | Phân loại nghiệp vụ | Cao |
| Budget | Hạn mức, chu kỳ, tiến độ | Kiểm soát chi tiêu | Cao |
| Goal | Mục tiêu, số tiền, hạn | Theo dõi tiết kiệm | Trung bình |
| Debt | Số nợ, trạng thái | Theo dõi nghĩa vụ tài chính | Trung bình |

Ma trận này cho thấy hai thực thể trọng tâm nhất của hệ thống là Transaction và Budget, vì đây là hai đối tượng ảnh hưởng trực tiếp đến bài toán quản lý chi tiêu và kiểm soát tài chính cá nhân.

## 2.7. Tài liệu kiểm thử và bảo trì

### 2.7.1. Mục tiêu kiểm thử

Kiểm thử nhằm xác nhận rằng hệ thống hoạt động đúng theo yêu cầu và phát hiện lỗi sớm trước khi đưa vào sử dụng. Với hệ thống quản lý chi tiêu, các chức năng trọng yếu cần được kiểm thử kỹ là:

- Đăng nhập, đăng ký, phân quyền.
- Thêm/sửa/xóa giao dịch.
- Tính ngân sách và trạng thái cảnh báo.
- Thống kê và tìm kiếm.
- Import/export dữ liệu.

### 2.7.2. Phạm vi kiểm thử

Kiểm thử bao gồm:

| Loại kiểm thử | Mục đích | Phạm vi |
| --- | --- | --- |
| Kiểm thử đơn vị | Kiểm tra hàm/module độc lập | Service, utility, validator |
| Kiểm thử tích hợp | Kiểm tra các thành phần kết hợp | Controller - service - model |
| Kiểm thử hệ thống | Kiểm tra luồng end-to-end | Các chức năng chính của ứng dụng |
| Kiểm thử giao diện | Kiểm tra hiển thị và thao tác | Component, form, điều hướng |

- **Kiểm thử đơn vị**: kiểm tra các hàm hoặc module độc lập.
- **Kiểm thử tích hợp**: kiểm tra luồng giữa các thành phần.
- **Kiểm thử hệ thống**: kiểm tra chức năng end-to-end.
- **Kiểm thử giao diện**: đảm bảo hiển thị đúng và thao tác ổn định.

### 2.7.3. Ví dụ trường hợp kiểm thử

| Mã test | Mục tiêu | Dữ liệu vào | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC01 | Đăng nhập thành công | Email và mật khẩu đúng | Điều hướng vào dashboard |
| TC02 | Đăng nhập thất bại | Sai mật khẩu | Hiển thị lỗi phù hợp |
| TC03 | Tạo giao dịch chi | Số tiền, danh mục, ngày | Giao dịch được lưu |
| TC04 | Cập nhật giao dịch | Dữ liệu sửa hợp lệ | Danh sách cập nhật đúng |
| TC05 | Tạo ngân sách | Giá trị ngân sách hợp lệ | Tiến độ ngân sách hiển thị |
| TC06 | Vượt ngân sách | Giao dịch chi làm vượt mức | Cảnh báo xuất hiện |
| TC07 | Tìm kiếm giao dịch | Từ khóa hợp lệ | Trả về dữ liệu phù hợp |

| Chỉ số kiểm thử | Giá trị mục tiêu | Ý nghĩa |
| --- | --- | --- |
| Tỷ lệ pass test backend | >= 90% | Đảm bảo nghiệp vụ ổn định |
| Tỷ lệ pass test frontend | >= 85% | Đảm bảo giao diện và thao tác |
| Số luồng nghiệp vụ được test | 7 trở lên | Bao phủ chức năng chính |
| Số test case tối thiểu | 15 - 20 | Đủ cho báo cáo và xác minh |

Trong phạm vi đồ án, nếu các test case chính đều đạt thì có thể kết luận hệ thống đáp ứng yêu cầu chức năng cốt lõi và có nền tảng để mở rộng các test nâng cao ở giai đoạn sau.

### 2.7.4. Chiến lược bảo trì

Bảo trì là phần quan trọng vì hệ thống có thể tiếp tục phát triển sau khi hoàn thành bài tập hoặc triển khai thực tế. Chiến lược bảo trì nên bao gồm:

| Hình thức bảo trì | Nội dung | Mục tiêu |
| --- | --- | --- |
| Sửa lỗi | Xử lý lỗi phát sinh | Đảm bảo hệ thống chạy đúng |
| Thích nghi | Điều chỉnh môi trường, thư viện | Giữ tương thích khi thay đổi |
| Hoàn thiện | Cải thiện hiệu năng, UI, trải nghiệm | Nâng chất lượng sử dụng |
| Mở rộng | Thêm chức năng mới | Tăng giá trị dự án |

- **Bảo trì sửa lỗi**: xử lý lỗi phát sinh từ dữ liệu hoặc logic.
- **Bảo trì thích nghi**: điều chỉnh khi thay đổi môi trường chạy hoặc thư viện.
- **Bảo trì hoàn thiện**: cải thiện hiệu năng, UI, trải nghiệm.
- **Bảo trì mở rộng**: bổ sung chức năng như báo cáo nâng cao, phân tích sâu hơn.

### 2.7.5. Nguyên tắc bảo trì tốt

- Tách lớp rõ ràng giữa giao diện, xử lý và dữ liệu.
- Viết hàm có trách nhiệm đơn nhất.
- Đặt tên biến, hàm, component có ý nghĩa.
- Dùng kiểm thử tự động cho các luồng trọng yếu.
- Ghi tài liệu cho API và luồng nghiệp vụ quan trọng.

### 2.7.6. Hướng phát triển tiếp theo

Nếu phát triển tiếp, hệ thống có thể mở rộng thêm:

- Kết nối đồng bộ với ngân hàng hoặc ví điện tử.
- Phân tích hành vi chi tiêu bằng học máy.
- Nhắc nhở định kỳ qua email, ứng dụng hoặc chatbot.
- Tạo báo cáo tài chính theo tuần, tháng, quý.
- Hỗ trợ nhiều tài khoản gia đình hoặc nhóm.

---

# CHƯƠNG 3. XÂY DỰNG, TRIỂN KHAI V

Chương này chuyển từ lý thuyết và kế hoạch sang thực hành cụ thể, trình bày chi tiết quy trình xây dựng, triển khai và vận hành ứng dụng quản lý chi tiêu cá nhân. Nội dung hướng tới các lập trình viên và kỹ sư vận hành cần thực hiện công việc từ khâu chuẩn bị ban đầu cho đến triển khai trên môi trường thực tế, kèm theo giám sát, bảo trì và cải tiến liên tục.

Chương 3 được chia thành sáu phần chính:

- **3.1. Chuẩn bị môi trường**: xác định yêu cầu phần cứng, cài đặt Node.js, npm, MongoDB, và các công cụ phát triển cần thiết; chuẩn bị kho mã nguồn.
- **3.2. Triển khai thành phần backend**: cài đặt dependencies backend, cấu hình biến môi trường (.env), khởi động dịch vụ backend, và kiểm tra kết nối cơ sở dữ liệu.
- **3.3. Triển khai thành phần frontend**: cài đặt dependencies frontend, cấu hình biến môi trường để kết nối API, khởi động dev server, và thử nghiệm chức năng cơ bản.
- **3.4. Quy trình kiểm thử trước triển khai**: chi tiết các loại kiểm thử (unit, integration, E2E, security) và các trường hợp test đảm bảo hệ thống sẵn sàng trước khi đưa lên production.
- **3.5. Triển khai lên môi trường production**: build ứng dụng, cấu hình máy chủ production, thiết lập Nginx/Apache làm reverse proxy, cấu hình SSL/TLS, triển khai backend với pm2, phục vụ frontend, và xác minh triển khai.
- **3.6. Giám sát, bảo trì và cải tiến**: thiết lập giám sát hiệu năng, quy trình backup và khôi phục dữ liệu, quản lý log, đảm bảo bảo mật liên tục, và thu thập phản hồi để cải tiến sản phẩm.

Nội dung chương này cung cấp hướng dẫn thực hành từng bước, giúp lập trình viên triển khai hệ thống một cách an toàn, hiệu quả và có khả năng mở rộng dài hạn.

## 3.1. Chuẩn bị môi trường

### 3.1.1. Yêu cầu môi trường phát triển

Để bắt đầu phát triển ứng dụng, cần chuẩn bị các công cụ và môi trường sau:

| Thành phần | Phiên bản | Mục đích | Ghi chú |
| --- | --- | --- | --- |
| Node.js | 16.x hoặc cao hơn | Runtime cho backend | npm đi kèm |
| npm | 8.x hoặc cao hơn | Quản lý package | Cài kèm Node.js |
| Git | 2.x hoặc cao hơn | Kiểm soát phiên bản | Lưu mã nguồn |
| MongoDB | 5.x hoặc cao hơn | Cơ sở dữ liệu | Local hoặc cloud (MongoDB Atlas) |
| Visual Studio Code | Phiên bản mới nhất | Trình soạn thảo mã | Tuỳ chọn |
| Postman | Phiên bản mới nhất | Kiểm thử API | Tuỳ chọn |

### 3.1.2. Cài đặt và cấu hình Node.js

Bước 1: Tải và cài đặt Node.js từ https://nodejs.org/. Chọn phiên bản LTS (Long Term Support) để đảm bảo ổn định.

Bước 2: Kiểm tra phiên bản cài đặt:
```bash
node --version
npm --version
```

Bước 3: Cập nhật npm lên phiên bản mới nhất (tuỳ chọn):
```bash
npm install -g npm@latest
```

### 3.1.3. Cài đặt MongoDB

**Tuỳ chọn 1: MongoDB Community Edition (Local)**

- Tải từ https://www.mongodb.com/try/download/community
- Cài đặt thủ công theo hướng dẫn của MongoDB
- Khởi động dịch vụ MongoDB:
  ```bash
  mongod
  ```

**Tuỳ chọn 2: MongoDB Atlas (Cloud)**

- Đăng ký tài khoản tại https://www.mongodb.com/cloud/atlas
- Tạo cluster và lấy connection string
- Cấu hình connection string trong file `.env` của backend

### 3.1.4. Chuẩn bị kho mã nguồn

Bước 1: Clone hoặc tải kho mã từ repository:
```bash
git clone <repository-url>
cd Quan_ly_chi_tieu
```

Bước 2: Kiểm tra cấu trúc thư mục:
```
Quan_ly_chi_tieu/
├── client/          # Frontend (React + Vite)
├── server/          # Backend (Express + Node.js)
├── docs/            # Tài liệu
└── README.md
```

## 3.2. Triển khai thành phần backend

### 3.2.1. Cài đặt dependency backend

Bước 1: Vào thư mục server:
```bash
cd server
```

Bước 2: Cài đặt các gói phụ thuộc:
```bash
npm install
```

Bước 3: Xác minh danh sách gói cài đặt:
```bash
npm list
```

### 3.2.2. Cấu hình biến môi trường backend

Bước 1: Tạo file `.env` trong thư mục `server`:
```bash
touch .env
```

Bước 2: Thêm các biến môi trường cần thiết:
```env
# Cấu hình máy chủ
PORT=5000
NODE_ENV=development

# Cấu hình cơ sở dữ liệu
MONGODB_URI=mongodb://localhost:27017/expense_manager
# Hoặc nếu dùng MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_manager

# Cấu hình JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cấu hình email (để gửi email reset password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Cấu hình CORS
CLIENT_URL=http://localhost:5173
```

Bước 3: Cấu hình file `src/config/database.js` để kết nối MongoDB dựa vào `MONGODB_URI`.

### 3.2.3. Kiểm tra và khởi động backend

Bước 1: Kiểm tra cấu hình kết nối database:
```bash
node src/index.js
```

Nếu thành công, console sẽ hiển thị:
```
Server running on port 5000
Connected to MongoDB
```

Bước 2: Dùng Postman hoặc curl để kiểm tra endpoint sơ khai:
```bash
curl http://localhost:5000/api/health
```

### 3.2.4. Chạy backend ở chế độ development

Dùng `nodemon` để tự động khởi động lại khi code thay đổi:
```bash
npm run dev
```

## 3.3. Triển khai thành phần frontend

### 3.3.1. Cài đặt dependency frontend

Bước 1: Vào thư mục client:
```bash
cd client
```

Bước 2: Cài đặt các gói phụ thuộc:
```bash
npm install
```

### 3.3.2. Cấu hình biến môi trường frontend

Bước 1: Tạo file `.env` trong thư mục `client`:
```bash
touch .env
```

Bước 2: Thêm các biến cấu hình:
```env
# API backend
VITE_API_BASE_URL=http://localhost:5000/api

# Cấu hình ứng dụng
VITE_APP_NAME=Quản Lý Chi Tiêu
VITE_APP_VERSION=1.0.0

# Google OAuth (nếu dùng)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3.3.3. Chạy frontend ở chế độ development

Bước 1: Khởi động dev server:
```bash
npm run dev
```

Bước 2: Truy cập ứng dụng tại `http://localhost:5173` (hoặc port khác được gợi ý).

Bước 3: Kiểm tra các chức năng cơ bản:
- Đăng ký tài khoản mới
- Đăng nhập
- Tạo, cập nhật, xóa giao dịch
- Xem dashboard

## 3.4. Quy trình kiểm thử trước triển khai

### 3.4.1. Kiểm thử đơn vị (Unit Tests)

Bước 1: Viết test cho backend sử dụng Jest:
```bash
cd server
npm test
```

Bước 2: Kiểm tra kết quả test:
- Backend: tối thiểu 90% chức năng pass
- Frontend: tối thiểu 85% component pass

Bước 3: Các file test mẫu nên bao gồm:
- `auth.test.js` - kiểm thử xác thực
- `transaction.test.js` - kiểm thử quản lý giao dịch
- `budget.test.js` - kiểm thử quản lý ngân sách

### 3.4.2. Kiểm thử tích hợp (Integration Tests)

Bước 1: Kiểm tra tương tác giữa các module:
```bash
npm run test:integration
```

Bước 2: Các kịch bản cần test:
- Người dùng đăng ký → Đăng nhập → Tạo giao dịch → Xem thống kê
- Tạo ngân sách → Tạo giao dịch → Kiểm tra cảnh báo vượt ngân sách
- Tạo mục tiêu tiết kiệm → Theo dõi tiến độ

### 3.4.3. Kiểm thử giao diện (E2E Tests)

Bước 1: Dùng Playwright hoặc Cypress:
```bash
cd client
npm run test:e2e
```

Bước 2: Kiểm tra:
- Tất cả trang có thể truy cập được
- Form có thể gửi dữ liệu
- Dữ liệu hiển thị chính xác

### 3.4.4. Kiểm thử bảo mật

- Kiểm tra HTTPS (nếu triển khai trên internet)
- Kiểm tra xác thực JWT (token hết hạn, token không hợp lệ)
- Kiểm tra quyền truy cập (người dùng không thể xem dữ liệu người khác)
- Kiểm tra SQL Injection / NoSQL Injection (tuy không áp dụng cho MongoDB thuần, nhưng cần kiểm tra input validation)

## 3.5. Triển khai lên môi trường production

### 3.5.1. Chuẩn bị máy chủ production

**Tuỳ chọn 1: Dùng VPS (Virtual Private Server)**

- Thuê VPS từ nhà cung cấp (DigitalOcean, Linode, Vultr, AWS)
- Yêu cầu: OS Linux (Ubuntu 20.04 LTS), RAM 2GB trở lên, SSD 50GB
- Cài đặt Node.js, MongoDB (hoặc dùng MongoDB Atlas)
- Cấu hình firewall (chỉ mở cổng 80, 443, 22)

**Tuỳ chọn 2: Dùng Platform as a Service (PaaS)**

- Heroku, Render, Railway, Vercel (cho frontend)
- Ưu điểm: tự động scale, SSL, CI/CD
- Nhược điểm: chi phí cao, giới hạn resource

### 3.5.2. Build ứng dụng cho production

**Backend:**
```bash
cd server
npm run build  # Nếu có script build
# Hoặc chỉ cần npm install với NODE_ENV=production
```

**Frontend:**
```bash
cd client
npm run build
```

Kiểm tra output trong thư mục `dist/`.

### 3.5.3. Cấu hình production

Bước 1: Tạo file `.env.production` với cấu hình:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expense_manager
JWT_SECRET=production_secret_key_very_long_and_secure
CLIENT_URL=https://yourdomain.com
```

Bước 2: Cấu hình nginx hoặc Apache làm reverse proxy (nếu dùng VPS):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
    }
    
    location / {
        root /var/www/expense-manager/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Bước 3: Cấu hình SSL/TLS với Let's Encrypt:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

### 3.5.4. Triển khai ứng dụng

Bước 1: Upload mã hoặc clone từ repository:
```bash
git clone <repository> /var/www/expense-manager
cd /var/www/expense-manager/server
npm install --production
```

Bước 2: Khởi động backend bằng process manager (pm2):
```bash
npm install -g pm2
pm2 start src/index.js --name "expense-api"
pm2 save
pm2 startup
```

Bước 3: Phục vụ frontend (thư mục `dist`):
```bash
cp -r client/dist /var/www/expense-manager-frontend
```

### 3.5.5. Xác minh triển khai

- Truy cập `https://yourdomain.com` để kiểm tra frontend
- Truy cập `https://yourdomain.com/api/health` để kiểm tra backend
- Thử đăng ký và đăng nhập
- Kiểm tra console browser (F12) để xem có lỗi hay không

## 3.6. Giám sát, bảo trì và cải tiến

### 3.6.1. Giám sát hiệu suất

| Chỉ số | Công cụ | Mục đích |
| --- | --- | --- |
| CPU, RAM | Htop, Glances | Giám sát tài nguyên server |
| Response time API | New Relic, DataDog | Đo độ chậm API |
| Lỗi ứng dụng | Sentry, LogRocket | Bắt lỗi runtime |
| Lưu lượng truy cập | Google Analytics | Thống kê người dùng |
| Database metrics | MongoDB Atlas | Truy vấn, kích thước dữ liệu |

### 3.6.2. Backup và phục hồi

Bước 1: Backup dữ liệu MongoDB:
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/expense_manager" --out ./backup
```

Bước 2: Lên lịch backup tự động hàng ngày (cron job):
```bash
0 2 * * * mongodump --uri="..." --out /backup/$(date +\%Y-\%m-\%d)
```

Bước 3: Phục hồi từ backup:
```bash
mongorestore --uri="..." ./backup/expense_manager
```

### 3.6.3. Quản lý log

- Lưu log của backend vào file:
  ```bash
  pm2 logs > /var/log/expense-api.log
  ```
- Sử dụng tool log aggregation (ELK Stack, Splunk) để xem log tập trung
- Xóa log cũ hơn 30 ngày để tiết kiệm dung lượng

### 3.6.4. Bảo mật liên tục

- Cập nhật Node.js, npm, MongoDB định kỳ
- Kiểm tra lỗ hổng bảo mật:
  ```bash
  npm audit
  npm audit fix
  ```
- Xoay key JWT mỗi 3-6 tháng
- Giám sát hoạt động bất thường (login từ IP lạ, số lần login thất bại)

### 3.6.5. Cải tiến dựa trên phản hồi

- Thu thập phản hồi từ người dùng thông qua form, email, hoặc hệ thống thông báo
- Phân tích log lỗi để phát hiện chức năng còn yếu
- Lập tờ roadmap cải tiến ưu tiên
- Phát hành bản update theo chu kỳ (hàng tháng, quý)

---

## Ghi chú

Báo cáo này được viết theo hướng cân bằng lý thuyết và thực tiễn, nhằm cung cấp nền tảng cho sinh viên và nhà phát triển hiểu sâu về quy trình phân tích, thiết kế, xây dựng và triển khai một hệ thống quản lý tài chính cá nhân. Phần mở rộng có thể bao gồm sơ đồ kiến trúc, UML chi tiết, biểu đồ dữ liệu, API specification, hoặc script triển khai tự động nếu cần tăng độ dài báo cáo.
