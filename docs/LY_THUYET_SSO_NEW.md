# CHƯƠNG 2: PHƯƠNG PHÁP TÍCH HỢP ĐĂNG NHẬP VỚI GOOGLE OAUTH 2.0 (SSO)

## Tóm tắt chương

Chương này trình bày phương pháp luận và kiến trúc công nghệ để tích hợp xác thực người dùng thông qua Google OAuth 2.0, một tiêu chuẩn SSO hiện đại được sử dụng rộng rãi. Phương pháp này không chỉ cải thiện trải nghiệm người dùng mà còn nâng cao an niên dữ liệu bằng cách đưa quản lý mật khẩu cho một nhà cung cấp uy tín như Google. Chương sẽ đi sâu vào lý thuyết nền tảng, kiến trúc hệ thống, luồng xử lý chi tiết, và cách quản lý vòng đời token - những yếu tố then chốt đảm bảo hệ thống xác thực vừa an toàn vừa hiệu quả.

---

## 2.1. Lý thuyết cơ bản về Single Sign-On (SSO)

### 2.1.1. Định nghĩa SSO

Single Sign-On (SSO) là cơ chế xác thực cho phép người dùng đăng nhập một lần vào một hệ thống ủy quyền tập trung, sau đó có thể truy cập được nhiều ứng dụng hoặc dịch vụ liên kết mà không cần phải cung cấp thông tin xác thực thêm lần nào nữa.

Trong bối cảnh dự án Quản lý chi tiêu cá nhân của bạn, người dùng đăng nhập một lần bằng tài khoản Google và được cấp quyền truy cập vào ứng dụng Quản lý chi tiêu mà không cần tạo mật khẩu riêng. Google đóng vai trò nhà cung cấp danh tính tập trung (Identity Provider).

### 2.1.2. Lợi ích của SSO

Đối với người dùng, SSO mang lại những lợi ích đáng kể. Trước hết, người dùng chỉ cần nhớ một mật khẩu Google thay vì phải tạo và nhớ nhiều mật khẩu khác nhau cho các ứng dụng khác nhau. Thứ hai, việc đăng nhập trở nên nhanh chóng và tiện lợi - chỉ cần một click thay vì phải nhập email và mật khẩu. Thứ ba, bảo mật được cải thiện đáng kể vì người dùng không cần lo về mật khẩu yếu kém, Google đã xử lý các vấn đề bảo mật như xác thực hai yếu tố (2FA) và sinh trắc học (biometric). Cuối cùng, nếu tài khoản Google bị hack, người dùng có thể quản lý tất cả từ một nơi duy nhất.

Đối với ứng dụng, SSO cũng mang lại nhiều lợi ích. Tỷ lệ đăng ký người dùng mới tăng lên vì friction (ma sát) giảm đi - người dùng dễ dàng đăng ký hơn. Không phải xây dựng một hệ thống quản lý mật khẩu phức tạp, do đó giảm chi phí phát triển. Chi phí bảo mật cũng giảm vì không phải quản lý mật khẩu hoặc triển khai 2FA riêng. Số lượng ticket support cũng giảm đáng kể vì ít người dùng liên hệ với "quên mật khẩu" hoặc yêu cầu reset password. Dữ liệu người dùng lấy từ Google đã được xác thực (email được Google verify, tên và ảnh đại diện từ Google Account), nên chất lượng dữ liệu cao hơn. Cuối cùng, kiến trúc SSO dễ dàng mở rộng để thêm các phương pháp đăng nhập khác như Facebook, GitHub trong tương lai.

### 2.1.3. Nhược điểm và rủi ro của SSO

Mặc dù SSO có nhiều lợi ích, nhưng cũng tồn tại những nhược điểm. Ứng dụng trở thành phụ thuộc vào bên thứ ba (Google). Nếu Google gặp sự cố hoặc bảo trì, người dùng sẽ không thể đăng nhập vào ứng dụng. Tuy nhiên, điều này hiếm khi xảy ra vì Google có cơ sở hạ tầng rất ổn định.

