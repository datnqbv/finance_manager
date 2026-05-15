CHƯƠNG 1: TỔNG QUAN VỀ THỰC TẬP VÀ KHẢO SÁT DỰ ÁN

Chương này trình bày quá trình thực tập doanh nghiệp và cơ sở lý luận của bài toán quản lý chi tiêu cá nhân, các khái niệm nền tảng và các chức năng cốt lõi mà một hệ thống hoàn chỉnh cần đáp ứng. Thông qua quá trình thực tập tại CYBER-SOFT., JSC, bài toán được phát triển theo quy trình sản xuất phần mềm chuẩn và tiếp cận một cách khoa học, có hệ thống. Mục tiêu của chương là làm rõ vì sao bài toán quản lý tài chính cá nhân cần được số hóa, hệ thống hóa và tích hợp các cơ chế xác thực hiện đại như Google OAuth 2.0/SSO. Từ đó, chương 1 tạo nền tảng lý luận và thực tiễn cho các chương tiếp theo về thiết kế, triển khai và tích hợp hệ thống.

**Mục lục**
1.1. Quá trình thực tập
1.2. Khảo sát dự án
1.3. Tổng quan về hệ thống quản lý chi tiêu cá nhân
1.4. Yêu cầu của hệ thống
1.5. Ý tưởng giải pháp
1.6. Công nghệ nền
1.7. Kết luận chương

---

## 1.1. Quá trình thực tập

### 1.1.1. Giới thiệu tổng quan về công ty/doanh nghiệp

**Tên công ty:** CÔNG TY CỔ PHẦN PHẦN MỀM QUẢN TRỊ DOANH NGHIỆP

**Tên viết tắt:** CYBER-SOFT., JSC

**Thông tin cơ bản:**
- Ngày thành lập: 21/11/2003
- Mã số thuế: 0101419580
- Đại diện pháp luật: LÊ CẢNH TOÀN (Giám đốc điều hành)
- Địa chỉ trụ sở: Tầng 12A, Tòa nhà Sông Đà - Cầu Giấy, Số 18/165, Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Thành phố Hà Nội, Việt Nam
- Ngành nghề chính: Xuất bản phần mềm; Sản xuất, gia công phần mềm máy tính
- Loại hình doanh nghiệp: Công ty cổ phần ngoài nhà nước

**Tổng quan về doanh nghiệp:**

CYBER-SOFT., JSC là doanh nghiệp công nghệ được thành lập từ năm 2003, chuyên nghiên cứu, phát triển và cung cấp các giải pháp phần mềm quản trị doanh nghiệp và hệ thống hoạch định nguồn lực doanh nghiệp (ERP - Enterprise Resource Planning) dành cho các doanh nghiệp vừa và nhỏ (SME) tại Việt Nam.

Với hơn 20 năm kinh nghiệm hoạt động trong lĩnh vực xuất bản và sản xuất phần mềm, công ty đã xây dựng được uy tín vững chắc và triển khai thành công nhiều dự án cho khách hàng thuộc các lĩnh vực thương mại, sản xuất, dịch vụ và xây dựng trên toàn quốc. Các sản phẩm của công ty được thiết kế theo nguyên tắc "tinh gọn nhưng đầy đủ", phù hợp với nhu cầu quản lý của các doanh nghiệp quy mô vừa và nhỏ.

**Hình 1.1:** Logo công ty

---

### 1.1.2. Tìm hiểu quy trình tổ chức sản xuất sản phẩm phần mềm

Quy trình sản xuất phần mềm là một chuỗi các bước được tổ chức một cách khoa học nhằm phát triển một sản phẩm phần mềm đáp ứng nhu cầu của người dùng hoặc khách hàng. Quy trình này bao gồm từ việc thu thập yêu cầu, thiết kế, lập trình, kiểm thử đến triển khai và bảo trì sản phẩm.

Trong quá trình thực tập và tham gia dự án xây dựng hệ thống quản lý chi tiêu cá nhân tại CYBER-SOFT., JSC, sinh viên có cơ hội tiếp cận và tìm hiểu về quy trình tổ chức sản xuất phần mềm tại doanh nghiệp với các bước cơ bản như sau:

#### 1.1.2.1. Phân tích yêu cầu

Nhóm dự án thu thập yêu cầu từ khách hàng hoặc từ thị trường thông qua khảo sát thực tế và phỏng vấn người dùng tiềm năng. Trong trường hợp của hệ thống quản lý chi tiêu cá nhân, các yêu cầu chính bao gồm: khả năng ghi nhận giao dịch thu/chi, phân loại theo danh mục, theo dõi ngân sách, thống kê chi tiêu, quản lý mục tiêu tiết kiệm và xác thực an toàn. Kết quả được tổng hợp thành tài liệu SRS (Software Requirements Specification) làm cơ sở triển khai.

#### 1.1.2.2. Lập kế hoạch và thiết kế hệ thống

Nhóm lập kế hoạch phân công, tiến độ, các milestone chính và thiết kế hệ thống theo kiến trúc xác định. Đối với hệ thống này, kiến trúc client-server được lựa chọn với frontend (React + Vite), backend (Node.js + Express) và cơ sở dữ liệu (MongoDB). Giao diện được thiết kế trực quan dạng dashboard; xác thực được tích hợp Google OAuth 2.0/OIDC để giảm rào cản đăng ký và tăng độ tin cậy.

#### 1.1.2.3. Phát triển phần mềm

