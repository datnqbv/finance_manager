


# CHƯƠNG 1: TỔNG QUAN VỀ QUẢN LÝ CHI TIÊU CÁ NHÂN

1.1. Đặt vấn đề
1.1.1. Vấn đề cần giải quyết
Trong bối cảnh hiện đại, nhiều cá nhân gặp khó khăn trong việc kiểm soát thu chi, phân loại chi tiêu, đặt mục tiêu tiết kiệm và đảm bảo an toàn thông tin tài chính cá nhân. Việc quản lý tài chính cá nhân bằng phương pháp thủ công hoặc các công cụ rời rạc thường thiếu hiệu quả, dễ sai sót và không đáp ứng được nhu cầu phân tích, dự báo.
1.1.2. Tại sao cần giải quyết vấn đề đó
Quản lý chi tiêu hiệu quả giúp mỗi người chủ động kiểm soát dòng tiền, phòng tránh rủi ro tài chính, đạt được mục tiêu tiết kiệm và nâng cao chất lượng cuộc sống. Ngoài ra, bảo mật thông tin cá nhân là yêu cầu cấp thiết trong thời đại số hóa.
1.1.3. Tổng quan về phương pháp/giải pháp sẽ sử dụng
Đề tài xây dựng hệ thống quản lý chi tiêu cá nhân trên nền tảng web, số hóa toàn bộ dữ liệu tài chính, chuẩn hóa quy trình theo dõi thu chi, tích hợp các chức năng phân tích, dự báo, bảo mật và xác thực hiện đại (như Google OAuth 2.0/SSO), giúp người dùng quản lý tài chính cá nhân một cách hiệu quả, an toàn và tiện lợi.
Hệ thống quản lý chi tiêu cá nhân trên nền tảng web ra đời nhằm giải quyết các vấn đề trên thông qua việc số hóa dữ liệu tài chính, chuẩn hóa quy trình theo dõi thu chi, và cung cấp các công cụ phân tích hỗ trợ ra quyết định. Về bản chất, đây là một hệ thống thông tin quản lý (Management Information System - MIS) trong miền tài chính cá nhân, tích hợp các chức năng nhập liệu, lưu trữ, truy vấn, tổng hợp và trực quan hóa dữ liệu.
Chương này trình bày cơ sở lý luận của bài toán quản lý chi tiêu cá nhân, các khái niệm nền tảng và các chức năng cốt lõi mà một hệ thống hoàn chỉnh cần đáp ứng.
1.2. Tổng quan về hệ thống quản lý chi tiêu cá nhân và vấn đề xác thực
Hệ thống quản lý chi tiêu cá nhân là tập hợp các thành phần phần mềm cho phép người dùng ghi nhận, phân loại và kiểm soát các khoản thu - chi theo thời gian. Mục tiêu chính của hệ thống không chỉ dừng ở việc lưu trữ dữ liệu, mà còn hỗ trợ người dùng nâng cao năng lực quản trị tài chính thông qua các chỉ báo định lượng và đảm bảo an toàn thông tin cá nhân.
Về mặt học thuật, bài toán quản lý chi tiêu có thể được nhìn nhận ở ba lớp:
- Lớp dữ liệu: tổ chức dữ liệu tài chính dưới dạng giao dịch, danh mục, ngân sách, mục tiêu, khoản nợ.
- Lớp nghiệp vụ: định nghĩa các quy tắc ràng buộc như hạn mức ngân sách, trạng thái thanh toán, tiến độ mục tiêu.
- Lớp phân tích: rút trích tri thức từ dữ liệu thông qua thống kê mô tả, phân tích xu hướng và dự báo ngắn hạn.
Trong dự án này, hệ thống được xây dựng theo kiến trúc client-server, trong đó phía frontend đảm nhiệm tương tác người dùng, phía backend cung cấp API nghiệp vụ và lớp dữ liệu chịu trách nhiệm lưu trữ bền vững. Đặc biệt, hệ thống chú trọng triển khai các giải pháp xác thực hiện đại, bảo vệ dữ liệu tài chính cá nhân khỏi các rủi ro mất mát, đánh cắp, đồng thời đơn giản hóa quá trình đăng nhập cho người dùng.
1.2.1. Một số khái niệm cơ bản
1.2.1.1. Dữ liệu giao dịch (Transaction Data):
Là đơn vị dữ liệu nguyên tử mô tả một lần phát sinh tài chính, bao gồm các thuộc tính chính như loại giao dịch (thu/chi), giá trị tiền tệ, danh mục, thời điểm và ghi chú.
1.2.1.2. Danh mục chi tiêu (Category):
Là cơ chế phân loại nghiệp vụ nhằm gom nhóm giao dịch có cùng ngữ nghĩa, ví dụ: ăn uống, đi lại, nhà ở, giải trí. Danh mục tạo tiền đề cho thống kê theo chiều phân tích.
1.2.1.3. Ngân sách (Budget):
Là mức giới hạn chi tiêu theo khoảng thời gian và theo phạm vi áp dụng (tổng thể hoặc theo danh mục). Về mặt kiểm soát, ngân sách đóng vai trò ngưỡng ràng buộc giúp phát hiện nguy cơ vượt chi.
1.2.1.4. Mục tiêu tiết kiệm (Saving Goal):
Là giá trị tài chính đích mà người dùng mong muốn đạt được trong một thời hạn xác định. Mục tiêu giúp chuyển đổi hành vi tài chính từ phản ứng bị động sang hoạch định chủ động.
1.2.1.5. Khoản nợ (Debt):
Là nghĩa vụ tài chính cần thanh toán trong hiện tại hoặc tương lai. Quản lý nợ cho phép theo dõi trạng thái nợ cần thanh toán và tránh rủi ro mất cân đối dòng tiền.
1.2.1.6. Chỉ báo tài chính:
Bao gồm tổng thu thập, tổng chi tiêu, số dư ròng, tỷ lệ tiết kiệm và mức sử dụng ngân sách. Đây là các chỉ báo nền tảng đ   ể đánh giá sức khỏe tài chính.
1.2.1.7. Dự báo chi tiêu ngắn hạn:
Là quá trình ước lượng giá trị chi tiêu tương lai dựa trên dữ liệu quá khứ. Trong phạm vi dự án, bài toán dự báo ngắn hạn được giải quyết bằng các phương pháp thống kê chuỗi thời gian như trung bình trượt và san bằng mũ đơn.
1.2.2. Các chức năng của một hệ thống quản lý chi tiêu cá nhân
1.2.2.1. Chức năng thu thập và chuẩn hóa dữ liệu
Chức năng này bảo đảm hệ thống có khả năng tiếp nhận dữ liệu từ nhiều nguồn đầu vào khác nhau như nhập tay, chỉnh sửa bản ghi hiện có hoặc import từ tệp. Mọi dữ liệu trước khi lưu trữ đều cần đi qua bước kiểm tra tính hợp lệ (kiểu dữ liệu, giá trị bắt buộc, miền giá trị cho phép) nhằm giảm sai lệch trong quá trình tổng hợp sau này. Việc chuẩn hóa đơn vị tiền tệ, định dạng thời gian và quy ước đặt tên còn giúp dữ liệu nhất quán, nâng cao độ tin cậy cho phân tích thống kê.
1.2.2.2. Chức năng quản lý danh mục tài chính
Hệ thống cho phép tạo mới, cập nhật, vô hiệu hóa và tổ chức danh mục theo cấu trúc nghiệp vụ phù hợp với hành vi chi tiêu cá nhân. Việc gán danh mục cho từng giao dịch giúp chuyển dữ liệu thô thành dữ liệu có ngữ nghĩa, từ đó hỗ trợ các phép phân tích theo chiều sâu như tỷ trọng chi tiêu theo nhóm nhu cầu. Ở góc độ quản trị dữ liệu, danh mục đóng vai trò là lớp từ điển chuẩn, hạn chế tình trạng trùng lặp hoặc phân loại không nhất quán giữa các kỳ.
1.2.2.3. Chức năng kiểm soát ngân sách
Chức năng kiểm soát ngân sách cho phép người dùng thiết lập các ngưỡng chi tiêu theo chu kỳ (tuần, tháng, quý) hoặc theo từng danh mục cụ thể. Hệ thống liên tục đối chiếu chi tiêu thực tế với hạn mức đã đặt để xác định mức độ sử dụng ngân sách tại từng thời điểm. Khi tỷ lệ sử dụng vượt qua các mốc cảnh báo, hệ thống phát tín hiệu nhắc nhở để người dùng kịp thời điều chỉnh hành vi tài chính, qua đó giảm rủi ro thâm hụt.
1.2.2.4. Chức năng quản lý mục tiêu và nợ
Đây là chức năng hỗ trợ lập kế hoạch tài chính trung và dài hạn thông qua hai cấu phần: mục tiêu tiết kiệm và nghĩa vụ nợ phải trả. Với mục tiêu tiết kiệm, hệ thống theo dõi tổng mức cần đạt, số tiền đã tích lũy và tốc độ hoàn thành theo thời gian. Với khoản nợ, hệ thống quản lý thông tin chủ nợ, kỳ hạn, số dư còn lại và trạng thái thanh toán, giúp người dùng chủ động phân bổ dòng tiền để tránh áp lực tài chính tích tụ.
1.2.2.5. Chức năng tìm kiếm và truy xuất thông tin
Khả năng truy xuất nhanh đóng vai trò quan trọng khi khối lượng giao dịch tăng theo thời gian. Hệ thống cung cấp các cơ chế lọc theo mốc thời gian, loại giao dịch, danh mục, khoảng giá trị và từ khóa ngữ nghĩa để rút ngắn thời gian tìm kiếm. Ở mức cao hơn, chức năng này còn tạo nền cho phân tích linh hoạt theo nhiều lát cắt dữ liệu, phục vụ cả nhu cầu kiểm tra chi tiết lẫn tổng hợp quản trị.
1.2.2.6. Chức năng thống kê và trực quan hóa
Chức năng thống kê chuyển đổi dữ liệu giao dịch thành các chỉ số định lượng như tổng thu, tổng chi, số dư ròng, tỷ lệ tiết kiệm và tỷ lệ sử dụng ngân sách. Trên cơ sở đó, lớp trực quan hóa biểu diễn dữ liệu qua biểu đồ xu hướng theo thời gian, biểu đồ cơ cấu theo danh mục và bảng so sánh theo kỳ. Cách tiếp cận này giúp giảm tải nhận thức cho người dùng, đồng thời hỗ trợ phát hiện nhanh các mẫu hành vi tài chính nổi bật.
1.2.2.7. Chức năng dự báo và hỗ trợ quyết định
Dựa trên chuỗi dữ liệu lịch sử, hệ thống áp dụng các phương pháp thống kê để ước lượng xu hướng thu chi trong kỳ kế tiếp. Kết quả dự báo không nhằm thay thế quyết định của người dùng mà đóng vai trò như một tín hiệu tham khảo có cơ sở dữ liệu. Khi kết hợp dự báo với trạng thái ngân sách hiện tại, người dùng có thể chủ động lựa chọn phương án cắt giảm, tái phân bổ hoặc tăng tích lũy phù hợp.
1.2.2.8. Chức năng bảo mật và xác thực
Do dữ liệu tài chính cá nhân có tính nhạy cảm cao, chức năng bảo mật là yêu cầu nền tảng của toàn hệ thống. Hệ thống triển khai cơ chế xác thực tài khoản, quản lý phiên đăng nhập, kiểm soát quyền truy cập theo vai trò và bảo vệ dữ liệu trong quá trình truyền nhận. Đặc biệt, việc lựa chọn giải pháp xác thực hiện đại như đăng nhập Google OAuth 2.0 (SSO) giúp đơn giản hóa trải nghiệm người dùng, tăng cường bảo mật, giảm thiểu rủi ro rò rỉ thông tin đăng nhập và là nền tảng cho các chức năng mở rộng trong tương lai.