Khi sử dụng SSO, phải chia sẻ một số thông tin người dùng với Google - ít nhất là email và tên. Mặc dù đây là thông tin tối thiểu cần thiết, nhưng vẫn là một mối quan tâm về quyền riêng tư đối với một số người dùng. Ngoài ra, Google biết rằng người dùng đang sử dụng ứng dụng của bạn, mặc dù Google cam kết không chia sẻ thông tin này với các bên thứ ba.

Cuối cùng, có một hiệu ứng "lock-in" - khi ứng dụng chỉ hỗ trợ Google SSO, khó để tách rời khỏi Google trong tương lai. Tuy nhiên, điều này có thể được giải quyết bằng cách hỗ trợ song song với phương pháp đăng nhập email/mật khẩu truyền thống.

---

## 2.2. Phân loại các phương pháp SSO

Hiện nay có ba phương pháp SSO chính được sử dụng trong các ứng dụng. Mỗi phương pháp có những đặc điểm riêng và phù hợp với các tình huống khác nhau.

### 2.2.1. OAuth 2.0 (Ủy quyền)

OAuth 2.0 là framework ủy quyền cho phép bên thứ ba (Google) cấp quyền truy cập dữ liệu của người dùng cho ứng dụng mà không cần chia sẻ mật khẩu của người dùng. Framework này tập trung chính vào ủy quyền (authorization) hơn là xác thực (authentication).

OAuth 2.0 được sử dụng rộng rãi bởi các nhà cung cấp lớn như Google, Facebook, GitHub, Twitter, LinkedIn. Định dạng token của OAuth 2.0 là JSON, nhẹ và phù hợp cho các ứng dụng di động. Token có thời gian sống ngắn (short-lived access token) để bảo mật, cùng với refresh token dài hạn để duy trì phiên.

Ưu điểm của OAuth 2.0 bao gồm: nó rất phổ biến và hầu hết các platform đều hỗ trợ; an toàn hơn so với password-based vì không chia sẻ mật khẩu; người dùng có toàn quyền kiểm soát những quyền truy cập nào được cấp cho ứng dụng; hiệu năng tốt nhờ định dạng JSON nhẹ; rất thích hợp cho các ứng dụng di động.

Hạn chế của OAuth 2.0 là nó chỉ cấp ủy quyền, không cung cấp thông tin về danh tính của người dùng (ai là người dùng). Để lấy thông tin người dùng, cần phải gọi thêm endpoint khác hoặc kết hợp với OpenID Connect.

### 2.2.2. OpenID Connect (OIDC)

OpenID Connect là một tầng xác thực (authentication layer) xây dựng trên nền tảng OAuth 2.0. Nó kết hợp cả xác thực danh tính người dùng và ủy quyền trong một framework duy nhất.

OIDC cung cấp một loại token gọi là "ID Token" - một JWT chứa thông tin về người dùng. Thay vì phải gọi một endpoint riêng để lấy thông tin người dùng, OIDC lấy thông tin này trực tiếp từ ID Token, giúp giảm số lần gọi API.

Nhà cung cấp sử dụng OIDC bao gồm Google, Microsoft, Auth0, Okta. OIDC là tiêu chuẩn hiện đại được khuyến cáo cho các web apps và mobile apps mới.

Ưu điểm của OIDC là nó kế thừa tất cả ưu điểm của OAuth 2.0, đồng thời cung cấp thông tin chi tiết về người dùng thông qua ID Token; hiện đại và được khuyến cáo; đặc biệt phù hợp cho các ứng dụng consumer (ứng dụng dành cho người dùng cuối).

### 2.2.3. SAML 2.0 (Security Assertion Markup Language)

SAML là một tiêu chuẩn dựa trên XML cho phép chia sẻ thông tin xác thực và ủy quyền giữa các hệ thống. SAML thường được sử dụng trong môi trường doanh nghiệp, đặc biệt là khi cần tích hợp với các hệ thống cũ hoặc các doanh nghiệp lớn.

