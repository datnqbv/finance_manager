# Thuyết Minh Demo Dự Án Quản Lý Chi Tiêu Cá Nhân

Tài liệu này được viết theo phong cách thuyết minh để bạn có thể đọc trực tiếp khi quay màn hình giới thiệu dự án. Nội dung đi từ tổng quan, kiến trúc, công nghệ, cho đến từng chức năng chính và cách diễn đạt khi demo.

## 1. Mở đầu thuyết minh

Xin chào thầy cô và mọi người. Hôm nay em xin giới thiệu dự án web quản lý chi tiêu cá nhân. Đây là một ứng dụng full-stack được xây dựng với mục tiêu giúp người dùng theo dõi dòng tiền một cách rõ ràng, kiểm soát ngân sách hiệu quả hơn, 

Điểm em muốn nhấn mạnh ở dự án này là: nó không chỉ dừng ở việc lưu giao dịch thu chi, mà còn mở rộng thành một hệ sinh thái quản lý tài chính cá nhân gồm ngân sách, mục tiêu tiết kiệm, khoản nợ, thống kê, tìm kiếm toàn cục, xuất báo cáo, và cơ chế xác thực an toàn.

Nếu nói ngắn gọn, đây là một ứng dụng được xây dựng để trả lời ba câu hỏi rất thực tế:

1. Tiền của mình đang đi đâu.
2. Mình còn lại bao nhiêu để chi tiêu.
3. Mình phải làm gì để tài chính cá nhân tốt lên theo thời gian.

## 2. Tổng quan dự án

Dự án được tổ chức theo kiến trúc tách biệt rõ ràng giữa frontend và backend.

- Frontend nằm trong thư mục `client`, được xây dựng bằng React kết hợp Vite và Tailwind CSS.
- Backend nằm trong thư mục `server`, sử dụng Node.js, Express và MongoDB với Mongoose.
- Luồng giao tiếp giữa hai bên được thực hiện thông qua REST API.
- Xác thực người dùng dùng JWT, kèm refresh token để tăng độ ổn định và trải nghiệm đăng nhập.

Về mặt nghiệp vụ, hệ thống bao gồm các phân hệ chính:

- Đăng ký, đăng nhập, quên mật khẩu, đăng nhập Google.
- Dashboard tổng quan tài chính.
- Quản lý giao dịch thu chi.
- Quản lý danh mục, ngân sách, mục tiêu tiết kiệm, công nợ.
- Thống kê, tìm kiếm toàn cục, nhập dữ liệu, xuất báo cáo.
- Hồ sơ người dùng, cài đặt giao diện, ngôn ngữ và trang quản trị dành cho admin.

## 3. Kiến trúc và triết lý thiết kế

### 3.1 Frontend

Frontend được xây dựng theo hướng component hóa và quản lý trạng thái tập trung bằng Context API. Cách làm này giúp giao diện không bị rối, dữ liệu giữa các màn hình được chia sẻ nhất quán, và việc mở rộng chức năng sau này trở nên dễ dàng hơn.

Các lớp chính của frontend gồm:

- Pages: các màn hình nghiệp vụ như Dashboard, Transactions, Budgets, Goals, Debts, Statistics, Login, Register, Profile.
- Components: các khối UI dùng lại như modal, search, pagination, loading skeleton, dark mode toggle, tooltip.
- Contexts: nơi quản lý auth, giao dịch, danh mục, ngân sách, mục tiêu, công nợ, theme, ngôn ngữ.
- Services: lớp gọi API, tách riêng logic giao tiếp với backend khỏi giao diện.

### 3.2 Backend

Backend được thiết kế theo mô hình MVC kết hợp middleware. Mục tiêu là tách rõ trách nhiệm:

- Routes nhận request và điều hướng.
- Controllers xử lý nghiệp vụ.
- Models định nghĩa cấu trúc dữ liệu MongoDB.
- Middleware xử lý xác thực, phân quyền và lỗi.

