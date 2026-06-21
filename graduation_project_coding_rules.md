# CẨM NANG QUY TẮC PHÁT TRIỂN & CHUẨN HÓA MÃ NGUỒN (CODING STANDARDS)
## Dự án: Quản Lý Chi Tiêu (Finance Manager) - Tài Liệu Dành Cho Đồ Án Tốt Nghiệp

Tài liệu này định nghĩa hệ quy tắc cấu trúc mã nguồn (coding standards), kiến trúc thư mục, cách tổ chức cơ sở dữ liệu, và quy trình xử lý lỗi thống nhất cho cả Frontend (React + Vite), Backend (Express.js + ES Modules) và Database (SQL Server/Sequelize). Mục tiêu là tạo ra một mã nguồn sạch, tối ưu, bảo mật cao và dễ bảo trì để bảo vệ xuất sắc trước Hội đồng Đồ án Tốt nghiệp.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG
Dự án áp dụng mô hình client-server truyền thống và kiến trúc phân lớp (Layered Architecture):

```mermaid
graph TD
    subgraph Frontend (React SPA)
      UI[Components & Pages] --> Contexts[React Context API]
      Contexts --> Services[Axios Services Layer]
    end

    subgraph Backend (Express REST API)
      Routes[Routes Layer] --> Middlewares[Authentication & Validation]
      Middlewares --> Controllers[Controllers Layer]
      Controllers --> ServicesBE[Services Layer - Business Logic]
      ServicesBE --> Models[Sequelize ORM Models]
    end

    subgraph Database Layer
      Models --> MSSQL[(MS SQL Server - Production)]
      Models --> SQLite[(SQLite - Testing/In-memory)]
    end

    Services --> Routes
```

---

## 2. QUY TẮC PHÂN CHIA THƯ MỤC & FILE
Để hội đồng đánh giá cao tính cấu trúc, các file phải được đặt đúng thư mục chức năng:

### A. Backend (`server/src`)
- `config/`: Nơi chứa cấu hình hệ thống (kết nối DB, PayOS, Mailer).
- `models/`: Định nghĩa các Sequelize Model. Chứa thư mục `sequelize/` để gom nhóm các model SQL.
- `routes/`: Định nghĩa endpoint API, phân chia theo thực thể (auth, transaction, budget, v.v.).
- `middleware/`: Chứa các bộ lọc request (xác thực JWT, phân quyền Admin/VIP, validation đầu vào).
- `controllers/`: Nhận request từ router, gọi service để xử lý và trả về phản hồi HTTP (không viết logic nghiệp vụ tại đây).
- `services/`: Nơi chứa toàn bộ logic nghiệp vụ (tính toán, tương tác DB phức tạp, tích hợp thanh toán).
- `utils/`: Các hàm bổ trợ dùng chung (tính toán gamification, định dạng ngày tháng, hash mật khẩu).

### B. Frontend (`client/src`)
- `components/`: Các UI Component tái sử dụng (Button, Input, Modal, Chart).
- `pages/`: Các trang lớn tương ứng với các route chính (Dashboard, Leaderboard, VipSubscription, Landing).
- `context/`: State toàn cục bằng React Context (quản lý ví, giao dịch, danh mục, ngân sách).
- `services/`: Gửi request API (sử dụng Axios client dùng chung kèm interceptors).
- `utils/`: Các hàm định dạng tiền tệ, xử lý ngày tháng, helper.
- `tests/`: Chứa các kịch bản kiểm thử giao diện và component.

---

## 3. QUY TẮC THIẾT KẾ & TƯƠNG TÁC DATABASE (SEQUELIZE)
Cơ sở dữ liệu của đồ án tốt nghiệp cần đảm bảo tính toàn vẹn dữ liệu cực kỳ khắt khe:

### 3.1. Quy tắc định nghĩa Model
1. **Tên file & Model**: Viết hoa chữ cái đầu (PascalCase), dạng số ít. Ví dụ: [User.js](file:///d:/Laptrinh_Web/Quan_ly_chi_tieu/server/src/models/sequelize/User.js), [Transaction.js](file:///d:/Laptrinh_Web/Quan_ly_chi_tieu/server/src/models/sequelize/Transaction.js).
2. **Khóa ngoại**: Phải được liên kết rõ ràng thông qua Sequelize Associations trong file [index.js](file:///d:/Laptrinh_Web/Quan_ly_chi_tieu/server/src/models/sequelize/index.js). Tránh định nghĩa khóa ngoại rời rạc.
3. **Kiểu dữ liệu tiền tệ**: Sử dụng `DECIMAL(18,2)` hoặc `DECIMAL(15,2)` để tránh sai số dấu phẩy động (không bao giờ dùng `FLOAT` hoặc `DOUBLE` cho tiền tệ).
4. **Mặc định & Ràng buộc**: Phải khai báo `defaultValue` rõ ràng và kiểm tra `allowNull` để chặn dữ liệu rác từ tầng DB.

### 3.2. Tính toàn vẹn dữ liệu thông qua Transaction (Giao dịch)
Mọi tác vụ ghi/sửa đổi dữ liệu ảnh hưởng đến nhiều bảng cùng lúc **bắt buộc phải sử dụng Database Transactions** (`sequelize.transaction`).
- *Lý do*: Tránh trường hợp tạo giao dịch chi tiêu thành công nhưng ví tiền không bị trừ do backend gặp sự cố giữa chừng.

**Mẫu code chuẩn hóa nghiệp vụ tạo Giao dịch (Transaction) trong Backend Service:**
```javascript
import { sequelize } from '../config/sqlserver.js';
import Wallet from '../models/sequelize/Wallet.js';
import Transaction from '../models/sequelize/Transaction.js';

export const createExpenseTransaction = async (data, userId) => {
  // Bắt đầu một Transaction
  const t = await sequelize.transaction();
  try {
    // 1. Tìm ví và khóa dòng (Lock row) để tránh tranh chấp số dư (Race Condition)
    const wallet = await Wallet.findOne({
      where: { id: data.walletId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!wallet) throw new Error('Ví không tồn tại');
    if (wallet.balance < data.amount) throw new Error('Số dư ví không đủ');

    // 2. Trừ số dư ví
    wallet.balance = Number(wallet.balance) - Number(data.amount);
    await wallet.save({ transaction: t });

    // 3. Ghi nhận lịch sử giao dịch
    const newTransaction = await Transaction.create({
      ...data,
      userId,
      type: 'expense'
    }, { transaction: t });

    // Commit nếu tất cả thành công
    await t.commit();
    return newTransaction;
  } catch (error) {
    // Rollback lại toàn bộ dữ liệu nếu có lỗi xảy ra
    await t.rollback();
    throw error;
  }
};
```

### 3.3. Eager Loading (Include) vs Lazy Loading
- Khi truy vấn thực thể có mối quan hệ, luôn sử dụng `include` một cách có chọn lọc và chỉ lấy các trường dữ liệu cần thiết để tối ưu hóa hiệu năng truy vấn.
```javascript
// Tốt: Chỉ lấy tên và email của user liên quan
const transactions = await Transaction.findAll({
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email']
    }
  ]
});
```

---

## 4. QUY TẮC BACKEND (SERVER API)
Tất cả các API được viết ra phải tuân thủ chuẩn RESTful hướng chuẩn hóa chất lượng cao:

### 4.1. Cấu trúc Routing & Phản hồi HTTP (HTTP Status Codes)
Không bao giờ trả lời tất cả lỗi bằng `200 OK` chứa cờ báo lỗi. Sử dụng đúng mã trạng thái HTTP:
- `200 OK`: Truy vấn, cập nhật hoặc xóa dữ liệu thành công.
- `201 Created`: Tạo mới bản ghi thành công (User, Transaction, Budget...).
- `400 Bad Request`: Lỗi dữ liệu đầu vào không hợp lệ (Validation fails).
- `401 Unauthorized`: Người dùng chưa đăng nhập hoặc Token hết hạn/không hợp lệ.
- `403 Forbidden`: Người dùng hợp lệ nhưng không có quyền truy cập tài nguyên (Ví dụ: Tài khoản thường vào trang VIP, hoặc User thường truy cập khu vực Admin).
- `404 Not Found`: Không tìm thấy tài nguyên yêu cầu.
- `500 Internal Server Error`: Lỗi hệ thống hoặc lỗi database chưa được xử lý.

### 4.2. Định dạng phản hồi JSON thống nhất
Mọi API phản hồi phải tuân theo cấu trúc JSON chuẩn sau:

- **Khi thành công (Success Response):**
```json
{
  "success": true,
  "message": "Thông điệp mô tả kết quả xử lý thành công",
  "data": { ... } // Đối tượng hoặc danh sách trả về
}
```

- **Khi có lỗi xảy ra (Error Response):**
```json
{
  "success": false,
  "message": "Thông điệp mô tả lỗi chi tiết cho client hiển thị",
  "errors": [] // Danh sách lỗi chi tiết nếu là lỗi validation dữ liệu
}
```

### 4.3. Middleware kiểm tra dữ liệu (Validation) và Phân quyền
1. **Kiểm tra dữ liệu đầu vào (Input Validation)**: Sử dụng thư viện `express-validator` để lọc và làm sạch dữ liệu trước khi chuyển tiếp đến Controller.
2. **Xác thực JWT**: Token được truyền trong header dưới định dạng `Authorization: Bearer <token>`.
3. **Phân quyền người dùng**: Tách biệt rõ quyền hạn thông qua middlewares như `verifyAdmin`, `verifyVip` để đảm bảo tính bảo mật.

**Mẫu Route Controller phân quyền và kiểm định dữ liệu chuẩn:**
```javascript
import { Router } from 'express';
import { body } from 'express-validator';
import { verifyJWT, verifyAdmin } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import * as vipController from '../controllers/vip.controller.js';

const router = Router();

// Endpoint yêu cầu đăng nhập và quyền Admin để xác nhận thanh toán VIP thủ công
router.post(
  '/admin-confirm/:paymentId',
  verifyJWT,
  verifyAdmin,
  [
    body('status').isIn(['completed', 'failed']).withMessage('Trạng thái thanh toán không hợp lệ')
  ],
  validateRequest,
  vipController.adminConfirmPayment
);
```

### 4.4. Cơ chế xử lý lỗi tập trung (Centralized Error Handler)
Tránh việc lặp đi lặp lại khối `try-catch` trong Controller và ghi đè lỗi không kiểm soát. Sử dụng một hàm bọc Async (Async Wrapper) kết hợp Middleware xử lý lỗi tập trung của Express:

```javascript
// utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// middleware/error.middleware.js
export const errorHandler = (err, req, res, next) => {
  console.error('🔥 Server Error LOG:', err);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nghiêm trọng xảy ra',
    errors: err.errors || []
  });
};
```

---

## 5. QUY TẮC FRONTEND (REACT CLIENT)
Frontend cần được tổ chức cấu trúc chặt chẽ, tối ưu trải nghiệm và xử lý bất đồng bộ mượt mà:

### 5.1. Định dạng Tên & Phong cách Viết Mã
- **Tên Component**: Đặt tên theo dạng `PascalCase`. Ví dụ: `TransactionList.jsx`, `VipPlanCard.jsx`.
- **Hooks**: Sử dụng tiền tố `use` ở trước. Ví dụ: `useTransaction`, `useAuth`.
- **CSS / Styling**: Sử dụng Tailwind CSS đồng bộ. Tránh viết inline-style (`style={{ ... }}`) ngoại trừ các trường hợp đặc biệt liên quan đến giá trị tính toán động từ JavaScript (như thanh tiến trình, vị trí hoạt ảnh động).

### 5.2. Quản lý trạng thái thông qua Context API (Pattern chuẩn)
Để tối ưu hóa hiệu năng và tránh "Prop Drilling" (truyền props qua quá nhiều tầng trung gian), hãy thiết lập các Context phục vụ cho từng nghiệp vụ dữ liệu riêng biệt. Mỗi Context cần có một custom hook đi kèm để bảo bọc dữ liệu và bắt lỗi khi sử dụng ngoài Provider:

**Mẫu thiết kế Context API chuyên nghiệp cho Đồ án:**
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as walletService from '../services/wallet.service';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await walletService.getAllWallets();
      setWallets(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách ví');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return (
    <WalletContext.Provider value={{ wallets, loading, error, refreshWallets: fetchWallets }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom Hook an toàn
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet phải được bọc bên trong thẻ <WalletProvider>');
  }
  return context;
};
```

### 5.3. Xử lý API & Token hết hạn bằng Axios Interceptors
Mọi liên kết API phải đi qua Axios instance tập trung để cấu hình tự động gắn JWT Token vào header và bắt lỗi `401 Unauthorized` để chuyển hướng đăng xuất hoặc làm mới Token:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Tự động đính kèm JWT Token vào Header của mọi yêu cầu
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Tự động chặn lỗi từ Server trả về
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> Xóa bộ nhớ tạm và chuyển hướng về trang đăng nhập
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 6. QUY TẮC BẢO MẬT & KIỂM THỬ ĐỒ ÁN
Để thuyết phục hội đồng chấm thi đồ án tốt nghiệp, ứng dụng cần chứng minh được tính bảo mật thông tin và độ tin cậy của mã nguồn:

### 6.1. Phòng chống các lỗ hổng cơ bản
1. **SQL Injection**: Không sử dụng chuỗi cộng trực tiếp (`query = "SELECT * FROM Users WHERE id = " + input`) trong SQL Server. Luôn dùng Sequelize ORM hoặc truyền biến thông qua ràng buộc dữ liệu (`replacements` / `bind` parameters).
2. **XSS (Cross-Site Scripting)**: Khi hiển thị dữ liệu do người dùng nhập lên giao diện, không được sử dụng thuộc tính `dangerouslySetInnerHTML` trong React mà không đi kèm với bộ thư viện lọc sạch dữ liệu như `DOMPurify`.
3. **Mã hóa mật khẩu**: Tất cả mật khẩu lưu trong DB bắt buộc phải băm bằng thuật toán bảo mật (ví dụ: `bcryptjs` với độ muối là `10` vòng băm).

### 6.2. Kiểm thử mã nguồn (Testing Strategy)
Đồ án cần có bộ kiểm thử tự động để kiểm thử các luồng xử lý cốt lõi:
- **Database cách ly**: Trong chế độ test, luôn thiết lập cấu hình chuyển đổi dialect Sequelize sang `sqlite` và bộ nhớ tạm `:memory:` thông qua cờ cấu hình môi trường để đảm bảo kiểm thử chạy nhanh, độc lập và không làm bẩn dữ liệu thật tại máy chủ SQL Server.
- **Tỷ lệ kiểm thử bao phủ (Test Coverage)**: Tập trung viết kiểm thử tích hợp (Integration tests) cho các chức năng nhạy cảm như: Phân quyền VIP, Thanh toán PayOS, Cập nhật số dư ví tài chính, và các cơ chế thăng cấp/tính toán Gamification (XP & Streak đăng nhập).

---

*Cẩm nang này là quy ước lập trình bắt buộc đối với dự án. Mọi thay đổi cấu trúc mã nguồn hoặc bổ sung thực thể mới phải tuân thủ nghiêm ngặt theo các tiêu chuẩn thiết kế trên.*
