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

    // 3.5 Create Vietnamese Accents Removal Function (we will drop it and rebuild it along with dependencies below)
    // 4. Define target tables and columns for FTS
    const targets = [
      { table: 'transactions', columns: ['category', 'note'] },
      { table: 'categories', columns: ['name'] },
      { table: 'budgets', columns: ['categoryName'] },
      { table: 'goals', columns: ['name', 'description'] },
      { table: 'debts', columns: ['personName', 'description'] }
    ];

    // 4.1 Drop existing FTS indexes and computed columns to resolve dependency chain before function re-creation
    console.log('Cleaning up existing FTS indexes and computed columns to prepare for function update...');
    for (const target of targets) {
      // Check and drop FTS index
      const [ftIndexExists] = await sequelize.query(`
        SELECT 1 FROM sys.fulltext_indexes 
        WHERE object_id = OBJECT_ID('${target.table}')
      `);
      if (ftIndexExists && ftIndexExists.length > 0) {
        console.log(`Dropping FTS index on table "${target.table}"...`);
        await sequelize.query(`DROP FULLTEXT INDEX ON ${target.table}`);
      }

      // Drop computed columns
      for (const col of target.columns) {
        const computedColName = `${col}_no_accent`;
        const [colExists] = await sequelize.query(`
          SELECT 1 FROM sys.columns 
          WHERE object_id = OBJECT_ID('${target.table}') AND name = '${computedColName}'
        `);
        if (colExists && colExists.length > 0) {
          console.log(`Dropping computed column "${computedColName}" from table "${target.table}"...`);
          await sequelize.query(`ALTER TABLE ${target.table} DROP COLUMN ${computedColName}`);
        }
      }
    }

    // 4.2 Drop the old function if it exists
    console.log('Dropping old accentless function to apply new correct mapping...');
    await sequelize.query(`
      IF OBJECT_ID('dbo.ufn_remove_vietnamese_accents', 'FN') IS NOT NULL
      BEGIN
          DROP FUNCTION dbo.ufn_remove_vietnamese_accents;
      END
    `);

    // 4.3 Create the function with correct alignment (no mid-string 'd'/'D' typos)
    console.log('Creating Vietnamese accents removal function with correct mappings...');
    await sequelize.query(`
      EXEC('
      CREATE FUNCTION dbo.ufn_remove_vietnamese_accents(@str NVARCHAR(MAX))
      RETURNS NVARCHAR(MAX)
      WITH SCHEMABINDING
      AS
      BEGIN
          IF @str IS NULL RETURN NULL
          
          DECLARE @sign_chars NVARCHAR(256)
          DECLARE @unsign_chars NVARCHAR(256)
          
          SET @sign_chars = N''áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ''
          SET @unsign_chars = N''aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD''
          
          DECLARE @counter INT = 1
          DECLARE @len INT = LEN(@str)
          WHILE @counter <= @len
          BEGIN
              DECLARE @char NCHAR(1) = SUBSTRING(@str, @counter, 1)
              DECLARE @idx INT = CHARINDEX(@char, @sign_chars COLLATE Latin1_General_BIN)
              IF @idx > 0
              BEGIN
                  SET @str = STUFF(@str, @counter, 1, SUBSTRING(@unsign_chars, @idx, 1))
              END
              SET @counter = @counter + 1
          END
          RETURN @str
      END
      ');
    `);
    console.log('✅ Corrected accentless function created.');

    // 4.4 Re-create computed columns and FTS indexes
    console.log('Re-creating computed columns and FTS indexes...');
    for (const target of targets) {
      console.log(`Processing table: ${target.table}...`);

      // Create PERSISTED computed columns
      for (const col of target.columns) {
        const computedColName = `${col}_no_accent`;
        console.log(`Creating computed column ${computedColName} on ${target.table}...`);
        await sequelize.query(`
          ALTER TABLE ${target.table} ADD ${computedColName} AS dbo.ufn_remove_vietnamese_accents(${col}) PERSISTED;
        `);
      }

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

      // Create the FTS index (includes both original columns and unaccented computed columns)
      const ftsColumns = [...target.columns, ...target.columns.map(c => `${c}_no_accent`)];
      const columnsList = ftsColumns.join(', ');
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
