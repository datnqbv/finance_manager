import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import statsRoutes from './routes/stats.routes.js';
import categoryRoutes from './routes/category.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import recurringRoutes from './routes/recurring.routes.js';
import goalRoutes from './routes/goal.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from './routes/chat.routes.js';
import searchRoutes from './routes/search.routes.js';
import contactRoutes from './routes/contact.routes.js';
import debtRoutes from './routes/debt.routes.js';
import importRoutes from './routes/import.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { startCronJobs } from './services/cronJob.service.js';

// Lấy __dirname an toàn cho cả ESM (dev) và pkg/CJS (exe)
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
// Khi chạy .exe (pkg), load .env từ cùng thư mục với .exe
const isPackaged = typeof process.pkg !== 'undefined';
const envPath = isPackaged
  ? path.join(path.dirname(process.execPath), '.env')
  : path.resolve('.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start cron jobs (recurring transactions auto-execute)
startCronJobs();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Tăng giới hạn để hỗ trợ upload ảnh base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Personal Finance Manager API',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/import', importRoutes);

// Serve React static files (production build)
// process.pkg is defined when running as a pkg .exe
const clientDistPath = isPackaged
  ? path.join(path.dirname(process.execPath), 'client', 'dist')
  : path.join(_dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Catch-all: serve React index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});
