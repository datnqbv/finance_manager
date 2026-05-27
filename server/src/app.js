/**
 * app.js - Express app factory (không chứa listen/connectDB)
 * Dùng riêng cho production (import vào index.js) và cho tests (import vào test files)
 */
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import statsRoutes from './routes/stats.routes.js';
import categoryRoutes from './routes/category.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import goalRoutes from './routes/goal.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import searchRoutes from './routes/search.routes.js';
import contactRoutes from './routes/contact.routes.js';
import debtRoutes from './routes/debt.routes.js';
import importRoutes from './routes/import.routes.js';
import adminRoutes from './routes/admin.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'running', version: '1.0.0' });
});

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/transactions',  transactionRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/budgets',       budgetRoutes);
app.use('/api/goals',         goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/contact',       contactRoutes);
app.use('/api/debts',         debtRoutes);
app.use('/api/import',        importRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/wallets',       walletRoutes);

// Error handling middleware (phải đứng cuối)
app.use(errorHandler);

export default app;
