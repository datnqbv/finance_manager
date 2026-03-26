# Tài liệu tổng hợp dự án Quan Ly Chi Tieu

## 1) Dự án này là gì?

Đây là ứng dụng web full-stack quản lý tài chính cá nhân, tách rõ frontend và backend:
- Frontend: React + Vite + Tailwind (thư mục `client/`)
- Backend: Node.js + Express + MongoDB/Mongoose (thư mục `server/`)

Mục tiêu chính:
- Theo dõi thu/chi hằng ngày
- Kiểm soát ngân sách theo danh mục hoặc tổng thể
- Quản lý mục tiêu tiết kiệm, nợ, giao dịch định kỳ
- Thống kê/biểu đồ và hỗ trợ tìm kiếm toàn cục

---

## 2) Kiến trúc tổng thể và luồng chạy

### 2.1 Kiến trúc lớp

- UI Layer (React Pages/Components)
- State Layer (React Context)
- API Layer Frontend (`client/src/services/*.js`)
- API Layer Backend (Routes -> Controllers)
- Data Layer (Mongoose Models -> MongoDB)

### 2.2 Luồng request điển hình

1. User thao tác trên Page (ví dụ trang Transactions)
2. Page gọi hàm từ Context (ví dụ `useTransactions()`)
3. Context gọi service frontend (ví dụ `transaction.service.js`)
4. Service dùng `api.js` (axios instance) gửi request `/api/...`
5. Backend nhận request tại file route tương ứng
6. Route gọi controller tương ứng
7. Controller đọc/ghi dữ liệu qua Mongoose model
8. Backend trả JSON response
9. Context cập nhật state + hiển thị toast
10. UI re-render

### 2.3 Quy tắc bảo mật request

- Các route private dùng middleware `protect` (`server/src/middleware/auth.middleware.js`)
- Frontend tự gắn `Authorization: Bearer <token>` trong `client/src/services/api.js`
- Khi gặp 401, frontend tự refresh token và retry request

---

## 3) Giải thích các thư mục lớn

## 3.1 Thư mục gốc

- `README.md`: giới thiệu tính năng/chức năng/công nghệ
- `build-exe.bat`: script build frontend + bundle backend + đóng gói `.exe` (Windows)
- `assets/Screenshot/`: ảnh demo giao diện
- `docs/`: tài liệu nội bộ (file này)
- `client/`: frontend React
- `server/`: backend Express + MongoDB

## 3.2 `client/` dùng để làm gì?

- Chứa toàn bộ giao diện, điều hướng, trạng thái client, và code gọi API backend.

Thành phần chính:
- `index.html`: HTML root cho Vite
- `package.json`: script chạy/build/test frontend
- `vite.config.js`: cấu hình dev server + proxy `/api` về backend
- `tailwind.config.js`, `postcss.config.js`: theme + utility CSS
- `src/`: mã nguồn chính frontend

## 3.3 `server/` dùng để làm gì?

- Chứa API, xác thực, nghiệp vụ, truy vấn DB, cron job, email, chatbot, import dữ liệu.

Thành phần chính:
- `src/index.js`: entrypoint runtime, connect DB, start cron, serve static frontend, listen port
- `src/app.js`: khởi tạo express app, gắn middleware và mount routes
- `src/config/database.js`: kết nối MongoDB
- `src/routes/`: định tuyến API theo module
- `src/controllers/`: xử lý nghiệp vụ cho từng endpoint
- `src/models/`: schema Mongoose
- `src/services/`: service nền (cron)
- `src/middleware/`: auth + error handler
- `src/utils/`: tiện ích (email)
- `tests/`: backend tests với Jest + Supertest + MongoMemoryServer
- `seed.js`: tạo dữ liệu mẫu

---

## 4) Frontend chi tiết: file nào làm gì, liên quan file nào

## 4.1 Entry & app shell

- `client/src/main.jsx`
  - Root render React app
  - Bọc `ThemeProvider`
  - Nạp `index.css`

