import dotenv from 'dotenv';
import path from 'path';
import { sequelize } from '../src/models/sequelize/index.js';

dotenv.config({ path: path.resolve('.env') });

async function check() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB');
    
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'transactions'
    `);
    
    console.log('Columns in transactions table:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });
    
    const hasParentId = columns.some(col => col.COLUMN_NAME === 'parentId');
    if (hasParentId) {
      console.log('🎉 SUCCESS: parentId column exists in the database table "transactions".');
    } else {
      console.log('❌ FAILURE: parentId column does NOT exist in the database table "transactions".');
    }
  } catch (err) {
    console.error('❌ Error checking database:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

check();
