import cron from 'node-cron';
import RecurringTransaction from '../models/RecurringTransaction.model.js';
import Transaction from '../models/Transaction.model.js';
import Notification from '../models/Notification.model.js';

/**
 * Tự động thực thi các giao dịch định kỳ đến hạn.
 * Chạy mỗi giờ một lần.
 */
const executeRecurringTransactions = async () => {
  try {
    const now = new Date();

    // Lấy tất cả recurring đang active và đến hạn thực thi
    const pending = await RecurringTransaction.find({
      isActive: true,
      nextExecution: { $lte: now },
    });

    if (pending.length === 0) return;

    console.log(`[Cron] Tìm thấy ${pending.length} giao dịch định kỳ cần thực hiện`);

    let successCount = 0;

    for (const recurring of pending) {
      if (!recurring.shouldExecute()) continue;

      try {
        // Tạo giao dịch thực tế
        await Transaction.create({
          userId: recurring.userId,
          type: recurring.type,
          category: recurring.category,
          amount: recurring.amount,
          note: `${recurring.note || ''} (Tự động - ${recurring.templateName})`.trim(),
          date: now,
        });

        // Cập nhật thông tin recurring
        recurring.executedCount += 1;
        recurring.lastExecuted = now;
        recurring.nextExecution = recurring.calculateNextExecution();

        // Vô hiệu hóa nếu hết hạn hoặc đủ số lần
        if (recurring.endDate && now >= new Date(recurring.endDate)) {
          recurring.isActive = false;
        }
        if (recurring.occurrences !== null && recurring.executedCount >= recurring.occurrences) {
          recurring.isActive = false;
        }

        await recurring.save();

        // Tạo thông báo cho user
        await Notification.create({
          userId: recurring.userId,
          type: 'info',
          title: '🔄 Giao dịch định kỳ đã thực hiện',
          message: `"${recurring.templateName}" - ${recurring.type === 'income' ? '+' : '-'}${recurring.amount.toLocaleString('vi-VN')} ₫`,
          relatedId: recurring._id,
          relatedModel: 'RecurringTransaction',
          read: false,
          metadata: {
            recurringId: recurring._id.toString(),
            amount: recurring.amount,
            type: recurring.type,
          },
        });

        successCount++;
      } catch (err) {
        console.error(`[Cron] Lỗi thực thi recurring ${recurring._id}:`, err.message);
      }
    }

    console.log(`[Cron] Hoàn tất: ${successCount}/${pending.length} giao dịch định kỳ`);
  } catch (err) {
    console.error('[Cron] Lỗi khi chạy cron job recurring:', err.message);
  }
};

/**
 * Gửi thông báo nhắc nhở trước khi giao dịch định kỳ đến hạn.
 * Chạy mỗi ngày lúc 8:00 sáng.
 */
const notifyUpcomingRecurring = async () => {
  try {
    const now = new Date();

    // Lấy các recurring có notifyBeforeExecution = true
    const upcoming = await RecurringTransaction.find({
      isActive: true,
      notifyBeforeExecution: true,
    });

    for (const recurring of upcoming) {
      if (!recurring.nextExecution) continue;

      const daysUntil = Math.ceil(
        (new Date(recurring.nextExecution) - now) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil === (recurring.notifyDays || 1)) {
        // Kiểm tra tránh gửi thông báo 2 lần trong 1 ngày
        const recentNotif = await Notification.findOne({
          userId: recurring.userId,
          'metadata.recurringId': recurring._id.toString(),
          'metadata.notifyType': 'upcoming',
          createdAt: { $gte: new Date(Date.now() - 20 * 60 * 60 * 1000) },
        });

        if (!recentNotif) {
          await Notification.create({
            userId: recurring.userId,
            type: 'warning',
            title: '⏰ Nhắc nhở giao dịch định kỳ',
            message: `"${recurring.templateName}" sẽ thực hiện sau ${daysUntil} ngày (${recurring.amount.toLocaleString('vi-VN')} ₫)`,
            relatedId: recurring._id,
            relatedModel: 'RecurringTransaction',
            read: false,
            metadata: {
              recurringId: recurring._id.toString(),
              notifyType: 'upcoming',
              daysUntil,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('[Cron] Lỗi khi gửi thông báo nhắc nhở:', err.message);
  }
};

/**
 * Khởi động tất cả cron jobs.
 */
export const startCronJobs = () => {
  // Chạy mỗi giờ: kiểm tra và thực thi giao dịch định kỳ đến hạn
  cron.schedule('0 * * * *', executeRecurringTransactions, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  // Chạy mỗi ngày lúc 8:00 sáng: gửi thông báo nhắc nhở
  cron.schedule('0 8 * * *', notifyUpcomingRecurring, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log('✅ Cron jobs đã khởi động:');
  console.log('   - Thực thi giao dịch định kỳ: mỗi giờ');
  console.log('   - Thông báo nhắc nhở: mỗi ngày lúc 8:00');
};
