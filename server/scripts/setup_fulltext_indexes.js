import { sequelize } from '../src/config/sqlserver.js';

async function setupFullTextIndexes() {
  try {
    // 1. Connect to database
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Check if dialect is mssql
    if (sequelize.options.dialect !== 'mssql') {
      console.log(`Current dialect is ${sequelize.options.dialect}. Full-Text Indexes setup is only applicable for mssql (SQL Server). Skipping...`);
      return;
    }

    // 2. Check if Full-Text Search is installed in SQL Server
    const [ftCheck] = await sequelize.query(`SELECT SERVERPROPERTY('IsFullTextInstalled') AS IsFullTextInstalled`);
    const isFtInstalled = ftCheck && ftCheck[0] && ftCheck[0].IsFullTextInstalled;
    if (isFtInstalled !== 1) {
      console.warn('⚠️ WARNING: SQL Server Full-Text Search feature is not installed or enabled on this SQL Server instance!');
      console.warn('Full-text queries might fail or fall back unless enabled.');
    }

    // 3. Create Full-Text Catalog if it does not exist
    console.log('Checking Full-Text Catalog...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ftCatalog')
      BEGIN
          CREATE FULLTEXT CATALOG ftCatalog AS DEFAULT;
          PRINT 'Full-Text Catalog "ftCatalog" created.';
      END
      ELSE
      BEGIN
          PRINT 'Full-Text Catalog "ftCatalog" already exists.';
      END
    `);

    // 4. Define target tables and columns for FTS
    const targets = [
      { table: 'transactions', columns: ['category', 'note'] },
      { table: 'categories', columns: ['name'] },
      { table: 'budgets', columns: ['categoryName'] },
      { table: 'goals', columns: ['name', 'description'] },
      { table: 'debts', columns: ['personName', 'description'] }
    ];

    for (const target of targets) {
      console.log(`Processing table: ${target.table}...`);

      // Find the primary key index/constraint name
      const [pkIndex] = await sequelize.query(`
        SELECT name FROM sys.indexes 
        WHERE is_primary_key = 1 AND object_id = OBJECT_ID('${target.table}')
      `);

      if (!pkIndex || pkIndex.length === 0) {
        console.error(`❌ ERROR: Could not find primary key index for table "${target.table}". Skipping FTS index creation.`);
        continue;
      }

      const pkName = pkIndex[0].name;
      console.log(`Found Primary Key Index: "${pkName}"`);

      // Check if full-text index already exists on this table.
      // If it exists, drop it to ensure we recreate it with current columns.
      const [ftIndexExists] = await sequelize.query(`
        SELECT 1 FROM sys.fulltext_indexes 
        WHERE object_id = OBJECT_ID('${target.table}')
      `);

      if (ftIndexExists && ftIndexExists.length > 0) {
        console.log(`FTS index already exists on "${target.table}". Dropping to recreate...`);
        await sequelize.query(`DROP FULLTEXT INDEX ON ${target.table}`);
      }

      // Create the FTS index
      const columnsList = target.columns.join(', ');
      console.log(`Creating Full-Text Index on ${target.table}(${columnsList})...`);
      await sequelize.query(`
        CREATE FULLTEXT INDEX ON ${target.table} (${columnsList})
        KEY INDEX ${pkName}
        ON ftCatalog
        WITH CHANGE_TRACKING AUTO;
      `);
      console.log(`✅ Full-Text Index created on table "${target.table}".`);
    }

    console.log('🎉 Full-Text Search setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up Full-Text Search:', error);
  } finally {
    await sequelize.close();
  }
}

setupFullTextIndexes();