Thiết kế này giúp backend dễ đọc, dễ kiểm thử và dễ bảo trì khi số lượng chức năng tăng lên.

### 3.3 Cơ sở dữ liệu

MongoDB được chọn vì dữ liệu tài chính cá nhân có nhiều thực thể liên quan nhưng vẫn cần linh hoạt, ví dụ giao dịch, danh mục, ngân sách, mục tiêu, nợ, thông báo và người dùng.

Mongoose giúp định nghĩa schema rõ ràng, validate dữ liệu tốt hơn và triển khai các truy vấn tổng hợp phục vụ thống kê, dashboard, dự báo và phân tích.

## 4. Công nghệ sử dụng

### 4.1 Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Context API
- Recharts và Chart.js cho biểu đồ
- Framer Motion, GSAP cho hiệu ứng giao diện
- React Toastify cho thông báo
- jsPDF và xlsx cho xuất báo cáo
- Vitest và Testing Library cho kiểm thử giao diện

### 4.2 Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- nodemailer
- multer
- express-validator
- express-rate-limit
- Jest và Supertest cho kiểm thử API

## 5. Ý nghĩa nghiệp vụ của dự án

Em xây dựng dự án này với quan điểm rằng quản lý chi tiêu cá nhân không nên chỉ là ghi chép, mà phải là một quá trình ra quyết định.

Ví dụ:

- Khi người dùng nhập một giao dịch chi tiêu, hệ thống không chỉ lưu lại con số đó mà còn tự cập nhật tổng ngân sách, cảnh báo vượt mức, và phản ánh lên biểu đồ.
- Khi người dùng đặt mục tiêu tiết kiệm, hệ thống theo dõi tiến độ để họ nhìn thấy kết quả của việc tích lũy từng ngày.
- Khi người dùng có khoản nợ, hệ thống giúp họ theo dõi lịch thanh toán và trạng thái tất toán.
- Khi người dùng cần xem bức tranh tổng quát, dashboard và thống kê sẽ biến dữ liệu thô thành thông tin có ý nghĩa.

Nói cách khác, dự án biến dữ liệu tài chính thành công cụ hỗ trợ hành vi tài chính tốt hơn.

## 6. Luồng chạy tổng quát của ứng dụng

1. Người dùng mở trang landing và chọn đăng nhập hoặc đăng ký.
2. Sau khi đăng nhập thành công, hệ thống lưu token và thông tin người dùng.
3. Các trang nội bộ được bảo vệ bằng route guard.
4. Dashboard tải dữ liệu tổng quan, biểu đồ, giao dịch gần đây và dự báo.
5. Người dùng thao tác với giao dịch, danh mục, ngân sách, mục tiêu, nợ hoặc thống kê.
6. Mỗi thao tác đều đi qua service ở frontend, controller ở backend và model trong MongoDB.
7. Kết quả trả về ngay trên giao diện dưới dạng bảng, biểu đồ, progress bar hoặc thông báo.

## 7. Kịch bản thuyết minh khi demo

Phần này là phần quan trọng nhất nếu bạn quay video thuyết trình. Em có thể đọc theo thứ tự bên dưới.

### 7.1 Mở đầu video

“Trong phần demo này, em sẽ giới thiệu một ứng dụng web quản lý chi tiêu cá nhân được xây dựng theo kiến trúc full-stack. Mục tiêu của hệ thống là giúp người dùng theo dõi thu chi, kiểm soát ngân sách, đặt mục tiêu tiết kiệm và phân tích tình hình tài chính theo cách trực quan, dễ hiểu.”

“Dự án được phát triển bằng React ở frontend, Node.js và Express ở backend, sử dụng MongoDB làm cơ sở dữ liệu, kết hợp JWT để xác thực người dùng và nhiều chức năng hỗ trợ như biểu đồ, tìm kiếm toàn cục, xuất báo cáo, nhập dữ liệu và thông báo tự động.”

