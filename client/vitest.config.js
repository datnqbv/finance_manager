import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Dùng jsdom để giả lập browser environment
    environment: 'jsdom',
    // File setup chạy trước mỗi test (import @testing-library/jest-dom)
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
    css: false,
  },
});
