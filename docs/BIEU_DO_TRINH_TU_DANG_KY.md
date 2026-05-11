# Biểu đồ trình tự chức năng đăng ký

```plantuml
@startuml
autonumber
actor U as User
participant UI
participant API
database DB

User -> UI: Nhập tên, email, mật khẩu
UI -> API: POST /api/auth/register
API -> DB: Kiểm tra email
DB --> API: Kết quả

alt Email chưa tồn tại
  API -> DB: Tạo tài khoản mới
  DB --> API: Tạo thành công
  API -> DB: Tạo danh mục mặc định
  DB --> API: Đã tạo
  API --> UI: Trả access token + refresh token
  UI --> User: Đăng ký thành công
else Email đã tồn tại
  API --> UI: Trả lỗi email đã tồn tại
  UI --> User: Hiển thị lỗi
end
@enduml
```