Phần mềm được lập trình theo ngôn ngữ và framework đã lựa chọn, triển khai theo phương pháp Agile/Scrum với các sprint hai tuần. Hệ thống được chia thành các module độc lập (quản lý giao dịch, quản lý danh mục, xác thực, thống kê) để dễ quản lý tiến độ và kiểm soát chất lượng. Mỗi sprint kết thúc với một increment có thể sử dụng được (working increment).

#### 1.1.2.4. Kiểm thử phần mềm

Phần mềm được kiểm thử chức năng (kiểm tra các giao dịch, báo cáo thống kê có chính xác không), kiểm thử tích hợp giữa frontend và backend, kiểm thử bảo mật (xác thực, phân quyền) và kiểm thử hiệu suất trên các điều kiện tải khác nhau. Các lỗi phát hiện được ghi nhận, ưu tiên và sửa đổi trước khi go-live.

#### 1.1.2.5. Triển khai và vận hành

Hệ thống được triển khai lên môi trường sản xuất, kèm theo đào tạo người dùng cuối, cấu hình theo yêu cầu cụ thể và hỗ trợ trong giai đoạn ban đầu. Quá trình này bao gồm chuẩn bị dữ liệu ban đầu (nếu có), cấu hình các thông số hệ thống và kiểm tra lần cuối trước khi chính thức phát hành.

#### 1.1.2.6. Bảo trì và nâng cấp

Sau khi đưa vào sử dụng, hệ thống được bảo trì định kỳ, cập nhật các lỗi (bug fixes) và bổ sung các yêu cầu mới từ người dùng. Các nâng cấp được lên kế hoạch dựa trên phản hồi người dùng và xu hướng công nghệ.

---

## 1.2. Khảo sát dự án

### 1.2.1. Vấn đề cần giải quyết

Trong bối cảnh công nghệ số phát triển mạnh mẽ, các hoạt động ghi chép, tổng hợp và theo dõi chi tiêu cá nhân ngày càng có xu hướng chuyển từ phương pháp thủ công sang các nền tảng phần mềm. Tuy nhiên, thực tế cho thấy nhiều người dùng vẫn quản lý tài chính bằng cách:

- Ghi nhớ hoặc ghi chú rời rạc trên điện thoại/giấy: đơn giản nhưng dễ quên, dễ xảy ra sai sót và khó tìm kiếm.
- Sử dụng bảng tính Excel/Google Sheets: có phần cải thiện nhưng vẫn phụ thuộc vào thao tác thủ công, yêu cầu người dùng có kỹ năng xây dựng công thức và biểu đồ.
- Các ứng dụng thương mại có sẵn: cung cấp tính năng đầy đủ nhưng có thể không phù hợp với ngữ cảnh và thói quen người dùng Việt, hoặc có hạn chế về các tính năng miễn phí.

Vấn đề cốt lõi không chỉ nằm ở việc "ghi lại bao nhiêu tiền đã tiêu", mà còn nằm ở khả năng hiểu được dòng tiền đi đâu, tiêu vào nhóm nào, theo xu hướng nào và có phù hợp với kế hoạch tài chính hay không. Bên cạnh đó, người dùng hiện đại còn đặt ra yêu cầu về sự tiện lợi trong đăng nhập, bảo mật tài khoản, khả năng đồng bộ dữ liệu và trải nghiệm sử dụng trên nhiều thiết bị.

Nếu hệ thống xác thực quá phức tạp, người dùng dễ bỏ cuộc; nếu hệ thống lưu trữ dữ liệu thiếu an toàn, người dùng sẽ mất niềm tin. Vì vậy, bài toán quản lý chi tiêu không còn là bài toán ghi chép đơn thuần mà đã trở thành một bài toán tích hợp giữa nghiệp vụ tài chính, trải nghiệm người dùng và an toàn thông tin.

### 1.2.2. Tại sao cần giải quyết vấn đề đó

Quản lý chi tiêu hiệu quả giúp mỗi người chủ động kiểm soát dòng tiền, phòng tránh rủi ro tài chính, đạt được mục tiêu tiết kiệm và nâng cao chất lượng cuộc sống. Cụ thể:

- **Kiểm soát chi tiêu:** Hiểu rõ chính xác chi tiêu vào đâu, từ đó có thể phát hiện các khoản chi không cần thiết và điều chỉnh hành vi.
- **Phòng tránh rủi ro:** Theo dõi ngân sách giúp tránh tình trạng chi tiêu vượt kế hoạch và các khoản nợ không kiểm soát.
- **Đạt mục tiêu tài chính:** Lập kế hoạch tiết kiệm và theo dõi tiến độ tăng khả năng thành công.
- **Bảo mật thông tin:** Số hóa dữ liệu và áp dụng các cơ chế xác thực hiện đại (SSO, OAuth) là yêu cầu cấp thiết trong thời đại số hóa để bảo vệ dữ liệu tài chính nhạy cảm.

Đặc biệt, một hệ thống quản lý chi tiêu hiệu quả cần giúp người dùng không chỉ lưu trữ dữ liệu mà còn nhìn thấy bức tranh tổng thể về hành vi tài chính của chính mình thông qua các biểu đồ, báo cáo và phân tích xu hướng. Đó là cơ sở để hình thành thói quen chi tiêu hợp lý, tăng mức độ kiểm soát tài chính và hạn chế tình trạng chi tiêu vượt kế hoạch.

### 1.2.3. Tổng quan về phương pháp/giải pháp sẽ sử dụng

