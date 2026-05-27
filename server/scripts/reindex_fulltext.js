import { sequelize } from '../src/config/sqlserver.js';

async function reindexFullText() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected to database.');

    if (sequelize.options.dialect !== 'mssql') {
      console.log(`Current dialect is ${sequelize.options.dialect}. Reindexing is only applicable for mssql (SQL Server). Skipping...`);
      return;
    }

    console.log('Rebuilding Full-Text Catalog "ftCatalog"...');
    await sequelize.query('ALTER FULLTEXT CATALOG ftCatalog REBUILD');
    console.log('Catalog rebuild triggered.');

    const targets = ['transactions', 'categories', 'budgets', 'goals', 'debts'];
    for (const table of targets) {
      console.log(`Triggering full population for table: ${table}...`);
      await sequelize.query(`ALTER FULLTEXT INDEX ON ${table} START FULL POPULATION`);
      console.log(`Full population started for "${table}".`);
    }

    console.log('🎉 Full-Text Search reindexing triggered successfully! Rebuilding occurs asynchronously in the background.');
  } catch (error) {
    console.error('❌ Error triggering reindexing:', error);
  } finally {
    await sequelize.close();
  }
}

reindexFullText();
