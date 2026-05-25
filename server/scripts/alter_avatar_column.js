import { testConnection, sequelize } from '../src/config/sqlserver.js';

(async () => {
  try {
    await testConnection();
    await sequelize.query('ALTER TABLE [users] ALTER COLUMN [avatar] NVARCHAR(MAX) NULL');
    console.log('✅ raw ALTER done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
