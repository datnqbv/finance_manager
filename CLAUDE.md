# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Finance Manager (Quản Lý Chi Tiêu) — a full-stack graduation project. React/Vite frontend + Express.js backend + SQL Server (Sequelize ORM). Vietnamese is the primary language for UI text and comments.

## Development Commands

### Install dependencies (no root package.json — install separately)
```bash
cd client && npm install
cd server && npm install
```

### Run development servers
```bash
# Backend (port 5000)
cd server && npm run dev

# Frontend (port 5173, proxies /api to backend)
cd client && npm run dev
```

### Testing
```bash
# Backend — Jest with in-memory SQLite (sequential, single worker)
cd server && npm test

# Frontend — Vitest with jsdom
cd client && npm test
cd client && npm run test:watch       # watch mode
cd client && npm run test:coverage    # with coverage
```

Backend tests require `FORCE_SQLITE_IN_TESTS=true` (set automatically by the npm script). Tests run with `--experimental-vm-modules` for ESM support and `maxWorkers: 1` to prevent DB conflicts.

### Lint
```bash
cd client && npm run lint
```

### Build
```bash
# Frontend production build
cd client && npm run build

# Windows executable (esbuild + pkg)
cd server && npm run build:exe
```

## Architecture

**Layered backend:** Routes → Middleware (validation, JWT, admin/VIP checks) → Controllers (HTTP handling only) → Services (business logic) → Sequelize Models → SQL Server

**Frontend state:** React Context API (one context per domain: Auth, Transaction, Wallet, Category, Budget, Goal, Debt, Theme, Language). No Redux. Each context exposes a custom `use*` hook.

**API layer:** Single Axios instance (`client/src/services/api.js`) with interceptors for JWT injection, token refresh queue (prevents multiple simultaneous refreshes on 401), and GET response caching (5-min TTL, invalidated on mutations).

**Routing:** React Router v6 with lazy-loaded pages and Suspense. Route guards via `PrivateRoute` / `PublicRoute`. Admin routes are role-gated.

**Production serving:** Backend serves the built React app from `client/dist/` with a catch-all for SPA routing.

## Key Conventions

### API response format (all endpoints)
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [] }
```

### Database
- UUID primary keys everywhere (never auto-increment)
- `DECIMAL(18,2)` for all currency fields (never FLOAT/DOUBLE)
- Multi-table writes **must** use `sequelize.transaction()` with row-level locking (`lock: t.LOCK.UPDATE`) to prevent race conditions (e.g., expense creation deducts wallet balance atomically)
- Sequelize associations defined in `server/src/models/sequelize/index.js`

### Error handling
- Backend uses `asyncHandler` wrapper (no try-catch in controllers) + centralized `errorHandler` middleware
- Custom `ErrorResponse` class for structured errors with HTTP status codes

### Auth flow
- JWT: 15-min access token + 30-day refresh token
- Token sent via `Authorization: Bearer <token>` header (or query string for SSE)
- Google OAuth via `google-auth-library`
- Password hashing: bcryptjs, 10 salt rounds

### Frontend styling
- Tailwind CSS with dark mode (class strategy via ThemeContext)
- Inline styles only for dynamically computed values (progress bars, animation positions)
- i18n via LanguageContext (Vietnamese/English)

## Environment Variables

Backend: `server/.env` (see `server/.env.example` for template) — SQL Server connection, JWT secret, Google OAuth, Gmail app password, PayOS keys.

Frontend: `client/.env` — `VITE_API_URL=/api` and `VITE_GOOGLE_CLIENT_ID`.

## Notable Subsystems

- **Recurring transactions:** Background scheduler (`recurring.scheduler.js`) runs on server startup, executes due transactions daily
- **Forecasting:** XGBoost-style ensemble in `xgboost.forecast.service.js` — combines linear trend, weighted recent average, adaptive moving average, and median forecast
- **Full-text search:** Pluggable architecture; currently falls back to SQL `LIKE` queries. FTS engine integration point in `search.service.js` and `utils/fts.js`
- **VIP/Payments:** PayOS payment gateway integration (`vip.service.js`), admin approval workflow
- **Data import/export:** CSV/Excel import via `multer` + `csv-parse`; PDF export via `jsPDF`; Excel export via `XLSX`


## Answer 
- Luôn trả lời người dùng bằng tiếng việt , viết rõ ý , câu trả lời đúng trọng tâm và luôn comment giải thích code mỗi khi làm , comment chỉ cần mô tả khái quát là code đó để làm gì