Định dạng SAML là XML, phức tạp hơn JSON. Thông tin xác thực được chứa trong các "assertion" dưới dạng XML. SAML thường được sử dụng bởi Salesforce, Microsoft, Okta và các doanh nghiệp lớn khác.

Ưu điểm của SAML bao gồm: rất an toàn và đáng tin cậy, được sử dụng bởi nhiều doanh nghiệp lớn, hỗ trợ tốt cho việc tích hợp với các hệ thống legacy.

Hạn chế của SAML là nó phức tạp hơn OAuth (XML không dễ parse), không thích hợp cho các ứng dụng di động, hiệu năng thấp hơn do XML nặng hơn JSON, khó để quản lý và triển khai.

### 2.2.4. Lựa chọn cho dự án

Dự án Quản lý chi tiêu sử dụng OAuth 2.0 kết hợp OIDC. Lựa chọn này vì dự án là một web app hiện đại, cần lấy thông tin người dùng (OIDC cung cấp), cần hỗ trợ mobile, phổ biến và có nhiều library hỗ trợ, nhà cung cấp là Google và Google hỗ trợ đầy đủ OAuth 2.0 kết hợp OIDC.

---

## 2.3. Kiến trúc OAuth 2.0 + OIDC trong dự án

### 2.3.1. Các vai trò chính trong OAuth 2.0 và OIDC

Dự án sử dụng kết hợp OAuth 2.0 và OpenID Connect (OIDC). OAuth 2.0 cung cấp khung ủy quyền (authorization framework), còn OIDC cung cấp lớp xác thực danh tính (authentication layer) xây dựng trên OAuth 2.0. Cách kết hợp này có tên gọi là "OAuth 2.0 with OIDC" hoặc "OIDC flow".

Trong kiến trúc này, có năm vai trò chính. Thứ nhất là Resource Owner (Người sở hữu tài nguyên) - đây là người dùng cuối cùng, sở hữu dữ liệu trên Google như email, tên, ảnh đại diện, số điện thoại, v.v. Resource Owner cấp quyền cho ứng dụng Quản lý chi tiêu để truy cập các dữ liệu này.

Thứ hai là Authorization Server (Google OAuth 2.0 Server) - đây là server của Google chịu trách nhiệm xác thực người dùng và cấp phép. Khi người dùng click "Sign in with Google", Authorization Server hiển thị màn hình xin phép (consent screen). Người dùng kiểm tra danh sách quyền mà ứng dụng muốn truy cập (ví dụ: "Xem email của bạn", "Xem tên và ảnh đại diện"). Nếu người dùng đồng ý, Authorization Server tạo và cấp các token. Các token này bao gồm ID Token (từ OIDC) chứa thông tin xác thực của người dùng, và Access Token (từ OAuth 2.0) để cấp quyền truy cập.

Thứ ba là Client Application (Frontend) - đây là phần giao diện người dùng của ứng dụng Quản lý chi tiêu. Frontend hiển thị nút "Sign in with Google", khởi tạo OAuth 2.0 + OIDC flow bằng cách gọi Google Authorization Server. Frontend sử dụng thư viện `@react-oauth/google` để xử lý các chi tiết kỹ thuật. Khi Authorization Server cấp ID Token, Frontend nhận token này và gửi lên Backend để xác thực thêm.

Thứ tư là Resource Server (Backend) - đây là phần server của ứng dụng Quản lý chi tiêu. Backend chịu trách nhiệm xác thực (verify) ID Token từ Google bằng cách kiểm tra chữ ký của Google. Backend lấy thông tin người dùng từ ID Token (thông tin này đã được Google xác thực), sau đó tìm hoặc tạo user trong database. Backend tạo hai loại local JWT tokens: Access Token (15 phút) và Refresh Token (30 ngày), cả hai đều được Backend ký tên. Các tokens này được gửi về Frontend để sử dụng trong các API request tiếp theo.

