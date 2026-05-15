# Personal Finance Manager

Ứng dụng web full-stack quản lý chi tiêu cá nhân, tập trung vào 3 bài toán chính: theo dõi dòng tiền, kiểm soát ngân sách và ra quyết định dựa trên dữ liệu thống kê.

README này được viết theo hướng nhà tuyển dụng có thể đọc nhanh trong 1-2 phút để nắm rõ dự án làm gì, sử dụng công nghệ gì và thể hiện năng lực kỹ thuật ra sao.

## 1) Tổng quan nhanh

- Bài toán: người dùng cá nhân thường khó theo dõi thu chi, dễ vượt ngân sách và thiếu góc nhìn tổng quan tài chính.
- Giải pháp: ứng dụng hỗ trợ quản lý giao dịch, mục tiêu tiết kiệm, khoản nợ, thống kê biểu đồ, tìm kiếm toàn cục và xuất báo cáo.
- Giá trị kỹ thuật: kiến trúc tách `client/server`, REST API, xác thực JWT + refresh token, có kiểm thử cho cả frontend và backend.

# Hướng Dẫn Chạy Dự Án

Tài liệu này hướng dẫn cách chạy dự án **Personal Finance Manager / Quản lý chi tiêu** trên máy local, bao gồm cấu hình môi trường, chạy frontend, backend và cách build file `.exe` trên Windows nếu cần.

## 1. Yêu cầu trước khi chạy

Trước khi bắt đầu, hãy đảm bảo máy của bạn đã có:

- `Node.js` phiên bản LTS trở lên.
- `npm` đi kèm với Node.js.
- `MongoDB` đang chạy local hoặc một chuỗi kết nối MongoDB Atlas hợp lệ.
- Tài khoản Google và `Google OAuth Client ID` nếu muốn dùng đăng nhập Google.
- Tài khoản email Gmail và `App Password` nếu muốn dùng chức năng gửi mail.

### 2. Tạo file môi trường cho backend

Trong thư mục `server`, tạo file `.env` dựa trên nội dung mẫu và điền giá trị thật của bạn.

Các biến quan trọng:

- `NODE_ENV`: chế độ chạy, thường là `development` khi dev.
- `PORT`: cổng backend, mặc định là `5000`.
- `MONGODB_URI`: chuỗi kết nối MongoDB.
- `JWT_SECRET`: secret dùng để ký access token.
- `JWT_REFRESH_SECRET`: secret riêng cho refresh token, có thể dùng giá trị khác `JWT_SECRET`.
- `GOOGLE_CLIENT_ID`: client ID dùng cho xác thực Google.
- `EMAIL_USER`: địa chỉ Gmail dùng để gửi email.
- `EMAIL_PASS`: `App Password` của Gmail, không phải mật khẩu đăng nhập thông thường.

### 2.2. Cấu hình cho frontend

Frontend đọc biến môi trường bằng `VITE_...`.

Các biến quan trọng:

- `VITE_API_URL`: URL backend API, ví dụ `http://localhost:5000/api`.
- `VITE_GOOGLE_CLIENT_ID`: Google client ID dùng ở phía trình duyệt.

### 2.3. Ví dụ nhanh

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://np21062004_db_user:
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
GOOGLE_CLIENT_ID=replace-with-your-google-oauth-client-id.apps.googleusercontent.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=replace-with-your-google-oauth-client-id.apps.googleusercontent.com
```

## 3. Cài đặt dependencies

Dự án tách thành hai phần nên cần cài đặt riêng:

### 3.1. Frontend

```bash
cd client
npm install
```

### 3.2. Backend

```bash
cd server
npm install
```

## 4. Chạy dự án ở môi trường phát triển

### 4.1. Chạy backend

Mở terminal tại thư mục `server` và chạy:

```bash
npm run dev
```

Backend mặc định sẽ chạy ở `http://localhost:5000` nếu bạn giữ nguyên `PORT=5000`.

### 4.2. Chạy frontend

Mở terminal khác tại thư mục `client` và chạy:

```bash
npm run dev
```



