### 7.2 Trang đăng nhập và đăng ký

“Đầu tiên là khu vực xác thực người dùng. Hệ thống hỗ trợ đăng ký tài khoản mới, đăng nhập bằng email và mật khẩu, đồng thời có thể đăng nhập bằng Google. Điều này giúp tăng tính tiện lợi và rút ngắn thao tác cho người dùng.”

“Bên cạnh đó, ứng dụng còn có cơ chế quên mật khẩu qua email. Khi người dùng không nhớ mật khẩu, hệ thống sẽ gửi mã xác thực và cho phép đặt lại mật khẩu an toàn.”

“Phía sau giao diện đơn giản này là lớp bảo mật khá đầy đủ: mật khẩu được mã hóa bằng bcrypt, token đăng nhập được quản lý bằng JWT, và các trang riêng tư đều được bảo vệ bằng route guard.”

### 7.3 Dashboard tổng quan

“Sau khi đăng nhập thành công, người dùng được đưa đến Dashboard. Đây là trung tâm điều khiển của toàn bộ hệ thống.”

“Tại đây, em hiển thị các chỉ số quan trọng như số dư hiện tại, tổng thu chi trong tháng, giao dịch gần đây, biểu đồ xu hướng và cả dự báo chi tiêu cho tháng tiếp theo.”

“Ý nghĩa của Dashboard là biến dữ liệu rời rạc thành bức tranh tài chính tổng thể. Người dùng chỉ cần nhìn một màn hình là có thể biết ngay tình hình tài chính của mình đang tốt lên hay xấu đi.”

### 7.4 Quản lý giao dịch

“Tiếp theo là chức năng cốt lõi nhất: quản lý giao dịch thu và chi.”

“Người dùng có thể thêm, sửa, xóa, tìm kiếm và phân trang giao dịch. Mỗi giao dịch bao gồm loại giao dịch, số tiền, danh mục, ngày thực hiện và ghi chú.”

“Chức năng này rất quan trọng vì toàn bộ ngân sách, thống kê và cảnh báo đều dựa trên dữ liệu giao dịch. Khi dữ liệu giao dịch được nhập đúng, toàn bộ hệ thống tài chính phía sau mới vận hành chính xác.”

### 7.5 Quản lý danh mục

“Để dữ liệu trở nên có tổ chức hơn, hệ thống cho phép tạo và quản lý danh mục chi tiêu theo nhu cầu cá nhân.”

“Mỗi danh mục có thể có tên, icon và màu sắc riêng. Điều này giúp người dùng phân loại rõ tiền đang được dùng vào đâu, ví dụ ăn uống, đi lại, học tập, giải trí hay sinh hoạt.”

“Khi danh mục được cá nhân hóa, biểu đồ và báo cáo cũng trở nên dễ đọc hơn, và người dùng sẽ hiểu rõ thói quen tiêu dùng của mình.”

### 7.6 Quản lý ngân sách

“Một trong những tính năng rất quan trọng của dự án là quản lý ngân sách.”

“Người dùng có thể đặt ngân sách theo tuần, tháng hoặc năm, gắn với từng danh mục cụ thể hoặc theo tổng thể. Hệ thống sẽ tự động tính toán số tiền đã chi trong kỳ hiện tại và hiển thị tiến độ bằng thanh trạng thái.”

“Nếu người dùng chi tiêu gần chạm ngưỡng hoặc vượt ngưỡng ngân sách, hệ thống sẽ tạo cảnh báo. Đây là cơ chế hỗ trợ rất thực tế để người dùng không chi tiêu quá tay.”

### 7.7 Mục tiêu tiết kiệm

“Ngoài ngân sách, ứng dụng còn có chức năng mục tiêu tiết kiệm.”