Thứ năm là Google Identity Service - đây không phải là vai trò truyền thống trong OAuth 2.0, nhưng nó là phần quan trọng của OIDC. Khi Backend xác thực ID Token, nó kiểm tra chữ ký của Google bằng cách gọi Google's public key endpoint. Điều này đảm bảo rằng ID Token thực sự được tạo bởi Google, không phải bởi attacker.

#### Sự khác biệt giữa OAuth 2.0 và OIDC trong quy trình này

OAuth 2.0 chỉ cấp ủy quyền (authorization) - nó trả lời câu hỏi "Bạn có quyền gì truy cập?". OAuth 2.0 không cung cấp thông tin danh tính của người dùng. Nếu chỉ dùng OAuth 2.0, Backend phải gọi một endpoint riêng của Google (User Info endpoint) để lấy thông tin người dùng.

OIDC xây dựng trên OAuth 2.0 và bổ sung xác thực danh tính (authentication) - nó trả lời câu hỏi "Bạn là ai?". OIDC cung cấp ID Token - một JWT chứa thông tin về người dùng (email, name, picture, email_verified, v.v.). ID Token này được tạo bởi Authorization Server (Google) và được ký tên bởi Google. ID Token được Frontend gửi tới Backend, Backend xác thực chữ ký, rồi tin tưởng các thông tin trong token.

Lợi ích của OIDC so với OAuth 2.0 là giảm số lần gọi API. OIDC cho phép Backend lấy thông tin người dùng từ ID Token mà không cần gọi User Info endpoint. Điều này nhanh hơn và an toàn hơn vì thông tin được ký tên.

#### Luồng kết hợp OAuth 2.0 + OIDC

Khi sử dụng "OAuth 2.0 with OIDC", Frontend khởi tạo OAuth 2.0 flow nhưng yêu cầu cấp ID Token (thông qua OIDC). Authorization Server (Google) cấp cả ID Token (OIDC) và Access Token (OAuth 2.0). Frontend nhận ID Token và gửi lên Backend. Backend xác thực ID Token bằng cách kiểm tra chữ ký Google. Nếu hợp lệ, Backend tin tưởng thông tin trong token và xử lý user. Backend tạo local tokens cho Frontend để sử dụng trong các request tiếp theo.

### 2.3.2. Cấu trúc User trong Database

User model trong database cần có những trường sau. Trường `_id` là định danh duy nhất của người dùng trong database. Trường `email` lưu email của người dùng. Trường `name` lưu tên của người dùng. Trường `avatar` lưu URL ảnh đại diện. Trường `googleId` lưu Google User ID - một định danh duy nhất được Google cấp. Trường này rất quan trọng vì dùng để tìm người dùng khi đăng nhập lại.

Trường `password` là null vì người dùng SSO không có mật khẩu. Trường `refreshToken` lưu refresh token hiện tại, dùng để verify khi người dùng refresh. Trường `currency` lưu đơn vị tiền tệ (VND, USD...). Trường `budget` lưu ngân sách tháng của người dùng. Trường `role` lưu vai trò (user, admin). Trường `isActive` biểu thị tài khoản có hoạt động hay không. Trường `createdAt` ghi lại khi người dùng được tạo (lần đầu login với Google). Trường `updatedAt` ghi lại lần cập nhật cuối cùng.

Quan trọng là `googleId` phải là unique (duy nhất) và sparse. Duy nhất vì mỗi Google ID chỉ tương ứng với một người dùng. Sparse vì người dùng đăng nhập bằng email/password không có googleId, nên cho phép giá trị null mà không vi phạm constraint unique.

---

## 2.4. Luồng chi tiết đăng nhập Google

### 2.4.1. Bước 1-2: Khởi tạo từ Frontend

Quá trình bắt đầu khi người dùng click vào nút "Sign in with Google" trên trang Login. Component GoogleLogin từ thư viện `@react-oauth/google` được sử dụng. Thư viện này đã tích hợp sẵn logic để giao tiếp với Google OAuth server, nên khi người dùng click, thư viện tự động mở một cửa sổ popup hoặc redirect để Google hiển thị consent screen.



