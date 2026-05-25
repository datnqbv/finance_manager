/**
 * tests/helpers/db.js
 * Helper khởi tạo/đóng SQLite in-memory (Sequelize) cho tests.
 * Mỗi test file gọi connect() trong beforeAll và close() trong afterAll.
 */
import { sequelize, syncModels } from '../../src/models/sequelize/index.js';

/**
 * Khởi tạo DB in-memory và sync models
 */
export const connect = async () => {
  // Ensure the SQL config uses in-memory sqlite (also set by npm test via env)
  process.env.FORCE_SQLITE_IN_TESTS = process.env.FORCE_SQLITE_IN_TESTS || 'true';
  await syncModels({ force: true });
};

/**
 * Đóng kết nối và xóa schema
 */
export const close = async () => {
  await sequelize.drop();
  await sequelize.close();
};

/**
 * Xóa toàn bộ data trong tất cả tables (chạy sau mỗi test)
 */
export const clear = async () => {
  const models = sequelize.models;
  for (const name of Object.keys(models)) {
    await models[name].destroy({ where: {}, truncate: true, force: true });
  }
};