Đề tài xây dựng hệ thống quản lý chi tiêu cá nhân trên nền tảng web, số hóa toàn bộ dữ liệu tài chính, chuẩn hóa quy trình theo dõi thu chi, tích hợp các chức năng phân tích, dự báo, bảo mật và xác thực hiện đại (như Google OAuth 2.0/SSO), nhằm giúp người dùng quản lý tài chính cá nhân một cách hiệu quả, an toàn và tiện lợi.

Hệ thống được xây dựng theo mô hình web hai tầng (client-server), trong đó:
- **Frontend:** Cung cấp giao diện trực quan, thao tác dễ dàng, phản hồi nhanh.
- **Backend:** Xử lý logic nghiệp vụ, quản lý xác thực, lưu trữ dữ liệu tập trung.
- **Xác thực:** Tích hợp Google OAuth 2.0/OpenID Connect để giảm rào cản đăng ký và tăng độ tin cậy.

Về bản chất, đây là một hệ thống thông tin quản lý (Management Information System - MIS) trong miền tài chính cá nhân, tích hợp các chức năng nhập liệu, lưu trữ, truy vấn, tổng hợp và trực quan hóa dữ liệu.

---

## 1.3. Tổng quan về hệ thống quản lý chi tiêu cá nhân

Hệ thống quản lý chi tiêu cá nhân là tập hợp các thành phần phần mềm cho phép người dùng ghi nhận, phân loại và kiểm soát các khoản thu - chi theo thời gian. Về mặt kiến trúc, hệ thống được xây dựng theo kiến trúc client-server với ba lớp dữ liệu:

- **Lớp dữ liệu:** Tổ chức dữ liệu tài chính dưới dạng giao dịch, danh mục, ngân sách, mục tiêu, khoản nợ.
- **Lớp nghiệp vụ:** Định nghĩa các quy tắc ràng buộc như hạn mức ngân sách, trạng thái thanh toán, tiến độ mục tiêu.
- **Lớp phân tích:** Rút trích tri thức từ dữ liệu thông qua thống kê mô tả, phân tích xu hướng và dự báo ngắn hạn.

### 1.3.1. Một số khái niệm cơ bản

#### 1.3.1.1. Dữ liệu giao dịch (Transaction Data)

Là đơn vị dữ liệu nguyên tử mô tả một lần phát sinh tài chính, bao gồm các thuộc tính chính như:
- Loại giao dịch (thu/chi)
- Giá trị tiền tệ
- Danh mục (category) phân loại
- Thời điểm phát sinh
- Ghi chú miêu tả

#### 1.3.1.2. Danh mục chi tiêu (Category)

Là cơ chế phân loại nghiệp vụ nhằm gom nhóm giao dịch có cùng ngữ nghĩa, ví dụ: ăn uống, đi lại, nhà ở, giải trí, học tập, y tế, giải trí. Danh mục tạo tiền đề cho thống kê theo chiều phân tích và giúp người dùng nhận diện xu hướng chi tiêu của từng lĩnh vực.

#### 1.3.1.3. Ngân sách (Budget)

Là mức giới hạn chi tiêu theo khoảng thời gian và theo phạm vi áp dụng (tổng thể hoặc theo danh mục). Về mặt kiểm soát, ngân sách đóng vai trò ngưỡng ràng buộc giúp phát hiện nguy cơ vượt chi và cảnh báo người dùng khi cần điều chỉnh hành vi chi tiêu.

#### 1.3.1.4. Mục tiêu tiết kiệm (Saving Goal)

Là giá trị tài chính đích mà người dùng mong muốn đạt được trong một thời hạn xác định. Mục tiêu giúp chuyển đổi hành vi tài chính từ phản ứng bị động sang hoạch định chủ động, ví dụ: tiết kiệm 10 triệu đồng trong 6 tháng để mua điện thoại mới.

#### 1.3.1.5. Khoản nợ (Debt)

Là nghĩa vụ tài chính cần thanh toán trong hiện tại hoặc tương lai. Quản lý nợ cho phép theo dõi trạng thái nợ cần thanh toán và tránh rủi ro mất cân đối dòng tiền.

#### 1.3.1.6. Chỉ báo tài chính

Bao gồm:
- Tổng thu thập (Total Income)
- Tổng chi tiêu (Total Expense)
- Số dư ròng (Net Balance)
- Tỷ lệ tiết kiệm (Savings Rate)
- Mức sử dụng ngân sách (Budget Usage)

Đây là các chỉ báo nền tảng để đánh giá sức khỏe tài chính và phát hiện các xu hướng dài hạn.

#### 1.3.1.7. Dự báo chi tiêu ngắn hạn

Là quá trình ước lượng giá trị chi tiêu tương lai dựa trên dữ liệu quá khứ. Trong phạm vi dự án, bài toán dự báo ngắn hạn được giải quyết bằng các phương pháp thống kê chuỗi thời gian như trung bình trượt và san bằng mũ đơn, giúp người dùng lên kế hoạch chi tiêu cho các kỳ tới.

### 1.3.2. Các chức năng của một hệ thống quản lý chi tiêu cá nhân

#### 1.3.2.1. Chức năng thu thập và chuẩn hóa dữ liệu

Chức năng này bảo đảm hệ thống có khả năng tiếp nhận dữ liệu từ nhiều nguồn đầu vào khác nhau như:
- Nhập liệu thủ công trực tiếp vào form
- Chỉnh sửa, cập nhật bản ghi hiện có
- Import từ tệp CSV/Excel
- Tích hợp với các nguồn dữ liệu bên ngoài (nếu có)

