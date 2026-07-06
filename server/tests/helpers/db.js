/**
 * tests/helpers/db.js
 * Helper khởi tạo/đóng SQLite in-memory (Sequelize) cho tests.
 * Mỗi test file gọi connect() trong beforeAll và close() trong afterAll.
 */
import { sequelize, syncModels } from '../../src/models/sequelize/index.js';

// server/src/config/sqlserver.js chọn dialect (sqlite vs mssql) ngay lúc import module,
// dựa trên process.env.FORCE_SQLITE_IN_TESTS tại thời điểm đó. Việc gán biến này bên trong
// connect() là QUÁ TRỄ vì module đã import xong từ trước — nên không được dùng để "đảm bảo"
// an toàn. Thay vào đó, chặn cứng ở đây: nếu dialect thực tế không phải sqlite, ném lỗi ngay
// thay vì lỡ tay DROP/TRUNCATE database thật (đã từng xảy ra khi biến env bị set sai cú pháp
// ở một shell không tương thích, khiến test nối vào SQL Server thật và force-sync xóa sạch dữ liệu).
const assertSqliteDialect = (action) => {
  const dialect = sequelize.getDialect();
  if (dialect !== 'sqlite') {
    throw new Error(
      `Refusing to ${action}: Sequelize dialect is '${dialect}', not 'sqlite'. ` +
      'FORCE_SQLITE_IN_TESTS must be set to \'true\' in the environment BEFORE node starts ' +
      '(e.g. `FORCE_SQLITE_IN_TESTS=true node ...` on POSIX shells, or via the npm test script on Windows) ' +
      '— never rely on setting it inside test code, since config/sqlserver.js reads it at import time.'
    );
  }
};

/**
 * Khởi tạo DB in-memory và sync models
 */
export const connect = async () => {
  assertSqliteDialect('sync (force: true)');
  await syncModels({ force: true });
};

/**
 * Đóng kết nối và xóa schema
 */
export const close = async () => {
  assertSqliteDialect('drop database');
  await sequelize.drop();
  await sequelize.close();
};

/**
 * Xóa toàn bộ data trong tất cả tables (chạy sau mỗi test)
 */
export const clear = async () => {
  assertSqliteDialect('truncate tables');
  const models = sequelize.models;
  for (const name of Object.keys(models)) {
    await models[name].destroy({ where: {}, truncate: true, force: true });
  }
};