“Người dùng có thể đặt ra một mục tiêu như mua laptop, du lịch, hay quỹ dự phòng, sau đó nạp thêm tiền theo thời gian. Hệ thống theo dõi tiến độ đạt mục tiêu và hiển thị phần trăm hoàn thành một cách trực quan.”

“Điểm hay của tính năng này là nó biến tiết kiệm thành một hành trình có mục tiêu rõ ràng, thay vì chỉ là những con số rời rạc.”

### 7.8 Quản lý công nợ

“Bên cạnh thu chi và tiết kiệm, dự án còn hỗ trợ quản lý công nợ.”

“Người dùng có thể ghi lại các khoản mình nợ người khác hoặc người khác nợ mình, theo dõi lịch thanh toán, ghi nhận số tiền đã trả và đánh dấu tất toán khi khoản nợ kết thúc.”

“Đây là một phần rất thực tế trong đời sống tài chính cá nhân, vì không phải ai cũng chỉ có giao dịch thu chi đơn thuần.”

### 7.9 Thống kê và phân tích

“Khi dữ liệu đã đủ, phần quan trọng tiếp theo là phân tích.”

“Trang thống kê của dự án sẽ tổng hợp dữ liệu theo thời gian, theo danh mục, theo xu hướng và theo mức độ so sánh giữa các kỳ. Nhờ đó người dùng không chỉ biết mình đã chi bao nhiêu, mà còn biết mình đang chi cho điều gì nhiều nhất và xu hướng đó thay đổi ra sao.”

“Phần này giúp dự án vượt ra khỏi mức ứng dụng nhập liệu thông thường, trở thành một công cụ ra quyết định dựa trên dữ liệu.”

### 7.10 Tìm kiếm toàn cục

“Để tăng tốc thao tác, hệ thống có ô tìm kiếm toàn cục.”

“Người dùng có thể tìm nhanh trong nhiều phân hệ như giao dịch, danh mục, ngân sách, mục tiêu và công nợ. Điều này đặc biệt hữu ích khi số lượng dữ liệu lớn, giúp người dùng không phải dò từng màn hình một.”

### 7.11 Nhập dữ liệu và xuất báo cáo

“Ứng dụng cũng hỗ trợ nhập dữ liệu từ file CSV hoặc Excel, rất phù hợp khi người dùng muốn đưa dữ liệu cũ vào hệ thống một lần thay vì nhập thủ công từng dòng.”

“Ngoài ra, hệ thống có thể xuất báo cáo ra PDF hoặc Excel. Đây là tính năng quan trọng khi cần lưu trữ, chia sẻ hoặc mang dữ liệu đi đối chiếu bên ngoài.”

### 7.12 Hồ sơ người dùng, theme và ngôn ngữ

“Người dùng có thể cập nhật hồ sơ cá nhân, đổi mật khẩu, tùy chỉnh giao diện sáng tối và thay đổi ngôn ngữ.”

“Mục tiêu của phần này là làm cho ứng dụng thân thiện hơn, phù hợp nhiều người dùng hơn và tạo cảm giác cá nhân hóa trong trải nghiệm.”

### 7.13 Trang quản trị

“Ngoài người dùng thông thường, hệ thống còn có khu vực admin.”

“Admin có thể xem tổng quan hệ thống, quản lý người dùng và xử lý các liên hệ từ phía người dùng. Điều này cho thấy hệ thống không chỉ phục vụ thao tác cá nhân mà còn có lớp vận hành và kiểm soát trung tâm.”

## 8. Giải thích theo góc nhìn kỹ thuật

Nếu bạn muốn thuyết minh theo kiểu kỹ thuật hơn một chút, có thể nói như sau:

“Frontend của dự án được tổ chức theo hướng component hóa, mỗi màn hình là một trang riêng, còn các khối giao diện dùng chung được tách thành component để tái sử dụng. Những dữ liệu cần dùng nhiều nơi như tài khoản, giao dịch, danh mục, ngân sách hay ngôn ngữ được quản lý bằng Context API để tránh truyền props quá sâu.”