- `client/src/App.jsx`
  - Tập trung toàn bộ Router và tree các Provider:
    - `ThemeCustomizerProvider`
    - `AuthProvider`
    - `CategoryProvider`, `BudgetProvider`, `GoalProvider`, `DebtProvider`, `TransactionProvider`
  - Định nghĩa public/protected routes

- `client/src/components/PrivateRoute.jsx`
  - Kiểm tra trạng thái đăng nhập qua `useAuth()`
  - Nếu đăng nhập: render `Layout` + `Outlet`
  - Nếu chưa: chuyển sang `/login`

- `client/src/components/PublicRoute.jsx`
  - Nếu đã đăng nhập: chuyển `/dashboard`
  - Nếu chưa: chuyển `/home`

- `client/src/components/Layout.jsx`
  - Khung chính cho trang private: sidebar, header, notifications, chatbot
  - Gọi API notification service để lấy/đánh dấu thông báo

## 4.2 Context layer (state + nghiệp vụ client)

- `client/src/context/AuthContext.jsx`
  - Quản lý user đăng nhập, login/register/logout/updateProfile/changePassword
  - Dùng `auth.service.js`

- `client/src/context/TransactionContext.jsx`
  - CRUD giao dịch + state phân trang
  - Dùng `transaction.service.js`

- `client/src/context/CategoryContext.jsx`
  - CRUD danh mục + merge/reorder
  - Dùng `category.service.js`

- `client/src/context/BudgetContext.jsx`
  - Tải overview ngân sách (gồm budgets + status + alerts)
  - Dùng `budget.service.js`

- `client/src/context/GoalContext.jsx`
  - Quản lý mục tiêu tiết kiệm
  - Dùng `goal.service.js`

- `client/src/context/DebtContext.jsx`
  - Quản lý nợ, thanh toán nợ, tất toán
  - Dùng `debt.service.js`

- `client/src/context/ThemeContext.jsx`, `ThemeCustomizerContext.jsx`
  - Quản lý dark mode/theme colors

## 4.3 Service layer frontend

- `client/src/services/api.js`
  - Axios instance dùng chung
  - Tự gắn access token
  - Tự refresh token khi 401
  - Queue các request đang chờ trong lúc refresh token

- `client/src/services/auth.service.js`
  - `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/profile`, `/auth/change-password`

- `client/src/services/transaction.service.js`
  - `/transactions` CRUD

- `client/src/services/category.service.js`
  - `/categories` CRUD + `/reorder` + `/:id/stats` + `/:id/merge`

- `client/src/services/budget.service.js`
  - `/budgets` CRUD + `/status` + `/alerts` + `/overview`

- `client/src/services/goal.service.js`
  - `/goals` CRUD + `/:id/add-amount` + `/stats`

- `client/src/services/debt.service.js`
  - `/debts` CRUD + `/:id/pay` + `/:id/settle`

- `client/src/services/notification.service.js`
  - `/notifications` lấy danh sách, mark read, delete

- `client/src/services/stats.service.js`
  - `/stats/*` endpoints cho dashboard/charts/insights

- `client/src/services/search.service.js`
  - `/search`, `/search/advanced`, `/search/suggestions`

- `client/src/services/chat.service.js`
  - `/chat/message`

## 4.4 Pages

- Public pages: `Landing`, `Login`, `Register`, `ForgotPassword`, `About`, `Contact`, `Privacy`
- Private pages: `Dashboard`, `Transactions`, `Categories`, `Budgets`, `Goals`, `Debts`, `Statistics`, `Profile`

Mối quan hệ:
- Page gọi Context hooks
- Context gọi Service
- Service gọi API backend

---

## 5) Backend chi tiết: file nào làm gì, liên quan file nào

## 5.1 Entry, app, middleware

- `server/src/index.js`
  - Load `.env`
  - Connect MongoDB (`connectDB()`)
  - Serve `client/dist` static
  - Catch-all route trả `index.html`
  - `app.listen(PORT)`

- `server/src/app.js`
  - Gắn `cors`, `express.json`, `express.urlencoded`
  - Health check `/api/health`
  - Mount tất cả route module
  - Gắn `errorHandler` cuối cùng