#### 1.3.2.2. Chức năng quản lý danh mục tài chính

Hệ thống cho phép người dùng:
- Tạo mới các danh mục tùy theo nhu cầu
- Cập nhật thông tin danh mục
- Vô hiệu hóa danh mục không còn sử dụng
- Tổ chức danh mục theo cấu trúc nghiệp vụ phù hợp với hành vi chi tiêu cá nhân

#### 1.3.2.3. Chức năng kiểm soát ngân sách

Chức năng kiểm soát ngân sách cho phép người dùng:
- Thiết lập các ngưỡng chi tiêu theo chu kỳ (tuần, tháng, quý)
- Thiết lập ngân sách cho từng danh mục cụ thể
- Nhận cảnh báo khi chi tiêu tiến gần đến giới hạn
- Theo dõi mức sử dụng ngân sách theo thời gian

#### 1.3.2.4. Chức năng quản lý mục tiêu và nợ

Đây là chức năng hỗ trợ lập kế hoạch tài chính trung và dài hạn thông qua hai cấu phần:
- **Mục tiêu tiết kiệm:** Xác định mục tiêu, theo dõi tiến độ, tính toán mức tiết kiệm cần thiết hàng tháng
- **Nghĩa vụ nợ:** Ghi nhận các khoản nợ phải trả, theo dõi trạng thái thanh toán, nhắc nhở hạn thanh toán

#### 1.3.2.5. Chức năng tìm kiếm và truy xuất thông tin

Khả năng truy xuất nhanh đóng vai trò quan trọng khi khối lượng giao dịch tăng theo thời gian. Chức năng này bao gồm:
- Tìm kiếm theo từ khóa (ghi chú, danh mục, người nhận)
- Lọc theo tiêu chí (ngày, khoảng giá tiền, loại giao dịch)
- Sắp xếp kết quả theo nhiều cách khác nhau
- Xuất dữ liệu tìm kiếm ra báo cáo

#### 1.3.2.6. Chức năng thống kê và trực quan hóa

Chức năng thống kê chuyển đổi dữ liệu giao dịch thành các chỉ số định lượng và biểu đồ trực quan:
- Biểu đồ tròn (pie chart) phân bổ chi tiêu theo danh mục
- Biểu đồ cột (bar chart) so sánh chi tiêu giữa các kỳ
- Biểu đồ đường (line chart) xu hướng chi tiêu theo thời gian
- Bảng tóm tắt các chỉ báo chính (tổng thu, tổng chi, số dư ròng, tỷ lệ tiết kiệm)

#### 1.3.2.7. Chức năng dự báo và hỗ trợ quyết định

Dựa trên chuỗi dữ liệu lịch sử, hệ thống áp dụng các phương pháp thống kê để:
- Ước lượng xu hướng thu chi trong kỳ kế tiếp
- Dự báo mức chi tiêu theo danh mục
- Cảnh báo nếu xu hướng có khả năng vượt ngân sách
- Gợi ý các chiến lược tiết kiệm dựa trên dữ liệu

#### 1.3.2.8. Chức năng bảo mật và xác thực

Do dữ liệu tài chính cá nhân có tính nhạy cảm cao, chức năng bảo mật là yêu cầu nền tảng của toàn hệ thống:
- Xác thực người dùng thông qua Google OAuth 2.0/OIDC
- Mã hóa dữ liệu nhạy cảm trong transit và at-rest
- Phân quyền truy cập dữ liệu dựa trên danh tính người dùng
- Ghi nhận lịch sử hoạt động (audit log) cho các thao tác quan trọng
- Kiểm soát phiên đăng nhập và token expiration

---

## 1.4. Yêu cầu của hệ thống

Từ phân tích trên, có thể tổng hợp yêu cầu của hệ thống thành hai nhóm lớn: yêu cầu nghiệp vụ và yêu cầu kỹ thuật.

**Yêu cầu nghiệp vụ** bao gồm:
- Cho phép người dùng tạo và quản lý tài khoản
- Đăng nhập an toàn thông qua Google SSO
- Ghi nhận giao dịch thu, chi, chuyển khoản
- Xem thống kê chi tiêu theo nhiều chiều (danh mục, thời gian, trạng thái)
- Quản lý ngân sách theo chu kỳ
- Theo dõi mục tiêu tài chính và khoản nợ
- Tìm kiếm, lọc và xuất dữ liệu theo điều kiện
- Hỗ trợ dự báo ngắn hạn cho chi tiêu tương lai

**Yêu cầu phi chức năng** bao gồm:
- **Tính dễ sử dụng:** Giao diện rõ ràng, trực quan, thao tác nhanh, không cần huấn luyện phức tạp
- **Tính an toàn:** Bảo vệ tài khoản người dùng, mã hóa dữ liệu, kiểm soát truy cập, ghi nhận audit log
- **Tính sẵn sàng:** Hoạt động ổn định trên web, độ tin cậy cao, có khả năng mở rộng sau này
- **Tính mở rộng:** Dễ bổ sung thêm chức năng mới như mục tiêu tài chính, nhắc nhở, đồng bộ đa thiết bị
- **Tính bảo trì:** Mã nguồn tách lớp rõ ràng, dễ sửa đổi, dễ phát triển thêm, có tài liệu kỹ thuật

---

## 1.5. Ý tưởng giải pháp