“Backend được xây dựng theo mô hình REST API, trong đó mỗi chức năng chính có controller riêng. Cách tách này giúp dự án dễ mở rộng, dễ test và dễ bảo trì. MongoDB được dùng vì phù hợp với dữ liệu linh hoạt của tài chính cá nhân và hỗ trợ tốt các truy vấn tổng hợp cho dashboard và thống kê.”

“Về bảo mật, dự án dùng JWT để xác thực, refresh token để duy trì phiên đăng nhập, bcrypt để mã hóa mật khẩu và middleware để bảo vệ route. Điều này giúp hệ thống vừa tiện sử dụng vừa đảm bảo an toàn cơ bản cho dữ liệu người dùng.”

## 9. Điểm nổi bật của dự án

Nếu cần tóm tắt giá trị nổi bật, em có thể nhấn mạnh những điểm sau:

- Dự án giải quyết bài toán thực tế, không chỉ là demo giao diện.
- Có đầy đủ vòng đời dữ liệu: nhập, lưu, phân tích, cảnh báo, xuất báo cáo.
- Có nhiều phân hệ liên kết chặt chẽ với nhau.
- Có tư duy phân tầng rõ ràng giữa giao diện, service, controller và database.
- Có yếu tố bảo mật, kiểm thử và khả năng mở rộng.
- Giao diện hiện đại, có dark mode, đa ngôn ngữ và trải nghiệm thân thiện.

## 10. Kết bài thuyết minh

“Tổng kết lại, đây là một ứng dụng quản lý chi tiêu cá nhân được xây dựng với mục tiêu không chỉ lưu trữ dữ liệu tài chính, mà còn giúp người dùng hiểu dữ liệu đó, kiểm soát hành vi chi tiêu và ra quyết định tốt hơn.”

“Qua dự án này, em muốn thể hiện khả năng xây dựng một hệ thống full-stack hoàn chỉnh, từ kiến trúc frontend, backend, cơ sở dữ liệu cho đến xác thực, thống kê và trải nghiệm người dùng.”

“Em xin cảm ơn thầy cô và mọi người đã lắng nghe phần giới thiệu dự án của em.”

## 11. Gợi ý thứ tự demo khi quay màn hình

Nếu cần quay video, em có thể đi theo thứ tự sau để bài nói mạch lạc hơn:

1. Giới thiệu ngắn về mục tiêu dự án.
2. Mở trang landing và trình bày giao diện tổng thể.
3. Vào đăng nhập, đăng ký, quên mật khẩu.
4. Mở Dashboard và nói về tổng quan tài chính.
5. Chuyển sang giao dịch, danh mục, ngân sách, mục tiêu, công nợ.
6. Mở Statistics để nói về phân tích dữ liệu.
7. Mở tìm kiếm toàn cục, nhập dữ liệu, xuất báo cáo.
8. Nếu cần thì đi qua profile, theme, ngôn ngữ và trang admin.
9. Kết lại bằng phần nhấn mạnh giá trị của dự án.

## 12. Một phiên bản nói ngắn gọn hơn khi cần tốc độ

“Dự án này là một hệ thống quản lý chi tiêu cá nhân full-stack, cho phép người dùng đăng ký, đăng nhập, theo dõi giao dịch, quản lý danh mục, ngân sách, mục tiêu tiết kiệm và công nợ. Hệ thống còn hỗ trợ dashboard tổng quan, thống kê chuyên sâu, tìm kiếm toàn cục, import dữ liệu, export báo cáo, cùng các tính năng bảo mật như JWT, refresh token và quên mật khẩu qua email. Mục tiêu của dự án là giúp người dùng nhìn rõ dòng tiền, kiểm soát chi tiêu và ra quyết định tài chính dựa trên dữ liệu.”