- `server/src/middleware/auth.middleware.js`
  - Verify JWT
  - Query user từ DB, gắn `req.user`

- `server/src/middleware/error.middleware.js`
  - Chuẩn hóa lỗi Mongoose (`CastError`, duplicate key, validation)
  - Trả JSON lỗi thống nhất

## 5.2 Route -> Controller mapping

- `auth.routes.js` -> `auth.controller.js`
  - register/login/me/profile/change-password/forgot/reset/refresh-token/logout
  - Có rate-limit cho login/register

- `transaction.routes.js` -> `transaction.controller.js`
  - CRUD giao dịch

- `category.routes.js` -> `category.controller.js`
  - CRUD + reorder + stats + merge

- `budget.routes.js` -> `budget.controller.js`
  - CRUD + status + alerts + overview

- `goal.routes.js` -> `goal.controller.js`
  - CRUD + add amount + stats

- `debt.routes.js` -> `debt.controller.js`
  - CRUD + pay + settle

- `notification.routes.js` -> `notification.controller.js`
  - list + mark read + delete

- `stats.routes.js` -> `stats.controller.js`
  - dashboard + monthly/weekly/daily/summary/forecast/trends/top-categories/ai-insights

- `search.routes.js` -> `search.controller.js`
  - global search + advanced search + suggestions

- `import.routes.js` -> `import.controller.js`
  - upload file + import transactions + template

- `chat.routes.js` -> `chat.controller.js`
  - gửi câu hỏi tới Gemini API

- `contact.routes.js` -> `contact.controller.js`
  - gửi form liên hệ public (không cần login)

## 5.3 Models (MongoDB collections)

- `User.model.js`
  - user profile, password hash, reset token, refresh token
  - pre-save hash password

- `Transaction.model.js`
  - giao dịch thu/chi
  - index theo `userId`, `date`, `type`, `category`

- `Category.model.js`
  - danh mục tùy chỉnh
  - static tạo default categories cho user mới

- `Budget.model.js`
  - ngân sách theo danh mục/tổng
  - thresholds cảnh báo + rollover

- `Goal.model.js`
  - mục tiêu tiết kiệm, history nạp tiền
  - virtual progress/remaining/daysRemaining

- `Debt.model.js`
  - khoản vay/nợ + payment history

- `Notification.model.js`
  - thông báo hệ thống

- `ContactMessage.model.js`
  - lưu form liên hệ

## 5.4 Service và tiện ích backend

- `server/src/utils/sendEmail.js`
  - gửi mã reset password
  - gửi email contact cho admin + email xác nhận cho user
  - có chế độ demo nếu chưa cấu hình email env

- `server/seed.js`
  - tạo dữ liệu demo số lượng lớn

---

## 6) Database: truy cập ở đâu, truy vấn như nào

## 6.1 Truy cập DB ở đâu?

- Kết nối DB ở `server/src/config/database.js`
  - dùng `mongoose.connect(process.env.MONGODB_URI)`

- Khởi tạo kết nối tại `server/src/index.js`
  - gọi `connectDB()` khi server start

- Truy cập dữ liệu xảy ra chủ yếu trong:
  - `server/src/controllers/*.js`

## 6.2 Cách viết truy vấn trong dự án (Mongoose)

Các pattern đang dùng thực tế:

- Đọc danh sách có filter/sort/limit:
  - `Model.find(query).sort(...).limit(...).skip(...)`

- Đọc một bản ghi:
  - `Model.findOne({ ... })`
  - `Model.findById(id)`

- Tạo mới:
  - `Model.create({ ... })`
  - `Model.insertMany([...], { ordered: false })`

- Cập nhật:
  - `Model.findByIdAndUpdate(id, update, { new: true, runValidators: true })`
  - `Model.updateMany(filter, update)`

- Xóa:
  - `Model.findByIdAndDelete(id)` hoặc findOne + remove pattern

- Thống kê/nhóm dữ liệu:
  - `Model.aggregate([...])`
  - dùng rất nhiều trong `stats.controller.js`, `search.controller.js`, `budget.controller.js`, `notification.controller.js`

