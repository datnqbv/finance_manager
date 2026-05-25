import { Sequelize } from 'sequelize';

// Allow tests to force an in-memory SQLite DB by setting FORCE_SQLITE_IN_TESTS=true
const {
  SQLSERVER_HOST = 'localhost',
  SQLSERVER_PORT = 1433,
  SQLSERVER_USER = 'sa',
  SQLSERVER_PASSWORD = '123456789',
  SQLSERVER_DATABASE = 'FinanceManager',
  SQLSERVER_ENCRYPT = 'false',
} = process.env;

let sequelize;

if (process.env.FORCE_SQLITE_IN_TESTS === 'true') {
  // In-memory SQLite for fast tests
  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
} else {
  // Default: SQL Server (mssql)
  sequelize = new Sequelize(SQLSERVER_DATABASE, SQLSERVER_USER, SQLSERVER_PASSWORD, {
    host: SQLSERVER_HOST,
    port: Number(SQLSERVER_PORT),
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: SQLSERVER_ENCRYPT === 'true',
      },
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

export { sequelize };

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB');
  } catch (err) {
    console.error('❌ Unable to connect to DB:', err.message || err);
    throw err;
  }
}
