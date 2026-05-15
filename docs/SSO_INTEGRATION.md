CHƯƠNG 2: TÍCH HỢP ĐĂNG NHẬP VỚI GOOGLE OAUTH 2.0 (SSO)
Chương này trình bày phương pháp luận và kiến trúc công nghệ để tích hợp xác thực người dùng thông qua Google OAuth 2.0, một tiêu chuẩn SSO hiện đại được sử dụng rộng rãi. Phương pháp này không chỉ cải thiện trải nghiệm người dùng mà còn nâng cao an ninh dữ liệu bằng cách đưa quản lý mật khẩu cho một nhà cung cấp uy tín như Google. Về mặt lý thuyết, đây là cách tiếp cận dựa trên mô hình tin cậy tập trung, trong đó hệ thống nội bộ không tự xử lý bí mật xác thực mà chỉ kiểm tra chứng thực do nhà cung cấp danh tính phát hành. 
2.1. Lý thuyết cơ bản về Single Sign-On (SSO)
SSO là viết tắt của Single Sign-On, hay còn gọi là đăng nhập một lần. Đây là một phương thức xác thực cho phép người dùng truy cập an toàn vào nhiều ứng dụng và dịch vụ khác nhau chỉ với một bộ thông tin đăng nhập duy nhất (tên người dùng và mật khẩu). Về mặt nguyên lý, SSO hình thành từ nhu cầu giảm số lần xác thực lặp lại trong các hệ thống phân tán, nơi người dùng thường phải di chuyển qua nhiều miền ứng dụng nhưng vẫn cần một danh tính nhất quán.
Trong mô hình không có SSO, mỗi khi người dùng chuyển từ ứng dụng này sang ứng dụng khác, hệ thống sẽ yêu cầu họ nhập lại thông tin xác thực. Ví dụ, bạn đăng nhập vào Gmail, sau đó muốn vào Drive lại phải đăng nhập thêm lần nữa. Với Single Sign-On, sau khi xác thực thành công tại hệ thống trung tâm, người dùng có quyền truy cập vào tất cả các ứng dụng liên kết mà không cần thực hiện lại thao tác đăng nhập. Điều này phản ánh cơ chế tái sử dụng phiên xác thực thay vì tái nhập mật khẩu, giúp giảm ma sát khi tương tác với hệ thống.
Cần phân biệt rõ SSO với việc sử dụng cùng một mật khẩu cho nhiều tài khoản (Same Sign-On). Việc dùng chung mật khẩu là một thói quen người dùng đầy rủi ro. Ngược lại, Single Sign-On là một giải pháp kỹ thuật, nơi thông tin xác thực được xử lý bởi một hệ thống tin cậy và cấp quyền truy cập thông qua các chứng thực số (token) bảo mật. Điểm cốt lõi ở đây là hệ thống chia sẻ trạng thái xác thực, chứ không chia sẻ bí mật đăng nhập.
SSO đóng vai trò xương sống trong kiến trúc Quản lý danh tính và truy cập (IAM – Identity and Access Management). Hệ thống xác thực này giúp bộ phận IT kiểm soát tập trung danh tính người dùng. Khi một nhân viên nghỉ việc, quản trị viên chỉ cần vô hiệu hóa một tài khoản SSO duy nhất thay vì phải đi khóa tài khoản trên hàng chục phần mềm khác nhau. Về mặt quản trị, đây là lợi thế lớn vì danh tính được tập trung hóa còn quyền truy cập được phân phối theo chính sách.
2.2. Cách hoạt động của SSO
Để hiểu SSO hoạt động như thế nào, chúng ta cần nắm vững mối quan hệ tin cậy (trust relationship) giữa các thành phần trong hệ thống. Quá trình này không truyền trực tiếp mật khẩu của người dùng qua lại giữa các ứng dụng. Thay vào đó, hệ thống sử dụng các “chứng thực” để xác nhận danh tính. Về nguyên tắc bảo mật, đây là cơ chế thay thế thông tin bí mật bằng bằng chứng mật mã, giúp ứng dụng đích có thể kiểm tra tính hợp lệ mà không cần nắm giữ mật khẩu gốc.
 