Ý tưởng chính của hệ thống là xây dựng một ứng dụng quản lý chi tiêu cá nhân theo mô hình web hai tầng (client-server), trong đó frontend chịu trách nhiệm giao diện và tương tác người dùng, còn backend chịu trách nhiệm xử lý nghiệp vụ, lưu trữ dữ liệu và xác thực token. Cách tiếp cận này cho phép tách biệt rõ phần hiển thị với phần xử lý, giúp hệ thống dễ mở rộng, dễ bảo trì và phù hợp với mô hình phát triển hiện đại.

**Về nghiệp vụ tài chính:**

Hệ thống cần cho phép người dùng tạo các giao dịch thu chi và quản lý các thông tin liên quan như ngày giao dịch, số tiền, danh mục, ghi chú và trạng thái. Từ dữ liệu đó, hệ thống có thể tổng hợp thành các biểu đồ, bảng thống kê và báo cáo ngắn hạn hoặc dài hạn. Đây là cơ sở để người dùng nhận biết thói quen chi tiêu, xác định khoản mục chiếm tỷ trọng lớn và điều chỉnh hành vi tài chính.

**Về xác thực:**

Thay vì tự xây dựng một cơ chế đăng nhập riêng từ đầu, hệ thống tích hợp Google OAuth 2.0 kết hợp OpenID Connect để người dùng có thể sử dụng tài khoản Google hiện có. Cách tiếp cận này giúp:
- Giảm công sức tạo tài khoản và bảo trì mật khẩu
- Giảm số lần nhập mật khẩu (single sign-on)
- Tăng độ tin cậy của quá trình xác thực
- Tận dụng cơ sở hạ tầng bảo mật của Google

Sau khi Google xác thực thành công, backend của hệ thống sẽ tiếp nhận ID Token, kiểm tra tính hợp lệ, liên kết với người dùng hiện có hoặc tạo người dùng mới, và cấp JWT token nội bộ cho phiên đăng nhập.

**Về trải nghiệm:**

Ý tưởng giải pháp hướng tới việc giảm tối đa các thao tác không cần thiết. Người dùng không phải nhớ nhiều mật khẩu, không phải lặp lại bước đăng nhập ở mỗi lần truy cập, và có thể chuyển thẳng vào các chức năng chính của hệ thống. Sự liền mạch này là yếu tố quan trọng trong việc thúc đẩy người dùng sử dụng lâu dài.

---

## 1.6. Công nghệ nền

Việc lựa chọn công nghệ nền là một bước quan trọng vì nó ảnh hưởng trực tiếp đến hiệu năng, khả năng mở rộng và tính ổn định của toàn bộ hệ thống. Đề tài sử dụng nhóm công nghệ phổ biến của ứng dụng web hiện đại, đảm bảo tính thực tiễn, khả năng tìm kiếm giải pháp trực tuyến và phù hợp với kiến trúc tách lớp.

**Frontend:**

Frontend được xây dựng bằng React kết hợp Vite. React cung cấp mô hình component hóa rõ ràng, dễ tái sử dụng và phù hợp với các giao diện có nhiều trạng thái như dashboard, form nhập liệu, biểu đồ, modal và thông báo. Vite hỗ trợ môi trường phát triển nhanh, thời gian khởi động ngắn và khả năng build tối ưu cho ứng dụng hiện đại. Bên cạnh đó, Tailwind CSS được sử dụng để tăng tốc quá trình thiết kế UI, cung cấp một bộ utility classes có thể tái sử dụng. Thư viện @react-oauth/google được tích hợp để hỗ trợ Google OAuth 2.0 login button.

**Backend:**

Backend được xây dựng bằng Node.js và Express. Node.js phù hợp với các ứng dụng web cần xử lý nhiều request bất đồng bộ với hiệu suất cao, trong khi Express cung cấp một khung công việc nhẹ, linh hoạt để tổ chức các route, middleware và controller theo cách đơn giản, rõ ràng. Với các nghiệp vụ như xác thực, quản lý giao dịch và thống kê, Express cung cấp đủ linh hoạt để mở rộng theo từng module chức năng.

**Cơ sở dữ liệu:**

Cơ sở dữ liệu được lựa chọn là MongoDB do đặc tính linh hoạt của mô hình tài liệu. Dữ liệu tài chính cá nhân thường bao gồm nhiều trường thông tin có thể thay đổi theo tính năng, chẳng hạn giao dịch, danh mục, mục tiêu, ngân sách, thông báo hay thông tin người dùng. MongoDB cho phép lưu trữ các đối tượng này dưới dạng document JSON, thuận lợi cho việc mở rộng schema và phát triển nhanh trong giai đoạn đầu.

**Xác thực:**

Hệ thống tích hợp Google OAuth 2.0 kết hợp OpenID Connect để tận dụng cơ chế SSO an toàn và phổ biến. Ngoài ra, JWT (JSON Web Tokens) được sử dụng cho token nội bộ giúp backend quản lý phiên đăng nhập theo cách nhẹ, dễ kiểm tra và phù hợp với kiến trúc REST API.

**Công cụ và thư viện hỗ trợ:**

- **axios:** Cho gọi API từ frontend đến backend
- **react-router-dom:** Cho điều hướng giữa các trang trong SPA
- **chart.js / recharts:** Cho vẽ biểu đồ thống kê
- **express-jwt / jsonwebtoken:** Cho kiểm tra và phát hành JWT trên backend
- **dotenv:** Cho quản lý biến môi trường
- **cors:** Cho xử lý CORS (Cross-Origin Resource Sharing)
- **passport / passport-google-oauth20:** Cho tích hợp Google OAuth (nếu sử dụng Passport strategy)

