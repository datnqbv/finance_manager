import { sequelize, initModels, User, Wallet, Transaction } from '../src/models/sequelize/index.js';
import { DataTypes } from 'sequelize';

async function migrateWallets() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected.');

    // Initialize associations
    initModels();

    // Dynamically check and add columns to transactions table if they do not exist
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('transactions');
    
    if (!tableInfo.walletId) {
      console.log('Adding walletId column to transactions table...');
      await queryInterface.addColumn('transactions', 'walletId', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }
    
    if (!tableInfo.toWalletId) {
      console.log('Adding toWalletId column to transactions table...');
      await queryInterface.addColumn('transactions', 'toWalletId', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }

    // Synchronize models (this will create 'wallets' table and columns if not exist)
    console.log('Synchronizing database schema (creating wallets table and columns if not exist)...');
    await sequelize.sync();
    console.log('Database synced.');

    // Drop outdated CHECK constraint on 'type' in SQL Server if it restricts to ('income', 'expense')
    const dialect = sequelize.getDialect();
    if (dialect === 'mssql') {
      console.log('Checking for old CHECK constraints on transactions.type column...');
      const [results] = await sequelize.query(`
        SELECT cc.name AS constraint_name
        FROM sys.check_constraints cc
        INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
        INNER JOIN sys.tables t ON t.object_id = cc.parent_object_id
        WHERE t.name = 'transactions' AND c.name = 'type';
      `);

      for (const row of results) {
        const constraintName = row.constraint_name;
        if (constraintName.startsWith('CK__transactio')) {
          console.log(`Dropping old check constraint: ${constraintName}...`);
          await sequelize.query(`ALTER TABLE [transactions] DROP CONSTRAINT [${constraintName}];`);
        }
      }

      const hasNewConstraint = results.some(r => r.constraint_name === 'CK_transactions_type');
      if (!hasNewConstraint) {
        console.log('Adding new CHECK constraint allowing (income, expense, transfer)...');
        await sequelize.query(`
          ALTER TABLE [transactions] 
          ADD CONSTRAINT [CK_transactions_type] CHECK (type IN ('income', 'expense', 'transfer'));
        `);
      }
    }

    // 1. Fetch all users
    console.log('Fetching users...');
    const users = await User.findAll();
    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      console.log(`Migrating wallets for user: ${user.name} (${user.email})...`);

      // 2. Check or create default wallet "Ví chính"
      const [wallet, created] = await Wallet.findOrCreate({
        where: { userId: user.id, name: 'Ví chính' },
        defaults: {
          isDefault: true,
          icon: '💼',
          color: '#3B82F6',
          balance: 0,
          initialBalance: 0
        }
      });

      if (created) {
        console.log(`Created default wallet "Ví chính" for user.`);
      } else {
        console.log(`Default wallet "Ví chính" already exists.`);
      }

      // 3. Fetch all transactions of this user that do not have a walletId
      const txs = await Transaction.findAll({
        where: {
          userId: user.id,
          walletId: null
        }
      });

      if (txs.length > 0) {
        console.log(`Found ${txs.length} transactions without a wallet. Linking to "Ví chính"...`);
        for (const tx of txs) {
          tx.walletId = wallet.id;
          await tx.save();
        }
        console.log('Linked all transactions.');
      } else {
        console.log('No unlinked transactions found.');
      }

      // 4. Calculate actual balance from transaction history
      const allTxs = await Transaction.findAll({
        where: {
          userId: user.id,
          walletId: wallet.id
        }
      });

      let netBalance = 0;
      for (const tx of allTxs) {
        const amt = parseFloat(tx.amount || 0);
        if (tx.type === 'income') {
          netBalance += amt;
        } else if (tx.type === 'expense') {
          netBalance -= amt;
        }
        // transfer does not affect total balance of a single wallet if it was to itself, 
        // but normally transfers have fromWallet and toWallet.
      }

      wallet.balance = netBalance;
      await wallet.save();
      console.log(`Updated wallet "${wallet.name}" balance to: ${netBalance.toLocaleString('vi-VN')} ₫`);
    }

    console.log('🎉 Wallet migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during wallet migration:', error);
  } finally {
    await sequelize.close();
  }
}

migrateWallets();
