#  Personal Finance Manager

**Personal Finance Manager** là ứng dụng web toàn diện giúp bạn quản lý tài chính cá nhân một cách hiện đại, trực quan và bảo mật. Dự án hỗ trợ quản lý thu chi, đặt mục tiêu tiết kiệm, kiểm soát ngân sách theo thời gian thực, giao dịch định kỳ tự động, thống kê chi tiết bằng biểu đồ, và nhiều tính năng tiện ích khác.

---

##  Tính năng nổi bật

###  Quản lý giao dịch
-  Thêm, sửa, xóa giao dịch thu/chi
-  Phân loại theo danh mục tùy chỉnh (icon, màu sắc)
-  Lọc giao dịch theo loại, danh mục, khoảng thời gian, số tiền
-  Tìm kiếm giao dịch theo từ khóa
-  Phân trang danh sách giao dịch
-  Xuất báo cáo PDF/Excel

###  Quản lý ngân sách
-  Thiết lập ngân sách theo danh mục hoặc tổng thể
-  Theo dõi ngân sách theo chu kỳ (hàng tuần, tháng, năm)
-  Cảnh báo tự động khi vượt ngưỡng (80%, 100%)
-  Hiển thị tiến độ chi tiêu bằng biểu đồ tròn
-  Thống kê số dư còn lại

###  Mục tiêu tài chính
-  Đặt mục tiêu tiết kiệm với icon, màu sắc tùy chỉnh
-  Theo dõi tiến độ đạt mục tiêu theo thời gian thực
-  Thêm tiền vào mục tiêu dần dần
-  Ưu tiên mục tiêu (cao, trung bình, thấp)
-  Hiển thị số ngày còn lại đến deadline
-  Thông báo khi hoàn thành mục tiêu

###  Giao dịch định kỳ
-  Tạo giao dịch tự động lặp lại (hàng ngày, tuần, tháng, năm)
-  Tạm dừng/kích hoạt giao dịch định kỳ
-  Thực hiện thủ công khi cần
-  Xem danh sách giao dịch sắp tới (30 ngày)
-  Theo dõi số lần đã thực hiện

###  Thống kê & Biểu đồ
-  Dashboard tổng quan với AI insights
-  Thống kê theo thời gian (hôm nay, tuần, tháng, năm)
-  Biểu đồ cột (Bar Chart) xu hướng thu chi 6 tháng
-  Biểu đồ tròn (Pie Chart) chi tiêu theo danh mục
-  Bảng xu hướng tài chính với % thay đổi
-  Giao dịch gần đây

###  Xác thực & Bảo mật
-  Đăng ký tài khoản mới
-  Đăng nhập với JWT token
-  Quên mật khẩu qua email (hoặc demo mode)
-  Cập nhật thông tin cá nhân
-  Đổi avatar (upload ảnh)
-  Mã hóa mật khẩu bằng bcryptjs
-  Protected routes

###  Giao diện & Trải nghiệm
-  Dark Mode/Light Mode
-  Responsive design (mobile, tablet, desktop)
-  Thông báo toast (success, error, warning)
-  Loading states & skeleton screens
-  Animations & transitions mượt mà
-  Multi-currency support (VND, USD, EUR)

---

##  Công nghệ sử dụng

### Frontend
- **React 18** - Thư viện UI
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Context API** - State management
- **Recharts** - Biểu đồ React
- **Chart.js** - Biểu đồ thống kê
- **React Icons** - Icon library
- **React Toastify** - Thông báo toast
- **jsPDF & jsPDF-AutoTable** - Xuất PDF
- **XLSX** - Xuất Excel

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Kiến trúc
- **RESTful API** - API architecture
- **MVC Pattern** - Model-View-Controller
- **Middleware** - Authentication & error handling
- **Protected Routes** - Route guards

---

##  Yêu cầu hệ thống

- **Node.js** >= 16.x
- **MongoDB** (Local hoặc MongoDB Atlas)
- **npm** hoặc **yarn**
- **Git** (để clone repository)

---

##  Hướng dẫn cài đặt & chạy dự án

### 1. Clone repository

```powershell
git clone https://github.com/datnqbv/finance_manager.git
cd Quan_ly_chi_tieu
```

### 2. Cài đặt Backend

```powershell
cd server
npm install

# Tạo file .env từ .env.example
cp .env.example .env

# Cấu hình file .env với thông tin của bạn:
# MONGODB_URI=mongodb://localhost:27017/finance_manager
# hoặc MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/finance_manager
# JWT_SECRET=your_jwt_secret_key
# PORT=5000
# CLIENT_URL=http://localhost:5173

# Chạy server
npm run dev
```

Server sẽ chạy tại: **http://localhost:5000**

### 3. Cài đặt Frontend

```powershell
cd client
npm install

# Tạo file .env (nếu cần)
cp .env.example .env

# File .env:
# VITE_API_URL=http://localhost:5000/api

# Chạy client
npm run dev
```

Client sẽ chạy tại: **http://localhost:5173**

### 4. Cấu hình MongoDB

#### Option 1: MongoDB Local
```powershell
# Cài đặt MongoDB Community Edition
# Chạy MongoDB service
mongod

# MongoDB sẽ chạy tại mongodb://localhost:27017
```