Hình 2.1: Cơ chế hoạt động của SSO
Hệ thống SSO bao gồm hai thành phần chính:
•	Identity Provider (IdP – Nhà cung cấp danh tính): Đây là hệ thống lưu trữ cơ sở dữ liệu người dùng và thực hiện việc xác thực. IdP chịu trách nhiệm kiểm tra xem “Bạn có đúng là người bạn khai báo không?”. Các ví dụ điển hình của IdP bao gồm Google, Microsoft Azure AD, Okta hay OneLogin.
•	Service Provider (SP – Nhà cung cấp dịch vụ): Đây là ứng dụng hoặc trang web mà người dùng muốn truy cập, ví dụ như Slack, Zoom, Salesforce hoặc hệ thống ERP nội bộ. SP tin tưởng vào kết quả xác thực do IdP gửi đến.
Về mặt thiết kế kiến trúc, IdP là nơi nắm giữ niềm tin gốc của toàn hệ thống, còn SP là nơi tiêu thụ kết quả xác thực. Mối quan hệ giữa hai bên thường được thiết lập trước bằng các khóa công khai, metadata hoặc cấu hình client ID, nhằm đảm bảo SP chỉ chấp nhận chứng thực từ đúng nguồn phát hành.
Quy trình xác thực diễn ra theo các bước cơ bản sau:
1.	Người dùng truy cập vào ứng dụng (Service Provider).
2.	Ứng dụng nhận thấy người dùng chưa đăng nhập và chuyển hướng (redirect) người dùng đến trang của Identity Provider.
3.	Người dùng nhập tên đăng nhập và mật khẩu tại trang của IdP (nếu chưa có phiên làm việc tồn tại).
4.	IdP xác thực thông tin. Nếu chính xác, IdP sẽ tạo ra một mã thông báo (token) hoặc chứng thực (assertion).
5.	IdP gửi token này trở lại cho Service Provider.
6.	Service Provider nhận token, giải mã và kiểm tra tính hợp lệ. Sau khi xác nhận, SP cho phép người dùng truy cập vào dịch vụ.
Trong suốt SSO flow (luồng hoạt động của SSO), mật khẩu người dùng chỉ được gửi đến IdP và không bao giờ được chia sẻ với các Service Provider. Điều này tăng cường bảo mật vì giảm thiểu số lượng nơi lưu trữ mật khẩu. Token được sử dụng thường có thời hạn (session), cho phép người dùng di chuyển giữa các ứng dụng trong một khoảng thời gian nhất định mà không bị ngắt quãng. Chính vì token có vòng đời hữu hạn nên hệ thống vừa đạt được tính tiện dụng vừa có thể giới hạn rủi ro khi token bị lộ.
2.3. Các giao thức phổ biến trong SSO
Các hệ thống IdP và SP cần một ngôn ngữ chung để giao tiếp với nhau. Ngôn ngữ chung này chính là các giao thức xác thực. Dưới đây là ba giao thức phổ biến nhất hiện nay.
2.3.1. SAML (Security Assertion Markup Language)
SAML SSO là một tiêu chuẩn mở lâu đời và phổ biến nhất trong môi trường doanh nghiệp truyền thống. Giao thức này sử dụng định dạng XML để trao đổi dữ liệu xác thực và ủy quyền giữa Identity Provider và Service Provider. Tính chất của SAML phản ánh tư duy thiết kế của các hệ thống enterprise cổ điển, nơi tính chặt chẽ và khả năng truyền thuộc tính người dùng được đặt lên hàng đầu.
Đặc điểm của SAML authentication là tính bảo mật cao và khả năng kiểm soát chi tiết. Nó cho phép doanh nghiệp truyền tải không chỉ thông tin xác thực mà cả các thuộc tính của người dùng (như phòng ban, chức vụ) để ứng dụng đích phân quyền. Tuy nhiên, do sử dụng XML nên các bản tin SAML thường khá nặng và quy trình triển khai có phần phức tạp hơn so với các chuẩn mới. Điều này làm cho SAML phù hợp hơn với hệ thống nội bộ lớn hơn là các ứng dụng web nhẹ, cần tốc độ và sự linh hoạt.
SAML thường được ưu tiên sử dụng cho các ứng dụng web doanh nghiệp (Enterprise Web Apps) và các hệ thống lớn yêu cầu sự chặt chẽ trong quản lý phiên làm việc. Trong bối cảnh đó, SAML đóng vai trò như một lớp cam kết giữa các tổ chức hoặc miền ứng dụng có mức độ tin cậy cao.
2.3.2. OAuth 2.0
OAuth 2.0 thực chất là một khung authorization (ủy quyền) hơn là một giao thức xác thực thuần túy. Tuy nhiên, nó đóng vai trò nền tảng cho nhiều quy trình đăng nhập hiện đại. OAuth cho phép một ứng dụng thay mặt người dùng truy cập vào tài nguyên trên một ứng dụng khác mà không cần biết mật khẩu của người dùng. Về lý thuyết, đây là mô hình ủy thác quyền hạn có kiểm soát, trong đó người dùng cấp một mức quyền cụ thể thay vì giao toàn bộ thông tin đăng nhập.
Một ví dụ điển hình của OAuth SSO là khi ứng dụng yêu cầu quyền truy cập vào danh bạ Google hoặc đăng bài lên Facebook của bạn. Trong ngữ cảnh SSO, OAuth thường được sử dụng kết hợp hoặc làm nền tảng để xây dựng các lớp xác thực khác. OAuth sử dụng Access Token để cấp quyền, giúp giảm thiểu rủi ro lộ thông tin đăng nhập gốc. Điều quan trọng là Access Token không đại diện trực tiếp cho mật khẩu, mà đại diện cho phạm vi truy cập và thời gian sử dụng đã được cấp.
2.3.3. OpenID Connect (OIDC)
OpenID Connect là một lớp định danh đơn giản được xây dựng ngay trên nền tảng của giao thức OAuth 2.0. Nếu OAuth 2.0 chuyên về ủy quyền (cho phép làm gì), thì OIDC bổ sung khả năng xác thực (xác định là ai). Đây là điểm rất quan trọng vì nhiều hệ thống trước đây dùng OAuth nhưng vẫn thiếu lớp định danh chuẩn hóa, dẫn đến việc phải tự suy diễn danh tính người dùng từ token.
OIDC SSO sử dụng định dạng JSON (JSON Web Token – JWT) thay vì XML như SAML. Điều này giúp OIDC nhẹ hơn, dễ xử lý hơn và thân thiện với các nhà phát triển. Nhờ cấu trúc gọn nhẹ và khả năng tương thích tốt với RESTful API, OIDC đã trở thành tiêu chuẩn vàng cho các ứng dụng di động (Mobile Apps) và các ứng dụng web một trang (Single Page Applications). OIDC cũng thuận lợi hơn trong việc tích hợp với hệ sinh thái JavaScript hiện đại vì các claim trong JWT có thể được đọc và xác thực nhanh chóng ở cả client lẫn server.
2.4. Lợi ích của SSO đối với người dùng và tổ chức
Việc triển khai SSO cho doanh nghiệp mang lại giá trị kép, vừa tối ưu hóa vận hành cho tổ chức, vừa nâng cao sự hài lòng cho nhân viên. Về mặt quản trị hệ thống, SSO không chỉ là công cụ đăng nhập mà còn là cơ chế tập trung hóa danh tính, giúp toàn bộ vòng đời người dùng được kiểm soát tốt hơn.
Thứ nhất, SSO giải quyết triệt để vấn đề quản lý mật khẩu. Người dùng không còn phải ghi nhớ hàng chục chuỗi ký tự phức tạp. Điều này giúp giảm thiểu tình trạng quên mật khẩu, từ đó giảm đáng kể số lượng yêu cầu hỗ trợ (ticket) gửi đến bộ phận IT để reset tài khoản. Thời gian tiết kiệm được giúp cả nhân viên và đội ngũ IT tập trung vào các công việc chuyên môn quan trọng hơn. Từ góc nhìn vận hành, đây là cách giảm chi phí hỗ trợ và tăng hiệu suất làm việc.
Thứ hai, SSO user experience (trải nghiệm người dùng) trở nên liền mạch hơn bao giờ hết. Nhân viên có thể truy cập vào email, công cụ chat, hệ thống quản lý dự án và kho dữ liệu chỉ với một lần đăng nhập đầu ngày. Sự thuận tiện này giúp tăng năng suất làm việc và giảm sự ức chế khi tương tác với công nghệ. Trải nghiệm liên tục cũng làm tăng khả năng chấp nhận hệ thống của người dùng cuối.
Thứ ba, SSO hỗ trợ quản trị tập trung hiệu quả. Các nhà quản lý có thể cấp quyền hoặc thu hồi quyền truy cập của một nhân viên vào toàn bộ hệ thống chỉ bằng vài thao tác tại IdP. Khi một nhân viên rời công ty, rủi ro họ vẫn còn quyền truy cập vào các ứng dụng vệ tinh được loại bỏ hoàn toàn. Đây là ưu điểm rất lớn của IAM trong môi trường doanh nghiệp.
Cuối cùng, lợi ích của SSO còn nằm ở khía cạnh bảo mật. Mặc dù nghe có vẻ nghịch lý khi gom tất cả vào một chỗ, nhưng SSO khuyến khích người dùng đặt một mật khẩu duy nhất đủ mạnh và phức tạp, thay vì đặt nhiều mật khẩu yếu và dễ đoán cho từng ứng dụng riêng lẻ. Khi kết hợp với các lớp bảo vệ bổ sung như token ngắn hạn hoặc MFA, SSO có thể đạt được sự cân bằng tốt giữa an toàn và tiện lợi.
2.5. Rủi ro và hạn chế khi triển khai SSO
Bên cạnh những lợi ích rõ ràng, tổ chức cần nhìn nhận khách quan về các nhược điểm của SSO để có phương án dự phòng phù hợp. Về bản chất, SSO là một sự tập trung hóa niềm tin nên nó cũng tập trung hóa rủi ro ở mức độ nhất định.
Rủi ro lớn nhất của SSO là tạo ra một “điểm lỗi tập trung” (Single Point of Failure). Nếu kẻ tấn công chiếm được tài khoản SSO của một người dùng, họ có thể truy cập vào tất cả các ứng dụng mà người dùng đó được cấp quyền. Đây là kịch bản “mất chìa khóa vạn năng” nguy hiểm đối với dữ liệu doanh nghiệp. Do đó, SSO security luôn yêu cầu các lớp bảo vệ bổ sung nghiêm ngặt. Điều này cho thấy một hệ thống SSO tốt không chỉ cần xác thực mạnh mà còn cần phát hiện bất thường, giới hạn phiên và khả năng thu hồi nhanh.
Một hạn chế khác liên quan đến tính sẵn sàng của hệ thống. Nếu hệ thống Identity Provider gặp sự cố kỹ thuật hoặc bị tấn công từ chối dịch vụ (DDOS), toàn bộ hoạt động đăng nhập vào các ứng dụng liên kết sẽ bị tê liệt. Doanh nghiệp sẽ không thể truy cập bất kỳ công cụ nào cho đến khi IdP hoạt động trở lại. Vì vậy, tính sẵn sàng của IdP trở thành một yêu cầu hạ tầng chiến lược trong kiến trúc SSO.
2.6. Kiến trúc OAuth 2.0 và OIDC trong dự án
Dự án quản lý chi tiêu sử dụng OAuth 2.0 kết hợp OIDC. Lựa chọn này vì dự án là một web app hiện đại, cần lấy thông tin người dùng (OIDC cung cấp), cần hỗ trợ mobile, phổ biến và có nhiều library hỗ trợ, nhà cung cấp là Google và Google hỗ trợ đầy đủ OAuth 2.0 kết hợp OIDC. Ở góc nhìn kiến trúc, đây là lựa chọn hợp lý vì nó giúp hệ thống tận dụng được chuẩn mở, giảm phụ thuộc vào cơ chế tự thiết kế và tăng khả năng tương thích với các thư viện xác thực hiện đại.
 