---

## 1.7. Kết luận chương

Chương 1 đã trình bày quá trình thực tập tại CYBER-SOFT., JSC, bối cảnh hình thành đề tài, khảo sát hiện trạng, phân tích bài toán, xác định yêu cầu hệ thống, đề xuất ý tưởng giải pháp và lựa chọn công nghệ nền phù hợp. Thông qua quy trình sản xuất phần mềm chuẩn với các bước phân tích, thiết kế, phát triển, kiểm thử, triển khai và bảo trì, sinh viên có cơ hội tiếp cận thực tiễn của ngành phần mềm.

Từ các phân tích trên có thể thấy rằng bài toán quản lý chi tiêu cá nhân không chỉ là bài toán lưu dữ liệu mà còn là bài toán tổ chức quy trình, hiển thị thông tin, hỗ trợ quyết định và xác thực an toàn. Việc lựa chọn Google OAuth 2.0 cho đăng nhập, kết hợp với kiến trúc frontend - backend - database tách lớp, giúp hệ thống vừa đáp ứng yêu cầu sử dụng thực tế vừa có nền tảng kỹ thuật rõ ràng để phát triển các chức năng nâng cao ở các chương sau.

Chương tiếp theo (Chương 2) sẽ trình bày chi tiết về cách thức tích hợp Google OAuth 2.0/SSO vào hệ thống, bao gồm kiến trúc xác thực, quy trình đăng nhập, quản lý token và các biện pháp bảo mật liên quan. Đây là cơ sở kỹ thuật quan trọng để hiểu rõ về cơ chế xác thực hiện đại và cách áp dụng vào thực tiễn phát triển phần mềm.

Trong bối cảnh công nghệ số phát triển mạnh mẽ, các hoạt động ghi chép, tổng hợp và theo dõi chi tiêu cá nhân ngày càng có xu hướng chuyển từ phương pháp thủ công sang các nền tảng phần mềm. Tuy nhiên, thực tế cho thấy nhiều người dùng vẫn quản lý tài chính bằng cách ghi nhớ, ghi chú rời rạc, dùng bảng tính đơn giản hoặc thậm chí không lưu lại lịch sử giao dịch. Cách làm này có ưu điểm là dễ bắt đầu, nhưng lại bộc lộ nhiều hạn chế khi khối lượng giao dịch tăng lên, khi cần thống kê theo thời gian hoặc khi muốn đối chiếu với mục tiêu tài chính cá nhân.

Vấn đề cốt lõi không chỉ nằm ở việc "ghi lại bao nhiêu tiền đã tiêu", mà còn nằm ở khả năng hiểu được dòng tiền đi đâu, tiêu vào nhóm nào, theo xu hướng nào và có phù hợp với kế hoạch tài chính hay không. Một hệ thống quản lý chi tiêu hiệu quả cần giúp người dùng không chỉ lưu trữ dữ liệu mà còn nhìn thấy bức tranh tổng thể về hành vi tài chính của chính mình. Đó là cơ sở để hình thành thói quen chi tiêu hợp lý, tăng mức độ kiểm soát tài chính và hạn chế tình trạng chi tiêu vượt kế hoạch.

Bên cạnh nhu cầu quản lý chi tiêu, người dùng hiện đại còn đặt ra yêu cầu về sự tiện lợi trong đăng nhập, bảo mật tài khoản, khả năng đồng bộ dữ liệu và trải nghiệm sử dụng trên nhiều thiết bị. Nếu hệ thống xác thực quá phức tạp, người dùng dễ bỏ cuộc; nếu hệ thống lưu trữ dữ liệu thiếu an toàn, người dùng sẽ mất niềm tin. Vì vậy, bài toán quản lý chi tiêu không còn là bài toán ghi chép đơn thuần mà đã trở thành một bài toán tích hợp giữa nghiệp vụ tài chính, trải nghiệm người dùng và an toàn thông tin.

1.2. Khảo sát hệ thống hiện tại

Để xác định rõ nhu cầu thực tế, cần khảo sát các hình thức quản lý chi tiêu đang được sử dụng phổ biến hiện nay. Có thể nhận thấy hệ thống hiện tại thường rơi vào một trong ba nhóm chính: ghi chép thủ công trên giấy hoặc ghi chú điện thoại, sử dụng bảng tính như Excel/Google Sheets, hoặc dùng các ứng dụng quản lý chi tiêu có sẵn trên thị trường. Mỗi cách tiếp cận đều có ưu điểm và hạn chế riêng.

Ghi chép thủ công là phương pháp đơn giản nhất nhưng nhanh chóng bộc lộ giới hạn. Người dùng có thể ghi lại một vài khoản chi trong ngày, nhưng khi dữ liệu tăng lên thì việc tìm kiếm, tổng hợp và thống kê trở nên khó khăn. Cách này cũng rất dễ xảy ra sai sót do quên ghi, ghi thiếu hoặc nhập sai số tiền. Ngoài ra, dữ liệu phân tán trên nhiều mẩu ghi chú khiến việc phân tích dài hạn gần như không khả thi.

Sử dụng bảng tính giúp cải thiện khả năng lưu trữ và tính toán, nhưng vẫn phụ thuộc nhiều vào thao tác thủ công. Người dùng phải tự nhập dữ liệu, tự xây dựng công thức, tự phân loại giao dịch và tự tạo biểu đồ nếu muốn phân tích. Hơn nữa, bảng tính phù hợp hơn với người dùng có kỹ năng thao tác dữ liệu, trong khi nhiều người dùng phổ thông cần một giao diện trực quan, dễ dùng và ít phải cấu hình.

