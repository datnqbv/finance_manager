# Biểu đồ Usecase chi tiết: Giao dịch

```plantuml
@startuml
left to right direction
actor "Người dùng" as User
rectangle "Quản lý giao dịch" {
  usecase "Thêm giao dịch" as UC1
  usecase "Sửa giao dịch" as UC2
  usecase "Xóa giao dịch" as UC3
  usecase "Tìm kiếm/Lọc giao dịch" as UC4
}
User --> UC1
User --> UC2
User --> UC3
User --> UC4
@enduml
```

## Đặc tả usecase
- Thêm giao dịch: Người dùng nhập thông tin, hệ thống kiểm tra hợp lệ, lưu vào DB.
- Sửa giao dịch: Người dùng chọn giao dịch, chỉnh sửa, hệ thống kiểm tra và cập nhật.
- Xóa giao dịch: Người dùng chọn giao dịch, xác nhận xóa, hệ thống xóa khỏi DB.
- Tìm kiếm/Lọc: Người dùng nhập từ khóa/bộ lọc, hệ thống trả về danh sách phù hợp.