Hình 2.2: Kiến trúc Single Sign-On
2.6.1. Các vai trò chính trong OAuth 2.0 và OIDC
•	Resource Owner (Người dùng): Người dùng cuối sở hữu dữ liệu (email, tên, ảnh…) và cấp quyền cho ứng dụng. Trong mô hình này, người dùng là chủ thể trung tâm của danh tính và là nguồn phát sinh consent.
•	Authorization Server (Google OAuth 2.0): Máy chủ của Google xác thực người dùng, hiển thị consent và cấp ID Token (OIDC) và Access Token (OAuth2). Đây là thành phần đảm bảo việc cấp phát token diễn ra theo đúng phạm vi và đúng chính sách.
•	Client Application (Frontend): Giao diện ứng dụng khởi tạo flow (ví dụ dùng @react-oauth/google), nhận ID Token và gửi lên backend. Frontend chỉ giữ vai trò khởi động và hiển thị, không tự quyết định tính hợp lệ cuối cùng của danh tính.
•	Resource Server (Backend): Xác thực ID Token (kiểm tra chữ ký Google), tìm/tạo user, sinh Access Token (15 phút) và Refresh Token (30 ngày) cho client. Backend là nơi chuyển đổi định danh bên ngoài thành phiên làm việc nội bộ.
•	Google Identity Service: Cung cấp public keys/endpoint để backend verify chữ ký ID Token, đảm bảo token do Google cấp thực sự. Cơ chế này cho phép xác minh tính toàn vẹn và nguồn gốc token theo nguyên lý mật mã khóa công khai.
2.6.2. Luồng kết hợp OAuth 2.0 với OIDC
Khi sử dụng "OAuth 2.0 with OIDC", Frontend khởi tạo OAuth 2.0 flow nhưng yêu cầu cấp ID Token (thông qua OIDC). Authorization Server (Google) cấp cả ID Token (OIDC) và Access Token (OAuth 2.0). Frontend nhận ID Token và gửi lên Backend. Backend xác thực ID Token bằng cách kiểm tra chữ ký Google. Nếu hợp lệ, Backend tin tưởng thông tin trong token và xử lý user. Backend tạo local tokens cho Frontend để sử dụng trong các request tiếp theo. Về mặt lý thuyết, đây là mô hình kết hợp ủy quyền và định danh, trong đó Access Token phục vụ quyền truy cập tài nguyên còn ID Token phục vụ chứng minh danh tính.
2.7. Triển khai Google OAuth 2.0 để đăng nhập
Màn hình đăng nhập sau khi  tích hợp đăng nhập google:
Về mặt trải nghiệm, màn hình này đóng vai trò như một điểm khởi phát của toàn bộ luồng SSO. Người dùng chỉ cần một thao tác đăng nhập thay vì phải điền lại nhiều trường thông tin, từ đó làm giảm độ phức tạp nhận thức khi sử dụng hệ thống.