- Đếm:
  - `Model.countDocuments(query)`

## 6.3 Ví dụ query style đang dùng

- Phân trang transaction:
  - `Transaction.find(query).sort(sort).skip(skip).limit(limit)`
  - `Transaction.countDocuments(query)`

- Tổng hợp dashboard/stats:
  - `Transaction.aggregate([ { $match: ... }, { $group: ... } ])`

- Gộp danh mục:
  - `Transaction.updateMany({ category: source }, { $set: { category: target } })`

- Import giao dịch hàng loạt:
  - `Transaction.insertMany(imported, { ordered: false })`

---

## 7) Chức năng đặc biệt của dự án

Đây là những điểm “khác CRUD cơ bản”:

1. Refresh token tự động ở frontend (`client/src/services/api.js`)
2. Search toàn cục đa module với aggregate (`server/src/controllers/search.controller.js`)
3. Dashboard tổng hợp và nhiều endpoint thống kê (`server/src/controllers/stats.controller.js`)
4. Import CSV/XLSX và normalize dữ liệu (`server/src/controllers/import.controller.js`)
5. Chatbot AI tích hợp Gemini (`server/src/controllers/chat.controller.js`)
6. Hệ thống notification backend + hiển thị realtime polling ở Layout
7. Build backend thành file `.exe` cho Windows (`build-exe.bat`, script `build:exe`)

---

## 8) Test: đang test những phần nào?

## 8.1 Backend test

- Framework: Jest + Supertest
- DB test: MongoMemoryServer (`server/tests/helpers/db.js`)
- Cấu hình: `server/jest.config.cjs`
- Suite đang có:
  - `auth.test.js`
  - `transaction.test.js`
  - `category.test.js`
  - `budget.test.js`
  - `goal.test.js`
  - `debt.test.js`
  - `notification.test.js`
  - `search.test.js`
  - `stats.test.js`
  - `import.test.js`

Ý nghĩa:
- Bao phủ gần như toàn bộ API domain quan trọng của backend.

## 8.2 Frontend test

- Framework: Vitest + Testing Library + jsdom
- Cấu hình: `client/vitest.config.js`, `client/src/tests/setup.js`
- Component test hiện có:
  - `BudgetModal`, `CategoryModal`, `CurrencyInput`, `DebtModal`, `GoalModal`, `Pagination`, `PrivateRoute`, `TransactionModal`

Ý nghĩa:
- Tập trung vào component logic quan trọng (form/modal/route guard).

---

## 9) Mối liên hệ file nào với file nào (Dependency map nhanh)

### Frontend map

- `main.jsx` -> `App.jsx` -> Providers + Routes
- `App.jsx` -> `PrivateRoute/PublicRoute` -> `Layout` + Pages
- `Pages` -> `Context` hooks
- `Context` -> `services/*.js`
- `services/*.js` -> `api.js` (axios)
- `api.js` -> gọi backend `/api/*`

### Backend map

- `index.js` -> `app.js` + `connectDB()`
- `app.js` -> mount `routes/*.js`
- `routes/*.js` -> gọi `controllers/*.js`
- `controllers/*.js` -> gọi `models/*.js` (Mongoose)
- `auth.middleware.js` -> `User.model.js`

---

## 10) File nào nên đọc trước nếu muốn nắm dự án nhanh?

Thứ tự đề xuất:

1. `README.md`
2. `client/src/App.jsx`
3. `client/src/services/api.js`
4. `server/src/app.js`
5. `server/src/index.js`
6. `server/src/config/database.js`
7. `server/src/routes/*.js`
8. `server/src/controllers/transaction.controller.js`
9. `server/src/controllers/stats.controller.js`
10. `server/src/models/*.js`

---

## 11) Cách chạy nhanh (tham khảo)

### Frontend
- `cd client`
- `npm install`
- `npm run dev`

### Backend
- `cd server`
- `npm install`
- cấu hình `.env` (ít nhất có `MONGODB_URI`, JWT secrets)
- `npm run dev`

### Test
- Backend: `cd server && npm test`
- Frontend: `cd client && npm test`

---