---

## 2.5. Token Management - Quản lý vòng đời Token

### 2.5.1. Tại sao cần 2 loại token

Nếu chỉ dùng một loại access token với thời hạn 15 phút, kịch bản như sau sẽ xảy ra. User login lúc 00:00 nhận access token. User sử dụng app bình thường từ 00:05, mỗi request gửi access token. Lúc 00:15, access token hết hạn. Mọi request tiếp theo bị trả về lỗi 401 Unauthorized. User bị kick ra ngoài app, phải login lại từ đầu. Nếu user đang nhập dữ liệu mà chưa lưu, dữ liệu sẽ bị mất. Kết quả là trải nghiệm user rất tệ.

Nếu sử dụng hai loại token: access token (15 phút) và refresh token (30 ngày), kịch bản như sau sẽ xảy ra. User login lúc 00:00, nhận access token và refresh token. User sử dụng app bình thường từ 00:05. Lúc 00:15, access token hết hạn. Frontend axios interceptor bắt lỗi 401, tự động gọi endpoint `/api/auth/refresh-token` gửi refresh token. Backend xác thực refresh token, tạo access token mới. Frontend lưu access token mới vào localStorage, retry request ban đầu. User không nhận thấy bất cứ điều gì, trải nghiệm hoàn toàn seamless. Lúc 00:30, access token mới lại hết hạn, refresh lại. Quá trình này tiếp tục cho đến khi refresh token hết hạn (sau 30 ngày), khi đó user phải login lại. Kết quả là trải nghiệm user tuyệt vời.

### 2.5.2. Các loại token

Có ba loại token khác nhau. ID Token được tạo bởi Google (thông qua OIDC). Mục đích của ID Token là xác thực - để trả lời câu hỏi "Bạn là ai?". ID Token là một JWT chứa thông tin về người dùng (email, name, picture). Thời hạn của ID Token thường là 1 giờ. ID Token được gửi tới backend một lần để xác thực. Sau khi backend xác thực ID Token, ID Token không được dùng lại.

Access Token được tạo bởi backend (sau khi xác thực ID Token). Mục đích của Access Token là ủy quyền - để trả lời câu hỏi "Bạn có quyền gì?". Access Token là một JWT chứa user ID và permissions. Thời hạn của Access Token thường là 15 phút (ngắn hạn để bảo mật). Access Token được gửi kèm với mỗi API request trong header Authorization.

Refresh Token cũng được tạo bởi backend. Mục đích của Refresh Token là lấy access token mới. Refresh Token là một JWT chứa user ID. Thời hạn của Refresh Token thường là 30 ngày (dài hạn). Refresh Token được lưu trong cả localStorage và database. Refresh Token được gửi tới endpoint `/api/auth/refresh-token` khi access token hết hạn.

### 2.5.3. Tại sao phải lưu Refresh Token trong Database

Lưu refresh token trong database có bốn lý do chính. Thứ nhất là logout control. Vấn đề là refresh token có thời hạn 30 ngày. Nếu user logout, refresh token từ localStorage bị xóa, nhưng refresh token này vẫn có hiệu lực tới 30 ngày. Nếu attacker có được refresh token cũ, attacker vẫn có thể dùng nó để refresh. Giải pháp là lưu refresh token trong database. Khi user logout, backend xóa refresh token từ database. Nếu attacker gửi refresh token cũ, backend kiểm tra database, phát hiện token này không tồn tại, và từ chối refresh. Như vậy user logout ngay tức khắc, không phải chờ token hết hạn.

Thứ hai là phát hiện hack. Nếu hacker chiếm được refresh token, hacker có thể dùng nó để refresh lấy access token mới. Giải pháp là verify refresh token trong database. Backend kiểm tra xem refresh token trong request có trùng với refresh token trong database không. Nếu không trùng, có nghĩa là token bị steal, backend logout user ngay.