2.7.1. Ý nghĩa của việc triển khai SSO trong kiến trúc phần mềm hiện đại
Trong kiến trúc ứng dụng hiện đại, xác thực không còn được xem là một chức năng phụ trợ đơn giản mà là một tầng hạ tầng quan trọng. Việc tích hợp SSO bằng Google OAuth 2.0 giúp dự án tách biệt rõ hai nhiệm vụ: xác minh danh tính người dùng và quản lý phiên làm việc nội bộ. Google đảm nhiệm vai trò nhà cung cấp danh tính tin cậy, trong khi hệ thống của dự án chỉ chịu trách nhiệm tiếp nhận kết quả xác thực, ánh xạ người dùng và cấp quyền truy cập đối với tài nguyên nội bộ.

Về mặt lý thuyết, cách tiếp cận này phù hợp với nguyên tắc “không lưu mật khẩu nếu không cần thiết”. Thay vì tự xây dựng toàn bộ chuỗi lưu trữ, mã hóa, khôi phục và bảo vệ mật khẩu, hệ thống ủy thác lớp xác thực cho một IdP có độ tin cậy cao. Điều này làm giảm đáng kể độ phức tạp của bài toán bảo mật, đồng thời giảm phạm vi tấn công của hệ thống.

2.7.2. Mô hình niềm tin giữa Google và ứng dụng
SSO dựa trên một quan hệ tin cậy có điều kiện. Ứng dụng không tin mọi token một cách mù quáng mà chỉ chấp nhận token nếu token đó được ký bởi đúng nhà cung cấp, còn hiệu lực, và có mục đích sử dụng phù hợp. Trong ngữ cảnh Google OAuth 2.0, máy khách chỉ được phép chấp nhận ID Token khi các điều kiện sau được đáp ứng:

- Chữ ký token phải hợp lệ theo public key của Google.
- `aud` (audience) phải trùng với Client ID đã đăng ký.
- `iss` (issuer) phải thuộc miền tin cậy của Google.
- `exp` (expiration) phải còn hiệu lực.
- `sub` phải là định danh duy nhất và ổn định của người dùng trong hệ sinh thái Google.

Từ góc nhìn lý thuyết, mô hình này thể hiện nguyên tắc “xác thực thông qua bằng chứng mật mã” thay vì xác thực bằng bí mật dùng chung. Ứng dụng chỉ cần xác minh bằng chứng, không cần biết hay lưu mật khẩu của người dùng.

2.7.3. Tách lớp giữa xác thực và ủy quyền
Một điểm lý thuyết quan trọng trong hệ thống SSO là phân biệt giữa authentication và authorization. Authentication trả lời câu hỏi “người dùng có đúng là ai hay không”, còn authorization trả lời câu hỏi “người dùng đó được làm gì”. Trong dự án, Google chỉ giải quyết tầng xác thực danh tính. Sau khi người dùng đã được xác thực, backend sẽ tạo token nội bộ để đại diện cho phiên làm việc và áp dụng các chính sách quyền hạn của riêng hệ thống như xem báo cáo, thêm giao dịch, sửa ngân sách hoặc quản trị danh mục.

