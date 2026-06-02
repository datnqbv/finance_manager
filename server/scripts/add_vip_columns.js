import { sequelize } from '../src/models/sequelize/index.js';

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    const dialect = sequelize.getDialect();
    console.log(`Database dialect: ${dialect}`);

    if (dialect === 'mssql') {
      console.log('Checking columns in "users" table...');
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users';
      `);

      const columnNames = columns.map(c => c.COLUMN_NAME.toLowerCase());
      
      if (!columnNames.includes('isvip')) {
        console.log('Adding column "isVip" to "users" table...');
        await sequelize.query('ALTER TABLE [users] ADD [isVip] BIT NOT NULL DEFAULT 0;');
        console.log('Added "isVip" column.');
      } else {
        console.log('"isVip" column already exists.');
      }

      if (!columnNames.includes('vipexpire')) {
        console.log('Adding column "vipExpire" to "users" table...');
        await sequelize.query('ALTER TABLE [users] ADD [vipExpire] DATETIMEOFFSET NULL;');
        console.log('Added "vipExpire" column.');
      } else {
        console.log('"vipExpire" column already exists.');
      }

      console.log('Database columns updated successfully!');
    } else {
      console.log('Not using SQL Server. No column additions needed.');
    }
  } catch (error) {
    console.error('Failed to add columns:', error);
  } finally {
    await sequelize.close();
  }
}

run();