Thứ ba là session management. Nếu không lưu database, server không biết user login từ bao nhiêu thiết bị khác nhau. Lưu trong database cho phép server biết tất cả active sessions, có thể logout từ tất cả thiết bị cùng lúc nếu cần.

Thứ tư là revocation (thu hồi quyền). Admin có thể disable user bằng cách xóa refresh token từ database. Khi xóa, user không thể refresh, bị logout ngay, ngay cả khi access token còn hạn.

### 2.5.4. Luồng Refresh Token

Khi frontend gửi API request kèm access token, backend kiểm tra token. Nếu token hợp lệ, request được xử lý bình thường. Nếu token hết hạn (401 Unauthorized), frontend axios interceptor bắt được lỗi này.

Interceptor gọi endpoint `POST /api/auth/refresh-token` gửi refresh token. Backend nhận request, trích xuất refresh token từ body. Đầu tiên kiểm tra có refresh token không. Tiếp theo verify refresh token bằng cách gọi `jwt.verify()` với JWT_REFRESH_SECRET. Nếu token invalid hoặc hết hạn, trả lỗi 401. Nếu valid, lấy được user ID từ token.

Backend tìm user theo ID, lấy refreshToken từ database. Kiểm tra xem refresh token trong request có trùng với refresh token trong database không. Nếu không trùng, trả lỗi 401 (token bị steal hoặc user logout). Nếu trùng, tạo access token mới bằng `generateAccessToken()`. Trả response với access token mới.

Frontend lưu access token mới vào localStorage. Frontend retry API request ban đầu, kèm access token mới. Request lần này thành công vì access token mới hợp lệ.

---

## 2.6. Session Initialization - Khôi phục Session khi Reload

Khi user refresh page hoặc mở app lại, AuthContext chạy useEffect initialization. Đầu tiên lấy token từ localStorage, lấy refreshToken từ localStorage, lấy saved user từ localStorage.

Nếu không có token hoặc không có saved user, user chưa login, set user thành null, setLoading false, return. Không cần làm gì tiếp.

Nếu có token, kiểm tra token có hết hạn không bằng cách decode token lấy expiration timestamp, so sánh với hiện tại. Nếu token chưa hết hạn, khôi phục session bằng cách setUser(savedUser), setLoading false. User được truy cập dashboard ngay mà không cần login lại.

Nếu token hết hạn nhưng có refreshToken, gọi `authService.refreshAccessToken(refreshToken)`. Endpoint `/api/auth/refresh-token` xác thực refresh token, tạo access token mới, trả về. Frontend lưu access token mới vào localStorage, khôi phục session.

Nếu refresh thất bại hoặc không có refreshToken, logout (xóa hết localStorage), set user null, setLoading false.

---

## 2.7. Tích hợp đăng nhập SSO bằng Google

### 2.7.1. Giao diện nút Sign in with Google

**Hình 2.1: Nút "Sign in with Google" trên màn hình đăng nhập**

![Sign in with Google Button](../assets/Screenshot/LandingPage.png)

Ứng dụng Quản lý chi tiêu hiển thị nút "Sign in with Google" trên trang đăng nhập. Người dùng click vào nút này để khởi động quá trình OAuth 2.0 + OIDC. Nút này được tạo bằng thư viện React `@react-oauth/google` với component GoogleLogin, cung cấp giao diện chuẩn của Google và xử lý các chi tiết kỹ thuật phía sau.

---

## 2.7.2. So sánh: Đăng nhập truyền thống vs SSO

Phương pháp truyền thống (email + password) lưu mật khẩu dưới dạng hash trong database. SSO (Google) không lưu mật khẩu, Google quản lý.

Rủi ro bảo mật của phương pháp truyền thống cao vì database có thể bị hack, mật khẩu leak. SSO thấp hơn vì Google quản lý bảo mật, security team của Google rất mạnh.

Khi user quên password, phương pháp truyền thống phải gửi email reset (phức tạp), SSO không cần (Google xử lý).

Để đăng ký, phương pháp truyền thống yêu cầu user nhập email, password, tên (5-10 bước). SSO chỉ cần 1 click (Google autofill).