Sự phân tầng này giúp hệ thống dễ mở rộng. Sau này nếu cần tích hợp thêm Microsoft, GitHub hoặc một SSO nội bộ khác, backend chỉ cần bổ sung thêm nhà cung cấp danh tính mà không phải thay đổi toàn bộ logic phân quyền ứng dụng.

2.7.4. Lý do chọn Google OAuth 2.0 và OpenID Connect
Trong các tiêu chuẩn SSO, SAML thường phù hợp với môi trường doanh nghiệp truyền thống, còn OAuth 2.0 kết hợp OIDC phù hợp hơn với web app và SPA hiện đại. Dự án quản lý chi tiêu được xây dựng theo mô hình ứng dụng web một trang, cần phản hồi nhanh, giao diện linh hoạt và tích hợp tốt với JavaScript/JSON. Vì vậy, Google OAuth 2.0 + OIDC là lựa chọn hợp lý trên cả phương diện kỹ thuật lẫn trải nghiệm người dùng.

Google cũng có ưu điểm là hệ sinh thái xác thực phổ biến, tài liệu đầy đủ, hỗ trợ thư viện chính thức và cho phép lấy ID Token để đồng bộ thông tin người dùng như email, tên hiển thị, ảnh đại diện. Điều này giảm chi phí triển khai và giảm số lượng bước đăng ký thủ công trong ứng dụng.

2.7.5. Vai trò của ID Token trong mô hình này
ID Token là trung tâm của luồng OIDC. Token này không dùng để truy cập tài nguyên của Google, mà dùng để chứng minh danh tính của người dùng trước ứng dụng bên thứ ba. Về bản chất, ID Token là một JWT chứa các claim mô tả người dùng và phiên xác thực. Một số claim thường gặp gồm:

- `sub`: định danh duy nhất của người dùng trên Google.
- `email`: địa chỉ email.
- `name`: tên hiển thị.
- `picture`: ảnh đại diện.
- `iat`: thời điểm phát hành token.
- `exp`: thời điểm token hết hạn.

