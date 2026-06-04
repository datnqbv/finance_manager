# Google OAuth Login - Hướng Dẫn Tóm Tắt

## 🎯 Ý Chính

Dự án đã có code Google Login sẵn, chỉ cần config Google Cloud Console và `.env` files.

---

## 📋 3 Bước Chính

### **Bước 1: Tạo Google Cloud Credentials**
- Vào: https://console.cloud.google.com/
- `APIs & Services > Credentials > Create Credentials > OAuth client ID`
- Chọn: **Web application**
- Thêm **Authorized JavaScript origins**:
  ```
  http://localhost:5173
  http://localhost:5000
  https://your-ngrok-domain.ngrok-free.dev  (nếu dùng ngrok)
  ```
- **Copy Client ID & Client Secret**

### **Bước 2: Cấu hình .env Files**

**client/.env**:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_API_URL=/api
```

**server/.env**:
```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
JWT_SECRET=min_32_chars_long_secret_here
JWT_REFRESH_SECRET=min_32_chars_refresh_secret_here
MONGODB_URI=your_mongodb_connection_string
```

### **Bước 3: Chạy & Test**

**Terminal 1 (Backend)**:
```powershell
cd server
npm run dev
```

**Terminal 2 (Frontend)**:
```powershell
cd client
npm run dev
```

- Mở: http://localhost:5173/login
- Click "Sign in with Google"
- Nếu thành công → `/dashboard`

---

## 🛠️ Các File Liên Quan

| File | Mục đích |
|------|---------|
| [client/src/main.jsx](client/src/main.jsx) | GoogleOAuthProvider setup |
| [client/src/pages/Login.jsx](client/src/pages/Login.jsx) | Google Login button |
| [client/src/context/AuthContext.jsx](client/src/context/AuthContext.jsx) | googleLogin method |
| [server/src/controllers/auth.controller.js](server/src/controllers/auth.controller.js) | Verify token & tạo/tìm user |
| [server/src/routes/auth.routes.js](server/src/routes/auth.routes.js) | `/api/auth/google` route |
| [server/src/models/User.model.js](server/src/models/User.model.js) | User schema (có googleId field) |

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|---------|
| `origin_mismatch` | Domain chưa add vào Google Console | Add domain vào "Authorized JavaScript origins" |
| `VITE_GOOGLE_CLIENT_ID undefined` | Chưa tạo `client/.env` | Tạo file `.env` với VITE_GOOGLE_CLIENT_ID |
| Token verify fail | Sai GOOGLE_CLIENT_ID ở backend | Kiểm tra `server/.env` có đúng ID không |

---

## 🔐 Bảo Mật

- ✅ Thêm `.env` vào `.gitignore` (không commit secrets)
- ✅ Access Token: 15 phút, Refresh Token: 30 ngày
- ✅ CORS được setup ở backend

---

## 🚀 Deploy với Ngrok

Thêm ngrok domain vào Google Cloud Console:
```
https://your-ngrok-domain.ngrok-free.dev
```

Khởi động ngrok:
```powershell
ngrok http 5173 --log=stdout
```

---

## ✅ Checklist

- [ ] Tạo OAuth 2.0 Client ID trên Google Cloud
- [ ] Copy Client ID & Secret
- [ ] Tạo `client/.env` với VITE_GOOGLE_CLIENT_ID
- [ ] Tạo `server/.env` với GOOGLE_CLIENT_ID & SECRET
- [ ] Chạy backend: `npm run dev` (ở server/)
- [ ] Chạy frontend: `npm run dev` (ở client/)
- [ ] Test login: http://localhost:5173/login
- [ ] Verify user tạo trên MongoDB
- [ ] (Tuỳ chọn) Test trên ngrok URL

