/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Không transform vì project dùng ESM native
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    '!src/index.js',
    '!src/app.js',
  ],
  testTimeout: 30000,
  // Chạy tuần tự để tránh conflict DB giữa các test suite
  maxWorkers: 1,
};