#### Option 2: MongoDB Atlas (Cloud)
1. Tạo tài khoản tại https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí
3. Lấy connection string và thay vào `MONGODB_URI` trong `.env`
4. Thêm IP của bạn vào whitelist

---

##  Cấu trúc dự án

```
Quan_ly_chi_tieu/
├── server/                           # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Cấu hình MongoDB
│   │   ├── controllers/             # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── transaction.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── budget.controller.js
│   │   │   ├── goal.controller.js
│   │   │   ├── recurring.controller.js
│   │   │   └── stats.controller.js
│   │   ├── models/                  # Database models
│   │   │   ├── User.model.js
│   │   │   ├── Transaction.model.js
│   │   │   ├── Category.model.js
│   │   │   ├── Budget.model.js
│   │   │   ├── Goal.model.js
│   │   │   └── RecurringTransaction.model.js
│   │   ├── routes/                  # API endpoints
│   │   │   ├── auth.routes.js
│   │   │   ├── transaction.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── budget.routes.js
│   │   │   ├── goal.routes.js
│   │   │   ├── recurring.routes.js
│   │   │   └── stats.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   └── error.middleware.js  # Error handling
│   │   ├── utils/
│   │   │   └── sendEmail.js         # Email utility
│   │   └── index.js                 # Entry point
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── client/                           # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── DarkModeToggle.jsx
│   │   │   ├── GlobalSearch.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── TransactionModal.jsx
│   │   │   ├── CategoryModal.jsx
│   │   │   ├── BudgetModal.jsx
│   │   │   ├── GoalModal.jsx
│   │   │   └── RecurringModal.jsx
│   │   ├── context/                 # Context API
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── TransactionContext.jsx
│   │   │   ├── CategoryContext.jsx
│   │   │   ├── BudgetContext.jsx
│   │   │   ├── GoalContext.jsx
│   │   │   └── RecurringContext.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── RecurringTransactions.jsx
│   │   │   ├── Statistics.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── services/                # API services
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── auth.service.js
│   │   │   ├── transaction.service.js
│   │   │   ├── category.service.js
│   │   │   ├── budget.service.js
│   │   │   ├── goal.service.js
│   │   │   ├── recurring.service.js
│   │   │   └── stats.service.js
│   │   ├── utils/
│   │   │   └── exportUtils.js       # PDF/Excel export
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── README.md

##  Bảo mật

-  Mật khẩu được mã hóa bằng **bcryptjs** (salt rounds: 10)
-  Xác thực bằng **JWT token** (expires: 7 days)
-  Protected routes với middleware
- Validation dữ liệu đầu vào
-  Error handling tập trung
-  CORS configuration
- Environment variables (.env)
-  Tự động logout khi token hết hạn (401)

##  API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user
- `PUT /api/auth/profile` - Cập nhật profile
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### Transactions
- `GET /api/transactions` - Lấy danh sách giao dịch
- `POST /api/transactions` - Thêm giao dịch
- `PUT /api/transactions/:id` - Sửa giao dịch
- `DELETE /api/transactions/:id` - Xóa giao dịch

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `POST /api/categories` - Thêm danh mục
- `PUT /api/categories/:id` - Sửa danh mục
- `DELETE /api/categories/:id` - Xóa danh mục

### Budgets
- `GET /api/budgets` - Lấy danh sách ngân sách
- `POST /api/budgets` - Thêm ngân sách
- `PUT /api/budgets/:id` - Sửa ngân sách
- `DELETE /api/budgets/:id` - Xóa ngân sách
- `GET /api/budgets/status` - Lấy trạng thái ngân sách
- `GET /api/budgets/alerts` - Lấy cảnh báo

### Goals
- `GET /api/goals` - Lấy danh sách mục tiêu
- `POST /api/goals` - Thêm mục tiêu
- `PUT /api/goals/:id` - Sửa mục tiêu
- `DELETE /api/goals/:id` - Xóa mục tiêu
- `POST /api/goals/:id/add-amount` - Thêm tiền vào mục tiêu
- `GET /api/goals/stats` - Thống kê mục tiêu

### Recurring Transactions
- `GET /api/recurring` - Lấy danh sách giao dịch định kỳ
- `POST /api/recurring` - Thêm giao dịch định kỳ
- `PUT /api/recurring/:id` - Sửa giao dịch định kỳ
- `DELETE /api/recurring/:id` - Xóa giao dịch định kỳ
- `POST /api/recurring/:id/execute` - Thực hiện thủ công
- `GET /api/recurring/upcoming` - Lấy giao dịch sắp tới

### Statistics
- `GET /api/stats/summary` - Tổng quan tài chính
- `GET /api/stats/monthly` - Thống kê theo tháng
- `GET /api/stats/categories` - Thống kê theo danh mục

---

##  Troubleshooting

### MongoDB connection error
- Kiểm tra MongoDB đã chạy: `mongod`
- Kiểm tra connection string trong `.env`
- Nếu dùng MongoDB Atlas, kiểm tra IP whitelist

### Port already in use
- Backend: Đổi `PORT` trong `.env`
- Frontend: Đổi port trong `vite.config.js`

### CORS errors
- Kiểm tra `CLIENT_URL` trong backend `.env`
- Đảm bảo frontend đang chạy ở đúng port

### JWT token errors
- Kiểm tra `JWT_SECRET` trong `.env`
- Xóa token cũ trong localStorage và đăng nhập lại












