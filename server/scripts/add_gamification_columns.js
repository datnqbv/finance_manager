import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { sequelize } from '../src/config/sqlserver.js';

async function addGamificationColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Adding Gamification columns...');

    const queries = [
      `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'level' AND Object_ID = Object_ID(N'users'))
       BEGIN
         ALTER TABLE users ADD level INT NOT NULL CONSTRAINT DF_users_level DEFAULT 1;
       END`,
      `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'experience' AND Object_ID = Object_ID(N'users'))
       BEGIN
         ALTER TABLE users ADD experience INT NOT NULL CONSTRAINT DF_users_experience DEFAULT 0;
       END`,
      `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'lastLoginDate' AND Object_ID = Object_ID(N'users'))
       BEGIN
         ALTER TABLE users ADD lastLoginDate DATE NULL;
       END`
    ];

    for (const q of queries) {
      await sequelize.query(q);
      console.log('Executed block successfully.');
    }

    console.log('✅ Successfully added Gamification columns!');
  } catch (err) {
    console.error('❌ Error adding columns:', err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addGamificationColumns();
