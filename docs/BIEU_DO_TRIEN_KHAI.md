# Biểu đồ triển khai hệ thống (Deployment Diagram)

@startuml
node "Client (Browser)" as client
node "Frontend Server" as fe
node "Backend Server" as be
database "MongoDB Database" as db

client -- fe : HTTP/HTTPS
fe -- be : HTTP/HTTPS (API)
be -- db : MongoDB Protocol

note right of fe
  React + Vite
end note

note right of be
  Node.js + Express
end note
@enduml

## Mô tả biểu đồ triển khai hệ thống

Biểu đồ triển khai trên mô tả kiến trúc triển khai của hệ thống quản lý chi tiêu, bao gồm các thành phần chính:

- **Client (Browser):** Thiết bị của người dùng truy cập hệ thống thông qua trình duyệt web.
- **Frontend Server:** Máy chủ giao diện người dùng, triển khai ứng dụng React sử dụng Vite để build và phục vụ các file tĩnh. Nhận yêu cầu từ client và chuyển tiếp các yêu cầu API đến backend.
- **Backend Server:** Máy chủ xử lý nghiệp vụ, xây dựng bằng Node.js và Express. Nhận các yêu cầu API từ frontend, xử lý logic, xác thực, truy vấn dữ liệu và trả kết quả về frontend.
- **MongoDB Database:** Cơ sở dữ liệu NoSQL lưu trữ toàn bộ dữ liệu của hệ thống (người dùng, giao dịch, danh mục, v.v.).

Các kết nối:
- Client giao tiếp với Frontend Server qua HTTP/HTTPS.
- Frontend Server giao tiếp với Backend Server qua HTTP/HTTPS (API RESTful).
- Backend Server kết nối với MongoDB Database qua giao thức MongoDB.

Mô hình này giúp tách biệt rõ ràng giữa giao diện, xử lý nghiệp vụ và lưu trữ dữ liệu, đảm bảo khả năng mở rộng, bảo trì và bảo mật cho hệ thống.
