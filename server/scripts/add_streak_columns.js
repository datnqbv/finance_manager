import { sequelize } from '../src/config/sqlserver.js';
import { QueryTypes } from 'sequelize';

async function addStreakColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB');

    // Add streakDays
    try {
      await sequelize.query(`
        ALTER TABLE users ADD streakDays INT NOT NULL CONSTRAINT DF_users_streakDays DEFAULT 0;
      `);
      console.log('✅ Added streakDays column');
    } catch (e) {
      if (e.message.includes('already has a column')) {
        console.log('⚠️ streakDays column already exists');
      } else {
        console.error('Error adding streakDays:', e.message);
      }
    }

    // Add todayExperience
    try {
      await sequelize.query(`
        ALTER TABLE users ADD todayExperience INT NOT NULL CONSTRAINT DF_users_todayExperience DEFAULT 0;
      `);
      console.log('✅ Added todayExperience column');
    } catch (e) {
      if (e.message.includes('already has a column')) {
        console.log('⚠️ todayExperience column already exists');
      } else {
        console.error('Error adding todayExperience:', e.message);
      }
    }

    // Add lastActiveDate
    try {
      await sequelize.query(`
        ALTER TABLE users ADD lastActiveDate DATE NULL;
      `);
      console.log('✅ Added lastActiveDate column');
    } catch (e) {
      if (e.message.includes('already has a column')) {
        console.log('⚠️ lastActiveDate column already exists');
      } else {
        console.error('Error adding lastActiveDate:', e.message);
      }
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error executing migration:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addStreakColumns();
