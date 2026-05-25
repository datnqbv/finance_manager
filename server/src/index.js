import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import connectDB from './config/database.js';
import app from './app.js';

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

const PORT = process.env.PORT || 5000;

// Connect to SQL Server via Sequelize
connectDB();

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

// Start server
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});
