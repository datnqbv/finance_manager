import { sequelize } from '../src/models/sequelize/index.js';

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected.');

    const dialect = sequelize.getDialect();
    console.log(`Current database dialect: ${dialect}`);

    if (dialect === 'mssql') {
      console.log('Finding CHECK constraints on column "type" of "transactions" table...');
      const [results] = await sequelize.query(`
        SELECT cc.name AS constraint_name
        FROM sys.check_constraints cc
        INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
        INNER JOIN sys.tables t ON t.object_id = cc.parent_object_id
        WHERE t.name = 'transactions' AND c.name = 'type';
      `);

      console.log(`Found ${results.length} constraint(s).`);
      for (const row of results) {
        const constraintName = row.constraint_name;
        console.log(`Dropping constraint: ${constraintName}...`);
        await sequelize.query(`ALTER TABLE [transactions] DROP CONSTRAINT [${constraintName}];`);
        console.log('Dropped.');
      }

      console.log('Adding new CHECK constraint allowing (income, expense, transfer)...');
      await sequelize.query(`
        ALTER TABLE [transactions] 
        ADD CONSTRAINT [CK_transactions_type] CHECK (type IN ('income', 'expense', 'transfer'));
      `);
      console.log('Successfully added new CHECK constraint.');
    } else {
      console.log('Not using SQL Server. No check constraint migration needed.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

run();