Các ứng dụng thương mại hiện có thường cung cấp đầy đủ tính năng, nhưng lại có thể gặp những vấn đề như giao diện chưa phù hợp với thói quen người dùng địa phương, thiếu khả năng tùy biến, giới hạn một số tính năng miễn phí hoặc không đồng bộ tốt với ngữ cảnh sử dụng cá nhân của người Việt. Ngoài ra, một số người dùng còn e ngại việc chia sẻ dữ liệu tài chính với bên thứ ba nếu chưa hiểu rõ cơ chế bảo mật và lưu trữ.

Từ khảo sát trên có thể rút ra nhận xét rằng nhu cầu của người dùng không chỉ là ghi nhận chi tiêu, mà còn là một hệ thống số hóa có khả năng quản lý tập trung, thống kê tự động, hỗ trợ xác thực an toàn và thân thiện với người dùng cuối. Đây chính là khoảng trống mà đề tài hướng tới để giải quyết.

1.3. Phân tích bài toán

Bài toán quản lý chi tiêu cá nhân có thể được nhìn nhận như một bài toán quản lý dữ liệu nghiệp vụ với yêu cầu cao về tính chính xác, tính thuận tiện và tính bảo mật. Người dùng cần có khả năng tạo tài khoản, đăng nhập, ghi nhận các khoản thu chi, phân loại giao dịch, đặt mục tiêu tài chính, theo dõi ngân sách, xem thống kê và truy xuất lịch sử giao dịch theo nhiều tiêu chí khác nhau.

Về mặt chức năng, hệ thống cần đảm bảo các nghiệp vụ cơ bản sau:
- Quản lý người dùng và xác thực đăng nhập.
- Ghi nhận giao dịch thu, chi, chuyển khoản hoặc các khoản nợ nếu cần.
- Phân loại giao dịch theo danh mục, ví dụ ăn uống, di chuyển, học tập, giải trí.
- Theo dõi ngân sách và cảnh báo khi vượt giới hạn.
- Thống kê theo thời gian, danh mục và xu hướng chi tiêu.
- Tìm kiếm, lọc và xuất dữ liệu theo điều kiện.

Về mặt phi chức năng, hệ thống cần đáp ứng các yêu cầu như:
- Tính dễ sử dụng: giao diện rõ ràng, thao tác nhanh.
- Tính an toàn: bảo vệ tài khoản và dữ liệu người dùng.
- Tính sẵn sàng: hoạt động ổn định trên web và có thể mở rộng sau này.
- Tính mở rộng: dễ bổ sung thêm chức năng như mục tiêu tài chính, nhắc nhở, đồng bộ đa thiết bị.
- Tính bảo trì: mã nguồn tách lớp, dễ sửa đổi và phát triển.

Trong bài toán này, xác thực người dùng là điểm bắt đầu quan trọng. Nếu hệ thống phải bắt người dùng tự tạo và ghi nhớ một mật khẩu mới, trải nghiệm ban đầu có thể giảm đi đáng kể. Trong khi đó, việc sử dụng Google OAuth 2.0 giúp giảm rào cản đăng ký, tận dụng danh tính sẵn có và giảm khối lượng xử lý mật khẩu trong chính ứng dụng. Vì vậy, bài toán xác thực không phải là phần phụ mà là một phần trung tâm của kiến trúc hệ thống.

1.4. Yêu cầu của hệ thống

Từ phân tích trên, có thể tổng hợp yêu cầu của hệ thống thành hai nhóm lớn: yêu cầu nghiệp vụ và yêu cầu kỹ thuật.

Yêu cầu nghiệp vụ bao gồm việc cho phép người dùng tạo và quản lý tài khoản, đăng nhập an toàn, ghi nhận giao dịch, xem thống kê chi tiêu, quản lý ngân sách và theo dõi mục tiêu tài chính. Hệ thống phải hỗ trợ nhiều nhóm dữ liệu khác nhau nhưng vẫn đảm bảo tính nhất quán trong quá trình nhập liệu và truy xuất.

Yêu cầu kỹ thuật bao gồm khả năng chạy trên môi trường web hiện đại, giao diện phản hồi nhanh, cấu trúc tách biệt giữa frontend và backend, lưu trữ dữ liệu tập trung và tích hợp cơ chế xác thực Google SSO. Ngoài ra, hệ thống cần có khả năng triển khai trên môi trường phát triển lẫn sản xuất, có thể cấu hình biến môi trường linh hoạt và phù hợp với mô hình SPA hiện đại.

Trong bối cảnh đó, giải pháp không chỉ cần giải quyết "lưu dữ liệu" mà còn phải giải quyết "quản lý danh tính" và "truy cập an toàn". Điều này dẫn đến quyết định lựa chọn một kiến trúc web hiện đại, kết hợp React ở frontend, Node.js/Express ở backend, MongoDB làm cơ sở dữ liệu và Google OAuth 2.0/OIDC làm nền tảng xác thực.

1.5. Ý tưởng giải pháp

Ý tưởng chính của hệ thống là xây dựng một ứng dụng quản lý chi tiêu cá nhân theo mô hình web hai tầng, trong đó frontend chịu trách nhiệm giao diện và tương tác người dùng, còn backend chịu trách nhiệm xử lý nghiệp vụ, lưu trữ dữ liệu và xác thực token. Cách tiếp cận này cho phép tách biệt rõ phần hiển thị với phần xử lý, giúp hệ thống dễ mở rộng, dễ bảo trì và phù hợp với mô hình phát triển hiện đại.

