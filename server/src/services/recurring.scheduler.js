import { RecurringTransaction, Transaction, Wallet, Notification, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import { recalculateWalletBalance } from '../controllers/wallet.controller.js';
import { checkBudgetAndNotify } from '../controllers/transaction.controller.js';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getNextDateString = (currentDateStr, frequency) => {
  const next = parseLocalDate(currentDateStr);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return getLocalDateString(next);
};

export const executeRecurringTransactions = async () => {
  const transaction = await sequelize.transaction();
  try {
    const todayStr = getLocalDateString();

    // Find all active recurring transactions where nextExecutionDate is today or in the past
    const recurringList = await RecurringTransaction.findAll({
      where: {
        isActive: true,
        nextExecutionDate: {
          [Op.lte]: todayStr
        }
      },
      transaction
    });

    if (recurringList.length === 0) {
      await transaction.commit();
      return;
    }

    console.log(`🔄 [Recurring Scheduler] Found ${recurringList.length} recurring rules due for execution.`);

    for (const rec of recurringList) {
      let nextDateStr = rec.nextExecutionDate;
      let executedCount = 0;

      // Catch up missed execution dates (in case server was offline)
      while (nextDateStr <= todayStr) {
        // Create the transaction
        await Transaction.create({
          userId: rec.userId,
          type: rec.type,
          walletId: rec.walletId,
          toWalletId: rec.toWalletId,
          category: rec.category,
          amount: rec.amount,
          note: rec.note || `Giao dịch định kỳ (${rec.frequency})`,
          date: parseLocalDate(nextDateStr) // Set exact execution date
        }, { transaction });

        // Advance nextDate
        nextDateStr = getNextDateString(nextDateStr, rec.frequency);
        executedCount++;

        // Deactivate if end date is reached
        if (rec.endDate && nextDateStr > rec.endDate) {
          rec.isActive = false;
          break;
        }
      }

      if (executedCount > 0) {
        rec.nextExecutionDate = nextDateStr;
        rec.lastExecutedAt = new Date();
        await rec.save({ transaction });

        // Recalculate balances
        await recalculateWalletBalance(rec.walletId, { transaction });
        if (rec.type === 'transfer' && rec.toWalletId) {
          await recalculateWalletBalance(rec.toWalletId, { transaction });
        }

        // Budget warnings check for expenses
        if (rec.type === 'expense') {
          // Trigger budget alerts in the background
          checkBudgetAndNotify(rec.userId, rec.category, new Date()).catch(err => {
            console.error('Error running budget alerts from scheduler:', err);
          });
        }

        // Create execution notification
        const freqText = {
          daily: 'hàng ngày',
          weekly: 'hàng tuần',
          monthly: 'hàng tháng',
          yearly: 'hàng năm'
        }[rec.frequency] || rec.frequency;

        await Notification.create({
          userId: rec.userId,
          type: 'info',
          title: '🔄 Giao dịch định kỳ',
          message: `Hệ thống đã tự động tạo ${executedCount} giao dịch "${rec.category}" theo lịch ${freqText}.`,
          read: false
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log(`✅ [Recurring Scheduler] Processing completed successfully.`);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ [Recurring Scheduler] Execution failed:', error);
  }
};

export const startRecurringTransactionScheduler = () => {
  // Run immediately on server start
  executeRecurringTransactions();

  // Repeat every 30 minutes
  setInterval(executeRecurringTransactions, 1800000);
  console.log('🔄 [Scheduler] Registered recurring transaction check (every 30m).');
};