Vì JWT có cấu trúc tự mô tả và được ký số, backend có thể xác minh tính toàn vẹn mà không cần gọi lại nhiều lần đến IdP cho mỗi request đăng nhập. Đây là một lợi thế quan trọng trong hiệu năng và khả năng mở rộng.

2.8. Thiết kế hệ thống tích hợp trong dự án
2.8.1. Thiết kế tổng thể
Về mặt thiết kế hệ thống, mô hình tích hợp SSO của dự án có thể mô tả theo ba tầng:

- Tầng trình bày (Presentation layer): giao diện React hiển thị nút đăng nhập Google và tiếp nhận phản hồi từ người dùng.
- Tầng nghiệp vụ (Application layer): xử lý logic gọi API, chuyển đổi dữ liệu, lưu phiên và quản lý trạng thái đăng nhập.
- Tầng dữ liệu (Data layer): lưu thông tin người dùng, refresh token, vai trò và các thuộc tính liên quan đến xác thực.

Mô hình này giúp các trách nhiệm được tách biệt rõ ràng. Frontend chỉ chịu trách nhiệm tương tác và truyền token, còn backend chịu trách nhiệm xác minh, ghi nhận và phát hành phiên làm việc nội bộ.

2.8.2. Thành phần logic của kiến trúc
Trong kiến trúc SSO của dự án có thể quy ước các khối logic sau:

- Client Browser: nơi người dùng thao tác và bắt đầu quy trình xác thực.
- Google OAuth Screen: nơi người dùng cấp quyền và đăng nhập bằng tài khoản Google.
- React Frontend: nhận credential, gọi service API và cập nhật trạng thái UI.
- Express Backend: xác minh token, liên kết tài khoản và phát hành JWT.
- MongoDB: lưu bản ghi người dùng và trạng thái refresh token.

Đây là kiểu kiến trúc “front-channel + back-channel”: phía trình duyệt tương tác trực tiếp với Google ở bước đầu, sau đó backend xử lý phía sau để đảm bảo tính tin cậy và kiểm tra token bằng mật mã.

2.8.3. Thiết kế luồng dữ liệu
Luồng dữ liệu trong hệ thống đi theo hướng một chiều, từ người dùng sang Google, từ Google sang frontend, và từ frontend sang backend. Điểm đáng chú ý là mật khẩu Google không bao giờ đi vào hệ thống của dự án. Hệ thống chỉ nhận token đã ký. Đây là một điểm mạnh về thiết kế vì dữ liệu nhạy cảm nhất không đi qua ứng dụng trung gian.

2.8.4. Thiết kế xử lý tài khoản
Khi backend nhận được `sub` từ Google, hệ thống cần quyết định một trong ba trạng thái:

1. Người dùng đã tồn tại với `googleId`.
2. Người dùng tồn tại theo `email` nhưng chưa liên kết Google.
3. Người dùng hoàn toàn mới.

Ba nhánh này phản ánh tư duy thiết kế tài khoản theo hướng “identity linking”. Cách làm này giúp hạn chế tạo trùng tài khoản, đồng thời hỗ trợ người dùng chuyển dần từ đăng nhập truyền thống sang SSO mà không mất dữ liệu cũ.

2.9. Hướng dẫn cài đặt và tích hợp theo góc nhìn lý thuyết
2.9.1. Cài đặt phía Google Cloud
Về mặt nguyên lý, Google Cloud Console đóng vai trò nơi đăng ký “bản sắc ứng dụng”. Khi tạo OAuth Client ID, hệ thống của Google ghi nhận rằng ứng dụng này được phép yêu cầu xác thực từ người dùng theo một tập origin nhất định. Điều đó giúp ngăn chặn việc ứng dụng giả mạo cố gắng lừa người dùng cung cấp danh tính của họ.

Các bước cài đặt cần lưu ý:
- Tạo project trên Google Cloud.
- Bật OAuth consent screen.
- Tạo OAuth Client ID kiểu Web application.
- Khai báo JavaScript origins hợp lệ.
- Lấy Client ID đưa vào biến môi trường của frontend và backend.