Về nghiệp vụ tài chính, hệ thống cần cho phép người dùng tạo các giao dịch thu chi và quản lý các thông tin liên quan như ngày giao dịch, số tiền, danh mục, ghi chú và trạng thái. Từ dữ liệu đó, hệ thống có thể tổng hợp thành các biểu đồ, bảng thống kê và báo cáo ngắn hạn hoặc dài hạn. Đây là cơ sở để người dùng nhận biết thói quen chi tiêu, xác định khoản mục chiếm tỷ trọng lớn và điều chỉnh hành vi tài chính.

Về xác thực, thay vì tự xây dựng một cơ chế đăng nhập riêng từ đầu, hệ thống tích hợp Google SSO để người dùng có thể sử dụng tài khoản Google hiện có. Cách tiếp cận này giúp giảm công sức tạo tài khoản, giảm số lần nhập mật khẩu và tăng độ tin cậy của quá trình xác thực. Sau khi Google xác thực thành công, backend của hệ thống sẽ tiếp nhận ID Token, kiểm tra tính hợp lệ và tạo phiên đăng nhập nội bộ cho người dùng.

Về mặt trải nghiệm, ý tưởng giải pháp hướng tới việc giảm tối đa các thao tác không cần thiết. Người dùng không phải nhớ nhiều mật khẩu, không phải lặp lại bước đăng nhập ở mỗi lần truy cập, và có thể chuyển thẳng vào các chức năng chính của hệ thống. Sự liền mạch này là yếu tố quan trọng trong việc thúc đẩy người dùng sử dụng lâu dài.

1.6. Công nghệ nền

Việc lựa chọn công nghệ nền là một bước quan trọng vì nó ảnh hưởng trực tiếp đến hiệu năng, khả năng mở rộng và tính ổn định của toàn bộ hệ thống. Đề tài sử dụng nhóm công nghệ phổ biến của ứng dụng web hiện đại, đảm bảo tính thực tiễn và phù hợp với kiến trúc tách lớp.

Frontend được xây dựng bằng React kết hợp Vite. React cung cấp mô hình component hóa rõ ràng, dễ tái sử dụng và phù hợp với các giao diện có nhiều trạng thái như dashboard, form nhập liệu, biểu đồ và modal. Vite hỗ trợ môi trường phát triển nhanh, thời gian khởi động ngắn và khả năng build tối ưu cho ứng dụng hiện đại. Bên cạnh đó, Tailwind CSS hoặc các thư viện giao diện tương đương có thể được sử dụng để tăng tốc quá trình thiết kế UI.

Backend được xây dựng bằng Node.js và Express. Node.js phù hợp với các ứng dụng web cần xử lý nhiều request bất đồng bộ, trong khi Express giúp tổ chức các route, middleware và controller theo cách đơn giản, rõ ràng. Với các nghiệp vụ như xác thực, quản lý giao dịch và thống kê, Express cung cấp đủ linh hoạt để mở rộng theo từng module chức năng.

Cơ sở dữ liệu được lựa chọn là MongoDB do đặc tính linh hoạt của mô hình tài liệu. Dữ liệu tài chính cá nhân thường bao gồm nhiều trường thông tin có thể thay đổi theo tính năng, chẳng hạn giao dịch, danh mục, mục tiêu, ngân sách, thông báo hay thông tin người dùng. MongoDB cho phép lưu trữ các đối tượng này dưới dạng document, thuận lợi cho việc mở rộng schema và phát triển nhanh trong giai đoạn đầu.

Về xác thực, hệ thống tích hợp Google OAuth 2.0 kết hợp OpenID Connect để tận dụng cơ chế SSO an toàn và phổ biến. Ngoài ra, việc dùng JWT cho token nội bộ giúp backend quản lý phiên đăng nhập theo cách nhẹ, dễ kiểm tra và phù hợp với kiến trúc REST API.

Về công cụ hỗ trợ, hệ thống có thể sử dụng các thư viện như axios cho gọi API, react-router-dom cho điều hướng, chart libraries cho biểu đồ thống kê, và các middleware bảo mật trên backend để kiểm soát truy cập. Những công nghệ này không chỉ phục vụ tính năng mà còn giúp hệ thống dễ bảo trì trong dài hạn.

1.7. Kết luận chương

Chương 1 đã trình bày bối cảnh hình thành đề tài, khảo sát hiện trạng, phân tích bài toán, xác định yêu cầu hệ thống, đề xuất ý tưởng giải pháp và lựa chọn công nghệ nền phù hợp. Từ các phân tích này có thể thấy rằng bài toán quản lý chi tiêu cá nhân không chỉ là bài toán lưu dữ liệu mà còn là bài toán tổ chức quy trình, hiển thị thông tin và xác thực an toàn.

Việc lựa chọn Google OAuth 2.0 cho đăng nhập, kết hợp với kiến trúc frontend - backend - database tách lớp, giúp hệ thống vừa đáp ứng yêu cầu sử dụng thực tế vừa có nền tảng kỹ thuật rõ ràng để phát triển các chức năng nâng cao ở các chương sau. Đây là cơ sở để chuyển sang phần thiết kế, triển khai và tích hợp hệ thống một cách có hệ thống và nhất quán.