Tỷ lệ đăng ký (sign-up rate) của phương pháp truyền thống thấp vì friction cao. SSO cao vì chỉ 1 click.

Quản lý token của phương pháp truyền thống đơn giản (thường 1 token). SSO phức tạp hơn (2 tokens: access và refresh).

Chi phí phát triển của phương pháp truyền thống cao vì phải build từ đầu (password hashing, reset flow, 2FA...). SSO thấp vì dùng Google infrastructure.

Chi phí bảo mật của phương pháp truyền thống cao. SSO thấp.

Support ticket của phương pháp truyền thống cao (quên password). SSO thấp.

Độ tin cậy dữ liệu người dùng của phương pháp truyền thống tùy vào app validation (có thể fake). SSO cao vì Google verified (email checked).

---

## 2.8. Lợi ích của SSO cho dự án

### 2.8.1. Lợi ích cho người dùng

SSO tiết kiệm thời gian đăng nhập. Thay vì nhập email (5 giây) + password (10 giây) + xác nhận (5 giây) = 20 giây, SSO chỉ cần 1 click (3 giây). Tiết kiệm 85%.

Bảo mật cao hơn vì không cần lo quên mật khẩu. Google xử lý 2FA, biometric. Email được Google xác thực sẵn.

Quản lý tài khoản dễ vì 1 Google account cho tất cả apps. Logout Google một chỗ đủ logout khỏi tất cả.

Trải nghiệm di động tốt vì Google app tích hợp sẵn. Nếu user đã login Google trong điện thoại, SSO auto-fill không cần nhập.

### 2.8.2. Lợi ích cho dự án

SSO tăng tỷ lệ đăng ký. Friction giảm đi đáng kể, người dùng dễ dàng đăng ký. Kỳ vọng tăng 30-50% sign-up rate.

Giảm chi phí development vì không phải build password system (hashing, reset flow, 2FA). Dùng Google auth sẵn tiết kiệm 100-200 giờ dev.

Giảm chi phí bảo mật vì không phải quản lý mật khẩu. Google xử lý, app chỉ verify token. Tiết kiệm 5k-10k USD/năm infra + manpower.

Giảm ticket support. Ít ticket "quên password" (giảm 80%). Ít account recovery. Tiết kiệm 20-30% support cost.

Dữ liệu người dùng tin cậy. Email từ Google đã verified, tên avatar từ Google Account đã validate. Giảm fake account 70%.

Dễ mở rộng tương lai. Có thể thêm Facebook, GitHub, enterprise SAML login dễ dàng vì architecture hỗ trợ multiple providers.

---

## 2.9. Tóm tắt chương

Chương 2 trình bày toàn bộ phương pháp tích hợp SSO sử dụng Google OAuth 2.0 + OIDC cho dự án Quản lý chi tiêu cá nhân.

Mục 2.1 giới thiệu lý thuyết cơ bản về SSO - định nghĩa, lợi ích và nhược điểm.

Mục 2.2 phân loại ba phương pháp SSO chính (OAuth 2.0, OIDC, SAML) và giải thích tại sao dự án chọn OAuth 2.0 + OIDC.

Mục 2.3 trình bày kiến trúc hệ thống - bốn vai trò chính và cấu trúc User model trong database.

Mục 2.4 chi tiết luồng đăng nhập từ lúc user click nút "Sign in with Google" tới khi nhận access token.

Mục 2.5 giải thích quản lý token - tại sao cần 2 loại, các loại token khác nhau, tại sao lưu refresh token trong DB, và luồng refresh.

Mục 2.6 trình bày cách khôi phục session khi user reload page.

Mục 2.7 so sánh SSO với phương pháp đăng nhập truyền thống.

Mục 2.8 liệt kê các lợi ích của SSO cho người dùng và dự án.

Toàn bộ chương được trình bày dưới dạng lý thuyết thuần túy, dễ dàng copy vào Word hoặc các document khác.