2.9.2. Cài đặt phía frontend
Frontend là nơi khởi phát trải nghiệm đăng nhập. Về mặt thiết kế, frontend cần có một provider cấp Client ID chung cho toàn ứng dụng, và một nút đăng nhập Google để nhận credential token từ người dùng. Khi nhận token, frontend không tự tin tưởng token mà phải gửi lên backend để kiểm tra tiếp. Điều này bảo đảm rằng trình duyệt chỉ là nơi thu thập dữ liệu đầu vào, còn quyết định xác thực thực sự nằm ở server.

2.9.3. Cài đặt phía backend
Backend cần triển khai bốn năng lực chính:

- Kiểm tra token đầu vào.
- Xác minh chữ ký token với public key của Google.
- Tra cứu hoặc tạo mới người dùng.
- Phát hành token nội bộ cho hệ thống.

Về mặt nguyên lý bảo mật, backend là “trust boundary” quan trọng nhất. Mọi token đi từ client đều phải được xem là chưa tin cậy cho tới khi xác minh xong. Cách tiếp cận này phù hợp với nguyên tắc zero trust ở cấp độ ứng dụng.

2.9.4. Cấu hình biến môi trường
Biến môi trường giúp tách biệt cấu hình khỏi mã nguồn. Đây là một thực hành quan trọng vì thông tin như Client ID, JWT secret hoặc SMTP password không nên hard-code. Việc đặt các giá trị này vào `.env` giúp môi trường phát triển, kiểm thử và sản xuất có thể dùng cấu hình khác nhau mà không làm thay đổi logic chương trình.

2.9.5. Tích hợp vào luồng nghiệp vụ của dự án
Sau khi người dùng đăng nhập bằng Google, hệ thống vẫn phải duy trì danh tính nội bộ. Điều đó có nghĩa là SSO không thay thế toàn bộ logic người dùng của ứng dụng mà chỉ thay thế bước chứng thực ban đầu. Những chức năng như phân quyền, lưu ngân sách, lịch sử giao dịch, nhắc nhở, và thống kê vẫn là trách nhiệm của hệ thống nội bộ. Đây là lý do tại sao tích hợp SSO cần được nhìn như một lớp bổ sung lên trên hệ thống hiện tại, không phải một sự thay thế hoàn toàn.

2.10. Tính an toàn, mở rộng và khả năng bảo trì
2.10.1. Tính an toàn
Trong lý thuyết bảo mật ứng dụng, SSO làm giảm số lượng mật khẩu cần lưu trong hệ thống, từ đó giảm nguy cơ rò rỉ cơ sở dữ liệu mật khẩu. Tuy nhiên, nó cũng làm tăng mức độ quan trọng của lớp token và lớp cấu hình bảo mật. Vì vậy, việc bảo vệ access token, refresh token và secret là tối quan trọng.

2.10.2. Khả năng mở rộng
Mô hình Google SSO của dự án có tính mô-đun khá cao. Nếu muốn thêm nhà cung cấp khác, hệ thống có thể mở rộng theo hướng multi-provider authentication. Khi đó, mỗi nhà cung cấp sẽ có một adapter xác thực riêng nhưng vẫn dùng chung logic tạo user nội bộ và phát token nội bộ.

2.10.3. Khả năng bảo trì
Tách riêng controller, service, route và context giúp việc bảo trì dễ hơn. Nếu sau này thay đổi cách verify token, chỉ cần chỉnh logic backend thay vì sửa toàn bộ giao diện. Nếu đổi cách lưu token, chủ yếu chỉ ảnh hưởng đến lớp service và auth context.

2.11. Nhận xét cho phần báo cáo
Về mặt học thuật, có thể kết luận rằng dự án đang áp dụng mô hình xác thực hiện đại dựa trên Google OAuth 2.0 kết hợp OpenID Connect để giải quyết bài toán SSO. Cách tiếp cận này phù hợp với ứng dụng web hiện đại, giảm tải cho người dùng, giảm độ phức tạp bảo mật nội bộ và vẫn giữ được khả năng mở rộng về sau.

Nếu cần đưa vào báo cáo, phần này có thể dùng như một chương/tiểu mục bổ sung về thiết kế hệ thống và cơ sở lý thuyết của tích hợp SSO.
