# Đặc tả Use Case: Quản lý giao dịch

| Mục                | Nội dung                                                                 |
|--------------------|-------------------------------------------------------------------------|
| Tên Use Case       | Quản lý giao dịch                                                        |
| Tác nhân           | Người dùng                                                               |
| Mô tả              | Cho phép người dùng thêm, sửa, xóa, tìm kiếm các giao dịch thu/chi      |
| Tiền điều kiện     | Người dùng đã đăng nhập hệ thống                                         |
| Hậu điều kiện      | Giao dịch được lưu, cập nhật hoặc xóa khỏi hệ thống                      |
| Luồng chính        | 1. Người dùng chọn chức năng giao dịch<br>2. Nhập thông tin<br>3. Hệ thống kiểm tra hợp lệ<br>4. Lưu vào CSDL<br>5. Hiển thị kết quả thành công |
| Luồng phụ          | 2a. Người dùng nhập thiếu/thừa thông tin<br>3a. Hệ thống báo lỗi nhập liệu|
| Ngoại lệ           | - Lỗi kết nối CSDL<br>- Lỗi hệ thống<br>- Dữ liệu không hợp lệ           |
